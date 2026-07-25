import { DomainsService } from '../../domains/domains.service';
import { InfrastructureBriefService } from '../../infrastructure-brief/services/infrastructure-brief.service';
import { InfrastructureFindingService } from '../../infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureSnapshotService } from '../../infrastructure-snapshots/services/infrastructure-snapshot.service';
import { InfrastructureVerificationService } from '../../understanding/services/infrastructure-verification.service';
import { DomainDetailsService } from './domain-details.service';

describe('DomainDetailsService', () => {
  let service: DomainDetailsService;
  let domainsService: jest.Mocked<DomainsService>;
  let infrastructureSnapshotService: jest.Mocked<InfrastructureSnapshotService>;
  let infrastructureFindingService: jest.Mocked<InfrastructureFindingService>;
  let infrastructureBriefService: jest.Mocked<InfrastructureBriefService>;
  let verificationService: jest.Mocked<InfrastructureVerificationService>;

  beforeEach(() => {
    domainsService = {
      findById: jest.fn().mockResolvedValue({
        id: 'domain-1',
        domainName: 'app.example.com',
        monitoringEnabled: true,
        createdAt: new Date('2026-07-20T10:00:00Z'),
      }),
    } as unknown as jest.Mocked<DomainsService>;

    infrastructureSnapshotService = {
      getLatestByDomain: jest.fn().mockResolvedValue({
        id: 'snapshot-1',
        domainId: 'domain-1',
        jobId: 'job-1',
        responseTimeMs: 150,
        httpStatus: 200,
        payload: {},
        createdAt: new Date('2026-07-24T18:00:00Z'),
      }),
      countByDomain: jest.fn().mockResolvedValue(12),
    } as unknown as jest.Mocked<InfrastructureSnapshotService>;

    infrastructureFindingService = {
      getSummaryByDomain: jest.fn().mockResolvedValue({
        total: 3,
        critical: 1,
        high: 1,
        medium: 1,
        low: 0,
        informational: 0,
      }),
    } as unknown as jest.Mocked<InfrastructureFindingService>;

    infrastructureBriefService = {
      getLatestByDomain: jest.fn().mockResolvedValue({
        id: 'brief-1',
        snapshotId: 'snapshot-1',
        overallHealth: 'HEALTHY',
        summary: 'All systems operational',
        highlights: ['DNS resolved'],
        recommendations: ['Enable HSTS'],
        version: 1,
        createdAt: new Date('2026-07-24T18:00:00Z'),
      }),
    } as unknown as jest.Mocked<InfrastructureBriefService>;

    verificationService = {
      getLatestByDomain: jest.fn().mockResolvedValue({
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
      countByDomain: jest.fn().mockResolvedValue(30),
    } as unknown as jest.Mocked<InfrastructureVerificationService>;

    service = new DomainDetailsService(
      domainsService,
      infrastructureSnapshotService,
      infrastructureFindingService,
      infrastructureBriefService,
      verificationService,
    );
  });

  it('should delegate atomic read queries cleanly to underlying services', async () => {
    const domain = await service.getDomain('user-1', 'domain-1');
    expect(domain.domainName).toBe('app.example.com');

    const snapshot = await service.getLatestSnapshot('domain-1');
    expect(snapshot?.id).toBe('snapshot-1');

    const snapshotsCount = await service.countSnapshots('domain-1');
    expect(snapshotsCount).toBe(12);

    const findingsSummary = await service.getFindingsSummary('domain-1');
    expect(findingsSummary.total).toBe(3);

    const brief = await service.getLatestBrief('domain-1');
    expect(brief?.summary).toBe('All systems operational');

    const verif = await service.getLatestVerification('domain-1');
    expect(verif?.id).toBe('verif-1');

    const verifCount = await service.countVerifications('domain-1');
    expect(verifCount).toBe(30);
  });
});
