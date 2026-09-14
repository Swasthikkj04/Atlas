import { Injectable } from '@nestjs/common';
import { ChangeSeverity, JobStatus, Severity } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { DomainsService } from '../../domains/domains.service';
import { InfrastructureFindingService } from '../../infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureSnapshotService } from '../../infrastructure-snapshots/services/infrastructure-snapshot.service';
import { UnderstandingService } from '../../understanding/understanding.service';

import { AttentionDomainDto } from '../dto/attention-domain.dto';
import { CriticalFindingDto } from '../dto/critical-finding.dto';
import { DomainSummaryDto } from '../dto/domain-summary.dto';
import { RecentActivityDto } from '../dto/recent-activity.dto';
import { RecentChangeDto } from '../dto/recent-change.dto';
import { RecentDomainDto } from '../dto/recent-domain.dto';
import { WorkspaceFindingsDto } from '../dto/workspace-findings.dto';
import { WorkspaceHealthDto } from '../dto/workspace-health.dto';
import { WorkspaceSummaryDto } from '../dto/workspace-summary.dto';

@Injectable()
export class WorkspaceQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly domainsService: DomainsService,
    private readonly infrastructureSnapshotService: InfrastructureSnapshotService,
    private readonly infrastructureFindingService: InfrastructureFindingService,
    private readonly understandingService: UnderstandingService,
  ) {}

  async buildSummary(userId: string): Promise<WorkspaceSummaryDto> {
    const [
      totalDomains,
      activeDomains,
      totalSnapshots,
      totalVerifications,
      latestScan,
      runningJobs,
      totalFindings,
    ] = await Promise.all([
      this.prisma.domain.count({ where: { userId } }),
      this.prisma.domain.count({ where: { userId, monitoringEnabled: true } }),
      this.prisma.infrastructureSnapshot.count({
        where: { domain: { userId } },
      }),
      this.prisma.infrastructureVerification.count({
        where: { domain: { userId } },
      }),
      this.prisma.infrastructureSnapshot.findFirst({
        where: { domain: { userId } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      this.prisma.understandingJob.count({
        where: {
          domain: { userId },
          status: { in: [JobStatus.PENDING, JobStatus.RUNNING] },
        },
      }),
      this.prisma.infrastructureFinding.count({
        where: { snapshot: { domain: { userId } } },
      }),
    ]);

    return {
      totalDomains,
      activeDomains,
      totalSnapshots,
      totalVerifications,
      totalFindings,
      runningJobs,
      latestScan: latestScan?.createdAt ?? null,
    };
  }

  async buildHealth(userId: string): Promise<WorkspaceHealthDto> {
    const userDomains = await this.prisma.domain.findMany({
      where: { userId },
      select: { id: true },
    });
    const domainIds = userDomains.map((d) => d.id);

    if (domainIds.length === 0) {
      return {
        score: 100,
        grade: 'A',
        trend: 'STABLE',
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        informational: 0,
      };
    }

    const latestSnapshots = await this.prisma.infrastructureSnapshot.findMany({
      where: { domainId: { in: domainIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['domainId'],
      select: { id: true },
    });
    const latestSnapshotIds = latestSnapshots.map((s) => s.id);

    const findingsGrouped =
      latestSnapshotIds.length > 0
        ? await this.prisma.infrastructureFinding.groupBy({
            by: ['severity'],
            where: { snapshotId: { in: latestSnapshotIds } },
            _count: { severity: true },
          })
        : [];

    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
    };

    for (const group of findingsGrouped) {
      switch (group.severity) {
        case Severity.CRITICAL:
          counts.critical = group._count.severity;
          break;
        case Severity.HIGH:
          counts.high = group._count.severity;
          break;
        case Severity.MEDIUM:
          counts.medium = group._count.severity;
          break;
        case Severity.LOW:
          counts.low = group._count.severity;
          break;
        case Severity.INFO:
          counts.informational = group._count.severity;
          break;
      }
    }

    const penalty =
      counts.critical * 25 +
      counts.high * 10 +
      counts.medium * 5 +
      counts.low * 2;
    const score = Math.max(0, Math.min(100, 100 - penalty));

    let grade = 'A';
    if (score < 60) grade = 'F';
    else if (score < 70) grade = 'D';
    else if (score < 80) grade = 'C';
    else if (score < 90) grade = 'B';

    const recentHighSeverityChanges = await this.prisma.changeHistory.count({
      where: {
        domainId: { in: domainIds },
        severity: { in: [ChangeSeverity.CRITICAL, ChangeSeverity.HIGH] },
        detectedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    const trend = recentHighSeverityChanges > 0 ? 'DEGRADED' : 'STABLE';

    return {
      score,
      grade,
      trend,
      ...counts,
    };
  }

  async buildFindings(userId: string): Promise<WorkspaceFindingsDto> {
    const total = await this.prisma.infrastructureFinding.count({
      where: { snapshot: { domain: { userId } } },
    });
    return {
      total,
      unresolved: total,
      resolved: 0,
    };
  }

  async buildRecentActivity(userId: string): Promise<RecentActivityDto[]> {
    const userDomains = await this.prisma.domain.findMany({
      where: { userId },
      select: { id: true, domainName: true, createdAt: true },
    });

    if (userDomains.length === 0) {
      return [];
    }

    const domainMap = new Map<string, string>();
    userDomains.forEach((d) => domainMap.set(d.id, d.domainName));
    const domainIds = userDomains.map((d) => d.id);

    const [changes, verifications, jobs, findings] = await Promise.all([
      this.prisma.changeHistory.findMany({
        where: { domainId: { in: domainIds } },
        orderBy: { detectedAt: 'desc' },
        take: 10,
      }),
      this.prisma.infrastructureVerification.findMany({
        where: { domainId: { in: domainIds } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.understandingJob.findMany({
        where: { domainId: { in: domainIds }, status: JobStatus.COMPLETED },
        orderBy: { completedAt: 'desc' },
        take: 10,
      }),
      this.prisma.infrastructureFinding.findMany({
        where: { snapshot: { domainId: { in: domainIds } } },
        include: { snapshot: { select: { domainId: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const rawEvents: (RecentActivityDto & {
      canonicalType: string;
      canonicalId: string;
    })[] = [];

    for (const d of userDomains) {
      rawEvents.push({
        id: `domain-${d.id}`,
        canonicalType: 'DOMAIN',
        canonicalId: d.id,
        type: 'DOMAIN_ADDED',
        title: `Domain ${d.domainName} added to workspace`,
        domainId: d.id,
        domainName: d.domainName,
        occurredAt: d.createdAt,
      });
    }

    for (const j of jobs) {
      const dName = domainMap.get(j.domainId) || 'Unknown Domain';
      rawEvents.push({
        id: `job-${j.id}`,
        canonicalType: 'JOB',
        canonicalId: j.id,
        type: 'UNDERSTANDING_COMPLETED',
        title: `Understanding completed for ${dName}`,
        domainId: j.domainId,
        domainName: dName,
        occurredAt: j.completedAt || j.startedAt,
      });
    }

    for (const c of changes) {
      const dName = domainMap.get(c.domainId) || 'Unknown Domain';
      rawEvents.push({
        id: `change-${c.id}`,
        canonicalType: 'CHANGE',
        canonicalId: c.id,
        type: 'INFRASTRUCTURE_CHANGED',
        title: c.title,
        domainId: c.domainId,
        domainName: dName,
        occurredAt: c.detectedAt,
      });
    }

    for (const v of verifications) {
      const dName = domainMap.get(v.domainId) || 'Unknown Domain';
      rawEvents.push({
        id: `verif-${v.id}`,
        canonicalType: 'VERIFICATION',
        canonicalId: v.id,
        type: 'EVIDENCE_COLLECTED',
        title: `Infrastructure verification completed for ${dName}`,
        domainId: v.domainId,
        domainName: dName,
        occurredAt: v.completedAt || v.createdAt,
      });
    }

    for (const f of findings) {
      const dId = f.snapshot.domainId;
      const dName = domainMap.get(dId) || 'Unknown Domain';
      rawEvents.push({
        id: `finding-${f.id}`,
        canonicalType: 'FINDING',
        canonicalId: f.id,
        type: 'FINDINGS_GENERATED',
        title: f.title,
        domainId: dId,
        domainName: dName,
        occurredAt: f.createdAt,
      });
    }

    // Deterministic sort: occurredAt desc, then canonicalId asc
    rawEvents.sort((a, b) => {
      const timeDiff =
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.canonicalId.localeCompare(b.canonicalId);
    });

    // Identity Deduplication by type + canonicalId
    const seenActivity = new Set<string>();
    const events: RecentActivityDto[] = [];
    for (const ev of rawEvents) {
      const key = `${ev.canonicalType}:${ev.canonicalId}`;
      if (seenActivity.has(key)) continue;
      seenActivity.add(key);
      const { canonicalType: _t, canonicalId: _cid, ...cleanEvent } = ev;
      events.push(cleanEvent);
    }

    return events.slice(0, 10);
  }

  async buildRecentChanges(userId: string): Promise<RecentChangeDto[]> {
    const changes = await this.prisma.changeHistory.findMany({
      where: { domain: { userId } },
      include: { domain: { select: { domainName: true } } },
      orderBy: { detectedAt: 'desc' },
      take: 20,
    });

    const seenChanges = new Set<string>();
    const result: RecentChangeDto[] = [];
    for (const c of changes) {
      const key = `CHANGE:${c.id}`;
      if (seenChanges.has(key)) continue;
      seenChanges.add(key);
      result.push({
        id: c.id,
        domainId: c.domainId,
        domainName: c.domain.domainName,
        changeType: c.module,
        title: c.title,
        severity: c.severity,
        detectedAt: c.detectedAt,
      });
    }

    return result.slice(0, 10);
  }

  async buildCriticalFindings(userId: string): Promise<CriticalFindingDto[]> {
    const findings = await this.prisma.infrastructureFinding.findMany({
      where: {
        snapshot: { domain: { userId } },
        severity: Severity.CRITICAL,
      },
      include: {
        snapshot: {
          select: {
            domainId: true,
            domain: { select: { domainName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const seenFindings = new Set<string>();
    const result: CriticalFindingDto[] = [];
    for (const f of findings) {
      const key = `FINDING:${f.id}`;
      if (seenFindings.has(key)) continue;
      seenFindings.add(key);
      result.push({
        id: f.id,
        domainId: f.snapshot.domainId,
        title: f.title,
        severity: f.severity,
        category: f.category,
        createdAt: f.createdAt,
      });
    }

    return result.slice(0, 10);
  }

  async buildRecentDomains(userId: string): Promise<RecentDomainDto[]> {
    const domains = await this.domainsService.findByUser(userId);
    return domains.slice(0, 5).map((d) => ({
      id: d.id,
      domainName: d.domainName,
      monitoringEnabled: d.monitoringEnabled,
      createdAt: d.createdAt,
    }));
  }

  async buildActiveDomains(userId: string): Promise<DomainSummaryDto[]> {
    const domains = await this.prisma.domain.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    if (domains.length === 0) {
      return [];
    }

    const domainIds = domains.map((d) => d.id);

    const [latestSnapshots, changesCounts] = await Promise.all([
      this.prisma.infrastructureSnapshot.findMany({
        where: { domainId: { in: domainIds } },
        orderBy: { createdAt: 'desc' },
        distinct: ['domainId'],
        include: {
          findings: true,
        },
      }),
      this.prisma.changeHistory.groupBy({
        by: ['domainId'],
        where: { domainId: { in: domainIds } },
        _count: { id: true },
      }),
    ]);

    const snapshotMap = new Map<string, (typeof latestSnapshots)[0]>();
    latestSnapshots.forEach((s) => snapshotMap.set(s.domainId, s));

    const changesMap = new Map<string, number>();
    changesCounts.forEach((c) => changesMap.set(c.domainId, c._count.id));

    return domains.map((d) => {
      const snap = snapshotMap.get(d.id);
      const findings = snap?.findings || [];
      const criticalCount = findings.filter(
        (f) => f.severity === Severity.CRITICAL,
      ).length;
      const highCount = findings.filter(
        (f) => f.severity === Severity.HIGH,
      ).length;
      const mediumCount = findings.filter(
        (f) => f.severity === Severity.MEDIUM,
      ).length;
      const lowCount = findings.filter(
        (f) => f.severity === Severity.LOW,
      ).length;

      const penalty =
        criticalCount * 25 + highCount * 10 + mediumCount * 5 + lowCount * 2;
      const healthScore = snap
        ? Math.max(0, Math.min(100, 100 - penalty))
        : 100;

      let technologiesCount = 0;
      if (snap?.payload && typeof snap.payload === 'object') {
        const payloadObj = snap.payload as any;
        if (Array.isArray(payloadObj.technologies)) {
          technologiesCount = payloadObj.technologies.length;
        } else if (payloadObj.webServer) {
          technologiesCount = 1;
        }
      }

      return {
        id: d.id,
        domainName: d.domainName,
        healthScore,
        lastUnderstanding: snap?.createdAt ?? null,
        technologiesCount,
        criticalFindings: criticalCount,
        recentChangesCount: changesMap.get(d.id) || 0,
        findingsCount: findings.length,
        trend: criticalCount > 0 ? 'DEGRADED' : 'STABLE',
        latestSnapshotId: snap?.id ?? null,
      };
    });
  }

  async buildAttentionDomains(userId: string): Promise<AttentionDomainDto[]> {
    const activeDomains = await this.buildActiveDomains(userId);
    return activeDomains
      .filter((d) => d.criticalFindings > 0 || d.healthScore < 80)
      .map((d) => ({
        id: d.id,
        domain: d.domainName,
        healthScore: d.healthScore,
        criticalFindings: d.criticalFindings,
        lastScan: d.lastUnderstanding,
      }));
  }
}
