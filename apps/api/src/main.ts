import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { StructuredLoggerService } from './infrastructure/logger/structured-logger.service';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(StructuredLoggerService);
  app.useLogger(logger);

  // Hardening: Disable X-Powered-By header at Express engine level
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  // Cookie Parser Middleware for HTTP-Only Session Cookies
  app.use(cookieParser());

  const config = app.get(ConfigService);
  const frontendUrl =
    config.get<string>('FRONTEND_URL') ||
    config.get<string>('APP_URL') ||
    'http://localhost:5173';

  // Enable CORS with Credentials for HTTP-Only Cookies
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:5173'],
    credentials: true,
  });

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
    .addCookieAuth('access_token')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Listen
  const port = config.get<number>('PORT') ?? 3000;

  await app.listen(port);

  Logger.log(`🚀 Atlas API running on http://localhost:${port}/api/v1`);
  Logger.log(
    `📚 Swagger documentation available at http://localhost:${port}/api/docs`,
  );
}

void bootstrap();
