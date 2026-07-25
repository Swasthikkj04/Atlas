import { Injectable } from '@nestjs/common';
import { JobStatus, Severity } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class StatisticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkspaceStatistics(userId: string) {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalDomains,
      totalSnapshots,
      findingsGrouped,
      changesToday,
      changesWeek,
      changesMonth,
      changesTotal,
      verificationsToday,
      verificationsWeek,
      verificationsMonth,
      verificationsTotal,
      jobsCompleted,
      jobsRunning,
      jobsFailed,
    ] = await Promise.all([
      // Domains
      this.prisma.domain.count({ where: { userId } }),
      // Snapshots
      this.prisma.infrastructureSnapshot.count({
        where: { domain: { userId } },
      }),
      // Findings
      this.prisma.infrastructureFinding.groupBy({
        by: ['severity'],
        where: { snapshot: { domain: { userId } } },
        _count: { severity: true },
      }),
      // Changes
      this.prisma.changeHistory.count({
        where: { domain: { userId }, detectedAt: { gte: startOfToday } },
      }),
      this.prisma.changeHistory.count({
        where: { domain: { userId }, detectedAt: { gte: startOfWeek } },
      }),
      this.prisma.changeHistory.count({
        where: { domain: { userId }, detectedAt: { gte: startOfMonth } },
      }),
      this.prisma.changeHistory.count({
        where: { domain: { userId } },
      }),
      // Verifications
      this.prisma.infrastructureVerification.count({
        where: { domain: { userId }, createdAt: { gte: startOfToday } },
      }),
      this.prisma.infrastructureVerification.count({
        where: { domain: { userId }, createdAt: { gte: startOfWeek } },
      }),
      this.prisma.infrastructureVerification.count({
        where: { domain: { userId }, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.infrastructureVerification.count({
        where: { domain: { userId } },
      }),
      // Understanding jobs
      this.prisma.understandingJob.count({
        where: { domain: { userId }, status: JobStatus.COMPLETED },
      }),
      this.prisma.understandingJob.count({
        where: {
          domain: { userId },
          status: { in: [JobStatus.PENDING, JobStatus.RUNNING] },
        },
      }),
      this.prisma.understandingJob.count({
        where: { domain: { userId }, status: JobStatus.FAILED },
      }),
    ]);

    const findings = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
    };

    for (const group of findingsGrouped) {
      const count = group._count.severity;
      findings.total += count;
      switch (group.severity) {
        case Severity.CRITICAL:
          findings.critical = count;
          break;
        case Severity.HIGH:
          findings.high = count;
          break;
        case Severity.MEDIUM:
          findings.medium = count;
          break;
        case Severity.LOW:
          findings.low = count;
          break;
      }
    }

    const criticalDomains =
      findings.critical > 0 ? Math.min(totalDomains, findings.critical) : 0;
    const warningDomains =
      findings.high > 0
        ? Math.min(totalDomains - criticalDomains, findings.high)
        : 0;
    const healthyDomains = Math.max(
      0,
      totalDomains - criticalDomains - warningDomains,
    );

    return {
      domains: {
        total: totalDomains,
        healthy: healthyDomains,
        warning: warningDomains,
        critical: criticalDomains,
      },
      findings,
      changes: {
        today: changesToday,
        week: changesWeek,
        month: changesMonth,
        total: changesTotal,
      },
      verifications: {
        today: verificationsToday,
        week: verificationsWeek,
        month: verificationsMonth,
        total: verificationsTotal,
      },
      snapshots: {
        total: totalSnapshots,
      },
      understanding: {
        completed: jobsCompleted,
        running: jobsRunning,
        failed: jobsFailed,
      },
    };
  }
}
