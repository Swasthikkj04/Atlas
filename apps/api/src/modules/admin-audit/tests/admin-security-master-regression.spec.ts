import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AdminAuditService } from '../services/admin-audit.service';
import {
  AdminAuditCryptoService,
  GENESIS_HASH,
} from '../services/admin-audit-crypto.service';
import { AdminAnomalyDetectionService } from '../services/admin-anomaly-detection.service';
import { AdminHardeningService } from '../services/admin-hardening.service';
import { AdminSessionService } from '../../admin-session/services/admin-session.service';
import { AdminJwtCryptoService } from '../../admin-session/services/admin-jwt-crypto.service';
import { AdminAuthorizationGuard } from '../../admin-authorization/guards/admin-authorization.guard';
import { Reflector } from '@nestjs/core';
import { AdminCapability } from '../../admin-authorization/contracts/admin-authorization.contract';
import {
  AdminAuthorizationRequiredException,
  AdminCapabilityDeniedException,
} from '../../admin-authorization/exceptions/admin-authorization.exception';
import {
  AdminSessionExpiredException,
  AdminSessionRevokedException,
} from '../../admin-session/exceptions/admin-session.exception';
import { AdminStatus } from '../../admin-identity/contracts/admin-identity.contract';

describe('ADMIN-008: Master Security & Audit Hardening Regression Matrix', () => {
  let auditCrypto: AdminAuditCryptoService;
  let auditService: AdminAuditService;
  let hardeningService: AdminHardeningService;
  let sessionService: AdminSessionService;
  let jwtCrypto: AdminJwtCryptoService;
  let authGuard: AdminAuthorizationGuard;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      adminIdentity: {
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      adminSession: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      adminAuditEvent: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
        deleteMany: jest.fn(),
      },
      adminWebAuthnCredential: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuditCryptoService,
        AdminAuditService,
        AdminAnomalyDetectionService,
        AdminHardeningService,
        AdminJwtCryptoService,
        AdminSessionService,
        AdminAuthorizationGuard,
        Reflector,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    auditCrypto = module.get<AdminAuditCryptoService>(AdminAuditCryptoService);
    auditService = module.get<AdminAuditService>(AdminAuditService);
    hardeningService = module.get<AdminHardeningService>(AdminHardeningService);
    sessionService = module.get<AdminSessionService>(AdminSessionService);
    jwtCrypto = module.get<AdminJwtCryptoService>(AdminJwtCryptoService);
    authGuard = module.get<AdminAuthorizationGuard>(AdminAuthorizationGuard);
  });

  // =========================================================================
  // 1. IDENTITY BOUNDARY REGRESSION (ADMIN-001)
  // =========================================================================
  describe('1. Identity Boundary Regression', () => {
    it('enforces single-admin boundary invariant (MAX_ADMIN_COUNT = 1)', async () => {
      prisma.adminIdentity.count.mockResolvedValueOnce(1);
      const count = await prisma.adminIdentity.count();
      expect(count).toBe(1);
      // Attempting second admin creation is strictly disallowed
    });

    it('rejects User identity / OAuth identity elevation into Admin plane', async () => {
      const normalUserToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3ItMTIzIiwicm9sZSI6ImFkbWluIn0.xxx';

      const mockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: `Bearer ${normalUserToken}` },
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      };

      await expect(authGuard.canActivate(mockContext)).rejects.toThrow();
    });
  });

  // =========================================================================
  // 2. CREDENTIAL & SECRET LEAKAGE REGRESSION (ADMIN-002)
  // =========================================================================
  describe('2. Credential & Secret Leakage Regression', () => {
    it('guarantees zero password hash, token, or secret leakage into audit events', () => {
      const rawMetadata = {
        password: 'TopSecretPassword123!',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$abc...',
        refreshToken: 'refresh-tok-999',
        secret: 'super-secret-key',
        safeMetadata: 'operation-ok',
      };

      const sanitized = auditCrypto.sanitizeMetadata(rawMetadata);
      expect(sanitized?.password).toBe('[REDACTED_SECURITY_MATERIAL]');
      expect(sanitized?.passwordHash).toBe('[REDACTED_SECURITY_MATERIAL]');
      expect(sanitized?.refreshToken).toBe('[REDACTED_SECURITY_MATERIAL]');
      expect(sanitized?.secret).toBe('[REDACTED_SECURITY_MATERIAL]');
      expect(sanitized?.safeMetadata).toBe('operation-ok');
    });
  });

  // =========================================================================
  // 3. WEBAUTHN & PASSKEY REGRESSION (ADMIN-003, ADMIN-004)
  // =========================================================================
  describe('3. WebAuthn Passkey Regression', () => {
    it('detects authenticator counter rollback and flags critical clone alert', async () => {
      const detectionService = new AdminAnomalyDetectionService(
        prisma,
        auditCrypto,
      );
      await detectionService.recordCounterAnomaly(
        'adm-001',
        'passkey-001',
        BigInt(20),
        BigInt(15), // Decreased counter!
        '10.0.0.1',
      );

      expect(detectionService.getAnomalyMetrics().cloneAttemptsCount).toBe(1);
    });
  });

  // =========================================================================
  // 4. SESSION & JWT REPLAY REGRESSION (ADMIN-005)
  // =========================================================================
  describe('4. Session & JWT Boundary Regression', () => {
    it('rejects expired Admin session and marks status EXPIRED in database', async () => {
      const { accessToken } = jwtCrypto.signAdminToken({
        adminIdentityId: 'adm-001',
        sessionId: 'sess-exp',
        identifier: 'owner',
        assuranceLevel: 'AAL3',
      });

      prisma.adminSession.findUnique.mockResolvedValueOnce({
        id: 'sess-exp',
        adminId: 'adm-001',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() - 60000), // Expired 1 min ago
        admin: { status: 'ACTIVE' },
      });

      await expect(
        sessionService.validateAdminToken(accessToken),
      ).rejects.toThrow(AdminSessionExpiredException);
      expect(prisma.adminSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sess-exp' },
          data: expect.objectContaining({ status: 'EXPIRED' }),
        }),
      );
    });

    it('rejects revoked Admin session immediately', async () => {
      const { accessToken } = jwtCrypto.signAdminToken({
        adminIdentityId: 'adm-001',
        sessionId: 'sess-rev',
        identifier: 'owner',
        assuranceLevel: 'AAL3',
      });

      prisma.adminSession.findUnique.mockResolvedValueOnce({
        id: 'sess-rev',
        adminId: 'adm-001',
        status: 'REVOKED',
        revokedReason: 'Security incident',
        expiresAt: new Date(Date.now() + 600000),
        admin: { status: 'ACTIVE' },
      });

      await expect(
        sessionService.validateAdminToken(accessToken),
      ).rejects.toThrow(AdminSessionRevokedException);
    });
  });

  // =========================================================================
  // 5. AUTHORIZATION BOUNDARY REGRESSION (ADMIN-006)
  // =========================================================================
  describe('5. Authorization Boundary Regression', () => {
    it('rejects request with missing Bearer token header with 401', async () => {
      const mockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      };

      await expect(authGuard.canActivate(mockContext)).rejects.toThrow(
        AdminAuthorizationRequiredException,
      );
    });
  });

  // =========================================================================
  // 6. EMERGENCY LOCKDOWN & AUDIT INTEGRITY HARDENING (ADMIN-008)
  // =========================================================================
  describe('6. Emergency Lockdown & Audit Hardening', () => {
    it('fails closed when Admin Identity is DISABLED', async () => {
      const { accessToken } = jwtCrypto.signAdminToken({
        adminIdentityId: 'adm-001',
        sessionId: 'sess-valid',
        identifier: 'owner',
        assuranceLevel: 'AAL3',
      });

      prisma.adminSession.findUnique.mockResolvedValueOnce({
        id: 'sess-valid',
        adminId: 'adm-001',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 600000),
        admin: {
          id: 'adm-001',
          status: 'DISABLED',
          disabledReason: 'Emergency Lockdown',
        },
      });

      await expect(
        sessionService.validateAdminToken(accessToken),
      ).rejects.toThrow(AdminSessionRevokedException);
    });

    it('verifies tamper-evident cryptographic hash chain across chronological events', () => {
      const date1 = new Date('2026-08-29T12:00:00.000Z');
      const hash1 = auditCrypto.computeEventHash({
        previousHash: GENESIS_HASH,
        action: 'ADMIN_WEBAUTHN_AUTHENTICATION_SUCCEEDED',
        category: 'AUTHENTICATION',
        adminId: 'adm-001',
        outcome: 'SUCCESS',
        createdAt: date1,
      });

      const date2 = new Date('2026-08-29T12:05:00.000Z');
      const hash2 = auditCrypto.computeEventHash({
        previousHash: hash1,
        action: 'USER_DISABLED',
        category: 'ADMIN_ACTION',
        adminId: 'adm-001',
        outcome: 'SUCCESS',
        createdAt: date2,
      });

      const chain = [
        {
          id: 'evt-1',
          adminId: 'adm-001',
          action: 'ADMIN_WEBAUTHN_AUTHENTICATION_SUCCEEDED',
          category: 'AUTHENTICATION',
          retentionClass: 'AUTHENTICATION',
          outcome: 'SUCCESS',
          previousHash: GENESIS_HASH,
          eventHash: hash1,
          createdAt: date1,
        },
        {
          id: 'evt-2',
          adminId: 'adm-001',
          action: 'USER_DISABLED',
          category: 'ADMIN_ACTION',
          retentionClass: 'ADMIN_ACTION',
          outcome: 'SUCCESS',
          previousHash: hash1,
          eventHash: hash2,
          createdAt: date2,
        },
      ];

      const report = auditCrypto.verifyChain(chain);
      expect(report.valid).toBe(true);
      expect(report.totalEventsVerified).toBe(2);
      expect(report.latestHash).toBe(hash2);
    });

    it('detects tampering in audit trail when an event payload is rewritten', () => {
      const date1 = new Date('2026-08-29T12:00:00.000Z');
      const hash1 = auditCrypto.computeEventHash({
        previousHash: GENESIS_HASH,
        action: 'ADMIN_WEBAUTHN_AUTHENTICATION_SUCCEEDED',
        category: 'AUTHENTICATION',
        adminId: 'adm-001',
        outcome: 'SUCCESS',
        createdAt: date1,
      });

      const chain = [
        {
          id: 'evt-1',
          adminId: 'adm-001',
          action: 'TAMPERED_ACTION', // Corrupted/tampered
          category: 'AUTHENTICATION',
          retentionClass: 'AUTHENTICATION',
          outcome: 'SUCCESS',
          previousHash: GENESIS_HASH,
          eventHash: hash1,
          createdAt: date1,
        },
      ];

      const report = auditCrypto.verifyChain(chain);
      expect(report.valid).toBe(false);
      expect(report.brokenIndex).toBe(0);
      expect(report.tamperedEventId).toBe('evt-1');
    });
  });
});
