import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TriggerType, UnderstandingJob } from '@prisma/client';

import { DomainsService } from '../domains/domains.service';
import { InfrastructureFindingService } from '../infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureSnapshotService } from '../infrastructure-snapshots/services/infrastructure-snapshot.service';

import { UnderstandingRepository } from './repositories/understanding.repository';
import { UnderstandingEngine } from './understanding.engine';

@Injectable()
export class UnderstandingService {
  constructor(
    private readonly understandingRepository: UnderstandingRepository,
    private readonly domainsService: DomainsService,
    private readonly snapshotService: InfrastructureSnapshotService,
    private readonly findingService: InfrastructureFindingService,
    private readonly understandingEngine: UnderstandingEngine,
  ) {}

  async create(
    userId: string,
    domainId: string,
    maxAttempts = 3,
  ): Promise<UnderstandingJob> {
    const domain = await (
      this.understandingRepository as any
    ).prisma.domain.findFirst({
      where: {
        id: domainId,
        userId,
      },
    });

    if (!domain) {
      throw new NotFoundException('Domain not found.');
    }

    const activeJob =
      await this.understandingRepository.findActiveJobByDomain(domainId);

    if (activeJob) {
      throw new ConflictException(
        'An understanding is already in progress for this domain.',
      );
    }

    return this.understandingRepository.create({
      domainId,
      trigger: TriggerType.MANUAL,
      maxAttempts,
    });
  }

  async findById(userId: string, jobId: string): Promise<UnderstandingJob> {
    const job = await this.understandingRepository.findByIdForUser(
      jobId,
      userId,
    );
    if (!job) {
      throw new NotFoundException('Job not found.');
    }

    return job;
  }

  async findByDomain(
    userId: string,
    domainId: string,
  ): Promise<UnderstandingJob[]> {
    const domain = await (
      this.understandingRepository as any
    ).prisma.domain.findFirst({
      where: {
        id: domainId,
        userId,
      },
    });

    if (!domain) {
      throw new NotFoundException('Domain not found.');
    }

    return this.understandingRepository.findByDomainForUser(domainId, userId);
  }

  async findNextPendingJob(now?: Date): Promise<UnderstandingJob | null> {
    return this.understandingRepository.findNextClaimableJob(now);
  }

  async claimJob(
    jobId: string,
    workerId: string = 'worker_default',
    leaseDurationMs: number = 60000,
  ): Promise<boolean> {
    return this.understandingRepository.claimJob(
      jobId,
      workerId,
      leaseDurationMs,
    );
  }

  async updateHeartbeat(
    jobId: string,
    workerId: string,
    leaseExtensionMs: number = 60000,
  ): Promise<boolean> {
    return this.understandingRepository.updateHeartbeat(
      jobId,
      workerId,
      leaseExtensionMs,
    );
  }

  async completeJob(jobId: string, durationMs: number): Promise<void> {
    await this.understandingRepository.completeJob(jobId, durationMs);
  }

  async failJob(
    jobId: string,
    errorMessage: string,
    durationMs: number,
  ): Promise<void> {
    await this.understandingRepository.failJob(jobId, errorMessage, durationMs);
  }

  async cancelJob(jobId: string, userId?: string): Promise<boolean> {
    return this.understandingRepository.cancelJob(jobId, userId);
  }

  async processJob(
    jobId: string,
    onProgress?: () => Promise<void>,
  ): Promise<void> {
    const job = await this.understandingRepository.findByIdWithDomain(jobId);

    if (!job) {
      throw new NotFoundException('Job not found.');
    }

    await this.understandingEngine.execute(
      job.id,
      job.domainId,
      job.domain.domainName,
      onProgress,
    );
  }

  async countRunningJobs(userId: string): Promise<number> {
    return this.understandingRepository.countRunningJobs(userId);
  }
}
