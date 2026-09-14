import { BadRequestException, HttpException } from '@nestjs/common';
import {
  WorkspaceTierQuotaService,
  WORKSPACE_TIER_CONFIGS,
} from './workspace-tier-quota.service';

describe('WorkspaceTierQuotaService', () => {
  let service: WorkspaceTierQuotaService;

  beforeEach(() => {
    WorkspaceTierQuotaService.reset();
    service = new WorkspaceTierQuotaService();
  });

  describe('Domain Quota Enforcement', () => {
    it('allows domain addition within FREE tier limit (4 domains)', () => {
      expect(() => service.assertDomainQuota(0, 'FREE', 1)).not.toThrow();
      expect(() => service.assertDomainQuota(3, 'FREE', 1)).not.toThrow();
    });

    it('throws BadRequestException when FREE tier domain limit is exceeded', () => {
      expect(() => service.assertDomainQuota(4, 'FREE', 1)).toThrow(
        BadRequestException,
      );
    });

    it('allows up to 20 domains for PRO tier', () => {
      expect(() => service.assertDomainQuota(19, 'PRO', 1)).not.toThrow();
      expect(() => service.assertDomainQuota(20, 'PRO', 1)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('Scan Concurrency Enforcement', () => {
    it('allows 1 concurrent scan for FREE tier', () => {
      expect(() => service.assertScanConcurrency(0, 'FREE')).not.toThrow();
    });

    it('throws HttpException 429 when FREE tier has 1 active scan running', () => {
      expect(() => service.assertScanConcurrency(1, 'FREE')).toThrow(
        HttpException,
      );
    });

    it('allows up to 5 concurrent scans for PRO tier', () => {
      expect(() => service.assertScanConcurrency(4, 'PRO')).not.toThrow();
      expect(() => service.assertScanConcurrency(5, 'PRO')).toThrow(
        HttpException,
      );
    });
  });

  describe('Rate Limiting & Tier Headers', () => {
    it('returns rate limit headers and decrements remaining', () => {
      const res1 = service.evaluateRateLimit('usr-1', 'FREE');
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(59);
      expect(res1.headers['X-Workspace-Tier']).toBe('FREE');
      expect(res1.headers['X-RateLimit-Limit']).toBe('60');

      const res2 = service.evaluateRateLimit('usr-1', 'FREE');
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(58);
    });

    it('blocks request and sets Retry-After when rate limit is exceeded', () => {
      const config = WORKSPACE_TIER_CONFIGS.FREE;
      for (let i = 0; i < config.rateLimitPerMinute; i++) {
        service.evaluateRateLimit('usr-rate-test', 'FREE');
      }

      const blocked = service.evaluateRateLimit('usr-rate-test', 'FREE');
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.headers['Retry-After']).toBeDefined();
    });
  });
});
