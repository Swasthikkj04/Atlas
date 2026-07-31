import { ApiProperty } from '@nestjs/swagger';

export class HistoricalPresenceDto {
  @ApiProperty({
    example: '2026-07-20T10:00:00.000Z',
    description: 'Timestamp when asset was first observed.',
  })
  firstObserved!: Date;

  @ApiProperty({
    example: '2026-07-24T20:00:00.000Z',
    description: 'Timestamp when asset was last observed.',
  })
  lastObserved!: Date;

  @ApiProperty({
    example: true,
    description:
      'Whether the asset is present in the current infrastructure snapshot.',
  })
  currentlyPresent!: boolean;

  @ApiProperty({
    example: 'CERTAIN',
    description: 'Confidence rating (CERTAIN, PROBABLE, UNKNOWN).',
  })
  confidence!: string;
}
