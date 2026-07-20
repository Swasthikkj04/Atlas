import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class InfrastructureFindingRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createMany(data: any[]): Promise<void> {
    if (data.length === 0) {
      return;
    }

    await this.prisma.infrastructureFinding.createMany({
      data,
    });
  }
}