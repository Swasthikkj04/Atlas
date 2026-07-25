import { ApiProperty } from '@nestjs/swagger';

export class LatestVerificationDto {
  @ApiProperty({
    description: 'Unique verification record identifier.',
    example: 'v1234567-89ab-cdef-0123-456789abcdef',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Whether infrastructure changes were detected.',
    example: false,
  })
  changeDetected!: boolean;

  @ApiProperty({
    description: 'Whether a new snapshot was created.',
    example: false,
  })
  snapshotCreated!: boolean;

  @ApiProperty({
    description: 'Verification job start timestamp.',
    example: '2026-07-24T18:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  startedAt!: Date;

  @ApiProperty({
    description: 'Verification job completion timestamp.',
    example: '2026-07-24T18:00:01.200Z',
    type: String,
    format: 'date-time',
  })
  completedAt!: Date;

  @ApiProperty({
    description: 'Verification execution duration in milliseconds.',
    example: 1200,
  })
  durationMs!: number;
}
