import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class InfrastructureFindingRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createMany(
    data: Prisma.InfrastructureFindingCreateManyInput[],
  ): Promise<void> {
    if (data.length === 0) {
      return;
    }

    await this.prisma.infrastructureFinding.createMany({
      data,
    });
  }

  async findBySnapshot(
    snapshotId: string,
    page: number,
    limit: number,
  ) {
    return this.prisma.infrastructureFinding.findMany({
      where: {
        snapshotId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async countBySnapshot(snapshotId: string) {
    return this.prisma.infrastructureFinding.count({
      where: {
        snapshotId,
      },
    });
  }
}