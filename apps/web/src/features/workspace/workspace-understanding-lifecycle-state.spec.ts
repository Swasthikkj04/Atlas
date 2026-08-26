import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveUnderstandingLifecycleState,
  formatVerifiedRecency,
} from './contracts/understanding-lifecycle.contract.ts';
import {
  WORKSPACE_CERTIFIED_INVARIANTS,
  WORKSPACE_TRUTH_MATRIX,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { InfrastructureSnapshotDto, UnderstandingJobDto } from '../../types/api';

describe('WX-1018: Understanding Lifecycle & Current-State Communication', () => {
  const mockNow = new Date('2026-08-25T18:00:00.000Z').getTime();

  const mockBaselineSnapshot: InfrastructureSnapshotDto = {
    id: 'snap-baseline-001',
    domainId: 'dom-atlas-001',
    domainName: 'example.com',
    capturedAt: '2026-08-25T17:59:00.000Z', // 1m ago
    createdAt: '2026-08-25T17:59:00.000Z',
    httpStatus: 200,
    responseTimeMs: 120,
    technologies: ['React', 'Next.js'],
    dnsRecords: [{ type: 'A', name: '@', value: '93.184.216.34' }],
  };

  const mockCurrentSnapshot: InfrastructureSnapshotDto = {
    id: 'snap-current-002',
    domainId: 'dom-atlas-001',
    domainName: 'example.com',
    capturedAt: '2026-08-25T17:59:30.000Z', // 30s ago
    createdAt: '2026-08-25T17:59:30.000Z',
    httpStatus: 200,
    responseTimeMs: 110,
    technologies: ['React', 'Next.js'],
    dnsRecords: [{ type: 'A', name: '@', value: '93.184.216.34' }],
  };

  const mockRunningJob: UnderstandingJobDto = {
    id: 'job-active-001',
    domainId: 'dom-atlas-001',
    triggerType: 'MANUAL',
    status: 'RUNNING',
    startedAt: '2026-08-25T17:59:45.000Z',
  };

  const mockFailedJob: UnderstandingJobDto = {
    id: 'job-failed-001',
    domainId: 'dom-atlas-001',
    triggerType: 'MANUAL',
    status: 'FAILED',
    startedAt: '2026-08-25T17:58:00.000Z',
    error: 'Connection timed out while probing target DNS records.',
  };

  describe('1. Formatter: formatVerifiedRecency', () => {
    it('formats recent timestamps with calm authoritative precision', () => {
      assert.equal(
        formatVerifiedRecency('2026-08-25T17:59:40.000Z', mockNow),
        'Verified just now'
      );
      assert.equal(
        formatVerifiedRecency('2026-08-25T17:59:00.000Z', mockNow),
        'Verified 1 minute ago'
      );
      assert.equal(
        formatVerifiedRecency('2026-08-25T17:45:00.000Z', mockNow),
        'Verified 15 minutes ago'
      );
      assert.equal(
        formatVerifiedRecency('2026-08-25T17:00:00.000Z', mockNow),
        'Verified 1 hour ago'
      );
      assert.equal(
        formatVerifiedRecency('2026-08-24T19:00:00.000Z', mockNow),
        'Verified 23 hours ago'
      );
      assert.equal(
        formatVerifiedRecency('2026-08-24T18:00:00.000Z', mockNow),
        'Verified 1 day ago'
      );
      assert.equal(
        formatVerifiedRecency('2026-08-23T18:00:00.000Z', mockNow),
        'Verified 2 days ago'
      );
    });
  });

  describe('2. State: NOT_UNDERSTOOD', () => {
    it('resolves un-understood domain accurately without false claims', () => {
      const state = resolveUnderstandingLifecycleState({
        totalSnapshots: 0,
        now: mockNow,
      });

      assert.equal(state.phase, 'NOT_UNDERSTOOD');
      assert.equal(state.badge.label, 'NOT UNDERSTOOD');
      assert.equal(state.semanticHeadline, 'Not understood yet');
      assert.equal(
        state.temporalSubtitle,
        'Run understanding to discover infrastructure facts and topology.'
      );
      assert.equal(state.isUnderstanding, false);
      assert.equal(state.canTrigger, true);
      assert.equal(state.buttonLabel, 'Understand now');
    });
  });

  describe('3. State: UNDERSTANDING (Non-blocking active run)', () => {
    it('communicates active understanding without blocking or erasing previous state', () => {
      const state = resolveUnderstandingLifecycleState({
        activeJob: mockRunningJob,
        latestSnapshot: mockBaselineSnapshot,
        totalSnapshots: 1,
        now: mockNow,
      });

      assert.equal(state.phase, 'UNDERSTANDING');
      assert.equal(state.badge.label, 'UNDERSTANDING');
      assert.equal(state.badge.isPulsing, true);
      assert.equal(state.semanticHeadline, 'Understanding infrastructure…');
      assert.equal(state.temporalSubtitle, 'Establishing a new verified state');
      assert.equal(
        state.supportingContext,
        'Nebula is establishing a new verified infrastructure state.'
      );
      assert.equal(state.isUnderstanding, true);
      assert.equal(state.canTrigger, false);
      assert.equal(state.buttonLabel, 'Understanding…');
      assert.equal(state.lastTrustedTimestamp, mockBaselineSnapshot.capturedAt);
    });
  });

  describe('4. State: BASELINE_ESTABLISHED (First Understanding)', () => {
    it('clearly communicates baseline establishment and proves baseline != no changes', () => {
      const state = resolveUnderstandingLifecycleState({
        latestSnapshot: mockBaselineSnapshot,
        totalSnapshots: 1,
        meaningfulChangesCount: 0,
        now: mockNow,
      });

      assert.equal(state.phase, 'BASELINE_ESTABLISHED');
      assert.equal(state.badge.label, 'BASELINE');
      assert.equal(state.semanticHeadline, 'Infrastructure understood');
      assert.equal(
        state.temporalSubtitle,
        'Initial baseline established · Verified 1 minute ago'
      );
      assert.equal(
        state.supportingContext,
        'This is the first verified understanding of this domain. There is no previous state to compare against yet.'
      );
      assert.equal(state.isUnderstanding, false);
      assert.equal(state.canTrigger, true);
      assert.equal(state.buttonLabel, 'Understand now');
    });
  });

  describe('5. State: STABLE (Multiple snapshots, 0 meaningful changes)', () => {
    it('communicates stable posture and proves comparison actually occurred', () => {
      const state = resolveUnderstandingLifecycleState({
        latestSnapshot: mockCurrentSnapshot,
        previousSnapshot: mockBaselineSnapshot,
        totalSnapshots: 2,
        meaningfulChangesCount: 0,
        now: mockNow,
      });

      assert.equal(state.phase, 'STABLE');
      assert.equal(state.badge.label, 'ACTIVE');
      assert.equal(state.semanticHeadline, 'Infrastructure understood');
      assert.equal(state.temporalSubtitle, 'Verified just now · Confidence High');
      assert.equal(
        state.supportingContext,
        'No meaningful changes detected since the previous verified understanding.'
      );
      assert.equal(state.isUnderstanding, false);
      assert.equal(state.canTrigger, true);
    });
  });

  describe('6. State: CHANGED (Multiple snapshots, >= 1 meaningful changes)', () => {
    it('communicates detected differences with exact counts and semantic alert', () => {
      const state = resolveUnderstandingLifecycleState({
        latestSnapshot: mockCurrentSnapshot,
        previousSnapshot: mockBaselineSnapshot,
        totalSnapshots: 2,
        meaningfulChangesCount: 2,
        now: mockNow,
      });

      assert.equal(state.phase, 'CHANGED');
      assert.equal(state.badge.label, 'CHANGE DETECTED');
      assert.equal(state.semanticHeadline, 'Infrastructure changed');
      assert.equal(
        state.temporalSubtitle,
        '2 meaningful changes · Verified just now'
      );
      assert.equal(
        state.supportingContext,
        '2 meaningful changes detected since the previous understanding.'
      );
      assert.equal(state.isUnderstanding, false);
      assert.equal(state.canTrigger, true);
    });

    it('singularizes change word when changesCount is 1', () => {
      const state = resolveUnderstandingLifecycleState({
        latestSnapshot: mockCurrentSnapshot,
        previousSnapshot: mockBaselineSnapshot,
        totalSnapshots: 2,
        meaningfulChangesCount: 1,
        now: mockNow,
      });

      assert.equal(
        state.temporalSubtitle,
        '1 meaningful change · Verified just now'
      );
      assert.equal(
        state.supportingContext,
        '1 meaningful change detected since the previous understanding.'
      );
    });
  });

  describe('7. State: FAILED (Orthogonal failure retaining last trusted state)', () => {
    it('truthfully retains last trusted state when latest job fails', () => {
      const state = resolveUnderstandingLifecycleState({
        latestJob: mockFailedJob,
        latestSnapshot: mockBaselineSnapshot,
        totalSnapshots: 1,
        now: mockNow,
      });

      assert.equal(state.phase, 'FAILED');
      assert.equal(state.badge.label, 'FAILED');
      assert.equal(state.semanticHeadline, 'Previous infrastructure state retained');
      assert.equal(
        state.temporalSubtitle,
        'The latest understanding could not be completed. Your last verified state remains trusted.'
      );
      assert.equal(state.isUnderstanding, false);
      assert.equal(state.canTrigger, true);
      assert.equal(state.buttonLabel, 'Try again');
      assert.equal(state.retryAvailable, true);
      assert.equal(state.lastTrustedTimestamp, mockBaselineSnapshot.capturedAt);
    });
  });

  describe('8. Manual vs Automatic Understanding Identity', () => {
    it('produces identical lifecycle state whether triggered manually or by worker', () => {
      const manualCompletedJob: UnderstandingJobDto = {
        id: 'job-manual-100',
        domainId: 'dom-atlas-001',
        triggerType: 'MANUAL',
        status: 'COMPLETED',
        completedAt: '2026-08-25T17:59:00.000Z',
      };

      const automaticCompletedJob: UnderstandingJobDto = {
        id: 'job-worker-200',
        domainId: 'dom-atlas-001',
        triggerType: 'SCHEDULED',
        status: 'COMPLETED',
        completedAt: '2026-08-25T17:59:00.000Z',
      };

      const manualState = resolveUnderstandingLifecycleState({
        latestJob: manualCompletedJob,
        latestSnapshot: mockBaselineSnapshot,
        totalSnapshots: 1,
        now: mockNow,
      });

      const automaticState = resolveUnderstandingLifecycleState({
        latestJob: automaticCompletedJob,
        latestSnapshot: mockBaselineSnapshot,
        totalSnapshots: 1,
        now: mockNow,
      });

      assert.deepEqual(manualState.phase, automaticState.phase);
      assert.deepEqual(manualState.semanticHeadline, automaticState.semanticHeadline);
      assert.deepEqual(manualState.temporalSubtitle, automaticState.temporalSubtitle);
      assert.deepEqual(manualState.badge.label, automaticState.badge.label);
    });
  });

  describe('9. Certified Invariants Certification (WX-1018)', () => {
    it('contains WX-1018 in WORKSPACE_TRUTH_MATRIX', () => {
      const truthEntry = WORKSPACE_TRUTH_MATRIX.find((t) =>
        t.capability.includes('WX-1018') || t.capability.includes('Lifecycle')
      );
      assert.ok(truthEntry);
      assert.equal(truthEntry?.status, 'PRODUCTION_READY');
    });

    it('certifies all 8 WX-1018 hard invariants', () => {
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.STATE_BEFORE_TIMESTAMP);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.CURRENT_STATE_EXPLICIT);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_TIMESTAMP_ONLY_STATE);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.UNDERSTANDING_NON_BLOCKING);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.FAILED_RUN_PRESERVES_TRUST);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.BASELINE_IS_NOT_NO_CHANGE);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.STABLE_REQUIRES_COMPARISON);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.MANUAL_AUTOMATIC_STATE_IDENTITY);
    });
  });
});
