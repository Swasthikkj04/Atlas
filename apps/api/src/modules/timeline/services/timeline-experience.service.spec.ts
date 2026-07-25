import { TimelineQueryDto } from '../dto/timeline-query.dto';
import { ChangeDiffEngineService } from './change-diff-engine.service';
import { TimelineExperienceService } from './timeline-experience.service';
import { TimelineQueryService } from './timeline-query.service';

describe('TimelineExperienceService', () => {
  let experienceService: TimelineExperienceService;
  let queryService: jest.Mocked<TimelineQueryService>;
  let changeDiffEngineService: ChangeDiffEngineService;

  const mockRecord = {
    id: 'change-1',
    domainId: 'domain-1',
    module: 'DNS' as any,
    category: 'DNS_RECORD' as any,
    changeType: 'MODIFIED' as any,
    severity: 'HIGH' as any,
    title: 'A record updated',
    description: 'Updated to 1.0.0.1',
    detectedAt: new Date('2026-07-24T18:00:00Z'),
    previousSnapshotId: 'prev-1',
    currentSnapshotId: 'curr-1',
    domain: { domainName: 'example.com' },
  };

  beforeEach(() => {
    queryService = {
      getTimelineChanges: jest.fn().mockResolvedValue({
        data: [mockRecord],
        pagination: { nextCursor: null, hasMore: false, limit: 20 },
      }),
      getTimelineChangeById: jest.fn().mockResolvedValue(mockRecord),
      findSnapshotById: jest.fn().mockImplementation((snapshotId: string) => {
        if (snapshotId === 'curr-1') {
          return Promise.resolve({
            id: 'curr-1',
            responseTimeMs: 120,
            httpStatus: 200,
            createdAt: new Date('2026-07-24T18:00:00Z'),
            payload: { technologies: ['React'], ipv4Addresses: ['1.0.0.1'] },
          });
        }
        if (snapshotId === 'prev-1') {
          return Promise.resolve({
            id: 'prev-1',
            responseTimeMs: 150,
            httpStatus: 200,
            createdAt: new Date('2026-07-24T17:00:00Z'),
            payload: { technologies: [], ipv4Addresses: ['1.0.0.1'] },
          });
        }
        return Promise.resolve(null);
      }),
      findFindingsBySnapshot: jest.fn().mockResolvedValue([]),
      findRawEvidenceByDomain: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<TimelineQueryService>;

    changeDiffEngineService = new ChangeDiffEngineService();
    experienceService = new TimelineExperienceService(
      queryService,
      changeDiffEngineService,
    );
  });

  it('should map query records into TimelineResponseDto with enriched event fields', async () => {
    const query: TimelineQueryDto = { limit: 20 };
    const response = await experienceService.getTimelineData('user-1', query);

    expect(queryService.getTimelineChanges).toHaveBeenCalledWith('user-1', query);
    expect(response.data).toHaveLength(1);
    expect(response.data[0]).toEqual({
      id: 'change-1',
      timestamp: new Date('2026-07-24T18:00:00Z'),
      domainId: 'domain-1',
      domainName: 'example.com',
      title: 'A record updated',
      description: 'Updated to 1.0.0.1',
      changeType: 'MODIFIED',
      severity: 'HIGH',
      category: 'DNS_RECORD',
      confidence: 1.0,
      summary: 'DNS Configuration Changed',
      impact: 'HIGH Risk: DNS_RECORD change (modified) impacts security posture and requires immediate review.',
      findingCount: 1,
      observationCount: 2,
      evidenceCount: 1,
    });
  });

  it('should retrieve deep event details for getTimelineEventDetails with change diff', async () => {
    const details = await experienceService.getTimelineEventDetails('user-1', 'change-1');

    expect(queryService.getTimelineChangeById).toHaveBeenCalledWith('user-1', 'change-1');
    expect(details.event.summary).toBe('DNS Configuration Changed');
    expect(details.previousSnapshotId).toBe('prev-1');
    expect(details.currentSnapshotId).toBe('curr-1');
    expect(details.rule?.ruleId).toBe('rule.dns.dns_record');
    expect(details.changeDiff).toBeDefined();
    expect(details.changeDiff?.technologies.added).toContain('React');
  });
});
