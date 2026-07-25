import { ApiProperty } from '@nestjs/swagger';

export class DomainSummaryDto {
  @ApiProperty({
    example: '2e5b652d-c186-41de-8c68-144f58308e24',
    description: 'Unique domain ID.',
  })
  id!: string;

  @ApiProperty({
    example: 'example.com',
    description: 'Monitored domain name.',
  })
  domainName!: string;

  @ApiProperty({
    example: 92,
    description: 'Domain health score (0-100).',
  })
  healthScore!: number;

  @ApiProperty({
    example: '2026-07-24T20:00:00.000Z',
    description: 'Last understanding completion timestamp.',
    nullable: true,
  })
  lastUnderstanding!: Date | null;

  @ApiProperty({
    example: 8,
    description: 'Number of detected technologies.',
  })
  technologiesCount!: number;

  @ApiProperty({
    example: 1,
    description: 'Count of critical findings.',
  })
  criticalFindings!: number;

  @ApiProperty({
    example: 2,
    description: 'Count of recent changes.',
  })
  recentChangesCount!: number;

  @ApiProperty({
    example: 5,
    description: 'Total count of findings for this domain.',
  })
  findingsCount?: number;

  @ApiProperty({
    example: 'STABLE',
    description: 'Domain health trend.',
  })
  trend?: string;

  @ApiProperty({
    example: 's123-uuid',
    description: 'Latest snapshot ID for this domain.',
    nullable: true,
  })
  latestSnapshotId?: string | null;
}
