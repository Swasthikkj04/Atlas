import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

interface CreateDomainData {
  userId: string;
  domainName: string;
}

@Injectable()
export class DomainsRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(data: CreateDomainData) {
    return this.prisma.domain.create({
      data,
    });
  }

  async findByUser(userId: string) {
    return this.prisma.domain.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByUserAndDomain(
    userId: string,
    domainName: string,
  ) {
    return this.prisma.domain.findFirst({
      where: {
        userId,
        domainName,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.domain.findUnique({
      where: {
        id,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.domain.delete({
      where: {
        id,
      },
    });
  }

  async countActiveByUser(
    userId: string,
  ): Promise<number> {
    return this.prisma.domain.count({
      where: {
        userId,
      },
    });
  }
}