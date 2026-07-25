import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceSummaryDto {
  @ApiProperty({
    description: 'Total number of monitored domains.',
    example: 12,
  })
  totalDomains!: number;

  @ApiProperty({
    description: 'Number of domains currently active.',
    example: 11,
  })
  activeDomains!: number;

  @ApiProperty({
    description: 'Total number of infrastructure snapshots stored.',
    example: 246,
  })
  totalSnapshots!: number;

  @ApiProperty({
    description: 'Number of understanding jobs currently running.',
    example: 2,
  })
  runningJobs!: number;

  @ApiProperty({
    description: 'Total number of infrastructure verifications executed.',
    example: 90,
  })
  totalVerifications?: number;

  @ApiProperty({
    description: 'Total number of active findings across workspace.',
    example: 41,
  })
  totalFindings?: number;

  @ApiProperty({
    description: 'Timestamp of the latest completed infrastructure scan.',
    example: '2026-07-23T09:15:00.000Z',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  latestScan!: Date | null;
}