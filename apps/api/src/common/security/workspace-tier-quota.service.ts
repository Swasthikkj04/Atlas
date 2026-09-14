import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

export type WorkspaceTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface WorkspaceTierConfig {
  tier: WorkspaceTier;
  maxDomains: number;
  maxConcurrentScans: number;
  scansPerHour: number;
  rateLimitPerMinute: number;
  burstAllowance: number;
}

export const WORKSPACE_TIER_CONFIGS: Record<
  WorkspaceTier,
  WorkspaceTierConfig
> = {
  FREE: {
    tier: 'FREE',
    maxDomains: 4,
    maxConcurrentScans: 1,
    scansPerHour: 30,
    rateLimitPerMinute: 60,
    burstAllowance: 10,
  },
  PRO: {
    tier: 'PRO',
    maxDomains: 20,
    maxConcurrentScans: 5,
    scansPerHour: 150,
    rateLimitPerMinute: 180,
    burstAllowance: 30,
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    maxDomains: 500,
    maxConcurrentScans: 20,
    scansPerHour: 1000,
    rateLimitPerMinute: 600,
    burstAllowance: 100,
  },
};

@Injectable()
export class WorkspaceTierQuotaService {
  private static activeScansByWorkspace = new Map<string, number>();
  private static slidingWindows = new Map<string, number[]>();

  getTierConfig(tier: WorkspaceTier = 'FREE'): WorkspaceTierConfig {
    return WORKSPACE_TIER_CONFIGS[tier] || WORKSPACE_TIER_CONFIGS.FREE;
  }

  /**
   * Asserts whether the workspace is permitted to add more domains under its tier quota.
   */
  assertDomainQuota(
    currentDomainCount: number,
    tier: WorkspaceTier = 'FREE',
    requested = 1,
  ): void {
    const config = this.getTierConfig(tier);
    const projected = Math.max(0, currentDomainCount) + Math.max(0, requested);

    if (projected > config.maxDomains) {
      throw new BadRequestException(
        `Sorry, your domain limit has been reached. (${currentDomainCount}/${config.maxDomains} domains used for ${config.tier} tier)`,
      );
    }
  }

  /**
   * Asserts whether the workspace has reached its concurrent active discovery scan quota.
   */
  assertScanConcurrency(
    activeScans: number,
    tier: WorkspaceTier = 'FREE',
  ): void {
    const config = this.getTierConfig(tier);

    if (activeScans >= config.maxConcurrentScans) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          code: 'CONCURRENCY_EXCEEDED',
          message: `Concurrent understanding limit reached (${activeScans}/${config.maxConcurrentScans} scans running). Please wait for active scans to complete.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Evaluates rate limit for a workspace user and returns rate limit headers.
   */
  evaluateRateLimit(
    userId: string,
    tier: WorkspaceTier = 'FREE',
  ): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetSeconds: number;
    tier: WorkspaceTier;
    headers: Record<string, string>;
  } {
    const config = this.getTierConfig(tier);
    const now = Date.now();
    const windowMs = 60 * 1000;
    const windowStart = now - windowMs;

    const key = `ws_rate:${userId}`;
    let timestamps = WorkspaceTierQuotaService.slidingWindows.get(key) || [];
    timestamps = timestamps.filter((t) => t > windowStart);

    const limit = config.rateLimitPerMinute;
    const currentCount = timestamps.length;

    if (currentCount >= limit) {
      WorkspaceTierQuotaService.slidingWindows.set(key, timestamps);
      const oldest = timestamps[0] || now;
      const resetSeconds = Math.max(
        1,
        Math.ceil((oldest + windowMs - now) / 1000),
      );

      return {
        allowed: false,
        limit,
        remaining: 0,
        resetSeconds,
        tier: config.tier,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetSeconds.toString(),
          'X-Workspace-Tier': config.tier,
          'Retry-After': resetSeconds.toString(),
        },
      };
    }

    timestamps.push(now);
    WorkspaceTierQuotaService.slidingWindows.set(key, timestamps);

    const remaining = Math.max(0, limit - timestamps.length);
    const oldest = timestamps[0] || now;
    const resetSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000),
    );

    return {
      allowed: true,
      limit,
      remaining,
      resetSeconds,
      tier: config.tier,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetSeconds.toString(),
        'X-Workspace-Tier': config.tier,
      },
    };
  }

  /**
   * Test reset utility.
   */
  static reset(): void {
    this.slidingWindows.clear();
    this.activeScansByWorkspace.clear();
  }
}
