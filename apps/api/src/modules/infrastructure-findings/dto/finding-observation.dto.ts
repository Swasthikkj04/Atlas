import { ApiProperty } from '@nestjs/swagger';

export class FindingObservationDto {
  @ApiProperty({
    example: 'strictTransportSecurity',
    description: 'Canonical observation property key.',
  })
  key!: string;

  @ApiProperty({
    example: 'MISSING',
    description: '4-state observation state (OBSERVED, MISSING, UNKNOWN, FAILED).',
  })
  state!: string;

  @ApiProperty({
    example: '2026-07-24T20:00:00.000Z',
    description: 'Observation timestamp.',
  })
  observedAt!: Date;

  @ApiProperty({
    example: 'ev-v7-018f2a4b8e12-7000',
    description: 'Reference ID to originating immutable raw evidence.',
  })
  evidenceRef!: string;

  @ApiProperty({
    example: 'max-age=31536000',
    description: 'Observed value (if state === OBSERVED).',
    nullable: true,
  })
  value?: string;
}
