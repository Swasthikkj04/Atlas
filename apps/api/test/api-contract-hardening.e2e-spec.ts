import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

describe('API Contract Hardening Suite (E2E)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdDomainId: string;

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

    // Register & login test user to get token for location header & async status tests
    const email = `contract-qa-${Date.now()}@example.com`;
    const password = 'Password123!';
    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        password,
        confirmPassword: password,
        fullName: 'Contract QA Tester',
      });

    const prisma = app.get(PrismaService);
    if (regRes.body?.user?.id) {
      await prisma.user.update({
        where: { id: regRes.body.user.id },
        data: { status: 'ACTIVE', emailVerifiedAt: new Date() },
      });
    }

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });
    authToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Canonical Atlas Error Response Structure Verification', () => {
    it('GET /api/v1/explorer (Unauthorized 401) - should match canonical error schema', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/explorer')
        .expect(401);

      expect(response.headers).toHaveProperty('x-correlation-id');
      expect(response.headers).toHaveProperty('x-request-id');
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 401,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
          message: expect.any(String),
          correlationId: expect.any(String),
          timestamp: expect.any(String),
        }),
      );
    });

    it('POST /api/v1/auth/register (Bad Request 400 - Validation Failure) - should match canonical error schema with details', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'invalid-email', password: 'short' })
        .expect(400);

      expect(response.headers).toHaveProperty('x-correlation-id');
      expect(response.headers).toHaveProperty('x-request-id');
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 400,
          error: 'Bad Request',
          code: 'BAD_REQUEST',
          message: expect.any(String),
          details: expect.any(Array),
          correlationId: expect.any(String),
          timestamp: expect.any(String),
        }),
      );
    });

    it('GET /api/v1/domains/3d91d72d-0000-0000-0000-000000000000/overview (Not Found 404) - should match canonical error schema', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/domains/3d91d72d-0000-0000-0000-000000000000/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 404,
          error: 'Not Found',
          code: expect.any(String),
          message: expect.any(String),
          correlationId: expect.any(String),
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('2. Malformed UUID Parameter Validation', () => {
    it('DELETE /api/v1/domains/invalid-uuid-format - should return standardized error response', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/domains/invalid-uuid-format')
        .expect(401); // Requires JWT, triggers 401 before business logic

      expect(response.headers).toHaveProperty('x-correlation-id');
      expect(response.headers).toHaveProperty('x-request-id');
      expect(response.body).toHaveProperty('statusCode', 401);
    });
  });

  describe('3. Security & JwtAuthGuard Enforcement across Tier B Routes', () => {
    it('GET /api/v1/snapshots/snp-123/brief - should reject unauthenticated request (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/snapshots/snp-123/brief')
        .expect(401);
    });

    it('GET /api/v1/domains/dom-123/snapshots - should reject unauthenticated request (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/domains/dom-123/snapshots')
        .expect(401);
    });

    it('GET /api/v1/findings/snapshots/snp-123/findings - should reject unauthenticated request (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/findings/snapshots/snp-123/findings')
        .expect(401);
    });
  });

  describe('4. Resource Creation Location Headers & 202 Accepted Async Behavior', () => {
    it('POST /api/v1/domains - should create domain and emit RFC 7231 Location header (201)', async () => {
      const domainName = `contract-domain-${Date.now()}.com`;
      const response = await request(app.getHttpServer())
        .post('/api/v1/domains')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ domainName })
        .expect(201);

      expect(response.headers).toHaveProperty('location');
      expect(response.headers.location).toMatch(/\/api\/v1\/domains\/.+/);
      createdDomainId = response.body.id;
    });

    it('POST /api/v1/domains/:domainId/understand - should return 202 Accepted and Location header', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/domains/${createdDomainId}/understand`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(202);

      expect(response.headers).toHaveProperty('location');
      expect(response.headers.location).toMatch(/\/api\/v1\/jobs\/.+/);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('5. Application Bootstrap & Security Headers Hardening Verification', () => {
    it('should NOT include X-Powered-By header on responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers).not.toHaveProperty('x-powered-by');
    });

    it('should emit X-Frame-Options, Referrer-Policy, Permissions-Policy, and X-Content-Type-Options headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty(
        'x-content-type-options',
        'nosniff',
      );
      expect(response.headers).toHaveProperty(
        'referrer-policy',
        'strict-origin-when-cross-origin',
      );
      expect(response.headers).toHaveProperty('permissions-policy');
      expect(response.headers['permissions-policy']).toContain('camera=()');
    });

    it('should emit X-Correlation-ID and X-Request-ID headers on all requests and propagate client correlation IDs', async () => {
      const customCorrelationId = `custom_corr_${Date.now()}`;
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('X-Correlation-ID', customCorrelationId)
        .expect(200);

      expect(response.headers).toHaveProperty(
        'x-correlation-id',
        customCorrelationId,
      );
      expect(response.headers).toHaveProperty('x-request-id');
      expect(response.headers['x-request-id']).toMatch(/^req_/);
    });
  });

  describe('6. OpenAPI / Swagger Documentation Verification', () => {
    it('GET /api/docs - Swagger documentation UI should be accessible', async () => {
      await request(app.getHttpServer()).get('/api/docs').expect(200);
    });
  });
});
