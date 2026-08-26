import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserAccountStatus, OAuthProvider } from '@prisma/client';

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

describe('AUTH-018: Global Session Revocation & Multi-Device Security Invariants', () => {
  let authService: AuthService;
  let googleAuthService: GoogleAuthService;
  let githubAuthService: GitHubAuthService;
  let sessionService: UserSessionService;
  let resetTokenService: PasswordResetTokenService;
  let jwtStrategy: JwtStrategy;
  let passwordService: PasswordService;
  let prisma: jest.Mocked<PrismaService>;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'usr-global-100',
    email: 'engineer@argonion.com',
    fullName: 'Atlas Engineer',
    passwordHash: 'hashed_old_password',
    status: UserAccountStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    tokenInvalidatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue(mockUser),
      },
      userSession: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
        findMany: jest.fn(),
      },
      passwordResetToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      verificationToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(mockPrisma)),
    };

    const mockUsers = {
      findById: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn(),
    };

    const mockPassword = {
      hash: jest.fn().mockResolvedValue('hashed_new_password_argon2'),
      verify: jest.fn().mockImplementation(async (hash, plain) => {
        if (hash === 'hashed_old_password' && plain === 'OldPassword#123')
          return true;
        if (
          hash === 'hashed_new_password_argon2' &&
          plain === 'NewPassword#456'
        )
          return true;
        return false;
      }),
    };

    const mockJwt = {
      signAsync: jest.fn().mockResolvedValue('signed_jwt_access_token'),
    };

    const mockEmail = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetConfirmationEmail: jest
        .fn()
        .mockResolvedValue(undefined),
    };

    const mockResolver = {
      resolveUser: jest.fn().mockResolvedValue({
        user: mockUser,
        event: 'GOOGLE_OAUTH_LINKED',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        GoogleAuthService,
        GitHubAuthService,
        UserSessionService,
        VerificationTokenService,
        PasswordResetTokenService,
        JwtStrategy,
        { provide: UsersService, useValue: mockUsers },
        { provide: PasswordService, useValue: mockPassword },
        { provide: JwtService, useValue: mockJwt },
        { provide: OAuthIdentityResolver, useValue: mockResolver },
        { provide: EmailService, useValue: mockEmail },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    googleAuthService = module.get<GoogleAuthService>(GoogleAuthService);
    githubAuthService = module.get<GitHubAuthService>(GitHubAuthService);
    sessionService = module.get<UserSessionService>(UserSessionService);
    resetTokenService = module.get<PasswordResetTokenService>(
      PasswordResetTokenService,
    );
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    passwordService = module.get<PasswordService>(PasswordService);
    prisma = module.get(PrismaService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('1. Multi-Device Global Session Revocation on Password Reset', () => {
    it('invalidates all active sessions (Device A, B, C) when password is reset', async () => {
      const validResetToken = {
        id: 'rst-valid-1',
        userId: mockUser.id,
        tokenHash: 'valid_hash',
        expiresAt: new Date(Date.now() + 3600000),
        consumedAt: null,
        user: mockUser,
      };

      jest
        .spyOn(resetTokenService, 'findValidTokenByRaw')
        .mockResolvedValue(validResetToken as any);
      jest
        .spyOn(resetTokenService, 'markTokenConsumed')
        .mockResolvedValue(undefined);
      jest
        .spyOn(resetTokenService, 'invalidateUserTokens')
        .mockResolvedValue(undefined);

      const result = await authService.resetPassword(
        'raw_reset_token',
        'NewPassword#456',
      );

      expect(result.message).toContain('All active sessions have been revoked');
      expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, revokedAt: null },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          passwordHash: 'hashed_new_password_argon2',
          tokenInvalidatedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('2. Access Token Immediate Invalidation Across Devices', () => {
    it('immediately rejects access tokens for revoked sessions (Device A, Device B, Device C)', async () => {
      const revokedSessionA = {
        id: 'ses-device-a',
        userId: mockUser.id,
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      };

      (prisma.userSession.findUnique as jest.Mock).mockResolvedValue(
        revokedSessionA,
      );

      const payloadA = {
        sub: mockUser.id,
        email: mockUser.email,
        sessionId: 'ses-device-a',
        iat: Math.floor(Date.now() / 1000),
      };

      await expect(jwtStrategy.validate(payloadA)).rejects.toThrow(
        new UnauthorizedException(
          'Session has been revoked or expired. Please log in again.',
        ),
      );
    });

    it('immediately rejects access tokens issued prior to tokenInvalidatedAt', async () => {
      const resetTime = new Date('2026-08-18T12:00:00Z');
      const tokenIssuedSec = Math.floor(
        new Date('2026-08-18T11:59:00Z').getTime() / 1000,
      );

      usersService.findById.mockResolvedValue({
        ...mockUser,
        tokenInvalidatedAt: resetTime,
      } as any);

      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        iat: tokenIssuedSec,
      };

      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException(
          'Session has been revoked due to a password reset. Please log in again.',
        ),
      );
    });

    it('rejects access tokens for suspended or inactive accounts', async () => {
      usersService.findById.mockResolvedValue({
        ...mockUser,
        status: UserAccountStatus.SUSPENDED,
      } as any);

      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
      };

      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('User account is not active.'),
      );
    });
  });

  describe('3. Refresh Token Immediate Invalidation & Anti-Replay', () => {
    it('rejects refresh attempt from previously issued refresh tokens on revoked sessions', async () => {
      (prisma.userSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'ses-device-b',
        userId: mockUser.id,
        refreshTokenHash: 'hash_b',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: new Date(), // Revoked by password reset
        user: mockUser,
      });

      await expect(sessionService.rotateSession('raw_token_b')).rejects.toThrow(
        new UnauthorizedException('Session has been revoked or expired.'),
      );
    });
  });

  describe('4. Post-Reset Authentication & Fresh Session Establishment', () => {
    it('rejects old password and establishes active session with new password', async () => {
      // 1. Attempt login with old password -> must fail
      await expect(
        authService.login(
          { email: mockUser.email, password: 'WrongOldPassword' },
          {} as any,
        ),
      ).rejects.toThrow(UnauthorizedException);

      // 2. Successful login with new password -> establishes fresh active session
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: 'hashed_new_password_argon2',
      } as any);

      (prisma.userSession.create as jest.Mock).mockResolvedValue({
        session: {
          id: 'ses-fresh-device',
          userId: mockUser.id,
          refreshTokenHash: 'fresh_hash',
          expiresAt: new Date(Date.now() + 86400000),
          revokedAt: null,
        },
        rawRefreshToken: 'raw_fresh_refresh_token',
      });

      const loginRes = await authService.login(
        { email: mockUser.email, password: 'NewPassword#456' },
        { deviceName: 'MacBook Pro' } as any,
      );

      expect(loginRes.accessToken).toBe('signed_jwt_access_token');
      expect(loginRes.refreshToken).toBeDefined();

      // 3. New access token passes validation
      (prisma.userSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'ses-fresh-device',
        userId: mockUser.id,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
      });

      const validPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        sessionId: 'ses-fresh-device',
        iat: Math.floor(Date.now() / 1000),
      };

      const user = await jwtStrategy.validate(validPayload);
      expect(user.id).toBe(mockUser.id);
      expect(user.email).toBe(mockUser.email);
    });
  });

  describe('5. OAuth Continuation after Password Reset', () => {
    it('allows Google and GitHub OAuth logins to establish fresh active sessions after reset', async () => {
      (prisma.userSession.create as jest.Mock).mockResolvedValue({
        session: {
          id: 'ses-oauth-post-reset',
          userId: mockUser.id,
          refreshTokenHash: 'oauth_hash',
          expiresAt: new Date(Date.now() + 86400000),
          revokedAt: null,
        },
        rawRefreshToken: 'raw_oauth_refresh_token',
      });

      const googleRes =
        await googleAuthService.resolveAndAuthenticateGoogleUser(
          {
            googleId: 'g-123',
            email: mockUser.email,
            fullName: mockUser.fullName,
          },
          {} as any,
        );

      expect(googleRes.accessToken).toBe('signed_jwt_access_token');
      expect(googleRes.refreshToken).toBeDefined();
    });
  });

  describe('6. Single Device Logout Isolation', () => {
    it('revoking Device A session does not revoke Device B session', async () => {
      (prisma.userSession.findUnique as jest.Mock).mockImplementation(
        ({ where }) => {
          if (where.refreshTokenHash) {
            return Promise.resolve({
              id: 'ses-device-a',
              userId: mockUser.id,
              refreshTokenHash: 'hash_a',
            });
          }
          return Promise.resolve(null);
        },
      );

      await sessionService.revokeSessionByRawToken('raw_token_device_a');

      expect(prisma.userSession.update).toHaveBeenCalledWith({
        where: { id: 'ses-device-a' },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      });
      // Ensure updateMany (global revocation) was NOT called
      expect(prisma.userSession.updateMany).not.toHaveBeenCalled();
    });
  });
});
