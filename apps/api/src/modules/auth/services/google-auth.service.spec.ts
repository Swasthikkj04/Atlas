import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserAccountStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { UserSessionService } from './user-session.service';
import { GoogleAuthService } from './google-auth.service';

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;
  let prisma: jest.Mocked<PrismaService>;
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
    const mockPrisma = {
      oAuthAccount: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
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
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UserSessionService, useValue: mockSessionSvc },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<GoogleAuthService>(GoogleAuthService);
    prisma = module.get(PrismaService);
    sessionService = module.get(UserSessionService);
  });

  it('should resolve and authenticate existing linked Google account', async () => {
    (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue({
      id: 'oauth-1',
      userId: 'usr-google-1',
      user: mockUser,
    });
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

    const result = await service.resolveAndAuthenticateGoogleUser(
      mockGoogleProfile,
      mockDeviceMeta,
    );

    expect(sessionService.createSession).toHaveBeenCalledWith('usr-google-1', mockDeviceMeta);
    expect(result.accessToken).toBe('jwt_access_token');
    expect(result.refreshToken).toBe('raw_google_refresh_token');
  });

  it('should link Google account to existing verified user and issue session', async () => {
    (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
    (prisma.oAuthAccount.create as jest.Mock).mockResolvedValue({});

    const result = await service.resolveAndAuthenticateGoogleUser(
      mockGoogleProfile,
      mockDeviceMeta,
    );

    expect(prisma.oAuthAccount.create).toHaveBeenCalled();
    expect(result.user.email).toBe('google@example.com');
  });

  it('should provision completely new Google user as ACTIVE with emailVerifiedAt', async () => {
    (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

    const result = await service.resolveAndAuthenticateGoogleUser(
      mockGoogleProfile,
      mockDeviceMeta,
    );

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'google@example.com',
          status: UserAccountStatus.ACTIVE,
          passwordHash: null,
        }),
      }),
    );
    expect(result.accessToken).toBe('jwt_access_token');
  });
});
