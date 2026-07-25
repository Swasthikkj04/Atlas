import { StatisticsResponseDto } from '../dto/statistics-response.dto';
import { StatisticsExperienceService } from '../services/statistics-experience.service';
import { StatisticsController } from './statistics.controller';

describe('StatisticsController', () => {
  let controller: StatisticsController;
  let statisticsExperienceService: jest.Mocked<StatisticsExperienceService>;

  const mockUser = {
    id: 'user-uuid-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
  };

  const mockStatsResponse: StatisticsResponseDto = {
    domains: { total: 10, healthy: 8, warning: 1, critical: 1 },
    findings: { critical: 1, high: 2, medium: 3, low: 4, total: 10 },
    changes: { today: 2, week: 10, month: 30, total: 100 },
    verifications: { today: 5, week: 25, month: 80, total: 200 },
    snapshots: { total: 150 },
    understanding: { completed: 90, running: 1, failed: 2 },
  };

  beforeEach(() => {
    statisticsExperienceService = {
      getStatisticsData: jest.fn().mockResolvedValue(mockStatsResponse),
    } as unknown as jest.Mocked<StatisticsExperienceService>;

    controller = new StatisticsController(statisticsExperienceService);
  });

  it('should return aggregated workspace statistics for GET /workspace/statistics', async () => {
    const req = { user: mockUser } as any;
    const result = await controller.getStatistics(req);

    expect(statisticsExperienceService.getStatisticsData).toHaveBeenCalledWith(
      'user-uuid-1',
    );
    expect(result).toEqual(mockStatsResponse);
  });
});
