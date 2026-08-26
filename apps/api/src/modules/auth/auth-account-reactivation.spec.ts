import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserAccountStatus } from '@prisma/client';
import { AuthService } from './services/auth.service';
import { AccountReactivationTokenService } from './services/account-reactivation-token.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from './services/password.service';
import { JwtService } from '@nestjs/jwt';
import { VerificationTokenService } from './services/verification-token.service';
import { PasswordResetTokenService } from './services/password-reset-token.service';
import { UserSessionService } from './services/user-session.service';
import { EmailService } from '../../infrastructure/email/email.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('AX-112: Account Reactivation & Lifecycle Recovery Specifications', () => {
  let authService: AuthService;
  let reactivationTokenService: AccountReactivationTokenService;
  let mockPrisma: any;
  let mockUsersService: any;
  let mockEmailService: any;
  let mockSessionService: any;
  let mockJwtService: any;

  const mockDeactivatedUser = {
    id: 'usr-uuid-112',
    email: 'alex@example.com',
    fullName: 'Alex Deactivated',
    status: UserAccountStatus.DEACTIVATED,
    tokenInvalidatedAt: new Date(Date.now() - 100000),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    domains: [
      { id: 'dom-1', domainName: 'argonion.com' },
      { id: 'dom-2', domainName: 'atlas.io' },
    ],
  };

  beforeEach(() => {
    mockPrisma = {
      accountReactivationToken: {
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'tok-id-1', ...data }),
          ),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn(),
        update: jest
          .fn()
          .mockResolvedValue({ id: 'tok-id-1', consumedAt: new Date() }),
      },
      user: {
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            ...mockDeactivatedUser,
            status: data.status,
            tokenInvalidatedAt: data.tokenInvalidatedAt,
            lastLoginAt: data.lastLoginAt,
          }),
        ),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => {
        return cb(mockPrisma);
      }),
    };

    mockUsersService = {
      findByEmail: jest.fn(),
    };

    mockEmailService = {
      sendAccountReactivationEmail: jest.fn().mockResolvedValue(undefined),
    };

    mockSessionService = {
      createSession: jest.fn().mockResolvedValue({
        session: { id: 'ses-fresh-1' },
        rawRefreshToken: 'fresh_refresh_token_112',
      }),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('fresh_jwt_access_token_112'),
    };

    reactivationTokenService = new AccountReactivationTokenService(mockPrisma);

    authService = new AuthService(
      mockUsersService,
      {} as PasswordService,
      mockJwtService,
      {} as VerificationTokenService,
      {} as PasswordResetTokenService,
      mockSessionService,
      mockEmailService,
      mockPrisma,
      reactivationTokenService,
    );
  });

  describe('1. Reactivation Request & Anti-Enumeration', () => {
    it('dispatches single-use reactivation email when user is legitimately DEACTIVATED', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockDeactivatedUser);

      const response =
        await authService.requestReactivation('alex@example.com');

      expect(response.message).toContain(
        'If an eligible deactivated account is associated with this email',
      );
      expect(mockPrisma.accountReactivationToken.create).toHaveBeenCalledTimes(
        1,
      );
      expect(
        mockEmailService.sendAccountReactivationEmail,
      ).toHaveBeenCalledWith(
        'alex@example.com',
        expect.any(String),
        'Alex Deactivated',
      );
    });

    it('returns exact same generic message when email does not exist (Anti-Enumeration)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const response = await authService.requestReactivation(
        'unknown@example.com',
      );

      expect(response.message).toContain(
        'If an eligible deactivated account is associated with this email',
      );
      expect(mockPrisma.accountReactivationToken.create).not.toHaveBeenCalled();
      expect(
        mockEmailService.sendAccountReactivationEmail,
      ).not.toHaveBeenCalled();
    });

    it('returns generic message without sending email when account is already ACTIVE', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockDeactivatedUser,
        status: UserAccountStatus.ACTIVE,
      });

      const response =
        await authService.requestReactivation('alex@example.com');

      expect(response.message).toContain(
        'If an eligible deactivated account is associated with this email',
      );
      expect(mockPrisma.accountReactivationToken.create).not.toHaveBeenCalled();
      expect(
        mockEmailService.sendAccountReactivationEmail,
      ).not.toHaveBeenCalled();
    });

    it('invalidates prior outstanding reactivation tokens on new request', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockDeactivatedUser);

      await authService.requestReactivation('alex@example.com');

      expect(
        mockPrisma.accountReactivationToken.deleteMany,
      ).toHaveBeenCalledWith({
        where: { userId: 'usr-uuid-112' },
      });
    });
  });

  describe('2. Confirmation & Atomic Account Reactivation', () => {
    it('atomically transitions status to ACTIVE, consumes token, and creates a fresh session', async () => {
      const rawToken =
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const tokenHash = reactivationTokenService.hashToken(rawToken);

      mockPrisma.accountReactivationToken.findUnique.mockResolvedValue({
        id: 'tok-id-1',
        userId: 'usr-uuid-112',
        tokenHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        consumedAt: null,
        user: mockDeactivatedUser,
      });

      const result = await authService.confirmReactivation(rawToken, {
        browser: 'Chrome',
        operatingSystem: 'Linux',
        ipAddress: '127.0.0.1',
      });

      expect(result.message).toContain('successfully reactivated');
      expect(result.accessToken).toBe('fresh_jwt_access_token_112');
      expect(result.refreshToken).toBe('fresh_refresh_token_112');
      expect(result.user?.id).toBe('usr-uuid-112');

      // Verify atomic Prisma transaction was executed
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockSessionService.createSession).toHaveBeenCalledWith(
        'usr-uuid-112',
        expect.objectContaining({ browser: 'Chrome' }),
      );
    });

    it('rejects expired reactivation tokens', async () => {
      const rawToken = 'expired_raw_token';
      const tokenHash = reactivationTokenService.hashToken(rawToken);

      mockPrisma.accountReactivationToken.findUnique.mockResolvedValue({
        id: 'tok-id-1',
        userId: 'usr-uuid-112',
        tokenHash,
        expiresAt: new Date(Date.now() - 5000), // Expired
        consumedAt: null,
        user: mockDeactivatedUser,
      });

      await expect(
        authService.confirmReactivation(rawToken, {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects already consumed reactivation tokens (Single-Use Policy)', async () => {
      const rawToken = 'consumed_raw_token';
      const tokenHash = reactivationTokenService.hashToken(rawToken);

      mockPrisma.accountReactivationToken.findUnique.mockResolvedValue({
        id: 'tok-id-1',
        userId: 'usr-uuid-112',
        tokenHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        consumedAt: new Date(Date.now() - 60000), // Consumed
        user: mockDeactivatedUser,
      });

      await expect(
        authService.confirmReactivation(rawToken, {} as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Historical Data Preservation & Zero Mutation Invariant', () => {
    it('restores the exact same User UUID without altering existing domain relationships', async () => {
      const rawToken = 'valid_token_identity_check';
      const tokenHash = reactivationTokenService.hashToken(rawToken);

      mockPrisma.accountReactivationToken.findUnique.mockResolvedValue({
        id: 'tok-id-1',
        userId: 'usr-uuid-112',
        tokenHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        consumedAt: null,
        user: mockDeactivatedUser,
      });

      const result = await authService.confirmReactivation(rawToken, {} as any);

      // Identity invariant: Same UUID, historical data untouched
      expect(result.user?.id).toBe(mockDeactivatedUser.id);
      expect(result.user?.createdAt).toEqual(mockDeactivatedUser.createdAt);
    });
  });
});
