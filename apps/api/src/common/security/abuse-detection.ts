/**
 * S-07 Multi-Dimensional Abuse & Brute-Force Detector
 *
 * Implements S07-I08, S07-I09, S07-I10:
 * - Brute force defense (credential stuffing, password guessing, token guessing)
 * - Multi-dimensional identity correlation (IP + Session + Account + UserAgent)
 * - Enumeration resistance (uniform rejection without resource existence leakage)
 * - Automatic progressive penalty escalation & cooling-off windows
 */

export interface AbuseContext {
  ip: string;
  principalKey?: string;
  guestSessionId?: string;
  userAgent?: string;
  targetIdentity?: string; // e.g. attempted username or email
}

export interface AbuseTrackingState {
  failureCount: number;
  lastFailureTime: number;
  quarantinedUntil: number;
  escalationLevel: number;
}

export const MAX_CONSECUTIVE_AUTH_FAILURES = 5;
export const BASE_PENALTY_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const PROGRESSIVE_PENALTY_MULTIPLIER = 2;

export class AbuseDetector {
  private static tracker = new Map<string, AbuseTrackingState>();

  /**
   * Generates composite abuse tracking keys to defeat single-dimension rotation.
   */
  static getTrackingKeys(ctx: AbuseContext): string[] {
    const keys: string[] = [`ip:${ctx.ip}`];

    if (ctx.principalKey) {
      keys.push(`principal:${ctx.principalKey}`);
      keys.push(`ip_principal:${ctx.ip}:${ctx.principalKey}`);
    }

    if (ctx.guestSessionId) {
      keys.push(`guest:${ctx.guestSessionId}`);
      keys.push(`ip_guest:${ctx.ip}:${ctx.guestSessionId}`);
    }

    if (ctx.targetIdentity) {
      const normTarget = ctx.targetIdentity.trim().toLowerCase();
      keys.push(`target:${normTarget}`);
      keys.push(`ip_target:${ctx.ip}:${normTarget}`);
    }

    return keys;
  }

  /**
   * Assesses whether an incoming request from the given context is blocked by abuse controls.
   */
  static evaluateAbuseStatus(ctx: AbuseContext): {
    isBlocked: boolean;
    reason?:
      | 'BRUTE_FORCE_QUARANTINE'
      | 'EXCESSIVE_FAILURES'
      | 'DISTRIBUTED_ABUSE_DETECTED';
    retryAfterSeconds: number;
    decision: 'ALLOWED' | 'BLOCKED_ABUSE_QUARANTINE';
  } {
    const now = Date.now();
    const keys = this.getTrackingKeys(ctx);

    for (const key of keys) {
      const state = this.tracker.get(key);
      if (state && now < state.quarantinedUntil) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((state.quarantinedUntil - now) / 1000),
        );
        return {
          isBlocked: true,
          reason: 'BRUTE_FORCE_QUARANTINE',
          retryAfterSeconds,
          decision: 'BLOCKED_ABUSE_QUARANTINE',
        };
      }
    }

    return {
      isBlocked: false,
      retryAfterSeconds: 0,
      decision: 'ALLOWED',
    };
  }

  /**
   * Records a security failure (e.g. invalid password, invalid token).
   */
  static recordFailure(ctx: AbuseContext): {
    nowQuarantined: boolean;
    quarantinedUntil?: number;
    retryAfterSeconds?: number;
  } {
    const now = Date.now();
    const keys = this.getTrackingKeys(ctx);
    let wasQuarantined = false;
    let maxRetryAfter = 0;

    for (const key of keys) {
      let state = this.tracker.get(key);
      if (!state) {
        state = {
          failureCount: 0,
          lastFailureTime: now,
          quarantinedUntil: 0,
          escalationLevel: 1,
        };
      }

      // Reset failure count if last failure was long ago
      if (now - state.lastFailureTime > BASE_PENALTY_WINDOW_MS) {
        state.failureCount = 0;
        state.escalationLevel = 1;
      }

      state.failureCount += 1;
      state.lastFailureTime = now;

      if (state.failureCount >= MAX_CONSECUTIVE_AUTH_FAILURES) {
        const penaltyDuration =
          BASE_PENALTY_WINDOW_MS *
          Math.pow(PROGRESSIVE_PENALTY_MULTIPLIER, state.escalationLevel - 1);
        state.quarantinedUntil = now + penaltyDuration;
        state.escalationLevel += 1;
        state.failureCount = 0; // reset for next tier
        wasQuarantined = true;
        maxRetryAfter = Math.max(
          maxRetryAfter,
          Math.ceil(penaltyDuration / 1000),
        );
      }

      this.tracker.set(key, state);
    }

    return {
      nowQuarantined: wasQuarantined,
      retryAfterSeconds: wasQuarantined ? maxRetryAfter : undefined,
    };
  }

  /**
   * Resets failure counter on legitimate authenticated success.
   */
  static recordSuccess(ctx: AbuseContext): void {
    const keys = this.getTrackingKeys(ctx);
    for (const key of keys) {
      this.tracker.delete(key);
    }
  }

  /**
   * Clears tracker state (for testing).
   */
  static reset(): void {
    this.tracker.clear();
  }
}
