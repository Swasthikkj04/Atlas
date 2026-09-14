import { ConfigService } from '@nestjs/config';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterService } from './rate-limiter.service';
import { RateLimiterGuard } from './rate-limiter.guard';
import { AdaptiveBackpressureService } from './services/adaptive-backpressure.service';
import { StructuredLoggerService } from '../logger/structured-logger.service';
import { MetricsService } from '../metrics/metrics.service';

describe('Distributed Rate Limiting & Sliding-Window Quota Engine', () => {
  let rateLimiterService: RateLimiterService;
  let backpressureService: AdaptiveBackpressureService;
  let guard: RateLimiterGuard;
  let reflector: Reflector;
  let structuredLogger: StructuredLoggerService;
  let metricsService: MetricsService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'RATE_LIMIT_ENABLED') return 'true';
        if (key === 'RATE_LIMIT_GLOBAL') return '100';
        if (key === 'RATE_LIMIT_WINDOW') return '60';
        if (key === 'MAX_CONCURRENT_DISCOVERY_JOBS') return '20';
        if (key === 'BACKPRESSURE_THRESHOLD_RATIO') return '0.8';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    backpressureService = new AdaptiveBackpressureService(configService);
    rateLimiterService = new RateLimiterService(
      configService,
      backpressureService,
    );

    reflector = new Reflector();
    structuredLogger = {
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    } as unknown as StructuredLoggerService;

    metricsService = {
      recordExplorerRequest: jest.fn(),
    } as unknown as MetricsService;

    guard = new RateLimiterGuard(
      reflector,
      rateLimiterService,
      structuredLogger,
      metricsService,
    );
  });

  afterEach(() => {
    rateLimiterService.clear();
    backpressureService.reset();
  });

  function createMockRequest(options: {
    ip?: string;
    path?: string;
    method?: string;
    user?: any;
    apiKey?: boolean;
    handlerMeta?: any;
  }): { context: ExecutionContext; headers: Record<string, string> } {
    const headers: Record<string, string> = {};
    const req: any = {
      originalUrl: options.path || '/api/v1/domains',
      method: options.method || 'GET',
      headers: {},
      ip: options.ip || '198.51.100.1',
      socket: { remoteAddress: options.ip || '198.51.100.1' },
      user: options.user,
      apiKey: options.apiKey,
      route: { path: options.path || '/api/v1/domains' },
    };

    const res: any = {
      setHeader: jest.fn((name: string, val: string) => {
        headers[name.toLowerCase()] = val;
      }),
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
      getHandler: () => () => {},
      getClass: () => class TestController {},
    } as unknown as ExecutionContext;

    if (options.handlerMeta !== undefined) {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === 'rate_limit_exempt') return false;
        return options.handlerMeta;
      });
    }

    return { context, headers };
  }

  describe('1. Multi-Tiered Quotas & Principal Isolation', () => {
    it('enforces GUEST tier quotas for guest understanding requests', () => {
      const ip = '198.51.100.50';
      const path = '/api/v1/guest/understand';

      // 3 guest understand requests allowed per hour
      for (let i = 0; i < 3; i++) {
        const { context, headers } = createMockRequest({
          ip,
          path,
          method: 'POST',
          user: { isGuest: true },
        });
        expect(guard.canActivate(context)).toBe(true);
        expect(headers['x-workspace-tier']).toBe('GUEST');
      }

      // 4th request is blocked with 429
      const { context, headers } = createMockRequest({
        ip,
        path,
        method: 'POST',
        user: { isGuest: true },
      });
      try {
        guard.canActivate(context);
        throw new Error('Should have thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect(headers['retry-after']).toBeDefined();
      }
    });

    it('enforces FREE workspace tier limits', () => {
      const userId = 'usr_free_1';
      const handlerMeta = { limit: 10, windowSeconds: 60 };

      for (let i = 0; i < 10; i++) {
        const { context, headers } = createMockRequest({
          ip: '198.51.100.60',
          path: '/api/v1/domains',
          user: { id: userId, tier: 'FREE' },
          handlerMeta,
        });
        expect(guard.canActivate(context)).toBe(true);
        expect(headers['x-workspace-tier']).toBe('FREE');
        expect(headers['x-ratelimit-remaining']).toBe(String(10 - 1 - i));
      }

      const { context } = createMockRequest({
        ip: '198.51.100.60',
        path: '/api/v1/domains',
        user: { id: userId, tier: 'FREE' },
        handlerMeta,
      });
      expect(() => guard.canActivate(context)).toThrow(HttpException);
    });

    it('attaches IETF RateLimit-* and Classic X-RateLimit-* headers', () => {
      const { context, headers } = createMockRequest({
        ip: '198.51.100.70',
        path: '/api/v1/domains',
        user: { id: 'usr_pro_1', tier: 'PRO' },
      });

      guard.canActivate(context);

      // Classic
      expect(headers['x-ratelimit-limit']).toBeDefined();
      expect(headers['x-ratelimit-remaining']).toBeDefined();
      expect(headers['x-ratelimit-reset']).toBeDefined();
      expect(headers['x-workspace-tier']).toBe('PRO');

      // IETF
      expect(headers['ratelimit-limit']).toBeDefined();
      expect(headers['ratelimit-remaining']).toBeDefined();
      expect(headers['ratelimit-reset']).toBeDefined();
      expect(headers['ratelimit-policy']).toBeDefined();
    });
  });

  describe('2. Fail-Closed Security for Critical Auth Endpoints', () => {
    it('fails closed and blocks requests when rate limiter storage fails on auth login', () => {
      rateLimiterService.setSimulatedFailure(true);

      const { context } = createMockRequest({
        ip: '198.51.100.80',
        path: '/api/v1/auth/login',
        method: 'POST',
      });

      try {
        guard.canActivate(context);
        throw new Error('Should have failed closed');
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect(err.getResponse()).toMatchObject({
          code: 'RATE_LIMIT_EXCEEDED',
          message: expect.stringContaining('fail-closed'),
        });
      }
    });
  });

  describe('3. Dynamic Adaptive Backpressure Integration', () => {
    it('blocks new understanding requests with BACKPRESSURE_SATURATED when discovery queue is overloaded', () => {
      // Saturate discovery queue (16 jobs = 80% of 20 max capacity)
      for (let i = 0; i < 16; i++) {
        backpressureService.registerJobStart(`heavy_job_${i}`);
      }

      const { context } = createMockRequest({
        ip: '198.51.100.90',
        path: '/api/v1/understand',
        method: 'POST',
        user: { id: 'usr_free_2', tier: 'FREE' },
      });

      try {
        guard.canActivate(context);
        throw new Error('Should have throttled on backpressure');
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect(err.getResponse()).toMatchObject({
          code: 'BACKPRESSURE_SATURATED',
          message: expect.stringContaining('capacity saturated'),
        });
      }
    });
  });
});
