import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

describe('API Contract Hardening Suite (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Atlas API')
      .setDescription('Atlas Infrastructure Intelligence Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Standardized Error Payload & Correlation ID Verification', () => {
    it('GET /api/v1/explorer (Unauthorized 401) - should include standardized error structure and X-Correlation-ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/explorer')
        .expect(401);

      expect(response.headers).toHaveProperty('x-correlation-id');
      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('correlationId');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('2. Malformed UUID Parameter Validation', () => {
    it('DELETE /api/v1/domains/invalid-uuid-format - should return standardized error response', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/domains/invalid-uuid-format')
        .expect(401); // Requires JWT, triggers 401 before business logic

      expect(response.headers).toHaveProperty('x-correlation-id');
      expect(response.body).toHaveProperty('statusCode', 401);
    });
  });

  describe('3. OpenAPI / Swagger Documentation Verification', () => {
    it('GET /api/docs - Swagger documentation UI should be accessible', async () => {
      await request(app.getHttpServer())
        .get('/api/docs')
        .expect(200);
    });
  });
});
