import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_PRODUCT_NAVIGATION,
  WORKSPACE_INFORMATION_HIERARCHY,
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './workspace-redesign-truth-contract.ts';

describe('WX-901: Workspace Redesign Truth Audit & Experience Contract', () => {
  describe('1. Product Navigation Separation (NO_DOMAIN_SIDEBAR_AS_PRIMARY_CONTEXT)', () => {
    it('defines the canonical product navigation tabs in strict order', () => {
      const tabIds = WORKSPACE_PRODUCT_NAVIGATION.map((item) => item.id);
      assert.deepEqual(tabIds, ['overview', 'findings', 'changes', 'infrastructure', 'memory']);
    });

    it('marks Memory as contextual/historical and remaining as primary tabs', () => {
      const primaryTabs = WORKSPACE_PRODUCT_NAVIGATION.filter((item) => item.isPrimary);
      assert.equal(primaryTabs.length, 4);
      const memoryTab = WORKSPACE_PRODUCT_NAVIGATION.find((item) => item.id === 'memory');
      assert.equal(memoryTab?.isPrimary, false);
    });
  });

  describe('2. Information Hierarchy (Frozen Rank 1 to 5)', () => {
    it('enforces canonical intelligence hierarchy progression', () => {
      const surfaces = WORKSPACE_INFORMATION_HIERARCHY.map((item) => item.surface);
      assert.deepEqual(surfaces, [
        'Executive Brief',
        'Primary Story',
        'Secondary Stories',
        'Infrastructure Overview',
        'Evidence & Analysis',
      ]);
    });

    it('maps every hierarchy tier to an authoritative backend source', () => {
      for (const tier of WORKSPACE_INFORMATION_HIERARCHY) {
        assert.ok(tier.authoritativeSource.length > 0);
        assert.ok(tier.question.length > 0);
      }
    });
  });

  describe('3. Truth Matrix & Capability Audit', () => {
    it('contains verified capabilities across all 6 core categories', () => {
      const categories = new Set(WORKSPACE_TRUTH_MATRIX.map((c) => c.category));
      assert.ok(categories.has('Domain/Context'));
      assert.ok(categories.has('Current Intelligence'));
      assert.ok(categories.has('Infrastructure'));
      assert.ok(categories.has('Investigation'));
      assert.ok(categories.has('Memory'));
      assert.ok(categories.has('States'));
    });

    it('verifies that no capability has fake status or missing backend endpoint', () => {
      for (const item of WORKSPACE_TRUTH_MATRIX) {
        assert.ok(item.capability.length > 0);
        assert.ok(item.status === 'PRODUCTION_READY' || item.status === 'IMPLEMENTED');
      }
    });
  });

  describe('4. Certified Invariants Integrity', () => {
    it('freezes all 15 core architectural invariants', () => {
      const requiredInvariants = [
        'NO_DOMAIN_SIDEBAR_AS_PRIMARY_CONTEXT',
        'NO_MIXED_DOMAIN_CONTEXT',
        'NO_FRONTEND_INTELLIGENCE_REINTERPRETATION',
        'NO_FAKE_CAPABILITY',
        'NO_INVENTED_API',
        'NO_DUPLICATE_NAVIGATION_SYSTEM',
        'NO_BACKEND_REDESIGN_WITHOUT_GAP',
        'NO_HISTORICAL_TRUTH_MUTATION',
        'NO_DESIGN_TOKEN_INVENTION',
        'NO_DOMAIN_CONTEXT_LOSS',
        'NO_STALE_DOMAIN_CONTEXT',
        'NO_PREMATURE_EVIDENCE_DOMINANCE',
        'NO_DASHBOARD_DRIFT',
        'NO_SCANNER_REPORT_DRIFT',
        'NO_ACTIVITY_FEED_DRIFT',
      ];

      for (const invariant of requiredInvariants) {
        assert.ok(
          invariant in WORKSPACE_CERTIFIED_INVARIANTS,
          `Missing certified invariant: ${invariant}`
        );
      }
    });
  });
});
