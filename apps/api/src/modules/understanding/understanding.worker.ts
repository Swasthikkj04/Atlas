import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as os from 'os';
import * as crypto from 'crypto';
import { runWithCorrelationId } from '../../infrastructure/logger/background-job-context';
import { WorkerReliabilityService } from './services/worker-reliability.service';
import { UnderstandingService } from './understanding.service';

@Injectable()
export class UnderstandingWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UnderstandingWorker.name);
  private readonly workerId = `worker_${os.hostname()}_${process.pid}_${crypto.randomBytes(4).toString('hex')}`;
  private isPolling = true;
  private readonly leaseDurationMs = 60000; // 60s lease window

  constructor(
    private readonly understandingService: UnderstandingService,
    private readonly workerReliabilityService: WorkerReliabilityService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      `Understanding Worker [${this.workerId}] initialized. Performing startup recovery...`,
    );

    try {
      const recovered = await this.workerReliabilityService.recoverStuckJobs(
        this.leaseDurationMs,
      );
      if (recovered > 0) {
        this.logger.log(
          `Startup recovery completed: reconciled ${recovered} orphaned/stuck understanding job(s).`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Failed during startup stuck job recovery: ${(err as Error).message}`,
      );
    }

    void this.startPolling();
  }

  onModuleDestroy(): void {
    this.isPolling = false;
    this.logger.log(`Understanding Worker [${this.workerId}] shutting down.`);
  }

  getWorkerId(): string {
    return this.workerId;
  }

  private async startPolling(): Promise<void> {
    let iterationCount = 0;

    while (
      this.isPolling &&
      !this.workerReliabilityService.isShuttingDownState()
    ) {
      let currentJobId: string | null = null;
      let startedAt = 0;

      try {
        iterationCount++;

        // Periodically run database stale job reconciliation every 10 iterations (~10s)
        if (iterationCount % 10 === 0) {
          await this.workerReliabilityService.recoverStuckJobs(
            this.leaseDurationMs,
          );
        }

        const job = await this.understandingService.findNextPendingJob();

        if (!job) {
          this.logger.debug('No pending understanding jobs.');
        } else {
          const claimed = await this.understandingService.claimJob(
            job.id,
            this.workerId,
            this.leaseDurationMs,
          );

          if (!claimed) {
            this.logger.debug(
              `Job ${job.id} was already claimed by another worker or in active lease.`,
            );
          } else {
            currentJobId = job.id;
            startedAt = Date.now();
            const correlationId = `corr_${this.workerId}_${currentJobId}`;

            this.workerReliabilityService.trackJobStart(
              currentJobId,
              job.domainId,
              this.workerId,
              correlationId,
            );

            this.logger.log(
              `[JobClaimed] worker=${this.workerId} jobId=${currentJobId} domainId=${job.domainId} attempt=${job.attemptCount + 1}`,
            );

            await runWithCorrelationId(
              correlationId,
              currentJobId,
              async () => {
                await this.understandingService.processJob(
                  currentJobId!,
                  async () => {
                    // Periodic heartbeat callback invoked during discovery phases
                    await this.workerReliabilityService.updateHeartbeat(
                      currentJobId!,
                      this.workerId,
                      this.leaseDurationMs,
                    );
                  },
                );
              },
            );

            const durationMs = Date.now() - startedAt;

            await this.understandingService.completeJob(
              currentJobId,
              durationMs,
            );

            this.workerReliabilityService.trackJobCompletion(currentJobId);

            this.logger.log(
              `[JobCompleted] worker=${this.workerId} jobId=${currentJobId} durationMs=${durationMs}`,
            );
          }
        }
      } catch (error) {
        if (currentJobId) {
          const durationMs = Date.now() - startedAt;
          try {
            await this.workerReliabilityService.handleJobFailure(
              currentJobId,
              error,
              durationMs,
              this.workerId,
            );
          } catch (cleanupError) {
            this.logger.error(
              `Failed to handle job ${currentJobId} failure: ${(cleanupError as Error).message}`,
              (cleanupError as Error).stack,
            );
          }
        }

        this.logger.error(
          `Worker iteration failed: ${(error as Error).message}`,
          (error as Error).stack,
        );
      }

      await this.sleep(1000);
    }
  }

  private async sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
