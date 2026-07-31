import { Injectable } from '@nestjs/common';
import { JobStatus, TriggerType, UnderstandingJob } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class UnderstandingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    domainId: string;
    trigger: TriggerType;
  }): Promise<UnderstandingJob> {
    return this.prisma.understandingJob.create({
      data: {
        domainId: data.domainId,
        trigger: data.trigger,
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

  async findNextPendingJob(): Promise<UnderstandingJob | null> {
    return this.prisma.understandingJob.findFirst({
      where: {
        status: JobStatus.PENDING,
      },
      orderBy: {
        startedAt: 'asc',
      },
    });
  }

  async claimJob(jobId: string): Promise<boolean> {
    const result = await this.prisma.understandingJob.updateMany({
      where: {
        id: jobId,
        status: JobStatus.PENDING,
      },
      data: {
        status: JobStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    return result.count === 1;
  }

  async completeJob(jobId: string, durationMs: number): Promise<void> {
    await this.prisma.understandingJob.update({
      where: {
        id: jobId,
      },
      data: {
        status: JobStatus.COMPLETED,
        durationMs,
        completedAt: new Date(),
      },
    });
  }

  async failJob(
    jobId: string,
    errorMessage: string,
    durationMs: number,
  ): Promise<void> {
    await this.prisma.understandingJob.update({
      where: {
        id: jobId,
      },
      data: {
        status: JobStatus.FAILED,
        errorMessage,
        durationMs,
        completedAt: new Date(),
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
