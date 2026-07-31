import { Test, TestingModule } from '@nestjs/testing';
import { GuestEventPublisher } from '../publishers/guest-event.publisher';
import { GuestAnalyticsService } from './guest-analytics.service';

describe('GuestAnalyticsService', () => {
  let service: GuestAnalyticsService;
  let publisher: jest.Mocked<GuestEventPublisher>;

  beforeEach(async () => {
    const mockPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestAnalyticsService,
        { provide: GuestEventPublisher, useValue: mockPublisher },
      ],
    }).compile();

    service = module.get<GuestAnalyticsService>(GuestAnalyticsService);
    publisher = module.get(GuestEventPublisher);
  });

  it('should emit GUEST_SESSION_CREATED event', async () => {
    await service.trackSessionCreated('gst-123');

    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'GUEST_SESSION_CREATED',
        guestSessionId: 'gst-123',
      }),
    );
  });

  it('should emit GUEST_UNDERSTANDING_STARTED event', async () => {
    await service.trackUnderstandingStarted('gst-123', 'github.com');

    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'GUEST_UNDERSTANDING_STARTED',
        guestSessionId: 'gst-123',
        domain: 'github.com',
      }),
    );
  });

  it('should emit GUEST_CONVERTED event with duration', async () => {
    await service.trackConverted('gst-123', 'github.com', 145);

    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'GUEST_CONVERTED',
        guestSessionId: 'gst-123',
        domain: 'github.com',
        metadata: { durationSeconds: 145 },
      }),
    );
  });
});
