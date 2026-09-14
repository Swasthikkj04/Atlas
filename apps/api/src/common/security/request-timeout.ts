/**
 * S-07 Request & Job Timeout Enforcement
 *
 * Implements S07-I12:
 * - Explicit upper bounds on all operations
 * - Prevention of slowloris, stalled network connections, and unkillable background jobs
 */

export const CANONICAL_TIMEOUTS_MS = {
  HTTP_STANDARD: 15_000, // 15 seconds
  HTTP_EXPENSIVE_REPORT: 30_000, // 30 seconds
  EXTERNAL_DISCOVERY_PROBE: 10_000, // 10 seconds
  UNDERSTANDING_JOB: 120_000, // 2 minutes
  ADMIN_BULK_OPERATION: 60_000, // 1 minute
} as const;

export class TimeoutError extends Error {
  constructor(
    public readonly operation: string,
    public readonly timeoutMs: number,
  ) {
    super(`Operation '${operation}' timed out after ${timeoutMs}ms.`);
    this.name = 'TimeoutError';
  }
}

export class RequestTimeoutManager {
  /**
   * Executes an asynchronous task with an enforced timeout.
   */
  static async withTimeout<T>(
    promiseFn: () => Promise<T>,
    timeoutMs: number,
    operationName = 'operation',
  ): Promise<T> {
    let timer: NodeJS.Timeout | null = null;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new TimeoutError(operationName, timeoutMs));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promiseFn(), timeoutPromise]);
      return result;
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  /**
   * Evaluates if a given configured timeout violates upper bounds.
   */
  static validateTimeoutBoundary(
    configuredMs: number,
    maxAllowedMs: number,
  ): boolean {
    return configuredMs > 0 && configuredMs <= maxAllowedMs;
  }
}
