import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class InfrastructureSnapshotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.InfrastructureSnapshotCreateInput,
  ) {
    return this.prisma.infrastructureSnapshot.create({
      data,
    });
  }

  async findById(snapshotId: string) {
    return this.prisma.infrastructureSnapshot.findUnique({
      where: {
        id: snapshotId,
      },
    });
  }

  async findByDomain(
    domainId: string,
    page: number,
    limit: number,
  ) {
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

  async countByDomain(domainId: string) {
    return this.prisma.infrastructureSnapshot.count({
      where: {
        domainId,
      },
    });
  }
}