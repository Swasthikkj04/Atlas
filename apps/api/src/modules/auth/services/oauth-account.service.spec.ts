import { Test, TestingModule } from '@nestjs/testing';
import { OAuthProvider } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { OAuthAccountService } from './oauth-account.service';

describe('OAuthAccountService', () => {
  let service: OAuthAccountService;
  let prisma: jest.Mocked<PrismaService>;

  const mockOAuthAccount = {
    id: 'oauth-100',
    userId: 'usr-123',
    provider: OAuthProvider.GOOGLE,
    providerUserId: 'google-sub-123',
    providerEmail: 'user@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'usr-123', email: 'user@example.com' } as any,
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      oAuthAccount: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthAccountService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OAuthAccountService>(OAuthAccountService);
    prisma = module.get(PrismaService);
  });

  it('should find OAuth account by provider and providerUserId', async () => {
    (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue(
      mockOAuthAccount,
    );

    const result = await service.findAccount(
      OAuthProvider.GOOGLE,
      'google-sub-123',
    );

    expect(prisma.oAuthAccount.findUnique).toHaveBeenCalledWith({
      where: {
        provider_providerUserId: {
          provider: OAuthProvider.GOOGLE,
          providerUserId: 'google-sub-123',
        },
      },
      include: { user: true },
    });
    expect(result).toEqual(mockOAuthAccount);
  });

  it('should create new OAuth account record', async () => {
    (prisma.oAuthAccount.create as jest.Mock).mockResolvedValue(
      mockOAuthAccount,
    );

    const result = await service.createAccount({
      userId: 'usr-123',
      provider: OAuthProvider.GOOGLE,
      providerUserId: 'google-sub-123',
      providerEmail: 'user@example.com',
    });

    expect(prisma.oAuthAccount.create).toHaveBeenCalled();
    expect(result).toEqual(mockOAuthAccount);
  });

  describe('getProvidersForUser (AX-106)', () => {
    it('should return connected status with masked emails and canDisconnect=true when password exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'usr-123',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$somehash',
      });
      (prisma.oAuthAccount.findMany as jest.Mock).mockResolvedValue([
        mockOAuthAccount,
      ]);

      const result = await service.getProvidersForUser('usr-123');

      expect(result.providers).toHaveLength(2);
      const google = result.providers.find((p) => p.provider === 'google');
      const github = result.providers.find((p) => p.provider === 'github');

      expect(google).toBeDefined();
      expect(google?.connected).toBe(true);
      expect(google?.accountLabel).toBe('u••••r@example.com');
      expect(google?.canDisconnect).toBe(true);

      expect(github).toBeDefined();
      expect(github?.connected).toBe(false);
      expect(github?.accountLabel).toBeNull();
      expect(github?.canDisconnect).toBe(false);
    });

    it('should set canDisconnect=false for single OAuth provider when no password exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'usr-123',
        passwordHash: null,
      });
      (prisma.oAuthAccount.findMany as jest.Mock).mockResolvedValue([
        mockOAuthAccount,
      ]);

      const result = await service.getProvidersForUser('usr-123');
      const google = result.providers.find((p) => p.provider === 'google');

      expect(google?.connected).toBe(true);
      expect(google?.canDisconnect).toBe(false);
    });
  });

  describe('disconnectProvider (AX-106)', () => {
    it('should disconnect provider successfully when user has password credential', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'usr-123',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$hash',
      });
      (prisma.oAuthAccount.findMany as jest.Mock).mockResolvedValue([
        mockOAuthAccount,
      ]);
      (prisma.oAuthAccount.delete as jest.Mock).mockResolvedValue(
        mockOAuthAccount,
      );

      const result = await service.disconnectProvider(
        'usr-123',
        OAuthProvider.GOOGLE,
      );

      expect(prisma.oAuthAccount.delete).toHaveBeenCalledWith({
        where: { id: 'oauth-100' },
      });
      expect(result.message).toContain(
        'Google account disconnected successfully',
      );
    });

    it('should throw BadRequestException on attempt to disconnect final auth method (NO_FINAL_AUTH_METHOD_REMOVAL)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'usr-123',
        passwordHash: null,
      });
      (prisma.oAuthAccount.findMany as jest.Mock).mockResolvedValue([
        mockOAuthAccount,
      ]);

      await expect(
        service.disconnectProvider('usr-123', OAuthProvider.GOOGLE),
      ).rejects.toThrow('Cannot disconnect your only authentication method');
      expect(prisma.oAuthAccount.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when provider is not connected to user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'usr-123',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$hash',
      });
      (prisma.oAuthAccount.findMany as jest.Mock).mockResolvedValue([]);

      await expect(
        service.disconnectProvider('usr-123', OAuthProvider.GITHUB),
      ).rejects.toThrow('GitHub is not connected to this account.');
    });
  });
});
