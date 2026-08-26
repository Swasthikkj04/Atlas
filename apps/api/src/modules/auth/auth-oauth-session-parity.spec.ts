import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserAccountStatus, GuestSessionStatus } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { GoogleAuthService } from './services/google-auth.service';
import { GitHubAuthService } from './services/github-auth.service';
import { UserSessionService } from './services/user-session.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from './services/password.service';
import { VerificationTokenService } from './services/verification-token.service';
import { PasswordResetTokenService } from './services/password-reset-token.service';
import { OAuthIdentityResolver } from './resolvers/oauth-identity.resolver';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EmailService } from '../../infrastructure/email/email.service';
import { GuestUnderstandingService } from '../guest/guest-understanding.service';
import { UnderstandingEngine } from '../understanding/understanding.engine';
import { InfrastructureSnapshotService } from '../infrastructure-snapshots/services/infrastructure-snapshot.service';
import { InfrastructureFindingService } from '../infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureBriefService } from '../infrastructure-brief/services/infrastructure-brief.service';
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  getAccessCookieOptions,
  getRefreshCookieOptions,
} from './utils/auth-cookie.util';
import { CSRF_COOKIE_NAME } from './utils/csrf.util';

describe('AUTH-011: OAuth Session Cookie Parity & Refresh Continuity', () => {
  let authController: AuthController;
  let authService: AuthService;
  let googleAuthService: GoogleAuthService;
  let sessionService: UserSessionService;
  let jwtStrategy: JwtStrategy;
  let guestService: GuestUnderstandingService;
  let prisma: jest.Mocked<PrismaService>;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'usr-oauth-parity-100',
    email: 'alex@example.com',
    fullName: 'Alex River',
    passwordHash: 'hashed_pw_password_auth',
    status: UserAccountStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
    tokenInvalidatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDeviceMeta = {
    browser: 'Chrome',
    operatingSystem: 'Linux',
    deviceType: 'Desktop',
    deviceName: 'Chrome on Linux',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
  };

  const mockGoogleProfile = {
    googleId: 'google-oauth-id-999',
    email: 'alex@example.com',
    fullName: 'Alex River',
    avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
  };

  const mockGuestSession = {
    id: 'ses-guest-100',
    sessionToken: 'gst_tok_session_123',
    domain: 'stripe.com',
    status: GuestSessionStatus.ACTIVE,
    understandingJobId: 'job-gst-100',
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    lastSeenAt: new Date(),
  };

  const mockJob = {
    id: 'job-gst-100',
    domainId: 'dom-guest-100',
    status: 'COMPLETED',
    domain: {
      id: 'dom-guest-100',
      userId: 'usr-guest-sys-1',
      domainName: 'stripe.com',
    },
    infrastructureSnapshot: {
      id: 'snap-100',
      jobId: 'job-gst-100',
      domainId: 'dom-guest-100',
    },
  };

  beforeEach(async () => {
    const mockPrisma = {
      userSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      verificationToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      passwordResetToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
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
      findByEmail: jest.fn().mockResolvedValue(mockUser),
      findById: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn(),
    };

    const mockPassword = {
      hash: jest.fn().mockResolvedValue('hashed_pw'),
      verify: jest.fn().mockResolvedValue(true),
    };

    const mockResolver = {
      resolveUser: jest.fn().mockResolvedValue({
        user: mockUser,
        event: 'GOOGLE_LOGIN_SUCCESS',
      }),
    };

    const mockEmail = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetConfirmationEmail: jest
        .fn()
        .mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        GoogleAuthService,
        GitHubAuthService,
        UserSessionService,
        VerificationTokenService,
        PasswordResetTokenService,
        JwtStrategy,
        GuestUnderstandingService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest
              .fn()
              .mockResolvedValue('signed_jwt_access_token_123'),
          },
        },
        { provide: UsersService, useValue: mockUsers },
        { provide: PasswordService, useValue: mockPassword },
        { provide: OAuthIdentityResolver, useValue: mockResolver },
        { provide: EmailService, useValue: mockEmail },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UnderstandingEngine, useValue: { execute: jest.fn() } },
        { provide: InfrastructureSnapshotService, useValue: {} },
        { provide: InfrastructureFindingService, useValue: {} },
        {
          provide: InfrastructureBriefService,
          useValue: { generate: jest.fn() },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    googleAuthService = module.get<GoogleAuthService>(GoogleAuthService);
    sessionService = module.get<UserSessionService>(UserSessionService);
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    guestService = module.get<GuestUnderstandingService>(
      GuestUnderstandingService,
    );
    prisma = module.get(PrismaService);
    usersService = module.get(UsersService);
  });

  describe('1. Canonical Session & Cookie Establishment Shared Contract', () => {
    it('Google OAuth and Password login use the identical canonical session establishment logic', async () => {
      const establishSpy = jest.spyOn(authService, 'establishSession');

      // Password Login path
      const passwordLoginResult = await authService.login(
        { email: 'alex@example.com', password: 'password123' },
        mockDeviceMeta,
      );

      // Google OAuth path
      const googleOAuthResult =
        await googleAuthService.resolveAndAuthenticateGoogleUser(
          mockGoogleProfile,
          mockDeviceMeta,
        );

      expect(establishSpy).toHaveBeenCalledTimes(2);
      expect(establishSpy).toHaveBeenNthCalledWith(1, mockUser, mockDeviceMeta);
      expect(establishSpy).toHaveBeenNthCalledWith(2, mockUser, mockDeviceMeta);

      expect(passwordLoginResult.accessToken).toBe(
        'signed_jwt_access_token_123',
      );
      expect(googleOAuthResult.accessToken).toBe('signed_jwt_access_token_123');
      expect(passwordLoginResult.refreshToken).toBeDefined();
      expect(googleOAuthResult.refreshToken).toBeDefined();
    });

    it('Google OAuth creates a persisted user session record in database', async () => {
      (prisma.userSession.create as jest.Mock).mockResolvedValue({
        id: 'ses-db-google-1',
        userId: mockUser.id,
        refreshTokenHash: 'hash-abc-123',
        deviceName: mockDeviceMeta.deviceName,
        deviceType: mockDeviceMeta.deviceType,
        browser: mockDeviceMeta.browser,
        operatingSystem: mockDeviceMeta.operatingSystem,
        ipAddress: mockDeviceMeta.ipAddress,
        userAgent: mockDeviceMeta.userAgent,
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 86400000),
        revokedAt: null,
      });

      const { accessToken, refreshToken } =
        await googleAuthService.resolveAndAuthenticateGoogleUser(
          mockGoogleProfile,
          mockDeviceMeta,
        );

      expect(prisma.userSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          deviceName: 'Chrome on Linux',
          deviceType: 'Desktop',
          browser: 'Chrome',
          operatingSystem: 'Linux',
          ipAddress: '127.0.0.1',
          refreshTokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });

      expect(accessToken).toBe('signed_jwt_access_token_123');
      expect(refreshToken).toBeDefined();
    });
  });

  describe('2. Cookie Attribute Parity (OAuth vs Password Login)', () => {
    it('Google OAuth callback sets identical cookie names and attributes as password login', async () => {
      const passwordCookies: Record<string, { value: string; options: any }> =
        {};
      const oauthCookies: Record<string, { value: string; options: any }> = {};

      const mockPasswordRes = {
        cookie: jest.fn((name, val, opts) => {
          passwordCookies[name] = { value: val, options: opts };
        }),
      } as any;

      const mockOAuthRes = {
        cookie: jest.fn((name, val, opts) => {
          oauthCookies[name] = { value: val, options: opts };
        }),
        redirect: jest.fn(),
      } as any;

      const mockReq = {
        user: mockGoogleProfile,
        headers: {
          'user-agent': mockDeviceMeta.userAgent,
        },
        ip: mockDeviceMeta.ipAddress,
      } as any;

      // 1. Password Login
      await authController.login(
        { email: 'alex@example.com', password: 'password123' },
        mockReq,
        mockPasswordRes,
      );

      // 2. Google OAuth Callback
      await authController.googleAuthCallback(mockReq, mockOAuthRes);

      // Verify all 3 cookies are issued in both flows
      expect(mockPasswordRes.cookie).toHaveBeenCalledWith(
        ACCESS_COOKIE_NAME,
        expect.any(String),
        getAccessCookieOptions(),
      );
      expect(mockPasswordRes.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        expect.any(String),
        getRefreshCookieOptions(),
      );
      expect(mockPasswordRes.cookie).toHaveBeenCalledWith(
        CSRF_COOKIE_NAME,
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          sameSite: 'lax',
          path: '/',
        }),
      );

      expect(mockOAuthRes.cookie).toHaveBeenCalledWith(
        ACCESS_COOKIE_NAME,
        expect.any(String),
        getAccessCookieOptions(),
      );
      expect(mockOAuthRes.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        expect.any(String),
        getRefreshCookieOptions(),
      );
      expect(mockOAuthRes.cookie).toHaveBeenCalledWith(
        CSRF_COOKIE_NAME,
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          sameSite: 'lax',
          path: '/',
        }),
      );

      // Verify cookie option parity
      expect(oauthCookies[ACCESS_COOKIE_NAME].options).toEqual(
        passwordCookies[ACCESS_COOKIE_NAME].options,
      );
      expect(oauthCookies[REFRESH_COOKIE_NAME].options).toEqual(
        passwordCookies[REFRESH_COOKIE_NAME].options,
      );
      expect(oauthCookies[CSRF_COOKIE_NAME].options).toEqual(
        passwordCookies[CSRF_COOKIE_NAME].options,
      );
    });
  });

  describe('3. /auth/me immediate success & JWT Strategy extraction', () => {
    it('/auth/me succeeds immediately using access token cookie issued by OAuth', async () => {
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        iat: Math.floor(Date.now() / 1000),
      };

      const user = await jwtStrategy.validate(payload);

      expect(user).toEqual({
        id: mockUser.id,
        fullName: mockUser.fullName,
        email: mockUser.email,
      });
      expect(usersService.findById).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('4. Token Expiry & /auth/refresh Rotation Continuity', () => {
    it('after access-token expiry, /auth/refresh rotates session and issues new access token & cookies', async () => {
      const rawOldRefreshToken = sessionService.generateRawRefreshToken();
      const oldHash = sessionService.hashRefreshToken(rawOldRefreshToken);

      const dbSession = {
        id: 'ses-persist-100',
        userId: mockUser.id,
        refreshTokenHash: oldHash,
        deviceName: 'Chrome on Linux',
        deviceType: 'Desktop',
        browser: 'Chrome',
        operatingSystem: 'Linux',
        ipAddress: '127.0.0.1',
        userAgent: 'Chrome',
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 86400000),
        revokedAt: null,
        createdAt: new Date(),
        user: mockUser,
      };

      (prisma.userSession.findUnique as jest.Mock).mockResolvedValue(dbSession);
      (prisma.userSession.update as jest.Mock).mockImplementation(({ data }) =>
        Promise.resolve({ ...dbSession, ...data }),
      );

      const refreshedCookies: Record<string, any> = {};
      const mockRefreshRes = {
        cookie: jest.fn((name, val, opts) => {
          refreshedCookies[name] = { value: val, options: opts };
        }),
      } as any;

      const mockRefreshReq = {
        cookies: {
          [REFRESH_COOKIE_NAME]: rawOldRefreshToken,
        },
      } as any;

      const refreshResult = await authController.refresh(
        mockRefreshReq,
        mockRefreshRes,
      );

      expect(refreshResult.accessToken).toBe('signed_jwt_access_token_123');
      expect(refreshResult.refreshToken).toBeDefined();
      expect(refreshResult.refreshToken).not.toBe(rawOldRefreshToken);

      // Verify cookies are updated on refresh response
      expect(mockRefreshRes.cookie).toHaveBeenCalledWith(
        ACCESS_COOKIE_NAME,
        refreshResult.accessToken,
        getAccessCookieOptions(),
      );
      expect(mockRefreshRes.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        refreshResult.refreshToken,
        getRefreshCookieOptions(),
      );

      // Verify /auth/me succeeds with newly rotated token payload
      const refreshedPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        iat: Math.floor(Date.now() / 1000),
      };
      const userAfterRefresh = await jwtStrategy.validate(refreshedPayload);
      expect(userAfterRefresh.id).toBe(mockUser.id);
    });
  });

  describe('5. OAuth Guest Session Claiming Continuity', () => {
    it('OAuth-authenticated user successfully claims guest understanding session', async () => {
      // 1. Establish session via OAuth
      const { accessToken } =
        await googleAuthService.resolveAndAuthenticateGoogleUser(
          mockGoogleProfile,
          mockDeviceMeta,
        );
      expect(accessToken).toBe('signed_jwt_access_token_123');

      // 2. Claim guest session held prior to OAuth redirect
      (prisma.guestSession.findUnique as jest.Mock).mockResolvedValue(
        mockGuestSession,
      );
      (prisma.understandingJob.findUnique as jest.Mock).mockResolvedValue(
        mockJob,
      );
      (prisma.domain.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.domain.create as jest.Mock).mockResolvedValue({
        id: 'dom-user-claimed',
        userId: mockUser.id,
        domainName: 'stripe.com',
      });

      const claimResult = await guestService.claimGuestSession(
        mockUser.id,
        'gst_tok_session_123',
      );

      expect(claimResult.success).toBe(true);
      expect(claimResult.domainName).toBe('stripe.com');
      expect(claimResult.jobId).toBe('job-gst-100');

      expect(prisma.understandingJob.update).toHaveBeenCalledWith({
        where: { id: 'job-gst-100' },
        data: { domainId: 'dom-user-claimed' },
      });
      expect(prisma.guestSession.update).toHaveBeenCalledWith({
        where: { id: 'ses-guest-100' },
        data: { status: GuestSessionStatus.CONVERTED },
      });
    });
  });
});
