import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserAccountStatus } from '@prisma/client';
import { GitHubAuthService } from './github-auth.service';
import { AuthService } from './auth.service';
import { OAuthIdentityResolver } from '../resolvers/oauth-identity.resolver';

describe('GitHubAuthService', () => {
  let service: GitHubAuthService;
  let identityResolver: jest.Mocked<OAuthIdentityResolver>;
  let authService: jest.Mocked<AuthService>;

  const mockGitHubProfile = {
    githubId: 'github_sub_777',
    email: 'github@example.com',
    emailVerified: true,
    fullName: 'GitHub User',
    avatarUrl: 'https://avatars.githubusercontent.com/u/777',
  };

  const mockDeviceMeta = {
    browser: 'Firefox',
    operatingSystem: 'Linux',
    deviceType: 'Desktop',
    deviceName: 'Firefox on Linux',
  };

  const mockUser = {
    id: 'usr-github-1',
    email: 'github@example.com',
    fullName: 'GitHub User',
    passwordHash: null,
    avatarUrl: 'https://avatars.githubusercontent.com/u/777',
    status: UserAccountStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    tokenInvalidatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockResolver = {
      resolveUser: jest.fn().mockResolvedValue({
        user: mockUser,
        event: 'GOOGLE_LOGIN_SUCCESS',
      }),
    };

    const mockAuthSvc = {
      establishSession: jest.fn().mockResolvedValue({
        accessToken: 'jwt_access_token',
        refreshToken: 'raw_github_refresh_token',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitHubAuthService,
        { provide: OAuthIdentityResolver, useValue: mockResolver },
        { provide: AuthService, useValue: mockAuthSvc },
      ],
    }).compile();

    service = module.get<GitHubAuthService>(GitHubAuthService);
    identityResolver = module.get(OAuthIdentityResolver);
    authService = module.get(AuthService);
  });

  it('should authenticate user with verified GitHub email and issue session via canonical establishSession', async () => {
    const result = await service.resolveAndAuthenticateGitHubUser(
      mockGitHubProfile,
      mockDeviceMeta,
    );

    expect(identityResolver.resolveUser).toHaveBeenCalledWith({
      provider: 'GITHUB',
      providerUserId: 'github_sub_777',
      email: 'github@example.com',
      fullName: 'GitHub User',
      avatarUrl: 'https://avatars.githubusercontent.com/u/777',
    });
    expect(authService.establishSession).toHaveBeenCalledWith(
      mockUser,
      mockDeviceMeta,
    );
    expect(result.accessToken).toBe('jwt_access_token');
    expect(result.refreshToken).toBe('raw_github_refresh_token');
    expect(result.event).toBe('GITHUB_LOGIN_SUCCESS');
  });

  it('should reject GitHub login gracefully if email is unverified', async () => {
    const unverifiedProfile = {
      ...mockGitHubProfile,
      emailVerified: false,
    };

    await expect(
      service.resolveAndAuthenticateGitHubUser(
        unverifiedProfile,
        mockDeviceMeta,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject GitHub login gracefully if email is missing', async () => {
    const missingEmailProfile = {
      ...mockGitHubProfile,
      email: undefined,
    };

    await expect(
      service.resolveAndAuthenticateGitHubUser(
        missingEmailProfile,
        mockDeviceMeta,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });
});

