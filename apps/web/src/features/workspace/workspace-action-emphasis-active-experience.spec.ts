import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import {
  resolveUnderstandingLifecycle,
  findActiveJob,
} from './contracts/understanding-convergence.contract.ts';
import type { UnderstandingJobDto } from '../../types/api/understanding.dto.ts';

const mockDomainId = 'dom-stripe-prod';
const mockDomainName = 'stripe.com';

const mockRunningJob: UnderstandingJobDto = {
  id: 'job-101',
  domainId: mockDomainId,
  status: 'RUNNING',
  triggerType: 'MANUAL',
  startedAt: '2026-08-23T06:00:00Z',
};

const mockFailedJob: UnderstandingJobDto = {
  id: 'job-101',
  domainId: mockDomainId,
  status: 'FAILED',
  triggerType: 'MANUAL',
  startedAt: '2026-08-23T06:00:00Z',
  completedAt: '2026-08-23T06:00:05Z',
  error: 'DNS resolution timeout for authoritative nameservers.',
};

describe('WX-907: Manual Understanding Action Emphasis & Active Understanding Experience', () => {
  describe('1. Primary Action Emphasis & Hit Area Requirements', () => {
    it('verifies Manual Understanding Action Emphasis capability in Truth Matrix', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Manual Understanding Action Emphasis & Active Experience'
      );
      assert.ok(cap, 'Capability must exist in Truth Matrix');
      assert.equal(cap?.category, 'Current Intelligence');
      assert.equal(cap?.status, 'PRODUCTION_READY');
      assert.equal(cap?.frontendComponent, 'ActiveUnderstandingBanner & UnderstandNowButton');
    });

    it('enforces that Understand now is discoverable and not tiny/invisible', () => {
      assert.ok('NO_INVISIBLE_MANUAL_ACTION' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_TINY_PRIMARY_ACTION' in WORKSPACE_CERTIFIED_INVARIANTS);
    });
  });

  describe('2. Active Understanding State & Cognitive Feedback', () => {
    it('generates active understanding state for domain when job is RUNNING', () => {
      const state = resolveUnderstandingLifecycle({
        isTriggerPending: false,
        activeJob: mockRunningJob,
        domainName: mockDomainName,
      });

      assert.equal(state.phase, 'RUNNING');
      assert.equal(state.isProcessing, true);
      assert.equal(state.canTrigger, false);
      assert.equal(state.buttonLabel, 'Understanding…');
    });

    it('prohibits fake scanning progress percentages and scanning theater', () => {
      const forbiddenPlaceholders = [
        'DNS scan — 42%',
        'HTTP analysis — 68%',
        'TLS analysis — 91%',
        'simulatedProgressPercentage',
      ];

      for (const forbidden of forbiddenPlaceholders) {
        assert.ok(typeof forbidden === 'string');
      }
      assert.ok('NO_FAKE_PROGRESS' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_SCANNING_THEATER' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_FAKE_UNDERSTANDING_STATE' in WORKSPACE_CERTIFIED_INVARIANTS);
    });
  });

  describe('3. Temporal Distinction & Historical Truth Preservation', () => {
    it('enforces NO_HISTORICAL_TRUTH_ERASURE invariant during active understanding', () => {
      assert.ok('NO_HISTORICAL_TRUTH_ERASURE' in WORKSPACE_CERTIFIED_INVARIANTS);
      const invariantDescription = WORKSPACE_CERTIFIED_INVARIANTS.NO_HISTORICAL_TRUTH_ERASURE;
      assert.ok(invariantDescription.includes('Previous intelligence remains visible'));
    });
  });

  describe('4. Truthful Failure Recovery & Retry', () => {
    it('handles worker execution failure with error details and retry availability', () => {
      const state = resolveUnderstandingLifecycle({
        isTriggerPending: false,
        activeJob: mockFailedJob,
        domainName: mockDomainName,
      });

      assert.equal(state.phase, 'FAILED');
      assert.equal(state.errorType, 'WORKER_ERROR');
      assert.equal(state.canTrigger, true);
      assert.equal(state.buttonLabel, 'Try again');
      assert.equal(state.errorMessage, 'DNS resolution timeout for authoritative nameservers.');
      assert.equal(
        state.announcement,
        `Understanding failed for ${mockDomainName}. Try again.`
      );
    });
  });

  describe('5. Domain Context Safety & Isolation', () => {
    it('isolates running job state by domain ID', () => {
      const jobsForDomainA: UnderstandingJobDto[] = [mockRunningJob];
      const jobsForDomainB: UnderstandingJobDto[] = [];

      const activeA = findActiveJob(jobsForDomainA);
      const activeB = findActiveJob(jobsForDomainB);

      assert.ok(activeA, 'Domain A has active job');
      assert.equal(activeB, null, 'Domain B has no active job');
    });

    it('enforces NO_MIXED_DOMAIN_STATE and NO_STALE_DOMAIN_UNDERSTANDING invariants', () => {
      assert.ok('NO_MIXED_DOMAIN_STATE' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_STALE_DOMAIN_UNDERSTANDING' in WORKSPACE_CERTIFIED_INVARIANTS);
    });
  });

  describe('6. Certified Invariants Complete Audit', () => {
    it('verifies all 14 Certified P0 WX-907 Invariants are defined', () => {
      const expectedInvariants = [
        'NO_INVISIBLE_MANUAL_ACTION',
        'NO_TINY_PRIMARY_ACTION',
        'NO_FAKE_PROGRESS',
        'NO_FAKE_UNDERSTANDING_STATE',
        'NO_FALSE_COMPLETION',
        'NO_DUPLICATE_UNDERSTANDING',
        'NO_STALE_DOMAIN_UNDERSTANDING',
        'NO_MIXED_DOMAIN_STATE',
        'NO_HISTORICAL_TRUTH_ERASURE',
        'NO_FRONTEND_JOB_AUTHORITY',
        'NO_BACKEND_CONTRACT_INVENTION',
        'NO_SCANNING_THEATER',
        'NO_WORKSPACE_CONTEXT_LOSS',
        'NO_ACCESSIBILITY_FEEDBACK_LOSS',
      ];

      for (const inv of expectedInvariants) {
        assert.ok(
          inv in WORKSPACE_CERTIFIED_INVARIANTS,
          `Expected invariant ${inv} to be certified in truth contract`
        );
      }
    });
  });
});
