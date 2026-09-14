import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  RateLimiterStorageBackend,
  TokenBucketState,
} from '../contracts/rate-limiter.interface';

interface SlidingWindowEntry {
  timestamps: number[];
  lastAccessed: number;
}

@Injectable()
export class InMemoryRateLimiterStorage
  implements RateLimiterStorageBackend, OnModuleDestroy
{
  private readonly logger = new Logger(InMemoryRateLimiterStorage.name);
  private readonly windows = new Map<string, SlidingWindowEntry>();
  private readonly tokenBuckets = new Map<string, TokenBucketState>();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Run garbage collection on expired windows every 60s
    this.cleanupInterval = setInterval(
      () => this.pruneExpiredEntries(),
      60_000,
    );
    // Unref so timer doesn't prevent Node process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupInterval);
  }

  async evaluateSlidingWindow(
    key: string,
    limit: number,
    windowSeconds: number,
    cost = 1,
  ): Promise<{
    isBlocked: boolean;
    remaining: number;
    resetTimeSeconds: number;
    currentCount: number;
  }> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    let entry = this.windows.get(key);
    if (!entry) {
      entry = { timestamps: [], lastAccessed: now };
      this.windows.set(key, entry);
    }

    entry.lastAccessed = now;
    // Filter out expired timestamps
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

    const currentCount = entry.timestamps.length;
    const oldest = entry.timestamps[0] || now;
    const resetTimeMs = oldest + windowMs - now;
    const resetTimeSeconds = Math.max(1, Math.ceil(resetTimeMs / 1000));

    if (currentCount + cost > limit) {
      return {
        isBlocked: true,
        remaining: 0,
        resetTimeSeconds,
        currentCount,
      };
    }

    // Record timestamps for cost
    for (let i = 0; i < cost; i++) {
      entry.timestamps.push(now);
    }

    const remaining = Math.max(0, limit - entry.timestamps.length);

    return {
      isBlocked: false,
      remaining,
      resetTimeSeconds,
      currentCount: entry.timestamps.length,
    };
  }

  async evaluateTokenBucket(
    key: string,
    capacity: number,
    refillRatePerSecond: number,
    tokensToConsume = 1,
  ): Promise<{
    isBlocked: boolean;
    remainingTokens: number;
    retryAfterSeconds: number;
  }> {
    const now = Date.now();
    let state = this.tokenBuckets.get(key);

    if (!state) {
      state = {
        tokens: capacity,
        lastRefillTimestamp: now,
      };
      this.tokenBuckets.set(key, state);
    }

    // Refill tokens based on elapsed time
    const elapsedSeconds = (now - state.lastRefillTimestamp) / 1000;
    const tokensToAdd = elapsedSeconds * refillRatePerSecond;
    state.tokens = Math.min(capacity, state.tokens + tokensToAdd);
    state.lastRefillTimestamp = now;

    if (state.tokens < tokensToConsume) {
      const tokensNeeded = tokensToConsume - state.tokens;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(tokensNeeded / refillRatePerSecond),
      );
      return {
        isBlocked: true,
        remainingTokens: Math.max(0, Math.floor(state.tokens)),
        retryAfterSeconds,
      };
    }

    state.tokens -= tokensToConsume;

    return {
      isBlocked: false,
      remainingTokens: Math.max(0, Math.floor(state.tokens)),
      retryAfterSeconds: 0,
    };
  }

  async resetKey(key: string): Promise<void> {
    this.windows.delete(key);
    this.tokenBuckets.delete(key);
  }

  async clear(): Promise<void> {
    this.windows.clear();
    this.tokenBuckets.clear();
  }

  /**
   * Prunes memory entries that have been idle past maximum window retention.
   */
  private pruneExpiredEntries(): void {
    const now = Date.now();
    const maxIdleMs = 300_000; // 5 minutes

    for (const [key, entry] of this.windows.entries()) {
      if (now - entry.lastAccessed > maxIdleMs) {
        this.windows.delete(key);
      }
    }
  }
}
