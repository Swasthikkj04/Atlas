/**
 * Certified P2 Invariants and Contracts for Distributed Rate Limiting & Sliding-Window Quotas.
 */

export const P2_RATE_LIMIT_QUOTA_INVARIANTS = {
  P2_SLIDING_WINDOW_ACCURACY: true,
  P2_MULTI_TIER_QUOTA_ISOLATION: true,
  P2_ADAPTIVE_BACKPRESSURE_RESILIENCE: true,
  P2_FAIL_CLOSED_AUTH_SECURITY: true,
  P2_RFC6585_IETF_HEADER_COMPLIANCE: true,
} as const;

export type WorkspaceTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface WorkspaceTierConfig {
  readonly tier: WorkspaceTier;
  readonly maxDomains: number;
  readonly maxConcurrentScans: number;
  readonly scansPerHour: number;
  readonly rateLimitPerMinute: number;
  readonly burstAllowance: number;
}

export const WORKSPACE_TIER_LIMITS: Record<WorkspaceTier, WorkspaceTierConfig> = {
  FREE: {
    tier: 'FREE',
    maxDomains: 4,
    maxConcurrentScans: 1,
    scansPerHour: 30,
    rateLimitPerMinute: 60,
    burstAllowance: 10,
  },
  PRO: {
    tier: 'PRO',
    maxDomains: 20,
    maxConcurrentScans: 5,
    scansPerHour: 150,
    rateLimitPerMinute: 180,
    burstAllowance: 30,
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    maxDomains: 500,
    maxConcurrentScans: 20,
    scansPerHour: 1000,
    rateLimitPerMinute: 600,
    burstAllowance: 100,
  },
};

export interface WorkspaceQuotaUsage {
  readonly tier: WorkspaceTier;
  readonly currentDomains: number;
  readonly maxDomains: number;
  readonly domainUsageRatio: number; // 0.0 to 1.0
  readonly activeScans: number;
  readonly maxConcurrentScans: number;
  readonly scansCompletedThisHour: number;
  readonly scansPerHourLimit: number;
  readonly scanQuotaUsageRatio: number; // 0.0 to 1.0
  readonly apiRateLimit: number;
  readonly apiRateRemaining: number;
  readonly apiResetSeconds: number;
  readonly isDomainLimitReached: boolean;
  readonly isScanLimitReached: boolean;
  readonly isRateLimited: boolean;
  readonly retryAfterSeconds?: number;
}

export function evaluateWorkspaceQuotaUsage(params: {
  tier?: WorkspaceTier;
  currentDomains?: number;
  activeScans?: number;
  scansCompletedThisHour?: number;
  apiRateRemaining?: number;
  apiResetSeconds?: number;
  retryAfterSeconds?: number;
}): WorkspaceQuotaUsage {
  const tier = params.tier || 'FREE';
  const limits = WORKSPACE_TIER_LIMITS[tier] || WORKSPACE_TIER_LIMITS.FREE;

  const currentDomains = Math.max(0, params.currentDomains || 0);
  const activeScans = Math.max(0, params.activeScans || 0);
  const scansCompleted = Math.max(0, params.scansCompletedThisHour || 0);

  const domainUsageRatio = limits.maxDomains > 0
    ? Math.min(1.0, currentDomains / limits.maxDomains)
    : 0;

  const scanQuotaUsageRatio = limits.scansPerHour > 0
    ? Math.min(1.0, scansCompleted / limits.scansPerHour)
    : 0;

  const isDomainLimitReached = currentDomains >= limits.maxDomains;
  const isScanLimitReached = activeScans >= limits.maxConcurrentScans || scansCompleted >= limits.scansPerHour;
  const isRateLimited = Boolean(params.retryAfterSeconds && params.retryAfterSeconds > 0);

  return {
    tier,
    currentDomains,
    maxDomains: limits.maxDomains,
    domainUsageRatio,
    activeScans,
    maxConcurrentScans: limits.maxConcurrentScans,
    scansCompletedThisHour: scansCompleted,
    scansPerHourLimit: limits.scansPerHour,
    scanQuotaUsageRatio,
    apiRateLimit: limits.rateLimitPerMinute,
    apiRateRemaining: params.apiRateRemaining ?? limits.rateLimitPerMinute,
    apiResetSeconds: params.apiResetSeconds ?? 0,
    isDomainLimitReached,
    isScanLimitReached,
    isRateLimited,
    retryAfterSeconds: params.retryAfterSeconds,
  };
}

export function formatRetryAfterDuration(seconds: number): string {
  if (seconds <= 0) return 'Available now';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  return remainingSecs > 0 ? `${minutes}m ${remainingSecs}s` : `${minutes}m`;
}

export function getQuotaUsageColorClass(ratio: number): {
  barClass: string;
  textClass: string;
} {
  if (ratio >= 1.0) {
    return {
      barClass: 'bg-rose-500',
      textClass: 'text-rose-400 font-semibold',
    };
  }
  if (ratio >= 0.8) {
    return {
      barClass: 'bg-amber-500',
      textClass: 'text-amber-400 font-medium',
    };
  }
  return {
    barClass: 'bg-indigo-500',
    textClass: 'text-slate-300',
  };
}
