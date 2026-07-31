import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { GuestCleanupService } from '../services/guest-cleanup.service';

@Injectable()
export class GuestCleanupWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GuestCleanupWorker.name);
  private isRunning = true;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor(private readonly cleanupService: GuestCleanupService) {}

  onModuleInit(): void {
    this.logger.log('Guest Cleanup Worker initialized with 24h retention policy.');
    // Run initial cleanup tick after boot delay, then every 60 minutes
    setTimeout(() => void this.executeCleanup(), 5000);
    this.intervalTimer = setInterval(
      () => void this.executeCleanup(),
      60 * 60 * 1000,
    );
  }

  onModuleDestroy(): void {
    this.isRunning = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  async executeCleanup(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.cleanupService.cleanupExpiredSessions();
    } catch (err: any) {
      this.logger.error(
        'Guest cleanup worker iteration failed:',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
