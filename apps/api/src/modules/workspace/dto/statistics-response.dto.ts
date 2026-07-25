import { ApiProperty } from '@nestjs/swagger';

export class DomainStatsDto {
  @ApiProperty({ description: 'Total number of domains.', example: 10 })
  total!: number;

  @ApiProperty({ description: 'Domains in healthy state.', example: 8 })
  healthy!: number;

  @ApiProperty({ description: 'Domains with warnings.', example: 1 })
  warning!: number;

  @ApiProperty({ description: 'Domains in critical state.', example: 1 })
  critical!: number;
}

export class FindingStatsDto {
  @ApiProperty({ description: 'Critical findings count.', example: 2 })
  critical!: number;

  @ApiProperty({ description: 'High severity findings count.', example: 4 })
  high!: number;

  @ApiProperty({ description: 'Medium severity findings count.', example: 6 })
  medium!: number;

  @ApiProperty({ description: 'Low severity findings count.', example: 8 })
  low!: number;

  @ApiProperty({ description: 'Total findings count.', example: 20 })
  total!: number;
}

export class TimeframeStatsDto {
  @ApiProperty({ description: 'Count today.', example: 3 })
  today!: number;

  @ApiProperty({ description: 'Count in the last 7 days.', example: 12 })
  week!: number;

  @ApiProperty({ description: 'Count in the last 30 days.', example: 45 })
  month!: number;

  @ApiProperty({ description: 'Total count.', example: 150 })
  total!: number;
}

export class SnapshotStatsDto {
  @ApiProperty({ description: 'Total snapshots count.', example: 250 })
  total!: number;
}

export class UnderstandingStatsDto {
  @ApiProperty({ description: 'Completed understanding jobs count.', example: 100 })
  completed!: number;

  @ApiProperty({ description: 'Currently running understanding jobs count.', example: 1 })
  running!: number;

  @ApiProperty({ description: 'Failed understanding jobs count.', example: 2 })
  failed!: number;
}

export class StatisticsResponseDto {
  @ApiProperty({ description: 'Domain metrics.', type: () => DomainStatsDto })
  domains!: DomainStatsDto;

  @ApiProperty({ description: 'Finding severity breakdown.', type: () => FindingStatsDto })
  findings!: FindingStatsDto;

  @ApiProperty({ description: 'Change history statistics across timeframes.', type: () => TimeframeStatsDto })
  changes!: TimeframeStatsDto;

  @ApiProperty({ description: 'Verification statistics across timeframes.', type: () => TimeframeStatsDto })
  verifications!: TimeframeStatsDto;

  @ApiProperty({ description: 'Infrastructure snapshot statistics.', type: () => SnapshotStatsDto })
  snapshots!: SnapshotStatsDto;

  @ApiProperty({ description: 'Understanding jobs metrics.', type: () => UnderstandingStatsDto })
  understanding!: UnderstandingStatsDto;
}
