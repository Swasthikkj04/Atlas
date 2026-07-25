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
}
