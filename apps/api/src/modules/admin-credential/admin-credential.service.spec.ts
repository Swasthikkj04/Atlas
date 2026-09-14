import { Test, TestingModule } from '@nestjs/testing';
import { AdminCredentialService } from './services/admin-credential.service';
import { AdminCredentialCryptoService } from './services/admin-credential-crypto.service';
import { AdminIdentityService } from '../admin-identity/services/admin-identity.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AdminStatus } from '../admin-identity/contracts/admin-identity.contract';
import {
  AdminCredentialType,
  AdminCredentialStatus,
  AdminCredentialFailureCategory,
  ADMIN_CREDENTIAL_POLICY,
} from './contracts/admin-credential.contract';
import { AdminCredentialPolicyViolationException } from './exceptions/admin-credential.exception';

describe('ADMIN-002: AdminCredentialService & Verification Invariants', () => {
  let service: AdminCredentialService;
  let cryptoService: AdminCredentialCryptoService;
  let adminIdentityServiceMock: any;
  let prismaMock: any;

  const mockAdminIdentity = {
    id: 'adm-00000001',
    identifier: 'platform-owner',
    status: AdminStatus.ACTIVE,
  };

  const mockCredentialRecord = {
    id: 'cred-00000001',
    adminId: 'adm-00000001',
    type: 'PRIMARY_PASSWORD',
    verifierHash: '$argon2id$v=19$m=65536,t=3,p=4$realhashvalue',
    status: 'ACTIVE',
    version: 1,
    failedAttempts: 0,
    lockedUntil: null,
    lastUsedAt: null,
    revokedAt: null,
    revokedReason: null,
    metadata: null,
    createdAt: new Date('2026-08-20T00:00:00Z'),
    updatedAt: new Date('2026-08-20T00:00:00Z'),
  };

  beforeEach(async () => {
    prismaMock = {
      adminIdentity: {
        findUnique: jest.fn(),
      },
      adminCredential: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    adminIdentityServiceMock = {
      validateAuthenticationEligibility: jest
        .fn()
        .mockResolvedValue(mockAdminIdentity),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCredentialService,
        AdminCredentialCryptoService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AdminIdentityService, useValue: adminIdentityServiceMock },
      ],
    }).compile();

    service = module.get<AdminCredentialService>(AdminCredentialService);
    cryptoService = module.get<AdminCredentialCryptoService>(
      AdminCredentialCryptoService,
    );
  });

  describe('1. Primary Credential Enrollment', () => {
    it('successfully enrolls a strong primary password credential using Argon2id', async () => {
      prismaMock.adminCredential.findFirst.mockResolvedValue(null);
      prismaMock.adminCredential.create.mockResolvedValue(mockCredentialRecord);

      const strongPassword = 'V3ry$ecureP@ssw0rd!LongEnough';
      const result = await service.enrollPrimaryCredential(
        mockAdminIdentity.id,
        {
          password: strongPassword,
        },
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(mockCredentialRecord.id);
      expect(result.type).toBe(AdminCredentialType.PRIMARY_PASSWORD);
      expect(result.status).toBe(AdminCredentialStatus.ACTIVE);
      expect(result.version).toBe(1);

      expect(prismaMock.adminCredential.create).toHaveBeenCalledWith({
        data: {
          adminId: mockAdminIdentity.id,
          type: AdminCredentialType.PRIMARY_PASSWORD,
          verifierHash: expect.stringMatching(/^\$argon2id\$/),
          status: AdminCredentialStatus.ACTIVE,
          version: 1,
          failedAttempts: 0,
        },
      });
    });

    it('supersedes and revokes older credential version when a new primary password is enrolled', async () => {
      const existingVersion1 = {
        ...mockCredentialRecord,
        id: 'cred-v1',
        version: 1,
        status: 'ACTIVE',
      };
      prismaMock.adminCredential.findFirst.mockResolvedValue(existingVersion1);
      prismaMock.adminCredential.update.mockResolvedValue({
        ...existingVersion1,
        status: 'REVOKED',
      });
      prismaMock.adminCredential.create.mockResolvedValue({
        ...mockCredentialRecord,
        id: 'cred-v2',
        version: 2,
      });

      const result = await service.enrollPrimaryCredential(
        mockAdminIdentity.id,
        {
          password: 'NewV3ry$ecureP@ssw0rd!2026',
        },
      );

      expect(result.version).toBe(2);
      expect(prismaMock.adminCredential.update).toHaveBeenCalledWith({
        where: { id: 'cred-v1' },
        data: {
          status: AdminCredentialStatus.REVOKED,
          revokedAt: expect.any(Date),
          revokedReason: 'Superseded by credential version 2',
        },
      });
    });

    it('rejects passwords shorter than 16 characters or missing complexity', async () => {
      await expect(
        service.enrollPrimaryCredential(mockAdminIdentity.id, {
          password: 'Short1!',
        }),
      ).rejects.toThrow(AdminCredentialPolicyViolationException);

      await expect(
        service.enrollPrimaryCredential(mockAdminIdentity.id, {
          password: 'alllowercasepasswordwithoutdigits',
        }),
      ).rejects.toThrow(AdminCredentialPolicyViolationException);
    });
  });

  describe('2. Authoritative Server-Side Verification & Timing Protection', () => {
    it('successfully verifies valid credentials, resets counters, and records lastUsedAt', async () => {
      const validPassword = 'V3ry$ecureP@ssw0rd!LongEnough';
      const realHash = await cryptoService.hashPrimaryPassword(validPassword);

      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminCredential.findFirst.mockResolvedValue({
        ...mockCredentialRecord,
        verifierHash: realHash,
      });
      prismaMock.adminCredential.update.mockResolvedValue({
        ...mockCredentialRecord,
        failedAttempts: 0,
        lastUsedAt: new Date(),
      });

      const result = await service.verifyPrimaryCredential({
        identifier: 'platform-owner',
        password: validPassword,
      });

      expect(result.success).toBe(true);
      expect(result.credentialId).toBe(mockCredentialRecord.id);
      expect(prismaMock.adminCredential.update).toHaveBeenCalledWith({
        where: { id: mockCredentialRecord.id },
        data: {
          failedAttempts: 0,
          lockedUntil: null,
          lastUsedAt: expect.any(Date),
        },
      });
    });

    it('handles incorrect password by incrementing failed attempts', async () => {
      const realHash = await cryptoService.hashPrimaryPassword(
        'V3ry$ecureP@ssw0rd!LongEnough',
      );

      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminCredential.findFirst.mockResolvedValue({
        ...mockCredentialRecord,
        verifierHash: realHash,
        failedAttempts: 1,
      });
      prismaMock.adminCredential.update.mockResolvedValue({
        ...mockCredentialRecord,
        failedAttempts: 2,
      });

      const result = await service.verifyPrimaryCredential({
        identifier: 'platform-owner',
        password: 'WrongPassword12345!',
      });

      expect(result.success).toBe(false);
      expect(result.failureCategory).toBe(
        AdminCredentialFailureCategory.INVALID_CREDENTIALS,
      );
      expect(result.remainingAttempts).toBe(3); // 5 - 2 = 3
      expect(prismaMock.adminCredential.update).toHaveBeenCalledWith({
        where: { id: mockCredentialRecord.id },
        data: {
          failedAttempts: 2,
          lockedUntil: null,
        },
      });
    });

    it('locks credential on 5th consecutive failed attempt for 15 minutes', async () => {
      const realHash = await cryptoService.hashPrimaryPassword(
        'V3ry$ecureP@ssw0rd!LongEnough',
      );

      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminCredential.findFirst.mockResolvedValue({
        ...mockCredentialRecord,
        verifierHash: realHash,
        failedAttempts: 4, // 4 existing failures + 1 = 5 (triggers lock)
      });
      prismaMock.adminCredential.update.mockResolvedValue({
        ...mockCredentialRecord,
        failedAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      });

      const result = await service.verifyPrimaryCredential({
        identifier: 'platform-owner',
        password: 'WrongPassword12345!',
      });

      expect(result.success).toBe(false);
      expect(result.failureCategory).toBe(
        AdminCredentialFailureCategory.CREDENTIAL_LOCKED,
      );
      expect(result.lockedUntil).toBeDefined();
      expect(result.remainingAttempts).toBe(0);
      expect(prismaMock.adminCredential.update).toHaveBeenCalledWith({
        where: { id: mockCredentialRecord.id },
        data: {
          failedAttempts: 5,
          lockedUntil: expect.any(Date),
        },
      });
    });

    it('rejects verification when credential is actively locked', async () => {
      const activeLock = new Date(Date.now() + 10 * 60 * 1000);

      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminCredential.findFirst.mockResolvedValue({
        ...mockCredentialRecord,
        lockedUntil: activeLock,
      });

      const result = await service.verifyPrimaryCredential({
        identifier: 'platform-owner',
        password: 'AnyPassword12345!',
      });

      expect(result.success).toBe(false);
      expect(result.failureCategory).toBe(
        AdminCredentialFailureCategory.CREDENTIAL_LOCKED,
      );
      expect(result.lockedUntil).toEqual(activeLock);
      expect(result.remainingAttempts).toBe(0);
    });
  });

  describe('3. Fail-Closed Invariants on State Boundaries', () => {
    it('fails closed when credential is DISABLED', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminCredential.findFirst.mockResolvedValue({
        ...mockCredentialRecord,
        status: 'DISABLED',
      });

      const result = await service.verifyPrimaryCredential({
        identifier: 'platform-owner',
        password: 'AnyPassword12345!',
      });

      expect(result.success).toBe(false);
      expect(result.failureCategory).toBe(
        AdminCredentialFailureCategory.CREDENTIAL_DISABLED,
      );
    });

    it('fails closed when credential is REVOKED', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminCredential.findFirst.mockResolvedValue({
        ...mockCredentialRecord,
        status: 'REVOKED',
      });

      const result = await service.verifyPrimaryCredential({
        identifier: 'platform-owner',
        password: 'AnyPassword12345!',
      });

      expect(result.success).toBe(false);
      expect(result.failureCategory).toBe(
        AdminCredentialFailureCategory.CREDENTIAL_REVOKED,
      );
    });

    it('fails closed when Admin identity is DISABLED', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue({
        ...mockAdminIdentity,
        status: 'DISABLED',
      });

      const result = await service.verifyPrimaryCredential({
        identifier: 'platform-owner',
        password: 'AnyPassword12345!',
      });

      expect(result.success).toBe(false);
      expect(result.failureCategory).toBe(
        AdminCredentialFailureCategory.IDENTITY_DISABLED,
      );
    });

    it('fails closed with constant-time dummy verification when identifier does not exist', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(null);

      const result = await service.verifyPrimaryCredential({
        identifier: 'non-existent-owner',
        password: 'AnyPassword12345!',
      });

      expect(result.success).toBe(false);
      expect(result.failureCategory).toBe(
        AdminCredentialFailureCategory.IDENTITY_NOT_FOUND,
      );
    });
  });

  describe('4. Lifecycle Actions (Disable, Revoke, Unlock)', () => {
    it('disables an Admin credential', async () => {
      prismaMock.adminCredential.update.mockResolvedValue({
        ...mockCredentialRecord,
        status: 'DISABLED',
      });

      const disabled = await service.disableCredential(mockCredentialRecord.id);
      expect(disabled.status).toBe(AdminCredentialStatus.DISABLED);
    });

    it('permanently revokes an Admin credential', async () => {
      prismaMock.adminCredential.update.mockResolvedValue({
        ...mockCredentialRecord,
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedReason: 'Security incident rotation',
      });

      const revoked = await service.revokeCredential(
        mockCredentialRecord.id,
        'Security incident rotation',
      );
      expect(revoked.status).toBe(AdminCredentialStatus.REVOKED);
      expect(revoked.revokedReason).toBe('Security incident rotation');
    });

    it('unlocks an Admin credential by resetting lockout and failed attempts', async () => {
      prismaMock.adminCredential.update.mockResolvedValue({
        ...mockCredentialRecord,
        failedAttempts: 0,
        lockedUntil: null,
      });

      const unlocked = await service.unlockCredential(mockCredentialRecord.id);
      expect(unlocked.failedAttempts).toBe(0);
      expect(unlocked.lockedUntil).toBeNull();
    });
  });
});
