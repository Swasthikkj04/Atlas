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

    expect(queryService.getTimelineChanges).toHaveBeenCalledWith(
      'user-1',
      query,
    );
    expect(response.data).toHaveLength(1);
    expect(response.data[0]).toEqual(
      expect.objectContaining({
        id: 'change-1',
        timestamp: new Date('2026-07-24T18:00:00Z'),
        detectedAt: '2026-07-24T18:00:00.000Z',
        snapshotId: 'curr-1',
        currentSnapshotId: 'curr-1',
        previousSnapshotId: 'prev-1',
        domainId: 'domain-1',
        domainName: 'example.com',
        title: 'A record updated',
        description: 'Updated to 1.0.0.1',
        changeType: 'MODIFIED',
        severity: 'HIGH',
        category: 'DNS_RECORD',
        confidence: 1.0,
        summary: 'DNS Configuration Changed',
        impact:
          'HIGH Risk: DNS_RECORD change (modified) impacts security posture and requires immediate review.',
        findingCount: 1,
        observationCount: 2,
        evidenceCount: 1,
      }),
    );
  });

  it('should retrieve deep event details for getTimelineEventDetails with change diff', async () => {
    const details = await experienceService.getTimelineEventDetails(
      'user-1',
      'change-1',
    );

    expect(queryService.getTimelineChangeById).toHaveBeenCalledWith(
      'user-1',
      'change-1',
    );
    expect(details.event.summary).toBe('DNS Configuration Changed');
    expect(details.previousSnapshotId).toBe('prev-1');
    expect(details.currentSnapshotId).toBe('curr-1');
    expect(details.rule?.ruleId).toBe('rule.dns.dns_record');
    expect(details.changeDiff).toBeDefined();
    expect(details.changeDiff?.technologies.added).toContain('React');
  });

  it('should generate authoritative intelligence, boundaries, and derived summary for Content-Security-Policy improvement (WX-1024)', async () => {
    const cspRecord = {
      id: 'change-csp-1',
      domainId: 'domain-1',
      module: 'HTTP' as any,
      category: 'SECURITY_HEADER' as any,
      changeType: 'ADDED' as any,
      severity: 'LOW' as any,
      title: 'Content-Security-Policy added',
      description:
        "Content-Security-Policy response header added with value \"default-src 'self'; script-src 'self' https:; object-src 'none'\".",
      detectedAt: new Date('2026-08-25T19:04:00Z'),
      previousSnapshotId: 'snp-prev-1',
      currentSnapshotId: 'snp-curr-2',
      domain: { domainName: 'example.com' },
    };

    queryService.getTimelineChanges.mockResolvedValueOnce({
      data: [cspRecord],
      pagination: { nextCursor: null, hasMore: false, limit: 20 },
    });

    const response = await experienceService.getTimelineData('user-1', {
      limit: 20,
    });

    expect(response.data).toHaveLength(1);
    const cspEvent = response.data[0];

    // Outcome summary
    expect(cspEvent.summary).toBe('Protection improved');
    expect(cspEvent.subject).toBe('Content-Security-Policy');

    // Consequence explanation
    expect(cspEvent.explanation).toBe(
      "Content-Security-Policy provides an additional browser-side defense against certain content-injection scenarios. Its addition strengthens the domain's defensive posture compared with the previous verified state.",
    );

    // Establishing and Non-establishing boundaries (WX-1023 / WX-1024)
    expect(cspEvent.whatThisEstablishes).toBe(
      'Nebula verified that the current authoritative response contains a Content-Security-Policy that differs from the previous verified response.',
    );
    expect(cspEvent.whatThisDoesNotEstablish).toBe(
      'This change does not guarantee that all content-injection or XSS scenarios are prevented.',
    );

    // Derived summary
    expect(cspEvent.derivedSummary).toEqual({
      previousLabel: 'No effective CSP',
      currentLabel: 'CSP present',
      postureChange: 'Protection improved',
      directives: { previous: 0, current: 3 },
      allowedSources: 'Configured',
      browserRestrictions: 'Stronger',
      overallPosture: 'Improved',
    });
  });
});
