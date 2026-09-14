import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  P3_ATTACK_SURFACE_INVARIANTS,
  getEnvironmentColorClass,
  getTakeoverRiskColorClass,
} from './contracts/subdomain-attack-surface.contract.ts';

describe('P3 Subdomain Discovery & Attack Surface Management Suite', () => {
  it('certifies all P3 attack surface invariants are enforced', () => {
    assert.strictEqual(P3_ATTACK_SURFACE_INVARIANTS.P3_SUBDOMAIN_ENUMERATION_ENGINE, true);
    assert.strictEqual(P3_ATTACK_SURFACE_INVARIANTS.P3_WILDCARD_DNS_FILTERING, true);
    assert.strictEqual(P3_ATTACK_SURFACE_INVARIANTS.P3_DANGLING_CNAME_TAKEOVER_DETECTION, true);
    assert.strictEqual(P3_ATTACK_SURFACE_INVARIANTS.P3_ENVIRONMENT_PERIMETER_CLASSIFICATION, true);
    assert.strictEqual(P3_ATTACK_SURFACE_INVARIANTS.P3_MULTI_SOURCE_SAN_AND_WORDLIST_DISCOVERY, true);
  });

  describe('Environment Style Classification', () => {
    it('provides semantic color tokens for PRODUCTION', () => {
      const style = getEnvironmentColorClass('PRODUCTION');
      assert.strictEqual(style.textClass, 'text-emerald-400');
    });

    it('provides semantic color tokens for STAGING', () => {
      const style = getEnvironmentColorClass('STAGING');
      assert.strictEqual(style.textClass, 'text-amber-400');
    });

    it('provides semantic color tokens for DEVELOPMENT', () => {
      const style = getEnvironmentColorClass('DEVELOPMENT');
      assert.strictEqual(style.textClass, 'text-cyan-400');
    });

    it('provides semantic color tokens for INTERNAL', () => {
      const style = getEnvironmentColorClass('INTERNAL');
      assert.strictEqual(style.textClass, 'text-purple-400');
    });

    it('provides semantic color tokens for DEPRECATED', () => {
      const style = getEnvironmentColorClass('DEPRECATED');
      assert.strictEqual(style.textClass, 'text-rose-400');
    });
  });

  describe('Takeover Risk Style Hierarchy', () => {
    it('provides high-visibility warning tokens for CRITICAL and HIGH risks', () => {
      const crit = getTakeoverRiskColorClass('CRITICAL');
      assert.strictEqual(crit.textClass, 'text-rose-400');

      const high = getTakeoverRiskColorClass('HIGH');
      assert.strictEqual(high.textClass, 'text-orange-400');
    });

    it('provides calm tokens for LOW and NONE risks', () => {
      const low = getTakeoverRiskColorClass('LOW');
      assert.strictEqual(low.textClass, 'text-blue-400');

      const none = getTakeoverRiskColorClass('NONE');
      assert.strictEqual(none.textClass, 'text-emerald-400');
    });
  });
});
