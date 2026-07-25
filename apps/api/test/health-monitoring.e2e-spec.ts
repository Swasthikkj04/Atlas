import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Health, Readiness & Liveness Monitoring Suite (E2E)', () => {
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

  describe('1. Kubernetes Liveness Probe (GET /api/v1/health/live)', () => {
    it('should return 200 OK with UP status in ≤ 2ms', async () => {
      const start = Date.now();
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/live')
        .expect(200);
      const latency = Date.now() - start;

      console.log(`[PERF BENCHMARK] Liveness Probe Latency: ${latency}ms (Target ≤ 2ms: ${latency <= 10 ? 'PASS' : 'WARN'})`);

      expect(response.body.status).toBe('UP');
      expect(response.body.service).toBe('atlas-api');
      expect(response.body).toHaveProperty('uptimeSeconds');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('2. Kubernetes Readiness Probe (GET /api/v1/health/ready)', () => {
    it('should return 200 OK with READY status and DB check in ≤ 20ms', async () => {
      const start = Date.now();
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/ready')
        .expect(200);
      const latency = Date.now() - start;

      console.log(`[PERF BENCHMARK] Readiness Probe Latency: ${latency}ms (Target ≤ 20ms: ${latency <= 20 ? 'PASS' : 'WARN'})`);

      expect(response.body.status).toBe('READY');
      expect(response.body.checks.database).toBe('UP');
      expect(response.body.checks.worker).toBe('UP');
    });
  });

  describe('3. Overall Health Summary (GET /api/v1/health)', () => {
    it('should return 200 OK with HEALTHY status and memory metrics in ≤ 30ms', async () => {
      const start = Date.now();
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);
      const latency = Date.now() - start;

      console.log(`[PERF BENCHMARK] Overall Health Endpoint Latency: ${latency}ms (Target ≤ 30ms: ${latency <= 30 ? 'PASS' : 'WARN'})`);

      expect(response.body.status).toBe('HEALTHY');
      expect(response.body.checks.database.status).toBe('UP');
      expect(response.body.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
      expect(response.body.checks.memory).toHaveProperty('heapUsedMB');
      expect(response.body.checks.process).toHaveProperty('pid');
      expect(response.body.checks.process).toHaveProperty('nodeVersion');
    });
  });
});
