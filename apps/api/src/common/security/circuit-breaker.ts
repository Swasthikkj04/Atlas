/**
 * S-07 Circuit Breaker for Resilient Dependency & Endpoint Protection
 *
 * Implements S07-I13:
 * - Prevents cascading failures and resource exhaustion from failing dependencies
 * - Tripping state machine: CLOSED -> OPEN -> HALF_OPEN -> CLOSED
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenTrialSuccesses: number;
}

export const CANONICAL_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000, // 30 seconds
  halfOpenTrialSuccesses: 2,
};

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastStateChangeTime = Date.now();

  constructor(
    public readonly name: string,
    private readonly config: CircuitBreakerConfig = CANONICAL_CIRCUIT_CONFIG,
  ) {}

  getState(): CircuitState {
    const now = Date.now();
    if (this.state === 'OPEN') {
      if (now - this.lastStateChangeTime >= this.config.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        this.lastStateChangeTime = now;
      }
    }
    return this.state;
  }

  canExecute(): boolean {
    const currentState = this.getState();
    return currentState === 'CLOSED' || currentState === 'HALF_OPEN';
  }

  recordSuccess(): void {
    const currentState = this.getState();
    if (currentState === 'HALF_OPEN') {
      this.successCount += 1;
      if (this.successCount >= this.config.halfOpenTrialSuccesses) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        this.lastStateChangeTime = Date.now();
      }
    } else if (currentState === 'CLOSED') {
      this.failureCount = 0;
    }
  }

  recordFailure(): void {
    this.failureCount += 1;
    if (
      this.state === 'HALF_OPEN' ||
      this.failureCount >= this.config.failureThreshold
    ) {
      this.state = 'OPEN';
      this.lastStateChangeTime = Date.now();
    }
  }

  forceOpen(): void {
    this.state = 'OPEN';
    this.lastStateChangeTime = Date.now();
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastStateChangeTime = Date.now();
  }
}
