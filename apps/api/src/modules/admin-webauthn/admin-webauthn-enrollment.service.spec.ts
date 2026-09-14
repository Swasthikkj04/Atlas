import { Test, TestingModule } from '@nestjs/testing';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { AdminWebAuthnEnrollmentService } from './services/admin-webauthn-enrollment.service';
import { AdminIdentityService } from '../admin-identity/services/admin-identity.service';
import { AdminCredentialService } from '../admin-credential/services/admin-credential.service';
import { AdminAuditService } from '../admin-audit/services/admin-audit.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AdminStatus } from '../admin-identity/contracts/admin-identity.contract';
import { AdminCredentialStatus } from '../admin-credential/contracts/admin-credential.contract';
import {
  AdminWebAuthnChallengeExpiredException,
  AdminWebAuthnChallengeInvalidException,
  AdminWebAuthnDuplicateCredentialException,
  AdminWebAuthnLimitExceededException,
  AdminWebAuthnUnauthorizedException,
  AdminWebAuthnVerificationFailedException,
} from './exceptions/admin-webauthn.exception';
import { AdminCredentialInvalidException } from '../admin-credential/exceptions/admin-credential.exception';
import { AdminWebAuthnAuditEvent } from './contracts/admin-webauthn.contract';

// Mock simplewebauthn server verification functions
jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn().mockResolvedValue({
    rp: { name: 'Nebula Platform Admin', id: 'localhost' },
    user: {
      id: 'YWRtLTAwMQ',
      name: 'platform-owner',
      displayName: 'Nebula Admin (platform-owner)',
    },
    challenge: 'mock-cryptographic-challenge-base64url-32bytes',
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },
      { alg: -257, type: 'public-key' },
    ],
    timeout: 300000,
    attestation: 'none',
    excludeCredentials: [],
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'required',
    },
  }),
  verifyRegistrationResponse: jest.fn().mockResolvedValue({
    verified: true,
    registrationInfo: {
      credential: {
        id: 'mock-passkey-cred-id-12345678',
        publicKey: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
        counter: 0,
      },
      aaguid: '00000000-0000-0000-0000-000000000000',
      credentialBackedUp: false,
    },
  }),
}));

