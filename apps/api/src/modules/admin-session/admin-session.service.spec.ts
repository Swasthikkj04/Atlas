import { Test, TestingModule } from '@nestjs/testing';
import { AdminSessionService } from './services/admin-session.service';
import { AdminJwtCryptoService } from './services/admin-jwt-crypto.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AdminStatus } from '../admin-identity/contracts/admin-identity.contract';
import { AuthenticatedAdminResult } from '../admin-webauthn/contracts/admin-webauthn.contract';
import { AdminSessionStatus } from './contracts/admin-session.contract';
import {
  AdminSessionExpiredException,
  AdminSessionNotFoundException,
  AdminSessionRevokedException,
} from './exceptions/admin-session.exception';

describe('ADMIN-005: AdminSessionService Lifecycle & Invariants', () => {
  let service: AdminSessionService;
  let adminJwtCrypto: AdminJwtCryptoService;
  let prismaMock: any;

  const mockAdminIdentity = {
    id: 'adm-00000001',
    identifier: 'platform-owner',
    status: AdminStatus.ACTIVE,
  };

  const mockAuthResult: AuthenticatedAdminResult = {
    authenticated: true,
    adminIdentityId: 'adm-00000001',
    identifier: 'platform-owner',
    credentialId: 'webauthn-cred-1',
    authenticationTime: new Date(),
    assuranceLevel: 'AAL3',
  };

  const mockSessionRecord = {
    id: 'ses-00000001',
    adminId: 'adm-00000001',
    credentialId: 'webauthn-cred-1',
    status: AdminSessionStatus.ACTIVE,
    assuranceLevel: 'AAL3',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
    lastActiveAt: new Date(),
    createdAt: new Date(),
    admin: mockAdminIdentity,
  };

  beforeEach(async () => {
    prismaMock = {
      adminSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSessionService,
        AdminJwtCryptoService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AdminSessionService>(AdminSessionService);
    adminJwtCrypto = module.get<AdminJwtCryptoService>(AdminJwtCryptoService);
  });

  describe('1. Session Creation & Token Issuance', () => {
    it('creates an authoritative AdminSession and returns short-lived Admin JWT', async () => {
      prismaMock.adminSession.create.mockResolvedValue(mockSessionRecord);

      const response = await service.createSession(mockAuthResult, {
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(response.accessToken).toBeDefined();
      expect(response.tokenType).toBe('Bearer');
      expect(response.sessionId).toBe(mockSessionRecord.id);
      expect(response.assuranceLevel).toBe('AAL3');
      expect(response.expiresIn).toBe(900);

      expect(prismaMock.adminSession.create).toHaveBeenCalledWith({
        data: {
          adminId: mockAuthResult.adminIdentityId,
          credentialId: mockAuthResult.credentialId,
          assuranceLevel: 'AAL3',
          status: AdminSessionStatus.ACTIVE,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          expiresAt: expect.any(Date),
        },
      });
    });
  });

  describe('2. Token & Session Validation', () => {
    it('validates active Admin JWT and updates session lastActiveAt', async () => {
      const { accessToken } = adminJwtCrypto.signAdminToken({
        adminIdentityId: mockAdminIdentity.id,
        sessionId: mockSessionRecord.id,
        identifier: mockAdminIdentity.identifier,
      });

      prismaMock.adminSession.findUnique.mockResolvedValue(mockSessionRecord);
      prismaMock.adminSession.update.mockResolvedValue({
        ...mockSessionRecord,
        lastActiveAt: new Date(),
      });

      const context = await service.validateAdminToken(accessToken);

      expect(context.adminId).toBe(mockAdminIdentity.id);
      expect(context.sessionId).toBe(mockSessionRecord.id);
      expect(context.assuranceLevel).toBe('AAL3');

      expect(prismaMock.adminSession.update).toHaveBeenCalledWith({
        where: { id: mockSessionRecord.id },
        data: { lastActiveAt: expect.any(Date) },
      });
    });

    it('validates active Admin JWT with clientContext (IP & User-Agent) and updates lastActiveAt', async () => {
      const { accessToken } = adminJwtCrypto.signAdminToken({
        adminIdentityId: mockAdminIdentity.id,
        sessionId: mockSessionRecord.id,
        identifier: mockAdminIdentity.identifier,
      });

      prismaMock.adminSession.findUnique.mockResolvedValue(mockSessionRecord);
      prismaMock.adminSession.update.mockResolvedValue({
        ...mockSessionRecord,
        lastActiveAt: new Date(),
      });

      const context = await service.validateAdminToken(accessToken, {
        ipAddress: '198.51.100.25',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      });

      expect(context.adminId).toBe(mockAdminIdentity.id);
      expect(context.sessionId).toBe(mockSessionRecord.id);
    });

    it('rejects token when associated session is not found in database', async () => {
      const { accessToken } = adminJwtCrypto.signAdminToken({
        adminIdentityId: mockAdminIdentity.id,
        sessionId: 'deleted-session-id',
        identifier: mockAdminIdentity.identifier,
      });

      prismaMock.adminSession.findUnique.mockResolvedValue(null);

      await expect(service.validateAdminToken(accessToken)).rejects.toThrow(
        AdminSessionNotFoundException,
      );
    });

    it('rejects token when session status is REVOKED', async () => {
      const { accessToken } = adminJwtCrypto.signAdminToken({
        adminIdentityId: mockAdminIdentity.id,
        sessionId: mockSessionRecord.id,
        identifier: mockAdminIdentity.identifier,
      });

      prismaMock.adminSession.findUnique.mockResolvedValue({
        ...mockSessionRecord,
        status: AdminSessionStatus.REVOKED,
        revokedReason: 'Security incident',
      });

      await expect(service.validateAdminToken(accessToken)).rejects.toThrow(
        AdminSessionRevokedException,
      );
    });

    it('rejects token when session status is EXPIRED or past expiresAt', async () => {
      const { accessToken } = adminJwtCrypto.signAdminToken({
        adminIdentityId: mockAdminIdentity.id,
        sessionId: mockSessionRecord.id,
        identifier: mockAdminIdentity.identifier,
      });

      prismaMock.adminSession.findUnique.mockResolvedValue({
        ...mockSessionRecord,
        status: AdminSessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() - 1000), // Expired
      });

      await expect(service.validateAdminToken(accessToken)).rejects.toThrow(
        AdminSessionExpiredException,
      );
    });
  });

  describe('3. Revocation & Logout Operations', () => {
    it('revokes an individual session', async () => {
      prismaMock.adminSession.update.mockResolvedValue({
        ...mockSessionRecord,
        status: AdminSessionStatus.REVOKED,
        revokedAt: new Date(),
        revokedReason: 'Suspicious IP change',
      });

      const revoked = await service.revokeSession(
        'ses-00000001',
        'Suspicious IP change',
      );
      expect(revoked.status).toBe(AdminSessionStatus.REVOKED);
    });

    it('revokes all active sessions for Admin identity', async () => {
      prismaMock.adminSession.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.revokeAllAdminSessions(
        'adm-00000001',
        'Emergency revocation',
      );
      expect(result.revokedCount).toBe(3);
    });

    it('performs explicit logout by revoking the session', async () => {
      prismaMock.adminSession.update.mockResolvedValue({
        ...mockSessionRecord,
        status: AdminSessionStatus.REVOKED,
        revokedReason: 'Admin explicit logout',
      });

      await expect(service.logout('ses-00000001')).resolves.not.toThrow();
    });
  });
});
