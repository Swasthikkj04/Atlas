import { Test, TestingModule } from '@nestjs/testing';
import { UserAccountStatus } from '@prisma/client';
import { GoogleAuthService } from './google-auth.service';
import { AuthService } from './auth.service';
import { OAuthIdentityResolver } from '../resolvers/oauth-identity.resolver';

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;
  let identityResolver: jest.Mocked<OAuthIdentityResolver>;
  let authService: jest.Mocked<AuthService>;

  const mockGoogleProfile = {
    googleId: 'google_sub_999',
    email: 'google@example.com',
    fullName: 'Google User',
    avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
  };

  const mockDeviceMeta = {
    browser: 'Chrome',
    operatingSystem: 'Linux',
    deviceType: 'Desktop',
    deviceName: 'Chrome on Linux',
  };

  const mockUser = {
    id: 'usr-google-1',
    email: 'google@example.com',
    fullName: 'Google User',
    passwordHash: null,
    avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
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
        refreshToken: 'raw_google_refresh_token',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleAuthService,
        { provide: OAuthIdentityResolver, useValue: mockResolver },
        { provide: AuthService, useValue: mockAuthSvc },
      ],
    }).compile();

    service = module.get<GoogleAuthService>(GoogleAuthService);
    identityResolver = module.get(OAuthIdentityResolver);
    authService = module.get(AuthService);
  });

  it('should authenticate user resolved by OAuthIdentityResolver and issue session via canonical establishSession', async () => {
    const result = await service.resolveAndAuthenticateGoogleUser(
      mockGoogleProfile,
      mockDeviceMeta,
    );

    expect(identityResolver.resolveUser).toHaveBeenCalledWith({
      provider: 'GOOGLE',
      providerUserId: 'google_sub_999',
      email: 'google@example.com',
      fullName: 'Google User',
      avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
    });
    expect(authService.establishSession).toHaveBeenCalledWith(
      mockUser,
      mockDeviceMeta,
    );
    expect(result.accessToken).toBe('jwt_access_token');
    expect(result.refreshToken).toBe('raw_google_refresh_token');
  });
});
