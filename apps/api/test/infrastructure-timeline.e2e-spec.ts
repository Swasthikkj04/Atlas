import { PrismaClient } from '@prisma/client';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Infrastructure Timeline Platinum Certification Suite (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
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
    await prisma.$disconnect();
    await app.close();
  });

  describe('1. Security & Authentication Checks', () => {
    it('GET /api/v1/timeline - should reject missing Authorization header (401)', async () => {
      await request(app.getHttpServer()).get('/api/v1/timeline').expect(401);
    });

    it('GET /api/v1/timeline/:id/details - should reject missing Authorization header (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/timeline/evt-123/details')
        .expect(401);
    });

    it('GET /api/v1/timeline/:id/details - should reject tampered JWT (401)', async () => {
      const tamperedJwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.tampered_signature';
      await request(app.getHttpServer())
        .get('/api/v1/timeline/evt-123/details')
        .set('Authorization', `Bearer ${tamperedJwt}`)
        .expect(401);
    });
  });

  describe('2. Multi-Tenant Isolation & Zero Leakage Execution', () => {
    let tokenA: string;
    let userAId: string;
    let tokenB: string;
    let userBId: string;
    let changeAId: string;

    beforeAll(async () => {
      // User A Setup
      const emailA = `timeline-tenant-a-${Date.now()}@atlas.local`;
      const passA = 'Password123!';
      const regA = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: emailA,
          password: passA,
          confirmPassword: passA,
          fullName: 'Tenant A Admin',
        });
      if (regA.body?.user?.id) {
        await prisma.user.update({
          where: { id: regA.body.user.id },
          data: { status: 'ACTIVE', emailVerifiedAt: new Date() },
        });
      }
      const loginA = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: emailA, password: passA });
      tokenA = loginA.body.accessToken;
      userAId = loginA.body.user.id;

      // User B Setup
      const emailB = `timeline-tenant-b-${Date.now()}@atlas.local`;
      const passB = 'Password123!';
      const regB = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: emailB,
          password: passB,
          confirmPassword: passB,
          fullName: 'Tenant B Admin',
        });
      if (regB.body?.user?.id) {
        await prisma.user.update({
          where: { id: regB.body.user.id },
          data: { status: 'ACTIVE', emailVerifiedAt: new Date() },
        });
      }
      const loginB = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: emailB, password: passB });
      tokenB = loginB.body.accessToken;
      userBId = loginB.body.user.id;

      // Create Domain, Job, Snapshots, & Change for Tenant A
      const domainA = await prisma.domain.create({
        data: {
          userId: userAId,
          domainName: 'tenant-a-timeline.internal',
          monitoringEnabled: true,
        },
      });

      const jobA1 = await prisma.understandingJob.create({
        data: {
          domainId: domainA.id,
          status: 'COMPLETED',
          trigger: 'MANUAL',
          completedAt: new Date(Date.now() - 3600000),
        },
      });
      const snapA1 = await prisma.infrastructureSnapshot.create({
        data: {
          domainId: domainA.id,
          jobId: jobA1.id,
          responseTimeMs: 95,
          httpStatus: 200,
          payload: {
            webServer: 'apache/2.4',
            technologies: ['PHP'],
            ipv4Addresses: ['10.0.0.1'],
          },
        },
      });

      const jobA2 = await prisma.understandingJob.create({
        data: {
          domainId: domainA.id,
          status: 'COMPLETED',
          trigger: 'MANUAL',
          completedAt: new Date(),
        },
      });
      const snapA2 = await prisma.infrastructureSnapshot.create({
        data: {
          domainId: domainA.id,
          jobId: jobA2.id,
          responseTimeMs: 80,
          httpStatus: 200,
          payload: {
            webServer: 'nginx/1.24.0',
            technologies: ['PHP', 'React'],
            ipv4Addresses: ['10.0.0.1', '10.0.0.2'],
            headers: { 'strict-transport-security': 'max-age=31536000' },
          },
        },
      });

      const changeRecordA = await prisma.changeHistory.create({
        data: {
          domainId: domainA.id,
          previousSnapshotId: snapA1.id,
          currentSnapshotId: snapA2.id,
          module: 'HTTP',
          category: 'SECURITY_HEADER',
          changeType: 'ADDED',
          severity: 'HIGH',
          title: 'Strict-Transport-Security header added',
          description: 'HSTS response header introduced to enforce HTTPS.',
        },
      });
      changeAId = changeRecordA.id;
    });

    it('GET /api/v1/timeline - User A retrieves their timeline changes', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/timeline')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].id).toBe(changeAId);
      expect(response.body.data[0].title).toBe(
        'Strict-Transport-Security header added',
      );
    });

    it('GET /api/v1/timeline - User B retrieves empty timeline (Zero Cross-Tenant Leakage)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/timeline')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it('GET /api/v1/timeline/:id/details - User B requesting User A event returns 404', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/timeline/${changeAId}/details`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('GET /api/v1/timeline/:id/details - User A retrieves complete deep explainability & change diff', async () => {
      const start = Date.now();
      const response = await request(app.getHttpServer())
        .get(`/api/v1/timeline/${changeAId}/details`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      const latency = Date.now() - start;

      console.log(
        `[PERF BENCHMARK] Timeline Event Details API Latency: ${latency}ms (Target ≤ 75ms: ${latency <= 75 ? 'PASS' : 'WARN'})`,
      );

      expect(response.body).toHaveProperty('event');
      expect(response.body.event.id).toBe(changeAId);
      expect(response.body.event.summary).toBe(
        'HTTP Security Headers Improved',
      );

      expect(response.body).toHaveProperty('changeDiff');
      expect(response.body.changeDiff.technologies.added).toContain('React');
      expect(response.body.changeDiff.headers.added[0].name).toBe(
        'strict-transport-security',
      );

      expect(response.body).toHaveProperty('rule');
      expect(response.body.rule.ruleId).toBe('rule.http.security_header');
    });

    it('GET /api/v1/timeline - Performance latency target ≤ 100 ms', async () => {
      const iterations = 5;
      const latencies: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app.getHttpServer())
          .get('/api/v1/timeline?limit=10')
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200);
        latencies.push(Date.now() - start);
      }

      const avgLatency =
        latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
      console.log(
        `[PERF BENCHMARK] Timeline API Latency: ${avgLatency.toFixed(2)}ms across ${iterations} runs`,
      );
      expect(avgLatency).toBeLessThan(100);
    });
  });
});
