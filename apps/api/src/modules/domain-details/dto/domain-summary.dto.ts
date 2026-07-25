import { ApiProperty } from '@nestjs/swagger';

export class DomainSummaryDto {
  @ApiProperty({
    description: 'Unique domain identifier',
    example: '2ff07229-785c-4e14-9fc6-923e9845c57b',
  })
  id!: string;

  @ApiProperty({
    description: 'Fully qualified domain name',
    example: 'example.com',
  })
  domainName!: string;

  @ApiProperty({
    description: 'Whether the domain is actively monitored',
    example: true,
  })
  monitored!: boolean;

  @ApiProperty({
    description: 'Overall infrastructure health score (0–100)',
    example: 92,
  })
  healthScore!: number;

  @ApiProperty({
    description: 'Timestamp of the latest completed infrastructure scan',
    nullable: true,
  })
  lastScanAt!: Date | null;

  @ApiProperty({
    description: 'Total infrastructure snapshots collected',
    example: 18,
  })
  totalSnapshots!: number;

  @ApiProperty({
    description: 'Domain onboarding date',
  })
  createdAt!: Date;
}