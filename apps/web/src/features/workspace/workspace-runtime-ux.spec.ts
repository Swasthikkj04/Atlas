import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateDomainSwitchingStateIsolation,
  resolveAsyncResponseRelevance,
  RUNTIME_UX_HARD_INVARIANTS,
} from './contracts/runtime-ux.contract.ts';

describe('WX-808: Runtime UX & Production Browser Architecture Specifications', () => {
  describe('1. Domain Context Switching Runtime Isolation', () => {
    it('confirms complete state isolation when switching between domains', () => {
      const cleanSwitch = validateDomainSwitchingStateIsolation({
        previousDomainId: 'dom-stripe',
        newDomainId: 'dom-github',
        displayedIntelligenceDomainId: 'dom-github',
      });

      assert.equal(cleanSwitch.isIsolated, true);
      assert.equal(cleanSwitch.reason, undefined);
    });

    it('detects residual previous domain intelligence leakage during context switch (P0)', () => {
      const leakySwitch = validateDomainSwitchingStateIsolation({
        previousDomainId: 'dom-stripe',
        newDomainId: 'dom-github',
        displayedIntelligenceDomainId: 'dom-stripe', // Leakage!
      });

      assert.equal(leakySwitch.isIsolated, false);
      assert.equal(leakySwitch.reason, 'RESIDUAL_PREVIOUS_DOMAIN_INTELLIGENCE_LEAKAGE_DETECTED');
    });
  });

  describe('2. Race Condition Guard for Stale Async Responses', () => {
    it('applies async responses matching the currently active domain context', () => {
      const matchedResponse = resolveAsyncResponseRelevance({
        activeDomainId: 'dom-github',
        responseDomainId: 'dom-github',
      });

      assert.equal(matchedResponse.shouldApply, true);
      assert.equal(matchedResponse.reason, 'RESPONSE_MATCHES_ACTIVE_DOMAIN_CONTEXT');
    });

    it('safely discards late-arriving responses for previously selected domain (P0: NO_STALE_ASYNC_DOMAIN_RESPONSE)', () => {
      const staleResponse = resolveAsyncResponseRelevance({
        activeDomainId: 'dom-github',
        responseDomainId: 'dom-stripe',
      });

      assert.equal(staleResponse.shouldApply, false);
      assert.equal(staleResponse.reason, 'STALE_ASYNC_RESPONSE_DISCARDED_CONTEXT_MISMATCH');
    });
  });

  describe('3. P0 Runtime UX Hard Invariants Certification', () => {
    it('certifies all 10 canonical runtime UX hard invariants', () => {
      assert.equal(RUNTIME_UX_HARD_INVARIANTS.length, 10);
      assert.ok(RUNTIME_UX_HARD_INVARIANTS.includes('NO_RUNTIME_DOMAIN_CONTEXT_LEAKAGE'));
      assert.ok(RUNTIME_UX_HARD_INVARIANTS.includes('NO_BROKEN_DEEP_LINK_HYDRATION'));
      assert.ok(RUNTIME_UX_HARD_INVARIANTS.includes('NO_BROKEN_BROWSER_CONTINUITY'));
      assert.ok(RUNTIME_UX_HARD_INVARIANTS.includes('NO_PREMATURE_WORKSPACE_RESET'));
      assert.ok(RUNTIME_UX_HARD_INVARIANTS.includes('NO_STALE_ASYNC_DOMAIN_RESPONSE'));
      assert.ok(RUNTIME_UX_HARD_INVARIANTS.includes('NO_RUNTIME_STATE_SEMANTIC_COLLAPSE'));
      assert.ok(RUNTIME_UX_HARD_INVARIANTS.includes('NO_ACCESSIBILITY_INFORMATION_LOSS'));
      assert.ok(RUNTIME_UX_HARD_INVARIANTS.includes('NO_REDUCED_MOTION_REGRESSION'));
      assert.ok(RUNTIME_UX_HARD_INVARIANTS.includes('NO_PRODUCTION_ROUTE_FAILURE'));
      assert.ok(RUNTIME_UX_HARD_INVARIANTS.includes('NO_SENSITIVE_RUNTIME_DATA_EXPOSURE'));
    });
  });
});
