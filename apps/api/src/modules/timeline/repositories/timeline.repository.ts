import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TimelineQueryDto } from '../dto/timeline-query.dto';

export type ChangeHistoryWithDomain = Prisma.ChangeHistoryGetPayload<{
  include: {
    domain: {
      select: {
        domainName: true;
      };
    };
  };
}>;

@Injectable()
export class TimelineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTimelineChangeById(
    userId: string,
    id: string,
  ): Promise<ChangeHistoryWithDomain | null> {
    const sanitizedId = id.replace(/^(change|evt|verif|finding)-/, '');

    return await this.prisma.changeHistory.findFirst({
      where: {
        OR: [{ id }, { id: sanitizedId }],
        domain: {
          userId,
        },
      },
      include: {
        domain: {
          select: {
            domainName: true,
          },
        },
      },
    });
  }

  async findTimelineChanges(
    userId: string,
    query: TimelineQueryDto,
  ): Promise<{
    data: ChangeHistoryWithDomain[];
    pagination: {
      nextCursor: string | null;
      hasMore: boolean;
      limit: number;
    };
  }> {
    const where: Prisma.ChangeHistoryWhereInput = {
      domain: {
        userId,
      },
    };

    if (query.domainId) {
      where.domainId = query.domainId;
    }

    if (query.severity) {
      where.severity = query.severity;
    }

    if (query.module) {
      where.module = query.module;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.changeType) {
      where.changeType = query.changeType;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.detectedAt = {};
      if (query.startDate) {
        where.detectedAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.detectedAt.lte = new Date(query.endDate);
      }
    }

    const limit = query.limit || 20;
    const take = limit + 1;

    const findOptions: Prisma.ChangeHistoryFindManyArgs = {
      where,
      include: {
        domain: {
          select: {
            domainName: true,
          },
        },
      },
      orderBy: [{ detectedAt: 'desc' }, { id: 'desc' }],
      take,
    };

    if (query.cursor) {
      findOptions.cursor = { id: query.cursor };
      findOptions.skip = 1;
    }

    const records = (await this.prisma.changeHistory.findMany(
      findOptions,
    )) as ChangeHistoryWithDomain[];

    let hasMore = false;
    let nextCursor: string | null = null;

    if (records.length > limit) {
      hasMore = true;
      records.pop();
      nextCursor = records[records.length - 1]?.id ?? null;
    }

    return {
      data: records,
      pagination: {
        nextCursor,
        hasMore,
        limit,
      },
    };
  }

  async findSnapshotById(snapshotId: string) {
    if (!snapshotId) return null;
    return this.prisma.infrastructureSnapshot.findUnique({
      where: { id: snapshotId },
    });
  }

  async findFindingsBySnapshot(snapshotId: string) {
    if (!snapshotId) return [];
    return this.prisma.infrastructureFinding.findMany({
      where: { snapshotId },
    });
  }

  async findRawEvidenceByDomain(domainId: string) {
    if (!domainId) return [];
    return this.prisma.rawEvidence.findMany({
      where: { domainId },
      orderBy: { capturedAt: 'desc' },
      take: 10,
    });
  }
}
