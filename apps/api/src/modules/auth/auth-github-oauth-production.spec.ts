import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OAuthProvider,
  UserAccountStatus,
  GuestSessionStatus,
} from '@prisma/client';

import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { GoogleAuthService } from './services/google-auth.service';
import { GitHubAuthService } from './services/github-auth.service';
import { UserSessionService } from './services/user-session.service';
import { VerificationTokenService } from './services/verification-token.service';
import { PasswordResetTokenService } from './services/password-reset-token.service';
import { PasswordService } from './services/password.service';
import { OAuthIdentityResolver } from './resolvers/oauth-identity.resolver';
import { EmailService } from '../../infrastructure/email/email.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GuestUnderstandingService } from '../guest/guest-understanding.service';
import { UnderstandingEngine } from '../understanding/understanding.engine';
import { InfrastructureSnapshotService } from '../infrastructure-snapshots/services/infrastructure-snapshot.service';
import { InfrastructureFindingService } from '../infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureBriefService } from '../infrastructure-brief/services/infrastructure-brief.service';
import { GitHubProfileMapper } from './mappers/github-profile.mapper';
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  getAccessCookieOptions,
  getRefreshCookieOptions,
} from './utils/auth-cookie.util';
import { CSRF_COOKIE_NAME } from './utils/csrf.util';
import { OAuthCallbackExceptionFilter } from './filters/oauth-callback-exception.filter';
import { OAuthAuthenticationException } from './exceptions/oauth.exception';

