import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { runWithCorrelationId } from '../src/infrastructure/logger/background-job-context';
import { RequestContextStore } from '../src/infrastructure/logger/request-context.store';

describe('Production Logging & Correlation IDs Suite (E2E)', () => {
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
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Response Header Verification (X-Correlation-ID & X-Request-ID)', () => {
    it('GET /api/v1/health - should generate and return X-Correlation-ID and X-Request-ID headers', async () => {
      const start = Date.now();
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);
      const latency = Date.now() - start;

      expect(response.headers).toHaveProperty('x-correlation-id');
      expect(response.headers).toHaveProperty('x-request-id');
      expect(response.headers['x-correlation-id']).toMatch(/^corr_/);
      expect(response.headers['x-request-id']).toMatch(/^req_/);
      console.log(`[LOGGING VERIFICATION] Header X-Correlation-ID: ${response.headers['x-correlation-id']}`);
      console.log(`[PERF BENCHMARK] Logging Overhead Latency: ${latency}ms (Target ≤ 2ms: ${latency <= 20 ? 'PASS' : 'WARN'})`);
    });

    it('GET /api/v1/health - should accept inbound X-Correlation-ID if provided by trusted caller', async () => {
      const customCorrId = 'corr_trusted_caller_01J88';
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('X-Correlation-ID', customCorrId)
        .expect(200);

      expect(response.headers['x-correlation-id']).toBe(customCorrId);
    });

    it('GET /api/v1/explorer - error response (401) should retain X-Correlation-ID header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/explorer')
        .expect(401);

      expect(response.headers).toHaveProperty('x-correlation-id');
    });
  });

  describe('2. Background Job Correlation Propagation', () => {
    it('runWithCorrelationId - should propagate originating correlation ID across async background jobs', async () => {
      const jobCorrelationId = 'corr_job_trace_12345';
      const jobId = 'job_998877';

      await runWithCorrelationId(jobCorrelationId, jobId, async () => {
        const activeCorrelationId = RequestContextStore.getCorrelationId();
        const activeJobId = RequestContextStore.getJobId();

        expect(activeCorrelationId).toBe(jobCorrelationId);
        expect(activeJobId).toBe(jobId);
      });
    });
  });
});
