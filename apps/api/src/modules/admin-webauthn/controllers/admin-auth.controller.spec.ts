import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuthController } from './admin-auth.controller';
import { AdminWebAuthnAuthenticationService } from '../services/admin-webauthn-authentication.service';
import { AdminWebAuthnEnrollmentService } from '../services/admin-webauthn-enrollment.service';
import { AdminSessionService } from '../../admin-session/services/admin-session.service';
import { AdminIdentityService } from '../../admin-identity/services/admin-identity.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AdminStatus } from '../../admin-identity/contracts/admin-identity.contract';

describe('ADMIN-009: AdminAuthController (Admin Entry & WebAuthn Ceremony)', () => {
  let controller: AdminAuthController;
  let authServiceMock: any;
  let enrollmentServiceMock: any;
  let sessionServiceMock: any;
  let identityServiceMock: any;
  let prismaMock: any;

  beforeEach(async () => {
    authServiceMock = {
      initiateAuthentication: jest.fn(),
      verifyAuthentication: jest.fn(),
    };

    enrollmentServiceMock = {
      initiateEnrollment: jest.fn(),
      verifyAndRegisterEnrollment: jest.fn(),
    };

    sessionServiceMock = {
      createSession: jest.fn(),
    };

    identityServiceMock = {
      getAdminIdentity: jest.fn(),
    };

    prismaMock = {
      adminWebAuthnCredential: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAuthController],
      providers: [
        {
          provide: AdminWebAuthnAuthenticationService,
          useValue: authServiceMock,
        },
        {
          provide: AdminWebAuthnEnrollmentService,
          useValue: enrollmentServiceMock,
        },
        { provide: AdminSessionService, useValue: sessionServiceMock },
        { provide: AdminIdentityService, useValue: identityServiceMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    controller = module.get<AdminAuthController>(AdminAuthController);
  });

  describe('1. Gateway Status Check (/status)', () => {
    it('returns unprovisioned status if no admin identity exists', async () => {
      identityServiceMock.getAdminIdentity.mockResolvedValue(null);

      const result = await controller.getAuthStatus();
      expect(result).toEqual({
        isProvisioned: false,
        hasPasskeys: false,
        identifier: null,
      });
    });

    it('returns provisioned status with active passkeys count', async () => {
      identityServiceMock.getAdminIdentity.mockResolvedValue({
        id: 'adm-001',
        identifier: 'platform-owner',
        status: AdminStatus.ACTIVE,
      });
      prismaMock.adminWebAuthnCredential.count.mockResolvedValue(2);

      const result = await controller.getAuthStatus();
      expect(result).toEqual({
        isProvisioned: true,
        isActive: true,
        hasPasskeys: true,
        identifier: 'platform-owner',
      });
    });
  });

  describe('2. WebAuthn Authentication Ceremony', () => {
    it('initiates authentication and returns options with challenge', async () => {
      authServiceMock.initiateAuthentication.mockResolvedValue({
        options: { challenge: 'test-challenge' },
        challenge: 'test-challenge',
      });

      const result = await controller.initiateAuthentication({
        identifier: 'platform-owner',
      });

      expect(authServiceMock.initiateAuthentication).toHaveBeenCalledWith({
        identifier: 'platform-owner',
      });
      expect(result.challenge).toBe('test-challenge');
    });

    it('verifies authentication assertion and issues short-lived Admin JWT', async () => {
      authServiceMock.verifyAuthentication.mockResolvedValue({
        adminIdentityId: 'adm-001',
        identifier: 'platform-owner',
        credentialId: 'cred-001',
        assuranceLevel: 'AAL3',
      });

      sessionServiceMock.createSession.mockResolvedValue({
        accessToken: 'jwt-token-xyz',
        tokenType: 'Bearer',
        expiresIn: 900,
        sessionId: 'sess-001',
        assuranceLevel: 'AAL3',
      });

      const mockReq: any = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'Chrome/120' },
      };
      const result = await controller.verifyAuthentication(
        { identifier: 'platform-owner', response: { id: 'cred-001' } as any },
        mockReq,
      );

      expect(authServiceMock.verifyAuthentication).toHaveBeenCalled();
      expect(sessionServiceMock.createSession).toHaveBeenCalled();
      expect(result.accessToken).toBe('jwt-token-xyz');
      expect(result.adminId).toBe('adm-001');
      expect(result.assuranceLevel).toBe('AAL3');
    });
  });

  describe('3. WebAuthn Passkey Enrollment Ceremony', () => {
    it('initiates enrollment requiring primary password possession when unauthenticated', async () => {
      enrollmentServiceMock.initiateEnrollment.mockResolvedValue({
        options: { challenge: 'reg-challenge' },
        challenge: 'reg-challenge',
      });

      const mockReq: any = { headers: {} };
      const result = await controller.initiateEnrollment(
        {
          identifier: 'platform-owner',
          password: 'ValidPassword123!',
          deviceLabel: 'YubiKey 5C',
        },
        mockReq,
      );

      expect(enrollmentServiceMock.initiateEnrollment).toHaveBeenCalledWith(
        {
          identifier: 'platform-owner',
          password: 'ValidPassword123!',
          deviceLabel: 'YubiKey 5C',
        },
        undefined,
      );
      expect(result.challenge).toBe('reg-challenge');
    });

    it('initiates enrollment with active Admin session Bearer token context', async () => {
      sessionServiceMock.validateAdminToken = jest.fn().mockResolvedValue({
        adminId: 'adm-001',
        sessionId: 'sess-001',
        identifier: 'platform-owner',
        assuranceLevel: 'AAL3',
      });

      enrollmentServiceMock.initiateEnrollment.mockResolvedValue({
        options: { challenge: 'reg-challenge-session' },
        challenge: 'reg-challenge-session',
      });

      const mockReq: any = {
        headers: { authorization: 'Bearer valid-admin-jwt' },
        ip: '127.0.0.1',
      };

      const result = await controller.initiateEnrollment(
        { deviceLabel: 'YubiKey 5C NFC' },
        mockReq,
      );

      expect(sessionServiceMock.validateAdminToken).toHaveBeenCalledWith(
        'valid-admin-jwt',
        expect.any(Object),
      );
      expect(enrollmentServiceMock.initiateEnrollment).toHaveBeenCalledWith(
        { deviceLabel: 'YubiKey 5C NFC' },
        expect.objectContaining({ adminId: 'adm-001' }),
      );
      expect(result.challenge).toBe('reg-challenge-session');
    });

    it('verifies enrollment and registers new WebAuthn credential', async () => {
      enrollmentServiceMock.verifyAndRegisterEnrollment.mockResolvedValue({
        credentialId: 'cred-new',
        deviceLabel: 'YubiKey 5C',
        status: 'ACTIVE',
      });

      const mockReq: any = { headers: {} };
      const result = await controller.verifyEnrollment(
        {
          identifier: 'platform-owner',
          response: { id: 'cred-new' } as any,
          challenge: 'reg-challenge',
          deviceLabel: 'YubiKey 5C',
        },
        mockReq,
      );

      expect(
        enrollmentServiceMock.verifyAndRegisterEnrollment,
      ).toHaveBeenCalled();
      expect(result.credentialId).toBe('cred-new');
      expect(result.status).toBe('ACTIVE');
    });
  });
});
