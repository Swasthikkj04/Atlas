import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class InfrastructureBriefRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    data: Prisma.InfrastructureBriefCreateInput,
  ) {
    return this.prisma.infrastructureBrief.create({
      data,
    });
  }

  async findBySnapshot(snapshotId: string) {
    return this.prisma.infrastructureBrief.findUnique({
      where: {
        snapshotId,
      },
    });
  }
}