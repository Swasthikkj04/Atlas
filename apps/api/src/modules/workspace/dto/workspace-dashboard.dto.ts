import { ApiProperty } from '@nestjs/swagger';
import { DomainSummaryDto } from './domain-summary.dto';
import { QuickActionDto } from './quick-action.dto';
import { RecentActivityDto } from './recent-activity.dto';
import { WorkspaceHealthDto } from './workspace-health.dto';

export class WorkspaceDashboardSummaryDto {
  @ApiProperty({ example: 12, description: 'Total monitored domains.' })
  totalDomains!: number;

  @ApiProperty({ example: 12, description: 'Active monitored domains.' })
  activeDomains!: number;

  @ApiProperty({ example: 45, description: 'Total infrastructure snapshots.' })
  totalSnapshots!: number;

  @ApiProperty({ example: 120, description: 'Total verifications executed.' })
  totalVerifications!: number;

  @ApiProperty({
    example: '2026-07-24T20:00:00.000Z',
    description: 'Timestamp of the latest scan across all domains.',
    nullable: true,
  })
  lastScanAt!: Date | null;
}

export class WorkspaceDashboardFindingsDto {
  @ApiProperty({ example: 4, description: 'Critical findings count.' })
  critical!: number;

  @ApiProperty({ example: 12, description: 'High severity findings count.' })
  high!: number;

  @ApiProperty({ example: 18, description: 'Medium severity findings count.' })
  medium!: number;

  @ApiProperty({ example: 7, description: 'Low severity findings count.' })
  low!: number;

  @ApiProperty({ example: 41, description: 'Total active findings count.' })
  total!: number;
}

export class WorkspaceDashboardChangesDto {
  @ApiProperty({ example: 3, description: 'Recent infrastructure changes count.' })
  count!: number;

  @ApiProperty({ example: 'Since last run', description: 'Context window descriptor.' })
  sinceLastRun!: string;
}

export class WorkspaceDashboardDto {
  @ApiProperty({ type: WorkspaceDashboardSummaryDto })
  summary!: WorkspaceDashboardSummaryDto;

  @ApiProperty({ type: WorkspaceHealthDto })
  health!: WorkspaceHealthDto;

  @ApiProperty({ type: WorkspaceDashboardFindingsDto })
  findings!: WorkspaceDashboardFindingsDto;

  @ApiProperty({ type: WorkspaceDashboardChangesDto })
  changes!: WorkspaceDashboardChangesDto;

  @ApiProperty({ type: [DomainSummaryDto] })
  activeDomains!: DomainSummaryDto[];

  @ApiProperty({ type: [RecentActivityDto] })
  recentActivity!: RecentActivityDto[];

  @ApiProperty({ type: [QuickActionDto] })
  quickActions!: QuickActionDto[];
}
