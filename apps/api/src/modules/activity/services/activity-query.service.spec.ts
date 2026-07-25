import { ActivityQueryDto } from '../dto/activity-query.dto';
import { ActivityRepository } from '../repositories/activity.repository';
import { ActivityQueryService } from './activity-query.service';

describe('ActivityQueryService', () => {
  let service: ActivityQueryService;
  let repository: jest.Mocked<ActivityRepository>;

  beforeEach(() => {
    repository = {
      findActivityFeed: jest.fn().mockResolvedValue({
        data: [],
        pagination: { nextCursor: null, hasMore: false, limit: 20 },
      }),
    } as unknown as jest.Mocked<ActivityRepository>;

    service = new ActivityQueryService(repository);
  });

  it('should delegate activity feed query to ActivityRepository', async () => {
    const query: ActivityQueryDto = { limit: 20 };
    await service.getActivityFeed('user-1', query);

    expect(repository.findActivityFeed).toHaveBeenCalledWith('user-1', query);
  });
});
