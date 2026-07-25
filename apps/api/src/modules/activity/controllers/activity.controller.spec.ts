import { ActivityQueryDto } from '../dto/activity-query.dto';
import { ActivityResponseDto } from '../dto/activity-response.dto';
import { ActivityExperienceService } from '../services/activity-experience.service';
import { ActivityController } from './activity.controller';

describe('ActivityController', () => {
  let controller: ActivityController;
  let activityExperienceService: jest.Mocked<ActivityExperienceService>;

  const mockUser = {
    id: 'user-uuid-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
  };

  const mockActivityResponse: ActivityResponseDto = {
    data: [
      {
        id: 'change-1',
        eventType: 'CHANGE_DETECTED',
        domainId: 'domain-1',
        domainName: 'example.com',
        title: 'A record updated',
        description: 'DNS A record changed',
        severity: 'HIGH',
        module: 'DNS',
        category: 'DNS_RECORD',
        occurredAt: new Date('2026-07-24T18:00:00Z'),
      },
    ],
    pagination: {
      nextCursor: null,
      hasMore: false,
      limit: 20,
    },
  };

  beforeEach(() => {
    activityExperienceService = {
      getActivityData: jest.fn().mockResolvedValue(mockActivityResponse),
    } as unknown as jest.Mocked<ActivityExperienceService>;

    controller = new ActivityController(activityExperienceService);
  });

  it('should return paginated activity feed for GET /activity', async () => {
    const req = { user: mockUser } as any;
    const query: ActivityQueryDto = { limit: 20 };
    const result = await controller.getActivity(req, query);

    expect(activityExperienceService.getActivityData).toHaveBeenCalledWith(
      'user-uuid-1',
      query,
    );
    expect(result).toEqual(mockActivityResponse);
  });
});
