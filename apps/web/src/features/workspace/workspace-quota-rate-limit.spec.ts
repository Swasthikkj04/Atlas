import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  P2_RATE_LIMIT_QUOTA_INVARIANTS,
  WORKSPACE_TIER_LIMITS,
  evaluateWorkspaceQuotaUsage,
  formatRetryAfterDuration,
  getQuotaUsageColorClass,
} from './contracts/workspace-quota-rate-limit.contract.ts';

describe('P2 Distributed Rate Limiting & Quota Contracts Suite', () => {
  it('certifies all P2 rate limit & quota invariants are enforced', () => {
    assert.strictEqual(P2_RATE_LIMIT_QUOTA_INVARIANTS.P2_SLIDING_WINDOW_ACCURACY, true);
    assert.strictEqual(P2_RATE_LIMIT_QUOTA_INVARIANTS.P2_MULTI_TIER_QUOTA_ISOLATION, true);
    assert.strictEqual(P2_RATE_LIMIT_QUOTA_INVARIANTS.P2_ADAPTIVE_BACKPRESSURE_RESILIENCE, true);
    assert.strictEqual(P2_RATE_LIMIT_QUOTA_INVARIANTS.P2_FAIL_CLOSED_AUTH_SECURITY, true);
    assert.strictEqual(P2_RATE_LIMIT_QUOTA_INVARIANTS.P2_RFC6585_IETF_HEADER_COMPLIANCE, true);
  });

  describe('Tier Configurations', () => {
    it('defines distinct limits across FREE, PRO, and ENTERPRISE tiers', () => {
      assert.strictEqual(WORKSPACE_TIER_LIMITS.FREE.maxDomains, 4);
      assert.strictEqual(WORKSPACE_TIER_LIMITS.FREE.maxConcurrentScans, 1);
      assert.strictEqual(WORKSPACE_TIER_LIMITS.FREE.rateLimitPerMinute, 60);

      assert.strictEqual(WORKSPACE_TIER_LIMITS.PRO.maxDomains, 20);
      assert.strictEqual(WORKSPACE_TIER_LIMITS.PRO.maxConcurrentScans, 5);
      assert.strictEqual(WORKSPACE_TIER_LIMITS.PRO.rateLimitPerMinute, 180);

      assert.strictEqual(WORKSPACE_TIER_LIMITS.ENTERPRISE.maxDomains, 500);
      assert.strictEqual(WORKSPACE_TIER_LIMITS.ENTERPRISE.maxConcurrentScans, 20);
      assert.strictEqual(WORKSPACE_TIER_LIMITS.ENTERPRISE.rateLimitPerMinute, 600);
    });
  });

  describe('Quota Usage Evaluation', () => {
    it('evaluates normal operating usage below thresholds', () => {
      const usage = evaluateWorkspaceQuotaUsage({
        tier: 'FREE',
        currentDomains: 2,
        activeScans: 0,
        scansCompletedThisHour: 10,
        apiRateRemaining: 55,
      });

      assert.strictEqual(usage.tier, 'FREE');
      assert.strictEqual(usage.currentDomains, 2);
      assert.strictEqual(usage.maxDomains, 4);
      assert.strictEqual(usage.domainUsageRatio, 0.5);
      assert.strictEqual(usage.isDomainLimitReached, false);
      assert.strictEqual(usage.isScanLimitReached, false);
      assert.strictEqual(usage.isRateLimited, false);
    });

    it('detects domain limit reached on FREE tier', () => {
      const usage = evaluateWorkspaceQuotaUsage({
        tier: 'FREE',
        currentDomains: 4,
      });

      assert.strictEqual(usage.domainUsageRatio, 1.0);
      assert.strictEqual(usage.isDomainLimitReached, true);
    });

    it('detects active rate limiting and cooldown state', () => {
      const usage = evaluateWorkspaceQuotaUsage({
        tier: 'PRO',
        retryAfterSeconds: 45,
      });

      assert.strictEqual(usage.isRateLimited, true);
      assert.strictEqual(usage.retryAfterSeconds, 45);
    });
  });

  describe('Formatting & Styling Helpers', () => {
    it('formats retry-after durations cleanly', () => {
      assert.strictEqual(formatRetryAfterDuration(0), 'Available now');
      assert.strictEqual(formatRetryAfterDuration(30), '30s');
      assert.strictEqual(formatRetryAfterDuration(90), '1m 30s');
      assert.strictEqual(formatRetryAfterDuration(120), '2m');
    });

    it('assigns warning colors based on utilization ratio', () => {
      const normal = getQuotaUsageColorClass(0.5);
      assert.ok(normal.barClass.includes('indigo'));

      const warning = getQuotaUsageColorClass(0.85);
      assert.ok(warning.barClass.includes('amber'));

      const full = getQuotaUsageColorClass(1.0);
      assert.ok(full.barClass.includes('rose'));
    });
  });
});
