import { InfrastructureFindingService } from './services/infrastructure-finding.service';
import { InfrastructureFindingRepository } from './repositories/infrastructure-finding.repository';
import { WorkspaceExperienceService } from '../workspace/services/workspace-experience.service';
import { DomainExperienceService } from '../domain-details/services/domain-experience.service';
import { DomainDetailsService } from '../domain-details/services/domain-details.service';
import { InfrastructureBriefBuilder } from '../infrastructure-brief/builders/infrastructure-brief.builder';
import { SecurityBriefBuilder } from '../infrastructure-brief/builders/security-brief.builder';
import { Severity } from '../findings/enums/severity.enum';

/**
 * WX-211: Current Truth & Finding Lifecycle Integrity Automated Regression Test Suite
 *
 * Validates the core trust-critical platform invariants:
 * 1. Nebula NEVER presents a resolved or historical observation as a current active finding.
 * 2. The authoritative state of every finding is derived dynamically from the current verified snapshot.
 * 3. Current snapshot truth always takes precedence over historical finding records.
 * 4. Finding lifecycle: ACTIVE -> condition disappears -> RESOLVED -> HISTORICAL.
 * 5. Surface Rules:
 *    - What Matters Now: Active ✅, Resolved ❌, Historical ❌
 *    - Executive Brief: Active ✅, Resolved ❌, Historical ❌
 *    - Current Infrastructure: Active ✅, Resolved ❌, Historical ❌
 *    - Findings Tab: Active vs Resolved filtering strictly enforced.
 *    - Changes Tab: Resolution event recorded as legitimate infrastructure change.
 *    - Memory: Historical lineage and snapshots preserved.
 *    - Investigation View: Exact 4-step verification chains for active vs resolved without contradictory states.
 * 6. Quiet State: When 0 active findings exist -> "Nothing requires attention right now." (isQuiet = true).
 */
