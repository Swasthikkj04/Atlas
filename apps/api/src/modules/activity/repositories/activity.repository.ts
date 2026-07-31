import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ActivityQueryDto } from '../dto/activity-query.dto';

export interface RawActivityRecord {
  id: string;
  eventType: string;
  domainId: string;
  domainName: string;
  title: string;
  description: string;
  severity?: string;
  module?: string;
  category?: string;
  occurredAt: Date;
}

@Injectable()
export class ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActivityFeed(userId: string, query: ActivityQueryDto) {
    const userDomains = await this.prisma.domain.findMany({
      where: { userId },
      select: { id: true, domainName: true },
    });

    const domainMap = new Map<string, string>();
    userDomains.forEach((d) => domainMap.set(d.id, d.domainName));

    const domainIds = query.domainId
      ? userDomains.filter((d) => d.id === query.domainId).map((d) => d.id)
      : userDomains.map((d) => d.id);

    if (domainIds.length === 0) {
      return {
        data: [],
        pagination: {
          nextCursor: null,
          hasMore: false,
          limit: query.limit || 20,
        },
      };
    }

    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const [changes, verifications, jobs, findings] = await Promise.all([
      // 1. ChangeHistory (Timeline events)
      this.prisma.changeHistory.findMany({
        where: {
          domainId: { in: domainIds },
          ...(query.severity ? { severity: query.severity as any } : {}),
          ...(query.module ? { module: query.module as any } : {}),
          ...(startDate || endDate
            ? {
                detectedAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        orderBy: { detectedAt: 'desc' },
        take: 100,
      }),

      // 2. InfrastructureVerification
      this.prisma.infrastructureVerification.findMany({
        where: {
          domainId: { in: domainIds },
          ...(startDate || endDate
            ? {
                createdAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),

      // 3. UnderstandingJob
      this.prisma.understandingJob.findMany({
        where: {
          domainId: { in: domainIds },
          status: 'COMPLETED',
          ...(startDate || endDate
            ? {
                completedAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        orderBy: { completedAt: 'desc' },
        take: 100,
      }),

      // 4. InfrastructureFinding
      this.prisma.infrastructureFinding.findMany({
        where: {
          snapshot: { domainId: { in: domainIds } },
          ...(query.severity
            ? { severity: query.severity as any }
            : { severity: 'CRITICAL' }),
          ...(startDate || endDate
            ? {
                createdAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        include: {
          snapshot: { select: { domainId: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    const events: RawActivityRecord[] = [];

    // Map Changes
    for (const c of changes) {
      events.push({
        id: `change-${c.id}`,
        eventType: 'CHANGE_DETECTED',
        domainId: c.domainId,
        domainName: domainMap.get(c.domainId) || 'Unknown Domain',
        title: c.title,
        description: c.description,
        severity: c.severity,
        module: c.module,
        category: c.category,
        occurredAt: c.detectedAt,
      });
    }

    // Map Verifications
    for (const v of verifications) {
      const dName = domainMap.get(v.domainId) || 'Unknown Domain';
      events.push({
        id: `verif-${v.id}`,
        eventType: 'VERIFICATION_COMPLETED',
        domainId: v.domainId,
        domainName: dName,
        title: `Infrastructure verification completed for ${dName}`,
        description: v.changeDetected
          ? 'Infrastructure changes detected.'
          : 'No infrastructure changes detected.',
        occurredAt: v.completedAt || v.createdAt,
      });
    }

    // Map Jobs
    for (const j of jobs) {
      const dName = domainMap.get(j.domainId) || 'Unknown Domain';
      events.push({
        id: `job-${j.id}`,
        eventType: 'UNDERSTANDING_COMPLETED',
        domainId: j.domainId,
        domainName: dName,
        title: `Understanding scan completed for ${dName}`,
        description: `Trigger: ${j.trigger}`,
        occurredAt: j.completedAt || j.startedAt,
      });
    }

    // Map Findings
    for (const f of findings) {
      const dId = f.snapshot.domainId;
      const dName = domainMap.get(dId) || 'Unknown Domain';
      events.push({
        id: `finding-${f.id}`,
        eventType: 'CRITICAL_FINDING',
        domainId: dId,
        domainName: dName,
        title: f.title,
        description: f.description,
        severity: f.severity,
        category: f.category,
        occurredAt: f.createdAt,
      });
    }

    // Filter by eventType if specified
    let filtered = events;
    if (query.eventType) {
      filtered = filtered.filter((e) => e.eventType === query.eventType);
    }

    // Sort descending by occurredAt
    filtered.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

    // Apply cursor pagination
    const limit = query.limit || 20;
    let startIndex = 0;

    if (query.cursor) {
      const cursorIndex = filtered.findIndex((e) => e.id === query.cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const sliced = filtered.slice(startIndex, startIndex + limit + 1);
    const hasMore = sliced.length > limit;

    if (hasMore) {
      sliced.pop();
    }

    const nextCursor =
      hasMore && sliced.length > 0 ? sliced[sliced.length - 1].id : null;

    return {
      data: sliced,
      pagination: {
        nextCursor,
        hasMore,
        limit,
      },
    };
  }
}
