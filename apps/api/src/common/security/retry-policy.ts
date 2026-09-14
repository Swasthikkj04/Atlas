/**
 * S-07 Retry Amplification Defense & Backoff Policy
 *
 * Implements S07-I07:
 * - Strict maximum retry bounds (e.g. max 3 attempts)
 * - Exponential backoff with jitter and upper ceiling
 * - Non-retryable error classification (never retry client errors, auth failures, validation errors)
 * - Dead-letter/terminal failure handling
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterFactor: number;
}

export const CANONICAL_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 30_000, // 30 seconds max delay
  jitterFactor: 0.2,
};

export const NON_RETRYABLE_STATUS_CODES = new Set([
  400, // Bad Request
  401, // Unauthorized
  403, // Forbidden
  404, // Not Found
  405, // Method Not Allowed
  409, // Conflict
  422, // Unprocessable Entity
]);

export class RetryPolicy {
  /**
   * Determines if a failed operation is eligible for retry.
   */
  static isRetryable(
    statusCodeOrError: number | Error,
    attemptNumber: number,
    config = CANONICAL_RETRY_CONFIG,
  ): {
    canRetry: boolean;
    delayMs: number;
    decision:
      'RETRY_PERMITTED' | 'MAX_RETRIES_EXCEEDED' | 'NON_RETRYABLE_ERROR';
  } {
    if (attemptNumber >= config.maxRetries) {
      return {
        canRetry: false,
        delayMs: 0,
        decision: 'MAX_RETRIES_EXCEEDED',
      };
    }

    if (typeof statusCodeOrError === 'number') {
      if (NON_RETRYABLE_STATUS_CODES.has(statusCodeOrError)) {
        return {
          canRetry: false,
          delayMs: 0,
          decision: 'NON_RETRYABLE_ERROR',
        };
      }
    }

    // Calculate bounded exponential backoff
    const rawDelay = config.baseDelayMs * Math.pow(2, attemptNumber);
    const cappedDelay = Math.min(rawDelay, config.maxDelayMs);
    const jitter = cappedDelay * config.jitterFactor * (Math.random() * 2 - 1);
    const finalDelay = Math.max(
      config.baseDelayMs,
      Math.round(cappedDelay + jitter),
    );

    return {
      canRetry: true,
      delayMs: finalDelay,
      decision: 'RETRY_PERMITTED',
    };
  }
}
