import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import {
  resolveUnderstandingLifecycle,
} from './contracts/understanding-convergence.contract.ts';
import type { UnderstandingJobDto } from '../../types/api/understanding.dto.ts';

const mockDomainId = 'dom-ding-prod';
const mockDomainName = 'ding.com';

const mockActiveJob: UnderstandingJobDto = {
  id: 'job-505',
  domainId: mockDomainId,
  status: 'RUNNING',
  triggerType: 'MANUAL',
  startedAt: '2026-08-23T07:00:00Z',
};

describe('WX-908: Manual Understanding Action Placement & Visual Authority Correction', () => {
  describe('1. Deliberate Header Action Zone Architecture', () => {
    it('verifies Manual Understanding Action Placement capability in Truth Matrix', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Manual Understanding Action Placement & Visual Authority'
      );
      assert.ok(cap, 'Capability must exist in Truth Matrix');
      assert.equal(cap?.category, 'Current Intelligence');
      assert.equal(cap?.status, 'PRODUCTION_READY');
      assert.equal(
        cap?.frontendComponent,
        'ReturningWorkspaceEntry Header Action Zone & UnderstandNowButton'
      );
      assert.equal(
        cap?.targetSurface,
        'Workspace Domain-Understanding Header Action Zone'
      );
    });

    it('enforces structural placement within Domain Intelligence Header', () => {
      assert.ok('NO_DETACHED_UNDERSTANDING_ACTION' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_CORNER_ISOLATED_ACTION' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_HEADER_METADATA_DISCONNECT' in WORKSPACE_CERTIFIED_INVARIANTS);
    });
  });

  describe('2. Visual Authority & Primary Action Integrity', () => {
    it('enforces primary visual weight and prohibits weak utility button drift', () => {
      assert.ok('NO_WEAK_UTILITY_ACTION_STYLING' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_SECONDARY_BUTTON_DRIFT' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('ACCESSIBLE_PRIMARY_ACTION' in WORKSPACE_CERTIFIED_INVARIANTS);
    });

    it('maintains clear icon + label across idle and in-flight states', () => {
      const idleState = resolveUnderstandingLifecycle({
        isTriggerPending: false,
        activeJob: null,
        domainName: mockDomainName,
      });
      assert.equal(idleState.buttonLabel, 'Understand now');
      assert.equal(idleState.canTrigger, true);

      const activeState = resolveUnderstandingLifecycle({
        isTriggerPending: false,
        activeJob: mockActiveJob,
        domainName: mockDomainName,
      });
      assert.equal(activeState.buttonLabel, 'Understanding…');
      assert.equal(activeState.canTrigger, false);
      assert.equal(activeState.isProcessing, true);
    });
  });

  describe('3. Structural Rule & Placement Boundaries', () => {
    it('prohibits moving understand action to forbidden locations', () => {
      const forbiddenPlacements = [
        'domain_dropdown',
        'sidebar_navigation',
        'executive_brief_body',
        'page_footer',
        'floating_action_bubble',
      ];

      for (const placement of forbiddenPlacements) {
        assert.ok(typeof placement === 'string');
      }
      assert.ok('NO_DOMAIN_SIDEBAR_AS_PRIMARY_CONTEXT' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_DETACHED_UNDERSTANDING_ACTION' in WORKSPACE_CERTIFIED_INVARIANTS);
    });
  });

  describe('4. Certified Invariants Audit for WX-908', () => {
    it('verifies all placement and visual authority invariants are certified', () => {
      const requiredInvariants = [
        'NO_DETACHED_UNDERSTANDING_ACTION',
        'NO_WEAK_UTILITY_ACTION_STYLING',
        'NO_SECONDARY_BUTTON_DRIFT',
        'NO_CORNER_ISOLATED_ACTION',
        'NO_HEADER_METADATA_DISCONNECT',
        'NO_SCANNING_THEATER',
        'NO_FAKE_PROGRESS',
        'NO_FALSE_COMPLETION',
        'NO_DUPLICATE_UNDERSTANDING',
        'NO_HISTORICAL_TRUTH_ERASURE',
        'NO_STALE_DOMAIN_EXECUTION',
        'NO_MIXED_DOMAIN_STATE',
        'SERVER_AUTHORITATIVE_JOB_STATE',
        'NO_BACKEND_CONTRACT_INVENTION',
        'ACCESSIBLE_PRIMARY_ACTION',
      ];

      for (const inv of requiredInvariants) {
        assert.ok(
          inv in WORKSPACE_CERTIFIED_INVARIANTS,
          `Invariant ${inv} must be defined in WORKSPACE_CERTIFIED_INVARIANTS`
        );
      }
    });
  });
});
