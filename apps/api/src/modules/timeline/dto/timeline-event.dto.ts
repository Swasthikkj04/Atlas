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

  @ApiProperty({
    example: 'snp-3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
    description: 'Current snapshot ID associated with this change event.',
    required: false,
  })
  snapshotId?: string;

  @ApiProperty({
    example: 'snp-3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
    description: 'Current snapshot ID associated with this change event.',
    required: false,
  })
  currentSnapshotId?: string | null;

  @ApiProperty({
    example: 'snp-2e5b652d-c186-41de-8c68-144f58308e24',
    description: 'Previous snapshot ID used for difference comparison.',
    required: false,
  })
  previousSnapshotId?: string | null;

  @ApiProperty({
    example: '2026-07-24T20:00:00.000Z',
    description: 'Detection ISO timestamp string.',
    required: false,
  })
  detectedAt?: string;

  @ApiProperty({
    example: 'DENY',
    description: 'Previous value before the change.',
    required: false,
  })
  previousValue?: string | null;

  @ApiProperty({
    example: 'SAMEORIGIN',
    description: 'Current value after the change.',
    required: false,
  })
  currentValue?: string | null;

  @ApiProperty({
    example:
      'X-Frame-Options controls whether browsers can render this domain in frames, protecting against clickjacking attacks.',
    description: 'Authoritative significance explanation of this change event.',
    required: false,
  })
  explanation?: string;

  @ApiProperty({
    example: 'Content-Security-Policy',
    description: 'Target infrastructure component or policy subject.',
    required: false,
  })
  subject?: string;

  @ApiProperty({
    example:
      'Nebula verified that the current authoritative response contains a Content-Security-Policy that differs from the previous verified response.',
    description: 'Authoritative factual boundary establishing what this change proves.',
    required: false,
  })
  whatThisEstablishes?: string;

  @ApiProperty({
    example:
      'This change does not guarantee that all content-injection or XSS scenarios are prevented.',
    description: 'Explicit anti-overclaiming boundary stating what this change does not establish.',
    required: false,
  })
  whatThisDoesNotEstablish?: string;

  @ApiProperty({
    description: 'Authoritative derived comparison summary for complex policies.',
    required: false,
  })
  derivedSummary?: {
    previousLabel?: string;
    currentLabel?: string;
    postureChange?: string;
    directives?: { previous: number; current: number };
    allowedSources?: string;
    browserRestrictions?: string;
    overallPosture?: string;
  } | null;
}
