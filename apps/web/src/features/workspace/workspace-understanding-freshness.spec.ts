import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveUnderstandingFreshness,
  formatUnderstandingFreshness,
  formatVerifiedDate,
  verifyWorkspaceSnapshotConvergence,
  verifyWorkspaceTimestampConvergence,
  UNDERSTANDING_FRESHNESS_INVARIANTS,
} from './contracts/understanding-freshness.contract.ts';
import {
  evaluateConvergenceDecision,
} from './contracts/understanding-convergence.contract.ts';
import {
  integrateAuthoritativeChanges,
} from './contracts/snapshot-comparison.contract.ts';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import type {
  InfrastructureSnapshotDto,
  UnderstandingJobDto,
  TimelineEventDto,
} from '../../types/api';

const mockDomainId = 'dom-freshness-001';
const mockDomainName = 'nebula.infra';

const mockTimestampNow = new Date('2026-08-24T20:36:00Z').getTime();
const mockTimestamp23hAgo = new Date('2026-08-23T21:36:00Z').toISOString();
const mockTimestampJustNow = new Date('2026-08-24T20:35:45Z').toISOString(); // 15s ago
const mockTimestamp2mAgo = new Date('2026-08-24T20:34:00Z').toISOString(); // 2m ago
const mockTimestamp18mAgo = new Date('2026-08-24T20:18:00Z').toISOString(); // 18m ago
const mockTimestamp3hAgo = new Date('2026-08-24T17:36:00Z').toISOString(); // 3h ago

const mockSnapshotA: InfrastructureSnapshotDto = {
  id: 'snp-yesterday-101',
  domainId: mockDomainId,
  capturedAt: mockTimestamp23hAgo,
  createdAt: mockTimestamp23hAgo,
  payload: { webServer: 'nginx/1.22' },
};

const mockSnapshotB: InfrastructureSnapshotDto = {
  id: 'snp-fresh-202',
  domainId: mockDomainId,
  capturedAt: mockTimestampJustNow,
  createdAt: mockTimestampJustNow,
  payload: { webServer: 'nginx/1.24' },
};

