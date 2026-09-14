import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Rate Limiting & Abuse Protection Suite (E2E)', () => {
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

  describe('1. Rate Limit Response Headers (X-RateLimit-*)', () => {
    it('GET /api/v1/health - should attach X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
  });

  describe('2. Login Rate Limit Protection (POST /api/v1/auth/login)', () => {
    it('POST /api/v1/auth/login - should attach rate limit headers to authentication requests', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@atlas.local', password: 'Password123!' });

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(Number(response.headers['x-ratelimit-limit'])).toBe(10);
    });
  });

  describe('3. Guest Understand Rate Limit Protection (POST /api/v1/guest/understand)', () => {
    it('POST /api/v1/guest/understand - should attach IP-based rate limit headers for guest ingress', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/guest/understand')
        .send({ domain: 'stripe.com' });

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(Number(response.headers['x-ratelimit-limit'])).toBe(5);
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
  });
});
