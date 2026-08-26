import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const nodeEnv = config.get<string>('NODE_ENV') || 'development';
  const isProduction = nodeEnv === 'production';

  // 1. Explicit & Restrictive CORS Configuration
  const frontendUrl =
    config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  const customCorsOrigins = config.get<string>('CORS_ALLOWED_ORIGINS');

  const allowedOrigins: string[] = [frontendUrl];

  if (!isProduction) {
    allowedOrigins.push(
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
    );
  }

  if (customCorsOrigins) {
    const parsed = customCorsOrigins
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    allowedOrigins.push(...parsed);
  }

  // Deduplicate origins
  const uniqueAllowedOrigins = Array.from(new Set(allowedOrigins));

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile native clients, cURL, server-to-server)
      if (!origin) return callback(null, true);

      if (
        uniqueAllowedOrigins.includes(origin) ||
        (!isProduction && /^http:\/\/localhost:\d+$/.test(origin)) ||
        (!isProduction && /^http:\/\/127\.0\.0\.1:\d+$/.test(origin))
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `CORS Error: Origin '${origin}' is not permitted by CORS policy.`,
        ),
      );
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-csrf-token',
      'x-requested-with',
      'x-correlation-id',
      'x-request-id',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['X-Correlation-ID', 'X-Request-ID', 'Location'],
    maxAge: 86400, // 24h preflight cache
  });

  // 2. Cookie Parser
  app.use(cookieParser());

  // 3. API Global Prefix
  app.setGlobalPrefix('api/v1');

  // 4. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableShutdownHooks();

  // 5. Swagger Documentation Setup (only enabled in non-production or explicitly configured)
  if (!isProduction || config.get<string>('ENABLE_SWAGGER') === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Atlas API')
      .setDescription('Atlas Infrastructure Intelligence Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  // 6. Listen
  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);

  Logger.log(
    `🚀 Atlas API running in [${nodeEnv.toUpperCase()}] mode on http://localhost:${port}/api/v1`,
  );
  if (!isProduction || config.get<string>('ENABLE_SWAGGER') === 'true') {
    Logger.log(
      `📚 Swagger documentation available at http://localhost:${port}/api/docs`,
    );
  }
}

void bootstrap();
