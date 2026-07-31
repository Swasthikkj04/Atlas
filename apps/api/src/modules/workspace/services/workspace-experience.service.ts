import { Injectable } from '@nestjs/common';

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
  constructor(private readonly workspaceQueryService: WorkspaceQueryService) {}

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
}
