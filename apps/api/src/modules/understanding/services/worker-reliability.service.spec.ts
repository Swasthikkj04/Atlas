import { MetricsService } from '../../../infrastructure/metrics/metrics.service';
import {
  FailureCategory,
  WorkerReliabilityService,
} from './worker-reliability.service';

describe('WorkerReliabilityService', () => {
  let workerReliability: WorkerReliabilityService;
  let mockUnderstandingRepo: any;
  let mockMetricsService: any;

  beforeEach(() => {
    mockUnderstandingRepo = {
      findById: jest.fn().mockResolvedValue({
        id: 'job_1',
        attemptCount: 1,
        maxAttempts: 3,
        status: 'RUNNING',
      }),
      failJob: jest.fn().mockResolvedValue(undefined),
      claimJob: jest.fn().mockResolvedValue(true),
      updateHeartbeat: jest.fn().mockResolvedValue(true),
      scheduleRetry: jest.fn().mockResolvedValue(true),
      findStaleRunningJobs: jest.fn().mockResolvedValue([]),
    };

    mockMetricsService = {
      recordWorkerJob: jest.fn(),
    };

    workerReliability = new WorkerReliabilityService(
      mockUnderstandingRepo,
      mockMetricsService,
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

    it('should classify database connection drop as retriable DATABASE failures', () => {
      const err = new Error('Connection terminated unexpectedly');
      const classified = workerReliability.classifyError(err);

      expect(classified.category).toBe(FailureCategory.DATABASE);
      expect(classified.isRetriable).toBe(true);
    });
  });

  describe('2. Exponential Backoff Policy', () => {
    it('should calculate bounded exponential backoff delays (1s, 2s, 4s, 8s...)', () => {
      expect(workerReliability.getRetryDelayMs(1)).toBe(1000);
      expect(workerReliability.getRetryDelayMs(2)).toBe(2000);
      expect(workerReliability.getRetryDelayMs(3)).toBe(4000);
      expect(workerReliability.getRetryDelayMs(4)).toBe(8000);
      expect(workerReliability.getRetryDelayMs(10)).toBe(30000); // capped at maxMs
    });
  });

  describe('3. Database-Backed Heartbeat & Stale Job Detection', () => {
    it('should query stale jobs from database and schedule retry if attempts remain', async () => {
      mockUnderstandingRepo.findStaleRunningJobs.mockResolvedValue([
        {
          id: 'job_stuck_1',
          domainId: 'dom_1',
          workerId: 'worker_crashed_1',
          attemptCount: 1,
          maxAttempts: 3,
          durationMs: 500,
          leaseUntil: new Date(Date.now() - 10000),
        },
      ]);

      const recovered = await workerReliability.recoverStuckJobs(30000);

      expect(recovered).toBe(1);
      expect(mockUnderstandingRepo.scheduleRetry).toHaveBeenCalledWith(
        'job_stuck_1',
        expect.any(Date),
        expect.stringContaining('[STALE_JOB_RECOVERED]'),
      );
    });

    it('should mark job FAILED when stale job has exceeded max attempts', async () => {
      mockUnderstandingRepo.findStaleRunningJobs.mockResolvedValue([
        {
          id: 'job_stuck_exhausted',
          domainId: 'dom_1',
          workerId: 'worker_crashed_1',
          attemptCount: 3,
          maxAttempts: 3,
          durationMs: 500,
          leaseUntil: new Date(Date.now() - 10000),
        },
      ]);

      const recovered = await workerReliability.recoverStuckJobs(30000);

      expect(recovered).toBe(1);
      expect(mockUnderstandingRepo.failJob).toHaveBeenCalledWith(
        'job_stuck_exhausted',
        expect.stringContaining('[MAX_ATTEMPTS_EXCEEDED]'),
        500,
      );
    });
  });

  describe('4. Retry Lifecycle & Permanent Failure', () => {
    it('should schedule retry for retriable error under max retries', async () => {
      mockUnderstandingRepo.findById.mockResolvedValue({
        id: 'job_retry_1',
        attemptCount: 1,
        maxAttempts: 3,
      });

      const result = await workerReliability.handleJobFailure(
        'job_retry_1',
        new Error('ETIMEDOUT'),
        150,
      );

      expect(result.retried).toBe(true);
      expect(result.category).toBe(FailureCategory.NETWORK);
      expect(mockUnderstandingRepo.scheduleRetry).toHaveBeenCalledWith(
        'job_retry_1',
        expect.any(Date),
        expect.stringContaining('[RETRYING #2 - NETWORK]'),
      );
    });

    it('should transition to PERMANENT_FAILURE on non-retriable error', async () => {
      mockUnderstandingRepo.findById.mockResolvedValue({
        id: 'job_fail_1',
        attemptCount: 1,
        maxAttempts: 3,
      });

      const result = await workerReliability.handleJobFailure(
        'job_fail_1',
        new Error('Invalid domain specified'),
        100,
      );

      expect(result.retried).toBe(false);
      expect(result.category).toBe(FailureCategory.VALIDATION);
      expect(mockUnderstandingRepo.failJob).toHaveBeenCalledWith(
        'job_fail_1',
        expect.stringContaining('[PERMANENT_FAILURE - VALIDATION]'),
        100,
      );
    });

    it('should transition to FAILED when retriable error reaches max attempts', async () => {
      mockUnderstandingRepo.findById.mockResolvedValue({
        id: 'job_exhausted_1',
        attemptCount: 3,
        maxAttempts: 3,
      });

      const result = await workerReliability.handleJobFailure(
        'job_exhausted_1',
        new Error('ECONNREFUSED'),
        200,
      );

      expect(result.retried).toBe(false);
      expect(result.category).toBe(FailureCategory.NETWORK);
      expect(mockUnderstandingRepo.failJob).toHaveBeenCalledWith(
        'job_exhausted_1',
        expect.stringContaining('[MAX_ATTEMPTS_EXCEEDED]'),
        200,
      );
    });
  });
});
