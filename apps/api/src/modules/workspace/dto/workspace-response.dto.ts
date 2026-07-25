import { ApiProperty } from '@nestjs/swagger';

import { CriticalFindingDto } from './critical-finding.dto';
import { RecentActivityDto } from './recent-activity.dto';
import { RecentChangeDto } from './recent-change.dto';
import { RecentDomainDto } from './recent-domain.dto';
import { WelcomeBackDto } from './welcome-back.dto';
import { WorkspaceHealthDto } from './workspace-health.dto';
import { WorkspaceSummaryDto } from './workspace-summary.dto';

export class WorkspaceResponseDto {
  @ApiProperty({
    description: 'User welcome information.',
    type: () => WelcomeBackDto,
  })
  welcomeBack!: WelcomeBackDto;

  @ApiProperty({
    description: 'High-level workspace overview.',
    type: () => WorkspaceSummaryDto,
  })
  overview!: WorkspaceSummaryDto;

  @ApiProperty({
    description: 'Overall workspace health metrics.',
    type: () => WorkspaceHealthDto,
  })
  infrastructureHealth!: WorkspaceHealthDto;

  @ApiProperty({
    description: 'Recent activity feed.',
    type: () => [RecentActivityDto],
  })
  recentActivity!: RecentActivityDto[];

  @ApiProperty({
    description: 'Recent infrastructure changes.',
    type: () => [RecentChangeDto],
  })
  recentChanges!: RecentChangeDto[];

  @ApiProperty({
    description: 'Critical infrastructure findings requiring attention.',
    type: () => [CriticalFindingDto],
  })
  criticalFindings!: CriticalFindingDto[];

  @ApiProperty({
    description: 'Recently registered domains.',
    type: () => [RecentDomainDto],
  })
  recentDomains!: RecentDomainDto[];
}