describe('WX-211: Current Truth & Finding Lifecycle Integrity', () => {
  let findingRepository: jest.Mocked<InfrastructureFindingRepository>;
  let findingService: InfrastructureFindingService;
  let workspaceExperienceService: WorkspaceExperienceService;
  let domainDetailsService: jest.Mocked<DomainDetailsService>;
  let domainExperienceService: DomainExperienceService;
  let briefBuilder: InfrastructureBriefBuilder;

  const userId = 'usr-trust-authority-001';
  const domainId = 'dom-prod-nebula-io';
  const domainName = 'nebula.internal.io';

  const snapshotN = {
    id: 'snp-001-csp-absent',
    domainId,
    createdAt: new Date('2026-08-29T09:00:00.000Z'),
    responseTimeMs: 95,
    httpStatus: 200,
    payload: {
      headers: {
        'x-frame-options': 'DENY',
      },
    },
  };

  const snapshotN_Plus_1 = {
    id: 'snp-002-csp-mitigated',
    domainId,
    createdAt: new Date('2026-08-29T10:00:00.000Z'),
    responseTimeMs: 82,
    httpStatus: 200,
    payload: {
      headers: {
        'x-frame-options': 'DENY',
        'content-security-policy': "default-src 'self'",
      },
    },
  };

  const snapshotN_Plus_2_Regressed = {
    id: 'snp-003-csp-regressed',
    domainId,
    createdAt: new Date('2026-08-29T11:00:00.000Z'),
    responseTimeMs: 88,
    httpStatus: 200,
    payload: {
      headers: {
        'x-frame-options': 'DENY',
      },
    },
  };

  const findingCSP_SnapshotN = {
    id: 'fnd-csp-001',
    snapshotId: snapshotN.id,
    module: 'HTTP',
    ruleId: 'http.missing-content-security-policy',
    title: 'Missing Content Security Policy',
    description:
      'Content-Security-Policy header is absent on nebula.internal.io.',
    severity: Severity.MEDIUM,
    category: 'HTTP',
    createdAt: snapshotN.createdAt,
    snapshot: {
      id: snapshotN.id,
      domainId,
      createdAt: snapshotN.createdAt,
      domain: { domainName },
    },
  };

  const findingCSP_SnapshotN_Plus_2 = {
    id: 'fnd-csp-002',
    snapshotId: snapshotN_Plus_2_Regressed.id,
    module: 'HTTP',
    ruleId: 'http.missing-content-security-policy',
    title: 'Missing Content Security Policy',
    description:
      'Content-Security-Policy header is absent again on nebula.internal.io.',
    severity: Severity.MEDIUM,
    category: 'HTTP',
    createdAt: snapshotN_Plus_2_Regressed.createdAt,
    snapshot: {
      id: snapshotN_Plus_2_Regressed.id,
      domainId,
      createdAt: snapshotN_Plus_2_Regressed.createdAt,
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
      getLatestBrief: jest.fn(),
      generateBrief: jest.fn(),
      getLatestVerification: jest.fn().mockResolvedValue({
        id: 'verif-002',
        changeDetected: true,
        snapshotCreated: true,
        startedAt: new Date('2026-08-29T09:59:00Z'),
        completedAt: new Date('2026-08-29T10:00:00Z'),
        durationMs: 1100,
      }),
      countVerifications: jest.fn().mockResolvedValue(2),
    } as unknown as jest.Mocked<DomainDetailsService>;

    domainExperienceService = new DomainExperienceService(domainDetailsService);
    briefBuilder = new InfrastructureBriefBuilder();

    // Mock WorkspaceExperienceService dependencies
    const mockTimelineExperienceService = {
      getTimelineData: jest.fn().mockResolvedValue({
        data: [],
        total: 0,
      }),
    };
    const mockBriefExperienceService = {
      getLatestBrief: jest.fn().mockResolvedValue(null),
      generateBrief: jest.fn().mockResolvedValue(null),
    };
    const mockPrisma = {
      domain: {
        findFirst: jest.fn().mockResolvedValue({
          id: domainId,
          domainName,
          monitoringEnabled: true,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-01T00:00:00Z'),
        }),
      },
      infrastructureSnapshot: {
        findFirst: jest.fn(),
      },
      infrastructureBrief: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const mockWorkspaceQueryService = {} as any;

    workspaceExperienceService = new WorkspaceExperienceService(
      mockWorkspaceQueryService,
      mockPrisma as any,
      mockBriefExperienceService as any,
      new SecurityBriefBuilder(),
      findingService,
      mockTimelineExperienceService as any,
    );
  });

  describe('AC-01 & AC-06: Active Finding State & Investigation Chain in Snapshot N', () => {
    it('evaluates finding as ACTIVE when condition is present in authoritative Snapshot N', async () => {
      // Configure latest snapshot to Snapshot N with CSP finding present
      (
        findingRepository.prisma.infrastructureSnapshot.findMany as jest.Mock
      ).mockResolvedValue([
        {
          id: snapshotN.id,
          domainId,
          createdAt: snapshotN.createdAt,
          findings: [findingCSP_SnapshotN],
        },
      ]);
      (findingRepository.findUserFindings as jest.Mock).mockResolvedValue({
        data: [findingCSP_SnapshotN],
        total: 1,
      });
      (findingRepository.findUserFindingById as jest.Mock).mockResolvedValue(
        findingCSP_SnapshotN as any,
      );
      (
        findingRepository.prisma.infrastructureSnapshot.findFirst as jest.Mock
      ).mockResolvedValue({
        id: snapshotN.id,
        domainId,
        createdAt: snapshotN.createdAt,
        findings: [findingCSP_SnapshotN],
      });

      // 1. Findings List evaluates to ACTIVE
      const list = await findingService.getFindingsExperienceList(userId, {
        domainId,
      });
      expect(list.data).toHaveLength(1);
      expect(list.data[0].id).toBe('fnd-csp-001');
      expect(list.data[0].status).toBe('ACTIVE');
      expect(list.data[0].state).toBe('OPEN');

      // 2. Active Investigation Chain: Valid Active Steps
      const detail = await findingService.getFindingExplainabilityDetail(
        userId,
        'fnd-csp-001',
      );
      expect(detail.status).toBe('ACTIVE');
      expect(detail.state).toBe('OPEN');
      expect(detail.timeline.state).toBe('OPEN');
      expect(detail.timeline.lastVerifiedAt).toEqual(snapshotN.createdAt);

      // Verify exact 4-step Active Chain (WX-211 Investigation Integrity)
      expect(detail.processingEvidence).toHaveLength(4);
      expect(detail.processingEvidence[0].step).toBe('Finding active');
      expect(detail.processingEvidence[0].status).toBe('SUCCESS');
      expect(detail.processingEvidence[0].description).toContain(
        `Finding fnd-csp-001 active in snapshot ${snapshotN.id}`,
      );

      expect(detail.processingEvidence[1].step).toBe('Snapshot verified');
      expect(detail.processingEvidence[1].status).toBe('SUCCESS');
      expect(detail.processingEvidence[1].description).toContain(
        `Snapshot ${snapshotN.id} authoritative state verified`,
      );

      expect(detail.processingEvidence[2].step).toBe('Observation evaluated');
      expect(detail.processingEvidence[2].status).toBe('SUCCESS');

      expect(detail.processingEvidence[3].step).toBe('Investigation assembled');
      expect(detail.processingEvidence[3].status).toBe('SUCCESS');

      // Verify observation state is NON_COMPLIANT when active
      expect(detail.observations[0].state).toBe('NON_COMPLIANT');
    });
  });

  describe('AC-02, AC-03, AC-04, AC-05 & AC-06: Resolved Transition & Absolute Surface Exclusion in Snapshot N+1', () => {
    beforeEach(() => {
      // In Snapshot N+1, the CSP condition has been mitigated (0 findings in snapshot N+1)
      (
        findingRepository.prisma.infrastructureSnapshot.findMany as jest.Mock
      ).mockResolvedValue([
        {
          id: snapshotN_Plus_1.id,
          domainId,
          createdAt: snapshotN_Plus_1.createdAt,
          findings: [], // Clean snapshot
        },
      ]);
      (findingRepository.findUserFindings as jest.Mock).mockResolvedValue({
        data: [findingCSP_SnapshotN], // Historical finding record from Snapshot N
        total: 1,
      });
      (findingRepository.findUserFindingById as jest.Mock).mockResolvedValue(
        findingCSP_SnapshotN as any,
      );
      (
        findingRepository.prisma.infrastructureSnapshot.findFirst as jest.Mock
      ).mockResolvedValue({
        id: snapshotN_Plus_1.id,
        domainId,
        createdAt: snapshotN_Plus_1.createdAt,
        findings: [],
      });
    });

    it('AC-02: dynamically derives status as RESOLVED when condition is absent from Snapshot N+1', async () => {
      const list = await findingService.getFindingsExperienceList(userId, {
        domainId,
        includeHistorical: true,
      });

      expect(list.data).toHaveLength(1);
      expect(list.data[0].id).toBe('fnd-csp-001');
      expect(list.data[0].status).toBe('RESOLVED');
      expect(list.data[0].state).toBe('RESOLVED');
    });

    it('AC-03: guarantees resolved findings NEVER appear in What Matters Now or Active filter', async () => {
      const activeList = await findingService.getFindingsExperienceList(
        userId,
        {
          domainId,
          status: 'ACTIVE',
        },
      );

      expect(activeList.data).toHaveLength(0);
    });

    it('AC-06: investigation view provides valid resolved chain with resolving snapshot context', async () => {
      const detail = await findingService.getFindingExplainabilityDetail(
        userId,
        'fnd-csp-001',
      );

      expect(detail.status).toBe('RESOLVED');
      expect(detail.state).toBe('RESOLVED');
      expect(detail.timeline.state).toBe('RESOLVED');
      expect(detail.timeline.lastVerifiedAt).toEqual(
        snapshotN_Plus_1.createdAt,
      );

      // Verify exact 4-step Resolved Chain (WX-211 Investigation Integrity)
      expect(detail.processingEvidence).toHaveLength(4);

      // Step 1: Finding resolved
      expect(detail.processingEvidence[0].step).toBe('Finding resolved');
      expect(detail.processingEvidence[0].status).toBe('SUCCESS');
      expect(detail.processingEvidence[0].description).toContain(
        `Finding fnd-csp-001 resolved in authoritative snapshot ${snapshotN_Plus_1.id}`,
      );

      // Step 2: Resolving snapshot verified
      expect(detail.processingEvidence[1].step).toBe(
        'Resolving snapshot verified',
      );
      expect(detail.processingEvidence[1].status).toBe('SUCCESS');
      expect(detail.processingEvidence[1].description).toContain(
        `Resolving snapshot ${snapshotN_Plus_1.id} authoritative state verified`,
      );

      // Step 3: Resolution observation evaluated
      expect(detail.processingEvidence[2].step).toBe(
        'Resolution observation evaluated',
      );
      expect(detail.processingEvidence[2].status).toBe('SUCCESS');
      expect(detail.processingEvidence[2].description).toContain(
        `Resolution evaluated against rule http.missing-content-security-policy in authoritative snapshot ${snapshotN_Plus_1.id}`,
      );

      // Step 4: Investigation assembled
      expect(detail.processingEvidence[3].step).toBe('Investigation assembled');
      expect(detail.processingEvidence[3].status).toBe('SUCCESS');

      // Verify observation state is COMPLIANT (No contradiction of resolved + non-compliant)
      expect(detail.observations[0].state).toBe('COMPLIANT');
      expect(detail.observations[0].observedAt).toEqual(
        snapshotN_Plus_1.createdAt,
      );
    });

    it('AC-04 & AC-11: Executive Brief and Workspace Overview reflect quiet reassurance with 0 stale warnings', async () => {
      // Mock prisma snapshot for workspace overview
      (
        (workspaceExperienceService as any).prisma.infrastructureSnapshot
          .findFirst as jest.Mock
      ).mockResolvedValue({
        id: snapshotN_Plus_1.id,
        domainId,
        createdAt: snapshotN_Plus_1.createdAt,
        payload: snapshotN_Plus_1.payload,
      });

      // Brief builder generated from Snapshot N+1 with 0 active findings
      const brief = briefBuilder.build(
        {
          id: snapshotN_Plus_1.id,
          domainId,
          domainName,
          createdAt: snapshotN_Plus_1.createdAt,
          payload: snapshotN_Plus_1.payload,
        } as any,
        [], // 0 active findings in Snapshot N+1
      );

      expect(brief.overallHealth).toBe('Excellent');
      expect(brief.summary).toContain('reachable');
      expect(brief.summary).not.toContain('Missing Content Security Policy');
      expect(brief.highlights).toHaveLength(0);

      // Workspace Overview execution
      const overview = await workspaceExperienceService.getWorkspaceOverview(
        userId,
        domainId,
      );

      // Invariant checks:
      expect(overview.primaryStory).toBeNull();
      expect(overview.secondaryStories).toHaveLength(0);
      expect(overview.quietStatus.isQuiet).toBe(true);
      expect(overview.quietStatus.lastVerifiedAt).toBe(
        snapshotN_Plus_1.createdAt.toISOString(),
      );
    });
  });

  describe('AC-08 & AC-07: Changes Resolution Event & Historical Evidence Preservation', () => {
    it('preserves original finding lineage and original snapshot while recording resolution', async () => {
      (findingRepository.findUserFindingById as jest.Mock).mockResolvedValue(
        findingCSP_SnapshotN as any,
      );
      (
        findingRepository.prisma.infrastructureSnapshot.findFirst as jest.Mock
      ).mockResolvedValue({
        id: snapshotN_Plus_1.id,
        domainId,
        createdAt: snapshotN_Plus_1.createdAt,
        findings: [],
      });

      const detail = await findingService.getFindingExplainabilityDetail(
        userId,
        'fnd-csp-001',
      );

      // Original evidence & original snapshot preserved
      expect(detail.snapshotId).toBe(snapshotN.id);
      expect(detail.lineage?.snapshotId).toBe(snapshotN.id);
      expect(detail.lineage?.ruleId).toBe(
        'http.missing-content-security-policy',
      );
      expect(detail.detectedAt).toEqual(snapshotN.createdAt);

      // Resolving context linked in evidence
      expect(detail.processingEvidence[1].description).toContain(
        snapshotN_Plus_1.id,
      );
    });
  });

  describe('Regression Scenario: Snapshot N (Missing) -> N+1 (Resolved) -> N+2 (Regressed)', () => {
    it('reactivates finding as ACTIVE when condition regresses in Snapshot N+2', async () => {
      // In Snapshot N+2, CSP is missing again
      (
        findingRepository.prisma.infrastructureSnapshot.findMany as jest.Mock
      ).mockResolvedValue([
        {
          id: snapshotN_Plus_2_Regressed.id,
          domainId,
          createdAt: snapshotN_Plus_2_Regressed.createdAt,
          findings: [findingCSP_SnapshotN_Plus_2],
        },
      ]);
      (findingRepository.findUserFindings as jest.Mock).mockResolvedValue({
        data: [findingCSP_SnapshotN_Plus_2],
        total: 1,
      });

      const list = await findingService.getFindingsExperienceList(userId, {
        domainId,
      });

      expect(list.data).toHaveLength(1);
      expect(list.data[0].id).toBe('fnd-csp-002');
      expect(list.data[0].status).toBe('ACTIVE');
      expect(list.data[0].state).toBe('OPEN');
    });
  });

  describe('AC-12: Anti-Contradiction Invariants Matrix', () => {
    it('verifies that Active findings NEVER emit "Snapshot resolved" or "Resolving snapshot verified"', async () => {
      (findingRepository.findUserFindingById as jest.Mock).mockResolvedValue(
        findingCSP_SnapshotN as any,
      );
      (
        findingRepository.prisma.infrastructureSnapshot.findFirst as jest.Mock
      ).mockResolvedValue({
        id: snapshotN.id,
        domainId,
        createdAt: snapshotN.createdAt,
        findings: [findingCSP_SnapshotN],
      });

      const activeDetail = await findingService.getFindingExplainabilityDetail(
        userId,
        'fnd-csp-001',
      );
      const stepNames = activeDetail.processingEvidence.map((e) => e.step);

      expect(stepNames).toContain('Finding active');
      expect(stepNames).toContain('Snapshot verified');
      expect(stepNames).not.toContain('Finding resolved');
      expect(stepNames).not.toContain('Snapshot resolved');
      expect(stepNames).not.toContain('Resolving snapshot verified');
      expect(stepNames).not.toContain('Resolution observation evaluated');
    });

    it('verifies that Resolved findings NEVER emit "Finding active" or "Observation non-compliant"', async () => {
      (findingRepository.findUserFindingById as jest.Mock).mockResolvedValue(
        findingCSP_SnapshotN as any,
      );
      (
        findingRepository.prisma.infrastructureSnapshot.findFirst as jest.Mock
      ).mockResolvedValue({
        id: snapshotN_Plus_1.id,
        domainId,
        createdAt: snapshotN_Plus_1.createdAt,
        findings: [],
      });

      const resolvedDetail =
        await findingService.getFindingExplainabilityDetail(
          userId,
          'fnd-csp-001',
        );
      const stepNames = resolvedDetail.processingEvidence.map((e) => e.step);

      expect(stepNames).toContain('Finding resolved');
      expect(stepNames).toContain('Resolving snapshot verified');
      expect(stepNames).toContain('Resolution observation evaluated');
      expect(stepNames).not.toContain('Finding active');
      expect(stepNames).not.toContain('Snapshot verified');

      // Observation state must NOT be NON_COMPLIANT
      expect(resolvedDetail.observations[0].state).not.toBe('NON_COMPLIANT');
      expect(resolvedDetail.observations[0].state).toBe('COMPLIANT');
    });
  });
});
