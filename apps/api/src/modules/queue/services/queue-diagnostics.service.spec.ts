import { MetricsService } from '../../../infrastructure/metrics/metrics.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { QueueDiagnosticsService } from './queue-diagnostics.service';

describe('QueueDiagnosticsService', () => {
  let queueService: QueueDiagnosticsService;
  let mockPrisma: any;
  let mockMetrics: any;

  beforeEach(() => {
    mockPrisma = {
      understandingJob: {
        count: jest.fn().mockImplementation(({ where }) => {
          if (where?.status === 'PENDING') return Promise.resolve(2);
          if (where?.status === 'RUNNING') return Promise.resolve(1);
          if (where?.status === 'COMPLETED') return Promise.resolve(100);
          if (where?.status === 'FAILED') return Promise.resolve(1);
          return Promise.resolve(0);
        }),
        findMany: jest.fn().mockResolvedValue([
          { status: 'COMPLETED', durationMs: 1100, errorMessage: null },
          {
            status: 'FAILED',
            durationMs: 500,
            errorMessage: '[PERMANENT_FAILURE - NETWORK] ETIMEDOUT',
          },
        ]),
      },
    };

    mockMetrics = {
      recordExplorerRequest: jest.fn(),
    };

    queueService = new QueueDiagnosticsService(mockPrisma, mockMetrics);
  });

  describe('1. Operational Queue Diagnostics (GET /queue)', () => {
    it('should aggregate job status counts, throughput, and failure classifications', async () => {
      const diag = await queueService.getQueueDiagnostics();

      expect(diag.status).toBe('HEALTHY');
      expect(diag.jobs.queued).toBe(2);
      expect(diag.jobs.running).toBe(1);
      expect(diag.jobs.completed).toBe(100);
      expect(diag.jobs.failed).toBe(1);
      expect(diag.failures.NETWORK).toBe(1);
      expect(diag.workers.active).toBe(1);
      expect(diag.workers.busy).toBe(1);
      expect(diag.throughput.avgProcessingTimeMs).toBe(1100);
    });

    it('should track stuck job detection and recovery statistics', async () => {
      queueService.recordStuckJobRecovery(2, 2);

      const diag = await queueService.getQueueDiagnostics();

      expect(diag.stuckJobStats.detected).toBe(2);
      expect(diag.stuckJobStats.recovered).toBe(2);
      expect(diag.stuckJobStats.recoverySuccessRate).toBe(1.0);
    });
  });
});
