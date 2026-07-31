import { ApiProperty } from '@nestjs/swagger';

export class TimelineEventDto {
  @ApiProperty({
    example: 'evt-3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
    description: 'Unique timeline event ID.',
  })
  id!: string;

  @ApiProperty({
    example: '2026-07-24T20:00:00.000Z',
    description: 'Event detection timestamp.',
  })
  timestamp!: Date;

  @ApiProperty({
    example: '2e5b652d-c186-41de-8c68-144f58308e24',
    description: 'Associated domain ID.',
  })
  domainId!: string;

  @ApiProperty({
    example: 'example.com',
    description: 'Associated domain name.',
  })
  domainName!: string;

  @ApiProperty({
    example: 'HTTP Security Configuration Updated',
    description: 'Event headline title.',
  })
  title!: string;

  @ApiProperty({
    example: 'Strict-Transport-Security header added to HTTP response.',
    description: 'Human-readable event description.',
  })
  description!: string;

  @ApiProperty({
    example: 'MODIFIED',
    description:
      'Canonical change type semantics (ADDED, REMOVED, MODIFIED, DETECTED, RESOLVED, REGRESSED).',
  })
  changeType!: string;

  @ApiProperty({
    example: 'HIGH',
    description: 'Event severity level.',
  })
  severity!: string;

  @ApiProperty({
    example: 'SECURITY_HEADER',
    description:
      'Event category (Security, DNS, TLS, HTTP, Technology, Infrastructure, Certificate, Configuration).',
  })
  category!: string;

  @ApiProperty({
    example: 1.0,
    description: 'Confidence score of change determination (0.0 to 1.0).',
  })
  confidence!: number;

  @ApiProperty({
    example: 'HTTP Security Headers Improved',
    description: 'Concise event narrative summary.',
  })
  summary!: string;

  @ApiProperty({
    example:
      'High risk: Security header missing exposes application to downgrade attacks.',
    description: 'Impact narrative assessment of this change event.',
  })
  impact?: string;

  @ApiProperty({
    example: 3,
    description: 'Number of related findings in this change group.',
  })
  findingCount!: number;

  @ApiProperty({
    example: 2,
    description: 'Number of canonical observations evaluated for this change.',
  })
  observationCount!: number;

  @ApiProperty({
    example: 1,
    description:
      'Number of immutable raw evidence payloads backing this change.',
  })
  evidenceCount!: number;
}
