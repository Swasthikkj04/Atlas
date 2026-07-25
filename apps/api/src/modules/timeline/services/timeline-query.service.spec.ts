import { TimelineQueryDto } from '../dto/timeline-query.dto';
import { TimelineRepository } from '../repositories/timeline.repository';
import { TimelineQueryService } from './timeline-query.service';

describe('TimelineQueryService', () => {
  let service: TimelineQueryService;
  let repository: jest.Mocked<TimelineRepository>;

  beforeEach(() => {
    repository = {
      findTimelineChanges: jest.fn().mockResolvedValue({
        data: [],
        pagination: { nextCursor: null, hasMore: false, limit: 20 },
      }),
    } as unknown as jest.Mocked<TimelineRepository>;

    service = new TimelineQueryService(repository);
  });

  it('should delegate query execution to TimelineRepository', async () => {
    const query: TimelineQueryDto = { limit: 20 };
    await service.getTimelineChanges('user-1', query);

    expect(repository.findTimelineChanges).toHaveBeenCalledWith('user-1', query);
  });
});
