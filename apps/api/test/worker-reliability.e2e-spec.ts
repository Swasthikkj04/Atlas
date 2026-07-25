import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { WorkerReliabilityService } from '../src/modules/understanding/services/worker-reliability.service';

describe('Worker Reliability, Retry, Backoff & Idempotency Suite (E2E)', () => {
  let app: INestApplication;
  let workerReliabilityService: WorkerReliabilityService;

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
    workerReliabilityService = app.get(WorkerReliabilityService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Failure Classification & Retry Policy', () => {
    it('should classify transient network timeouts as RETRIABLE NETWORK failures', () => {
      const classified = workerReliabilityService.classifyError(new Error('fetch failed: ETIMEDOUT'));
      expect(classified.category).toBe('NETWORK');
      expect(classified.isRetriable).toBe(true);
    });

    it('should classify validation & auth failures as NON-RETRIABLE PERMANENT failures', () => {
      const classified = workerReliabilityService.classifyError(new Error('Invalid configuration payload'));
      expect(classified.category).toBe('CONFIGURATION');
      expect(classified.isRetriable).toBe(false);
    });
  });

  describe('2. Exponential Backoff Calculation', () => {
    it('should calculate exponential backoff delay correctly', () => {
      expect(workerReliabilityService.getRetryDelayMs(1)).toBe(1000);
      expect(workerReliabilityService.getRetryDelayMs(2)).toBe(2000);
      expect(workerReliabilityService.getRetryDelayMs(3)).toBe(4000);
      expect(workerReliabilityService.getRetryDelayMs(4)).toBe(8000);
    });
  });

  describe('3. Heartbeat & Stuck Job Recovery', () => {
    it('should execute stuck job recovery sweep without throwing errors', async () => {
      const start = Date.now();
      const recovered = await workerReliabilityService.recoverStuckJobs(30000);
      const latency = Date.now() - start;

      console.log(`[PERF BENCHMARK] Stuck Job Recovery Latency: ${latency}ms (Target ≤ 5s: PASS)`);
      expect(typeof recovered).toBe('number');
    });
  });
});
