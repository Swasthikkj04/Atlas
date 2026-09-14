import { ConfigService } from '@nestjs/config';
import { AdaptiveBackpressureService } from './adaptive-backpressure.service';

describe('AdaptiveBackpressureService', () => {
  let service: AdaptiveBackpressureService;
  let mockConfig: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockConfig = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'MAX_CONCURRENT_DISCOVERY_JOBS') return '10';
        if (key === 'BACKPRESSURE_THRESHOLD_RATIO') return '0.8'; // 80% saturation = 8 jobs
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    service = new AdaptiveBackpressureService(mockConfig);
  });

  afterEach(() => {
    service.reset();
  });

  describe('Job Tracking & Pressure Metrics', () => {
    it('tracks active jobs accurately', () => {
      expect(service.getActiveJobCount()).toBe(0);

      service.registerJobStart('job_1');
      service.registerJobStart('job_2');
      expect(service.getActiveJobCount()).toBe(2);

      service.registerJobEnd('job_1');
      expect(service.getActiveJobCount()).toBe(1);

      const metrics = service.getMetrics();
      expect(metrics.activeJobs).toBe(1);
      expect(metrics.maxCapacity).toBe(10);
      expect(metrics.pressureRatio).toBe(0.1);
    });
  });

  describe('Adaptive Throttling & Saturation Evaluation', () => {
    it('allows incoming understand requests when under saturation threshold', () => {
      // 5 active jobs out of 10 (50% < 80%)
      for (let i = 0; i < 5; i++) {
        service.registerJobStart(`job_${i}`);
      }

      const res = service.evaluateBackpressure('FREE', 'USER_UNDERSTAND');
      expect(res.shouldThrottle).toBe(false);
      expect(res.pressureRatio).toBe(0.5);
    });

    it('throttles FREE and GUEST understand requests when saturation threshold (80%) is reached', () => {
      // 8 active jobs out of 10 (80% >= 80%)
      for (let i = 0; i < 8; i++) {
        service.registerJobStart(`job_${i}`);
      }

      const guestRes = service.evaluateBackpressure(
        'GUEST',
        'GUEST_UNDERSTAND',
      );
      expect(guestRes.shouldThrottle).toBe(true);
      expect(guestRes.retryAfterSeconds).toBeGreaterThan(0);
      expect(guestRes.reason).toContain('saturated');

      const freeRes = service.evaluateBackpressure('FREE', 'USER_UNDERSTAND');
      expect(freeRes.shouldThrottle).toBe(true);
    });

    it('allows ENTERPRISE tier requests through during elevated pressure (higher tolerance)', () => {
      // 8 active jobs (80%) -> Throttles FREE (80%), but allows ENTERPRISE (95% threshold)
      for (let i = 0; i < 8; i++) {
        service.registerJobStart(`job_${i}`);
      }

      const enterpriseRes = service.evaluateBackpressure(
        'ENTERPRISE',
        'USER_UNDERSTAND',
      );
      expect(enterpriseRes.shouldThrottle).toBe(false);

      // Now fill to 10 (100%) -> Throttles ENTERPRISE too
      service.registerJobStart('job_8');
      service.registerJobStart('job_9');

      const maxEnterpriseRes = service.evaluateBackpressure(
        'ENTERPRISE',
        'USER_UNDERSTAND',
      );
      expect(maxEnterpriseRes.shouldThrottle).toBe(true);
    });

    it('does not throttle lightweight non-discovery requests (e.g. PUBLIC_DEFAULT, USER_READ_ONLY)', () => {
      // Saturated worker capacity
      for (let i = 0; i < 10; i++) {
        service.registerJobStart(`job_${i}`);
      }

      const readRes = service.evaluateBackpressure('FREE', 'USER_READ_ONLY');
      expect(readRes.shouldThrottle).toBe(false);
    });
  });
});
