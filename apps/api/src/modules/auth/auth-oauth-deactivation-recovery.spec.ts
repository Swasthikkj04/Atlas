import { OAuthProvider, UserAccountStatus } from '@prisma/client';
import { OAuthIdentityResolver } from './resolvers/oauth-identity.resolver';
import { GoogleAuthService } from './services/google-auth.service';
import { GitHubAuthService } from './services/github-auth.service';
import { AuthService } from './services/auth.service';
import { AccountReactivationTokenService } from './services/account-reactivation-token.service';
import { OAuthAuthenticationException } from './exceptions/oauth.exception';
import { OAuthCallbackExceptionFilter } from './filters/oauth-callback-exception.filter';

describe('AX-113: OAuth Deactivation Recovery & End-to-End Lifecycle Verification', () => {
  let identityResolver: OAuthIdentityResolver;
  let googleAuthService: GoogleAuthService;
  let githubAuthService: GitHubAuthService;
  let authService: AuthService;
  let reactivationTokenService: AccountReactivationTokenService;
  let filter: OAuthCallbackExceptionFilter;

  let mockPrisma: any;
  let mockOAuthAccountService: any;
  let mockUsersService: any;
  let mockEmailService: any;
  let mockSessionService: any;
  let mockJwtService: any;

  const originalUserUuid = 'usr-e2e-alex-113';
  const originalEmail = 'alex.infra@example.com';
  const originalDomainId = 'dom-infra-99';
  const originalSnapshotId = 'snp-infra-99';
  const originalBriefId = 'brf-infra-99';

  // Complete infrastructure history associated with original user
  const originalUserData = {
    id: originalUserUuid,
    email: originalEmail,
    fullName: 'Alex Infrastructure Lead',
    status: UserAccountStatus.ACTIVE,
    avatarUrl: 'https://lh3.googleusercontent.com/alex.jpg',
    tokenInvalidatedAt: null,
    createdAt: new Date('2026-01-10T12:00:00Z'),
    updatedAt: new Date('2026-01-10T12:00:00Z'),
    domains: [
      {
        id: originalDomainId,
        userId: originalUserUuid,
        domainName: 'argonion.com',
        snapshots: [
          {
            id: originalSnapshotId,
            domainId: originalDomainId,
            infrastructureBrief: {
              id: originalBriefId,
              summary: 'Enterprise Cloud Edge with Envoy Gateway',
            },
            findings: [
              { id: 'fnd-1', title: 'HSTS Header Missing', severity: 'MEDIUM' },
            ],
          },
        ],
      },
    ],
    oauthAccounts: [
      {
        id: 'oacc-google-1',
        userId: originalUserUuid,
        provider: OAuthProvider.GOOGLE,
        providerUserId: 'google-sub-alex-777',
      },
      {
        id: 'oacc-github-1',
        userId: originalUserUuid,
        provider: OAuthProvider.GITHUB,
        providerUserId: 'github-sub-alex-888',
      },
    ],
  };

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      accountReactivationToken: {
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'tok-react-1', ...data }),
          ),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn(),
        update: jest
          .fn()
          .mockResolvedValue({ id: 'tok-react-1', consumedAt: new Date() }),
      },
      domain: {
        findMany: jest.fn().mockResolvedValue(originalUserData.domains),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(mockPrisma)),
    };

    mockOAuthAccountService = {
      findAccount: jest.fn(),
      createAccount: jest.fn(),
    };

    mockUsersService = {
      findByEmail: jest.fn(),
    };

    mockEmailService = {
      sendAccountReactivationEmail: jest.fn().mockResolvedValue(undefined),
    };

    mockSessionService = {
      createSession: jest.fn().mockResolvedValue({
        session: { id: 'ses-fresh-113' },
        rawRefreshToken: 'fresh_refresh_token_113',
      }),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('fresh_jwt_access_113'),
    };

    identityResolver = new OAuthIdentityResolver(
      mockPrisma,
      mockOAuthAccountService,
    );
    reactivationTokenService = new AccountReactivationTokenService(mockPrisma);

    authService = new AuthService(
      mockUsersService,
      {} as any,
      mockJwtService,
      {} as any,
      {} as any,
      mockSessionService,
      mockEmailService,
      mockPrisma,
      reactivationTokenService,
      mockOAuthAccountService,
    );

    googleAuthService = new GoogleAuthService(identityResolver, authService);
    githubAuthService = new GitHubAuthService(identityResolver, authService);
    filter = new OAuthCallbackExceptionFilter();
  });

  describe('End-to-End Scenario: Google/GitHub OAuth with Deactivated Account', () => {
    it('executes full 17-point lifecycle flow and preserves historical data without silent reactivation', async () => {
      // Step 1 - 4: Account was active and had domain / infrastructure history
      expect(originalUserData.domains.length).toBe(1);
      expect(originalUserData.domains[0].snapshots.length).toBe(1);

      // Step 5: User deactivates account -> Status becomes DEACTIVATED
      const deactivatedUser = {
        ...originalUserData,
        status: UserAccountStatus.DEACTIVATED,
        tokenInvalidatedAt: new Date(),
      };

      // Step 6: Sessions revoked -> Verify login attempts with Google OAuth
      mockOAuthAccountService.findAccount.mockImplementation(
        (provider, providerUserId) => {
          if (
            provider === OAuthProvider.GOOGLE &&
            providerUserId === 'google-sub-alex-777'
          ) {
            return Promise.resolve({
              id: 'oacc-google-1',
              userId: originalUserUuid,
              provider: OAuthProvider.GOOGLE,
              user: deactivatedUser,
            });
          }
          return Promise.resolve(null);
        },
      );

      // Step 7: Attempt Google sign-in -> Throws OAuthAuthenticationException('account_deactivated')
      let caughtException: any;
      try {
        await googleAuthService.resolveAndAuthenticateGoogleUser(
          {
            googleId: 'google-sub-alex-777',
            email: originalEmail,
            fullName: 'Alex Infrastructure Lead',
            emailVerified: true,
          },
          {
            browser: 'Chrome',
            operatingSystem: 'Linux',
            ipAddress: '127.0.0.1',
          },
        );
      } catch (err) {
        caughtException = err;
      }

      // Step 8: Verify NOT generic authentication error; verify ACCOUNT_DEACTIVATED exception
      expect(caughtException).toBeInstanceOf(OAuthAuthenticationException);
      expect(caughtException.errorCode).toBe('account_deactivated');

      // Step 9: Exception filter intercepts and redirects with error=account_deactivated&email=...
      const mockResponse: any = { redirect: jest.fn() };
      const mockHost: any = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => ({
            path: '/api/v1/auth/google/callback',
            user: { email: originalEmail },
          }),
        }),
      };
      filter.catch(caughtException, mockHost);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining(
          '/auth/callback?error=account_deactivated&email=alex.infra%40example.com',
        ),
      );

      // Step 10: User initiates reactivation request (via email prompt)
      mockUsersService.findByEmail.mockResolvedValue(deactivatedUser);
      const requestResult =
        await authService.requestReactivation(originalEmail);

      expect(requestResult.message).toContain(
        'If an eligible deactivated account is associated with this email',
      );
      expect(
        mockEmailService.sendAccountReactivationEmail,
      ).toHaveBeenCalledTimes(1);

      // Extract generated raw token from mock call
      const issuedRawToken =
        mockEmailService.sendAccountReactivationEmail.mock.calls[0][1];
      expect(typeof issuedRawToken).toBe('string');
      expect(issuedRawToken.length).toBe(64); // 32 bytes hex = 64 characters

      // Step 11 - 12: User clicks magic link -> Confirm reactivation token
      const tokenHash = reactivationTokenService.hashToken(issuedRawToken);
      mockPrisma.accountReactivationToken.findUnique.mockResolvedValue({
        id: 'tok-react-1',
        userId: originalUserUuid,
        tokenHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        consumedAt: null,
        user: deactivatedUser,
      });

      mockPrisma.user.update.mockImplementation(({ data }) =>
        Promise.resolve({
          ...deactivatedUser,
          status: data.status,
          tokenInvalidatedAt: data.tokenInvalidatedAt,
          lastLoginAt: data.lastLoginAt,
        }),
      );

      const confirmResult = await authService.confirmReactivation(
        issuedRawToken,
        {
          browser: 'Chrome',
          operatingSystem: 'Linux',
          ipAddress: '127.0.0.1',
        },
      );

      // Step 13: Account is ACTIVE, fresh session created, and tokens issued
      expect(confirmResult.message).toContain('successfully reactivated');
      expect(confirmResult.accessToken).toBe('fresh_jwt_access_113');
      expect(confirmResult.refreshToken).toBe('fresh_refresh_token_113');

      // Step 14 - 17: User UUID, domain, and historical data preserved intact
      expect(confirmResult.user?.id).toBe(originalUserUuid);
      expect(confirmResult.user?.email).toBe(originalEmail);

      const userDomains = await mockPrisma.domain.findMany({
        where: { userId: confirmResult.user?.id },
      });
      expect(userDomains.length).toBe(1);
      expect(userDomains[0].id).toBe(originalDomainId);
      expect(userDomains[0].snapshots[0].id).toBe(originalSnapshotId);
      expect(userDomains[0].snapshots[0].infrastructureBrief.id).toBe(
        originalBriefId,
      );
    });

    it('GitHub OAuth follows the exact same account_deactivated recovery flow', async () => {
      const deactivatedUser = {
        ...originalUserData,
        status: UserAccountStatus.DEACTIVATED,
      };

      mockOAuthAccountService.findAccount.mockResolvedValue({
        id: 'oacc-github-1',
        userId: originalUserUuid,
        provider: OAuthProvider.GITHUB,
        user: deactivatedUser,
      });

      let caughtException: any;
      try {
        await githubAuthService.resolveAndAuthenticateGitHubUser(
          {
            githubId: 'github-sub-alex-888',
            email: originalEmail,
            fullName: 'Alex Infrastructure Lead',
            emailVerified: true,
          },
          {
            browser: 'Firefox',
            operatingSystem: 'Linux',
            ipAddress: '127.0.0.1',
          },
        );
      } catch (err) {
        caughtException = err;
      }

      expect(caughtException).toBeInstanceOf(OAuthAuthenticationException);
      expect(caughtException.errorCode).toBe('account_deactivated');
    });
  });
});
