import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { GuestDomainResolver } from './guest-domain.resolver';
import { SYSTEM_GUEST_USER_ID } from '../constants/guest.constants';

describe('GuestDomainResolver', () => {
  let resolver: GuestDomainResolver;
  let prisma: jest.Mocked<PrismaService>;

  const mockDomain = {
    id: 'dom-12345',
    userId: SYSTEM_GUEST_USER_ID,
    domainName: 'github.com',
    monitoringEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        upsert: jest.fn(),
      },
      domain: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestDomainResolver,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    resolver = module.get<GuestDomainResolver>(GuestDomainResolver);
    prisma = module.get(PrismaService);
  });

  it('should resolve an existing guest domain under SYSTEM_GUEST_USER_ID', async () => {
    (prisma.user.upsert as jest.Mock).mockResolvedValue({});
    (prisma.domain.findFirst as jest.Mock).mockResolvedValue(mockDomain);

    const result = await resolver.resolveGuestDomain('github.com');

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SYSTEM_GUEST_USER_ID },
      }),
    );
    expect(prisma.domain.findFirst).toHaveBeenCalledWith({
      where: {
        userId: SYSTEM_GUEST_USER_ID,
        domainName: 'github.com',
      },
    });
    expect(result).toEqual(mockDomain);
  });

  it('should create a new guest domain if not found', async () => {
    (prisma.user.upsert as jest.Mock).mockResolvedValue({});
    (prisma.domain.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.domain.create as jest.Mock).mockResolvedValue(mockDomain);

    const result = await resolver.resolveGuestDomain('   GITHUB.COM   ');

    expect(prisma.domain.create).toHaveBeenCalledWith({
      data: {
        userId: SYSTEM_GUEST_USER_ID,
        domainName: 'github.com',
        monitoringEnabled: false,
      },
    });
    expect(result).toEqual(mockDomain);
  });
});
