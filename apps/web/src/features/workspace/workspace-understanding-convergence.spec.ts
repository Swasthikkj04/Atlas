import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { queryKeys } from '../../hooks/queries/query-keys.ts';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import {
  resolveUnderstandingLifecycle,
  shouldPollJob,
  findActiveJob,
} from './contracts/understanding-convergence.contract.ts';
import type { UnderstandingJobDto } from '../../types/api/understanding.dto.ts';

const mockDomainId = 'dom-stripe-prod';
const mockDomainName = 'stripe.com';

const mockPendingJob: UnderstandingJobDto = {
  id: 'job-101',
  domainId: mockDomainId,
  status: 'PENDING',
  triggerType: 'MANUAL',
  startedAt: '2026-08-23T06:00:00Z',
};

const mockRunningJob: UnderstandingJobDto = {
  id: 'job-101',
  domainId: mockDomainId,
  status: 'RUNNING',
  triggerType: 'MANUAL',
  startedAt: '2026-08-23T06:00:00Z',
};

const mockCompletedJob: UnderstandingJobDto = {
  id: 'job-101',
  domainId: mockDomainId,
  status: 'COMPLETED',
  triggerType: 'MANUAL',
  startedAt: '2026-08-23T06:00:00Z',
  completedAt: '2026-08-23T06:00:15Z',
  snapshotId: 'snp-stripe-202',
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

describe('WX-906: Understanding Job State & Workspace Convergence', () => {
  describe('1. Authoritative Canonical Lifecycle Transitions', () => {
    it('resolves IDLE state when no active job is present', () => {
      const state = resolveUnderstandingLifecycle({
        isTriggerPending: false,
        activeJob: null,
        domainName: mockDomainName,
      });

      assert.equal(state.phase, 'IDLE');
      assert.equal(state.isProcessing, false);
      assert.equal(state.canTrigger, true);
      assert.equal(state.buttonLabel, 'Understand now');
      assert.equal(state.errorMessage, null);
    });

    it('resolves ACCEPTED state when HTTP trigger mutation is in-flight', () => {
      const state = resolveUnderstandingLifecycle({
        isTriggerPending: true,
        activeJob: null,
        domainName: mockDomainName,
      });

      assert.equal(state.phase, 'ACCEPTED');
      assert.equal(state.isProcessing, true);
      assert.equal(state.canTrigger, false);
      assert.equal(state.buttonLabel, 'Understanding…');
      assert.equal(state.announcement, `Understanding started for ${mockDomainName}.`);
    });

    it('resolves RUNNING state when backend worker is queued in PENDING', () => {
      const state = resolveUnderstandingLifecycle({
        isTriggerPending: false,
        activeJob: mockPendingJob,
        domainName: mockDomainName,
      });

      assert.equal(state.phase, 'RUNNING');
      assert.equal(state.activeJobId, 'job-101');
      assert.equal(state.isProcessing, true);
      assert.equal(state.canTrigger, false);
      assert.equal(state.buttonLabel, 'Understanding…');
    });

    it('resolves RUNNING state when backend worker is executing analysis', () => {
      const state = resolveUnderstandingLifecycle({
        isTriggerPending: false,
        activeJob: mockRunningJob,
        domainName: mockDomainName,
      });

      assert.equal(state.phase, 'RUNNING');
      assert.equal(state.activeJobId, 'job-101');
      assert.equal(state.isProcessing, true);
      assert.equal(state.canTrigger, false);
      assert.equal(state.buttonLabel, 'Understanding…');
      assert.equal(state.announcement, null, 'Does not announce on recurring active polling ticks');
    });

    it('resolves COMPLETED state and generates completion announcement', () => {
      const state = resolveUnderstandingLifecycle({
        isTriggerPending: false,
        activeJob: mockCompletedJob,
        domainName: mockDomainName,
      });

      assert.equal(state.phase, 'COMPLETED');
      assert.equal(state.isProcessing, false);
      assert.equal(state.canTrigger, true);
      assert.equal(state.buttonLabel, 'Understand now');
      assert.equal(
        state.announcement,
        `Understanding completed. Workspace updated for ${mockDomainName}.`
      );
    });
  });

  describe('2. Error Boundaries: Request Rejection vs Worker Failure', () => {
    it('truthfully isolates initial HTTP request errors (POST failure)', () => {
      const triggerError = new Error('HTTP 429 Rate limit exceeded.');
      const state = resolveUnderstandingLifecycle({
        isTriggerPending: false,
        triggerError,
        activeJob: null,
        domainName: mockDomainName,
      });

      assert.equal(state.phase, 'REQUEST_ERROR');
      assert.equal(state.errorType, 'REQUEST_ERROR');
      assert.equal(state.canTrigger, true);
      assert.equal(state.buttonLabel, 'Try again');
      assert.equal(state.errorMessage, 'HTTP 429 Rate limit exceeded.');
      assert.equal(
        state.announcement,
        `Understanding request failed for ${mockDomainName}. Try again.`
      );
    });

    it('truthfully isolates worker execution failure (Job FAILED)', () => {
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

  describe('3. Active Job Discovery & Reload Persistence', () => {
    it('discovers running job from domain historical list upon page reload', () => {
      const domainJobs: UnderstandingJobDto[] = [
        { ...mockCompletedJob, id: 'job-099' },
        mockRunningJob,
      ];

      const active = findActiveJob(domainJobs);
      assert.ok(active, 'Must find active job');
      assert.equal(active?.id, 'job-101');
      assert.equal(active?.status, 'RUNNING');
    });

    it('handles zero active jobs gracefully', () => {
      const domainJobs: UnderstandingJobDto[] = [mockCompletedJob];
      const active = findActiveJob(domainJobs);
      assert.equal(active, null);
    });
  });

  describe('4. Polling Lifecycle & Bounded Observation', () => {
    it('enables polling strictly when job is PENDING or RUNNING', () => {
      assert.equal(shouldPollJob('PENDING'), true);
      assert.equal(shouldPollJob('RUNNING'), true);
      assert.equal(shouldPollJob('COMPLETED'), false);
      assert.equal(shouldPollJob('FAILED'), false);
      assert.equal(shouldPollJob(null), false);
      assert.equal(shouldPollJob(undefined), false);
    });
  });

  describe('5. Domain Context Switching & Cache Isolation', () => {
    it('isolates domainJobs and overview query keys per domain context', () => {
      const domA = 'dom-apple-prod';
      const domB = 'dom-google-prod';

      const jobsKeyA = queryKeys.understanding.domainJobs(domA);
      const jobsKeyB = queryKeys.understanding.domainJobs(domB);

      assert.notDeepEqual(jobsKeyA, jobsKeyB);
      assert.equal(jobsKeyA[2], domA);
      assert.equal(jobsKeyB[2], domB);
    });
  });

  describe('6. Certified P0 Invariants Audit', () => {
    it('verifies all 15 Certified P0 WX-906 Invariants exist in truth contract', () => {
      const certifiedP0Invariants = [
        'NO_FAKE_PROGRESS',
        'NO_FAKE_COMPLETION',
        'NO_STALE_JOB_STATE',
        'NO_DUPLICATE_ACTIVE_JOB',
        'NO_GLOBAL_JOB_STATE',
        'NO_DOMAIN_CONTEXT_LOSS',
        'NO_CLIENT_ONLY_JOB_AUTHORITY',
        'NO_PREMATURE_INTELLIGENCE_REFRESH',
        'NO_FALSE_SUCCESS',
        'NO_RUNAWAY_POLLING',
        'NO_STALE_DOMAIN_RECONCILIATION',
        'NO_JOB_STATE_FABRICATION',
        'NO_BACKEND_CONTRACT_DUPLICATION',
        'NO_INTELLIGENCE_REINTERPRETATION',
        'NO_ACCESSIBILITY_STATE_LOSS',
      ];

      for (const inv of certifiedP0Invariants) {
        assert.ok(
          inv in WORKSPACE_CERTIFIED_INVARIANTS,
          `Missing certified invariant: ${inv}`
        );
      }
    });

    it('verifies Understanding Job State & Convergence capability is registered in Truth Matrix', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Understanding Job State & Convergence'
      );
      assert.ok(cap, 'Understanding Job State & Convergence must exist in Truth Matrix');
      assert.equal(cap?.category, 'Current Intelligence');
      assert.equal(cap?.status, 'PRODUCTION_READY');
    });
  });
});
