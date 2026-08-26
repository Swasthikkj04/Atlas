import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveVerifiedSnapshotPair,
  integrateAuthoritativeChanges,
  verifySnapshotLineageIntegrity,
} from './contracts/snapshot-comparison.contract.ts';
import {
  evaluateConvergenceDecision,
  findActiveJob,
} from './contracts/understanding-convergence.contract.ts';
import {
  CHANGES_CERTIFIED_INVARIANTS,
} from './contracts/changes.contract.ts';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import { queryKeys } from '../../hooks/queries/query-keys.ts';
import type {
  InfrastructureSnapshotDto,
  TimelineEventDto,
  UnderstandingJobDto,
} from '../../types/api';

const mockDomainA = 'dom-ding-001';
const mockDomainB = 'dom-example-002';
const mockDomainAName = 'ding.com';

const mockSnapshotA: InfrastructureSnapshotDto = {
  id: 'snp-101',
  domainId: mockDomainA,
  capturedAt: '2026-08-20T10:00:00Z',
  createdAt: '2026-08-20T10:00:00Z',
  payload: { webServer: 'nginx/1.24' },
};

const mockSnapshotB: InfrastructureSnapshotDto = {
  id: 'snp-102',
  domainId: mockDomainA,
  capturedAt: '2026-08-23T12:00:00Z',
  createdAt: '2026-08-23T12:00:00Z',
  payload: { webServer: 'cloudflare' },
};

const mockChangeEventAB: TimelineEventDto = {
  id: 'evt-ws-001',
  domainId: mockDomainA,
  domainName: mockDomainAName,
  snapshotId: 'snp-102',
  currentSnapshotId: 'snp-102',
  previousSnapshotId: 'snp-101',
  changeType: 'MODIFIED',
  category: 'web_server',
  severity: 'MEDIUM',
  title: 'Web server changed',
  previousValue: 'nginx/1.24',
  currentValue: 'cloudflare',
  detectedAt: '2026-08-23T12:00:10Z',
  evidenceCount: 2,
};

