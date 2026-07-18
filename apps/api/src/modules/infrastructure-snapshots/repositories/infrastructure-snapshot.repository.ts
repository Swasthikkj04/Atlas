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
}