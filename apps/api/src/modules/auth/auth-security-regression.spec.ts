import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserAccountStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UserSessionService } from './services/user-session.service';
import { VerificationTokenService } from './services/verification-token.service';
import { PasswordResetTokenService } from './services/password-reset-token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersService } from '../users/users.service';
import { CsrfGuard } from '../../common/guards/csrf.guard';

describe('Security Regression Suite (AUTH-005.5)', () => {
  let sessionService: UserSessionService;
  let verificationTokenService: VerificationTokenService;
  let resetTokenService: PasswordResetTokenService;
  let jwtStrategy: JwtStrategy;
  let prisma: jest.Mocked<PrismaService>;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'usr-security-100',
    email: 'sec@example.com',
    fullName: 'Security Test User',
    passwordHash: 'hashed_pw',
    status: UserAccountStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    tokenInvalidatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      userSession: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
      verificationToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      passwordResetToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockUsers = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSessionService,
        VerificationTokenService,
        PasswordResetTokenService,
        JwtStrategy,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsers },
      ],
    }).compile();

    sessionService = module.get<UserSessionService>(UserSessionService);
    verificationTokenService = module.get<VerificationTokenService>(VerificationTokenService);
    resetTokenService = module.get<PasswordResetTokenService>(PasswordResetTokenService);
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    prisma = module.get(PrismaService);
    usersService = module.get(UsersService);
  });

  describe('1. Refresh Token Security & Replay Attacks', () => {
    it('Regression: Expired refresh token must be rejected', async () => {
      (prisma.userSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'ses-1',
        userId: 'usr-1',
        refreshTokenHash: 'hash',
        expiresAt: new Date(Date.now() - 1000), // Expired
        revokedAt: null,
        user: mockUser,
      });

      await expect(sessionService.rotateSession('raw_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('Regression: Revoked refresh token session must be rejected', async () => {
      (prisma.userSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'ses-1',
        userId: 'usr-1',
        refreshTokenHash: 'hash',
        expiresAt: new Date(Date.now() + 60000),
        revokedAt: new Date(), // Revoked
        user: mockUser,
      });

      await expect(sessionService.rotateSession('raw_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('Regression: Replayed (already rotated) refresh token must fail lookup', async () => {
      // Once rotated, DB hash changes, so old raw token hash returns null
      (prisma.userSession.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(sessionService.rotateSession('old_rotated_raw_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('2. Single-Use Tokens Replay Defense', () => {
    it('Regression: Consumed verification token replay must be rejected', async () => {
      (prisma.verificationToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'ver-1',
        userId: 'usr-1',
        expiresAt: new Date(Date.now() + 60000),
        consumedAt: new Date(), // Already consumed
      });

      const token = await verificationTokenService.findValidTokenByRaw('raw_ver_token');
      expect(token).toBeNull();
    });

    it('Regression: Consumed password-reset token replay must be rejected', async () => {
      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rst-1',
        userId: 'usr-1',
        expiresAt: new Date(Date.now() + 60000),
        consumedAt: new Date(), // Already consumed
      });

      const token = await resetTokenService.findValidTokenByRaw('raw_rst_token');
      expect(token).toBeNull();
    });
  });

  describe('3. Global Session Revocation (tokenInvalidatedAt)', () => {
    it('Regression: JWT issued BEFORE password reset (tokenInvalidatedAt) must be rejected', async () => {
      const resetTime = new Date('2026-07-31T20:00:00Z');
      const tokenIssuedTimeSeconds = Math.floor(new Date('2026-07-31T19:55:00Z').getTime() / 1000); // 5m before reset

      usersService.findById.mockResolvedValue({
        ...mockUser,
        tokenInvalidatedAt: resetTime,
      } as any);

      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        iat: tokenIssuedTimeSeconds,
      };

      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('Regression: Logout-all must invalidate all stateful user sessions', async () => {
      (prisma.userSession.updateMany as jest.Mock).mockResolvedValue({ count: 5 });

      await sessionService.revokeAllUserSessions('usr-security-100');

      expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'usr-security-100',
          revokedAt: null,
        },
        data: expect.objectContaining({
          revokedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('4. CSRF Double-Submit Protection', () => {
    it('Regression: State-changing endpoint without matching CSRF header must be blocked', () => {
      const csrfGuard = new CsrfGuard();
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            path: '/api/v1/auth/logout-all',
            url: '/api/v1/auth/logout-all',
            cookies: { nebula_csrf_token: 'valid_csrf_token_123' },
            headers: { 'x-csrf-token': 'wrong_csrf_token_456' },
          }),
        }),
      } as any;

      expect(() => csrfGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });
  });
});
