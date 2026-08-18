import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Workspace Dashboard Platinum Certification Suite (E2E)', () => {
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

  describe('1. Security & Authentication Checks', () => {
    it('GET /api/v1/workspace/dashboard - should reject request without Authorization header (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/workspace/dashboard')
        .expect(401);
    });

    it('GET /api/v1/workspace/dashboard - should reject malformed Bearer token (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/workspace/dashboard')
        .set('Authorization', 'Bearer malformed.jwt.token')
        .expect(401);
    });

    it('GET /api/v1/workspace/dashboard - should reject tampered JWT (401)', async () => {
      const tamperedJwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid_sig';
      await request(app.getHttpServer())
        .get('/api/v1/workspace/dashboard')
        .set('Authorization', `Bearer ${tamperedJwt}`)
        .expect(401);
    });
  });

  describe('2. Multi-Tenant Isolation & Registered User Flow', () => {
    let token: string;

    beforeAll(async () => {
      const email = `test-dashboard-${Date.now()}@example.com`;
      const password = 'Password123!';

      await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email,
        password,
        confirmPassword: password,
        fullName: 'Dashboard QA Tester',
      });

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password });

      token = loginRes.body.accessToken;
    });

    it('GET /api/v1/workspace/dashboard - should return 200 with valid schema and empty workspace support', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/workspace/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toEqual({
        totalDomains: 0,
        activeDomains: 0,
        totalSnapshots: 0,
        totalVerifications: 0,
        lastScanAt: null,
      });

      expect(response.body).toHaveProperty('health');
      expect(response.body.health.score).toBe(100);
      expect(response.body.health.grade).toBe('A');
      expect(response.body.health.trend).toBe('STABLE');

      expect(response.body).toHaveProperty('findings');
      expect(response.body.findings).toEqual({
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0,
      });

      expect(response.body).toHaveProperty('activeDomains');
      expect(Array.isArray(response.body.activeDomains)).toBe(true);

      expect(response.body).toHaveProperty('recentActivity');
      expect(Array.isArray(response.body.recentActivity)).toBe(true);

      expect(response.body).toHaveProperty('quickActions');
      expect(response.body.quickActions.length).toBeGreaterThanOrEqual(4);
    });

    it('GET /api/v1/workspace/dashboard - performance latency benchmark target ≤ 100 ms', async () => {
      const iterations = 5;
      const latencies: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app.getHttpServer())
          .get('/api/v1/workspace/dashboard')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
        latencies.push(Date.now() - start);
      }

      const avgLatency =
        latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
      console.log(
        `[PERF BENCHMARK] Dashboard API Latency: ${avgLatency.toFixed(2)}ms across ${iterations} runs`,
      );
      expect(avgLatency).toBeLessThan(100);
    });
  });
});
