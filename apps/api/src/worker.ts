import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrapWorker(): Promise<void> {
  const logger = new Logger('UnderstandingWorkerRuntime');
  logger.log(
    '🚀 Initializing Nebula Understanding Worker in standalone mode...',
  );

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.enableShutdownHooks();

  const shutdown = async (signal: string) => {
    logger.log(
      `Received ${signal}. Gracefully shutting down Understanding Worker...`,
    );
    try {
      await app.close();
      logger.log('Understanding Worker shutdown complete.');
      process.exit(0);
    } catch (err) {
      logger.error(
        `Error during graceful shutdown: ${(err as Error).message}`,
        (err as Error).stack,
      );
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  logger.log(
    '✅ Nebula Understanding Worker runtime is active and processing background jobs.',
  );
}

void bootstrapWorker();
