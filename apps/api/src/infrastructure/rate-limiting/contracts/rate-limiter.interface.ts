export type RateLimiterTier =
  'ANONYMOUS' | 'GUEST' | 'FREE' | 'PRO' | 'ENTERPRISE' | 'API_KEY';

export type RateLimiterCategory =
  | 'AUTH_LOGIN'
  | 'AUTH_REGISTER'
  | 'AUTH_REFRESH'
  | 'AUTH_OAUTH'
  | 'AUTH_PASSWORD_RESET'
  | 'AUTH_VERIFY_EMAIL'
  | 'GUEST_UNDERSTAND'
  | 'GUEST_READ'
  | 'USER_UNDERSTAND'
  | 'USER_DOMAIN_CRUD'
  | 'USER_READ_ONLY'
  | 'ADMIN_OPERATIONS'
  | 'PUBLIC_DEFAULT';

export type RateLimiterAlgorithm = 'SLIDING_WINDOW' | 'TOKEN_BUCKET';

export interface RateLimitCheckOptions {
  readonly key: string;
  readonly limit: number;
  readonly windowSeconds: number;
  readonly burstAllowance?: number;
  readonly algorithm?: RateLimiterAlgorithm;
  readonly cost?: number;
  readonly tier?: RateLimiterTier;
  readonly category?: RateLimiterCategory;
  readonly failClosed?: boolean;
}

export interface RateLimitCheckResult {
  readonly isBlocked: boolean;
  readonly limit: number;
  readonly remaining: number;
  readonly resetTimeSeconds: number;
  readonly retryAfterSeconds: number;
  readonly tier: RateLimiterTier;
  readonly category: RateLimiterCategory;
  readonly failClosedEngaged?: boolean;
  readonly backpressureEngaged?: boolean;
  readonly quotaUsageRatio: number; // 0.0 to 1.0
}

export interface TokenBucketState {
  tokens: number;
  lastRefillTimestamp: number;
}

export interface RateLimiterStorageBackend {
  /**
   * Evaluates and records a request in the sliding window.
   */
  evaluateSlidingWindow(
    key: string,
    limit: number,
    windowSeconds: number,
    cost?: number,
  ): Promise<{
    isBlocked: boolean;
    remaining: number;
    resetTimeSeconds: number;
    currentCount: number;
  }>;

  /**
   * Evaluates and consumes tokens in a token bucket.
   */
  evaluateTokenBucket(
    key: string,
    capacity: number,
    refillRatePerSecond: number,
    tokensToConsume?: number,
  ): Promise<{
    isBlocked: boolean;
    remainingTokens: number;
    retryAfterSeconds: number;
  }>;

  /**
   * Resets a key or pattern in storage.
   */
  resetKey(key: string): Promise<void>;

  /**
   * Clears all stored windows (for testing/maintenance).
   */
  clear(): Promise<void>;
}
