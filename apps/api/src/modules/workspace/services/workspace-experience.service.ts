import {
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { InfrastructureBriefService } from '../../infrastructure-brief/services/infrastructure-brief.service';
import { InfrastructureFindingService } from '../../infrastructure-findings/services/infrastructure-finding.service';
import { TimelineExperienceService } from '../../timeline/services/timeline-experience.service';
import { SecurityBriefBuilder } from '../../infrastructure-brief/builders/security-brief.builder';

import { QuickActionDto } from '../dto/quick-action.dto';
import { WelcomeBackDto } from '../dto/welcome-back.dto';
import { WorkspaceBriefDto } from '../dto/workspace-brief.dto';
import {
  WorkspaceDashboardDto,
  WorkspaceDashboardFindingsDto,
} from '../dto/workspace-dashboard.dto';
import { WorkspaceResponseDto } from '../dto/workspace-response.dto';
import { WorkspaceQueryService } from './workspace-query.service';

export interface UserContext {
  id: string;
  fullName: string;
  email: string;
}

@Injectable()
export class WorkspaceExperienceService {
  private readonly logger = new Logger(WorkspaceExperienceService.name);

  constructor(
    private readonly workspaceQueryService: WorkspaceQueryService,
    private readonly prisma: PrismaService,
    private readonly infrastructureBriefService: InfrastructureBriefService,
    @Optional() private readonly securityBriefBuilder?: SecurityBriefBuilder,
    @Optional() private readonly findingService?: InfrastructureFindingService,
    @Optional()
    private readonly timelineExperienceService?: TimelineExperienceService,
  ) {}

  async getWorkspaceOverview(userId: string, domainId: string): Promise<any> {
    const domain = await this.prisma.domain.findFirst({
      where: { id: domainId, userId },
    });

    if (!domain) {
      throw new NotFoundException(`Domain '${domainId}' not found for user.`);
    }

    const latestSnapshot = await this.prisma.infrastructureSnapshot.findFirst({
      where: { domainId },
      orderBy: { createdAt: 'desc' },
    });

    let briefRecord = latestSnapshot
      ? await this.prisma.infrastructureBrief.findUnique({
          where: { snapshotId: latestSnapshot.id },
        })
      : null;

    if (!briefRecord && latestSnapshot) {
      try {
        briefRecord = await this.infrastructureBriefService.generateForUser(
          userId,
          latestSnapshot.id,
        );
      } catch (e) {
        this.logger.debug(`Brief generation deferred or unavailable: ${e}`);
      }
    }

    const findingsResponse =
      this.findingService &&
      typeof this.findingService.getFindingsExperienceList === 'function'
        ? await this.findingService.getFindingsExperienceList(userId, {
            domainId,
            snapshotId: latestSnapshot?.id,
            status: 'ACTIVE',
            page: 1,
            limit: 50,
          })
        : { data: [] };
    const findings = (findingsResponse?.data || []).filter(
      (f) => f.status !== 'RESOLVED' && f.state !== 'RESOLVED',
    );

    const severityRank: Record<string, number> = {
      CRITICAL: 5,
      HIGH: 4,
      MEDIUM: 3,
      LOW: 2,
      INFORMATIONAL: 1,
    };

    // 1. Canonical Sorting (deterministic severity + recency + ID)
    const sortedFindings = [...findings].sort((a, b) => {
      const rankA = severityRank[a.severity] || 0;
      const rankB = severityRank[b.severity] || 0;
      if (rankB !== rankA) return rankB - rankA;
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      return a.id.localeCompare(b.id);
    });

    // 2. Identity Deduplication across all findings (type + canonicalId/ruleId)
    const uniqueFindings = this.deduplicateByIdentity(
      'FINDING',
      sortedFindings,
    );

    // 3. Primary Story Selection
    const primaryStory = uniqueFindings[0] || null;

    // 4. Primary Exclusion for Secondary Stories (primary entity NEVER appears in secondary stories)
    const secondaryStories = this.deduplicateByIdentity(
      'FINDING',
      uniqueFindings.slice(1),
      primaryStory?.id,
      primaryStory?.ruleId,
    );

    // 5. Recent Changes Deduplication
    const timelineResponse =
      this.timelineExperienceService &&
      typeof this.timelineExperienceService.getTimelineData === 'function'
        ? await this.timelineExperienceService.getTimelineData(userId, {
            domainId,
            page: 1,
            limit: 10,
          })
        : { data: [] };
    const recentChanges = this.deduplicateByIdentity(
      'CHANGE',
      timelineResponse?.data || [],
    ).slice(0, 5);

    const executiveBrief = briefRecord
      ? {
          id: briefRecord.id,
          snapshotId: briefRecord.snapshotId,
          domainId: domain.id,
          executiveSummary: briefRecord.summary,
          healthScore: null,
          highlights: Array.isArray(briefRecord.highlights)
            ? (() => {
                const rawHighlights = (briefRecord.highlights as any[]).map(
                  (h: any, idx: number) => {
                    const highlightTitle =
                      typeof h === 'string' ? h : h.title || 'Observation';
                    const highlightSeverity =
                      typeof h === 'object' ? h.severity : undefined;
                    const matchingFinding = !h.id
                      ? uniqueFindings.find(
                          (f) =>
                            f.title.toLowerCase() ===
                              highlightTitle.toLowerCase() ||
                            (highlightSeverity &&
                              f.severity === highlightSeverity &&
                              (f.title
                                .toLowerCase()
                                .includes(highlightTitle.toLowerCase()) ||
                                highlightTitle
                                  .toLowerCase()
                                  .includes(f.title.toLowerCase()))),
                        )
                      : null;
                    return {
                      id: h.id || matchingFinding?.id || `hl-${idx}`,
                      title: highlightTitle,
                      summary: typeof h === 'string' ? h : h.summary || '',
                      severity: highlightSeverity,
                    };
                  },
                );
                return this.deduplicateByIdentity('HIGHLIGHT', rawHighlights);
              })()
            : [],
          stableObservationsCount: 0,
          generatedAt: briefRecord.createdAt.toISOString(),
        }
      : null;

    const isQuiet = uniqueFindings.length === 0;

    return {
      domain: {
        id: domain.id,
        domainName: domain.domainName,
        status: domain.monitoringEnabled ? 'ACTIVE' : 'INACTIVE',
        createdAt: domain.createdAt.toISOString(),
        updatedAt: domain.updatedAt.toISOString(),
      },
      executiveBrief,
      primaryStory,
      secondaryStories,
      latestSnapshot: latestSnapshot
        ? {
            id: latestSnapshot.id,
            domainId: latestSnapshot.domainId,
            responseTimeMs: latestSnapshot.responseTimeMs,
            httpStatus: latestSnapshot.httpStatus,
            createdAt: latestSnapshot.createdAt.toISOString(),
            payload: latestSnapshot.payload,
          }
        : null,
      recentChanges,
      quietStatus: {
        isQuiet,
        lastVerifiedAt:
          latestSnapshot?.createdAt?.toISOString() || new Date().toISOString(),
        stableComponentsCount: 0,
      },
    };
  }

  /**
   * Canonical Identity Deduplication & Primary Exclusion.
   *
   * Deduplicates by strictly combining `type + canonicalId`.
   * For findings, also checks canonical `ruleId` and `category:title` canonical signature
   * to guarantee that duplicate scan results or repeated observations appear at most ONCE.
   * If `primaryIdToExclude` or `primaryRuleIdToExclude` is provided, primary items are excluded.
   */
  public deduplicateByIdentity<
    T extends {
      id: string;
      ruleId?: string;
      category?: string;
      title?: string;
    },
  >(
    type: string,
    items: readonly T[],
    primaryIdToExclude?: string | null,
    primaryRuleIdToExclude?: string | null,
  ): T[] {
    const seen = new Set<string>();
    const result: T[] = [];
    const primaryKey = primaryIdToExclude
      ? `${type}:${primaryIdToExclude}`
      : null;
    const primaryRuleKey = primaryRuleIdToExclude
      ? `${type}:rule:${primaryRuleIdToExclude}`
      : null;

    for (const item of items) {
      if (!item || !item.id) continue;
      const entityKey = `${type}:${item.id}`;
      const ruleKey = item.ruleId ? `${type}:rule:${item.ruleId}` : null;
      const canonicalKey =
        item.category && item.title
          ? `${type}:${item.category}:${item.title.trim().toLowerCase()}`
          : null;

      // 1. Primary Exclusion
      if (primaryKey && entityKey === primaryKey) {
        continue;
      }
      if (primaryRuleKey && ruleKey && ruleKey === primaryRuleKey) {
        continue;
      }

      // 2. Identity Deduplication (by entity ID, canonical rule ID, or canonical category+title)
      if (seen.has(entityKey)) {
        continue;
      }
      if (ruleKey && seen.has(ruleKey)) {
        continue;
      }
      if (canonicalKey && seen.has(canonicalKey)) {
        continue;
      }

      seen.add(entityKey);
      if (ruleKey) seen.add(ruleKey);
      if (canonicalKey) seen.add(canonicalKey);
      result.push(item);
    }

    return result;
  }

  async getDashboardData(user: UserContext): Promise<WorkspaceDashboardDto> {
    const userId = user.id;

    const [
      summary,
      health,
      findings,
      recentActivity,
      recentChanges,
      activeDomains,
    ] = await Promise.all([
      this.workspaceQueryService.buildSummary(userId),
      this.workspaceQueryService.buildHealth(userId),
      this.workspaceQueryService.buildFindings(userId),
      this.workspaceQueryService.buildRecentActivity(userId),
      this.workspaceQueryService.buildRecentChanges(userId),
      this.workspaceQueryService.buildActiveDomains(userId),
    ]);

    const dashboardFindings: WorkspaceDashboardFindingsDto = {
      critical: health.critical,
      high: health.high,
      medium: health.medium,
      low: health.low,
      total: findings.total,
    };

    const quickActions: QuickActionDto[] = [
      {
        id: 'understand_now',
        label: 'Understand Now',
        action: 'UNDERSTAND',
        endpoint: '/api/v1/domains/:id/understand',
        method: 'POST',
      },
      {
        id: 'view_findings',
        label: 'View Findings',
        action: 'VIEW_FINDINGS',
        endpoint: '/api/v1/findings',
        method: 'GET',
      },
      {
        id: 'view_timeline',
        label: 'View Timeline',
        action: 'VIEW_TIMELINE',
        endpoint: '/api/v1/timeline',
        method: 'GET',
      },
      {
        id: 'explorer',
        label: 'Explorer',
        action: 'EXPLORER',
        endpoint: '/api/v1/explorer',
        method: 'GET',
      },
      {
        id: 'add_domain',
        label: 'Add Domain',
        action: 'ADD_DOMAIN',
        endpoint: '/api/v1/domains',
        method: 'POST',
      },
    ];

    return {
      summary: {
        totalDomains: summary.totalDomains,
        activeDomains: summary.activeDomains,
        totalSnapshots: summary.totalSnapshots,
        totalVerifications: summary.totalVerifications ?? 0,
        lastScanAt: summary.latestScan,
      },
      health,
      findings: dashboardFindings,
      changes: {
        count: recentChanges.length,
        sinceLastRun: 'Since last run',
      },
      activeDomains,
      recentActivity,
      quickActions,
    };
  }

  async getWorkspaceData(user: UserContext): Promise<WorkspaceResponseDto> {
    const [
      overview,
      infrastructureHealth,
      recentActivity,
      recentChanges,
      criticalFindings,
      recentDomains,
    ] = await Promise.all([
      this.workspaceQueryService.buildSummary(user.id),
      this.workspaceQueryService.buildHealth(user.id),
      this.workspaceQueryService.buildRecentActivity(user.id),
      this.workspaceQueryService.buildRecentChanges(user.id),
      this.workspaceQueryService.buildCriticalFindings(user.id),
      this.workspaceQueryService.buildRecentDomains(user.id),
    ]);

    const welcomeBack: WelcomeBackDto = {
      fullName: user.fullName,
      email: user.email,
      lastScan: overview.latestScan,
    };

    return {
      welcomeBack,
      overview,
      infrastructureHealth,
      recentActivity,
      recentChanges,
      criticalFindings,
      recentDomains,
    };
  }

  async getWorkspaceBrief(userId: string): Promise<WorkspaceBriefDto> {
    const [summary, health, findings, recentActivity, attentionDomains] =
      await Promise.all([
        this.workspaceQueryService.buildSummary(userId),
        this.workspaceQueryService.buildHealth(userId),
        this.workspaceQueryService.buildFindings(userId),
        this.workspaceQueryService.buildRecentActivity(userId),
        this.workspaceQueryService.buildAttentionDomains(userId),
      ]);

    return {
      summary,
      health,
      findings,
      recentActivity,
      attentionDomains,
    };
  }

  async getWorkspaceSecurity(userId: string, domainId: string): Promise<any> {
    const domain = await this.prisma.domain.findFirst({
      where: { id: domainId, userId },
    });

    if (!domain) {
      throw new NotFoundException(`Domain '${domainId}' not found for user.`);
    }

    const latestSnapshot = await this.prisma.infrastructureSnapshot.findFirst({
      where: { domainId },
      orderBy: { createdAt: 'desc' },
    });

    const findingsResponse =
      await this.findingService.getFindingsExperienceList(userId, {
        domainId,
        snapshotId: latestSnapshot?.id,
        page: 1,
        limit: 50,
      });
    const findings = findingsResponse?.data || [];

    const builder = this.securityBriefBuilder || new SecurityBriefBuilder();
    const brief = builder.build(
      (latestSnapshot || {
        id: '',
        domainId,
        domainName: domain.domainName,
        createdAt: new Date(),
        payload: {},
      }) as any,
      findings,
    );

    return {
      domainId: domain.id,
      domainName: domain.domainName,
      securityScore: brief.securityScore,
      securityGrade: brief.securityGrade,
      posture: brief.posture,
      securityBrief: brief,
      securityPillars: brief.pillars,
      securityFindings: findings,
    };
  }
}
