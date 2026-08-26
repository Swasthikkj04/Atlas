import { ApiProperty } from '@nestjs/swagger';

export class FindingEvidenceDto {
  @ApiProperty({
    example: 'ev-v7-018f2a4b8e12-7000',
    description: 'Unique immutable evidence ID.',
  })
  evidenceId!: string;

  @ApiProperty({
    example: 'http-collector',
    description: 'Collector module name that captured the payload.',
  })
  collector!: string;

  @ApiProperty({
    example: '2026-07-24T20:00:00.000Z',
    description: 'Collection timestamp.',
  })
  collectionTime!: Date;

  @ApiProperty({
    example: 'HTTP_RESPONSE',
    description: 'Evidence category taxonomy.',
  })
  category!: string;

  @ApiProperty({
    example: 'VERIFIED',
    description: 'Cryptographic SHA-256 integrity verification status.',
  })
  integrityStatus!: string;

  @ApiProperty({
    example: '/api/v1/evidence/ev-v7-018f2a4b8e12-7000',
    description: 'URL to retrieve immutable raw payload.',
  })
  rawUrl!: string;

  @ApiProperty({
    example: 'sha256-verified-evidence-proof',
    required: false,
  })
  hashSha256?: string;

  @ApiProperty({
    example: 'https://example.com',
    required: false,
  })
  target?: string;

  @ApiProperty({
    example: 200,
    required: false,
  })
  responseStatus?: number;

  @ApiProperty({
    example: 'GET',
    required: false,
  })
  requestMethod?: string;

  @ApiProperty({
    example: 'HTTP/2',
    required: false,
  })
  protocolVersion?: string;

  @ApiProperty({
    example: '{"headers": {"server": "cloudflare"}}',
    required: false,
  })
  payload?: string;
}
