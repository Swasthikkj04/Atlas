import { StatisticsResponseDto } from '../dto/statistics-response.dto';
import { StatisticsExperienceService } from './statistics-experience.service';
import { StatisticsQueryService } from './statistics-query.service';

describe('StatisticsExperienceService', () => {
  let service: StatisticsExperienceService;
  let queryService: jest.Mocked<StatisticsQueryService>;

  const mockStatsResponse: StatisticsResponseDto = {
    domains: { total: 10, healthy: 8, warning: 1, critical: 1 },
    findings: { critical: 1, high: 2, medium: 3, low: 4, total: 10 },
    changes: { today: 2, week: 10, month: 30, total: 100 },
    verifications: { today: 5, week: 25, month: 80, total: 200 },
    snapshots: { total: 150 },
    understanding: { completed: 90, running: 1, failed: 2 },
  };

  beforeEach(() => {
    queryService = {
      getRawStatistics: jest.fn().mockResolvedValue(mockStatsResponse),
    } as unknown as jest.Mocked<StatisticsQueryService>;

    service = new StatisticsExperienceService(queryService);
  });

  it('should return statistics response from query service', async () => {
    const result = await service.getStatisticsData('user-1');

    expect(queryService.getRawStatistics).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(mockStatsResponse);
  });
});
