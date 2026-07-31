import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { InfrastructureVerificationRepository } from '../repositories/infrastructure-verification.repository';

@Injectable()
export class InfrastructureVerificationService {
  constructor(
    private readonly repository: InfrastructureVerificationRepository,
  ) {}

  async create(data: Prisma.InfrastructureVerificationUncheckedCreateInput) {
    return this.repository.create(data);
  }

  async getByJobId(jobId: string) {
    return this.repository.findByJobId(jobId);
  }

  async getLatestByDomain(domainId: string) {
    return this.repository.findLatestByDomain(domainId);
  }

  async countByDomain(domainId: string) {
    return this.repository.countByDomain(domainId);
  }
}
