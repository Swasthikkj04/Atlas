import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import { RequestContextStore } from '../logger/request-context.store';
import { StructuredLoggerService } from '../logger/structured-logger.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query'>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly slowQueryThresholdMs = 100;

  constructor(
    @Optional() private readonly metricsService?: MetricsService,
    @Optional() private readonly structuredLogger?: StructuredLoggerService,
  ) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
    } catch (err) {
      if (process.env.NODE_ENV === 'test') {
        this.logger.warn(
          `Prisma connection skipped in test environment: ${(err as Error).message}`,
        );
        return;
      }
      throw err;
    }

    this.$on('query', (e: Prisma.QueryEvent) => {
      const durationMs = e.duration;

      if (this.metricsService) {
        this.metricsService.recordDbQuery('prisma_query', durationMs / 1000);
      }

      if (durationMs >= this.slowQueryThresholdMs) {
        const correlationId = RequestContextStore.getCorrelationId();

        if (this.structuredLogger) {
          this.structuredLogger.warn(
            {
              event: 'db_slow_query',
              durationMs,
              thresholdMs: this.slowQueryThresholdMs,
              correlationId,
            },
            'PrismaService',
          );
        } else {
          this.logger.warn(
            `Slow query detected: query took ${durationMs}ms (threshold: ${this.slowQueryThresholdMs}ms, correlationId: ${correlationId})`,
          );
        }

        if (this.metricsService) {
          this.metricsService.recordDbSlowQuery('prisma', 'query');
        }
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
