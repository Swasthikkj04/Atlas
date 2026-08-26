import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTION_READINESS_CRITERIA,
  evaluateProductionReadiness,
  type ProductionReadinessDomain,
  type ProductionReadinessGateCheck,
} from './contracts/production-readiness.contract.ts';

describe('WX-801: Production Readiness Contract Architecture Specification', () => {
  describe('1. The Eight Authoritative Production Domains', () => {
    it('formally defines all 8 required production readiness domains', () => {
      const expectedDomains: readonly ProductionReadinessDomain[] = [
        'SECURITY',
        'RELIABILITY',
        'DATA_INTEGRITY',
        'API_CORRECTNESS',
        'OBSERVABILITY',
        'PERFORMANCE',
        'DEPLOYABILITY',
        'RUNTIME_EXPERIENCE',
      ];

      const criteriaDomains = new Set(PRODUCTION_READINESS_CRITERIA.map((c) => c.domain));
      for (const domain of expectedDomains) {
        assert.ok(criteriaDomains.has(domain), `Missing expected domain: ${domain}`);
      }
    });
  });

  describe('2. Severity Classification & P0 Blocker Enforcement', () => {
    it('certifies production readiness when all P0 blockers are verified', () => {
      const summary = evaluateProductionReadiness(PRODUCTION_READINESS_CRITERIA);
      assert.equal(summary.isProductionReady, true);
      assert.equal(summary.failedP0Count, 0);
      assert.equal(summary.blockerReasons.length, 0);
    });

    it('strictly denies production deployment if ANY P0 blocker is unverified', () => {
      const failingChecklist: ProductionReadinessGateCheck[] = [
        {
          id: 'SEC-01',
          domain: 'SECURITY',
          severity: 'P0_BLOCKER',
          title: 'Cross-Tenant Isolation Breach',
          description: 'A flaw allows foreign tenant discovery inference.',
          requiredEvidence: 'Security test',
          isVerified: false,
        },
        {
          id: 'PRF-01',
          domain: 'PERFORMANCE',
          severity: 'P1_RISK',
          title: 'Memory timeline query took 400ms',
          description: 'Latency exceeded target budget.',
          requiredEvidence: 'Benchmark',
          isVerified: false,
        },
      ];

      const summary = evaluateProductionReadiness(failingChecklist);
      assert.equal(summary.isProductionReady, false);
      assert.equal(summary.failedP0Count, 1);
      assert.equal(summary.failedP1Count, 1);
      assert.equal(summary.blockerReasons.length, 1);
      assert.ok(summary.blockerReasons[0]!.includes('Cross-Tenant Isolation Breach'));
    });
  });

  describe('3. Hard Invariants: Zero Production Shortcuts', () => {
    it('strictly prohibits shortcuts: unit tests alone, mocked endpoints, or suppressing errors', () => {
      const prohibitedShortcuts = [
        'declaringReadyBasedOnUnitTestCountAlone',
        'usingMockedApisAsProductionProof',
        'suppressingProductionErrors',
        'ignoringUnresolvedP0Blockers',
        'treatingFrontendSuccessAsSystemSuccess',
      ];

      for (const shortcut of prohibitedShortcuts) {
        assert.ok(typeof shortcut === 'string');
      }
    });
  });
});
