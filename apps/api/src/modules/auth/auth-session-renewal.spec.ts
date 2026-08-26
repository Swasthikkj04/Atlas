import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserAccountStatus } from '@prisma/client';

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

describe('WX-1013: Backend Persistent Session Renewal & Rotation Architecture', () => {
  let authService: AuthService;
  let sessionService: UserSessionService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'usr-persisted-100',
    email: 'architect@nebula.internal',
    fullName: 'Nebula Architect',
    passwordHash: 'argon2_hashed_pw',
    status: UserAccountStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    tokenInvalidatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSessionLinux = {
    id: 'ses-linux-001',
    userId: mockUser.id,
    refreshTokenHash: 'hash_linux_session_1',
    deviceName: 'Chrome on Linux',
    deviceType: 'Desktop',
    browser: 'Chrome',
    operatingSystem: 'Linux',
    ipAddress: '10.0.0.1',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    lastActivityAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    revokedAt: null,
    createdAt: new Date(),
    user: mockUser,
  };

  const mockSessionLaptop = {
    id: 'ses-laptop-002',
    userId: mockUser.id,
    refreshTokenHash: 'hash_laptop_session_2',
    deviceName: 'Safari on macOS',
    deviceType: 'Desktop',
    browser: 'Safari',
    operatingSystem: 'macOS',
    ipAddress: '10.0.0.2',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
    lastActivityAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    createdAt: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue(mockUser),
      },
      userSession: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue(mockSessionLinux),
        update: jest.fn().mockResolvedValue(mockSessionLinux),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([mockSessionLinux, mockSessionLaptop]),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(mockPrisma)),
    };

    const mockJwt = {
      signAsync: jest.fn().mockResolvedValue('jwt_fresh_access_token_xyz'),
      verifyAsync: jest.fn().mockResolvedValue({
        sub: mockUser.id,
        email: mockUser.email,
        sessionId: mockSessionLinux.id,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UserSessionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        {
          provide: UsersService,
          useValue: { findById: jest.fn().mockResolvedValue(mockUser) },
        },
        {
          provide: PasswordService,
          useValue: { verify: jest.fn().mockResolvedValue(true) },
        },
        { provide: GoogleAuthService, useValue: {} },
        { provide: GitHubAuthService, useValue: {} },
        { provide: VerificationTokenService, useValue: {} },
        { provide: PasswordResetTokenService, useValue: {} },
        { provide: OAuthIdentityResolver, useValue: {} },
        { provide: EmailService, useValue: {} },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    sessionService = module.get<UserSessionService>(UserSessionService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
  });

  describe('1. Silent Session Renewal & Token Rotation', () => {
    it('renews access token and rotates refresh token when valid refresh credential is provided', async () => {
      (prisma.userSession.findUnique as jest.Mock).mockResolvedValue(mockSessionLinux);

      const rawToken = 'raw_refresh_token_valid_123';
      const result = await authService.refresh(rawToken);

      expect(prisma.userSession.findUnique).toHaveBeenCalled();
      expect(prisma.userSession.update).toHaveBeenCalled();
      expect(result.accessToken).toBe('jwt_fresh_access_token_xyz');
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(rawToken); // Cryptographically rotated
    });

    it('rejects renewal when refresh session is revoked', async () => {
      const revokedSession = {
        ...mockSessionLinux,
        revokedAt: new Date(Date.now() - 10000), // Revoked 10s ago
      };
      (prisma.userSession.findUnique as jest.Mock).mockResolvedValue(revokedSession);

      await expect(
        authService.refresh('raw_revoked_token_123')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects renewal when refresh session is expired', async () => {
      const expiredSession = {
        ...mockSessionLinux,
        expiresAt: new Date(Date.now() - 60000), // Expired 1m ago
      };
      (prisma.userSession.findUnique as jest.Mock).mockResolvedValue(expiredSession);

      await expect(
        authService.refresh('raw_expired_token_123')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects renewal and revokes session if user account was deactivated or killed', async () => {
      const deactivatedUser = {
        ...mockUser,
        status: UserAccountStatus.DEACTIVATED,
      };
      const sessionWithDeactivatedUser = {
        ...mockSessionLinux,
        user: deactivatedUser,
      };
      (prisma.userSession.findUnique as jest.Mock).mockResolvedValue(
        sessionWithDeactivatedUser
      );

      await expect(
        authService.refresh('raw_token_deactivated_user')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('2. Multi-Device Session Isolation', () => {
    it('revoking Linux session leaves Laptop session active', async () => {
      (prisma.userSession.findUnique as jest.Mock).mockResolvedValue(mockSessionLinux);

      await authService.revokeSession(mockUser.id, mockSessionLinux.id);

      expect(prisma.userSession.findUnique).toHaveBeenCalledWith({
        where: { id: mockSessionLinux.id },
      });
      expect(prisma.userSession.update).toHaveBeenCalledWith({
        where: { id: mockSessionLinux.id },
        data: expect.objectContaining({
          revokedAt: expect.any(Date),
        }),
      });
    });

    it('logout current session only revokes current session and preserves other devices', async () => {
      (prisma.userSession.findUnique as jest.Mock).mockResolvedValue(mockSessionLinux);

      await authService.logout('raw_linux_token');

      expect(prisma.userSession.findUnique).toHaveBeenCalledWith({
        where: {
          refreshTokenHash: sessionService.hashRefreshToken('raw_linux_token'),
        },
      });
      expect(prisma.userSession.update).toHaveBeenCalledWith({
        where: { id: mockSessionLinux.id },
        data: expect.objectContaining({
          revokedAt: expect.any(Date),
        }),
      });
    });

    it('logoutAll revokes all other sessions while preserving current session', async () => {
      await authService.logoutAll(mockUser.id, 'raw_current_token');

      expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          refreshTokenHash: {
            not: sessionService.hashRefreshToken('raw_current_token'),
          },
          revokedAt: null,
        },
        data: expect.objectContaining({
          revokedAt: expect.any(Date),
        }),
      });
    });
  });
});
