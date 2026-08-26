import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserAccountStatus } from '@prisma/client';
import type { Request, Response } from 'express';

import { AuthController } from './auth.controller';
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
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('WX-1014: Auth Refresh Contract & HTTP-Only Cookie Compatibility', () => {
  let controller: AuthController;
  let authService: AuthService;
  let sessionService: UserSessionService;
  let prisma: jest.Mocked<PrismaService>;
  let validationPipe: ValidationPipe;

  const mockUser = {
    id: 'usr-refresh-100',
    email: 'engineer@nebula.internal',
    fullName: 'Nebula Engineer',
    passwordHash: 'argon2_hashed_pw',
    status: UserAccountStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    tokenInvalidatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSession = {
    id: 'ses-cookie-001',
    userId: mockUser.id,
    refreshTokenHash: 'hash_cookie_session_1',
    deviceName: 'Chrome on Linux',
    deviceType: 'Desktop',
    browser: 'Chrome',
    operatingSystem: 'Linux',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    lastActivityAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    createdAt: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    validationPipe = new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    });

    const mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue(mockUser),
      },
      userSession: {
        findUnique: jest.fn().mockResolvedValue(mockSession),
        create: jest.fn().mockResolvedValue(mockSession),
        update: jest.fn().mockResolvedValue(mockSession),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([mockSession]),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(mockPrisma)),
    };

    const mockJwt = {
      signAsync: jest.fn().mockResolvedValue('jwt_new_access_token_123'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
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

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    sessionService = module.get<UserSessionService>(UserSessionService);
    prisma = module.get(PrismaService);
  });

  describe('1. HTTP-Only Cookie Refresh Contract & DTO Validation Compatibility', () => {
    it('accepts empty JSON body {} without failing ValidationPipe', async () => {
      // Validate that empty body doesn't trigger 400 Bad Request in ValidationPipe
      const validatedDto = await validationPipe.transform(
        {},
        { type: 'body', metatype: RefreshTokenDto }
      );

      expect(validatedDto).toBeDefined();
      expect(validatedDto.refreshToken).toBeUndefined();
    });

    it('successfully processes refresh when token is supplied via HTTP-Only cookie with empty body', async () => {
      const req = {
        cookies: {
          nebula_refresh_token: 'raw_cookie_token_abc',
        },
        headers: {},
      } as unknown as Request;

      const res = {
        cookie: jest.fn(),
      } as unknown as Response;

      const result = await controller.refresh(req, res, {});

      expect(result.accessToken).toBe('jwt_new_access_token_123');
      expect(result.refreshToken).toBeDefined();
      expect(res.cookie).toHaveBeenCalled(); // New rotated cookies set
    });

    it('successfully processes refresh when token is supplied in request body', async () => {
      const req = {
        cookies: {},
        headers: {},
      } as unknown as Request;

      const res = {
        cookie: jest.fn(),
      } as unknown as Response;

      const result = await controller.refresh(req, res, {
        refreshToken: 'raw_body_token_xyz',
      });

      expect(result.accessToken).toBe('jwt_new_access_token_123');
      expect(result.refreshToken).toBeDefined();
      expect(res.cookie).toHaveBeenCalled();
    });

    it('throws 401 Unauthorized (NOT 400 Bad Request) when neither cookie nor body token is present', async () => {
      const req = {
        cookies: {},
        headers: {},
      } as unknown as Request;

      const res = {
        cookie: jest.fn(),
      } as unknown as Response;

      await expect(controller.refresh(req, res, {})).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('2. Error Classification & Session Revocation Truth', () => {
    it('throws 401 Unauthorized when session is revoked', async () => {
      const revokedSession = {
        ...mockSession,
        revokedAt: new Date(),
      };
      (prisma.userSession.findUnique as jest.Mock).mockResolvedValue(revokedSession);

      const req = {
        cookies: { nebula_refresh_token: 'raw_revoked_cookie' },
        headers: {},
      } as unknown as Request;
      const res = { cookie: jest.fn() } as unknown as Response;

      await expect(controller.refresh(req, res, {})).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('throws 401 Unauthorized when session is expired', async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 10000),
      };
      (prisma.userSession.findUnique as jest.Mock).mockResolvedValue(expiredSession);

      const req = {
        cookies: { nebula_refresh_token: 'raw_expired_cookie' },
        headers: {},
      } as unknown as Request;
      const res = { cookie: jest.fn() } as unknown as Response;

      await expect(controller.refresh(req, res, {})).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