describe('ADMIN-001 / ADMIN-003: AdminWebAuthnEnrollmentService & Assurance Invariants', () => {
  let service: AdminWebAuthnEnrollmentService;
  let adminCredentialServiceMock: any;
  let adminIdentityServiceMock: any;
  let adminAuditServiceMock: any;
  let prismaMock: any;

  const mockAdminIdentity = {
    id: 'adm-00000001',
    identifier: 'platform-owner',
    status: AdminStatus.ACTIVE,
  };

  const mockSessionContext = {
    adminId: 'adm-00000001',
    sessionId: 'sess-0001',
    identifier: 'platform-owner',
    assuranceLevel: 'AAL3',
  };

  const mockChallengeRecord = {
    id: 'chal-0001',
    adminId: 'adm-00000001',
    challenge: 'mock-cryptographic-challenge-base64url-32bytes',
    purpose: 'ENROLLMENT',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    consumedAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prismaMock = {
      adminIdentity: {
        findUnique: jest.fn(),
      },
      adminWebAuthnChallenge: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      adminWebAuthnCredential: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    adminCredentialServiceMock = {
      verifyPrimaryCredential: jest.fn(),
    };

    adminIdentityServiceMock = {
      validateAuthenticationEligibility: jest
        .fn()
        .mockResolvedValue(mockAdminIdentity),
    };

    adminAuditServiceMock = {
      recordEvent: jest.fn().mockResolvedValue({ id: 'audit-01' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminWebAuthnEnrollmentService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AdminIdentityService, useValue: adminIdentityServiceMock },
        {
          provide: AdminCredentialService,
          useValue: adminCredentialServiceMock,
        },
        { provide: AdminAuditService, useValue: adminAuditServiceMock },
      ],
    }).compile();

    service = module.get<AdminWebAuthnEnrollmentService>(
      AdminWebAuthnEnrollmentService,
    );
  });

  describe('1. Step 1: Initiate WebAuthn Enrollment', () => {
    it('successfully authorizes via active Admin session without primary password re-prompt', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminWebAuthnCredential.findMany.mockResolvedValue([]);
      prismaMock.adminWebAuthnChallenge.create.mockResolvedValue(
        mockChallengeRecord,
      );

      const result = await service.initiateEnrollment(
        { deviceLabel: 'YubiKey 5C NFC' },
        mockSessionContext as any,
      );

      expect(result.options).toBeDefined();
      expect(result.challenge).toBe(
        'mock-cryptographic-challenge-base64url-32bytes',
      );
      expect(
        adminCredentialServiceMock.verifyPrimaryCredential,
      ).not.toHaveBeenCalled();
      expect(prismaMock.adminWebAuthnChallenge.create).toHaveBeenCalledWith({
        data: {
          adminId: mockAdminIdentity.id,
          challenge: expect.any(String),
          purpose: 'ENROLLMENT',
          expiresAt: expect.any(Date),
        },
      });
      expect(adminAuditServiceMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_STARTED,
          adminId: mockAdminIdentity.id,
        }),
      );
    });

    it('successfully authorizes via primary password verification when unauthenticated', async () => {
      adminCredentialServiceMock.verifyPrimaryCredential.mockResolvedValue({
        success: true,
        credentialId: 'cred-1',
      });
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminWebAuthnCredential.findMany.mockResolvedValue([]);
      prismaMock.adminWebAuthnChallenge.create.mockResolvedValue(
        mockChallengeRecord,
      );

      const result = await service.initiateEnrollment({
        identifier: 'platform-owner',
        password: 'V3ry$ecureP@ssw0rd!2026',
        deviceLabel: 'YubiKey 5C NFC',
      });

      expect(result.options).toBeDefined();
      expect(result.challenge).toBe(
        'mock-cryptographic-challenge-base64url-32bytes',
      );
    });

    it('rejects initiation if session identifier mismatches requested identifier', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);

      await expect(
        service.initiateEnrollment(
          { identifier: 'impostor-admin' },
          mockSessionContext as any,
        ),
      ).rejects.toThrow(AdminWebAuthnUnauthorizedException);
    });

    it('rejects initiation if neither session nor primary credentials are provided', async () => {
      await expect(
        service.initiateEnrollment({ deviceLabel: 'YubiKey 5C NFC' }),
      ).rejects.toThrow(AdminWebAuthnUnauthorizedException);
    });

    it('rejects enrollment initiation if primary password verification fails', async () => {
      adminCredentialServiceMock.verifyPrimaryCredential.mockResolvedValue({
        success: false,
        failureCategory: 'INVALID_CREDENTIALS',
      });

      await expect(
        service.initiateEnrollment({
          identifier: 'platform-owner',
          password: 'WrongPassword123!',
        }),
      ).rejects.toThrow(AdminCredentialInvalidException);

      expect(prismaMock.adminWebAuthnChallenge.create).not.toHaveBeenCalled();
    });

    it('rejects enrollment if maximum active passkeys limit (5) is exceeded', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminWebAuthnCredential.findMany.mockResolvedValue([
        { id: '1', credentialId: 'c1' },
        { id: '2', credentialId: 'c2' },
        { id: '3', credentialId: 'c3' },
        { id: '4', credentialId: 'c4' },
        { id: '5', credentialId: 'c5' },
      ]);

      await expect(
        service.initiateEnrollment(
          { deviceLabel: 'YubiKey 5C NFC' },
          mockSessionContext as any,
        ),
      ).rejects.toThrow(AdminWebAuthnLimitExceededException);
    });
  });

  describe('2. Step 2: Verify & Register WebAuthn Enrollment', () => {
    it('successfully registers a hardware authenticator with USB and NFC transports', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminWebAuthnChallenge.findUnique.mockResolvedValue(
        mockChallengeRecord,
      );
      prismaMock.adminWebAuthnChallenge.update.mockResolvedValue({
        ...mockChallengeRecord,
        consumedAt: new Date(),
      });
      prismaMock.adminWebAuthnCredential.findUnique.mockResolvedValue(null);
      prismaMock.adminWebAuthnCredential.create.mockResolvedValue({
        id: 'webauthn-hw-1',
        adminId: mockAdminIdentity.id,
        credentialId: 'mock-passkey-cred-id-12345678',
        publicKey: Buffer.from([1, 2, 3, 4]),
        counter: BigInt(0),
        transports: ['usb', 'nfc'],
        deviceLabel: 'YubiKey 5C NFC',
        status: 'ACTIVE',
        backedUp: false,
        lastUsedAt: null,
        createdAt: new Date(),
      });

      const clientData = Buffer.from(
        JSON.stringify({
          type: 'webauthn.create',
          challenge: mockChallengeRecord.challenge,
          origin: 'http://localhost:5173',
        }),
      ).toString('base64url');

      const result = await service.verifyAndRegisterEnrollment(
        {
          response: {
            id: 'mock-passkey-cred-id-12345678',
            rawId: 'mock-passkey-cred-id-12345678',
            response: {
              clientDataJSON: clientData,
              attestationObject: 'mock-attestation',
              transports: ['usb', 'nfc'],
            },
            type: 'public-key',
            clientExtensionResults: {},
          } as any,
          deviceLabel: 'YubiKey 5C NFC',
        },
        mockSessionContext as any,
      );

      expect(result.id).toBe('webauthn-hw-1');
      expect(result.deviceLabel).toBe('YubiKey 5C NFC');
      expect(result.status).toBe(AdminCredentialStatus.ACTIVE);
      expect(adminAuditServiceMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_COMPLETED,
          adminId: mockAdminIdentity.id,
          outcome: 'SUCCESS',
        }),
      );
    });

    it('successfully registers a platform authenticator with internal transport', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminWebAuthnChallenge.findUnique.mockResolvedValue(
        mockChallengeRecord,
      );
      prismaMock.adminWebAuthnChallenge.update.mockResolvedValue({
        ...mockChallengeRecord,
        consumedAt: new Date(),
      });
      prismaMock.adminWebAuthnCredential.findUnique.mockResolvedValue(null);
      prismaMock.adminWebAuthnCredential.create.mockResolvedValue({
        id: 'webauthn-plat-1',
        adminId: mockAdminIdentity.id,
        credentialId: 'mock-passkey-cred-id-12345678',
        publicKey: Buffer.from([1, 2, 3, 4]),
        counter: BigInt(0),
        transports: ['internal'],
        deviceLabel: 'MacBook Touch ID',
        status: 'ACTIVE',
        backedUp: true,
        lastUsedAt: null,
        createdAt: new Date(),
      });

      const clientData = Buffer.from(
        JSON.stringify({
          type: 'webauthn.create',
          challenge: mockChallengeRecord.challenge,
          origin: 'http://localhost:5173',
        }),
      ).toString('base64url');

      const result = await service.verifyAndRegisterEnrollment(
        {
          response: {
            id: 'mock-passkey-cred-id-12345678',
            rawId: 'mock-passkey-cred-id-12345678',
            response: {
              clientDataJSON: clientData,
              attestationObject: 'mock-attestation',
              transports: ['internal'],
            },
            type: 'public-key',
            clientExtensionResults: {},
          } as any,
          deviceLabel: 'MacBook Touch ID',
        },
        mockSessionContext as any,
      );

      expect(result.id).toBe('webauthn-plat-1');
      expect(result.deviceLabel).toBe('MacBook Touch ID');
    });

    it('rejects candidate credential with user authentication payload (plane boundary violation)', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);

      await expect(
        service.verifyAndRegisterEnrollment(
          {
            response: {
              id: 'cred-1',
              userId: 'usr-regular-123',
            } as any,
          },
          mockSessionContext as any,
        ),
      ).rejects.toThrow();
    });

    it('rejects attempt to replay an already-consumed challenge', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminWebAuthnChallenge.findUnique.mockResolvedValue({
        ...mockChallengeRecord,
        consumedAt: new Date('2026-08-20T00:00:00Z'),
      });

      await expect(
        service.verifyAndRegisterEnrollment(
          {
            challenge: mockChallengeRecord.challenge,
            response: { id: 'any-cred' } as any,
          },
          mockSessionContext as any,
        ),
      ).rejects.toThrow(AdminWebAuthnChallengeInvalidException);

      expect(adminAuditServiceMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_FAILED,
          outcome: 'FAILURE',
        }),
      );
    });

    it('rejects an expired registration challenge', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminWebAuthnChallenge.findUnique.mockResolvedValue({
        ...mockChallengeRecord,
        expiresAt: new Date(Date.now() - 60 * 1000),
      });

      await expect(
        service.verifyAndRegisterEnrollment(
          {
            challenge: mockChallengeRecord.challenge,
            response: { id: 'any-cred' } as any,
          },
          mockSessionContext as any,
        ),
      ).rejects.toThrow(AdminWebAuthnChallengeExpiredException);
    });

    it('rejects registration from an unwhitelisted origin', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);

      const maliciousClientData = Buffer.from(
        JSON.stringify({
          type: 'webauthn.create',
          challenge: mockChallengeRecord.challenge,
          origin: 'https://malicious-phishing-attacker.com',
        }),
      ).toString('base64url');

      await expect(
        service.verifyAndRegisterEnrollment(
          {
            response: {
              id: 'cred-phish',
              response: {
                clientDataJSON: maliciousClientData,
              },
            } as any,
          },
          mockSessionContext as any,
        ),
      ).rejects.toThrow();
    });

    it('rejects duplicate credential ID registration', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminWebAuthnChallenge.findUnique.mockResolvedValue(
        mockChallengeRecord,
      );
      prismaMock.adminWebAuthnCredential.findUnique.mockResolvedValue({
        id: 'existing-cred-id',
        credentialId: 'duplicate-cred-id',
      });

      await expect(
        service.verifyAndRegisterEnrollment(
          {
            challenge: mockChallengeRecord.challenge,
            response: { id: 'duplicate-cred-id' } as any,
          },
          mockSessionContext as any,
        ),
      ).rejects.toThrow(AdminWebAuthnDuplicateCredentialException);
    });

    it('fails closed and records audit event if simplewebauthn cryptographic verification fails', async () => {
      (verifyRegistrationResponse as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid signature / attestation corrupted'),
      );

      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminIdentity);
      prismaMock.adminWebAuthnChallenge.findUnique.mockResolvedValue(
        mockChallengeRecord,
      );
      prismaMock.adminWebAuthnCredential.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyAndRegisterEnrollment(
          {
            challenge: mockChallengeRecord.challenge,
            response: { id: 'cred-fail', response: {} } as any,
          },
          mockSessionContext as any,
        ),
      ).rejects.toThrow(AdminWebAuthnVerificationFailedException);

      expect(adminAuditServiceMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_FAILED,
          outcome: 'FAILURE',
        }),
      );
    });
  });

  describe('3. Passkey Lifecycle Actions', () => {
    it('disables an enrolled passkey', async () => {
      prismaMock.adminWebAuthnCredential.update.mockResolvedValue({
        id: 'cred-1',
        adminId: mockAdminIdentity.id,
        status: 'DISABLED',
        transports: [],
        createdAt: new Date(),
      });

      const result = await service.disablePasskey(
        mockAdminIdentity.id,
        'cred-1',
      );
      expect(result.status).toBe(AdminCredentialStatus.DISABLED);
    });

    it('permanently revokes an enrolled passkey', async () => {
      prismaMock.adminWebAuthnCredential.update.mockResolvedValue({
        id: 'cred-1',
        adminId: mockAdminIdentity.id,
        status: 'REVOKED',
        transports: [],
        createdAt: new Date(),
      });

      const result = await service.revokePasskey(
        mockAdminIdentity.id,
        'cred-1',
        'Lost hardware key',
      );
      expect(result.status).toBe(AdminCredentialStatus.REVOKED);
    });
  });
});
