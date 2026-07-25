import { ApiProperty } from '@nestjs/swagger';

import { DomainStatisticsDto } from './domain-statistics.dto';
import { FindingsSummaryDto } from './findings-summary.dto';
import { InfrastructureOverviewDto } from './infrastructure-overview.dto';
import { LatestBriefDto } from './latest-brief.dto';
import { LatestVerificationDto } from './latest-verification.dto';

export class DomainOverviewResponseDto {
  @ApiProperty({
    description: 'Domain metadata.',
  })
  domain!: {
    id: string;
    domainName: string;
    monitoringEnabled: boolean;
    createdAt: Date;
  };

  @ApiProperty({
    description: 'Domain health metrics.',
  })
  health!: {
    score: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  };

  @ApiProperty({
    description: 'Latest snapshot summary.',
    nullable: true,
  })
  latestSnapshot!: {
    id: string;
    createdAt: Date;
    responseTimeMs: number;
    httpStatus: number;
  } | null;

  @ApiProperty({
    description: 'Latest generated brief.',
    nullable: true,
    type: () => LatestBriefDto,
  })
  latestBrief!: LatestBriefDto | null;

  @ApiProperty({
    description: 'Findings summary by severity.',
    type: () => FindingsSummaryDto,
  })
  findingsSummary!: FindingsSummaryDto;

  @ApiProperty({
    description: 'Recent findings list.',
    type: [Object],
  })
  recentFindings!: any[];

  @ApiProperty({
    description: 'Recent changes list.',
    type: [Object],
  })
  recentChanges!: any[];

  @ApiProperty({
    description: 'Latest verification job details.',
    nullable: true,
    type: () => LatestVerificationDto,
  })
  latestVerification!: LatestVerificationDto | null;

  @ApiProperty({
    description: 'Categorized infrastructure overview.',
    type: () => InfrastructureOverviewDto,
  })
  infrastructure!: InfrastructureOverviewDto;

  @ApiProperty({
    description: 'Domain statistical summary.',
    type: () => DomainStatisticsDto,
  })
  statistics!: DomainStatisticsDto;
}
