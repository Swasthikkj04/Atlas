import { StatisticsRepository } from '../repositories/statistics.repository';
import { StatisticsQueryService } from './statistics-query.service';

describe('StatisticsQueryService', () => {
  let service: StatisticsQueryService;
  let repository: jest.Mocked<StatisticsRepository>;

  const mockRawStats = {
    domains: { total: 10, healthy: 8, warning: 1, critical: 1 },
    findings: { critical: 1, high: 2, medium: 3, low: 4, total: 10 },
    changes: { today: 2, week: 10, month: 30, total: 100 },
    verifications: { today: 5, week: 25, month: 80, total: 200 },
    snapshots: { total: 150 },
    understanding: { completed: 90, running: 1, failed: 2 },
  };

  beforeEach(() => {
    repository = {
      getWorkspaceStatistics: jest.fn().mockResolvedValue(mockRawStats),
    } as unknown as jest.Mocked<StatisticsRepository>;

    service = new StatisticsQueryService(repository);
  });

  it('should delegate getRawStatistics call to StatisticsRepository', async () => {
    const result = await service.getRawStatistics('user-1');

    expect(repository.getWorkspaceStatistics).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(mockRawStats);
  });
});