describe('WX-1012: Understanding Freshness & Completion Truth', () => {
  describe('1. State Machine: Idle -> Understanding -> Success / Failure', () => {
    it('initial state before understanding: resolves NOT_UNDERSTOOD with "Not understood yet"', () => {
      const state = resolveUnderstandingFreshness({
        isTriggerPending: false,
        activeJob: null,
        latestJob: null,
        latestSnapshot: null,
        totalSnapshots: 0,
        now: mockTimestampNow,
      });

      assert.equal(state.phase, 'NOT_UNDERSTOOD');
      assert.equal(state.statusBadge, 'NOT_UNDERSTOOD');
      assert.equal(state.headline, 'Not understood yet');
      assert.equal(state.formattedFreshness, 'Not understood yet');
      assert.equal(state.canTrigger, true);
      assert.equal(state.isUnderstanding, false);
      assert.equal(state.buttonLabel, 'Understand now');
      assert.equal(state.snapshotId, null);
    });

    it('understanding in progress: enters UNDERSTANDING and hides stale 23h ago timestamp', () => {
      const runningJob: UnderstandingJobDto = {
        id: 'job-fresh-100',
        domainId: mockDomainId,
        status: 'RUNNING',
        triggerType: 'MANUAL',
        startedAt: mockTimestampJustNow,
      };

      const state = resolveUnderstandingFreshness({
        isTriggerPending: false,
        activeJob: runningJob,
        latestJob: runningJob,
        latestSnapshot: mockSnapshotA, // Previous snapshot A exists (23h ago)
        totalSnapshots: 1,
        now: mockTimestampNow,
      });

      assert.equal(state.phase, 'UNDERSTANDING');
      assert.equal(state.statusBadge, 'UNDERSTANDING');
      assert.equal(state.headline, 'Understanding in progress');
      assert.equal(state.formattedFreshness, 'Understanding infrastructure…');
      assert.equal(state.contextMessage, 'Nebula is establishing a new verified understanding.');
      assert.equal(state.isUnderstanding, true);
      assert.equal(state.canTrigger, false, 'Prohibits duplicate submission while understanding is active');
      assert.equal(state.buttonLabel, 'Understanding…');
      // Previous verified timestamp is safely preserved in metadata without masquerading as the active state
      assert.equal(state.lastVerifiedTimestamp, mockTimestamp23hAgo);
      assert.equal(state.lastVerifiedFreshness, 'Last verified understanding · 23h ago');
    });

    it('successful completion: immediately updates header freshness to "Understood just now" from verified snapshot', () => {
      const completedJob: UnderstandingJobDto = {
        id: 'job-fresh-100',
        domainId: mockDomainId,
        status: 'COMPLETED',
        triggerType: 'MANUAL',
        startedAt: '2026-08-24T20:35:30Z',
        completedAt: mockTimestampJustNow,
        snapshotId: 'snp-fresh-202',
      };

      const state = resolveUnderstandingFreshness({
        isTriggerPending: false,
        activeJob: null,
        latestJob: completedJob,
        latestSnapshot: mockSnapshotB,
        totalSnapshots: 2,
        now: mockTimestampNow,
      });

      assert.equal(state.phase, 'UNDERSTOOD');
      assert.equal(state.statusBadge, 'ACTIVE');
      assert.equal(state.formattedFreshness, 'Understood just now');
      assert.equal(state.headline, 'Understood just now');
      assert.equal(state.snapshotId, 'snp-fresh-202');
      assert.equal(state.authoritativeTimestamp, mockTimestampJustNow);
      assert.equal(state.canTrigger, true);
      assert.equal(state.isUnderstanding, false);
      assert.equal(state.buttonLabel, 'Understand now');
    });

    it('understanding failure: truthfully displays "Understanding failed" and preserves previous trusted timestamp', () => {
      const failedJob: UnderstandingJobDto = {
        id: 'job-fresh-100',
        domainId: mockDomainId,
        status: 'FAILED',
        triggerType: 'MANUAL',
        startedAt: '2026-08-24T20:35:30Z',
        completedAt: '2026-08-24T20:35:35Z',
        error: 'Network connectivity timeout during perimeter probe.',
      };

      const state = resolveUnderstandingFreshness({
        isTriggerPending: false,
        activeJob: null,
        latestJob: failedJob,
        latestSnapshot: mockSnapshotA, // Previous snapshot A preserved
        totalSnapshots: 1,
        now: mockTimestampNow,
      });

      assert.equal(state.phase, 'FAILED');
      assert.equal(state.statusBadge, 'FAILED');
      assert.equal(state.headline, 'Understanding failed');
      assert.equal(state.lastVerifiedTimestamp, mockTimestamp23hAgo);
      assert.equal(state.lastVerifiedFreshness, 'Last verified understanding · 23h ago');
      assert.equal(state.contextMessage, 'Network connectivity timeout during perimeter probe.');
      assert.equal(state.canTrigger, true);
      assert.equal(state.isUnderstanding, false);
      assert.equal(state.buttonLabel, 'Try again');
      // Failed job does not overwrite snapshot ID with a false completion
      assert.equal(state.snapshotId, 'snp-yesterday-101');
      assert.equal(state.authoritativeTimestamp, null);
    });
  });

  describe('2. Temporal Aging & Unambiguous Precision (Anti-Vagueness)', () => {
    it('formats freshness across canonical temporal intervals without vague approximations', () => {
      // Just now (< 60s)
      assert.equal(
        formatUnderstandingFreshness(mockTimestampJustNow, mockTimestampNow),
        'Understood just now'
      );

      // 2m ago
      assert.equal(
        formatUnderstandingFreshness(mockTimestamp2mAgo, mockTimestampNow),
        'Understood 2m ago'
      );

      // 18m ago
      assert.equal(
        formatUnderstandingFreshness(mockTimestamp18mAgo, mockTimestampNow),
        'Understood 18m ago'
      );

      // 3h ago
      assert.equal(
        formatUnderstandingFreshness(mockTimestamp3hAgo, mockTimestampNow),
        'Understood 3h ago'
      );

      // 23h ago
      assert.equal(
        formatUnderstandingFreshness(mockTimestamp23hAgo, mockTimestampNow),
        'Understood 23h ago'
      );

      // 2 days ago
      const twoDaysAgo = new Date('2026-08-22T20:36:00Z').toISOString();
      assert.equal(
        formatUnderstandingFreshness(twoDaysAgo, mockTimestampNow),
        'Understood 2d ago'
      );
    });

    it('prohibits vague phrases such as "Recently understood"', () => {
      const timestamps = [mockTimestampJustNow, mockTimestamp2mAgo, mockTimestamp18mAgo, mockTimestamp3hAgo];
      for (const ts of timestamps) {
        const formatted = formatUnderstandingFreshness(ts, mockTimestampNow);
        assert.notEqual(formatted, 'Recently understood');
        assert.ok(formatted.startsWith('Understood '));
      }
    });

    it('formats full verified timestamp with exact date and time', () => {
      const formatted = formatVerifiedDate('2026-08-24T20:36:00Z');
      assert.ok(formatted.startsWith('Verified · '));
      assert.ok(formatted.includes('2026'));
    });
  });

  describe('3. Critical Backend Truth: No Optimistic Timestamps', () => {
    it('does not update timestamp optimistically when trigger is pending', () => {
      const state = resolveUnderstandingFreshness({
        isTriggerPending: true,
        activeJob: null,
        latestJob: null,
        latestSnapshot: mockSnapshotA,
        totalSnapshots: 1,
        now: mockTimestampNow,
      });

      assert.equal(state.phase, 'UNDERSTANDING');
      assert.equal(state.authoritativeTimestamp, null, 'Must NOT set fresh timestamp before server confirmation');
      assert.equal(state.formattedFreshness, 'Understanding infrastructure…');
      assert.equal(state.lastVerifiedTimestamp, mockSnapshotA.capturedAt);
    });
  });

  describe('4. Manual & Automatic Understanding Freshness Convergence', () => {
    it('converges manual understanding trigger through unified freshness resolver', () => {
      const manualCompletedJob: UnderstandingJobDto = {
        id: 'job-manual-777',
        domainId: mockDomainId,
        status: 'COMPLETED',
        triggerType: 'MANUAL',
        startedAt: '2026-08-24T20:35:00Z',
        completedAt: mockTimestampJustNow,
        snapshotId: mockSnapshotB.id,
      };

      const state = resolveUnderstandingFreshness({
        isTriggerPending: false,
        activeJob: null,
        latestJob: manualCompletedJob,
        latestSnapshot: mockSnapshotB,
        totalSnapshots: 2,
        now: mockTimestampNow,
      });

      assert.equal(state.phase, 'UNDERSTOOD');
      assert.equal(state.formattedFreshness, 'Understood just now');
      assert.equal(state.snapshotId, 'snp-fresh-202');
    });

    it('converges automatic worker background understanding identically to manual runs', () => {
      const scheduledCompletedJob: UnderstandingJobDto = {
        id: 'job-scheduled-888',
        domainId: mockDomainId,
        status: 'COMPLETED',
        triggerType: 'SCHEDULED',
        startedAt: '2026-08-24T20:35:00Z',
        completedAt: mockTimestampJustNow,
        snapshotId: mockSnapshotB.id,
      };

      const state = resolveUnderstandingFreshness({
        isTriggerPending: false,
        activeJob: null,
        latestJob: scheduledCompletedJob,
        latestSnapshot: mockSnapshotB,
        totalSnapshots: 2,
        now: mockTimestampNow,
      });

      assert.equal(state.phase, 'UNDERSTOOD');
      assert.equal(state.formattedFreshness, 'Understood just now');
      assert.equal(state.snapshotId, 'snp-fresh-202');
    });
  });

  describe('5. Snapshot Identity Integrity across All Workspace Surfaces', () => {
    it('verifies that Overview, Findings, Changes, Infrastructure, Memory, and Header converge to identical Snapshot B', () => {
      const convergenceAudit = verifyWorkspaceSnapshotConvergence({
        latestUnderstandingSnapshotId: 'snp-fresh-202',
        overviewSnapshotId: 'snp-fresh-202',
        infrastructureSnapshotId: 'snp-fresh-202',
        findingsSnapshotId: 'snp-fresh-202',
        changesCurrentSnapshotId: 'snp-fresh-202',
        memoryLatestSnapshotId: 'snp-fresh-202',
      });

      assert.equal(convergenceAudit.isConverged, true);
      assert.equal(convergenceAudit.convergedSnapshotId, 'snp-fresh-202');
      assert.deepEqual(convergenceAudit.divergentSurfaces, []);
    });

    it('detects and reports snapshot divergence if any surface retains a stale snapshot ID', () => {
      const divergentAudit = verifyWorkspaceSnapshotConvergence({
        latestUnderstandingSnapshotId: 'snp-fresh-202',
        overviewSnapshotId: 'snp-fresh-202',
        infrastructureSnapshotId: 'snp-yesterday-101', // Stale snapshot!
        findingsSnapshotId: 'snp-fresh-202',
        changesCurrentSnapshotId: 'snp-fresh-202',
        memoryLatestSnapshotId: 'snp-fresh-202',
      });

      assert.equal(divergentAudit.isConverged, false);
      assert.equal(divergentAudit.convergedSnapshotId, null);
      assert.deepEqual(divergentAudit.divergentSurfaces, ['Infrastructure']);
    });
  });

  describe('6. Cross-Surface Timestamp Convergence', () => {
    it('verifies that Header, Overview, Infrastructure, Changes, and Memory share authoritative snapshot timestamp', () => {
      const timestampAudit = verifyWorkspaceTimestampConvergence({
        headerTimestamp: mockTimestampJustNow,
        overviewTimestamp: mockTimestampJustNow,
        infrastructureTimestamp: mockTimestampJustNow,
        changesTimestamp: mockTimestampJustNow,
        memoryTimestamp: mockTimestampJustNow,
      });

      assert.equal(timestampAudit.isConverged, true);
      assert.equal(timestampAudit.convergedTimestamp, mockTimestampJustNow);
      assert.deepEqual(timestampAudit.divergentSurfaces, []);
    });

    it('detects timestamp divergence across surfaces', () => {
      const divergentTimestampAudit = verifyWorkspaceTimestampConvergence({
        headerTimestamp: mockTimestampJustNow,
        overviewTimestamp: mockTimestampJustNow,
        infrastructureTimestamp: mockTimestamp23hAgo, // Stale timestamp!
        changesTimestamp: mockTimestampJustNow,
        memoryTimestamp: mockTimestampJustNow,
      });

      assert.equal(divergentTimestampAudit.isConverged, false);
      assert.deepEqual(divergentTimestampAudit.divergentSurfaces, ['Infrastructure']);
    });
  });

  describe('7. End-to-End Sequence: Initial State -> Understand Now -> Active -> Converged', () => {
    it('executes full sequence without refresh or manual cache clearing', () => {
      // Step 1: Initial state (Domain with Snapshot A - 23h ago)
      const initialFreshness = resolveUnderstandingFreshness({
        isTriggerPending: false,
        activeJob: null,
        latestJob: null,
        latestSnapshot: mockSnapshotA,
        totalSnapshots: 1,
        now: mockTimestampNow,
      });
      assert.equal(initialFreshness.phase, 'UNDERSTOOD');
      assert.equal(initialFreshness.formattedFreshness, 'Understood 23h ago');
      assert.equal(initialFreshness.snapshotId, 'snp-yesterday-101');

      // Step 2: User clicks "Understand now" (Job created, running)
      const runningJob: UnderstandingJobDto = {
        id: 'job-seq-500',
        domainId: mockDomainId,
        status: 'RUNNING',
        triggerType: 'MANUAL',
        startedAt: mockTimestampJustNow,
      };

      const runningFreshness = resolveUnderstandingFreshness({
        isTriggerPending: false,
        activeJob: runningJob,
        latestJob: runningJob,
        latestSnapshot: mockSnapshotA,
        totalSnapshots: 1,
        now: mockTimestampNow,
      });
      assert.equal(runningFreshness.phase, 'UNDERSTANDING');
      assert.equal(runningFreshness.formattedFreshness, 'Understanding infrastructure…');
      assert.equal(runningFreshness.isUnderstanding, true);
      assert.equal(runningFreshness.canTrigger, false);

      // Step 3: Backend completes analysis -> Snapshot B committed -> Reconciliation triggered
      const completedJob: UnderstandingJobDto = {
        ...runningJob,
        status: 'COMPLETED',
        completedAt: mockTimestampJustNow,
        snapshotId: 'snp-fresh-202',
      };

      const decision = evaluateConvergenceDecision({
        domainId: mockDomainId,
        lastReconciledJobId: null,
        prevRunningJobId: 'job-seq-500',
        jobs: [completedJob],
      });
      assert.equal(decision.shouldReconcile, true);
      assert.equal(decision.newReconciledJobId, 'job-seq-500');

      // Step 4: After reconciliation, Header immediately displays "Understood just now"
      const convergedFreshness = resolveUnderstandingFreshness({
        isTriggerPending: false,
        activeJob: null,
        latestJob: completedJob,
        latestSnapshot: mockSnapshotB,
        totalSnapshots: 2,
        now: mockTimestampNow,
      });
      assert.equal(convergedFreshness.phase, 'UNDERSTOOD');
      assert.equal(convergedFreshness.formattedFreshness, 'Understood just now');
      assert.equal(convergedFreshness.snapshotId, 'snp-fresh-202');

      // Step 5: Changes compares Snapshot B against Snapshot A
      const mockChangeEvent: TimelineEventDto = {
        id: 'evt-web-server-changed',
        domainId: mockDomainId,
        snapshotId: 'snp-fresh-202',
        currentSnapshotId: 'snp-fresh-202',
        previousSnapshotId: 'snp-yesterday-101',
        changeType: 'MODIFIED',
        category: 'web_server',
        severity: 'LOW',
        title: 'Web server upgraded',
        previousValue: 'nginx/1.22',
        currentValue: 'nginx/1.24',
        detectedAt: mockTimestampJustNow,
      };

      const convergedChanges = integrateAuthoritativeChanges({
        domainId: mockDomainId,
        domainName: mockDomainName,
        snapshots: [mockSnapshotB, mockSnapshotA],
        timelineEvents: [mockChangeEvent],
        isLoading: false,
        isError: false,
        isUnderstanding: false,
      });
      assert.equal(convergedChanges.state, 'READY');
      assert.equal(convergedChanges.snapshotPair.currentSnapshot?.id, 'snp-fresh-202');
      assert.equal(convergedChanges.snapshotPair.previousSnapshot?.id, 'snp-yesterday-101');
      assert.equal(convergedChanges.changes.length, 1);
    });
  });

  describe('8. Truth Matrix & Certified Invariants Audit', () => {
    it('verifies Understanding Freshness & Completion Truth in Truth Matrix', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Understanding Freshness & Completion Truth'
      );
      assert.ok(cap, 'Capability must exist in Truth Matrix');
      assert.equal(cap?.category, 'Current Intelligence');
      assert.equal(cap?.status, 'PRODUCTION_READY');
      assert.equal(
        cap?.frontendComponent,
        'resolveUnderstandingFreshness & ReturningWorkspaceEntry'
      );
    });

    it('verifies all 9 certified WX-1012 freshness invariants exist in truth contracts', () => {
      const expectedInvariants = [
        'AUTHORITATIVE_UNDERSTANDING_FRESHNESS',
        'NO_STALE_HEADER_AFTER_COMPLETION',
        'NO_OPTIMISTIC_SUCCESS_TIMESTAMP',
        'FAILED_UNDERSTANDING_PRESERVES_LAST_TRUSTED_TIME',
        'MANUAL_AUTOMATIC_FRESHNESS_CONVERGENCE',
        'LATEST_SNAPSHOT_IDENTITY_CONVERGENCE',
        'NO_CROSS_SURFACE_TIMESTAMP_DIVERGENCE',
        'NO_REFRESH_REQUIRED_FOR_FRESHNESS',
        'UNDERSTANDING_STATE_VISIBLE',
      ];

      for (const inv of expectedInvariants) {
        assert.ok(
          inv in UNDERSTANDING_FRESHNESS_INVARIANTS,
          `Expected ${inv} in UNDERSTANDING_FRESHNESS_INVARIANTS`
        );
        assert.ok(
          inv in WORKSPACE_CERTIFIED_INVARIANTS,
          `Expected ${inv} in WORKSPACE_CERTIFIED_INVARIANTS`
        );
      }
    });
  });
});
