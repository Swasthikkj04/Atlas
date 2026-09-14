import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuthProvider, UserAccountStatus } from '@prisma/client';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { EmailService } from '../../../infrastructure/email/email.service';
import { PasswordService } from './password.service';
import { VerificationTokenService } from './verification-token.service';
import { PasswordResetTokenService } from './password-reset-token.service';
import { UserSessionService } from './user-session.service';
import { OAuthAccountService } from './oauth-account.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<VerificationTokenService>;
  let resetTokenService: jest.Mocked<PasswordResetTokenService>;
  let sessionService: jest.Mocked<UserSessionService>;
  let oauthAccountService: jest.Mocked<OAuthAccountService>;
  let emailService: jest.Mocked<EmailService>;
  let prisma: jest.Mocked<PrismaService>;

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
      hashToken: jest.fn().mockReturnValue('mock_sha256_hash'),
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
      revokeAllOtherSessions: jest.fn().mockResolvedValue(undefined),
      hashRefreshToken: jest.fn().mockReturnValue('mock_hashed_refresh_token'),
      getUserSessions: jest.fn().mockResolvedValue([]),
    };

    const mockEmail = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetConfirmationEmail: jest
        .fn()
        .mockResolvedValue(undefined),
      sendWelcomeEmail: jest.fn().mockResolvedValue({ status: 'SENT' }),
    };

    const mockPrisma = {
      user: {
        update: jest.fn().mockResolvedValue(mockUser),
      },
      verificationToken: {
        findUnique: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      }),
    };

    const mockOAuthAccountSvc = {
      getProvidersForUser: jest.fn().mockResolvedValue({
        providers: [
          {
            provider: 'google',
            name: 'Google',
            connected: true,
            accountLabel: 'u••••r@example.com',
            canDisconnect: true,
          },
          {
            provider: 'github',
            name: 'GitHub',
            connected: false,
            accountLabel: null,
            canDisconnect: false,
          },
        ],
      }),
      disconnectProvider: jest.fn().mockResolvedValue({
        message: 'Google account disconnected successfully.',
      }),
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
        { provide: OAuthAccountService, useValue: mockOAuthAccountSvc },
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
    oauthAccountService = module.get(OAuthAccountService);
    emailService = module.get(EmailService);
    prisma = module.get(PrismaService);
  });

  it('should register a new user in PENDING_VERIFICATION status when passwords match', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    passwordService.hash.mockResolvedValue('hashed_pw');
    usersService.create.mockResolvedValue({
      ...mockUser,
      status: UserAccountStatus.PENDING_VERIFICATION,
    });

    const result = await service.register({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'Nebula#2026!Atlas',
      confirmPassword: 'Nebula#2026!Atlas',
    });

    expect(passwordService.hash).toHaveBeenCalledWith('Nebula#2026!Atlas');
    expect(usersService.create).toHaveBeenCalledWith({
      fullName: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashed_pw',
    });
    expect(tokenService.issueVerificationToken).toHaveBeenCalledWith('usr-123');
    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
      'usr-123',
      'test@example.com',
      'Test User',
    );
    expect(result.message).toContain('Please check your email');
  });

  it('should reject registration when password violates canonical password policy', async () => {
    await expect(
      service.register({
        fullName: 'Test User',
        email: 'test@example.com',
        password: '12345678',
        confirmPassword: '12345678',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject registration with BadRequestException when passwords do not match', async () => {
    await expect(
      service.register({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'differentPassword456',
      }),
    ).rejects.toThrow(new BadRequestException('Passwords do not match.'));

    expect(usersService.findByEmail).not.toHaveBeenCalled();
    expect(passwordService.hash).not.toHaveBeenCalled();
    expect(usersService.create).not.toHaveBeenCalled();
    expect(tokenService.issueVerificationToken).not.toHaveBeenCalled();
  });

  it('should establish canonical stateful session and sign access JWT', async () => {
    const session = await service.establishSession(mockUser, mockDeviceMeta);

    expect(sessionService.createSession).toHaveBeenCalledWith(
      'usr-123',
      mockDeviceMeta,
    );
    expect(session.accessToken).toBe('jwt_token');
    expect(session.refreshToken).toBe('raw_refresh_token_999');
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
    (service as any).prisma.verificationToken.findUnique.mockResolvedValue({
      id: 'token-123',
      userId: 'usr-123',
      tokenHash: 'mock_sha256_hash',
      consumedAt: null,
      expiresAt: new Date(Date.now() + 100000),
      createdAt: new Date(),
      user: { ...mockUser, status: UserAccountStatus.PENDING_VERIFICATION },
    });

    const result = await service.verifyEmail('raw_valid_token', mockDeviceMeta);

    expect(sessionService.createSession).toHaveBeenCalledWith(
      'usr-123',
      mockDeviceMeta,
    );
    expect(result.status).toBe(UserAccountStatus.ACTIVE);
    expect(result.alreadyVerified).toBe(false);
    expect(result.accessToken).toBe('jwt_token');
    expect(result.refreshToken).toBe('raw_refresh_token_999');
    expect(result.user?.id).toBe('usr-123');
    expect(result.user?.fullName).toBe('Test User');
    expect(result.user?.email).toBe('test@example.com');
  });

  it('should handle already-verified active accounts gracefully without error', async () => {
    (service as any).prisma.verificationToken.findUnique.mockResolvedValue({
      id: 'token-123',
      userId: 'usr-123',
      tokenHash: 'mock_sha256_hash',
      consumedAt: new Date(),
      expiresAt: new Date(Date.now() + 100000),
      createdAt: new Date(),
      user: { ...mockUser, status: UserAccountStatus.ACTIVE },
    });

    const result = await service.verifyEmail('raw_valid_token', mockDeviceMeta);

    expect(result.status).toBe(UserAccountStatus.ACTIVE);
    expect(result.alreadyVerified).toBe(true);
    expect(result.message).toBe('Your email is already verified.');
  });

  it('should reject email verification when token is expired', async () => {
    (service as any).prisma.verificationToken.findUnique.mockResolvedValue({
      id: 'token-123',
      userId: 'usr-123',
      tokenHash: 'mock_sha256_hash',
      consumedAt: null,
      expiresAt: new Date(Date.now() - 100000), // Expired
      createdAt: new Date(),
      user: { ...mockUser, status: UserAccountStatus.PENDING_VERIFICATION },
    });

    await expect(
      service.verifyEmail('expired_token', mockDeviceMeta),
    ).rejects.toThrow('This verification link has expired.');
  });

  it('should reject email verification with unknown or invalid token', async () => {
    (service as any).prisma.verificationToken.findUnique.mockResolvedValue(
      null,
    );

    await expect(
      service.verifyEmail('invalid_token', mockDeviceMeta),
    ).rejects.toThrow('This verification link is no longer valid.');
  });

  it('should reject email verification with empty or malformed token', async () => {
    await expect(service.verifyEmail('', mockDeviceMeta)).rejects.toThrow(
      'This verification link is no longer valid.',
    );
  });

  it('should resend verification email for pending user and issue new token', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...mockUser,
      status: UserAccountStatus.PENDING_VERIFICATION,
    });

    const result = await service.resendVerification('test@example.com');

    expect(tokenService.issueVerificationToken).toHaveBeenCalledWith('usr-123');
    expect(result.message).toContain('If a pending account exists');
  });

  it('should return anti-enumeration generic message for non-existent user on resend', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    const result = await service.resendVerification('unknown@example.com');

    expect(tokenService.issueVerificationToken).not.toHaveBeenCalled();
    expect(result.message).toContain('If a pending account exists');
  });

  it('should rotate refresh token on refresh', async () => {
    const result = await service.refresh('raw_old_refresh_token');

    expect(sessionService.rotateSession).toHaveBeenCalledWith(
      'raw_old_refresh_token',
    );
    expect(result.accessToken).toBe('jwt_token');
    expect(result.refreshToken).toBe('rotated_refresh_token_111');
  });

  it('should revoke all sessions on logout-all when no current token provided', async () => {
    const result = await service.logoutAll('usr-123');

    expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(
      'usr-123',
    );
    expect(result.message).toContain('Logged out of all sessions');
  });

  it('should revoke other sessions on logout-all while preserving current session when current token provided (AX-105)', async () => {
    const result = await service.logoutAll('usr-123', 'raw_current_token');

    expect(sessionService.hashRefreshToken).toHaveBeenCalledWith(
      'raw_current_token',
    );
    expect(sessionService.revokeAllOtherSessions).toHaveBeenCalledWith(
      'usr-123',
      'mock_hashed_refresh_token',
    );
    expect(result.message).toBe(
      'All other active sessions have been signed out.',
    );
  });

  describe('getConnectedProviders (AX-106)', () => {
    it('should delegate provider status retrieval to oauthAccountService', async () => {
      const result = await service.getConnectedProviders('usr-123');

      expect(oauthAccountService.getProvidersForUser).toHaveBeenCalledWith(
        'usr-123',
      );
      expect(result.providers).toHaveLength(2);
    });
  });

  describe('disconnectProvider (AX-106)', () => {
    it('should delegate provider disconnection to oauthAccountService', async () => {
      const result = await service.disconnectProvider(
        'usr-123',
        OAuthProvider.GOOGLE,
      );

      expect(oauthAccountService.disconnectProvider).toHaveBeenCalledWith(
        'usr-123',
        OAuthProvider.GOOGLE,
      );
      expect(result.message).toContain(
        'Google account disconnected successfully',
      );
    });
  });

  describe('forgotPassword', () => {
    it('should issue reset token and dispatch email for active user', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      resetTokenService.issueResetToken.mockResolvedValue(
        'raw_reset_token_abc',
      );

      const result = await service.forgotPassword('test@example.com');

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(resetTokenService.issueResetToken).toHaveBeenCalledWith('usr-123');
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        'raw_reset_token_abc',
        'Test User',
      );
      expect(result.message).toContain('If an account exists for this email');
    });

    it('should not issue reset token for non-existent user but return generic message (anti-enumeration)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(resetTokenService.issueResetToken).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(result.message).toContain('If an account exists for this email');
    });

    it('should not issue reset token for pending verification user but return generic message (anti-enumeration)', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        status: UserAccountStatus.PENDING_VERIFICATION,
      });

      const result = await service.forgotPassword('pending@example.com');

      expect(resetTokenService.issueResetToken).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(result.message).toContain('If an account exists for this email');
    });
  });

  describe('resetPassword', () => {
    const validMockResetToken = {
      id: 'tok-reset-1',
      userId: 'usr-123',
      tokenHash: 'hashed_token',
      expiresAt: new Date(Date.now() + 3600000),
      consumedAt: null,
      createdAt: new Date(),
      user: mockUser,
    };

    it('should reset password, hash with Argon2, revoke sessions, and send confirmation notice', async () => {
      resetTokenService.findValidTokenByRaw.mockResolvedValue(
        validMockResetToken as any,
      );
      passwordService.hash.mockResolvedValue('argon2_new_password_hash');

      const result = await service.resetPassword(
        'raw_valid_token',
        'ValidNewPass123!',
      );

      expect(resetTokenService.findValidTokenByRaw).toHaveBeenCalledWith(
        'raw_valid_token',
      );
      expect(passwordService.hash).toHaveBeenCalledWith('ValidNewPass123!');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'usr-123' },
          data: expect.objectContaining({
            passwordHash: 'argon2_new_password_hash',
          }),
        }),
      );
      expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(
        'usr-123',
      );
      expect(resetTokenService.markTokenConsumed).toHaveBeenCalledWith(
        'tok-reset-1',
      );
      expect(resetTokenService.invalidateUserTokens).toHaveBeenCalledWith(
        'usr-123',
      );
      expect(
        emailService.sendPasswordResetConfirmationEmail,
      ).toHaveBeenCalledWith('test@example.com', 'Test User');
      expect(result.message).toContain('Password has been reset successfully');
    });

    it('should reject invalid or expired reset token', async () => {
      resetTokenService.findValidTokenByRaw.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid_token', 'ValidNewPass123!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject weak password violating canonical policy', async () => {
      resetTokenService.findValidTokenByRaw.mockResolvedValue(
        validMockResetToken as any,
      );

      await expect(
        service.resetPassword('valid_token', '12345678'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
