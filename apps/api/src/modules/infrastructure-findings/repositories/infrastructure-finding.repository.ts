import { Injectable } from '@nestjs/common';
import { Prisma, Severity } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { FindingsQueryDto } from '../dto/findings-query.dto';

export type FindingWithSnapshotAndDomain =
  Prisma.InfrastructureFindingGetPayload<{
    include: {
      snapshot: {
        include: {
          domain: {
            select: {
              domainName: true;
            };
          };
        };
      };
    };
  }>;

@Injectable()
export class InfrastructureFindingRepository {
  constructor(public readonly prisma: PrismaService) {}

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

  async findUserFindings(
    userId: string,
    query: FindingsQueryDto,
  ): Promise<{
    data: FindingWithSnapshotAndDomain[];
    total: number;
  }> {
    const where: Prisma.InfrastructureFindingWhereInput = {
      snapshot: {
        domain: {
          userId,
        },
      },
    };

    if (query.domainId) {
      where.snapshot = {
        ...(where.snapshot as Prisma.InfrastructureSnapshotWhereInput),
        domainId: query.domainId,
      };

      // P0 Freshness & Staleness Invariant (WX-1020):
      // When domainId is requested without an explicit snapshotId, scope to the latest verified snapshot
      // unless historical findings are explicitly requested (e.g. Memory tab).
      if (!query.snapshotId && !query.includeHistorical) {
        const latestSnapshot =
          await this.prisma.infrastructureSnapshot.findFirst({
            where: { domainId: query.domainId },
            orderBy: { createdAt: 'desc' },
            select: { id: true },
          });

        if (latestSnapshot) {
          where.snapshotId = latestSnapshot.id;
        } else {
          // No snapshot exists for this domain yet -> 0 current findings
          where.snapshotId = 'nonexistent-snapshot-boundary';
        }
      }
    }

    if (query.snapshotId) {
      where.snapshotId = query.snapshotId;
    }

    if (query.severity) {
      where.severity = query.severity;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [data, total] = await Promise.all([
      this.prisma.infrastructureFinding.findMany({
        where,
        include: {
          snapshot: {
            include: {
              domain: {
                select: {
                  domainName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.infrastructureFinding.count({ where }),
    ]);

    return {
      data: data,
      total,
    };
  }

  async findUserFindingById(
    userId: string,
    findingId: string,
  ): Promise<FindingWithSnapshotAndDomain | null> {
    const sanitizedId = findingId.replace(/^(find|finding)-/, '');

    return await this.prisma.infrastructureFinding.findFirst({
      where: {
        OR: [{ id: findingId }, { id: sanitizedId }],
        snapshot: {
          domain: {
            userId,
          },
        },
      },
      include: {
        snapshot: {
          include: {
            domain: {
              select: {
                domainName: true,
              },
            },
          },
        },
      },
    });
  }

  async findRawEvidenceForDomain(domainId: string) {
    if (!domainId) return [];
    return this.prisma.rawEvidence.findMany({
      where: { domainId },
      orderBy: { capturedAt: 'desc' },
      take: 10,
    });
  }

  async findTimelineForDomain(domainId: string) {
    if (!domainId) return [];
    return this.prisma.changeHistory.findMany({
      where: { domainId },
      orderBy: { detectedAt: 'desc' },
      take: 10,
    });
  }

  async findBySnapshot(snapshotId: string, page: number, limit: number) {
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

  async findBySnapshotForUser(
    snapshotId: string,
    userId: string,
    page: number,
    limit: number,
  ) {
    return this.prisma.infrastructureFinding.findMany({
      where: {
        snapshotId,
        snapshot: {
          domain: {
            userId,
          },
        },
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

  async countBySnapshotForUser(snapshotId: string, userId: string) {
    return this.prisma.infrastructureFinding.count({
      where: {
        snapshotId,
        snapshot: {
          domain: {
            userId,
          },
        },
      },
    });
  }

  async getSummaryByDomain(
    domainId: string,
    snapshotId?: string,
  ): Promise<{
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  }> {
    const whereClause: any = snapshotId
      ? { snapshotId }
      : {
          snapshot: {
            domainId,
          },
        };

    const [total, grouped] = await Promise.all([
      this.prisma.infrastructureFinding.count({
        where: whereClause,
      }),
      this.prisma.infrastructureFinding.groupBy({
        by: ['severity'],
        where: whereClause,
        _count: {
          severity: true,
        },
      }),
    ]);

    const summary = {
      total,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
    };

    for (const finding of grouped) {
      switch (finding.severity) {
        case Severity.CRITICAL:
          summary.critical = finding._count.severity;
          break;

        case Severity.HIGH:
          summary.high = finding._count.severity;
          break;

        case Severity.MEDIUM:
          summary.medium = finding._count.severity;
          break;

        case Severity.LOW:
          summary.low = finding._count.severity;
          break;

        case Severity.INFO:
          summary.informational = finding._count.severity;
          break;
      }
    }

    return summary;
  }

  async getSeveritySummaryByUser(userId: string): Promise<{
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  }> {
    const findings = await this.prisma.infrastructureFinding.groupBy({
      by: ['severity'],
      where: {
        snapshot: {
          domain: {
            userId,
          },
        },
      },
      _count: {
        severity: true,
      },
    });

    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
    };

    for (const finding of findings) {
      switch (finding.severity) {
        case Severity.CRITICAL:
          summary.critical = finding._count.severity;
          break;

        case Severity.HIGH:
          summary.high = finding._count.severity;
          break;

        case Severity.MEDIUM:
          summary.medium = finding._count.severity;
          break;

        case Severity.LOW:
          summary.low = finding._count.severity;
          break;

        case Severity.INFO:
          summary.informational = finding._count.severity;
          break;
      }
    }

    return summary;
  }

  async getWorkspaceFindingSummaryByUser(userId: string): Promise<{
    total: number;
    unresolved: number;
    resolved: number;
  }> {
    const total = await this.prisma.infrastructureFinding.count({
      where: {
        snapshot: {
          domain: {
            userId,
          },
        },
      },
    });

    return {
      total,
      unresolved: total,
      resolved: 0,
    };
  }
}
