import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RateLimitCheckResult {
  isBlocked: boolean;
  limit: number;
  remaining: number;
  resetTimeSeconds: number;
  retryAfterSeconds: number;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly windows = new Map<string, number[]>();
  private readonly isEnabled: boolean;
  private readonly defaultGlobalLimit: number;
  private readonly defaultGlobalWindowSeconds: number;

  constructor(private readonly configService: ConfigService) {
    this.isEnabled =
      this.configService.get<string>('RATE_LIMIT_ENABLED') !== 'false';
    this.defaultGlobalLimit =
      Number(this.configService.get<string>('RATE_LIMIT_GLOBAL')) || 120;
    this.defaultGlobalWindowSeconds =
      Number(this.configService.get<string>('RATE_LIMIT_WINDOW')) || 60;
  }

  checkLimit(
    key: string,
    customLimit?: number,
    customWindowSeconds?: number,
  ): RateLimitCheckResult {
    if (!this.isEnabled) {
      return {
        isBlocked: false,
        limit: 999999,
        remaining: 999999,
        resetTimeSeconds: 0,
        retryAfterSeconds: 0,
      };
    }

    const now = Date.now();
    const limit = customLimit || this.defaultGlobalLimit;
    const windowMs =
      (customWindowSeconds || this.defaultGlobalWindowSeconds) * 1000;
    const windowStart = now - windowMs;

    let timestamps = this.windows.get(key) || [];
    // Clean up expired timestamps
    timestamps = timestamps.filter((t) => t > windowStart);

    const currentCount = timestamps.length;
    const oldest = timestamps[0] || now;
    const resetTimeMs = oldest + windowMs - now;
    const resetTimeSeconds = Math.max(1, Math.ceil(resetTimeMs / 1000));

    if (currentCount >= limit) {
      this.windows.set(key, timestamps);
      return {
        isBlocked: true,
        limit,
        remaining: 0,
        resetTimeSeconds,
        retryAfterSeconds: resetTimeSeconds,
      };
    }

    timestamps.push(now);
    this.windows.set(key, timestamps);

    return {
      isBlocked: false,
      limit,
      remaining: Math.max(0, limit - timestamps.length),
      resetTimeSeconds,
      retryAfterSeconds: 0,
    };
  }

  resetKey(key: string): void {
    this.windows.delete(key);
  }
}
