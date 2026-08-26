import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { queryKeys } from '../../hooks/queries/query-keys.ts';
import {
  resolveAuthoritativeUnderstandingState,
  evaluateConvergenceDecision,
  WORKSPACE_CONVERGENCE_HARD_INVARIANTS,
} from './contracts/understanding-convergence.contract.ts';
import {
  resolveOverviewState,
  resolveInfrastructureSections,
} from './contracts/overview.contract.ts';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { UnderstandingJobDto } from '../../types/api/understanding.dto.ts';
import type { DomainOverviewResponseDto } from '../../types/api/overview.dto.ts';

const mockDomainId = 'dom-ding-001';
const mockDomainName = 'ding.com';

const mockCompletedJob: UnderstandingJobDto = {
  id: 'job-ding-101',
  domainId: mockDomainId,
  status: 'COMPLETED',
  triggerType: 'MANUAL',
  startedAt: '2026-08-23T14:00:00Z',
  completedAt: '2026-08-23T14:00:12Z',
  snapshotId: 'snp-ding-201',
};

const mockRunningJob: UnderstandingJobDto = {
  id: 'job-ding-102',
  domainId: mockDomainId,
  status: 'RUNNING',
  triggerType: 'MANUAL',
  startedAt: '2026-08-23T14:05:00Z',
};

const mockScheduledCompletedJob: UnderstandingJobDto = {
  id: 'job-ding-103',
  domainId: mockDomainId,
  status: 'COMPLETED',
  triggerType: 'SCHEDULED',
  startedAt: '2026-08-23T15:00:00Z',
  completedAt: '2026-08-23T15:00:10Z',
  snapshotId: 'snp-ding-202',
};

const mockFailedJob: UnderstandingJobDto = {
  id: 'job-ding-104',
  domainId: mockDomainId,
  status: 'FAILED',
  triggerType: 'MANUAL',
  startedAt: '2026-08-23T14:10:00Z',
  completedAt: '2026-08-23T14:10:05Z',
  error: 'DNS resolution timeout for authoritative nameservers.',
};

const mockDomainOverviewWithInfra: DomainOverviewResponseDto = {
  domain: {
    id: mockDomainId,
    domainName: mockDomainName,
    monitoringEnabled: true,
    createdAt: '2026-08-23T12:00:00Z',
  },
  health: {
    score: 95,
    critical: 0,
    high: 0,
    medium: 1,
    low: 0,
    informational: 0,
  },
  latestSnapshot: {
    id: 'snp-ding-201',
    createdAt: '2026-08-23T14:00:12Z',
    responseTimeMs: 84,
    httpStatus: 200,
  },
  latestBrief: {
    overallHealth: 'HEALTHY',
    summary: 'Perimeter infrastructure for ding.com is fully operational.',
    highlights: ['Cloudflare Edge CDN active', 'TLS 1.3 certificate valid'],
    recommendations: [],
    generatedAt: '2026-08-23T14:00:15Z',
  },
  findingsSummary: {
    total: 1,
    critical: 0,
    high: 0,
    medium: 1,
    low: 0,
    informational: 0,
  },
  recentFindings: [],
  recentChanges: [],
  latestVerification: null,
  infrastructure: {
    ipv4Addresses: ['104.26.2.14', '104.26.3.14'],
    ipv6Addresses: ['2606:4700:20::681a:20e'],
    webServer: 'cloudflare',
    cdn: 'Cloudflare',
    sslValid: true,
    sslExpiresAt: '2026-11-23T14:00:00Z',
    technologies: ['Cloudflare', 'Next.js', 'React'],
    httpStatus: 200,
    responseTimeMs: 84,
  },
  statistics: {
    totalSnapshots: 1,
    totalVerifications: 1,
    totalFindings: 1,
    criticalFindings: 0,
    changesLast30Days: 0,
    lastUnderstandingAt: '2026-08-23T14:00:12Z',
  },
};

