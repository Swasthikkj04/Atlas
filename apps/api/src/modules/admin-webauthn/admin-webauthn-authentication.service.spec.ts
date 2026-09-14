import { Test, TestingModule } from '@nestjs/testing';
import { AdminWebAuthnAuthenticationService } from './services/admin-webauthn-authentication.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AdminStatus } from '../admin-identity/contracts/admin-identity.contract';
import { AdminCredentialStatus } from '../admin-credential/contracts/admin-credential.contract';
import {
  AdminWebAuthnChallengeExpiredException,
  AdminWebAuthnChallengeInvalidException,
  AdminWebAuthnAuthenticationFailedException,
  AdminWebAuthnAuthenticatorRejectedException,
} from './exceptions/admin-webauthn.exception';

// Mock simplewebauthn server authentication functions
jest.mock('@simplewebauthn/server', () => ({
  generateAuthenticationOptions: jest.fn().mockResolvedValue({
    rpId: 'localhost',
    challenge: 'mock-auth-cryptographic-challenge-base64url',
    timeout: 300000,
    userVerification: 'required',
    allowCredentials: [
      { id: 'mock-passkey-cred-id-12345678', transports: ['internal', 'usb'] },
    ],
  }),
  verifyAuthenticationResponse: jest.fn().mockResolvedValue({
    verified: true,
    authenticationInfo: {
      newCounter: 10,
    },
  }),
}));

