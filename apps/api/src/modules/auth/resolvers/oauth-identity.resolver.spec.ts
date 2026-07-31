import { Test, TestingModule } from '@nestjs/testing';
import { OAuthProvider, UserAccountStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { OAuthAccountService } from '../services/oauth-account.service';
import { OAuthIdentityResolver } from './oauth-identity.resolver';

describe('OAuthIdentityResolver', () => {
  let resolver: OAuthIdentityResolver;
  let prisma: jest.Mocked<PrismaService>;
  let oauthAccountService: jest.Mocked<OAuthAccountService>;

  const mockProfile = {
    provider: OAuthProvider.GOOGLE,
    providerUserId: 'google-sub-999',
    email: 'test@example.com',
    fullName: 'Google Test User',
    avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
  };

  const mockUser = {
    id: 'usr-100',
    email: 'test@example.com',
    fullName: 'Test User',
    passwordHash: null,
    avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
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
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockOAuthSvc = {
      findAccount: jest.fn(),
      createAccount: jest.fn(),
      findByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthIdentityResolver,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OAuthAccountService, useValue: mockOAuthSvc },
      ],
    }).compile();

    resolver = module.get<OAuthIdentityResolver>(OAuthIdentityResolver);
    prisma = module.get(PrismaService);
    oauthAccountService = module.get(OAuthAccountService);
  });

  it('Case A: should return existing linked OAuth account user', async () => {
    oauthAccountService.findAccount.mockResolvedValue({
      id: 'oauth-1',
      userId: 'usr-100',
      user: mockUser,
    } as any);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

    const result = await resolver.resolveUser(mockProfile);

    expect(result.user.id).toBe('usr-100');
    expect(result.event).toBe('GOOGLE_LOGIN_SUCCESS');
  });

  it('Case B: should link existing verified local user', async () => {
    oauthAccountService.findAccount.mockResolvedValue(null);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

    const result = await resolver.resolveUser(mockProfile);

    expect(oauthAccountService.createAccount).toHaveBeenCalled();
    expect(result.event).toBe('GOOGLE_ACCOUNT_LINKED');
  });

  it('Case C: should upgrade pending local account to ACTIVE and link', async () => {
    const pendingUser = {
      ...mockUser,
      status: UserAccountStatus.PENDING_VERIFICATION,
      emailVerifiedAt: null,
    };
    oauthAccountService.findAccount.mockResolvedValue(null);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(pendingUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

    const result = await resolver.resolveUser(mockProfile);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'usr-100' },
      data: expect.objectContaining({
        status: UserAccountStatus.ACTIVE,
      }),
    });
    expect(result.event).toBe('GOOGLE_ACCOUNT_LINKED');
  });

  it('Case D: should provision completely new Google user as ACTIVE with passwordHash null', async () => {
    oauthAccountService.findAccount.mockResolvedValue(null);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

    const result = await resolver.resolveUser(mockProfile);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'test@example.com',
        status: UserAccountStatus.ACTIVE,
        passwordHash: null,
      }),
    });
    expect(result.event).toBe('GOOGLE_ACCOUNT_CREATED');
  });
});
