import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PERFORMANCE_LATENCY_BUDGETS,
  validateLatencyBudget,
  validatePaginationBounds,
  PERFORMANCE_HARD_INVARIANTS,
} from './contracts/performance.contract.ts';

describe('WX-806: Performance & Load Readiness Architecture Specifications', () => {
  describe('1. Application Latency Budgets & SLA Enforcement', () => {
    it('defines authoritative latency budgets for all critical Workspace operations', () => {
      assert.equal(PERFORMANCE_LATENCY_BUDGETS.length, 9);

      const wsOverviewBudget = PERFORMANCE_LATENCY_BUDGETS.find((b) => b.operation === 'WORKSPACE_OVERVIEW');
      assert.equal(wsOverviewBudget?.budgetMs, 750);

      const snapshotListBudget = PERFORMANCE_LATENCY_BUDGETS.find((b) => b.operation === 'SNAPSHOT_LIST');
      assert.equal(snapshotListBudget?.budgetMs, 500);

      const understandingSubBudget = PERFORMANCE_LATENCY_BUDGETS.find((b) => b.operation === 'UNDERSTANDING_SUBMISSION');
      assert.equal(understandingSubBudget?.budgetMs, 500);
    });

    it('validates latency measurements against SLA budgets accurately', () => {
      const fastOverview = validateLatencyBudget('WORKSPACE_OVERVIEW', 420);
      assert.equal(fastOverview.isWithinBudget, true);
      assert.equal(fastOverview.overageMs, undefined);

      const slowOverview = validateLatencyBudget('WORKSPACE_OVERVIEW', 980);
      assert.equal(slowOverview.isWithinBudget, false);
      assert.equal(slowOverview.overageMs, 230);
    });
  });

  describe('2. Bounded Historical Pagination & Query Safety', () => {
    it('enforces upper bound caps on collection queries preventing full-table memory exhaustion', () => {
      const normalRequest = validatePaginationBounds({ requestedLimit: 20 });
      assert.equal(normalRequest.effectiveLimit, 20);
      assert.equal(normalRequest.isBounded, true);

      const excessiveRequest = validatePaginationBounds({ requestedLimit: 1000, maxAllowedLimit: 100 });
      assert.equal(excessiveRequest.effectiveLimit, 100);
      assert.equal(excessiveRequest.isBounded, true);

      const invalidNegativeRequest = validatePaginationBounds({ requestedLimit: -10, defaultLimit: 25 });
      assert.equal(invalidNegativeRequest.effectiveLimit, 25);
    });
  });

  describe('3. P0 Performance Hard Invariants Certification', () => {
    it('certifies all 10 canonical performance hard invariants', () => {
      assert.equal(PERFORMANCE_HARD_INVARIANTS.length, 10);
      assert.ok(PERFORMANCE_HARD_INVARIANTS.includes('NO_UNBOUNDED_HISTORICAL_QUERY'));
      assert.ok(PERFORMANCE_HARD_INVARIANTS.includes('NO_UNBOUNDED_API_PAYLOAD'));
      assert.ok(PERFORMANCE_HARD_INVARIANTS.includes('NO_N_PLUS_ONE_CRITICAL_QUERY'));
      assert.ok(PERFORMANCE_HARD_INVARIANTS.includes('NO_DATABASE_POOL_EXHAUSTION_UNDER_TARGET_LOAD'));
      assert.ok(PERFORMANCE_HARD_INVARIANTS.includes('NO_DUPLICATE_CRITICAL_REQUESTS'));
      assert.ok(PERFORMANCE_HARD_INVARIANTS.includes('NO_SYNCHRONOUS_LONG_RUNNING_DISCOVERY'));
      assert.ok(PERFORMANCE_HARD_INVARIANTS.includes('NO_WORKER_STARVATION'));
      assert.ok(PERFORMANCE_HARD_INVARIANTS.includes('NO_HISTORICAL_DATA_LOSS_FOR_PERFORMANCE'));
      assert.ok(PERFORMANCE_HARD_INVARIANTS.includes('NO_CROSS_TENANT_CACHE_POLLUTION'));
      assert.ok(PERFORMANCE_HARD_INVARIANTS.includes('NO_CRITICAL_LATENCY_BUDGET_REGRESSION'));
    });
  });
});
