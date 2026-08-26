import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FINAL_RELEASE_GATES,
  evaluateFinalReleaseGate,
  FINAL_PRODUCTION_HARD_INVARIANTS,
  type ProductionGateId,
} from './contracts/final-production-gate.contract.ts';

describe('WX-809: Final Production Verification & Release Gate Architecture Specifications', () => {
  describe('1. Thirteen Canonical Release Gates Inventory', () => {
    it('defines all 13 mandatory P0 production certification gates', () => {
      assert.equal(FINAL_RELEASE_GATES.length, 13);

      const requiredGateIds: ProductionGateId[] = [
        'SECURITY_HARDENING',
        'API_CORRECTNESS',
        'DATA_INTEGRITY',
        'OBSERVABILITY_TELEMETRY',
        'PERFORMANCE_BUDGETS',
        'RELIABILITY_FAULT_TOLERANCE',
        'DEPLOYABILITY_STARTUP_SAFETY',
        'RUNTIME_UX_CONTINUITY',
        'TENANT_ISOLATION',
        'HISTORICAL_TRUTH_PRESERVATION',
        'FAILURE_RECOVERY',
        'PRODUCTION_SMOKE_TEST',
        'ROLLBACK_SAFETY',
      ];

      for (const expectedId of requiredGateIds) {
        const match = FINAL_RELEASE_GATES.find((g) => g.id === expectedId);
        assert.ok(match, `Missing canonical release gate: ${expectedId}`);
        assert.equal(match.severity, 'P0_RELEASE_BLOCKER');
      }
    });
  });

  describe('2. Final Release Decision Engine', () => {
    it('approves production release when all 13 P0 gates are certified', () => {
      const allPassingChecklist: Record<ProductionGateId, boolean> = {
        SECURITY_HARDENING: true,
        API_CORRECTNESS: true,
        DATA_INTEGRITY: true,
        OBSERVABILITY_TELEMETRY: true,
        PERFORMANCE_BUDGETS: true,
        RELIABILITY_FAULT_TOLERANCE: true,
        DEPLOYABILITY_STARTUP_SAFETY: true,
        RUNTIME_UX_CONTINUITY: true,
        TENANT_ISOLATION: true,
        HISTORICAL_TRUTH_PRESERVATION: true,
        FAILURE_RECOVERY: true,
        PRODUCTION_SMOKE_TEST: true,
        ROLLBACK_SAFETY: true,
      };

      const result = evaluateFinalReleaseGate(allPassingChecklist);
      assert.equal(result.isApprovedForRelease, true);
      assert.equal(result.totalGates, 13);
      assert.equal(result.passedGates, 13);
      assert.equal(result.blockedGates.length, 0);
      assert.equal(result.decisionBanner, 'NEBULA PRODUCTION CERTIFIED — RELEASE APPROVED');
    });

    it('strictly blocks release if even a single P0 gate fails (P0: NO_UNRESOLVED_P0_RELEASE_DEFECTS)', () => {
      const failingChecklist: Record<ProductionGateId, boolean> = {
        SECURITY_HARDENING: true,
        API_CORRECTNESS: true,
        DATA_INTEGRITY: true,
        OBSERVABILITY_TELEMETRY: true,
        PERFORMANCE_BUDGETS: true,
        RELIABILITY_FAULT_TOLERANCE: true,
        DEPLOYABILITY_STARTUP_SAFETY: true,
        RUNTIME_UX_CONTINUITY: true,
        TENANT_ISOLATION: false, // P0 Blocker!
        HISTORICAL_TRUTH_PRESERVATION: true,
        FAILURE_RECOVERY: true,
        PRODUCTION_SMOKE_TEST: true,
        ROLLBACK_SAFETY: true,
      };

      const result = evaluateFinalReleaseGate(failingChecklist);
      assert.equal(result.isApprovedForRelease, false);
      assert.equal(result.passedGates, 12);
      assert.ok(result.blockedGates.includes('TENANT_ISOLATION'));
      assert.equal(result.decisionBanner, 'RELEASE BLOCKED — UNRESOLVED P0 PRODUCTION GATES');
    });
  });

  describe('3. P0 Final Release Hard Invariants Certification', () => {
    it('certifies all 10 canonical release hard invariants', () => {
      assert.equal(FINAL_PRODUCTION_HARD_INVARIANTS.length, 10);
      assert.ok(FINAL_PRODUCTION_HARD_INVARIANTS.includes('NO_UNRESOLVED_P0_RELEASE_DEFECTS'));
      assert.ok(FINAL_PRODUCTION_HARD_INVARIANTS.includes('NO_UNVERIFIED_BUILD_DEPLOYMENT'));
      assert.ok(FINAL_PRODUCTION_HARD_INVARIANTS.includes('NO_MOCK_ONLY_RELEASE_CERTIFICATION'));
      assert.ok(FINAL_PRODUCTION_HARD_INVARIANTS.includes('NO_CROSS_TENANT_DATA_EXPOSURE'));
      assert.ok(FINAL_PRODUCTION_HARD_INVARIANTS.includes('NO_HISTORICAL_TRUTH_MUTATION'));
      assert.ok(FINAL_PRODUCTION_HARD_INVARIANTS.includes('NO_SILENT_OPERATIONAL_FAILURE'));
      assert.ok(FINAL_PRODUCTION_HARD_INVARIANTS.includes('NO_UNBOUNDED_LATENCY_REGRESSION'));
      assert.ok(FINAL_PRODUCTION_HARD_INVARIANTS.includes('NO_UNSAFE_STARTUP_ENVIRONMENT'));
      assert.ok(FINAL_PRODUCTION_HARD_INVARIANTS.includes('NO_FALSE_READINESS_REPORTING'));
      assert.ok(FINAL_PRODUCTION_HARD_INVARIANTS.includes('NO_BROKEN_USER_JOURNEY_CONTINUITY'));
    });
  });
});
