import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserAccountStatus } from '@prisma/client';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { EmailService } from '../../../infrastructure/email/email.service';
import { PasswordService } from './password.service';
import { VerificationTokenService } from './verification-token.service';
import { PasswordResetTokenService } from './password-reset-token.service';
import { UserSessionService } from './user-session.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<VerificationTokenService>;
  let resetTokenService: jest.Mocked<PasswordResetTokenService>;
  let sessionService: jest.Mocked<UserSessionService>;

  const mockUser = {
    id: 'usr-123',
    email: 'test@example.com',
    fullName: 'Test User',
    passwordHash: 'hashed_pw',
    status: UserAccountStatus.ACTIVE,
    emailVerifiedAt: new Date(),
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

  beforeEach(async () => {
    const mockUsers = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    const mockPassword = {
      hash: jest.fn(),
      verify: jest.fn(),
    };

    const mockJwt = {
      signAsync: jest.fn().mockResolvedValue('jwt_token'),
    };

    const mockTokenSvc = {
      issueVerificationToken: jest.fn().mockResolvedValue('raw_token_123'),
      findValidTokenByRaw: jest.fn(),
      markTokenConsumed: jest.fn().mockResolvedValue(undefined),
    };

    const mockResetTokenSvc = {
      issueResetToken: jest.fn().mockResolvedValue('raw_reset_token_777'),
      findValidTokenByRaw: jest.fn(),
      markTokenConsumed: jest.fn().mockResolvedValue(undefined),
      invalidateUserTokens: jest.fn().mockResolvedValue(undefined),
    };

    const mockSessionSvc = {
      createSession: jest.fn().mockResolvedValue({
        session: {} as any,
        rawRefreshToken: 'raw_refresh_token_999',
      }),
      rotateSession: jest.fn().mockResolvedValue({
        session: {} as any,
        newRawRefreshToken: 'rotated_refresh_token_111',
        user: mockUser,
      }),
      revokeSessionByRawToken: jest.fn().mockResolvedValue(undefined),
      revokeSessionById: jest.fn().mockResolvedValue(undefined),
      revokeAllUserSessions: jest.fn().mockResolvedValue(undefined),
      getUserSessions: jest.fn().mockResolvedValue([]),
    };

    const mockEmail = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetConfirmationEmail: jest
        .fn()
        .mockResolvedValue(undefined),
    };

    const mockPrisma = {
      user: {
        update: jest.fn().mockResolvedValue(mockUser),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsers },
        { provide: PasswordService, useValue: mockPassword },
        { provide: JwtService, useValue: mockJwt },
        { provide: VerificationTokenService, useValue: mockTokenSvc },
        { provide: PasswordResetTokenService, useValue: mockResetTokenSvc },
        { provide: UserSessionService, useValue: mockSessionSvc },
        { provide: EmailService, useValue: mockEmail },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    passwordService = module.get(PasswordService);
    tokenService = module.get(VerificationTokenService);
    resetTokenService = module.get(PasswordResetTokenService);
    sessionService = module.get(UserSessionService);
  });

  it('should register a new user in PENDING_VERIFICATION status', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    passwordService.hash.mockResolvedValue('hashed_pw');
    usersService.create.mockResolvedValue({
      ...mockUser,
      status: UserAccountStatus.PENDING_VERIFICATION,
    });

    const result = await service.register({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(tokenService.issueVerificationToken).toHaveBeenCalledWith('usr-123');
    expect(result.message).toContain('Please check your email');
  });

  it('should allow login for ACTIVE verified users and issue stateful session token', async () => {
    usersService.findByEmail.mockResolvedValue(mockUser);
    passwordService.verify.mockResolvedValue(true);

    const result = await service.login(
      { email: 'test@example.com', password: 'password123' },
      mockDeviceMeta,
    );

    expect(sessionService.createSession).toHaveBeenCalledWith(
      'usr-123',
      mockDeviceMeta,
    );
    expect(result.accessToken).toBe('jwt_token');
    expect(result.refreshToken).toBe('raw_refresh_token_999');
  });

  it('should verify email, activate account, and immediately establish authenticated session (AUTH-004)', async () => {
    tokenService.findValidTokenByRaw.mockResolvedValue({
      id: 'token-123',
      userId: 'usr-123',
      tokenHash: 'hash-123',
      consumedAt: null,
      expiresAt: new Date(Date.now() + 100000),
      createdAt: new Date(),
      user: mockUser,
    } as any);

    const result = await service.verifyEmail('raw_valid_token', mockDeviceMeta);

    expect(tokenService.markTokenConsumed).toHaveBeenCalledWith('token-123');
    expect(sessionService.createSession).toHaveBeenCalledWith(
      'usr-123',
      mockDeviceMeta,
    );
    expect(result.status).toBe(UserAccountStatus.ACTIVE);
    expect(result.accessToken).toBe('jwt_token');
    expect(result.refreshToken).toBe('raw_refresh_token_999');
    expect(result.user?.id).toBe('usr-123');
    expect(result.user?.fullName).toBe('Test User');
    expect(result.user?.email).toBe('test@example.com');
  });

  it('should reject email verification with invalid or expired token', async () => {
    tokenService.findValidTokenByRaw.mockResolvedValue(null);

    await expect(
      service.verifyEmail('invalid_token', mockDeviceMeta),
    ).rejects.toThrow(BadRequestException);
  });

  it('should rotate refresh token on refresh', async () => {
    const result = await service.refresh('raw_old_refresh_token');

    expect(sessionService.rotateSession).toHaveBeenCalledWith(
      'raw_old_refresh_token',
    );
    expect(result.accessToken).toBe('jwt_token');
    expect(result.refreshToken).toBe('rotated_refresh_token_111');
  });

  it('should revoke all sessions on logout-all', async () => {
    const result = await service.logoutAll('usr-123');

    expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(
      'usr-123',
    );
    expect(result.message).toContain('Logged out of all sessions');
  });
});
