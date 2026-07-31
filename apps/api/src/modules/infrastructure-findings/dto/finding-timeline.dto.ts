import { ApiProperty } from '@nestjs/swagger';

export class FindingTimelineDto {
  @ApiProperty({
    example: '2026-07-21T10:00:00.000Z',
    description: 'Timestamp when finding was first detected.',
  })
  firstDetectedAt!: Date;

  @ApiProperty({
    example: '2026-07-24T20:00:00.000Z',
    description: 'Timestamp when finding was last verified present.',
  })
  lastVerifiedAt!: Date;

  @ApiProperty({
    example: 'OPEN',
    description:
      'Current state of finding (OPEN, RESOLVED, REGRESSED, ACKNOWLEDGED).',
  })
  state!: string;
}
