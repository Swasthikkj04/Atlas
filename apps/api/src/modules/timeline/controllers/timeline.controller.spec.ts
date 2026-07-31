import { TimelineDetailDto } from '../dto/timeline-detail.dto';
import { TimelineQueryDto } from '../dto/timeline-query.dto';
import { TimelineResponseDto } from '../dto/timeline-response.dto';
import { TimelineExperienceService } from '../services/timeline-experience.service';
import { TimelineController } from './timeline.controller';

describe('TimelineController', () => {
  let controller: TimelineController;
  let timelineExperienceService: jest.Mocked<TimelineExperienceService>;

  const mockUser = {
    id: 'user-uuid-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
  };

  const mockTimelineResponse: TimelineResponseDto = {
    data: [
      {
        id: 'change-1',
        domainId: 'domain-1',
        domainName: 'example.com',
        module: 'DNS' as any,
        category: 'DNS_RECORD',
        changeType: 'MODIFIED',
        severity: 'HIGH',
        title: 'A record updated',
        description: 'DNS A record changed to 1.0.0.1',
        detectedAt: new Date('2026-07-24T18:00:00Z'),
      },
    ],
    pagination: {
      nextCursor: null,
      hasMore: false,
      limit: 20,
    },
  };

  const mockDetailResponse: TimelineDetailDto = {
    event: {
      id: 'change-1',
      timestamp: new Date('2026-07-24T18:00:00Z'),
      domainId: 'domain-1',
      domainName: 'example.com',
      title: 'A record updated',
      description: 'DNS A record changed to 1.0.0.1',
      changeType: 'MODIFIED',
      severity: 'HIGH',
      category: 'DNS_RECORD',
      confidence: 1.0,
      summary: 'DNS Configuration Changed',
      findingCount: 1,
      observationCount: 2,
      evidenceCount: 1,
    },
    rule: {
      ruleId: 'rule.dns.dns_record',
      ruleVersion: '1.0.0',
      name: 'DNS_RECORD Change Detection Rule',
      description: 'Detects modified infrastructure states.',
    },
    observations: [],
    evidence: [],
    previousSnapshotId: 'prev-1',
    currentSnapshotId: 'curr-1',
  };

  beforeEach(() => {
    timelineExperienceService = {
      getTimelineData: jest.fn().mockResolvedValue(mockTimelineResponse),
      getTimelineEventDetails: jest.fn().mockResolvedValue(mockDetailResponse),
    } as unknown as jest.Mocked<TimelineExperienceService>;

    controller = new TimelineController(timelineExperienceService);
  });

  it('should return paginated timeline data for GET /timeline', async () => {
    const req = { user: mockUser } as any;
    const query: TimelineQueryDto = { limit: 20 };
    const result = await controller.getTimeline(req, query);

    expect(timelineExperienceService.getTimelineData).toHaveBeenCalledWith(
      'user-uuid-1',
      query,
    );
    expect(result).toEqual(mockTimelineResponse);
  });

  it('should return timeline details for GET /timeline/:id/details', async () => {
    const req = { user: mockUser } as any;
    const result = await controller.getTimelineEventDetails(req, 'change-1');

    expect(
      timelineExperienceService.getTimelineEventDetails,
    ).toHaveBeenCalledWith('user-uuid-1', 'change-1');
    expect(result.event.title).toBe('A record updated');
    expect(result.event.summary).toBe('DNS Configuration Changed');
  });
});
