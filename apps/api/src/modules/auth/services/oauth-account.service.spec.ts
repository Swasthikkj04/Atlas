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
      oAuthAccount: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
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
    (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue(mockOAuthAccount);

    const result = await service.findAccount(OAuthProvider.GOOGLE, 'google-sub-123');

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
    (prisma.oAuthAccount.create as jest.Mock).mockResolvedValue(mockOAuthAccount);

    const result = await service.createAccount({
      userId: 'usr-123',
      provider: OAuthProvider.GOOGLE,
      providerUserId: 'google-sub-123',
      providerEmail: 'user@example.com',
    });

    expect(prisma.oAuthAccount.create).toHaveBeenCalled();
    expect(result).toEqual(mockOAuthAccount);
  });
});
