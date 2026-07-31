import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { DomainsService } from '../../domains/domains.service';
import { InfrastructureFindingService } from '../../infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureSnapshotService } from '../../infrastructure-snapshots/services/infrastructure-snapshot.service';
import { UnderstandingService } from '../../understanding/understanding.service';
import { WorkspaceQueryService } from './workspace-query.service';

describe('WorkspaceQueryService', () => {
  let service: WorkspaceQueryService;
  let prismaService: jest.Mocked<PrismaService>;
  let domainsService: jest.Mocked<DomainsService>;
  let infrastructureSnapshotService: jest.Mocked<InfrastructureSnapshotService>;
  let infrastructureFindingService: jest.Mocked<InfrastructureFindingService>;
  let understandingService: jest.Mocked<UnderstandingService>;

  beforeEach(() => {
    prismaService = {
      domain: {
        count: jest.fn().mockResolvedValue(10),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'domain-1',
            domainName: 'app.example.com',
            monitoringEnabled: true,
            createdAt: new Date('2026-07-22T10:00:00Z'),
            updatedAt: new Date('2026-07-22T10:00:00Z'),
          },
        ]),
      },
      infrastructureSnapshot: {
        count: jest.fn().mockResolvedValue(45),
        findFirst: jest.fn().mockResolvedValue({
          createdAt: new Date('2026-07-24T12:00:00Z'),
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'snap-1',
            domainId: 'domain-1',
            createdAt: new Date('2026-07-24T12:00:00Z'),
            payload: { technologies: ['React', 'Node.js'] },
            findings: [
              { severity: 'CRITICAL', title: 'Critical Bug' },
              { severity: 'HIGH', title: 'High Bug' },
            ],
          },
        ]),
      },
      infrastructureVerification: {
        count: jest.fn().mockResolvedValue(20),
        findMany: jest.fn().mockResolvedValue([]),
      },
      understandingJob: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([]),
      },
      infrastructureFinding: {
        count: jest.fn().mockResolvedValue(15),
        groupBy: jest.fn().mockResolvedValue([
          { severity: 'CRITICAL', _count: { severity: 1 } },
          { severity: 'HIGH', _count: { severity: 2 } },
          { severity: 'MEDIUM', _count: { severity: 3 } },
          { severity: 'LOW', _count: { severity: 4 } },
          { severity: 'INFO', _count: { severity: 5 } },
        ]),
        findMany: jest.fn().mockResolvedValue([]),
      },
      changeHistory: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest
          .fn()
          .mockResolvedValue([{ domainId: 'domain-1', _count: { id: 2 } }]),
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as unknown as jest.Mocked<PrismaService>;

    domainsService = {
      countByUser: jest.fn().mockResolvedValue(10),
      countActiveByUser: jest.fn().mockResolvedValue(8),
      findByUser: jest.fn().mockResolvedValue([
        {
          id: 'domain-1',
          domainName: 'app.example.com',
          monitoringEnabled: true,
          createdAt: new Date('2026-07-22T10:00:00Z'),
        },
      ]),
    } as unknown as jest.Mocked<DomainsService>;

    infrastructureSnapshotService = {
      countByUser: jest.fn().mockResolvedValue(45),
      findLatestScanByUser: jest
        .fn()
        .mockResolvedValue(new Date('2026-07-24T12:00:00Z')),
    } as unknown as jest.Mocked<InfrastructureSnapshotService>;

    infrastructureFindingService = {
      getSeveritySummaryByUser: jest.fn().mockResolvedValue({
        critical: 1,
        high: 2,
        medium: 3,
        low: 4,
        informational: 5,
      }),
      getWorkspaceFindingSummaryByUser: jest.fn().mockResolvedValue({
        total: 15,
        unresolved: 15,
        resolved: 0,
      }),
    } as unknown as jest.Mocked<InfrastructureFindingService>;

    understandingService = {
      countRunningJobs: jest.fn().mockResolvedValue(1),
    } as unknown as jest.Mocked<UnderstandingService>;

    service = new WorkspaceQueryService(
      prismaService,
      domainsService,
      infrastructureSnapshotService,
      infrastructureFindingService,
      understandingService,
    );
  });

  it('should build summary metrics correctly', async () => {
    const summary = await service.buildSummary('user-1');
    expect(summary).toEqual({
      totalDomains: 10,
      activeDomains: 10,
      totalSnapshots: 45,
      totalVerifications: 20,
      totalFindings: 15,
      runningJobs: 1,
      latestScan: expect.any(Date),
    });
  });

  it('should build health metrics deterministically', async () => {
    const health = await service.buildHealth('user-1');
    expect(health).toEqual({
      score: 32,
      grade: 'F',
      trend: 'STABLE',
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
      informational: 5,
    });
  });

  it('should build active domains list with domain-specific health and metrics', async () => {
    const activeDomains = await service.buildActiveDomains('user-1');
    expect(activeDomains).toHaveLength(1);
    expect(activeDomains[0]).toEqual({
      id: 'domain-1',
      domainName: 'app.example.com',
      healthScore: 65,
      lastUnderstanding: expect.any(Date),
      technologiesCount: 2,
      criticalFindings: 1,
      recentChangesCount: 2,
      findingsCount: 2,
      trend: 'DEGRADED',
      latestSnapshotId: 'snap-1',
    });
  });

  it('should build recent domains list', async () => {
    const domains = await service.buildRecentDomains('user-1');
    expect(domains).toHaveLength(1);
    expect(domains[0].domainName).toBe('app.example.com');
  });
});
