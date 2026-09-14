import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RateLimiterCategory,
  RateLimiterTier,
} from '../contracts/rate-limiter.interface';

export interface BackpressureEvaluation {
  readonly shouldThrottle: boolean;
  readonly pressureRatio: number; // 0.0 to 1.0
  readonly retryAfterSeconds: number;
  readonly reason?: string;
}

@Injectable()
export class AdaptiveBackpressureService {
  private readonly logger = new Logger(AdaptiveBackpressureService.name);
  private readonly activeJobs = new Set<string>();
  private readonly maxWorkerCapacity: number;
  private readonly saturationThresholdRatio: number;

  constructor(private readonly configService: ConfigService) {
    this.maxWorkerCapacity =
      Number(this.configService.get<string>('MAX_CONCURRENT_DISCOVERY_JOBS')) ||
      50;
    this.saturationThresholdRatio =
      Number(this.configService.get<string>('BACKPRESSURE_THRESHOLD_RATIO')) ||
      0.85;
  }

  registerJobStart(jobId: string): void {
    this.activeJobs.add(jobId);
  }

  registerJobEnd(jobId: string): void {
    this.activeJobs.delete(jobId);
  }

  getActiveJobCount(): number {
    return this.activeJobs.size;
  }

  /**
   * Evaluates if system backpressure should throttle new incoming understanding/discovery workloads.
   */
  evaluateBackpressure(
    tier: RateLimiterTier = 'FREE',
    category: RateLimiterCategory = 'PUBLIC_DEFAULT',
  ): BackpressureEvaluation {
    const activeCount = this.activeJobs.size;
    const pressureRatio =
      this.maxWorkerCapacity > 0
        ? Math.min(1.0, activeCount / this.maxWorkerCapacity)
        : 0;

    // Enterprise tier is given priority during elevated pressure
    const effectiveThreshold =
      tier === 'ENTERPRISE'
        ? 0.95
        : tier === 'PRO'
          ? 0.9
          : this.saturationThresholdRatio;

    const isHeavyWorkload =
      category === 'GUEST_UNDERSTAND' || category === 'USER_UNDERSTAND';

    if (isHeavyWorkload && pressureRatio >= effectiveThreshold) {
      // Estimate wait time based on average discovery job completion (e.g. 5-15s)
      const overloadFactor =
        (pressureRatio - effectiveThreshold) / (1 - effectiveThreshold + 0.01);
      const retryAfterSeconds = Math.max(5, Math.ceil(15 * overloadFactor));

      this.logger.warn(
        `Adaptive backpressure engaged for tier=${tier}, category=${category}: activeJobs=${activeCount}/${this.maxWorkerCapacity} (pressure=${(pressureRatio * 100).toFixed(1)}%)`,
      );

      return {
        shouldThrottle: true,
        pressureRatio,
        retryAfterSeconds,
        reason: `System discovery queue is currently saturated (${activeCount}/${this.maxWorkerCapacity} active scans). Please retry in ${retryAfterSeconds}s.`,
      };
    }

    return {
      shouldThrottle: false,
      pressureRatio,
      retryAfterSeconds: 0,
    };
  }

  getMetrics(): {
    activeJobs: number;
    maxCapacity: number;
    pressureRatio: number;
  } {
    const activeJobs = this.activeJobs.size;
    return {
      activeJobs,
      maxCapacity: this.maxWorkerCapacity,
      pressureRatio:
        this.maxWorkerCapacity > 0 ? activeJobs / this.maxWorkerCapacity : 0,
    };
  }

  reset(): void {
    this.activeJobs.clear();
  }
}