describe('WX-915: Workspace Understanding State Convergence', () => {
  describe('1. Authoritative 4-Phase Understanding State Model', () => {
    it('resolves NO_UNDERSTANDING when domain has no jobs and no snapshots', () => {
      const state = resolveAuthoritativeUnderstandingState({
        isTriggerPending: false,
        triggerError: null,
        activeJob: null,
        latestJob: null,
        latestSnapshot: null,
        totalSnapshots: 0,
        hasInfrastructure: false,
      });

      assert.equal(state, 'NO_UNDERSTANDING');
    });

    it('resolves UNDERSTANDING when HTTP trigger mutation is in-flight', () => {
      const state = resolveAuthoritativeUnderstandingState({
        isTriggerPending: true,
        triggerError: null,
        activeJob: null,
        latestJob: null,
        latestSnapshot: null,
        totalSnapshots: 0,
      });

      assert.equal(state, 'UNDERSTANDING');
    });

    it('resolves UNDERSTANDING when backend worker job is RUNNING or PENDING', () => {
      const state = resolveAuthoritativeUnderstandingState({
        isTriggerPending: false,
        triggerError: null,
        activeJob: mockRunningJob,
        latestJob: mockRunningJob,
      });

      assert.equal(state, 'UNDERSTANDING');
    });

    it('resolves UNDERSTOOD when completed job and snapshot exist', () => {
      const state = resolveAuthoritativeUnderstandingState({
        isTriggerPending: false,
        triggerError: null,
        activeJob: null,
        latestJob: mockCompletedJob,
        latestSnapshot: mockDomainOverviewWithInfra.latestSnapshot,
        totalSnapshots: 1,
        hasInfrastructure: true,
      });

      assert.equal(state, 'UNDERSTOOD');
    });

    it('resolves FAILED when trigger error or unrecovered worker error occurs', () => {
      const triggerErrorState = resolveAuthoritativeUnderstandingState({
        isTriggerPending: false,
        triggerError: new Error('Network error on POST /understand'),
        activeJob: null,
      });
      assert.equal(triggerErrorState, 'FAILED');

      const workerErrorState = resolveAuthoritativeUnderstandingState({
        isTriggerPending: false,
        triggerError: null,
        activeJob: null,
        latestJob: mockFailedJob,
        latestSnapshot: null,
        totalSnapshots: 0,
        hasInfrastructure: false,
      });
      assert.equal(workerErrorState, 'FAILED');
    });
  });

  describe('2. Infrastructure Surface State Convergence', () => {
    it('resolves UNDERSTANDING state during active understanding without saying "not understood"', () => {
      const state = resolveOverviewState({
        data: null,
        isLoading: false,
        isError: false,
        isUnderstanding: true,
      });

      assert.equal(state, 'UNDERSTANDING');
      assert.notEqual(state, 'EMPTY', 'Must NOT resolve to EMPTY while understanding is in progress');
    });

    it('resolves READY state after successful understanding completion with full infrastructure model', () => {
      const state = resolveOverviewState({
        data: mockDomainOverviewWithInfra,
        isLoading: false,
        isError: false,
        isUnderstanding: false,
      });

      assert.equal(state, 'READY');
      assert.notEqual(state, 'EMPTY', 'Must NOT say Infrastructure not understood after successful understanding');

      const sections = resolveInfrastructureSections(mockDomainOverviewWithInfra.infrastructure);
      assert.ok(sections.length >= 5);
      const edge = sections.find((s) => s.category === 'edge_delivery');
      assert.equal(edge?.status, 'PRESENT');
      assert.deepEqual(edge?.items, ['Cloudflare']);
    });

    it('resolves EMPTY state ONLY when domain genuinely has no snapshots and no active understanding', () => {
      const emptyDomainData: DomainOverviewResponseDto = {
        ...mockDomainOverviewWithInfra,
        latestSnapshot: null,
        statistics: {
          ...mockDomainOverviewWithInfra.statistics,
          totalSnapshots: 0,
        },
        infrastructure: {
          ipv4Addresses: [],
          ipv6Addresses: [],
          webServer: null,
          cdn: null,
          sslValid: false,
          sslExpiresAt: null,
          technologies: [],
          httpStatus: 0,
          responseTimeMs: 0,
        },
      };

      const state = resolveOverviewState({
        data: emptyDomainData,
        isLoading: false,
        isError: false,
        isUnderstanding: false,
      });

      assert.equal(state, 'EMPTY', 'Only genuinely un-understood domains with no snapshots resolve to EMPTY');
    });
  });

  describe('3. Unified Manual and Automatic Understanding Convergence', () => {
    it('converges manual understanding completion uniformly across all surfaces', () => {
      const decision = evaluateConvergenceDecision({
        domainId: mockDomainId,
        lastReconciledJobId: null,
        prevRunningJobId: 'job-ding-102',
        jobs: [mockCompletedJob],
      });

      assert.equal(decision.shouldReconcile, true);
      assert.equal(decision.newReconciledJobId, 'job-ding-101');
      assert.equal(decision.reason, 'MANUAL_COMPLETED');
    });

    it('converges automatic worker understanding completion identically to manual understanding', () => {
      const decision = evaluateConvergenceDecision({
        domainId: mockDomainId,
        lastReconciledJobId: 'job-ding-101',
        prevRunningJobId: null,
        jobs: [mockScheduledCompletedJob],
      });

      assert.equal(decision.shouldReconcile, true);
      assert.equal(decision.newReconciledJobId, 'job-ding-103');
      assert.equal(decision.reason, 'AUTOMATIC_COMPLETED');
    });
  });

  describe('4. Query Key Isolation & Cache Reconciler Audit', () => {
    it('guarantees isolated query keys between Domain Overview and Workspace Overview', () => {
      const domainOverviewKey = queryKeys.domains.overview(mockDomainId);
      const workspaceOverviewKey = queryKeys.workspace.overview(mockDomainId);

      assert.deepEqual(domainOverviewKey, ['domains', mockDomainId, 'overview']);
      assert.deepEqual(workspaceOverviewKey, ['workspace', 'overview', mockDomainId]);
      assert.notDeepEqual(
        domainOverviewKey,
        workspaceOverviewKey,
        'Domain overview and Workspace overview must have distinct query keys to prevent cache clashing'
      );
    });
  });

  describe('5. Truth Matrix & Certified Invariants Audit', () => {
    it('verifies WX-915 capability is registered in Truth Matrix with PRODUCTION_READY status', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Workspace Understanding State Convergence'
      );
      assert.ok(cap, 'Capability must exist in Truth Matrix');
      assert.equal(cap?.category, 'States');
      assert.equal(cap?.status, 'PRODUCTION_READY');
    });

    it('verifies all 7 certified WX-915 convergence invariants exist in truth contracts', () => {
      const requiredInvariants = [
        'ONE_DOMAIN_ONE_CURRENT_UNDERSTANDING',
        'NO_FRONTEND_ONLY_UNDERSTOOD_FLAGS',
        'NO_INDEPENDENT_PER_PAGE_UNDERSTANDING_STATE',
        'NO_STALE_INFRASTRUCTURE_CACHE',
        'NO_PAGE_SPECIFIC_JOB_INTERPRETATION',
        'NO_MIXED_SNAPSHOTS',
        'NO_INFRASTRUCTURE_NOT_UNDERSTOOD_AFTER_SUCCESS',
      ];

      for (const inv of requiredInvariants) {
        assert.ok(
          inv in WORKSPACE_CONVERGENCE_HARD_INVARIANTS,
          `Missing in WORKSPACE_CONVERGENCE_HARD_INVARIANTS: ${inv}`
        );
        assert.ok(
          inv in WORKSPACE_CERTIFIED_INVARIANTS,
          `Missing in WORKSPACE_CERTIFIED_INVARIANTS: ${inv}`
        );
      }
    });
  });
});