describe('WX-1007: Changes Cross-Surface Convergence', () => {
  describe('1. Manual Understanding Flow (Snapshot A -> Understanding -> Snapshot B)', () => {
    it('progresses through active understanding while preserving trusted state, then converges all surfaces upon completion', () => {
      // Step 1: Initial state (Domain has Snapshot A)
      const initialChanges = integrateAuthoritativeChanges({
        domainId: mockDomainA,
        domainName: mockDomainAName,
        snapshots: [mockSnapshotA],
        timelineEvents: [],
        isLoading: false,
        isError: false,
        isUnderstanding: false,
      });

      assert.equal(initialChanges.state, 'FIRST_UNDERSTANDING');
      assert.equal(initialChanges.snapshotPair.currentSnapshot?.id, 'snp-101');
      assert.equal(initialChanges.snapshotPair.previousSnapshot, null);

      // Step 2: User triggers "Understand now" (Job starts)
      const runningJob: UnderstandingJobDto = {
        id: 'job-man-101',
        domainId: mockDomainA,
        status: 'RUNNING',
        triggerType: 'MANUAL',
        startedAt: '2026-08-23T12:00:00Z',
      };

      const activeJob = findActiveJob([runningJob]);
      assert.equal(activeJob?.id, 'job-man-101');

      // While running, Changes retains last trusted state (Snapshot A baseline) without invalidating trusted facts
      const runningChanges = integrateAuthoritativeChanges({
        domainId: mockDomainA,
        domainName: mockDomainAName,
        snapshots: [mockSnapshotA],
        timelineEvents: [],
        isLoading: false,
        isError: false,
        isUnderstanding: true,
      });

      assert.equal(runningChanges.state, 'FIRST_UNDERSTANDING');
      assert.equal(runningChanges.snapshotPair.currentSnapshot?.id, 'snp-101');

      // Step 3: Understanding completes -> Snapshot B committed -> Reconciliation occurs
      const completedJob: UnderstandingJobDto = {
        ...runningJob,
        status: 'COMPLETED',
        completedAt: '2026-08-23T12:00:15Z',
      };

      const convergenceDecision = evaluateConvergenceDecision({
        domainId: mockDomainA,
        lastReconciledJobId: null,
        prevRunningJobId: 'job-man-101',
        jobs: [completedJob],
      });

      assert.equal(convergenceDecision.shouldReconcile, true);
      assert.equal(convergenceDecision.newReconciledJobId, 'job-man-101');
      assert.equal(convergenceDecision.reason, 'MANUAL_COMPLETED');

      // Step 4: After convergence, Changes compares Snapshot B against Snapshot A
      const convergedChanges = integrateAuthoritativeChanges({
        domainId: mockDomainA,
        domainName: mockDomainAName,
        snapshots: [mockSnapshotB, mockSnapshotA],
        timelineEvents: [mockChangeEventAB],
        isLoading: false,
        isError: false,
        isUnderstanding: false,
      });

      assert.equal(convergedChanges.state, 'READY');
      assert.equal(convergedChanges.snapshotPair.currentSnapshot?.id, 'snp-102');
      assert.equal(convergedChanges.snapshotPair.previousSnapshot?.id, 'snp-101');
      assert.equal(convergedChanges.changes.length, 1);
      assert.equal(convergedChanges.changes[0].previousValue, 'nginx/1.24');
      assert.equal(convergedChanges.changes[0].currentValue, 'cloudflare');

      // Step 5: Memory and Changes share identical snapshot lineage
      const lineageVerification = verifySnapshotLineageIntegrity(
        convergedChanges.changes[0],
        [mockSnapshotB, mockSnapshotA]
      );
      assert.equal(lineageVerification.isLineageConsistent, true);
    });
  });

  describe('2. Automatic Background Understanding Convergence', () => {
    it('worker-initiated understanding converges through the identical reconciliation pipeline as manual runs', () => {
      const scheduledJob: UnderstandingJobDto = {
        id: 'job-worker-888',
        domainId: mockDomainA,
        status: 'COMPLETED',
        triggerType: 'SCHEDULED',
        startedAt: '2026-08-23T14:00:00Z',
        completedAt: '2026-08-23T14:00:12Z',
      };

      const decision = evaluateConvergenceDecision({
        domainId: mockDomainA,
        lastReconciledJobId: 'job-man-101',
        prevRunningJobId: null,
        jobs: [scheduledJob],
      });

      assert.equal(decision.shouldReconcile, true);
      assert.equal(decision.newReconciledJobId, 'job-worker-888');
      assert.equal(decision.reason, 'AUTOMATIC_COMPLETED');
    });
  });

  describe('3. Failed Understanding Handling (Zero Lineage Corruption)', () => {
    it('preserves existing trusted snapshot baseline when an understanding job fails', () => {
      const failedJob: UnderstandingJobDto = {
        id: 'job-fail-999',
        domainId: mockDomainA,
        status: 'FAILED',
        triggerType: 'MANUAL',
        startedAt: '2026-08-23T15:00:00Z',
        completedAt: '2026-08-23T15:00:05Z',
      };

      const decision = evaluateConvergenceDecision({
        domainId: mockDomainA,
        lastReconciledJobId: 'job-man-101',
        prevRunningJobId: 'job-fail-999',
        jobs: [failedJob],
      });

      // Failed job does not trigger successful surface reconciliation
      assert.equal(decision.shouldReconcile, false);

      // Existing snapshot A baseline remains intact
      const pair = resolveVerifiedSnapshotPair([mockSnapshotA], mockDomainA);
      assert.equal(pair.currentSnapshot?.id, 'snp-101');
      assert.equal(pair.previousSnapshot, null);
    });
  });

  describe('4. Query Key Isolation & Collision Prevention', () => {
    it('strictly separates domain overview and workspace overview query keys', () => {
      const domainOverviewKey = queryKeys.domains.overview(mockDomainA);
      const workspaceOverviewKey = queryKeys.workspace.overview(mockDomainA);

      assert.notDeepEqual(domainOverviewKey, workspaceOverviewKey);
      assert.equal(domainOverviewKey[0], 'domains');
      assert.equal(workspaceOverviewKey[0], 'workspace');
    });

    it('strictly separates timeline and snapshot query keys', () => {
      const timelineKey = queryKeys.timeline.byDomain(mockDomainA);
      const snapshotsKey = queryKeys.snapshots.byDomain(mockDomainA);

      assert.notDeepEqual(timelineKey, snapshotsKey);
      assert.equal(timelineKey[0], 'timeline');
      assert.equal(snapshotsKey[0], 'snapshots');
    });
  });

  describe('5. Domain Switching & Scope Isolation', () => {
    it('isolates snapshot pair and change events strictly by active domainId', () => {
      const foreignSnapshot: InfrastructureSnapshotDto = {
        id: 'snp-foreign-999',
        domainId: mockDomainB,
        capturedAt: '2026-08-23T16:00:00Z',
        createdAt: '2026-08-23T16:00:00Z',
      };

      const pairForDomainA = resolveVerifiedSnapshotPair(
        [mockSnapshotB, foreignSnapshot, mockSnapshotA],
        mockDomainA
      );

      assert.equal(pairForDomainA.totalVerifiedSnapshots, 2);
      assert.equal(pairForDomainA.currentSnapshot?.id, 'snp-102');
      assert.equal(pairForDomainA.previousSnapshot?.id, 'snp-101');
    });
  });

  describe('6. Truth Matrix & Certified Invariants Audit', () => {
    it('verifies Changes Cross-Surface Convergence capability in Truth Matrix', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Changes Cross-Surface Convergence'
      );
      assert.ok(cap, 'Changes Cross-Surface Convergence must exist in Truth Matrix');
      assert.equal(cap?.category, 'Changes');
      assert.equal(cap?.status, 'PRODUCTION_READY');
    });

    it('verifies all 9 WX-1007 invariants are certified in truth contracts', () => {
      const requiredInvariants = [
        'NO_CROSS_SURFACE_TRUTH_DIVERGENCE',
        'MANUAL_AUTOMATIC_CONVERGENCE',
        'NO_PARTIAL_SNAPSHOT_PROPAGATION',
        'NO_STALE_CHANGE_STATE',
        'NO_QUERY_KEY_COLLISION',
        'NO_CROSS_DOMAIN_CACHE_CONTAMINATION',
        'FAILED_UNDERSTANDING_PRESERVES_TRUSTED_STATE',
        'MEMORY_CHANGES_SNAPSHOT_CONSISTENCY',
        'NO_DUPLICATE_UNDERSTANDING_PIPELINE',
      ];

      for (const inv of requiredInvariants) {
        assert.ok(
          inv in CHANGES_CERTIFIED_INVARIANTS,
          `Missing in CHANGES_CERTIFIED_INVARIANTS: ${inv}`
        );
        assert.ok(
          inv in WORKSPACE_CERTIFIED_INVARIANTS,
          `Missing in WORKSPACE_CERTIFIED_INVARIANTS: ${inv}`
        );
      }
    });
  });
});
