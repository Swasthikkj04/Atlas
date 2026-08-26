import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { MetricsService } from '../../../infrastructure/metrics/metrics.service';
import { UnderstandingRepository } from '../repositories/understanding.repository';

export enum FailureCategory {
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  DISCOVERY = 'DISCOVERY',
  VALIDATION = 'VALIDATION',
  CONFIGURATION = 'CONFIGURATION',
  UNKNOWN = 'UNKNOWN',
}

export interface ClassifiedError {
  category: FailureCategory;
  isRetriable: boolean;
  message: string;
}

export interface ActiveWorkerJob {
  jobId: string;
  domainId: string;
  correlationId: string;
  workerId: string;
  startedAt: number;
  lastHeartbeat: number;
}

@Injectable()
export class WorkerReliabilityService implements OnModuleDestroy {
  private readonly logger = new Logger(WorkerReliabilityService.name);
  private readonly activeJobs = new Map<string, ActiveWorkerJob>();
  private readonly defaultMaxRetries = 3;
  private isShuttingDown = false;

  constructor(
    private readonly understandingRepository: UnderstandingRepository,
    private readonly metricsService: MetricsService,
  ) {}

  classifyError(error: any): ClassifiedError {
    const msg = error instanceof Error ? error.message : String(error);

    if (
      msg.includes('ENOTFOUND') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('ECONNRESET') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('fetch failed') ||
      msg.includes('HTTP timeout') ||
      msg.includes('TLS handshake') ||
      msg.includes('socket hang up')
    ) {
      return {
        category: FailureCategory.NETWORK,
        isRetriable: true,
        message: msg,
      };
    }

    if (
      msg.includes('Prisma') ||
      msg.includes('database') ||
      msg.includes('Connection terminated') ||
      msg.includes('deadlock') ||
      msg.includes("Can't reach database server")
    ) {
      return {
        category: FailureCategory.DATABASE,
        isRetriable: true,
        message: msg,
      };
    }

    if (
      msg.includes('Invalid domain') ||
      msg.includes('Validation failed') ||
      msg.includes('forbidNonWhitelisted') ||
      msg.includes('Target domain is unresolvable or malformed')
    ) {
      return {
        category: FailureCategory.VALIDATION,
        isRetriable: false,
        message: msg,
      };
    }

    if (
      msg.includes('Unauthorized') ||
      msg.includes('Forbidden') ||
      msg.includes('Invalid configuration')
    ) {
      return {
        category: FailureCategory.CONFIGURATION,
        isRetriable: false,
        message: msg,
      };
    }

    if (msg.includes('Discovery failed') || msg.includes('Discovery timeout')) {
      return {
        category: FailureCategory.DISCOVERY,
        isRetriable: true,
        message: msg,
      };
    }

    return {
      category: FailureCategory.UNKNOWN,
      isRetriable: true,
      message: msg,
    };
  }

  getRetryDelayMs(attempt: number, baseMs = 1000, maxMs = 30000): number {
    const exponent = Math.max(0, attempt - 1);
    const delay = baseMs * Math.pow(2, exponent);
    return Math.min(delay, maxMs);
  }

  trackJobStart(
    jobId: string,
    domainId: string,
    workerId: string,
    correlationId: string,
  ): ActiveWorkerJob {
    const active: ActiveWorkerJob = {
      jobId,
      domainId,
      workerId,
      correlationId,
      startedAt: Date.now(),
      lastHeartbeat: Date.now(),
    };
    this.activeJobs.set(jobId, active);
    return active;
  }

