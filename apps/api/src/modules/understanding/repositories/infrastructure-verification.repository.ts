import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class InfrastructureVerificationRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    data: Prisma.InfrastructureVerificationUncheckedCreateInput,
  ) {
    return this.prisma.infrastructureVerification.create({
      data,
    });
  }

  async findByJobId(jobId: string) {
    return this.prisma.infrastructureVerification.findFirst({
      where: {
        jobId,
      },
    });
  }

  async findLatestByDomain(
    domainId: string,
  ) {
    return this.prisma.infrastructureVerification.findFirst({
      where: {
        domainId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async countByDomain(domainId: string) {
    return this.prisma.infrastructureVerification.count({
      where: {
        domainId,
      },
    });
  }
}
