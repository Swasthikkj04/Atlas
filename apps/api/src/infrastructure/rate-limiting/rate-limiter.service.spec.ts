import { ConfigService } from '@nestjs/config';
import { RateLimiterService } from './rate-limiter.service';

describe('RateLimiterService', () => {
  let rateLimiter: RateLimiterService;
  let mockConfig: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockConfig = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'RATE_LIMIT_ENABLED') return 'true';
        if (key === 'RATE_LIMIT_GLOBAL') return '5'; // 5 req limit for testing
        if (key === 'RATE_LIMIT_WINDOW') return '60';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    rateLimiter = new RateLimiterService(mockConfig);
  });

  describe('1. Sliding Window Quota Tracking', () => {
    it('should allow requests within limit and track remaining quota', () => {
      const key = 'test_ip_1';

      const res1 = rateLimiter.checkLimit(key);
      expect(res1.isBlocked).toBe(false);
      expect(res1.remaining).toBe(4);

      const res2 = rateLimiter.checkLimit(key);
      expect(res2.isBlocked).toBe(false);
      expect(res2.remaining).toBe(3);
    });

    it('should block requests when quota is exceeded and return Retry-After seconds', () => {
      const key = 'test_ip_2';

      // Exhaust limit of 5 requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit(key);
      }

      // 6th request should be blocked
      const blockedRes = rateLimiter.checkLimit(key);
      expect(blockedRes.isBlocked).toBe(true);
      expect(blockedRes.remaining).toBe(0);
      expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('should respect custom route-level limit override', () => {
      const key = 'test_login_key';
      const customLimit = 2; // Strict limit of 2 for login

      rateLimiter.checkLimit(key, customLimit, 900);
      rateLimiter.checkLimit(key, customLimit, 900);

      const blockedRes = rateLimiter.checkLimit(key, customLimit, 900);
      expect(blockedRes.isBlocked).toBe(true);
      expect(blockedRes.limit).toBe(2);
    });
  });
});
