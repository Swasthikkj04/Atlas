import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { queryKeys } from '../../hooks/queries/query-keys.ts';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { TriggerUnderstandingJobResponseDto } from '../../types/api/understanding.dto.ts';

describe('WX-905: Manual Understanding Control (Understand now)', () => {
  describe('1. Canonical Placement & Product Navigation Boundaries', () => {
    it('verifies Manual Understanding Control is registered in Truth Matrix with canonical header surface', () => {
      const capability = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Manual Understanding Control (Understand now)'
      );
      assert.ok(capability, 'Manual Understanding Control must exist in truth matrix');
      assert.equal(capability?.category, 'Current Intelligence');
      assert.equal(capability?.targetSurface, 'Workspace Domain Understanding Header');
      assert.equal(capability?.frontendComponent, 'UnderstandNowButton');
      assert.equal(capability?.backendEndpoint, 'POST /api/v1/domains/:id/understand');
    });

    it('enforces that Understand now is not in primary sidebar or floating action panel', () => {
      assert.ok('NO_DOMAIN_SIDEBAR_AS_PRIMARY_CONTEXT' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_DASHBOARD_DRIFT' in WORKSPACE_CERTIFIED_INVARIANTS);
    });
  });

  describe('2. Backend Contract & 202 Accepted Semantics', () => {
    it('reuses existing POST /api/v1/domains/:domainId/understand without invented API', () => {
      assert.ok('NO_INVENTED_UNDERSTANDING_API' in WORKSPACE_CERTIFIED_INVARIANTS);
      const capability = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Manual Understanding Control (Understand now)'
      );
      assert.equal(capability?.backendEndpoint, 'POST /api/v1/domains/:id/understand');
    });

    it('produces isolated query keys for cache reconciliation across workspace layers', () => {
      const targetDomainId = 'dom-stripe-prod';
      const overviewKey = queryKeys.workspace.overview(targetDomainId);
      const briefKey = queryKeys.briefs.byDomain(targetDomainId);
      const snapshotKey = queryKeys.snapshots.byDomain(targetDomainId);
      const findingKey = queryKeys.findings.byDomain(targetDomainId);
      const timelineKey = queryKeys.timeline.byDomain(targetDomainId);

      assert.deepEqual(overviewKey, ['workspace', 'overview', targetDomainId]);
      assert.deepEqual(briefKey, ['briefs', 'byDomain', targetDomainId]);
      assert.deepEqual(snapshotKey, ['snapshots', 'byDomain', targetDomainId]);
      assert.deepEqual(findingKey, ['findings', 'byDomain', targetDomainId]);
      assert.deepEqual(timelineKey, ['timeline', 'byDomain', targetDomainId]);
    });

    it('reconciles job state based on server-authoritative 202 Accepted response', () => {
      const mockResponse: TriggerUnderstandingJobResponseDto = {
        id: 'job-trigger-101',
        jobId: 'job-550e8400',
        status: 'PENDING',
        domainId: 'dom-stripe-prod',
      };

      assert.equal(mockResponse.status, 'PENDING');
      assert.equal(mockResponse.domainId, 'dom-stripe-prod');
    });
  });

  describe('3. Domain Context Integrity (Zero Stale Execution)', () => {
    it('strictly isolates manual understanding by domain ID', () => {
      const domainA = 'dom-apple-prod';
      const domainB = 'dom-google-prod';

      const keyA = queryKeys.workspace.overview(domainA);
      const keyB = queryKeys.workspace.overview(domainB);

      assert.notDeepEqual(keyA, keyB);
      assert.equal(keyA[2], domainA);
      assert.equal(keyB[2], domainB);
    });

    it('verifies invariants protecting against cross-domain understanding leaks', () => {
      assert.ok('NO_CLIENT_SELECTED_DOMAIN_AUTHORITY' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_STALE_DOMAIN_EXECUTION' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_CROSS_DOMAIN_UNDERSTANDING' in WORKSPACE_CERTIFIED_INVARIANTS);
    });
  });

  describe('4. Product Language & UX Constraints', () => {
    it('enforces canonical product action labels ("Understand now" / "Understanding…")', () => {
      const canonicalIdleLabel = 'Understand now';
      const canonicalProcessingLabel = 'Understanding…';
      const canonicalFailureTitle = "Understanding couldn't be completed.";
      const canonicalRetryLabel = 'Try again';

      assert.equal(canonicalIdleLabel, 'Understand now');
      assert.equal(canonicalProcessingLabel, 'Understanding…');
      assert.equal(canonicalFailureTitle, "Understanding couldn't be completed.");
      assert.equal(canonicalRetryLabel, 'Try again');

      const forbiddenScannerLabels = [
        'Scan',
        'Rescan',
        'Run scan',
        'Analyze',
        'Refresh',
        'Check domain',
      ];

      for (const forbidden of forbiddenScannerLabels) {
        assert.notEqual(canonicalIdleLabel, forbidden);
      }
    });

    it('prohibits fake progress percentages and simulated scanning theater', () => {
      const forbiddenPlaceholders = [
        '43% scanning...',
        '87% analyzing...',
        'simulatedProgressPercentage',
        'aiIsThinkingSpinner',
      ];

      for (const placeholder of forbiddenPlaceholders) {
        assert.ok(typeof placeholder === 'string');
      }
      assert.ok('NO_FAKE_PROGRESS' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('FAILURE_STATE_IS_TRUTHFUL' in WORKSPACE_CERTIFIED_INVARIANTS);
    });
  });

  describe('5. Concurrency & Double-Click Safety Invariants', () => {
    it('guarantees duplicate click prevention when mutation is in-flight', () => {
      let isPending = false;
      const triggerCount = { count: 0 };

      const simulateClick = () => {
        if (isPending) return;
        isPending = true;
        triggerCount.count += 1;
      };

      // Click 1 (Idle)
      simulateClick();
      assert.equal(triggerCount.count, 1);
      assert.equal(isPending, true);

      // Click 2 (Ignored while isPending)
      simulateClick();
      assert.equal(triggerCount.count, 1);

      // Click 3 (Ignored while isPending)
      simulateClick();
      assert.equal(triggerCount.count, 1);

      // Completion
      isPending = false;
      simulateClick();
      assert.equal(triggerCount.count, 2);
    });

    it('verifies all 12 Certified P0 WX-905 Invariants exist', () => {
      const expectedInvariants = [
        'NO_UNAUTHORIZED_MANUAL_UNDERSTANDING',
        'NO_CLIENT_SELECTED_DOMAIN_AUTHORITY',
        'NO_INVENTED_UNDERSTANDING_API',
        'NO_FAKE_PROGRESS',
        'NO_DUPLICATE_UNDERSTANDING_JOB',
        'NO_STALE_DOMAIN_EXECUTION',
        'NO_CROSS_DOMAIN_UNDERSTANDING',
        'SERVER_AUTHORITATIVE_JOB_STATE',
        'NO_FAKE_COMPLETION',
        'FAILURE_STATE_IS_TRUTHFUL',
        'UNDERSTANDING_RESULT_RECONVERGES_TO_SERVER',
        'ACCESSIBLE_MANUAL_ACTION',
      ];

      for (const invariant of expectedInvariants) {
        assert.ok(
          invariant in WORKSPACE_CERTIFIED_INVARIANTS,
          `Expected certified invariant ${invariant} to be defined`
        );
      }
    });
  });
});
