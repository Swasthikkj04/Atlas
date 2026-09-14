import { DomainDetailsService } from './domain-details.service';
import { DomainExperienceService } from './domain-experience.service';

describe('DomainExperienceService', () => {
  let experienceService: DomainExperienceService;
  let domainDetailsService: jest.Mocked<DomainDetailsService>;

  beforeEach(() => {
    domainDetailsService = {
      getDomain: jest.fn().mockResolvedValue({
        id: 'domain-1',
        domainName: 'app.example.com',
        monitoringEnabled: true,
        createdAt: new Date('2026-07-20T10:00:00Z'),
      }),
      getLatestSnapshot: jest.fn().mockResolvedValue({
        id: 'snapshot-1',
        domainId: 'domain-1',
        jobId: 'job-1',
        responseTimeMs: 150,
        httpStatus: 200,
        payload: {},
        createdAt: new Date('2026-07-24T18:00:00Z'),
      }),
      countSnapshots: jest.fn().mockResolvedValue(12),
      getFindingsSummary: jest.fn().mockResolvedValue({
        total: 3,
        critical: 1,
        high: 1,
        medium: 1,
        low: 0,
        informational: 0,
      }),
      getLatestBrief: jest.fn().mockResolvedValue({
        id: 'brief-1',
        snapshotId: 'snapshot-1',
        overallHealth: 'HEALTHY',
        summary: 'All systems operational',
        highlights: ['DNS resolved'],
        recommendations: ['Enable HSTS'],
        version: 1,
        createdAt: new Date('2026-07-24T18:00:00Z'),
      }),
      getLatestVerification: jest.fn().mockResolvedValue({
        id: 'verif-1',
        domainId: 'domain-1',
        jobId: 'job-1',
        snapshotId: 'snapshot-1',
        changeDetected: false,
        snapshotCreated: false,
        startedAt: new Date('2026-07-24T17:59:59Z'),
        completedAt: new Date('2026-07-24T18:00:00Z'),
        durationMs: 1000,
        createdAt: new Date('2026-07-24T18:00:00Z'),
      }),
      countVerifications: jest.fn().mockResolvedValue(30),
    } as unknown as jest.Mocked<DomainDetailsService>;

    experienceService = new DomainExperienceService(domainDetailsService);
  });

  it('should aggregate domain overview data in parallel via DomainDetailsService', async () => {
    const result = await experienceService.getDomainOverview(
      'user-1',
      'domain-1',
    );

    expect(domainDetailsService.getDomain).toHaveBeenCalledWith(
      'user-1',
      'domain-1',
    );
    expect(domainDetailsService.getLatestSnapshot).toHaveBeenCalledWith(
      'domain-1',
    );
    expect(domainDetailsService.countSnapshots).toHaveBeenCalledWith(
      'domain-1',
    );
    expect(domainDetailsService.getFindingsSummary).toHaveBeenCalledWith(
      'domain-1',
      'snapshot-1',
    );
    expect(domainDetailsService.getLatestBrief).toHaveBeenCalledWith(
      'domain-1',
    );
    expect(domainDetailsService.getLatestVerification).toHaveBeenCalledWith(
      'domain-1',
    );
    expect(domainDetailsService.countVerifications).toHaveBeenCalledWith(
      'domain-1',
    );

    expect(result.domain.domainName).toBe('app.example.com');
    expect(result.health.score).toBe(65);
    expect(result.statistics.totalSnapshots).toBe(12);
    expect(result.statistics.totalVerifications).toBe(30);
  });

  it('should aggregate domain details in parallel via DomainDetailsService', async () => {
    const result = await experienceService.getDomainDetails(
      'user-1',
      'domain-1',
    );

    expect(domainDetailsService.getDomain).toHaveBeenCalledWith(
      'user-1',
      'domain-1',
    );
    expect(domainDetailsService.getLatestSnapshot).toHaveBeenCalledWith(
      'domain-1',
    );
    expect(result.domain.domainName).toBe('app.example.com');
    expect(result.latestBrief?.summary).toBe('All systems operational');
  });
});
