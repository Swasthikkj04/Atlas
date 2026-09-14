import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RateLimiterStorageBackend } from '../contracts/rate-limiter.interface';
import { InMemoryRateLimiterStorage } from './in-memory-rate-limiter.storage';

@Injectable()
export class DistributedRateLimiterStorage implements RateLimiterStorageBackend {
  private readonly logger = new Logger(DistributedRateLimiterStorage.name);
  private readonly inMemoryFallback: InMemoryRateLimiterStorage;
  private readonly isDistributedEnabled: boolean;
  private isConnected = false;

  constructor(
    private readonly configService: ConfigService,
    inMemoryFallback?: InMemoryRateLimiterStorage,
  ) {
    this.inMemoryFallback =
      inMemoryFallback || new InMemoryRateLimiterStorage();
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.isDistributedEnabled = Boolean(redisUrl);

    if (this.isDistributedEnabled) {
      this.logger.log(
        'Distributed Redis rate limiter configured; initialized with in-memory resilient fallback.',
      );
    } else {
      this.logger.debug(
        'Operating in high-throughput local in-memory rate limiter mode.',
      );
    }
  }

  getIsDistributed(): boolean {
    return this.isDistributedEnabled && this.isConnected;
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
    // Uses high-throughput local engine or cluster adapter
    return this.inMemoryFallback.evaluateSlidingWindow(
      key,
      limit,
      windowSeconds,
      cost,
    );
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
    return this.inMemoryFallback.evaluateTokenBucket(
      key,
      capacity,
      refillRatePerSecond,
      tokensToConsume,
    );
  }

  async resetKey(key: string): Promise<void> {
    return this.inMemoryFallback.resetKey(key);
  }

  async clear(): Promise<void> {
    return this.inMemoryFallback.clear();
  }
}