describe('ADMIN-004: AdminWebAuthnAuthenticationService & Cryptographic Verification', () => {
  let service: AdminWebAuthnAuthenticationService;
  let prismaMock: any;

  const mockAdminIdentity = {
    id: 'adm-00000001',
    identifier: 'platform-owner',
    status: AdminStatus.ACTIVE,
  };

  const mockPasskeyRecord = {
    id: 'webauthn-cred-1',
    adminId: 'adm-00000001',
    credentialId: 'mock-passkey-cred-id-12345678',
    publicKey: Buffer.from([1, 2, 3, 4]),
    counter: BigInt(5),
    transports: ['internal', 'usb'],
    status: AdminCredentialStatus.ACTIVE,
  };

  const mockChallengeRecord = {
    id: 'chal-auth-0001',
    adminId: 'adm-00000001',
    challenge: 'mock-auth-cryptographic-challenge-base64url',
    purpose: 'AUTHENTICATION',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    consumedAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prismaMock = {
      adminIdentity: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      adminWebAuthnChallenge: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      adminWebAuthnCredential: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest
        .fn()
        .mockImplementation(async (promises) => Promise.all(promises)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminWebAuthnAuthenticationService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AdminWebAuthnAuthenticationService>(
      AdminWebAuthnAuthenticationService,
    );
  });

  describe('1. Step 1: Initiate WebAuthn Authentication', () => {
    it('successfully initiates authentication ceremony for active Admin with enrolled passkeys', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminWebAuthnCredential.findMany.mockResolvedValue([
        mockPasskeyRecord,
      ]);
      prismaMock.adminWebAuthnChallenge.create.mockResolvedValue(
        mockChallengeRecord,
      );

      const result = await service.initiateAuthentication({
        identifier: 'platform-owner',
      });

      expect(result.options).toBeDefined();
      expect(result.challenge).toBe(
        'mock-auth-cryptographic-challenge-base64url',
      );
      expect(prismaMock.adminWebAuthnChallenge.create).toHaveBeenCalledWith({
        data: {
          adminId: mockAdminIdentity.id,
          challenge: expect.any(String),
          purpose: 'AUTHENTICATION',
          expiresAt: expect.any(Date),
        },
      });
    });

    it('fails closed when Admin identity is not found or inactive', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(null);

      await expect(
        service.initiateAuthentication({
          identifier: 'unknown-user',
        }),
      ).rejects.toThrow(AdminWebAuthnAuthenticationFailedException);
    });

    it('fails closed when Admin has zero active enrolled passkeys', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminWebAuthnCredential.findMany.mockResolvedValue([]);

      await expect(
        service.initiateAuthentication({
          identifier: 'platform-owner',
        }),
      ).rejects.toThrow(AdminWebAuthnAuthenticationFailedException);
    });
  });

  describe('2. Step 2: Verify WebAuthn Authentication & Authenticated Result', () => {
    it('successfully verifies assertion, updates counter atomically, and returns AuthenticatedAdminResult', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminWebAuthnChallenge.findUnique.mockResolvedValue(
        mockChallengeRecord,
      );
      prismaMock.adminWebAuthnChallenge.update.mockResolvedValue({
        ...mockChallengeRecord,
        consumedAt: new Date(),
      });
      prismaMock.adminWebAuthnCredential.findUnique.mockResolvedValue(
        mockPasskeyRecord,
      );
      prismaMock.adminWebAuthnCredential.update.mockResolvedValue({
        ...mockPasskeyRecord,
        counter: BigInt(10),
        lastUsedAt: new Date(),
      });
      prismaMock.adminIdentity.update.mockResolvedValue({
        ...mockAdminIdentity,
        lastAuthenticatedAt: new Date(),
      });

      const result = await service.verifyAuthentication({
        identifier: 'platform-owner',
        challenge: 'mock-auth-cryptographic-challenge-base64url',
        response: {
          id: 'mock-passkey-cred-id-12345678',
          rawId: 'mock-passkey-cred-id-12345678',
          response: {
            clientDataJSON: 'mock-client-data-json',
            authenticatorData: 'mock-auth-data',
            signature: 'mock-sig',
            userHandle: 'mock-user-handle',
          },
          type: 'public-key',
          clientExtensionResults: {},
        } as any,
      });

      expect(result.authenticated).toBe(true);
      expect(result.adminIdentityId).toBe(mockAdminIdentity.id);
      expect(result.identifier).toBe(mockAdminIdentity.identifier);
      expect(result.credentialId).toBe(mockPasskeyRecord.id);
      expect(result.assuranceLevel).toBe('AAL3');

      // Verify challenge consumed immediately
      expect(prismaMock.adminWebAuthnChallenge.update).toHaveBeenCalledWith({
        where: { id: mockChallengeRecord.id },
        data: { consumedAt: expect.any(Date) },
      });
    });

    it('rejects attempt to replay an already-consumed authentication challenge', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminWebAuthnChallenge.findUnique.mockResolvedValue({
        ...mockChallengeRecord,
        consumedAt: new Date('2026-08-20T00:00:00Z'),
      });

      await expect(
        service.verifyAuthentication({
          identifier: 'platform-owner',
          challenge: mockChallengeRecord.challenge,
          response: { id: 'mock-passkey-cred-id-12345678' } as any,
        }),
      ).rejects.toThrow(AdminWebAuthnChallengeInvalidException);
    });

    it('rejects an expired authentication challenge', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminWebAuthnChallenge.findUnique.mockResolvedValue({
        ...mockChallengeRecord,
        expiresAt: new Date(Date.now() - 30 * 1000), // Expired
      });

      await expect(
        service.verifyAuthentication({
          identifier: 'platform-owner',
          challenge: mockChallengeRecord.challenge,
          response: { id: 'mock-passkey-cred-id-12345678' } as any,
        }),
      ).rejects.toThrow(AdminWebAuthnChallengeExpiredException);
    });

    it('rejects authentication if passkey is disabled or revoked', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminWebAuthnChallenge.findUnique.mockResolvedValue(
        mockChallengeRecord,
      );
      prismaMock.adminWebAuthnChallenge.update.mockResolvedValue({
        ...mockChallengeRecord,
        consumedAt: new Date(),
      });
      prismaMock.adminWebAuthnCredential.findUnique.mockResolvedValue({
        ...mockPasskeyRecord,
        status: AdminCredentialStatus.DISABLED,
      });

      await expect(
        service.verifyAuthentication({
          identifier: 'platform-owner',
          challenge: mockChallengeRecord.challenge,
          response: { id: 'mock-passkey-cred-id-12345678' } as any,
        }),
      ).rejects.toThrow(AdminWebAuthnAuthenticationFailedException);
    });

    it('detects authenticator counter rollback, rejects possible cloned devices, revokes passkey and logs security anomaly', async () => {
      const {
        verifyAuthenticationResponse,
      } = require('@simplewebauthn/server');
      // Mock counter rollback (stored counter is 5, incoming counter is 3)
      verifyAuthenticationResponse.mockResolvedValueOnce({
        verified: true,
        authenticationInfo: {
          newCounter: 3, // Rollback!
        },
      });

      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminWebAuthnChallenge.findUnique.mockResolvedValue(
        mockChallengeRecord,
      );
      prismaMock.adminWebAuthnChallenge.update.mockResolvedValue({
        ...mockChallengeRecord,
        consumedAt: new Date(),
      });
      prismaMock.adminWebAuthnCredential.findUnique.mockResolvedValue(
        mockPasskeyRecord,
      );
      prismaMock.adminWebAuthnCredential.update.mockResolvedValue({
        ...mockPasskeyRecord,
        status: AdminCredentialStatus.REVOKED,
      });

      await expect(
        service.verifyAuthentication({
          identifier: 'platform-owner',
          challenge: mockChallengeRecord.challenge,
          response: { id: 'mock-passkey-cred-id-12345678' } as any,
        }),
      ).rejects.toThrow(AdminWebAuthnAuthenticatorRejectedException);

      // Verify passkey was explicitly revoked
      expect(prismaMock.adminWebAuthnCredential.update).toHaveBeenCalledWith({
        where: { id: mockPasskeyRecord.id },
        data: {
          status: AdminCredentialStatus.REVOKED,
          revokedAt: expect.any(Date),
          revokedReason: expect.stringContaining('counter anomaly'),
        },
      });
    });
  });
});
