import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserAccountStatus } from '@prisma/client';
import { UserSessionService } from './user-session.service';
import { GoogleAuthService } from './google-auth.service';
import { OAuthIdentityResolver } from '../resolvers/oauth-identity.resolver';

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;
  let identityResolver: jest.Mocked<OAuthIdentityResolver>;
  let sessionService: jest.Mocked<UserSessionService>;

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

    const mockSessionSvc = {
      createSession: jest.fn().mockResolvedValue({
        session: {} as any,
        rawRefreshToken: 'raw_google_refresh_token',
      }),
    };

    const mockJwt = {
      signAsync: jest.fn().mockResolvedValue('jwt_access_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleAuthService,
        { provide: OAuthIdentityResolver, useValue: mockResolver },
        { provide: UserSessionService, useValue: mockSessionSvc },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<GoogleAuthService>(GoogleAuthService);
    identityResolver = module.get(OAuthIdentityResolver);
    sessionService = module.get(UserSessionService);
  });

  it('should authenticate user resolved by OAuthIdentityResolver and issue session', async () => {
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
    expect(sessionService.createSession).toHaveBeenCalledWith('usr-google-1', mockDeviceMeta);
    expect(result.accessToken).toBe('jwt_access_token');
    expect(result.refreshToken).toBe('raw_google_refresh_token');
  });
});