describe('AUTH-019: GitHub OAuth Production-Grade Flow & Security Verification', () => {
  let authController: AuthController;
  let authService: AuthService;
  let githubAuthService: GitHubAuthService;
  let sessionService: UserSessionService;
  let jwtStrategy: JwtStrategy;
  let guestService: GuestUnderstandingService;
  let prisma: jest.Mocked<PrismaService>;
  let usersService: jest.Mocked<UsersService>;

  const mockGitHubProfile = {
    githubId: 'gh_usr_998877',
    email: 'octocat@github.com',
    emailVerified: true,
    fullName: 'Mona Lisa Octocat',
    avatarUrl: 'https://avatars.githubusercontent.com/u/998877',
  };

  const mockDeviceMeta = {
    browser: 'Chrome',
    operatingSystem: 'macOS',
    deviceType: 'Desktop',
    deviceName: 'Chrome on macOS',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  };

  const mockUser = {
    id: 'usr-octocat-100',
    email: 'octocat@github.com',
    fullName: 'Mona Lisa Octocat',
    passwordHash: null,
    avatarUrl: 'https://avatars.githubusercontent.com/u/998877',
    status: UserAccountStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    tokenInvalidatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      userSession: {
        findUnique: jest.fn(),
        create: jest.fn().mockImplementation((args) =>
          Promise.resolve({
            id: 'ses-github-123',
            ...args.data,
            revokedAt: null,
          }),
        ),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue(mockUser),
      },
      oAuthAccount: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      verificationToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      passwordResetToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
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
      $transaction: jest.fn().mockImplementation(async (cb) => cb(mockPrisma)),
    };

    const mockUsers = {
      findById: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn().mockResolvedValue(mockUser),
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
      sendWelcomeEmail: jest.fn().mockResolvedValue({ status: 'SENT' }),
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
              .mockResolvedValue('signed_jwt_access_token_octocat'),
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
    githubAuthService = module.get<GitHubAuthService>(GitHubAuthService);
    sessionService = module.get<UserSessionService>(UserSessionService);
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    guestService = module.get<GuestUnderstandingService>(
      GuestUnderstandingService,
    );
    prisma = module.get(PrismaService);
    usersService = module.get(UsersService);
  });

  describe('1. Profile Mapper & Verified Email Resolution', () => {
    it('selects verified primary email from GitHub profile emails array', () => {
      const rawProfile = {
        id: '123456',
        username: 'octocat',
        displayName: 'The Octocat',
        emails: [
          { value: 'unverified@octocat.com', verified: false, primary: false },
          {
            value: 'primary-verified@octocat.com',
            verified: true,
            primary: true,
          },
          {
            value: 'secondary-verified@octocat.com',
            verified: true,
            primary: false,
          },
        ],
        photos: [{ value: 'https://avatars.githubusercontent.com/u/123456' }],
      };

      const mapped = GitHubProfileMapper.map(rawProfile);
      expect(mapped.githubId).toBe('123456');
      expect(mapped.email).toBe('primary-verified@octocat.com');
      expect(mapped.emailVerified).toBe(true);
      expect(mapped.fullName).toBe('The Octocat');
    });

    it('selects secondary verified email when primary email is unverified', () => {
      const rawProfile = {
        id: '123456',
        username: 'octocat',
        displayName: 'The Octocat',
        emails: [
          {
            value: 'primary-unverified@octocat.com',
            verified: false,
            primary: true,
          },
          {
            value: 'secondary-verified@octocat.com',
            verified: true,
            primary: false,
          },
        ],
      };

      const mapped = GitHubProfileMapper.map(rawProfile);
      expect(mapped.email).toBe('secondary-verified@octocat.com');
      expect(mapped.emailVerified).toBe(true);
    });

    it('prefers real verified email over noreply address for private email GitHub users', () => {
      const rawProfile = {
        id: '123456',
        username: 'octocat',
        displayName: 'The Octocat',
        emails: [
          {
            value: '123456+octocat@users.noreply.github.com',
            verified: true,
            primary: true,
          },
          { value: 'octocat.real@gmail.com', verified: true, primary: false },
        ],
      };

      const mapped = GitHubProfileMapper.map(rawProfile);
      expect(mapped.email).toBe('octocat.real@gmail.com');
      expect(mapped.emailVerified).toBe(true);
    });

    it('falls back to verified noreply address if it is the only verified email', () => {
      const rawProfile = {
        id: '123456',
        username: 'octocat',
        displayName: 'The Octocat',
        emails: [
          {
            value: '123456+octocat@users.noreply.github.com',
            verified: true,
            primary: true,
          },
        ],
      };

      const mapped = GitHubProfileMapper.map(rawProfile);
      expect(mapped.email).toBe('123456+octocat@users.noreply.github.com');
      expect(mapped.emailVerified).toBe(true);
    });

    it('gracefully handles missing displayName by falling back to username', () => {
      const rawProfile = {
        id: '78910',
        username: 'mona-code',
        emails: [{ value: 'mona@octo.io', verified: true, primary: true }],
      };

      const mapped = GitHubProfileMapper.map(rawProfile);
      expect(mapped.fullName).toBe('mona-code');
    });

    it('rejects GitHub authentication if no verified email exists', async () => {
      const unverifiedProfile = {
        ...mockGitHubProfile,
        emailVerified: false,
      };

      await expect(
        githubAuthService.resolveAndAuthenticateGitHubUser(
          unverifiedProfile,
          mockDeviceMeta,
        ),
      ).rejects.toThrow(OAuthAuthenticationException);
    });
  });

  describe('2. Canonical Session & Cookie Parity (GitHub OAuth Callback)', () => {
    it('GitHub OAuth callback sets identical cookie names, security attributes, and redirects to /auth/callback', async () => {
      const oauthCookies: Record<string, { value: string; options: any }> = {};

      const mockOAuthRes = {
        cookie: jest.fn((name, val, opts) => {
          oauthCookies[name] = { value: val, options: opts };
        }),
        redirect: jest.fn(),
      } as any;

      const mockReq = {
        user: mockGitHubProfile,
        headers: {
          'user-agent': mockDeviceMeta.userAgent,
          'x-forwarded-for': mockDeviceMeta.ipAddress,
        },
        ip: mockDeviceMeta.ipAddress,
      } as any;

      await authController.githubAuthCallback(mockReq, mockOAuthRes);

      // Verify all 3 cookies are issued with identical options
      expect(mockOAuthRes.cookie).toHaveBeenCalledWith(
        ACCESS_COOKIE_NAME,
        'signed_jwt_access_token_octocat',
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

      // Verify redirect target is /auth/callback
      expect(mockOAuthRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth/callback'),
      );
    });
  });

  describe('3. Guest Understanding Continuity (Guest Session Claiming)', () => {
    it('GitHub authenticated user successfully claims guest understanding session and domain', async () => {
      const mockGuestSession = {
        id: 'ses-guest-100',
        sessionToken: 'gst_tok_octo_123',
        domain: 'github.com',
        understandingJobId: 'job-octo-1',
        snapshotId: 'snap-octo-1',
        claimedByUserId: null,
        status: GuestSessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000),
      };

      const mockJob = {
        id: 'job-octo-1',
        domainName: 'github.com',
        status: 'COMPLETED',
        snapshotId: 'snap-octo-1',
      };

      (prisma.guestSession.findUnique as jest.Mock).mockResolvedValue(
        mockGuestSession,
      );
      (prisma.understandingJob.findUnique as jest.Mock).mockResolvedValue(
        mockJob,
      );
      (prisma.domain.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.domain.create as jest.Mock).mockResolvedValue({
        id: 'dom-octo-1',
        domainName: 'github.com',
        userId: mockUser.id,
      });

      const claimResult = await guestService.claimGuestSession(
        mockUser.id,
        'gst_tok_octo_123',
      );

      expect(claimResult.success).toBe(true);
      expect(claimResult.domainName).toBe('github.com');
      expect(claimResult.jobId).toBe('job-octo-1');
      expect(claimResult.message).toContain('successfully claimed');
    });
  });

  describe('4. Global Session Revocation Participation (AUTH-018 Parity)', () => {
    it('GitHub session is immediately revoked when user performs password reset', async () => {
      // 1. Session created for GitHub user
      const dbSession = {
        id: 'ses-github-123',
        userId: mockUser.id,
        refreshTokenHash: 'hash-octo',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: new Date(), // Revoked by password reset
        user: mockUser,
      };

      (prisma.userSession.findUnique as jest.Mock).mockResolvedValue(dbSession);

      // 2. Validate access token -> must be rejected
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        sessionId: 'ses-github-123',
        iat: Math.floor(Date.now() / 1000),
      };

      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException(
          'Session has been revoked or expired. Please log in again.',
        ),
      );

      // 3. Refresh rotation -> must be rejected
      await expect(
        sessionService.rotateSession('raw_token_octo'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('5. OAuth Callback Exception Boundary & Error Normalization (AUTH-019-FIX)', () => {
    const filter = new OAuthCallbackExceptionFilter();

    it('redirects to /auth/callback?error=github_email_unverified on unverified email exception', () => {
      const mockRes = { redirect: jest.fn() };
      const mockHost = {
        switchToHttp: () => ({
          getRequest: () => ({
            query: {},
            path: '/api/v1/auth/github/callback',
          }),
          getResponse: () => mockRes,
        }),
      } as any;

      filter.catch(
        new OAuthAuthenticationException('github_email_unverified'),
        mockHost,
      );

      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth/callback?error=github_email_unverified'),
      );
    });

    it('redirects to /auth/callback?error=oauth_denied when user denies/cancels authorization', () => {
      const mockRes = { redirect: jest.fn() };
      const mockHost = {
        switchToHttp: () => ({
          getRequest: () => ({
            query: {
              error: 'access_denied',
              error_description: 'The user has denied your application access.',
            },
            path: '/api/v1/auth/github/callback',
          }),
          getResponse: () => mockRes,
        }),
      } as any;

      filter.catch(new Error('access_denied'), mockHost);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth/callback?error=oauth_denied'),
      );
    });

    it('redirects to /auth/callback?error=oauth_provider_error on unexpected provider error', () => {
      const mockRes = { redirect: jest.fn() };
      const mockHost = {
        switchToHttp: () => ({
          getRequest: () => ({
            query: { error: 'server_error' },
            path: '/api/v1/auth/github/callback',
          }),
          getResponse: () => mockRes,
        }),
      } as any;

      filter.catch(new Error('GitHub internal server error'), mockHost);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth/callback?error=oauth_provider_error'),
      );
    });

    it('redirects to /auth/callback?error=oauth_authentication_failed as safe fallback for unknown exceptions', () => {
      const mockRes = { redirect: jest.fn() };
      const mockHost = {
        switchToHttp: () => ({
          getRequest: () => ({
            query: {},
            path: '/api/v1/auth/github/callback',
          }),
          getResponse: () => mockRes,
        }),
      } as any;

      filter.catch('unknown_fatal_string_error', mockHost);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining(
          '/auth/callback?error=oauth_authentication_failed',
        ),
      );
    });
  });
});
