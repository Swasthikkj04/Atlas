import { Test, TestingModule } from '@nestjs/testing';
import { OAuthProvider, UserAccountStatus } from '@prisma/client';
import { AuthService } from './services/auth.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from './services/password.service';
import { VerificationTokenService } from './services/verification-token.service';
import { PasswordResetTokenService } from './services/password-reset-token.service';
import { AccountReactivationTokenService } from './services/account-reactivation-token.service';
import { UserSessionService } from './services/user-session.service';
import { OAuthAccountService } from './services/oauth-account.service';
import { OAuthIdentityResolver } from './resolvers/oauth-identity.resolver';
import { EmailService } from '../../infrastructure/email/email.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AUTH-EMAIL-001: Personal Welcome Email Invariants & Delivery Tests', () => {
  let authService: AuthService;
  let oauthResolver: OAuthIdentityResolver;
  let emailService: jest.Mocked<EmailService>;
  let usersService: jest.Mocked<UsersService>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<VerificationTokenService>;
  let prisma: jest.Mocked<PrismaService>;
  let oauthAccountService: jest.Mocked<OAuthAccountService>;

  const mockNewUser = {
    id: 'usr-welcome-001',
    email: 'newuser@argonion.com',
    fullName: 'Jane Developer',
    passwordHash: 'hashed_pw',
    avatarUrl: null,
    lastLoginAt: null,
    status: UserAccountStatus.PENDING_VERIFICATION,
    emailVerifiedAt: null,
    tokenInvalidatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockActiveUser = {
    ...mockNewUser,
    id: 'usr-active-002',
    email: 'active@argonion.com',
    status: UserAccountStatus.ACTIVE,
    emailVerifiedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      emailDeliveryRecord: {
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const mockEmail = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetConfirmationEmail: jest
        .fn()
        .mockResolvedValue(undefined),
      sendAccountReactivationEmail: jest.fn().mockResolvedValue(undefined),
      sendWelcomeEmail: jest.fn().mockResolvedValue({ status: 'SENT' }),
    };

    const mockUsers = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const mockPassword = {
      hash: jest.fn().mockResolvedValue('hashed_pw'),
      verify: jest.fn().mockResolvedValue(true),
    };

    const mockToken = {
      issueVerificationToken: jest
        .fn()
        .mockResolvedValue('raw_verification_token'),
      findValidTokenByRaw: jest.fn(),
      markTokenConsumed: jest.fn(),
    };

    const mockResetToken = {
      issueResetToken: jest.fn().mockResolvedValue('raw_reset_token'),
      findValidTokenByRaw: jest.fn(),
      markTokenConsumed: jest.fn(),
      invalidateUserTokens: jest.fn(),
    };

    const mockReactivationToken = {
      issueReactivationToken: jest
        .fn()
        .mockResolvedValue('raw_reactivation_token'),
      findValidTokenByRaw: jest.fn(),
      markTokenConsumed: jest.fn(),
    };

    const mockSession = {
      createSession: jest.fn().mockResolvedValue({
        session: { id: 'sess-1' },
        rawRefreshToken: 'refresh_tok_1',
      }),
      rotateSession: jest.fn().mockResolvedValue({
        session: { id: 'sess-2' },
        newRawRefreshToken: 'refresh_tok_2',
        user: mockActiveUser,
      }),
      revokeSessionByRawToken: jest.fn(),
      revokeSessionById: jest.fn(),
      revokeAllUserSessions: jest.fn(),
      revokeAllOtherSessions: jest.fn(),
      getUserSessions: jest.fn().mockResolvedValue([]),
    };

    const mockOAuthAccount = {
      findAccount: jest.fn(),
      createAccount: jest.fn(),
      findByUserId: jest.fn(),
      getProvidersForUser: jest.fn().mockResolvedValue({ providers: [] }),
    };

    const mockJwt = {
      signAsync: jest.fn().mockResolvedValue('mock_jwt_access_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        OAuthIdentityResolver,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsers },
        { provide: PasswordService, useValue: mockPassword },
        { provide: VerificationTokenService, useValue: mockToken },
        { provide: PasswordResetTokenService, useValue: mockResetToken },
        {
          provide: AccountReactivationTokenService,
          useValue: mockReactivationToken,
        },
        { provide: UserSessionService, useValue: mockSession },
        { provide: OAuthAccountService, useValue: mockOAuthAccount },
        { provide: EmailService, useValue: mockEmail },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    oauthResolver = module.get<OAuthIdentityResolver>(OAuthIdentityResolver);
    emailService = module.get(EmailService);
    usersService = module.get(UsersService);
    passwordService = module.get(PasswordService);
    tokenService = module.get(VerificationTokenService);
    prisma = module.get(PrismaService);
    oauthAccountService = module.get(OAuthAccountService);
  });

  describe('First-time Account Creation Triggers', () => {
    it('Scenario 1: Triggers welcome email on first-time email/password registration', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockNewUser);

      const result = await authService.register({
        fullName: 'Jane Developer',
        email: 'newuser@argonion.com',
        password: 'Password#2026!Secure',
        confirmPassword: 'Password#2026!Secure',
      });

      expect(result.user.id).toBe('usr-welcome-001');
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'newuser@argonion.com',
        'raw_verification_token',
        'Jane Developer',
      );
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'usr-welcome-001',
        'newuser@argonion.com',
        'Jane Developer',
      );
    });

    it('Scenario 2: Triggers welcome email on first-time Google OAuth account creation (Case D)', async () => {
      oauthAccountService.findAccount.mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        ...mockActiveUser,
        id: 'usr-google-999',
        email: 'googleuser@argonion.com',
        fullName: 'Google User',
      });

      const result = await oauthResolver.resolveUser({
        provider: OAuthProvider.GOOGLE,
        providerUserId: 'google-sub-123',
        email: 'googleuser@argonion.com',
        fullName: 'Google User',
        avatarUrl: 'https://lh3.googleusercontent.com/avatar.jpg',
      });

      expect(result.event).toBe('GOOGLE_ACCOUNT_CREATED');
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'usr-google-999',
        'googleuser@argonion.com',
        'Google User',
      );
    });

    it('Scenario 3: Triggers welcome email on first-time GitHub OAuth account creation (Case D)', async () => {
      oauthAccountService.findAccount.mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        ...mockActiveUser,
        id: 'usr-github-888',
        email: 'githubuser@argonion.com',
        fullName: 'GitHub Dev',
      });

      const result = await oauthResolver.resolveUser({
        provider: OAuthProvider.GITHUB,
        providerUserId: 'github-sub-456',
        email: 'githubuser@argonion.com',
        fullName: 'GitHub Dev',
      });

      expect(result.event).toBe('GOOGLE_ACCOUNT_CREATED');
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'usr-github-888',
        'githubuser@argonion.com',
        'GitHub Dev',
      );
    });
  });

  describe('Strict Exclusions (Must NOT trigger welcome email)', () => {
    it('Exclusion 1: Does NOT send welcome email on existing user password login', async () => {
      usersService.findByEmail.mockResolvedValue(mockActiveUser);

      await authService.login({
        email: 'active@argonion.com',
        password: 'Password#2026!Secure',
      });

      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('Exclusion 2: Does NOT send welcome email on existing OAuth user login (Case A)', async () => {
      oauthAccountService.findAccount.mockResolvedValue({
        id: 'oauth-rec-1',
        userId: mockActiveUser.id,
        user: mockActiveUser,
      } as any);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockActiveUser);

      const result = await oauthResolver.resolveUser({
        provider: OAuthProvider.GOOGLE,
        providerUserId: 'google-sub-123',
        email: 'active@argonion.com',
        fullName: 'Active User',
      });

      expect(result.event).toBe('GOOGLE_LOGIN_SUCCESS');
      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('Exclusion 3: Does NOT send welcome email on OAuth account linking to existing verified user (Case B)', async () => {
      oauthAccountService.findAccount.mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockActiveUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockActiveUser);

      const result = await oauthResolver.resolveUser({
        provider: OAuthProvider.GOOGLE,
        providerUserId: 'google-sub-456',
        email: 'active@argonion.com',
        fullName: 'Active User',
      });

      expect(result.event).toBe('GOOGLE_ACCOUNT_LINKED');
      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('Exclusion 4: Does NOT send welcome email on pending account upgrade via OAuth (Case C)', async () => {
      oauthAccountService.findAccount.mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockNewUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockActiveUser);

      const result = await oauthResolver.resolveUser({
        provider: OAuthProvider.GOOGLE,
        providerUserId: 'google-sub-789',
        email: 'newuser@argonion.com',
        fullName: 'Jane Developer',
      });

      expect(result.event).toBe('GOOGLE_ACCOUNT_LINKED');
      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('Exclusion 5: Does NOT send welcome email on password reset request', async () => {
      usersService.findByEmail.mockResolvedValue(mockActiveUser);

      await authService.forgotPassword({
        email: 'active@argonion.com',
      });

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('Exclusion 6: Does NOT send welcome email on verification resend', async () => {
      usersService.findByEmail.mockResolvedValue(mockNewUser);

      await authService.resendVerification('newuser@argonion.com');

      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });
  });

  describe('Resilience & Non-Blocking Guarantee', () => {
    it('Registration succeeds even if welcome email sending fails / throws', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockNewUser);
      emailService.sendWelcomeEmail.mockRejectedValueOnce(
        new Error('Resend network timeout'),
      );

      const result = await authService.register({
        fullName: 'Jane Developer',
        email: 'newuser@argonion.com',
        password: 'Password#2026!Secure',
        confirmPassword: 'Password#2026!Secure',
      });

      expect(result.user.id).toBe('usr-welcome-001');
      expect(result.message).toContain('Registration successful');
    });

    it('OAuth registration succeeds even if welcome email sending fails / throws', async () => {
      oauthAccountService.findAccount.mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockActiveUser);
      emailService.sendWelcomeEmail.mockRejectedValueOnce(
        new Error('Resend rate limit'),
      );

      const result = await oauthResolver.resolveUser({
        provider: OAuthProvider.GOOGLE,
        providerUserId: 'google-sub-fail',
        email: 'active@argonion.com',
        fullName: 'Jane Developer',
      });

      expect(result.event).toBe('GOOGLE_ACCOUNT_CREATED');
      expect(result.user.id).toBe(mockActiveUser.id);
    });
  });
});
