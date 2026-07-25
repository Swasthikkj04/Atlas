import { ApiProperty } from '@nestjs/swagger';

export class DomainStatisticsDto {
  @ApiProperty({
    description: 'Total snapshots recorded for the domain.',
    example: 42,
  })
  totalSnapshots!: number;

  @ApiProperty({
    description: 'Total verification jobs performed.',
    example: 128,
  })
  totalVerifications!: number;

  @ApiProperty({
    description: 'Total findings identified.',
    example: 15,
  })
  totalFindings!: number;

  @ApiProperty({
    description: 'Number of critical findings.',
    example: 2,
  })
  criticalFindings!: number;

  @ApiProperty({
    description: 'Infrastructure changes detected in the last 30 days.',
    example: 3,
  })
  changesLast30Days!: number;

  @ApiProperty({
    description: 'Timestamp of the latest completed understanding job.',
    example: '2026-07-24T18:00:00.000Z',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  lastUnderstandingAt!: Date | null;
}
