import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserAccountStatus } from '@prisma/client';
import { UserSessionService } from './user-session.service';
import { GitHubAuthService } from './github-auth.service';
import { OAuthIdentityResolver } from '../resolvers/oauth-identity.resolver';
import { JwtService } from '@nestjs/jwt';

describe('GitHubAuthService', () => {
  let service: GitHubAuthService;
  let identityResolver: jest.Mocked<OAuthIdentityResolver>;
  let sessionService: jest.Mocked<UserSessionService>;

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

    const mockSessionSvc = {
      createSession: jest.fn().mockResolvedValue({
        session: {} as any,
        rawRefreshToken: 'raw_github_refresh_token',
      }),
    };

    const mockJwt = {
      signAsync: jest.fn().mockResolvedValue('jwt_access_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitHubAuthService,
        { provide: OAuthIdentityResolver, useValue: mockResolver },
        { provide: UserSessionService, useValue: mockSessionSvc },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<GitHubAuthService>(GitHubAuthService);
    identityResolver = module.get(OAuthIdentityResolver);
    sessionService = module.get(UserSessionService);
  });

  it('should authenticate user with verified GitHub email and issue session', async () => {
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
    expect(sessionService.createSession).toHaveBeenCalledWith(
      'usr-github-1',
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
