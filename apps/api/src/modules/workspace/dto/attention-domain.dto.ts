import { ApiProperty } from '@nestjs/swagger';

export class AttentionDomainDto {
  @ApiProperty({
    description: 'Unique identifier of the domain.',
    example: '3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Fully qualified domain name.',
    example: 'example.com',
  })
  domain!: string;

  @ApiProperty({
    description: 'Computed health score of the domain.',
    example: 42,
    minimum: 0,
    maximum: 100,
  })
  healthScore!: number;

  @ApiProperty({
    description: 'Number of unresolved critical findings.',
    example: 3,
  })
  criticalFindings!: number;

  @ApiProperty({
    description: 'Timestamp of the latest completed infrastructure scan.',
    example: '2026-07-23T09:15:00.000Z',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  lastScan!: Date | null;
}