import { PrismaClient } from '@prisma/client';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Infrastructure Explorer Platinum Certification Suite (E2E)', () => {
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
    it('GET /api/v1/explorer - should reject missing Authorization header (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/explorer')
        .expect(401);
    });

    it('GET /api/v1/explorer/:assetId - should reject missing Authorization header (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/explorer/ast-123')
        .expect(401);
    });

    it('GET /api/v1/explorer/:assetId - should reject tampered JWT (401)', async () => {
      const tamperedJwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.tampered_signature';
      await request(app.getHttpServer())
        .get('/api/v1/explorer/ast-123')
        .set('Authorization', `Bearer ${tamperedJwt}`)
        .expect(401);
    });
  });

  describe('2. Multi-Tenant Isolation & Knowledge Graph Validation', () => {
    let tokenA: string;
    let userAId: string;
    let tokenB: string;
    let userBId: string;
    let assetAId: string;

    beforeAll(async () => {
      // User A Setup
      const emailA = `explorer-tenant-a-${Date.now()}@atlas.local`;
      const passA = 'Password123!';
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: emailA, password: passA, fullName: 'Explorer Tenant A' });
      const loginA = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: emailA, password: passA });
      tokenA = loginA.body.accessToken;
      userAId = loginA.body.user.id;

      // User B Setup
      const emailB = `explorer-tenant-b-${Date.now()}@atlas.local`;
      const passB = 'Password123!';
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: emailB, password: passB, fullName: 'Explorer Tenant B' });
      const loginB = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: emailB, password: passB });
      tokenB = loginB.body.accessToken;
      userBId = loginB.body.user.id;

      // Create Domain, Job, Snapshot for User A
      const domainA = await prisma.domain.create({
        data: { userId: userAId, domainName: 'tenant-a-explorer.internal', monitoringEnabled: true },
      });
      const jobA = await prisma.understandingJob.create({
        data: { domainId: domainA.id, status: 'COMPLETED', trigger: 'MANUAL', completedAt: new Date() },
      });
      await prisma.infrastructureSnapshot.create({
        data: {
          domainId: domainA.id,
          jobId: jobA.id,
          responseTimeMs: 76,
          httpStatus: 200,
          payload: { webServer: 'nginx/1.24.0', technologies: ['React'], ipv4Addresses: ['10.10.1.1'] },
        },
      });

      assetAId = `dom-${domainA.id}`;
    });

    it('GET /api/v1/explorer - User A retrieves their assets inventory', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/explorer')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/explorer - User B receives zero Tenant A assets (Zero Cross-Tenant Leakage)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/explorer')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it('GET /api/v1/explorer/:assetId - User B requesting User A asset returns 404', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/explorer/${assetAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('GET /api/v1/explorer/:assetId - User A retrieves deep Knowledge Graph & evidence lineage', async () => {
      const start = Date.now();
      const response = await request(app.getHttpServer())
        .get(`/api/v1/explorer/${assetAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      const latency = Date.now() - start;

      console.log(`[PERF BENCHMARK] Asset Details API Latency: ${latency}ms (Target ≤ 75ms: ${latency <= 75 ? 'PASS' : 'WARN'})`);

      expect(response.body).toHaveProperty('asset');
      expect(response.body).toHaveProperty('historicalPresence');
      expect(response.body).toHaveProperty('evidence');
      expect(response.body).toHaveProperty('relationships');
      expect(response.body.relationships.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/explorer - Performance latency target ≤ 100 ms', async () => {
      const iterations = 5;
      const latencies: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app.getHttpServer())
          .get('/api/v1/explorer?limit=10')
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200);
        latencies.push(Date.now() - start);
      }

      const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
      console.log(`[PERF BENCHMARK] Explorer API Latency: ${avgLatency.toFixed(2)}ms across ${iterations} runs`);
      expect(avgLatency).toBeLessThan(100);
    });
  });
});
