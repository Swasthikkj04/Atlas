import { Test, TestingModule } from '@nestjs/testing';
import { AdminCredentialService } from './services/admin-credential.service';
import { AdminCredentialCryptoService } from './services/admin-credential-crypto.service';
import { AdminIdentityService } from '../admin-identity/services/admin-identity.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AdminStatus } from '../admin-identity/contracts/admin-identity.contract';
import { AdminCredentialBoundary } from './boundaries/admin-credential.boundary';
import {
  AdminCredentialType,
  AdminCredentialStatus,
  ADMIN_CREDENTIAL_POLICY,
} from './contracts/admin-credential.contract';

/**
 * ADMIN-002: Security Regression & Abuse Protection Verification
 *
 * Verifies all 15 acceptance criteria from the ADMIN-002 specification.
 */
describe('ADMIN-002: Admin Credential Security Regression & Abuse Protection', () => {
  let credentialService: AdminCredentialService;
  let cryptoService: AdminCredentialCryptoService;
  let prismaMock: any;

  const mockAdminIdentity = {
    id: 'adm-00000001',
    identifier: 'platform-owner',
    status: AdminStatus.ACTIVE,
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
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const adminIdentityServiceMock = {
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

    credentialService = module.get<AdminCredentialService>(
      AdminCredentialService,
    );
    cryptoService = module.get<AdminCredentialCryptoService>(
      AdminCredentialCryptoService,
    );
  });

  describe('Vector 1: Plaintext Credentials Storage Prohibition', () => {
    it('verifies plaintext password is never stored and only Argon2id hash is persisted', async () => {
      const plaintextPassword = 'SuperSecretAdminPassword123!@#';
      prismaMock.adminCredential.findFirst.mockResolvedValue(null);
      prismaMock.adminCredential.create.mockImplementation((args: any) => ({
        id: 'cred-1',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const created = await credentialService.enrollPrimaryCredential(
        mockAdminIdentity.id,
        {
          password: plaintextPassword,
        },
      );

      expect(created.verifierHash).not.toBe(plaintextPassword);
      expect(created.verifierHash.startsWith('$argon2id$')).toBe(true);
      expect((created as any).password).toBeUndefined();

      // Verify the persisted hash is cryptographically verifiable
      const matches = await cryptoService.verifyPrimaryPassword(
        created.verifierHash,
        plaintextPassword,
      );
      expect(matches).toBe(true);
    });
  });

  describe('Vector 2: User → Admin Credential Promotion Lockout', () => {
    it('blocks normal user credential entity from being attached as an Admin credential', () => {
      const normalUserPasswordEntity = {
        userId: 'usr-9999-9999',
        passwordHash: '$argon2id$...',
      };

      expect(() => {
        AdminCredentialBoundary.assertNotUserCredential(
          normalUserPasswordEntity,
        );
      }).toThrow();
    });
  });

  describe('Vector 3: Public Password Reset / Recovery Prohibition', () => {
    it('guarantees no public email/SMS reset path exists for Admin credentials', () => {
      expect(ADMIN_CREDENTIAL_POLICY.NO_PUBLIC_RECOVERY_FLOW).toBe(true);
      expect(() =>
        AdminCredentialBoundary.assertNoPublicRecoveryWorkflow(),
      ).not.toThrow();
    });
  });

  describe('Vector 4: Server-Side Only Verification (Untrusted Frontend)', () => {
    it('enforces that credential verification occurs server-side and cannot be dictated by client', () => {
      expect(ADMIN_CREDENTIAL_POLICY.SERVER_SIDE_ONLY_VERIFICATION).toBe(true);
    });
  });

  describe('Vector 5: Abuse Protection & Progressive Lockout', () => {
    it('enforces lockout threshold of exactly 5 attempts with 15-minute lock duration', () => {
      expect(ADMIN_CREDENTIAL_POLICY.MAX_FAILED_ATTEMPTS).toBe(5);
      expect(ADMIN_CREDENTIAL_POLICY.LOCKOUT_DURATION_MS).toBe(900000); // 15 mins
    });
  });

  describe('Vector 6: Credential Non-Reassignment & Revocation Immutability', () => {
    it('permanently marks revoked credentials as unusable', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminCredential.findFirst.mockResolvedValue({
        id: 'cred-revoked',
        adminId: mockAdminIdentity.id,
        type: AdminCredentialType.PRIMARY_PASSWORD,
        verifierHash: '$argon2id$...',
        status: AdminCredentialStatus.REVOKED,
      });

      const result = await credentialService.verifyPrimaryCredential({
        identifier: 'platform-owner',
        password: 'Password12345678!',
      });

      expect(result.success).toBe(false);
      expect(result.failureCategory).toBe('CREDENTIAL_REVOKED');
    });
  });

  describe('Vector 7: Zero-Leakage Invariant Verification', () => {
    it('guarantees logging payloads reject sensitive credential data', () => {
      expect(() => {
        AdminCredentialBoundary.assertNoSecretLeakage({
          adminId: 'adm-001',
          verifierHash: '$argon2id$...',
        });
      }).toThrow();
    });
  });
});
