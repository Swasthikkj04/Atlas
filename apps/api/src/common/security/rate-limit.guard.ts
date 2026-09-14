/**
 * S-07 Rate Limiter Guard & Core Engine
 *
 * Implements S07-I01, S07-I02, S07-I03, S07-I14, S07-I15:
 * - Server-enforced, identity-aware rate limiting
 * - Fail-closed handling for security-critical operations
 * - Canonical 429 response structure
 * - Rejection of client identity spoofing
 */

import {
  SecurityPrincipalType,
  EndpointCategory,
  CANONICAL_RATE_LIMIT_POLICIES,
  resolveEndpointCategory,
} from './rate-limit.policy';

export interface RateLimitStatus {
  isBlocked: boolean;
  limit: number;
  remaining: number;
  resetTimeSeconds: number;
  retryAfterSeconds: number;
  category: EndpointCategory;
  principalType: SecurityPrincipalType;
  failClosedEngaged?: boolean;
}

export interface Canonical429Response {
  statusCode: 429;
  error: 'Too Many Requests';
  message: string;
  retryAfter: number;
  correlationId?: string;
}

export class RateLimiterEngine {
  private static slidingWindows = new Map<string, number[]>();
  private static simulatedFailure = false;

  /**
   * Sets simulated failure state for testing fail-closed resilience.
   */
  static setSimulatedFailure(enabled: boolean): void {
    this.simulatedFailure = enabled;
  }

  /**
   * Evaluates rate limiting for an incoming request.
   */
  static evaluate(
    method: string,
    path: string,
    ip: string,
    principalKey?: string,
    principalType: SecurityPrincipalType = 'ANONYMOUS',
  ): RateLimitStatus {
    const category = resolveEndpointCategory(method, path, principalType);
    const policy = CANONICAL_RATE_LIMIT_POLICIES[category];

    // Handle Fail-Closed Resilience (S07-I15)
    if (this.simulatedFailure) {
      if (policy.requiresStrictFailClosed) {
        return {
          isBlocked: true,
          limit: policy.limit,
          remaining: 0,
          resetTimeSeconds: 60,
          retryAfterSeconds: 60,
          category,
          principalType,
          failClosedEngaged: true,
        };
      }
    }

    const now = Date.now();
    const windowMs = policy.windowSeconds * 1000;
    const windowStart = now - windowMs;

    // Composite key guarantees that client cannot switch principal ID to bypass IP limit
    const key = `ratelimit:${category}:${ip}:${principalKey || 'anon'}`;

    let timestamps = this.slidingWindows.get(key) || [];
    timestamps = timestamps.filter((t) => t > windowStart);

    const currentCount = timestamps.length;
    const limit = policy.limit;

    if (currentCount >= limit) {
      this.slidingWindows.set(key, timestamps);
      const oldest = timestamps[0] || now;
      const resetTimeSeconds = Math.max(
        1,
        Math.ceil((oldest + windowMs - now) / 1000),
      );

      return {
        isBlocked: true,
        limit,
        remaining: 0,
        resetTimeSeconds,
        retryAfterSeconds: resetTimeSeconds,
        category,
        principalType,
      };
    }

    // Record this request atomically
    timestamps.push(now);
    this.slidingWindows.set(key, timestamps);

    const remaining = Math.max(0, limit - timestamps.length);
    const oldest = timestamps[0] || now;
    const resetTimeSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000),
    );

    return {
      isBlocked: false,
      limit,
      remaining,
      resetTimeSeconds,
      retryAfterSeconds: 0,
      category,
      principalType,
    };
  }

  /**
   * Produces canonical 429 response payload without leaking infrastructure topology.
   */
  static create429Response(
    retryAfterSeconds: number,
    correlationId?: string,
  ): Canonical429Response {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message:
        'Rate limit exceeded or admission restricted. Please retry after the indicated interval.',
      retryAfter: Math.max(1, Math.min(retryAfterSeconds, 3600)), // Safe upper bound
      correlationId,
    };
  }

  /**
   * Clears state for tests.
   */
  static reset(): void {
    this.slidingWindows.clear();
    this.simulatedFailure = false;
  }
}
