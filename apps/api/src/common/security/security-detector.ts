/**
 * S-09 Security Detection Engine
 *
 * Implements S09-I09:
 * - Evidence-driven attack pattern detection:
 *   - AUTH_FAILURE_BURST
 *   - REFRESH_REUSE_PATTERN
 *   - TENANT_BOUNDARY_ATTACK_PATTERN
 *   - CROSS_PLANE_ATTACK_PATTERN
 *   - INPUT_ABUSE_PATTERN
 * - Non-manipulated, evidence-based alerts
 */

import { CanonicalAuditEvent } from './audit-context';

export type DetectedSecurityPattern =
  | 'AUTH_FAILURE_BURST'
  | 'REFRESH_REUSE_PATTERN'
  | 'TENANT_BOUNDARY_ATTACK_PATTERN'
  | 'CROSS_PLANE_ATTACK_PATTERN'
  | 'INPUT_ABUSE_PATTERN';

export interface DetectionAlert {
  pattern: DetectedSecurityPattern;
  triggeredAt: number;
  triggerEventId: string;
  correlationKey: string;
  eventCount: number;
  plane: 'GX' | 'WX' | 'ADMIN';
  severity: 'WARNING' | 'CRITICAL';
}

export class SecurityDetector {
  private static recentEvents: CanonicalAuditEvent[] = [];
  private static readonly WINDOW_MS = 10 * 60 * 1000; // 10-minute sliding window

  /**
   * Evaluates incoming audit event against detection rules.
   */
  static analyzeEvent(event: CanonicalAuditEvent): DetectionAlert | null {
    const now = Date.now();
    this.recentEvents.push(event);

    // Prune old events
    this.recentEvents = this.recentEvents.filter(
      (e) => now - e.occurredAt <= this.WINDOW_MS,
    );

    // 1. Auth Failure Burst (5+ failed logins for same IP or target)
    if (event.eventType === 'LOGIN_FAILURE') {
      const ip = event.source.ip || 'unknown';
      const recentFails = this.recentEvents.filter(
        (e) => e.eventType === 'LOGIN_FAILURE' && e.source.ip === ip,
      );
      if (recentFails.length >= 5) {
        return {
          pattern: 'AUTH_FAILURE_BURST',
          triggeredAt: now,
          triggerEventId: event.eventId,
          correlationKey: `ip:${ip}`,
          eventCount: recentFails.length,
          plane: event.plane,
          severity: 'CRITICAL',
        };
      }
    }

    // 2. Refresh Reuse Pattern
    if (event.eventType === 'REFRESH_REUSE_DETECTED') {
      return {
        pattern: 'REFRESH_REUSE_PATTERN',
        triggeredAt: now,
        triggerEventId: event.eventId,
        correlationKey: `user:${event.principal.userId || 'anon'}`,
        eventCount: 1,
        plane: event.plane,
        severity: 'CRITICAL',
      };
    }

    // 3. Tenant Boundary Attack Pattern (3+ tenant violations)
    if (
      event.eventType === 'TENANT_BOUNDARY_VIOLATION' ||
      event.eventType === 'OWNERSHIP_DENIED'
    ) {
      const actor = event.principal.userId || event.source.ip || 'unknown';
      const recentViolations = this.recentEvents.filter(
        (e) =>
          (e.eventType === 'TENANT_BOUNDARY_VIOLATION' ||
            e.eventType === 'OWNERSHIP_DENIED') &&
          (e.principal.userId === actor || e.source.ip === actor),
      );
      if (recentViolations.length >= 3) {
        return {
          pattern: 'TENANT_BOUNDARY_ATTACK_PATTERN',
          triggeredAt: now,
          triggerEventId: event.eventId,
          correlationKey: `actor:${actor}`,
          eventCount: recentViolations.length,
          plane: event.plane,
          severity: 'CRITICAL',
        };
      }
    }

    // 4. Cross-Plane Attack Pattern (GX -> WX boundary attempts)
    if (event.eventType === 'GX_WX_BOUNDARY_VIOLATION') {
      return {
        pattern: 'CROSS_PLANE_ATTACK_PATTERN',
        triggeredAt: now,
        triggerEventId: event.eventId,
        correlationKey: `session:${event.principal.sessionId || 'gx'}`,
        eventCount: 1,
        plane: 'GX',
        severity: 'CRITICAL',
      };
    }

    // 5. Input Abuse Pattern (3+ injection or validation rejections)
    if (
      event.eventType === 'INJECTION_ATTEMPT' ||
      event.eventType === 'VALIDATION_REJECTED'
    ) {
      const ip = event.source.ip || 'unknown';
      const recentAbuse = this.recentEvents.filter(
        (e) =>
          (e.eventType === 'INJECTION_ATTEMPT' ||
            e.eventType === 'VALIDATION_REJECTED') &&
          e.source.ip === ip,
      );
      if (recentAbuse.length >= 3) {
        return {
          pattern: 'INPUT_ABUSE_PATTERN',
          triggeredAt: now,
          triggerEventId: event.eventId,
          correlationKey: `ip:${ip}`,
          eventCount: recentAbuse.length,
          plane: event.plane,
          severity: 'CRITICAL',
        };
      }
    }

    return null;
  }

  /**
   * Resets detection buffer (for tests).
   */
  static reset(): void {
    this.recentEvents = [];
  }
}
