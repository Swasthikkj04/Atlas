import { JobStatus, TriggerType } from '@prisma/client';
import { UnderstandingRepository } from './repositories/understanding.repository';
import {
  FailureCategory,
  WorkerReliabilityService,
} from './services/worker-reliability.service';

describe('REFINEMENT-004: Worker Reliability, Distributed Leases & Crash Recovery', () => {
  let repository: UnderstandingRepository;
  let mockPrisma: any;
  let reliabilityService: WorkerReliabilityService;
  let mockMetricsService: any;

  beforeEach(() => {
    mockPrisma = {
      understandingJob: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      infrastructureSnapshot: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    mockMetricsService = {
      recordWorkerJob: jest.fn(),
    };

    repository = new UnderstandingRepository(mockPrisma);
    reliabilityService = new WorkerReliabilityService(
      repository,
      mockMetricsService,
    );
  });

  describe('1. Atomic Job Claiming & Leases', () => {
    it('should atomically claim a pending job with a 60s lease', async () => {
      mockPrisma.understandingJob.updateMany.mockResolvedValue({ count: 1 });

      const claimed = await repository.claimJob('job_123', 'worker_A', 60000);

      expect(claimed).toBe(true);
      expect(mockPrisma.understandingJob.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'job_123',
          OR: [
            { status: JobStatus.PENDING },
            {
              status: JobStatus.RUNNING,
              leaseUntil: { lt: expect.any(Date) },
            },
          ],
        },
        data: expect.objectContaining({
          status: JobStatus.RUNNING,
          workerId: 'worker_A',
          startedAt: expect.any(Date),
          heartbeatAt: expect.any(Date),
          leaseUntil: expect.any(Date),
          attemptCount: { increment: 1 },
        }),
      });
    });

    it('should prevent Worker B from claiming when Worker A already owns an active lease', async () => {
      mockPrisma.understandingJob.updateMany.mockResolvedValue({ count: 0 });

      const claimed = await repository.claimJob('job_123', 'worker_B', 60000);

      expect(claimed).toBe(false);
    });
  });

  describe('2. Database-Backed Heartbeats', () => {
    it('should extend lease and update heartbeat in PostgreSQL', async () => {
      mockPrisma.understandingJob.updateMany.mockResolvedValue({ count: 1 });

      const updated = await repository.updateHeartbeat(
        'job_123',
        'worker_A',
        60000,
      );

      expect(updated).toBe(true);
      expect(mockPrisma.understandingJob.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'job_123',
          workerId: 'worker_A',
          status: JobStatus.RUNNING,
        },
        data: expect.objectContaining({
          heartbeatAt: expect.any(Date),
          leaseUntil: expect.any(Date),
        }),
      });
    });
  });

  describe('3. Stale Job Reconciliation (Crashed Worker Recovery)', () => {
    it('should discover stale jobs in PostgreSQL and schedule retry with exponential backoff', async () => {
      const now = new Date();
      mockPrisma.understandingJob.findMany.mockResolvedValue([
        {
          id: 'job_stale_1',
          domainId: 'domain_1',
          workerId: 'worker_dead_node',
          status: JobStatus.RUNNING,
          attemptCount: 1,
          maxAttempts: 3,
          durationMs: 400,
          leaseUntil: new Date(now.getTime() - 30000), // expired 30s ago
        },
      ]);

      mockPrisma.understandingJob.updateMany.mockResolvedValue({ count: 1 });

      const recovered = await reliabilityService.recoverStuckJobs(60000);

      expect(recovered).toBe(1);
      expect(mockPrisma.understandingJob.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'job_stale_1',
          status: JobStatus.RUNNING,
        },
        data: expect.objectContaining({
          status: JobStatus.PENDING,
          workerId: null,
          leaseUntil: null,
          nextRetryAt: expect.any(Date),
          errorMessage: expect.stringContaining('[STALE_JOB_RECOVERED]'),
        }),
      });
    });

    it('should mark stale jobs as FAILED when attemptCount >= maxAttempts', async () => {
      const now = new Date();
      mockPrisma.understandingJob.findMany.mockResolvedValue([
        {
          id: 'job_stale_exhausted',
          domainId: 'domain_1',
          workerId: 'worker_dead_node',
          status: JobStatus.RUNNING,
          attemptCount: 3,
          maxAttempts: 3,
          durationMs: 1200,
          leaseUntil: new Date(now.getTime() - 30000),
        },
      ]);

      mockPrisma.understandingJob.update.mockResolvedValue({});

      const recovered = await reliabilityService.recoverStuckJobs(60000);

      expect(recovered).toBe(1);
      expect(mockPrisma.understandingJob.update).toHaveBeenCalledWith({
        where: {
          id: 'job_stale_exhausted',
        },
        data: expect.objectContaining({
          status: JobStatus.FAILED,
          errorMessage: expect.stringContaining('[MAX_ATTEMPTS_EXCEEDED]'),
          leaseUntil: null,
          nextRetryAt: null,
        }),
      });
    });
  });

  describe('4. Failure Classification & Retry Semantics', () => {
    it('should classify transient DNS/network drop as retriable NETWORK failure', async () => {
      mockPrisma.understandingJob.findUnique.mockResolvedValue({
        id: 'job_net_fail',
        attemptCount: 1,
        maxAttempts: 3,
      });
      mockPrisma.understandingJob.updateMany.mockResolvedValue({ count: 1 });

      const result = await reliabilityService.handleJobFailure(
        'job_net_fail',
        new Error('ENOTFOUND domain.example.internal'),
        500,
      );

      expect(result.retried).toBe(true);
      expect(result.category).toBe(FailureCategory.NETWORK);
      expect(mockPrisma.understandingJob.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'job_net_fail',
          status: JobStatus.RUNNING,
        },
        data: expect.objectContaining({
          status: JobStatus.PENDING,
          errorMessage: expect.stringContaining('[RETRYING #2 - NETWORK]'),
        }),
      });
    });

    it('should classify domain validation failure as non-retriable VALIDATION failure', async () => {
      mockPrisma.understandingJob.findUnique.mockResolvedValue({
        id: 'job_val_fail',
        attemptCount: 1,
        maxAttempts: 3,
      });
      mockPrisma.understandingJob.update.mockResolvedValue({});

      const result = await reliabilityService.handleJobFailure(
        'job_val_fail',
        new Error('Invalid domain specified: Malformed characters'),
        50,
      );

      expect(result.retried).toBe(false);
      expect(result.category).toBe(FailureCategory.VALIDATION);
      expect(mockPrisma.understandingJob.update).toHaveBeenCalledWith({
        where: {
          id: 'job_val_fail',
        },
        data: expect.objectContaining({
          status: JobStatus.FAILED,
          errorMessage: expect.stringContaining(
            '[PERMANENT_FAILURE - VALIDATION]',
          ),
        }),
      });
    });
  });

  describe('5. Cancellation Safety', () => {
    it('should cancel active job and prevent stale reconciliation from resurrecting it', async () => {
      mockPrisma.understandingJob.updateMany.mockResolvedValue({ count: 1 });

      const cancelled = await repository.cancelJob('job_cancel_me', 'user_1');

      expect(cancelled).toBe(true);
      expect(mockPrisma.understandingJob.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'job_cancel_me',
          status: {
            in: [JobStatus.PENDING, JobStatus.RUNNING],
          },
          domain: { userId: 'user_1' },
        },
        data: expect.objectContaining({
          status: JobStatus.CANCELLED,
          errorMessage: expect.stringContaining('[USER_CANCELLED]'),
          leaseUntil: null,
          nextRetryAt: null,
        }),
      });
    });
  });

  describe('6. Polling & Next Claimable Job Order', () => {
    it('should prioritize pending jobs ready for execution based on startedAt asc', async () => {
      mockPrisma.understandingJob.findFirst.mockResolvedValue({
        id: 'job_next_1',
        status: JobStatus.PENDING,
      });

      const now = new Date();
      const job = await repository.findNextClaimableJob(now);

      expect(job?.id).toBe('job_next_1');
      expect(mockPrisma.understandingJob.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              status: JobStatus.PENDING,
              OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
            },
            {
              status: JobStatus.RUNNING,
              leaseUntil: { lt: now },
            },
          ],
        },
        orderBy: {
          startedAt: 'asc',
        },
      });
    });
  });
});
