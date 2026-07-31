import { ApiProperty } from '@nestjs/swagger';

import { DomainSummaryDto } from './domain-summary.dto';
import { FindingsSummaryDto } from './findings-summary.dto';
import { InfrastructureOverviewDto } from './infrastructure-overview.dto';
import { LatestBriefDto } from './latest-brief.dto';

export class DomainDetailsDto {
  @ApiProperty({
    type: () => DomainSummaryDto,
  })
  domain!: DomainSummaryDto;

  @ApiProperty({
    type: () => FindingsSummaryDto,
  })
  findings!: FindingsSummaryDto;

  @ApiProperty({
    type: () => InfrastructureOverviewDto,
  })
  infrastructure!: InfrastructureOverviewDto;

  @ApiProperty({
    type: () => LatestBriefDto,
    nullable: true,
  })
  latestBrief!: LatestBriefDto | null;
}
