import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class InfrastructureSnapshotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.InfrastructureSnapshotCreateInput) {
    return this.prisma.infrastructureSnapshot.create({
      data,
    });
  }

  async findById(snapshotId: string) {
    return this.prisma.infrastructureSnapshot.findUnique({
      where: {
        id: snapshotId,
      },
      include: {
        domain: true,
      },
    });
  }

  async findByJobId(jobId: string) {
    return this.prisma.infrastructureSnapshot.findUnique({
      where: {
        jobId,
      },
      include: {
        domain: true,
      },
    });
  }

  async findByIdForUser(snapshotId: string, userId: string) {
    return this.prisma.infrastructureSnapshot.findFirst({
      where: {
        id: snapshotId,
        domain: {
          userId,
        },
      },
      include: {
        domain: true,
      },
    });
  }

  async findByDomain(domainId: string, page: number, limit: number) {
    return this.prisma.infrastructureSnapshot.findMany({
      where: {
        domainId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findByDomainForUser(
    domainId: string,
    userId: string,
    page: number,
    limit: number,
  ) {
    return this.prisma.infrastructureSnapshot.findMany({
      where: {
        domainId,
        domain: {
          userId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findLatestByDomain(domainId: string) {
    return this.prisma.infrastructureSnapshot.findFirst({
      where: {
        domainId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async countByDomain(domainId: string) {
    return this.prisma.infrastructureSnapshot.count({
      where: {
        domainId,
      },
    });
  }

  async countByDomainForUser(domainId: string, userId: string) {
    return this.prisma.infrastructureSnapshot.count({
      where: {
        domainId,
        domain: {
          userId,
        },
      },
    });
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.infrastructureSnapshot.count({
      where: {
        domain: {
          userId,
        },
      },
    });
  }

  async findLatestScanByUser(userId: string): Promise<Date | null> {
    const snapshot = await this.prisma.infrastructureSnapshot.findFirst({
      where: {
        domain: {
          userId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        createdAt: true,
      },
    });

    return snapshot?.createdAt ?? null;
  }
}