  async updateHeartbeat(
    jobId: string,
    workerId: string,
    leaseExtensionMs = 60000,
  ): Promise<void> {
    const active = this.activeJobs.get(jobId);
    if (active) {
      active.lastHeartbeat = Date.now();
    }

    try {
      await this.understandingRepository.updateHeartbeat(
        jobId,
        workerId,
        leaseExtensionMs,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to persist heartbeat for job ${jobId}: ${(err as Error).message}`,
      );
    }
  }

  trackJobCompletion(jobId: string): void {
    this.activeJobs.delete(jobId);
  }

  async handleJobFailure(
    jobId: string,
    rawError: any,
    durationMs: number,
    workerId?: string,
  ): Promise<{ retried: boolean; category: FailureCategory }> {
    this.activeJobs.delete(jobId);

    const job = await this.understandingRepository.findById(jobId);
    const attemptCount = job?.attemptCount ?? 1;
    const maxAttempts = job?.maxAttempts ?? this.defaultMaxRetries;
    const classified = this.classifyError(rawError);

    this.logger.warn(
      `Job ${jobId} failed with category=${classified.category}, retriable=${classified.isRetriable}, attempt=${attemptCount}/${maxAttempts}`,
    );

    if (classified.isRetriable && attemptCount < maxAttempts) {
      const delayMs = this.getRetryDelayMs(attemptCount);
      const nextRetryAt = new Date(Date.now() + delayMs);

      this.logger.log(
        `Scheduling retry #${attemptCount + 1} for job ${jobId} at ${nextRetryAt.toISOString()} (${delayMs}ms backoff).`,
      );

      await this.understandingRepository.scheduleRetry(
        jobId,
        nextRetryAt,
        `[RETRYING #${attemptCount + 1} - ${classified.category}] ${classified.message}`,
      );

      return { retried: true, category: classified.category };
    }

    // Permanent failure or retry exhaustion
    const failureReason =
      attemptCount >= maxAttempts
        ? `[MAX_ATTEMPTS_EXCEEDED] Exhausted ${maxAttempts} retry attempts. Last error (${classified.category}): ${classified.message}`
        : `[PERMANENT_FAILURE - ${classified.category}] ${classified.message}`;

    this.logger.error(`Job ${jobId} permanently failed: ${failureReason}`);

    await this.understandingRepository.failJob(
      jobId,
      failureReason,
      durationMs,
    );

    return { retried: false, category: classified.category };
  }

  /**
   * Reconciles all stale RUNNING jobs in PostgreSQL whose lease has expired.
   * This is database-driven and recovers crashed jobs from any dead worker process.
   */
  async recoverStuckJobs(leaseDurationMs = 60000): Promise<number> {
    const now = new Date();
    const staleJobs =
      await this.understandingRepository.findStaleRunningJobs(now);

    if (staleJobs.length === 0) {
      return 0;
    }

    let recoveredCount = 0;

    for (const job of staleJobs) {
      const attemptCount = job.attemptCount;
      const maxAttempts = job.maxAttempts || this.defaultMaxRetries;

      this.logger.warn(
        `Stale job detected: ${job.id} (worker=${job.workerId}, leaseExpired=${job.leaseUntil?.toISOString()}, attempt=${attemptCount}/${maxAttempts}). Reconciling...`,
      );

      if (attemptCount >= maxAttempts) {
        // Mark failed due to lease expiry after max attempts
        await this.understandingRepository.failJob(
          job.id,
          `[MAX_ATTEMPTS_EXCEEDED] Job lease expired after ${attemptCount} attempts without worker heartbeat.`,
          job.durationMs ?? 0,
        );
      } else {
        // Re-queue with exponential backoff
        const delayMs = this.getRetryDelayMs(attemptCount);
        const nextRetryAt = new Date(Date.now() + delayMs);

        await this.understandingRepository.scheduleRetry(
          job.id,
          nextRetryAt,
          `[STALE_JOB_RECOVERED] Worker lease expired (last worker: ${job.workerId}); scheduled retry #${attemptCount + 1}.`,
        );
      }

      recoveredCount++;
    }

    return recoveredCount;
  }

  isShuttingDownState(): boolean {
    return this.isShuttingDown;
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;
    this.logger.log(
      'WorkerReliabilityService graceful shutdown initiated. Stopping new job claims.',
    );

    const activeCount = this.activeJobs.size;
    if (activeCount > 0) {
      this.logger.log(
        `Waiting for ${activeCount} active job(s) to complete before exit...`,
      );
      const graceStart = Date.now();
      while (this.activeJobs.size > 0 && Date.now() - graceStart < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    this.logger.log('WorkerReliabilityService graceful shutdown completed.');
  }
}
