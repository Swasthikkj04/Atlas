/**
 * S-07 Concurrency Limiter
 *
 * Implements S07-I04, S07-I05:
 * - Strict limits on simultaneous expensive operations (Understanding jobs, deep probes)
 * - Per-principal concurrency quotas (Guest: 1, User: 2, Admin: 5)
 * - Global active job ceiling to prevent worker pool starvation
 * - Automatic lease expiry to prevent zombie lock starvation
 */

import { SecurityPrincipalType } from './rate-limit.policy';

export interface ConcurrencyLimitConfig {
  maxConcurrentPerPrincipal: number;
  maxGlobalConcurrent: number;
  leaseTtlMs: number;
}

export const PRINCIPAL_CONCURRENCY_LIMITS: Record<
  SecurityPrincipalType,
  number
> = {
  ANONYMOUS: 0,
  GUEST: 1,
  USER: 2,
  ADMIN: 5,
};

export const GLOBAL_MAX_CONCURRENT_JOBS = 50;
export const DEFAULT_LEASE_TTL_MS = 120_000; // 2 minutes maximum lease time

interface ActiveLease {
  leaseId: string;
  principalKey: string;
  principalType: SecurityPrincipalType;
  acquiredAt: number;
  expiresAt: number;
}

export class ConcurrencyLimiter {
  private static activeLeases = new Map<string, ActiveLease>();
  private static principalLeaseCount = new Map<string, number>();

  /**
   * Attempts to acquire an execution slot for an expensive job.
   */
  static acquire(
    principalKey: string,
    principalType: SecurityPrincipalType,
    customMaxPerPrincipal?: number,
    leaseTtlMs = DEFAULT_LEASE_TTL_MS,
  ): {
    acquired: boolean;
    leaseId?: string;
    decision:
      | 'ACQUIRED'
      | 'CONCURRENCY_EXCEEDED'
      | 'GLOBAL_CAPACITY_EXCEEDED'
      | 'ANONYMOUS_PROHIBITED';
    activeCount: number;
    globalCount: number;
  } {
    this.cleanExpiredLeases();

    if (principalType === 'ANONYMOUS') {
      return {
        acquired: false,
        decision: 'ANONYMOUS_PROHIBITED',
        activeCount: 0,
        globalCount: this.activeLeases.size,
      };
    }

    const currentGlobal = this.activeLeases.size;
    if (currentGlobal >= GLOBAL_MAX_CONCURRENT_JOBS) {
      return {
        acquired: false,
        decision: 'GLOBAL_CAPACITY_EXCEEDED',
        activeCount: this.principalLeaseCount.get(principalKey) || 0,
        globalCount: currentGlobal,
      };
    }

    const maxAllowed =
      customMaxPerPrincipal ?? PRINCIPAL_CONCURRENCY_LIMITS[principalType];
    const currentPrincipalCount =
      this.principalLeaseCount.get(principalKey) || 0;

    if (currentPrincipalCount >= maxAllowed) {
      return {
        acquired: false,
        decision: 'CONCURRENCY_EXCEEDED',
        activeCount: currentPrincipalCount,
        globalCount: currentGlobal,
      };
    }

    const now = Date.now();
    const leaseId = `lease_${principalKey}_${now}_${Math.random().toString(36).substring(2, 9)}`;

    const lease: ActiveLease = {
      leaseId,
      principalKey,
      principalType,
      acquiredAt: now,
      expiresAt: now + leaseTtlMs,
    };

    this.activeLeases.set(leaseId, lease);
    this.principalLeaseCount.set(principalKey, currentPrincipalCount + 1);

    return {
      acquired: true,
      leaseId,
      decision: 'ACQUIRED',
      activeCount: currentPrincipalCount + 1,
      globalCount: this.activeLeases.size,
    };
  }

  /**
   * Releases an acquired execution slot.
   */
  static release(leaseId: string): boolean {
    const lease = this.activeLeases.get(leaseId);
    if (!lease) return false;

    this.activeLeases.delete(leaseId);
    const count = this.principalLeaseCount.get(lease.principalKey) || 1;
    if (count <= 1) {
      this.principalLeaseCount.delete(lease.principalKey);
    } else {
      this.principalLeaseCount.set(lease.principalKey, count - 1);
    }

    return true;
  }

  /**
   * Cleans expired leases to prevent deadlocks.
   */
  static cleanExpiredLeases(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [leaseId, lease] of this.activeLeases.entries()) {
      if (now > lease.expiresAt) {
        this.release(leaseId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Gets current concurrency state for telemetry/testing.
   */
  static getStats(principalKey?: string) {
    this.cleanExpiredLeases();
    return {
      globalActive: this.activeLeases.size,
      principalActive: principalKey
        ? this.principalLeaseCount.get(principalKey) || 0
        : undefined,
    };
  }

  /**
   * Clears all leases (used for test teardown).
   */
  static reset(): void {
    this.activeLeases.clear();
    this.principalLeaseCount.clear();
  }
}
