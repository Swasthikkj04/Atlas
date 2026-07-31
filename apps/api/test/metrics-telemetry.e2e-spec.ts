import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Metrics & Telemetry Suite (E2E)', () => {
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

  describe('1. Prometheus Metrics Exposition (GET /api/v1/metrics)', () => {
    it('should return 200 OK with Prometheus exposition text format', async () => {
      // Send a request first so HTTP request metrics counter is populated
      await request(app.getHttpServer()).get('/api/v1/health/live').expect(200);

      const start = Date.now();
      const response = await request(app.getHttpServer())
        .get('/api/v1/metrics')
        .expect(200);
      const latency = Date.now() - start;

      console.log(
        `[PERF BENCHMARK] Metrics Endpoint Latency: ${latency}ms (Target ≤ 20ms: ${latency <= 20 ? 'PASS' : 'WARN'})`,
      );

      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('# HELP atlas_http_requests_total');
      expect(response.text).toContain(
        '# TYPE atlas_http_requests_total counter',
      );
      expect(response.text).toContain('atlas_process_heap_bytes');
    });

    it('should increment HTTP request counters when calling endpoints', async () => {
      // Trigger a request to /health/live
      await request(app.getHttpServer()).get('/api/v1/health/live').expect(200);

      // Scrape metrics
      const response = await request(app.getHttpServer())
        .get('/api/v1/metrics')
        .expect(200);

      expect(response.text).toContain(
        'atlas_http_requests_total{method="GET",route="/api/v1/health/live",status="200"}',
      );
    });
  });
});
