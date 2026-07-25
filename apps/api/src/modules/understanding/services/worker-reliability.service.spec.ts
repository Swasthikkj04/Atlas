import { MetricsService } from '../../../infrastructure/metrics/metrics.service';
import { FailureCategory, WorkerReliabilityService } from './worker-reliability.service';

describe('WorkerReliabilityService', () => {
  let workerReliability: WorkerReliabilityService;
  let mockUnderstandingRepo: any;
  let mockMetricsService: any;

  beforeEach(() => {
    mockUnderstandingRepo = {
      failJob: jest.fn().mockResolvedValue(undefined),
      claimJob: jest.fn().mockResolvedValue(true),
      prisma: {
        understandingJob: {
          update: jest.fn().mockResolvedValue({}),
        },
      },
    };

    mockMetricsService = {
      recordWorkerJob: jest.fn(),
    };

    workerReliability = new WorkerReliabilityService(
      mockUnderstandingRepo,
      mockMetricsService as unknown as MetricsService,
    );
  });

  describe('1. Failure Classification', () => {
    it('should classify network/timeout errors as retriable NETWORK failures', () => {
      const err = new Error('fetch failed: ETIMEDOUT');
      const classified = workerReliability.classifyError(err);

      expect(classified.category).toBe(FailureCategory.NETWORK);
      expect(classified.isRetriable).toBe(true);
    });

    it('should classify validation errors as non-retriable VALIDATION failures', () => {
      const err = new Error('Invalid domain specified');
      const classified = workerReliability.classifyError(err);

      expect(classified.category).toBe(FailureCategory.VALIDATION);
      expect(classified.isRetriable).toBe(false);
    });

    it('should classify configuration errors as non-retriable CONFIGURATION failures', () => {
      const err = new Error('Invalid configuration payload');
      const classified = workerReliability.classifyError(err);

      expect(classified.category).toBe(FailureCategory.CONFIGURATION);
      expect(classified.isRetriable).toBe(false);
    });
  });

  describe('2. Exponential Backoff Policy', () => {
    it('should calculate exponential backoff delays (1s, 2s, 4s, 8s...)', () => {
      expect(workerReliability.getRetryDelayMs(1)).toBe(1000);
      expect(workerReliability.getRetryDelayMs(2)).toBe(2000);
      expect(workerReliability.getRetryDelayMs(3)).toBe(4000);
      expect(workerReliability.getRetryDelayMs(4)).toBe(8000);
    });
  });

  describe('3. Heartbeat & Stuck Job Detection', () => {
    it('should detect stuck jobs without heartbeat and trigger recovery', async () => {
      workerReliability.trackJobStart('job_stuck_123', 'dom_456');

      // Manually aging the heartbeat to 35s ago
      const active = (workerReliability as any).activeJobs.get('job_stuck_123');
      active.lastHeartbeat = Date.now() - 35000;

      const recovered = await workerReliability.recoverStuckJobs(30000);

      expect(recovered).toBe(1);
      expect(mockUnderstandingRepo.prisma.understandingJob.update).toHaveBeenCalledWith({
        where: { id: 'job_stuck_123' },
        data: { status: 'PENDING', errorMessage: '[RECOVERED_STUCK_JOB]' },
      });
    });
  });

  describe('4. Retry Lifecycle & Permanent Failure', () => {
    it('should schedule retry for retriable error under max retries', async () => {
      workerReliability.trackJobStart('job_retry_1', 'dom_1');

      const result = await workerReliability.handleJobFailure('job_retry_1', new Error('ETIMEDOUT'), 150);

      expect(result.retried).toBe(true);
      expect(result.category).toBe(FailureCategory.NETWORK);
    });

    it('should transition to PERMANENT_FAILURE on non-retriable error', async () => {
      workerReliability.trackJobStart('job_fail_1', 'dom_1');

      const result = await workerReliability.handleJobFailure('job_fail_1', new Error('Invalid domain specified'), 100);

      expect(result.retried).toBe(false);
      expect(result.category).toBe(FailureCategory.VALIDATION);
      expect(mockUnderstandingRepo.failJob).toHaveBeenCalledWith(
        'job_fail_1',
        expect.stringContaining('[PERMANENT_FAILURE'),
        100,
      );
    });
  });
});
