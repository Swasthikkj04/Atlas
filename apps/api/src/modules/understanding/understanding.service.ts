import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TriggerType, UnderstandingJob } from '@prisma/client';

import { DomainsService } from '../domains/domains.service';

import { UnderstandingRepository } from './repositories/understanding.repository';

import { UnderstandingEngine } from './understanding.engine';

@Injectable()
export class UnderstandingService {
  constructor(
    private readonly understandingRepository: UnderstandingRepository,
    private readonly domainsService: DomainsService,
    private readonly understandingEngine: UnderstandingEngine,
  ) {}

  async create(
    userId: string,
    domainId: string,
  ): Promise<UnderstandingJob> {
    const domains = await this.domainsService.findByUser(userId);

    const domain = domains.find((d) => d.id === domainId);

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
    });
  }

  async findById(
    userId: string,
    jobId: string,
  ): Promise<UnderstandingJob> {
    const job = await this.understandingRepository.findById(jobId);
    if (!job) {
      throw new NotFoundException('Job not found.');
    }

    // Validate ownership through Domain
    const domains = await this.domainsService.findByUser(userId);
    const domain = domains.find((d) => d.id === job.domainId);
    if (!domain) {
      throw new NotFoundException('Job not found.');
    }

    return job;
  }

  async findByDomain(
    userId: string,
    domainId: string,
  ): Promise<UnderstandingJob[]> {
    // Validate ownership
    const domains = await this.domainsService.findByUser(userId);
    const domain = domains.find((d) => d.id === domainId);
    if (!domain) {
      throw new NotFoundException('Domain not found.');
    }

    return this.understandingRepository.findByDomain(domainId);
  }

  async findNextPendingJob(): Promise<UnderstandingJob | null> {
    return this.understandingRepository.findNextPendingJob();
  }

  async claimJob(jobId: string): Promise<boolean> {
    return this.understandingRepository.claimJob(jobId);
  }

  async completeJob(
    jobId: string,
    durationMs: number,
  ): Promise<void> {
    await this.understandingRepository.completeJob(
      jobId,
      durationMs,
    );
  }

  async failJob(
    jobId: string,
    errorMessage: string,
    durationMs: number,
  ): Promise<void> {
    await this.understandingRepository.failJob(
      jobId,
      errorMessage,
      durationMs,
    );
  }

  async processJob(jobId: string): Promise<void> {
    const job =
      await this.understandingRepository.findByIdWithDomain(jobId);

    if (!job) {
      throw new NotFoundException('Job not found.');
    }

    await this.understandingEngine.execute(
      job.id,
      job.domainId,
      job.domain.domainName,
    );
  }
}