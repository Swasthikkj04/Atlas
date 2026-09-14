import { Injectable, NotFoundException } from '@nestjs/common';

import { DomainDetailsDto } from '../dto/domain-details.dto';
import { DomainOverviewResponseDto } from '../dto/domain-overview-response.dto';
import { DomainStatisticsDto } from '../dto/domain-statistics.dto';
import { InfrastructureOverviewMapper } from '../mappers/infrastructure-overview.mapper';
import { DomainDetailsService } from './domain-details.service';

@Injectable()
export class DomainExperienceService {
  constructor(private readonly domainDetailsService: DomainDetailsService) {}

  async getDomainBrief(userId: string, domainId: string) {
    const domain = await this.domainDetailsService.getDomain(userId, domainId);
    let brief: any = await this.domainDetailsService.getLatestBrief(domainId);

    if (!brief) {
      const latestSnapshot =
        await this.domainDetailsService.getLatestSnapshot(domainId);
      if (latestSnapshot) {
        try {
          brief = await this.domainDetailsService.generateBrief(
            userId,
            latestSnapshot.id,
          );
        } catch {
          // Fall through
        }
      }
    }

    if (!brief) {
      throw new NotFoundException(
        `No infrastructure brief found for domain '${domainId}'.`,
      );
    }

    return {
      id: brief.id,
      snapshotId: brief.snapshotId,
      domainId: domain.id,
      executiveSummary: brief.summary,
      healthScore: null,
      highlights: Array.isArray(brief.highlights)
        ? (brief.highlights as any[]).map((h: any, idx: number) => ({
            id: h.id || `hl-${idx}`,
            title: typeof h === 'string' ? h : h.title || 'Observation',
            summary: typeof h === 'string' ? h : h.summary || '',
            severity: typeof h === 'object' ? h.severity : undefined,
          }))
        : [],
      stableObservationsCount: 0,
      generatedAt:
        typeof brief.createdAt?.toISOString === 'function'
          ? brief.createdAt.toISOString()
          : String(brief.createdAt),
    };
  }

  async getDomainOverview(
    userId: string,
    domainId: string,
  ): Promise<DomainOverviewResponseDto> {
    const domain = await this.domainDetailsService.getDomain(userId, domainId);
    const latestSnapshot =
      await this.domainDetailsService.getLatestSnapshot(domainId);

    const [
      totalSnapshots,
      findingsSummary,
      latestBrief,
      latestVerification,
      totalVerifications,
    ] = await Promise.all([
      this.domainDetailsService.countSnapshots(domainId),
      this.domainDetailsService.getFindingsSummary(
        domainId,
        latestSnapshot?.id,
      ),
      this.domainDetailsService.getLatestBrief(domainId),
      this.domainDetailsService.getLatestVerification(domainId),
      this.domainDetailsService.countVerifications(domainId),
    ]);

    const healthScore = Math.max(
      0,
      100 -
        findingsSummary.critical * 20 -
        findingsSummary.high * 10 -
        findingsSummary.medium * 5 -
        findingsSummary.low * 2 -
        findingsSummary.informational,
    );

    const statistics: DomainStatisticsDto = {
      totalSnapshots,
      totalVerifications,
      totalFindings: findingsSummary.total,
      criticalFindings: findingsSummary.critical,
      changesLast30Days: 0,
      lastUnderstandingAt:
        (domain as any).lastUnderstoodAt ??
        latestVerification?.completedAt ??
        latestSnapshot?.createdAt ??
        null,
    };

    return {
      domain: {
        id: domain.id,
        domainName: domain.domainName,
        monitoringEnabled: domain.monitoringEnabled,
        createdAt: domain.createdAt,
      },

      health: {
        score: healthScore,
        critical: findingsSummary.critical,
        high: findingsSummary.high,
        medium: findingsSummary.medium,
        low: findingsSummary.low,
        informational: findingsSummary.informational,
      },

      latestSnapshot: latestSnapshot
        ? {
            id: latestSnapshot.id,
            createdAt: latestSnapshot.createdAt,
            responseTimeMs: latestSnapshot.responseTimeMs,
            httpStatus: latestSnapshot.httpStatus,
          }
        : null,

      latestBrief: latestBrief
        ? {
            overallHealth: latestBrief.overallHealth,
            summary: latestBrief.summary,
            highlights: latestBrief.highlights as string[],
            recommendations: latestBrief.recommendations as string[],
            generatedAt: latestBrief.createdAt,
          }
        : null,

      findingsSummary,

      recentFindings: [],

      recentChanges: [],

      latestVerification: latestVerification
        ? {
            id: latestVerification.id,
            changeDetected: latestVerification.changeDetected,
            snapshotCreated: latestVerification.snapshotCreated,
            startedAt: latestVerification.startedAt,
            completedAt: latestVerification.completedAt,
            durationMs: latestVerification.durationMs,
          }
        : null,

      infrastructure: InfrastructureOverviewMapper.fromSnapshot(latestSnapshot),

      statistics,
    };
  }

  async getDomainDetails(
    userId: string,
    domainId: string,
  ): Promise<DomainDetailsDto> {
    const [
      domain,
      latestSnapshot,
      totalSnapshots,
      findingsSummary,
      latestBrief,
    ] = await Promise.all([
      this.domainDetailsService.getDomain(userId, domainId),
      this.domainDetailsService.getLatestSnapshot(domainId),
      this.domainDetailsService.countSnapshots(domainId),
      this.domainDetailsService.getFindingsSummary(domainId),
      this.domainDetailsService.getLatestBrief(domainId),
    ]);

    return {
      domain: {
        id: domain.id,
        domainName: domain.domainName,
        createdAt: domain.createdAt,
        monitored: true,
        healthScore: 0,
        lastScanAt: latestSnapshot?.createdAt ?? null,
        totalSnapshots,
      },

      findings: findingsSummary,

      infrastructure: InfrastructureOverviewMapper.fromSnapshot(latestSnapshot),

      latestBrief: latestBrief
        ? {
            overallHealth: latestBrief.overallHealth,
            summary: latestBrief.summary,
            highlights: latestBrief.highlights as string[],
            recommendations: latestBrief.recommendations as string[],
            generatedAt: latestBrief.createdAt,
          }
        : null,
    };
  }
}
