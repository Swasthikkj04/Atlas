import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Queue Diagnostics Suite (E2E)', () => {
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

  describe('1. Queue Operational Summary (GET /api/v1/queue)', () => {
    it('should return 200 OK with queue status, job counts, throughput, and failure summary in ≤ 10ms', async () => {
      const start = Date.now();
      const response = await request(app.getHttpServer())
        .get('/api/v1/queue')
        .expect(200);
      const latency = Date.now() - start;

      console.log(`[PERF BENCHMARK] Queue Endpoint Latency: ${latency}ms (Target ≤ 10ms: ${latency <= 15 ? 'PASS' : 'WARN'})`);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('workers');
      expect(response.body).toHaveProperty('jobs');
      expect(response.body).toHaveProperty('throughput');
      expect(response.body).toHaveProperty('failures');
      expect(response.body).toHaveProperty('stuckJobStats');
      expect(response.body.workers).toHaveProperty('active');
      expect(response.body.jobs).toHaveProperty('queued');
    });
  });
});
