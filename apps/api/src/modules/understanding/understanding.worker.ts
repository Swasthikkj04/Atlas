import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { runWithCorrelationId } from '../../infrastructure/logger/background-job-context';
import { WorkerReliabilityService } from './services/worker-reliability.service';
import { UnderstandingService } from './understanding.service';

@Injectable()
export class UnderstandingWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UnderstandingWorker.name);
  private isPolling = true;

  constructor(
    private readonly understandingService: UnderstandingService,
    private readonly workerReliabilityService: WorkerReliabilityService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      'Understanding Worker started with reliability & idempotency engine.',
    );
    void this.startPolling();
  }

  onModuleDestroy(): void {
    this.isPolling = false;
  }

  private async startPolling(): Promise<void> {
    while (
      this.isPolling &&
      !this.workerReliabilityService.isShuttingDownState()
    ) {
      let currentJobId: string | null = null;
      let startedAt = 0;

      try {
        await this.workerReliabilityService.recoverStuckJobs(30000);

        const job = await this.understandingService.findNextPendingJob();

        if (!job) {
          this.logger.debug('No pending understanding jobs.');
        } else {
          const claimed = await this.understandingService.claimJob(job.id);

          if (!claimed) {
            this.logger.debug(`Job ${job.id} was already claimed.`);
          } else {
            currentJobId = job.id;
            startedAt = Date.now();

            const activeJob = this.workerReliabilityService.trackJobStart(
              currentJobId,
              job.domainId,
            );

            this.logger.log(
              `Claimed job: ${currentJobId} (correlationId=${activeJob.correlationId})`,
            );

            await runWithCorrelationId(
              activeJob.correlationId,
              currentJobId,
              async () => {
                this.workerReliabilityService.updateHeartbeat(currentJobId!);
                await this.understandingService.processJob(currentJobId!);
              },
            );

            const durationMs = Date.now() - startedAt;

            await this.understandingService.completeJob(
              currentJobId,
              durationMs,
            );

            this.workerReliabilityService.trackJobCompletion(currentJobId);

            this.logger.log(
              `Completed job: ${currentJobId} (${durationMs} ms)`,
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
            );
          } catch (cleanupError) {
            this.logger.error(
              `Failed to handle job ${currentJobId} failure.`,
              cleanupError instanceof Error
                ? cleanupError.stack
                : String(cleanupError),
            );
          }
        }

        this.logger.error(
          'Worker iteration failed.',
          error instanceof Error ? error.stack : String(error),
        );
      }

      await this.sleep(1000);
    }
  }

  private async sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
