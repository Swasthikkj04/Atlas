import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

import { UnderstandingService } from './understanding.service';

@Injectable()
export class UnderstandingWorker implements OnModuleInit {
  private readonly logger = new Logger(
    UnderstandingWorker.name,
  );

  constructor(
    private readonly understandingService: UnderstandingService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      'Understanding Worker started.',
    );

    void this.startPolling();
  }

  private async startPolling(): Promise<void> {
    while (true) {
      let currentJobId: string | null = null;
      let startedAt = 0;

      try {
        const job =
          await this.understandingService.findNextPendingJob();

        if (!job) {
          this.logger.debug(
            'No pending understanding jobs.',
          );
        } else {
          const claimed =
            await this.understandingService.claimJob(job.id);

          if (!claimed) {
            this.logger.debug(
              `Job ${job.id} was already claimed.`,
            );
          } else {
            currentJobId = job.id;
            startedAt = Date.now();

            this.logger.log(
              `Claimed job: ${currentJobId}`,
            );

            await this.understandingService.processJob(currentJobId);

            const durationMs = Date.now() - startedAt;

            await this.understandingService.completeJob(
              currentJobId,
              durationMs,
            );

            this.logger.log(
              `Completed job: ${currentJobId} (${durationMs} ms)`,
            );
          }
        }
      } catch (error) {
        if (currentJobId) {
          const durationMs = Date.now() - startedAt;

          try {
            await this.understandingService.failJob(
              currentJobId,
              error instanceof Error ? error.message : 'Unknown error',
              durationMs,
            );
          } catch (cleanupError) {
            this.logger.error(
              `Failed to mark job ${currentJobId} as FAILED.`,
              cleanupError instanceof Error ? cleanupError.stack : String(cleanupError),
            );
          }
        }

        this.logger.error(
          'Worker iteration failed.',
          error instanceof Error ? error.stack : String(error),
        );
      }

      await this.sleep(5000);
    }
  }

  private async sleep(
    milliseconds: number,
  ): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, milliseconds),
    );
  }
}