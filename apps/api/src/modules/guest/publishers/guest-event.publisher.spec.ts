import { Test, TestingModule } from '@nestjs/testing';
import { ActivityRepository } from '../../activity/repositories/activity.repository';
import { GuestEventPublisher } from './guest-event.publisher';

describe('GuestEventPublisher', () => {
  let publisher: GuestEventPublisher;
  let activityRepository: jest.Mocked<ActivityRepository>;

  beforeEach(async () => {
    const mockActivityRepo = {
      findActivityFeed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestEventPublisher,
        { provide: ActivityRepository, useValue: mockActivityRepo },
      ],
    }).compile();

    publisher = module.get<GuestEventPublisher>(GuestEventPublisher);
    activityRepository = module.get(ActivityRepository);
  });

  it('should publish business event without throwing error', async () => {
    await expect(
      publisher.publish({
        type: 'GUEST_SESSION_CREATED',
        guestSessionId: 'gst-123',
        timestamp: new Date(),
      }),
    ).resolves.not.toThrow();
  });

  it('should handle analytics publication errors gracefully without crashing user request', async () => {
    jest.spyOn(publisher['logger'], 'log').mockImplementation(() => {
      throw new Error('Analytics database unreachable');
    });

    await expect(
      publisher.publish({
        type: 'GUEST_CONVERTED',
        guestSessionId: 'gst-123',
        domain: 'github.com',
        timestamp: new Date(),
        metadata: { durationSeconds: 120 },
      }),
    ).resolves.not.toThrow();
  });
});
