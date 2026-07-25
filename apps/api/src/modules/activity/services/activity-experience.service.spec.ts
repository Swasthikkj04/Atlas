import { ActivityQueryDto } from '../dto/activity-query.dto';
import { ActivityExperienceService } from './activity-experience.service';
import { ActivityQueryService } from './activity-query.service';

describe('ActivityExperienceService', () => {
  let experienceService: ActivityExperienceService;
  let queryService: jest.Mocked<ActivityQueryService>;

  beforeEach(() => {
    queryService = {
      getActivityFeed: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'change-1',
            eventType: 'CHANGE_DETECTED',
            domainId: 'domain-1',
            domainName: 'example.com',
            title: 'DNS A record modified',
            description: 'Updated to 1.0.0.1',
            severity: 'HIGH',
            module: 'DNS',
            category: 'DNS_RECORD',
            occurredAt: new Date('2026-07-24T18:00:00Z'),
          },
        ],
        pagination: { nextCursor: null, hasMore: false, limit: 20 },
      }),
    } as unknown as jest.Mocked<ActivityQueryService>;

    experienceService = new ActivityExperienceService(queryService);
  });

  it('should map raw activity records into ActivityResponseDto', async () => {
    const query: ActivityQueryDto = { limit: 20 };
    const response = await experienceService.getActivityData('user-1', query);

    expect(queryService.getActivityFeed).toHaveBeenCalledWith('user-1', query);
    expect(response.data).toHaveLength(1);
    expect(response.data[0]).toEqual({
      id: 'change-1',
      eventType: 'CHANGE_DETECTED',
      domainId: 'domain-1',
      domainName: 'example.com',
      title: 'DNS A record modified',
      description: 'Updated to 1.0.0.1',
      severity: 'HIGH',
      module: 'DNS',
      category: 'DNS_RECORD',
      occurredAt: expect.any(Date),
    });
    expect(response.pagination).toEqual({
      nextCursor: null,
      hasMore: false,
      limit: 20,
    });
  });
});
