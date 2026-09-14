import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterGuard } from './rate-limiter.guard';
import { RateLimiterService } from './rate-limiter.service';
import { StructuredLoggerService } from '../logger/structured-logger.service';
import { MetricsService } from '../metrics/metrics.service';
import { ConfigService } from '@nestjs/config';

describe('RateLimiterGuard', () => {
  let guard: RateLimiterGuard;
  let reflector: Reflector;
  let rateLimiterService: RateLimiterService;
  let structuredLogger: StructuredLoggerService;
  let metricsService: MetricsService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    reflector = new Reflector();
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'RATE_LIMIT_ENABLED') return 'true';
        if (key === 'RATE_LIMIT_GLOBAL') return '120';
        if (key === 'RATE_LIMIT_WINDOW') return '60';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    rateLimiterService = new RateLimiterService(configService);
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

  function createMockContext(options: {
    ip?: string;
    forwardedFor?: string | string[];
    path?: string;
    handlerMeta?: any;
  }): { context: ExecutionContext; headers: Record<string, string> } {
    const headers: Record<string, string> = {};
    const req: any = {
      originalUrl: options.path || '/api/v1/guest/understand',
      headers: {
        'x-forwarded-for': options.forwardedFor,
      },
      ip: options.ip || '198.51.100.1',
      socket: { remoteAddress: options.ip || '198.51.100.1' },
      user: undefined,
      route: { path: '/guest/understand' },
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
      getClass: () => class GuestUnderstandingController {},
    } as unknown as ExecutionContext;

    if (options.handlerMeta) {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(options.handlerMeta);
    }

    return { context, headers };
  }

  describe('1. IP-Based Rate Limiting on Guest Understand (/api/v1/guest/understand)', () => {
    it('allows requests within the 5 requests/hour threshold for guest understand', () => {
      const handlerMeta = {
        limit: 5,
        windowSeconds: 3600,
        name: 'guest_understand',
      };

      for (let i = 1; i <= 5; i++) {
        const { context, headers } = createMockContext({
          ip: '203.0.113.10',
          path: '/api/v1/guest/understand',
          handlerMeta,
        });

        const allowed = guard.canActivate(context);
        expect(allowed).toBe(true);
        expect(headers['x-ratelimit-limit']).toBe('5');
        expect(headers['x-ratelimit-remaining']).toBe(String(5 - i));
      }
    });

    it('blocks the 6th request with 429 Too Many Requests and attaches Retry-After', () => {
      const handlerMeta = {
        limit: 5,
        windowSeconds: 3600,
        name: 'guest_understand',
      };
      const ip = '203.0.113.20';

      for (let i = 0; i < 5; i++) {
        const { context } = createMockContext({
          ip,
          path: '/api/v1/guest/understand',
          handlerMeta,
        });
        guard.canActivate(context);
      }

      const { context, headers } = createMockContext({
        ip,
        path: '/api/v1/guest/understand',
        handlerMeta,
      });

      try {
        guard.canActivate(context);
        fail('Expected HttpException 429');
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect(err.getResponse()).toMatchObject({
          statusCode: 429,
          error: 'Too Many Requests',
          code: 'RATE_LIMIT_EXCEEDED',
        });
        expect(headers['retry-after']).toBeDefined();
        expect(Number(headers['retry-after'])).toBeGreaterThan(0);
      }
    });

    it('maintains distinct rate limiting quotas for separate client IPs', () => {
      const handlerMeta = {
        limit: 2,
        windowSeconds: 3600,
        name: 'guest_understand',
      };

      // IP 1 uses all 2 tokens
      const { context: ctx1A } = createMockContext({
        ip: '1.1.1.1',
        handlerMeta,
      });
      const { context: ctx1B } = createMockContext({
        ip: '1.1.1.1',
        handlerMeta,
      });
      expect(guard.canActivate(ctx1A)).toBe(true);
      expect(guard.canActivate(ctx1B)).toBe(true);

      // IP 1 is blocked on 3rd request
      const { context: ctx1C } = createMockContext({
        ip: '1.1.1.1',
        handlerMeta,
      });
      expect(() => guard.canActivate(ctx1C)).toThrow(HttpException);

      // IP 2 is fresh and still allowed
      const { context: ctx2A, headers: h2A } = createMockContext({
        ip: '2.2.2.2',
        handlerMeta,
      });
      expect(guard.canActivate(ctx2A)).toBe(true);
      expect(h2A['x-ratelimit-remaining']).toBe('1');
    });

    it('correctly extracts origin client IP from multi-hop X-Forwarded-For header', () => {
      const handlerMeta = {
        limit: 1,
        windowSeconds: 3600,
        name: 'guest_understand',
      };

      // Attacker passes multiple IPs in header: client, proxy1, proxy2
      const { context: ctx1 } = createMockContext({
        forwardedFor: '198.51.100.99, 10.0.0.1, 172.16.0.1',
        handlerMeta,
      });
      expect(guard.canActivate(ctx1)).toBe(true);

      // Subsequent request with same origin IP but different proxy chain is blocked
      const { context: ctx2 } = createMockContext({
        forwardedFor: '198.51.100.99, 10.0.0.2',
        handlerMeta,
      });
      expect(() => guard.canActivate(ctx2)).toThrow(HttpException);
    });

    it('exempts internal health probes from rate limits', () => {
      const { context } = createMockContext({ path: '/api/v1/health/live' });
      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
