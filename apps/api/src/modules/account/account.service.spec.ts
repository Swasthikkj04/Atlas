import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  MotionPreference,
  ThemePreference,
  UserAccountStatus,
} from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PasswordService } from '../auth/services/password.service';
import { AccountService } from './account.service';
import { MotionOption, ThemeOption } from './dto/update-preferences.dto';

describe('AccountService (AX-108 Account Lifecycle & Data Retention)', () => {
  let service: AccountService;
  let prisma: jest.Mocked<PrismaService>;
  let passwordService: jest.Mocked<PasswordService>;

  const mockUser = {
    id: 'usr-123',
    email: 'test@example.com',
    fullName: 'Test User',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhash',
    status: UserAccountStatus.ACTIVE,
    updatedAt: new Date('2026-08-21T12:00:00.000Z'),
    createdAt: new Date('2026-08-20T10:00:00.000Z'),
    oauthAccounts: [{ provider: 'GOOGLE' }],
  };

  const mockOAuthUser = {
    id: 'usr-oauth',
    email: 'oauth@example.com',
    fullName: 'OAuth User',
    passwordHash: null,
    status: UserAccountStatus.ACTIVE,
    updatedAt: new Date('2026-08-21T12:00:00.000Z'),
    createdAt: new Date('2026-08-20T10:00:00.000Z'),
    oauthAccounts: [{ provider: 'GITHUB' }],
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      userPreference: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      userSession: {
        count: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => {
        if (typeof cb === 'function') {
          return cb(mockPrisma);
        }
        return cb;
      }),
    };

    const mockPasswordService = {
      hash: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PasswordService, useValue: mockPasswordService },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    prisma = module.get(PrismaService);
    passwordService = module.get(PasswordService);
  });

  describe('getAccountOverview', () => {
    it('returns authoritative identity and lifecycle state', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.userSession.count as jest.Mock).mockResolvedValue(2);

      const overview = await service.getAccountOverview('usr-123');

      expect(overview.id).toBe('usr-123');
      expect(overview.email).toBe('test@example.com');
      expect(overview.status).toBe(UserAccountStatus.ACTIVE);
      expect(overview.hasPassword).toBe(true);
      expect(overview.connectedProviders).toEqual(['GOOGLE']);
      expect(overview.activeSessionsCount).toBe(2);
    });

    it('throws NotFoundException if user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getAccountOverview('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivateAccount', () => {
    it('deactivates password-authenticated account upon valid current password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      passwordService.verify.mockResolvedValue(true);

      const result = await service.deactivateAccount('usr-123', {
        currentPassword: 'ValidPassword123!',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'usr-123' },
        data: expect.objectContaining({
          status: UserAccountStatus.DEACTIVATED,
        }),
      });
      expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: 'usr-123', revokedAt: null },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      });
      expect(result.message).toContain('deactivated');
    });

    it('rejects password-authenticated deactivation if password is invalid', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      passwordService.verify.mockResolvedValue(false);

      await expect(
        service.deactivateAccount('usr-123', {
          currentPassword: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deactivates OAuth-only account when confirmText is DEACTIVATE', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockOAuthUser);

      const result = await service.deactivateAccount('usr-oauth', {
        confirmText: 'DEACTIVATE',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'usr-oauth' },
        data: expect.objectContaining({
          status: UserAccountStatus.DEACTIVATED,
        }),
      });
      expect(result.message).toContain('deactivated');
    });

    it('rejects OAuth-only deactivation when confirmText is invalid', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockOAuthUser);

      await expect(
        service.deactivateAccount('usr-oauth', {
          confirmText: 'WRONG',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteAccount', () => {
    it('permanently deletes account upon valid password and confirmation', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      passwordService.verify.mockResolvedValue(true);

      const result = await service.deleteAccount('usr-123', {
        currentPassword: 'ValidPassword123!',
        confirmText: 'DELETE',
      });

      expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: 'usr-123', revokedAt: null },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'usr-123' },
      });
      expect(result.message).toContain('permanently deleted');
    });

    it('rejects deletion if confirmText is not DELETE', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.deleteAccount('usr-123', {
          currentPassword: 'ValidPassword123!',
          confirmText: 'NO',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects deletion if password is wrong for password account', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      passwordService.verify.mockResolvedValue(false);

      await expect(
        service.deleteAccount('usr-123', {
          currentPassword: 'BadPassword',
          confirmText: 'DELETE',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('preferences', () => {
    it('should return default system preferences when user has no stored preference record', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        preferences: null,
      });

      const result = await service.getPreferences('usr-123');

      expect(result.theme).toBe('system');
      expect(result.motion).toBe('system');
      expect(result.updatedAt).toBeDefined();
    });

    it('should update theme preference and persist to database', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.userPreference.upsert as jest.Mock).mockResolvedValue({
        id: 'pref-1',
        userId: 'usr-123',
        theme: ThemePreference.LIGHT,
        motion: MotionPreference.STANDARD,
        updatedAt: new Date(),
      });

      const result = await service.updatePreferences('usr-123', {
        theme: ThemeOption.LIGHT,
      });

      expect(result.theme).toBe('light');
    });
  });
});
