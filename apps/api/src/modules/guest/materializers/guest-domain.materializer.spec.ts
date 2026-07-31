import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { GuestDomainMaterializer } from './guest-domain.materializer';

describe('GuestDomainMaterializer', () => {
  let materializer: GuestDomainMaterializer;
  let prisma: jest.Mocked<PrismaService>;

  const mockUserDomain = {
    id: 'dom-user-123',
    userId: 'usr-456',
    domainName: 'github.com',
    monitoringEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockJob = {
    id: 'job-source-777',
    domainId: 'dom-guest-999',
    status: 'COMPLETED' as any,
    trigger: 'MANUAL' as any,
    durationMs: 1200,
    startedAt: new Date(),
    completedAt: new Date(),
    errorMessage: null,
    infrastructureSnapshot: {
      id: 'snp-source-100',
    },
  };

  beforeEach(async () => {
    const mockPrisma = {
      domain: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      understandingJob: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({}),
      },
      infrastructureSnapshot: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestDomainMaterializer,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    materializer = module.get<GuestDomainMaterializer>(GuestDomainMaterializer);
    prisma = module.get(PrismaService);
  });

  it('should materialize a new customer-owned domain and link understanding', async () => {
    (prisma.domain.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.domain.create as jest.Mock).mockResolvedValue(mockUserDomain);
    (prisma.understandingJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
    (prisma.infrastructureSnapshot.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await materializer.materializeUserDomain(
      'usr-456',
      'github.com',
      'job-source-777',
    );

    expect(prisma.domain.create).toHaveBeenCalledWith({
      data: {
        userId: 'usr-456',
        domainName: 'github.com',
        monitoringEnabled: true,
      },
    });
    expect(result).toEqual(mockUserDomain);
  });
});
