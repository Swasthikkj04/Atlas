import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { StructuredLoggerService } from './infrastructure/logger/structured-logger.service';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(StructuredLoggerService);
  app.useLogger(logger);

  const config = app.get(ConfigService);

  // Configuration
  app.enableCors();

  app.setGlobalPrefix('api/v1');

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableShutdownHooks();

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Atlas API')
    .setDescription('Atlas Infrastructure Intelligence Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Listen
  const port = config.get<number>('PORT') ?? 3000;

  await app.listen(port);

  Logger.log(
    `🚀 Atlas API running on http://localhost:${port}/api/v1`,
  );
  Logger.log(
    `📚 Swagger documentation available at http://localhost:${port}/api/docs`,
  );
}

void bootstrap();