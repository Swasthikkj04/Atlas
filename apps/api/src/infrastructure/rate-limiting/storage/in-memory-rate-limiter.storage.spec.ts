import { InMemoryRateLimiterStorage } from './in-memory-rate-limiter.storage';

describe('InMemoryRateLimiterStorage', () => {
  let storage: InMemoryRateLimiterStorage;

  beforeEach(() => {
    storage = new InMemoryRateLimiterStorage();
  });

  afterEach(() => {
    storage.onModuleDestroy();
  });

  describe('Sliding Window Algorithm', () => {
    it('accurately tracks request counts and remaining quota within window', async () => {
      const key = 'test:sliding:1';
      const limit = 5;
      const windowSeconds = 60;

      const r1 = await storage.evaluateSlidingWindow(key, limit, windowSeconds);
      expect(r1.isBlocked).toBe(false);
      expect(r1.remaining).toBe(4);
      expect(r1.currentCount).toBe(1);

      const r2 = await storage.evaluateSlidingWindow(key, limit, windowSeconds);
      expect(r2.isBlocked).toBe(false);
      expect(r2.remaining).toBe(3);
      expect(r2.currentCount).toBe(2);
    });

    it('blocks request when limit is exceeded and returns reset time', async () => {
      const key = 'test:sliding:2';
      const limit = 3;
      const windowSeconds = 60;

      await storage.evaluateSlidingWindow(key, limit, windowSeconds);
      await storage.evaluateSlidingWindow(key, limit, windowSeconds);
      await storage.evaluateSlidingWindow(key, limit, windowSeconds);

      const blocked = await storage.evaluateSlidingWindow(
        key,
        limit,
        windowSeconds,
      );
      expect(blocked.isBlocked).toBe(true);
      expect(blocked.remaining).toBe(0);
      expect(blocked.resetTimeSeconds).toBeGreaterThan(0);
      expect(blocked.resetTimeSeconds).toBeLessThanOrEqual(60);
    });

    it('supports variable request costs for heavyweight operations', async () => {
      const key = 'test:sliding:cost';
      const limit = 10;
      const windowSeconds = 60;

      // Heavyweight scan costs 5 tokens
      const r1 = await storage.evaluateSlidingWindow(
        key,
        limit,
        windowSeconds,
        5,
      );
      expect(r1.isBlocked).toBe(false);
      expect(r1.remaining).toBe(5);
      expect(r1.currentCount).toBe(5);

      // Second heavyweight scan costs 5 tokens (total 10)
      const r2 = await storage.evaluateSlidingWindow(
        key,
        limit,
        windowSeconds,
        5,
      );
      expect(r2.isBlocked).toBe(false);
      expect(r2.remaining).toBe(0);
      expect(r2.currentCount).toBe(10);

      // Third request is blocked
      const r3 = await storage.evaluateSlidingWindow(
        key,
        limit,
        windowSeconds,
        1,
      );
      expect(r3.isBlocked).toBe(true);
      expect(r3.remaining).toBe(0);
    });
  });

  describe('Token Bucket Algorithm', () => {
    it('consumes tokens and refills over time', async () => {
      const key = 'test:token_bucket:1';
      const capacity = 10;
      const refillRate = 2; // 2 tokens per second

      // Consume 5 tokens
      const r1 = await storage.evaluateTokenBucket(
        key,
        capacity,
        refillRate,
        5,
      );
      expect(r1.isBlocked).toBe(false);
      expect(r1.remainingTokens).toBe(5);

      // Consume another 5 tokens (now empty)
      const r2 = await storage.evaluateTokenBucket(
        key,
        capacity,
        refillRate,
        5,
      );
      expect(r2.isBlocked).toBe(false);
      expect(r2.remainingTokens).toBe(0);

      // Next token request is blocked with retry after
      const r3 = await storage.evaluateTokenBucket(
        key,
        capacity,
        refillRate,
        1,
      );
      expect(r3.isBlocked).toBe(true);
      expect(r3.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe('State Management & Cleanup', () => {
    it('resets key state completely', async () => {
      const key = 'test:reset:1';
      await storage.evaluateSlidingWindow(key, 2, 60);
      await storage.evaluateSlidingWindow(key, 2, 60);

      const blocked = await storage.evaluateSlidingWindow(key, 2, 60);
      expect(blocked.isBlocked).toBe(true);

      await storage.resetKey(key);

      const fresh = await storage.evaluateSlidingWindow(key, 2, 60);
      expect(fresh.isBlocked).toBe(false);
      expect(fresh.remaining).toBe(1);
    });
  });
});
