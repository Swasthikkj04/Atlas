import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { StatisticsRepository } from './statistics.repository';

describe('StatisticsRepository', () => {
  let repository: StatisticsRepository;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      domain: {
        count: jest.fn().mockResolvedValue(10),
      },
      infrastructureSnapshot: {
        count: jest.fn().mockResolvedValue(250),
      },
      infrastructureFinding: {
        groupBy: jest.fn().mockResolvedValue([
          { severity: 'CRITICAL', _count: { severity: 1 } },
          { severity: 'HIGH', _count: { severity: 2 } },
          { severity: 'MEDIUM', _count: { severity: 3 } },
          { severity: 'LOW', _count: { severity: 4 } },
        ]),
      },
      changeHistory: {
        count: jest.fn().mockResolvedValue(15),
      },
      infrastructureVerification: {
        count: jest.fn().mockResolvedValue(40),
      },
      understandingJob: {
        count: jest.fn().mockResolvedValue(100),
      },
    } as unknown as jest.Mocked<PrismaService>;

    repository = new StatisticsRepository(prisma);
  });

  it('should query Prisma models in parallel and compute domain health metrics', async () => {
    const stats = await repository.getWorkspaceStatistics('user-1');

    expect(prisma.domain.count).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prisma.infrastructureSnapshot.count).toHaveBeenCalled();
    expect(prisma.infrastructureFinding.groupBy).toHaveBeenCalled();
    expect(prisma.changeHistory.count).toHaveBeenCalled();
    expect(prisma.infrastructureVerification.count).toHaveBeenCalled();
    expect(prisma.understandingJob.count).toHaveBeenCalled();

    expect(stats.domains.total).toBe(10);
    expect(stats.domains.critical).toBe(1);
    expect(stats.domains.warning).toBe(2);
    expect(stats.domains.healthy).toBe(7);
    expect(stats.findings.total).toBe(10);
    expect(stats.snapshots.total).toBe(250);
  });
});
