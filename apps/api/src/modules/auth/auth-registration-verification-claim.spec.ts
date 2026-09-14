import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserAccountStatus, GuestSessionStatus } from '@prisma/client';
import { AuthService } from './services/auth.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from './services/password.service';
import { VerificationTokenService } from './services/verification-token.service';
import { PasswordResetTokenService } from './services/password-reset-token.service';
import { UserSessionService } from './services/user-session.service';
import { EmailService } from '../../infrastructure/email/email.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { GuestUnderstandingService } from '../guest/guest-understanding.service';
import { UnderstandingEngine } from '../understanding/understanding.engine';
import { InfrastructureSnapshotService } from '../infrastructure-snapshots/services/infrastructure-snapshot.service';
import { InfrastructureFindingService } from '../infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureBriefService } from '../infrastructure-brief/services/infrastructure-brief.service';

describe('AUTH-004: Registration -> Verification -> Authenticated Session -> Guest Claim Flow', () => {
  let authService: AuthService;
  let guestService: GuestUnderstandingService;
  let prisma: jest.Mocked<PrismaService>;
  let usersService: jest.Mocked<UsersService>;
  let tokenService: jest.Mocked<VerificationTokenService>;
  let sessionService: jest.Mocked<UserSessionService>;

  const mockUser = {
    id: 'usr-swasthik-100',
    email: 'swasthik@example.com',
    fullName: 'Swasthik K J',
    passwordHash: 'argon2_hashed_pw',
    status: UserAccountStatus.PENDING_VERIFICATION,
    emailVerifiedAt: null,
    avatarUrl: null,
    lastLoginAt: null,
    tokenInvalidatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDeviceMeta = {
    browser: 'Chrome',
    operatingSystem: 'Linux',
    deviceType: 'Desktop',
    deviceName: 'Chrome on Linux',
  };

  const mockGuestSession = {
    id: 'ses-db-100',
    sessionToken: 'ses_1723456789_xyz999',
    domain: 'github.com',
    status: GuestSessionStatus.ACTIVE,
    understandingJobId: 'gst_job_999',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    lastSeenAt: new Date(),
  };

  const mockJob = {
    id: 'gst_job_999',
    domainId: 'dom-guest-1',
    status: 'COMPLETED',
    domain: {
      id: 'dom-guest-1',
      userId: 'usr-guest-sys-1',
      domainName: 'github.com',
    },
    infrastructureSnapshot: {
      id: 'snap-999',
      jobId: 'gst_job_999',
      domainId: 'dom-guest-1',
    },
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      verificationToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      guestSession: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      domain: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      understandingJob: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      infrastructureSnapshot: {
        update: jest.fn(),
      },
      rawEvidence: {
        updateMany: jest.fn(),
      },
      infrastructureVerification: {
        updateMany: jest.fn(),
      },
      changeHistory: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      }),
    };

    const mockUsers = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    const mockPassword = {
      hash: jest.fn().mockResolvedValue('argon2_hashed_pw'),
      verify: jest.fn().mockResolvedValue(true),
    };

    const mockJwt = {
      signAsync: jest.fn().mockResolvedValue('jwt_access_token_mock'),
    };

    const mockTokenSvc = {
      issueVerificationToken: jest
        .fn()
        .mockResolvedValue('raw_verify_token_32bytes'),
      findValidTokenByRaw: jest.fn(),
      hashToken: jest.fn().mockReturnValue('sha256_hash_100'),
      markTokenConsumed: jest.fn().mockResolvedValue(undefined),
    };

    const mockResetTokenSvc = {
      issueResetToken: jest.fn(),
      findValidTokenByRaw: jest.fn(),
      markTokenConsumed: jest.fn(),
      invalidateUserTokens: jest.fn(),
    };

    const mockSessionSvc = {
      createSession: jest.fn().mockResolvedValue({
        session: { id: 'ses-1' } as any,
        rawRefreshToken: 'raw_refresh_token_mock',
      }),
      rotateSession: jest.fn(),
      revokeSessionByRawToken: jest.fn(),
      revokeSessionById: jest.fn(),
      revokeAllUserSessions: jest.fn(),
      getUserSessions: jest.fn(),
    };

    const mockEmail = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetConfirmationEmail: jest
        .fn()
        .mockResolvedValue(undefined),
      sendWelcomeEmail: jest.fn().mockResolvedValue({ status: 'SENT' }),
    };

    const mockEngine = {
      execute: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        GuestUnderstandingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsers },
        { provide: PasswordService, useValue: mockPassword },
        { provide: JwtService, useValue: mockJwt },
        { provide: VerificationTokenService, useValue: mockTokenSvc },
        { provide: PasswordResetTokenService, useValue: mockResetTokenSvc },
        { provide: UserSessionService, useValue: mockSessionSvc },
        { provide: EmailService, useValue: mockEmail },
        { provide: UnderstandingEngine, useValue: mockEngine },
        { provide: InfrastructureSnapshotService, useValue: {} },
        { provide: InfrastructureFindingService, useValue: {} },
        {
          provide: InfrastructureBriefService,
          useValue: { generate: jest.fn() },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    guestService = module.get<GuestUnderstandingService>(
      GuestUnderstandingService,
    );
    prisma = module.get(PrismaService);
    usersService = module.get(UsersService);
    tokenService = module.get(VerificationTokenService);
    sessionService = module.get(UserSessionService);
  });

  describe('Full Lifecycle: Register -> Verify Email -> Authenticated Session -> Guest Claim', () => {
    it('executes full AC flow seamlessly without requiring secondary login', async () => {
      // 1. REGISTRATION: Account created in PENDING_VERIFICATION
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);

      const registerResult = await authService.register({
        fullName: 'Swasthik K J',
        email: 'swasthik@example.com',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
      });

      expect(registerResult.user.id).toBe('usr-swasthik-100');
      expect(tokenService.issueVerificationToken).toHaveBeenCalledWith(
        'usr-swasthik-100',
      );

      // 2. VERIFICATION: Verify token, transition to ACTIVE, issue authenticated session
      const activatedUser = {
        ...mockUser,
        status: UserAccountStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      };
      (prisma.verificationToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'tok-100',
        userId: 'usr-swasthik-100',
        tokenHash: 'sha256_hash_100',
        consumedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: { ...mockUser, status: UserAccountStatus.PENDING_VERIFICATION },
      } as any);

      (prisma.user.update as jest.Mock).mockResolvedValue(activatedUser);

      const verifyResult = await authService.verifyEmail(
        'raw_verify_token_32bytes',
        mockDeviceMeta,
      );

      // Verify immediate session establishment
      expect(verifyResult.status).toBe(UserAccountStatus.ACTIVE);
      expect(verifyResult.accessToken).toBe('jwt_access_token_mock');
      expect(verifyResult.refreshToken).toBe('raw_refresh_token_mock');
      expect(verifyResult.user?.id).toBe('usr-swasthik-100');
      expect(verifyResult.user?.fullName).toBe('Swasthik K J');
      expect(prisma.verificationToken.update).toHaveBeenCalledWith({
        where: { id: 'tok-100' },
        data: { consumedAt: expect.any(Date) },
      });
      expect(sessionService.createSession).toHaveBeenCalledWith(
        'usr-swasthik-100',
        mockDeviceMeta,
      );

      // 3. GUEST CLAIM: Authenticated user claims guest session
      (prisma.guestSession.findUnique as jest.Mock).mockResolvedValue(
        mockGuestSession,
      );
      (prisma.understandingJob.findUnique as jest.Mock).mockResolvedValue(
        mockJob,
      );
      (prisma.domain.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.domain.create as jest.Mock).mockResolvedValue({
        id: 'dom-user-100',
        userId: 'usr-swasthik-100',
        domainName: 'github.com',
      });

      const claimResult = await guestService.claimGuestSession(
        verifyResult.user.id,
        'ses_1723456789_xyz999',
      );

      expect(claimResult.success).toBe(true);
      expect(claimResult.domainName).toBe('github.com');
      expect(claimResult.jobId).toBe('gst_job_999');
      expect(prisma.understandingJob.update).toHaveBeenCalledWith({
        where: { id: 'gst_job_999' },
        data: { domainId: 'dom-user-100' },
      });
      expect(prisma.guestSession.update).toHaveBeenCalledWith({
        where: { id: 'ses-db-100' },
        data: { status: GuestSessionStatus.CONVERTED },
      });
    });

    it('rejects invalid or unknown verification token', async () => {
      (prisma.verificationToken.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        authService.verifyEmail('invalid_or_consumed_token', mockDeviceMeta),
      ).rejects.toThrow('This verification link is no longer valid.');
    });
  });
});
