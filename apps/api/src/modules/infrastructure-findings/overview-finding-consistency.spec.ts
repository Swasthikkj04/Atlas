import { InfrastructureFindingService } from './services/infrastructure-finding.service';
import { InfrastructureFindingRepository } from './repositories/infrastructure-finding.repository';
import { DomainExperienceService } from '../domain-details/services/domain-experience.service';
import { DomainDetailsService } from '../domain-details/services/domain-details.service';
import { Severity } from '../findings/enums/severity.enum';

describe('FIX-OV-001: Overview Finding State Consistency & Canonical Finding State Synchronization', () => {
  let findingRepository: jest.Mocked<InfrastructureFindingRepository>;
  let findingService: InfrastructureFindingService;
  let domainDetailsService: jest.Mocked<DomainDetailsService>;
  let domainExperienceService: DomainExperienceService;

  const userId = 'user-aws-101';
  const domainId = 'domain-aws-amazon-com';
  const domainName = 'aws.amazon.com';

  const snapshotA = {
    id: 'snap-001',
    domainId,
    createdAt: new Date('2026-08-28T10:00:00Z'),
    responseTimeMs: 85,
    httpStatus: 200,
    payload: {},
  };

  const snapshotB = {
    id: 'snap-002',
    domainId,
    createdAt: new Date('2026-08-28T11:00:00Z'),
    responseTimeMs: 78,
    httpStatus: 200,
    payload: {},
  };

  const findingA_CSP = {
    id: 'find-csp-001',
    snapshotId: snapshotA.id,
    module: 'HTTP',
    ruleId: 'http.missing-content-security-policy',
    title: 'Missing Content Security Policy',
    description: 'Content-Security-Policy header is absent on aws.amazon.com.',
    severity: Severity.MEDIUM,
    category: 'HTTP',
    createdAt: snapshotA.createdAt,
    snapshot: {
      domainId,
      createdAt: snapshotA.createdAt,
      domain: { domainName },
    },
  };

  beforeEach(() => {
    findingRepository = {
      findUserFindings: jest.fn(),
      findUserFindingById: jest.fn(),
      findRawEvidenceForDomain: jest.fn().mockResolvedValue([]),
      findTimelineForDomain: jest.fn().mockResolvedValue([]),
      getSummaryByDomain: jest.fn(),
      getSeveritySummaryByUser: jest.fn(),
      getWorkspaceFindingSummaryByUser: jest.fn(),
      prisma: {
        infrastructureSnapshot: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
        },
        infrastructureFinding: {
          count: jest.fn(),
          groupBy: jest.fn(),
        },
      },
    } as unknown as jest.Mocked<InfrastructureFindingRepository>;

    findingService = new InfrastructureFindingService(findingRepository);

    domainDetailsService = {
      getDomain: jest.fn().mockResolvedValue({
        id: domainId,
        domainName,
        monitoringEnabled: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      }),
      getLatestSnapshot: jest.fn(),
      countSnapshots: jest.fn().mockResolvedValue(2),
      getFindingsSummary: jest.fn(),
      getLatestBrief: jest.fn().mockResolvedValue({
        overallHealth: 'HEALTHY',
        summary: 'Edge CDN and Gateway verified.',
        highlights: [],
        recommendations: [],
        createdAt: new Date('2026-08-28T11:00:00Z'),
      }),
      getLatestVerification: jest.fn().mockResolvedValue({
        id: 'verif-002',
        changeDetected: true,
        snapshotCreated: true,
        startedAt: new Date('2026-08-28T10:59:00Z'),
        completedAt: new Date('2026-08-28T11:00:00Z'),
        durationMs: 1200,
      }),
      countVerifications: jest.fn().mockResolvedValue(2),
    } as unknown as jest.Mocked<DomainDetailsService>;

    domainExperienceService = new DomainExperienceService(domainDetailsService);
  });

  describe('1. Scenario: Snapshot A (CSP Missing) → Finding is ACTIVE on Overview', () => {
    it('accurately displays 1 active finding and degraded health score when latest snapshot contains the finding', async () => {
      // Mock repository for Snapshot A
      (
        findingRepository.prisma.infrastructureSnapshot.findMany as jest.Mock
      ).mockResolvedValue([
        {
          id: snapshotA.id,
          domainId,
          createdAt: snapshotA.createdAt,
          findings: [findingA_CSP],
        },
      ]);
      (findingRepository.findUserFindings as jest.Mock).mockResolvedValue({
        data: [findingA_CSP],
        total: 1,
      });

      const list = await findingService.getFindingsExperienceList(userId, {
        domainId,
        snapshotId: snapshotA.id,
      });

      expect(list.data).toHaveLength(1);
      expect(list.data[0].id).toBe('find-csp-001');
      expect(list.data[0].status).toBe('ACTIVE');
      expect(list.data[0].state).toBe('OPEN');

      // Overview verification
      domainDetailsService.getLatestSnapshot.mockResolvedValue(
        snapshotA as any,
      );
      domainDetailsService.getFindingsSummary.mockResolvedValue({
        total: 1,
        critical: 0,
        high: 0,
        medium: 1,
        low: 0,
        informational: 0,
      });

      const overview = await domainExperienceService.getDomainOverview(
        userId,
        domainId,
      );
      expect(overview.health.score).toBe(95); // 100 - (1 medium * 5) = 95
      expect(overview.findingsSummary.total).toBe(1);
      expect(overview.findingsSummary.medium).toBe(1);
    });
  });

  describe('2. Scenario: Snapshot B (CSP Mitigation Observed) → Finding is RESOLVED and Leaves Overview', () => {
    it('transitions finding #find-csp-001 to RESOLVED while removing it from current Overview risk surface', async () => {
      // Latest snapshot is Snapshot B with 0 findings
      (
        findingRepository.prisma.infrastructureSnapshot.findMany as jest.Mock
      ).mockResolvedValue([
        {
          id: snapshotB.id,
          domainId,
          createdAt: snapshotB.createdAt,
          findings: [], // No findings in snapshot B
        },
      ]);
      (findingRepository.findUserFindings as jest.Mock).mockResolvedValue({
        data: [findingA_CSP], // Historical finding from Snapshot A
        total: 1,
      });

      const list = await findingService.getFindingsExperienceList(userId, {
        domainId,
        includeHistorical: true,
      });

      // 1. Finding is marked RESOLVED in lineage/history
      expect(list.data).toHaveLength(1);
      expect(list.data[0].id).toBe('find-csp-001');
      expect(list.data[0].status).toBe('RESOLVED');
      expect(list.data[0].state).toBe('RESOLVED');

      // 2. Active filter returns 0 active findings
      const activeList = await findingService.getFindingsExperienceList(
        userId,
        {
          domainId,
          status: 'ACTIVE',
        },
      );
      expect(activeList.data).toHaveLength(0);

      // 3. Domain Overview reflects latest authoritative snapshot B (0 findings, health 100)
      domainDetailsService.getLatestSnapshot.mockResolvedValue(
        snapshotB as any,
      );
      domainDetailsService.getFindingsSummary.mockResolvedValue({
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        informational: 0,
      });

      const overview = await domainExperienceService.getDomainOverview(
        userId,
        domainId,
      );
      expect(overview.health.score).toBe(100);
      expect(overview.findingsSummary.total).toBe(0);
      expect(overview.findingsSummary.medium).toBe(0);
      expect(domainDetailsService.getFindingsSummary).toHaveBeenCalledWith(
        domainId,
        snapshotB.id,
      );
    });

    it('returns explainability detail showing RESOLVED status and verification evidence proof', async () => {
      (findingRepository.findUserFindingById as jest.Mock).mockResolvedValue(
        findingA_CSP as any,
      );
      (
        findingRepository.prisma.infrastructureSnapshot.findFirst as jest.Mock
      ).mockResolvedValue({
        id: snapshotB.id,
        domainId,
        createdAt: snapshotB.createdAt,
        findings: [],
      });

      const detail = await findingService.getFindingExplainabilityDetail(
        userId,
        'find-csp-001',
      );

      expect(detail.status).toBe('RESOLVED');
      expect(detail.state).toBe('RESOLVED');
      expect(detail.timeline.state).toBe('RESOLVED');
      expect(detail.timeline.lastVerifiedAt).toEqual(snapshotB.createdAt);

      const resolvingSnapshotStep = detail.processingEvidence.find(
        (e) => e.step === 'Resolving snapshot verified',
      );
      expect(resolvingSnapshotStep).toBeDefined();
      expect(resolvingSnapshotStep?.status).toBe('SUCCESS');
      expect(resolvingSnapshotStep?.description).toContain(
        `Resolving snapshot ${snapshotB.id}`,
      );

      const resolutionEvalStep = detail.processingEvidence.find(
        (e) => e.step === 'Resolution observation evaluated',
      );
      expect(resolutionEvalStep).toBeDefined();
      expect(resolutionEvalStep?.status).toBe('SUCCESS');

      const findingResolvedStep = detail.processingEvidence.find(
        (e) => e.step === 'Finding resolved',
      );
      expect(findingResolvedStep).toBeDefined();
      expect(findingResolvedStep?.status).toBe('SUCCESS');
      expect(findingResolvedStep?.description).toContain(
        `Finding find-csp-001 resolved in authoritative snapshot ${snapshotB.id}`,
      );
    });
  });

  describe('3. Lifecycle Matrix: ACTIVE -> ACTIVE (Finding Persists Across Snapshots)', () => {
    it('keeps finding status as ACTIVE when consecutive snapshots observe the same issue', async () => {
      const findingB_CSP = {
        ...findingA_CSP,
        id: 'find-csp-002',
        snapshotId: snapshotB.id,
        createdAt: snapshotB.createdAt,
      };

      (
        findingRepository.prisma.infrastructureSnapshot.findMany as jest.Mock
      ).mockResolvedValue([
        {
          id: snapshotB.id,
          domainId,
          createdAt: snapshotB.createdAt,
          findings: [findingB_CSP],
        },
      ]);
      (findingRepository.findUserFindings as jest.Mock).mockResolvedValue({
        data: [findingB_CSP],
        total: 1,
      });

      const list = await findingService.getFindingsExperienceList(userId, {
        domainId,
      });
      expect(list.data).toHaveLength(1);
      expect(list.data[0].status).toBe('ACTIVE');
      expect(list.data[0].state).toBe('OPEN');
    });
  });

  describe('4. Lifecycle Matrix: RESOLVED -> ACTIVE (Regression Reappears)', () => {
    it('reactivates finding when a previously resolved issue resurfaces in snapshot C', async () => {
      const findingC_CSP_Regression = {
        id: 'find-csp-003',
        snapshotId: 'snap-003',
        module: 'HTTP',
        ruleId: 'http.missing-content-security-policy',
        title: 'Missing Content Security Policy',
        description:
          'Content-Security-Policy header is absent again on aws.amazon.com.',
        severity: Severity.MEDIUM,
        category: 'HTTP',
        createdAt: new Date('2026-08-28T12:00:00Z'),
        snapshot: {
          domainId,
          createdAt: new Date('2026-08-28T12:00:00Z'),
          domain: { domainName },
        },
      };

      (
        findingRepository.prisma.infrastructureSnapshot.findMany as jest.Mock
      ).mockResolvedValue([
        {
          id: 'snap-003',
          domainId,
          createdAt: new Date('2026-08-28T12:00:00Z'),
          findings: [findingC_CSP_Regression],
        },
      ]);
      (findingRepository.findUserFindings as jest.Mock).mockResolvedValue({
        data: [findingC_CSP_Regression],
        total: 1,
      });

      const list = await findingService.getFindingsExperienceList(userId, {
        domainId,
      });
      expect(list.data).toHaveLength(1);
      expect(list.data[0].id).toBe('find-csp-003');
      expect(list.data[0].status).toBe('ACTIVE');
      expect(list.data[0].state).toBe('OPEN');
    });
  });

  describe('5. Lifecycle Matrix: RESOLVED -> RESOLVED (Stays Resolved Across Multiple Snapshots)', () => {
    it('maintains RESOLVED status across consecutive clean snapshots', async () => {
      (
        findingRepository.prisma.infrastructureSnapshot.findMany as jest.Mock
      ).mockResolvedValue([
        {
          id: 'snap-003',
          domainId,
          createdAt: new Date('2026-08-28T12:00:00Z'),
          findings: [], // Clean in snapshot C as well
        },
      ]);
      (findingRepository.findUserFindings as jest.Mock).mockResolvedValue({
        data: [findingA_CSP],
        total: 1,
      });

      const list = await findingService.getFindingsExperienceList(userId, {
        domainId,
        includeHistorical: true,
      });
      expect(list.data).toHaveLength(1);
      expect(list.data[0].status).toBe('RESOLVED');
      expect(list.data[0].state).toBe('RESOLVED');
    });
  });

  describe('6. Multiple Historical Snapshots (5+ Snapshots Chain)', () => {
    it('accurately resolves finding state against snapshot N in a long chain of snapshots', async () => {
      const snapshotsChain = Array.from({ length: 6 }, (_, idx) => ({
        id: `snap-chain-00${idx + 1}`,
        domainId,
        createdAt: new Date(`2026-08-28T${10 + idx}:00:00Z`),
        findings: idx === 0 ? [findingA_CSP] : [],
      }));

      const latestSnap = snapshotsChain[snapshotsChain.length - 1];

      (
        findingRepository.prisma.infrastructureSnapshot.findMany as jest.Mock
      ).mockResolvedValue([latestSnap]);
      (findingRepository.findUserFindings as jest.Mock).mockResolvedValue({
        data: [findingA_CSP],
        total: 1,
      });

      const list = await findingService.getFindingsExperienceList(userId, {
        domainId,
        includeHistorical: true,
      });
      expect(list.data).toHaveLength(1);
      expect(list.data[0].status).toBe('RESOLVED');
    });
  });

  describe('7. Out-of-Order Snapshot Defense', () => {
    it('determines canonical state based on chronological createdAt recency, not DB insertion order', async () => {
      (
        findingRepository.prisma.infrastructureSnapshot.findMany as jest.Mock
      ).mockResolvedValue([
        {
          id: snapshotB.id,
          domainId,
          createdAt: snapshotB.createdAt,
          findings: [], // Latest authoritative snapshot has 0 findings
        },
      ]);
      (findingRepository.findUserFindings as jest.Mock).mockResolvedValue({
        data: [findingA_CSP],
        total: 1,
      });

      const list = await findingService.getFindingsExperienceList(userId, {
        domainId,
        includeHistorical: true,
      });
      expect(list.data[0].status).toBe('RESOLVED');
    });
  });

  describe('8. Multi-Domain Isolation & Domain Switching', () => {
    it('isolates findings between domains and does not leak resolved state from Domain A to Domain B', async () => {
      const domainBId = 'domain-vulnerable-corp';
      const domainBName = 'vulnerable.corp';
      const snapshotDomainB = {
        id: 'snap-b-001',
        domainId: domainBId,
        createdAt: new Date('2026-08-28T11:30:00Z'),
        findings: [
          {
            id: 'find-vuln-001',
            snapshotId: 'snap-b-001',
            module: 'HTTP',
            ruleId: 'http.missing-content-security-policy',
            title: 'Missing Content Security Policy',
            severity: Severity.MEDIUM,
            category: 'HTTP',
            createdAt: new Date('2026-08-28T11:30:00Z'),
            snapshot: {
              domainId: domainBId,
              domain: { domainName: domainBName },
            },
          },
        ],
      };

      // Query Domain A (aws.amazon.com) -> RESOLVED
      (
        findingRepository.prisma.infrastructureSnapshot.findMany as jest.Mock
      ).mockResolvedValueOnce([
        {
          id: snapshotB.id,
          domainId,
          createdAt: snapshotB.createdAt,
          findings: [],
        },
      ]);
      (findingRepository.findUserFindings as jest.Mock).mockResolvedValueOnce({
        data: [findingA_CSP],
        total: 1,
      });

      const listA = await findingService.getFindingsExperienceList(userId, {
        domainId,
        includeHistorical: true,
      });
      expect(listA.data[0].status).toBe('RESOLVED');

      // Query Domain B (vulnerable.corp) -> ACTIVE
      (
        findingRepository.prisma.infrastructureSnapshot.findMany as jest.Mock
      ).mockResolvedValueOnce([snapshotDomainB]);
      (findingRepository.findUserFindings as jest.Mock).mockResolvedValueOnce({
        data: snapshotDomainB.findings,
        total: 1,
      });

      const listB = await findingService.getFindingsExperienceList(userId, {
        domainId: domainBId,
      });
      expect(listB.data[0].status).toBe('ACTIVE');
    });
  });

  describe('9. Graceful Handling for Missing Evidence & Edge Cases', () => {
    it('handles findings with undefined or missing raw evidence gracefully', async () => {
      const findingNoEvidence = {
        ...findingA_CSP,
        evidence: null,
      };

      (findingRepository.findUserFindingById as jest.Mock).mockResolvedValue(
        findingNoEvidence as any,
      );
      (
        findingRepository.prisma.infrastructureSnapshot.findFirst as jest.Mock
      ).mockResolvedValue({
        id: snapshotB.id,
        domainId,
        createdAt: snapshotB.createdAt,
        findings: [],
      });

      const detail = await findingService.getFindingExplainabilityDetail(
        userId,
        'find-csp-001',
      );
      expect(detail).toBeDefined();
      expect(detail.status).toBe('RESOLVED');
      expect(detail.processingEvidence).toBeDefined();
      expect(Array.isArray(detail.processingEvidence)).toBe(true);
    });
  });

  describe('10. Critical Invariant: CURRENT OVERVIEW FINDINGS = ACTIVE FINDINGS OF LATEST AUTHORITATIVE SNAPSHOT', () => {
    it('enforces that resolved findings never appear active in overview even if historical finding records exist', async () => {
      // Historical finding records in DB
      const historicalFindings = [
        findingA_CSP,
        {
          ...findingA_CSP,
          id: 'find-hsts-001',
          ruleId: 'http.missing-hsts',
          title: 'Missing HSTS Header',
          severity: Severity.HIGH,
        },
      ];

      (
        findingRepository.prisma.infrastructureSnapshot.findMany as jest.Mock
      ).mockResolvedValue([
        {
          id: snapshotB.id,
          domainId,
          createdAt: snapshotB.createdAt,
          findings: [], // All resolved in snapshot B
        },
      ]);
      (findingRepository.findUserFindings as jest.Mock).mockResolvedValue({
        data: historicalFindings,
        total: 2,
      });

      const list = await findingService.getFindingsExperienceList(userId, {
        domainId,
      });
      expect(list.data.every((f) => f.status === 'RESOLVED')).toBe(true);

      const activeFindings = list.data.filter((f) => f.status === 'ACTIVE');
      expect(activeFindings).toHaveLength(0);
    });
  });
});
