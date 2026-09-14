/**
 * S-09 Security Audit Writer & Isolation Store
 *
 * Implements S09-I03, S09-I04, S09-I05, S09-I12, S09-I13, S09-I14:
 * - Append-only, immutable audit record persistence
 * - Plane and tenant-isolated audit retrieval:
 *   - GX is strictly blocked from reading audit records
 *   - WX is strictly scoped to authenticated user's own events
 *   - ADMIN audit events are isolated from WX
 * - 90-day retention enforcement
 * - Fail-closed error handling for critical events
 */

import { CanonicalAuditEvent } from './audit-context';

export interface AuditQueryFilter {
  plane: 'GX' | 'WX' | 'ADMIN';
  requestingUserId?: string;
  targetUserId?: string;
  eventType?: string;
  limit?: number;
}

export class SecurityAuditWriter {
  private static auditLog: CanonicalAuditEvent[] = [];
  private static isStorageAvailable = true;

  /**
   * Appends an immutable audit event to the store.
   */
  static record(event: CanonicalAuditEvent): {
    success: boolean;
    eventId: string;
    decision: 'AUDIT_RECORDED' | 'AUDIT_STORAGE_FAILURE';
  } {
    if (!this.isStorageAvailable) {
      // For CRITICAL events, fail closed / throw
      if (event.severity === 'CRITICAL') {
        throw new Error(
          `CRITICAL_AUDIT_STORAGE_FAILURE: Failed to persist ${event.eventType}`,
        );
      }
      return {
        success: false,
        eventId: event.eventId,
        decision: 'AUDIT_STORAGE_FAILURE',
      };
    }

    this.auditLog.push(event);
    return {
      success: true,
      eventId: event.eventId,
      decision: 'AUDIT_RECORDED',
    };
  }

  /**
   * Queries audit events with strict plane and tenant boundary enforcement.
   */
  static query(filter: AuditQueryFilter): {
    allowed: boolean;
    events?: CanonicalAuditEvent[];
    decision:
      | 'AUDIT_QUERY_ALLOWED'
      | 'GX_AUDIT_ACCESS_BLOCKED'
      | 'CROSS_TENANT_AUDIT_BLOCKED'
      | 'ADMIN_AUDIT_WX_BLOCKED';
  } {
    // 1. GX is strictly blocked from reading audit store
    if (filter.plane === 'GX') {
      return { allowed: false, decision: 'GX_AUDIT_ACCESS_BLOCKED' };
    }

    // 2. WX cannot request cross-tenant audit data
    if (
      filter.plane === 'WX' &&
      filter.targetUserId &&
      filter.targetUserId !== filter.requestingUserId
    ) {
      return { allowed: false, decision: 'CROSS_TENANT_AUDIT_BLOCKED' };
    }

    let results = this.auditLog.slice();

    if (filter.plane === 'WX') {
      // WX can only see its own plane & its own user events
      results = results.filter(
        (e) =>
          e.plane === 'WX' && e.principal.userId === filter.requestingUserId,
      );
    } else if (filter.plane === 'ADMIN') {
      // Admin query can filter by target user or eventType
      if (filter.targetUserId) {
        results = results.filter(
          (e) => e.principal.userId === filter.targetUserId,
        );
      }
    }

    if (filter.eventType) {
      results = results.filter((e) => e.eventType === filter.eventType);
    }

    if (filter.limit && filter.limit > 0) {
      results = results.slice(-filter.limit);
    }

    return {
      allowed: true,
      events: results,
      decision: 'AUDIT_QUERY_ALLOWED',
    };
  }

  /**
   * Enforces 90-day retention purge on audit records.
   */
  static purgeExpiredRecords(
    now = Date.now(),
    maxAgeMs = 90 * 24 * 60 * 60 * 1000,
  ): number {
    const initialCount = this.auditLog.length;
    this.auditLog = this.auditLog.filter((e) => now - e.occurredAt <= maxAgeMs);
    return initialCount - this.auditLog.length;
  }

  /**
   * Sets mock storage state (for testing failure scenarios).
   */
  static setStorageAvailable(available: boolean): void {
    this.isStorageAvailable = available;
  }

  /**
   * Clears audit store (for tests).
   */
  static reset(): void {
    this.auditLog = [];
    this.isStorageAvailable = true;
  }
}
