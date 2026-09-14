/**
 * S-07 Job Quota & Deduplication Manager
 *
 * Implements S07-I04, S07-I06:
 * - Hourly and daily background understanding job quotas
 * - Duplicate job suppression & deduplication window
 * - Strict cross-plane quota separation (GX != WX != ADMIN)
 */

import { SecurityPrincipalType } from './rate-limit.policy';

export interface QuotaAllocation {
  maxHourly: number;
  maxDaily: number;
}

export const CANONICAL_JOB_QUOTAS: Record<
  SecurityPrincipalType,
  QuotaAllocation
> = {
  ANONYMOUS: { maxHourly: 0, maxDaily: 0 },
  GUEST: { maxHourly: 3, maxDaily: 10 },
  USER: { maxHourly: 30, maxDaily: 200 },
  ADMIN: { maxHourly: 500, maxDaily: 5000 },
};

export const DEDUPLICATION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

interface JobHistoryRecord {
  targetHash: string;
  timestamp: number;
}

export class JobQuotaManager {
  private static principalHistory = new Map<string, JobHistoryRecord[]>();

  /**
   * Checks quota and checks for duplicate job submission.
   */
  static checkAdmission(
    principalKey: string,
    principalType: SecurityPrincipalType,
    targetIdentifier: string, // e.g. domain name
    customQuota?: QuotaAllocation,
  ): {
    admitted: boolean;
    isDuplicate: boolean;
    hourlyUsed: number;
    hourlyLimit: number;
    decision:
      | 'ADMITTED'
      | 'DUPLICATE_SUPPRESSED'
      | 'HOURLY_QUOTA_EXCEEDED'
      | 'DAILY_QUOTA_EXCEEDED'
      | 'ANONYMOUS_PROHIBITED';
  } {
    if (principalType === 'ANONYMOUS') {
      return {
        admitted: false,
        isDuplicate: false,
        hourlyUsed: 0,
        hourlyLimit: 0,
        decision: 'ANONYMOUS_PROHIBITED',
      };
    }

    const now = Date.now();
    const quota = customQuota || CANONICAL_JOB_QUOTAS[principalType];
    const hourStart = now - 60 * 60 * 1000;
    const dayStart = now - 24 * 60 * 60 * 1000;
    const dedupStart = now - DEDUPLICATION_WINDOW_MS;

    let records = this.principalHistory.get(principalKey) || [];
    // Clean up older than 1 day
    records = records.filter((r) => r.timestamp > dayStart);
    this.principalHistory.set(principalKey, records);

    const normTarget = targetIdentifier.trim().toLowerCase();

    // 1. Check duplicate within dedup window
    const recentDuplicate = records.find(
      (r) => r.targetHash === normTarget && r.timestamp > dedupStart,
    );
    if (recentDuplicate) {
      return {
        admitted: false,
        isDuplicate: true,
        hourlyUsed: records.filter((r) => r.timestamp > hourStart).length,
        hourlyLimit: quota.maxHourly,
        decision: 'DUPLICATE_SUPPRESSED',
      };
    }

    // 2. Check hourly quota
    const hourlyUsed = records.filter((r) => r.timestamp > hourStart).length;
    if (hourlyUsed >= quota.maxHourly) {
      return {
        admitted: false,
        isDuplicate: false,
        hourlyUsed,
        hourlyLimit: quota.maxHourly,
        decision: 'HOURLY_QUOTA_EXCEEDED',
      };
    }

    // 3. Check daily quota
    const dailyUsed = records.length;
    if (dailyUsed >= quota.maxDaily) {
      return {
        admitted: false,
        isDuplicate: false,
        hourlyUsed,
        hourlyLimit: quota.maxHourly,
        decision: 'DAILY_QUOTA_EXCEEDED',
      };
    }

    return {
      admitted: true,
      isDuplicate: false,
      hourlyUsed,
      hourlyLimit: quota.maxHourly,
      decision: 'ADMITTED',
    };
  }

  /**
   * Records a job consumption.
   */
  static recordJob(principalKey: string, targetIdentifier: string): void {
    const now = Date.now();
    const records = this.principalHistory.get(principalKey) || [];
    records.push({
      targetHash: targetIdentifier.trim().toLowerCase(),
      timestamp: now,
    });
    this.principalHistory.set(principalKey, records);
  }

  /**
   * Resets all history (used for tests).
   */
  static reset(): void {
    this.principalHistory.clear();
  }
}
