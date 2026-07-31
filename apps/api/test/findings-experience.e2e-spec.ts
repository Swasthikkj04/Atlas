import { PrismaClient } from '@prisma/client';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Findings Experience Platinum Certification Suite (E2E)', () => {
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
    it('GET /api/v1/findings - should reject missing Authorization header (401)', async () => {
      await request(app.getHttpServer()).get('/api/v1/findings').expect(401);
    });

    it('GET /api/v1/findings/:id - should reject missing Authorization header (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/findings/find-123')
        .expect(401);
    });

    it('GET /api/v1/findings/:id - should reject tampered JWT (401)', async () => {
      const tamperedJwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.tampered_signature';
      await request(app.getHttpServer())
        .get('/api/v1/findings/find-123')
        .set('Authorization', `Bearer ${tamperedJwt}`)
        .expect(401);
    });
  });

  describe('2. Multi-Tenant Isolation & Zero Leakage Execution', () => {
    let tokenA: string;
    let userAId: string;
    let tokenB: string;
    let userBId: string;
    let findingAId: string;

    beforeAll(async () => {
      // User A Setup
      const emailA = `findings-tenant-a-${Date.now()}@atlas.local`;
      const passA = 'Password123!';
      await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: emailA,
        password: passA,
        fullName: 'Findings Tenant A',
      });
      const loginA = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: emailA, password: passA });
      tokenA = loginA.body.accessToken;
      userAId = loginA.body.user.id;

      // User B Setup
      const emailB = `findings-tenant-b-${Date.now()}@atlas.local`;
      const passB = 'Password123!';
      await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: emailB,
        password: passB,
        fullName: 'Findings Tenant B',
      });
      const loginB = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: emailB, password: passB });
      tokenB = loginB.body.accessToken;
      userBId = loginB.body.user.id;

      // Create Domain, Snapshot, Raw Evidence, & Finding for User A
      const domainA = await prisma.domain.create({
        data: {
          userId: userAId,
          domainName: 'tenant-a-findings.internal',
          monitoringEnabled: true,
        },
      });
      const jobA = await prisma.understandingJob.create({
        data: {
          domainId: domainA.id,
          status: 'COMPLETED',
          trigger: 'MANUAL',
          completedAt: new Date(),
        },
      });
      const snapA = await prisma.infrastructureSnapshot.create({
        data: {
          domainId: domainA.id,
          jobId: jobA.id,
          responseTimeMs: 88,
          httpStatus: 200,
          payload: { webServer: 'nginx' },
        },
      });
      await prisma.rawEvidence.create({
        data: {
          domainId: domainA.id,
          snapshotId: snapA.id,
          collectorName: 'http-header-collector',
          collectorVersion: '1.0.0',
          category: 'HTTP_HEADERS',
          payloadType: 'HTTP_RESPONSE_HEADERS',
          target: 'https://tenant-a-findings.internal',
          payload: 'Server: nginx',
          sizeBytes: 128,
          hashSha256:
            'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
        },
      });
      const findingA = await prisma.infrastructureFinding.create({
        data: {
          snapshotId: snapA.id,
          ruleId: 'SEC-HSTS-01',
          module: 'HTTP',
          category: 'SECURITY_HEADER',
          severity: 'HIGH',
          title: 'Missing HSTS Response Header',
          description: 'The Strict-Transport-Security header is absent.',
        },
      });
      findingAId = findingA.id;
    });

    it('GET /api/v1/findings - User A retrieves their findings list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/findings')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].id).toBe(findingAId);
      expect(response.body.data[0].confidence).toBe('CERTAIN');
    });

    it('GET /api/v1/findings - User B receives empty findings (Zero Cross-Tenant Leakage)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/findings')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it('GET /api/v1/findings/:id - User B requesting User A finding returns 404', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/findings/${findingAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('GET /api/v1/findings/:id - User A retrieves complete explainability & evidence lineage', async () => {
      const start = Date.now();
      const response = await request(app.getHttpServer())
        .get(`/api/v1/findings/${findingAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      const latency = Date.now() - start;

      console.log(
        `[PERF BENCHMARK] Finding Details API Latency: ${latency}ms (Target ≤ 75ms: ${latency <= 75 ? 'PASS' : 'WARN'})`,
      );

      expect(response.body.id).toBe(findingAId);
      expect(response.body.title).toBe('Missing HSTS Response Header');
      expect(response.body.confidence).toBe('CERTAIN');
      expect(response.body.state).toBe('OPEN');

      expect(response.body).toHaveProperty('rule');
      expect(response.body.rule.ruleId).toBe('SEC-HSTS-01');

      expect(response.body).toHaveProperty('evidence');
      expect(response.body.evidence.length).toBeGreaterThanOrEqual(1);

      expect(response.body).toHaveProperty('recommendations');
      expect(response.body.recommendations.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/findings - Performance latency target ≤ 100 ms', async () => {
      const iterations = 5;
      const latencies: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app.getHttpServer())
          .get('/api/v1/findings?limit=10')
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200);
        latencies.push(Date.now() - start);
      }

      const avgLatency =
        latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
      console.log(
        `[PERF BENCHMARK] Findings List API Latency: ${avgLatency.toFixed(2)}ms across ${iterations} runs`,
      );
      expect(avgLatency).toBeLessThan(100);
    });
  });
});
