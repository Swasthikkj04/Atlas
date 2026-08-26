import { Injectable } from '@nestjs/common';
import {
  DomainUnderstandingStatus,
  JobStatus,
  TriggerType,
  UnderstandingJob,
} from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class UnderstandingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    domainId: string;
    trigger: TriggerType;
    maxAttempts?: number;
  }): Promise<UnderstandingJob> {
    const job = await this.prisma.understandingJob.create({
      data: {
        domainId: data.domainId,
        trigger: data.trigger,
        maxAttempts: data.maxAttempts ?? 3,
        attemptCount: 0,
      },
    });

    await this.prisma.domain.update({
      where: { id: data.domainId },
      data: {
        understandingStatus: DomainUnderstandingStatus.UNDERSTANDING,
      },
    });

    return job;
  }

  async linkJobToSnapshot(jobId: string, snapshotId: string): Promise<void> {
    await this.prisma.infrastructureSnapshot.update({
      where: { id: snapshotId },
      data: {
        jobId,
      },
    });
  }

  async findActiveJobByDomain(
    domainId: string,
  ): Promise<UnderstandingJob | null> {
    return this.prisma.understandingJob.findFirst({
      where: {
        domainId,
        status: {
          in: [JobStatus.PENDING, JobStatus.RUNNING],
        },
      },
    });
  }

  async findById(id: string): Promise<UnderstandingJob | null> {
    return this.prisma.understandingJob.findUnique({
      where: { id },
    });
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<UnderstandingJob | null> {
    return this.prisma.understandingJob.findFirst({
      where: {
        id,
        domain: {
          userId,
        },
      },
    });
  }

  async findByIdWithDomain(jobId: string) {
    return this.prisma.understandingJob.findUnique({
      where: {
        id: jobId,
      },
      include: {
        domain: true,
      },
    });
  }

  async findByDomain(domainId: string): Promise<UnderstandingJob[]> {
    return this.prisma.understandingJob.findMany({
      where: { domainId },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  async findByDomainForUser(
    domainId: string,
    userId: string,
  ): Promise<UnderstandingJob[]> {
    return this.prisma.understandingJob.findMany({
      where: {
        domainId,
        domain: {
          userId,
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  /**
   * Finds the oldest claimable job:
   * 1. Status is PENDING and (nextRetryAt is null OR nextRetryAt <= now)
   * 2. Status is RUNNING and leaseUntil < now (stale crashed job)
   */
  async findNextClaimableJob(
    now: Date = new Date(),
  ): Promise<UnderstandingJob | null> {
    return this.prisma.understandingJob.findFirst({
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
  }

  /**
   * Atomically claims a job with a distributed database lease.
   * Succeeds only if the job is still PENDING, or is RUNNING with an expired lease.
   */
  async claimJob(
    jobId: string,
    workerId: string = 'worker_default',
    leaseDurationMs: number = 60000,
  ): Promise<boolean> {
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + leaseDurationMs);

    const result = await this.prisma.understandingJob.updateMany({
      where: {
        id: jobId,
        OR: [
          { status: JobStatus.PENDING },
          {
            status: JobStatus.RUNNING,
            leaseUntil: { lt: now },
          },
        ],
      },
      data: {
        status: JobStatus.RUNNING,
        workerId,
        startedAt: now,
        heartbeatAt: now,
        leaseUntil,
        attemptCount: { increment: 1 },
      },
    });

    return result.count === 1;
  }

  /**
   * Updates database heartbeat and extends the worker lease.
   */
  async updateHeartbeat(
    jobId: string,
    workerId: string,
    leaseExtensionMs: number = 60000,
  ): Promise<boolean> {
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + leaseExtensionMs);

    const result = await this.prisma.understandingJob.updateMany({
      where: {
        id: jobId,
        workerId,
        status: JobStatus.RUNNING,
      },
      data: {
        heartbeatAt: now,
        leaseUntil,
      },
    });

    return result.count === 1;
  }

  /**
   * Schedules a job for retry after backoff delay.
   */
  async scheduleRetry(
    jobId: string,
    nextRetryAt: Date,
    errorMessage: string,
  ): Promise<boolean> {
    const result = await this.prisma.understandingJob.updateMany({
      where: {
        id: jobId,
        status: JobStatus.RUNNING,
      },
      data: {
        status: JobStatus.PENDING,
        workerId: null,
        leaseUntil: null,
        nextRetryAt,
        errorMessage,
      },
    });

    return result.count === 1;
  }

  /**
   * Marks a job as completed and clears lease.
   */
  async completeJob(jobId: string, durationMs: number): Promise<void> {
    const completedAt = new Date();
    const job = await this.prisma.understandingJob.update({
      where: {
        id: jobId,
      },
      data: {
        status: JobStatus.COMPLETED,
        durationMs,
        completedAt,
        leaseUntil: null,
        nextRetryAt: null,
      },
    });

    try {
      await this.prisma.domain.update({
        where: { id: job.domainId },
        data: {
          lastUnderstoodAt: completedAt,
          understandingStatus: DomainUnderstandingStatus.IDLE,
        },
      });
    } catch {
      // Graceful fallback if domain deleted concurrently
    }
  }

  /**
   * Marks a job as permanently failed.
   */
  async failJob(
    jobId: string,
    errorMessage: string,
    durationMs: number,
  ): Promise<void> {
    const job = await this.prisma.understandingJob.update({
      where: {
        id: jobId,
      },
      data: {
        status: JobStatus.FAILED,
        errorMessage,
        durationMs,
        completedAt: new Date(),
        leaseUntil: null,
        nextRetryAt: null,
      },
    });

    try {
      await this.prisma.domain.update({
        where: { id: job.domainId },
        data: {
          understandingStatus: DomainUnderstandingStatus.FAILED,
        },
      });
    } catch {
      // Graceful fallback if domain deleted concurrently
    }
  }

  /**
   * Cancels a pending or running job.
   */
  async cancelJob(jobId: string, userId?: string): Promise<boolean> {
    const whereClause: any = {
      id: jobId,
      status: {
        in: [JobStatus.PENDING, JobStatus.RUNNING],
      },
    };

    if (userId) {
      whereClause.domain = { userId };
    }

    const result = await this.prisma.understandingJob.updateMany({
      where: whereClause,
      data: {
        status: JobStatus.CANCELLED,
        completedAt: new Date(),
        leaseUntil: null,
        nextRetryAt: null,
        errorMessage: '[USER_CANCELLED] Job was cancelled by user request.',
      },
    });

    return result.count === 1;
  }

  /**
   * Finds running jobs whose leases have expired (crashed workers).
   */
  async findStaleRunningJobs(
    now: Date = new Date(),
    limit: number = 50,
  ): Promise<UnderstandingJob[]> {
    return this.prisma.understandingJob.findMany({
      where: {
        status: JobStatus.RUNNING,
        leaseUntil: {
          lt: now,
        },
      },
      take: limit,
      orderBy: {
        startedAt: 'asc',
      },
    });
  }

  async countRunningJobs(userId: string): Promise<number> {
    return this.prisma.understandingJob.count({
      where: {
        domain: {
          userId,
        },
        status: {
          in: [JobStatus.PENDING, JobStatus.RUNNING],
        },
      },
    });
  }
}
