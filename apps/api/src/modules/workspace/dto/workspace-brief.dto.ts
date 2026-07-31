import { ApiProperty } from '@nestjs/swagger';

import { AttentionDomainDto } from './attention-domain.dto';
import { RecentActivityDto } from './recent-activity.dto';
import { WorkspaceFindingsDto } from './workspace-findings.dto';
import { WorkspaceHealthDto } from './workspace-health.dto';
import { WorkspaceSummaryDto } from './workspace-summary.dto';

export class WorkspaceBriefDto {
  @ApiProperty({
    description: 'High-level workspace summary.',
    type: () => WorkspaceSummaryDto,
  })
  summary!: WorkspaceSummaryDto;

  @ApiProperty({
    description: 'Overall workspace health metrics.',
    type: () => WorkspaceHealthDto,
  })
  health!: WorkspaceHealthDto;

  @ApiProperty({
    description: 'Workspace findings summary.',
    type: () => WorkspaceFindingsDto,
  })
  findings!: WorkspaceFindingsDto;

  @ApiProperty({
    description: 'Recent workspace activity.',
    type: () => [RecentActivityDto],
  })
  recentActivity!: RecentActivityDto[];

  @ApiProperty({
    description: 'Domains requiring immediate attention.',
    type: () => [AttentionDomainDto],
  })
  attentionDomains!: AttentionDomainDto[];
}
