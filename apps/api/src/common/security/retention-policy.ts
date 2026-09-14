/**
 * S-08 Retention Policy & Ephemerality Engine
 *
 * Implements S08-I04, S08-I11, S08-I13:
 * - Authoritative retention windows for all data categories
 * - GX ephemerality bounds (24 hours maximum lifecycle)
 * - Raw collector payload retention (7 days maximum)
 * - Backup retention policy (30 days maximum)
 * - Lifecycle state machine: CREATED -> ACTIVE -> RETENTION_WINDOW -> EXPIRATION -> DELETION -> VERIFICATION
 */

export type EntityLifecycleState =
  | 'CREATED'
  | 'ACTIVE'
  | 'RETENTION_WINDOW'
  | 'EXPIRED'
  | 'DELETED'
  | 'VERIFIED_DELETED';

export const CANONICAL_RETENTION_WINDOWS_MS = {
  GUEST_SESSION: 24 * 60 * 60 * 1000, // 24 hours
  GUEST_UNDERSTANDING: 24 * 60 * 60 * 1000, // 24 hours
  RAW_COLLECTOR_PAYLOAD: 7 * 24 * 60 * 60 * 1000, // 7 days
  SECURITY_AUDIT_LOGS: 90 * 24 * 60 * 60 * 1000, // 90 days
  BACKUP_ARCHIVE: 30 * 24 * 60 * 60 * 1000, // 30 days
  USER_TENANT_DATA: -1, // Retained until explicit user deletion
} as const;

export interface RetentionEvaluatable {
  id: string;
  category: keyof typeof CANONICAL_RETENTION_WINDOWS_MS;
  createdAt: number;
  lastAccessedAt?: number;
}

export class RetentionPolicyEngine {
  /**
   * Evaluates if a given record has exceeded its retention window.
   */
  static evaluateRetention(
    record: RetentionEvaluatable,
    now = Date.now(),
  ): {
    isExpired: boolean;
    state: EntityLifecycleState;
    ageMs: number;
    maxRetentionMs: number;
    decision: 'RETENTION_VALID' | 'RETENTION_EXPIRED_PENDING_DELETION';
  } {
    const maxRetentionMs = CANONICAL_RETENTION_WINDOWS_MS[record.category];

    // Indefinite retention until account deletion
    if (maxRetentionMs === -1) {
      return {
        isExpired: false,
        state: 'ACTIVE',
        ageMs: now - record.createdAt,
        maxRetentionMs,
        decision: 'RETENTION_VALID',
      };
    }

    const ageMs = now - record.createdAt;
    if (ageMs > maxRetentionMs) {
      return {
        isExpired: true,
        state: 'EXPIRED',
        ageMs,
        maxRetentionMs,
        decision: 'RETENTION_EXPIRED_PENDING_DELETION',
      };
    }

    return {
      isExpired: false,
      state: 'ACTIVE',
      ageMs,
      maxRetentionMs,
      decision: 'RETENTION_VALID',
    };
  }

  /**
   * Asserts whether backup restoration adheres to tenant boundary.
   */
  static validateBackupRestoration(
    sourceTenantId: string,
    targetTenantId: string,
  ): {
    allowed: boolean;
    decision: 'BACKUP_RESTORATION_PERMITTED' | 'CROSS_TENANT_RESTORE_BLOCKED';
  } {
    if (sourceTenantId !== targetTenantId) {
      return { allowed: false, decision: 'CROSS_TENANT_RESTORE_BLOCKED' };
    }
    return { allowed: true, decision: 'BACKUP_RESTORATION_PERMITTED' };
  }
}
