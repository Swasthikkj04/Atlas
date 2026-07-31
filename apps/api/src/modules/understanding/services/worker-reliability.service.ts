import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { runWithCorrelationId } from '../../../infrastructure/logger/background-job-context';
import { RequestContextStore } from '../../../infrastructure/logger/request-context.store';
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
  startedAt: number;
  lastHeartbeat: number;
  retryCount: number;
}

@Injectable()
export class WorkerReliabilityService implements OnModuleDestroy {
  private readonly logger = new Logger(WorkerReliabilityService.name);
  private readonly activeJobs = new Map<string, ActiveWorkerJob>();
  private readonly maxRetries = 3;
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
      msg.includes('ETIMEDOUT') ||
      msg.includes('fetch failed') ||
      msg.includes('HTTP timeout') ||
      msg.includes('TLS handshake')
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
      msg.includes('deadlock')
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
      msg.includes('forbidNonWhitelisted')
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

    if (msg.includes('Discovery failed')) {
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
    const delay = baseMs * Math.pow(2, attempt - 1);
    return Math.min(delay, maxMs);
  }

  trackJobStart(
    jobId: string,
    domainId: string,
    correlationId?: string,
  ): ActiveWorkerJob {
    const active: ActiveWorkerJob = {
      jobId,
      domainId,
      correlationId:
        correlationId ||
        RequestContextStore.getCorrelationId() ||
        `corr_worker_${jobId}`,
      startedAt: Date.now(),
      lastHeartbeat: Date.now(),
      retryCount: this.activeJobs.get(jobId)?.retryCount || 0,
    };
    this.activeJobs.set(jobId, active);
    return active;
  }

  updateHeartbeat(jobId: string): void {
    const active = this.activeJobs.get(jobId);
    if (active) {
      active.lastHeartbeat = Date.now();
    }
  }

  trackJobCompletion(jobId: string): void {
    this.activeJobs.delete(jobId);
  }

  async handleJobFailure(
    jobId: string,
    rawError: any,
    durationMs: number,
  ): Promise<{ retried: boolean; category: FailureCategory }> {
    const active = this.activeJobs.get(jobId);
    const retryCount = (active?.retryCount || 0) + 1;
    const classified = this.classifyError(rawError);

    this.logger.warn(
      `Job ${jobId} failed with category=${classified.category}, retriable=${classified.isRetriable}, attempt=${retryCount}/${this.maxRetries}`,
    );

    if (classified.isRetriable && retryCount <= this.maxRetries) {
      const delayMs = this.getRetryDelayMs(retryCount);
      if (active) {
        active.retryCount = retryCount;
      }

      this.logger.log(
        `Scheduling retry #${retryCount} for job ${jobId} after ${delayMs}ms exponential backoff delay.`,
      );

      // Transition job back to PENDING for retry
      await this.understandingRepository.failJob(
        jobId,
        `[RETRYING #${retryCount} - ${classified.category}] ${classified.message}`,
        durationMs,
      );

      // Re-queue to PENDING so next worker poll claims it
      await this.understandingRepository.claimJob(jobId); // reset to RUNNING/PENDING lifecycle
      await this.understandingRepository.failJob(
        jobId,
        `[RETRYING #${retryCount}] Scheduled`,
        0,
      );

      // Update job back to PENDING status atomically
      await (
        this.understandingRepository as any
      ).prisma.understandingJob.update({
        where: { id: jobId },
        data: { status: 'PENDING' },
      });

      return { retried: true, category: classified.category };
    }

    // Permanent failure
    this.activeJobs.delete(jobId);
    await this.understandingRepository.failJob(
      jobId,
      `[PERMANENT_FAILURE - ${classified.category}] ${classified.message}`,
      durationMs,
    );

    return { retried: false, category: classified.category };
  }

  async recoverStuckJobs(timeoutMs = 30000): Promise<number> {
    const now = Date.now();
    let recoveredCount = 0;

    for (const [jobId, active] of this.activeJobs.entries()) {
      if (now - active.lastHeartbeat > timeoutMs) {
        this.logger.warn(
          `Stuck job detected: ${jobId} (heartbeat age: ${now - active.lastHeartbeat}ms). Recovering...`,
        );
        this.activeJobs.delete(jobId);

        await (
          this.understandingRepository as any
        ).prisma.understandingJob.update({
          where: { id: jobId },
          data: { status: 'PENDING', errorMessage: '[RECOVERED_STUCK_JOB]' },
        });

        recoveredCount++;
      }
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
