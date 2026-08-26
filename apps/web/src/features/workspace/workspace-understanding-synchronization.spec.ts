import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateConvergenceDecision,
  findActiveJob,
  WORKSPACE_SYNCHRONIZATION_INVARIANTS,
} from './contracts/understanding-convergence.contract.ts';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { UnderstandingJobDto } from '../../types/api/understanding.dto.ts';

const mockDomainA = 'dom-ding-001';
const mockDomainB = 'dom-example-002';

describe('WX-912: Workspace Understanding Synchronization & Truth Convergence', () => {
  describe('1. Manual Understanding Convergence', () => {
    it('detects when an active manual job finishes and triggers reconciliation', () => {
      const runningJob: UnderstandingJobDto = {
        id: 'job-man-100',
        domainId: mockDomainA,
        status: 'RUNNING',
        triggerType: 'MANUAL',
        startedAt: '2026-08-23T06:00:00Z',
      };

      const completedJob: UnderstandingJobDto = {
        ...runningJob,
        status: 'COMPLETED',
        completedAt: '2026-08-23T06:00:15Z',
      };

      // Step 1: Active job is present
      const active = findActiveJob([runningJob]);
      assert.equal(active?.id, 'job-man-100');

      // Step 2: Job completes
      const decision = evaluateConvergenceDecision({
        domainId: mockDomainA,
        lastReconciledJobId: null,
        prevRunningJobId: 'job-man-100',
        jobs: [completedJob],
      });

      assert.equal(decision.shouldReconcile, true);
      assert.equal(decision.newReconciledJobId, 'job-man-100');
      assert.equal(decision.reason, 'MANUAL_COMPLETED');
    });

    it('does not re-trigger reconciliation if the completed job was already reconciled', () => {
      const completedJob: UnderstandingJobDto = {
        id: 'job-man-100',
        domainId: mockDomainA,
        status: 'COMPLETED',
        triggerType: 'MANUAL',
        startedAt: '2026-08-23T06:00:00Z',
        completedAt: '2026-08-23T06:00:15Z',
      };

      const decision = evaluateConvergenceDecision({
        domainId: mockDomainA,
        lastReconciledJobId: 'job-man-100',
        prevRunningJobId: null,
        jobs: [completedJob],
      });

      assert.equal(decision.shouldReconcile, false);
      assert.equal(decision.newReconciledJobId, 'job-man-100');
      assert.equal(decision.reason, 'NO_CHANGE');
    });
  });

  describe('2. Automatic Background Understanding Convergence', () => {
    it('detects when an automatic worker understanding completes and triggers unified reconciliation', () => {
      const automaticJob: UnderstandingJobDto = {
        id: 'job-auto-200',
        domainId: mockDomainA,
        status: 'COMPLETED',
        triggerType: 'SCHEDULED',
        startedAt: '2026-08-23T06:59:45Z',
        completedAt: '2026-08-23T07:00:00Z',
      };

      const decision = evaluateConvergenceDecision({
        domainId: mockDomainA,
        lastReconciledJobId: 'job-man-100', // Previous manual job
        prevRunningJobId: null, // No UI click preceded this
        jobs: [automaticJob],
      });

      assert.equal(decision.shouldReconcile, true);
      assert.equal(decision.newReconciledJobId, 'job-auto-200');
      assert.equal(decision.reason, 'AUTOMATIC_COMPLETED');
    });
  });

  describe('3. Domain Scoped Isolation', () => {
    it('guarantees domain-isolated state transitions without cross-domain leak', () => {
      const domainBJob: UnderstandingJobDto = {
        id: 'job-b-300',
        domainId: mockDomainB,
        status: 'COMPLETED',
        triggerType: 'SCHEDULED',
        startedAt: '2026-08-23T07:00:00Z',
        completedAt: '2026-08-23T07:00:10Z',
      };

      // When evaluating domain A with domain A's jobs, domain B's completed jobs are not present
      const decisionA = evaluateConvergenceDecision({
        domainId: mockDomainA,
        lastReconciledJobId: 'job-auto-200',
        prevRunningJobId: null,
        jobs: [], // No new jobs for domain A
      });

      assert.equal(decisionA.shouldReconcile, false);
      assert.equal(decisionA.reason, 'NO_CHANGE');

      // When context switches to domain B, domain B initiates its own reconciliation baseline
      const decisionB = evaluateConvergenceDecision({
        domainId: mockDomainB,
        lastReconciledJobId: null, // Reset upon domain context switch
        prevRunningJobId: null,
        jobs: [domainBJob],
      });

      assert.equal(decisionB.shouldReconcile, false); // Initial baseline mount
      assert.equal(decisionB.newReconciledJobId, 'job-b-300');
    });
  });

  describe('4. Truth Matrix & Certified Invariants', () => {
    it('verifies Workspace Understanding Synchronization capability in Truth Matrix', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Workspace Understanding Synchronization & Truth Convergence'
      );
      assert.ok(cap, 'Capability must exist in Truth Matrix');
      assert.equal(cap?.category, 'States');
      assert.equal(cap?.status, 'PRODUCTION_READY');
      assert.equal(
        cap?.frontendComponent,
        'useWorkspaceUnderstandingConvergence & reconcileWorkspaceUnderstanding'
      );
      assert.equal(
        cap?.targetSurface,
        'Global Workspace Domain Synchronization'
      );
    });

    it('verifies all WX-912 certified synchronization invariants are defined', () => {
      const expectedInvariants = [
        'ONE_DOMAIN_ONE_AUTHORITATIVE_TRUTH',
        'UNIFIED_MANUAL_AND_AUTOMATIC_CONVERGENCE',
        'DOMAIN_ISOLATED_SYNCHRONIZATION',
        'NO_INDEPENDENT_PAGE_REGISTRY',
      ];

      for (const inv of expectedInvariants) {
        assert.ok(
          inv in WORKSPACE_SYNCHRONIZATION_INVARIANTS,
          `Expected ${inv} in WORKSPACE_SYNCHRONIZATION_INVARIANTS`
        );
        assert.ok(
          inv in WORKSPACE_CERTIFIED_INVARIANTS,
          `Expected ${inv} in WORKSPACE_CERTIFIED_INVARIANTS`
        );
      }
    });
  });
});
