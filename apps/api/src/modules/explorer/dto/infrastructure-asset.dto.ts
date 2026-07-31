import { ApiProperty } from '@nestjs/swagger';

export class InfrastructureAssetDto {
  @ApiProperty({
    example: 'ast-tech-gws-123',
    description: 'Unique infrastructure asset ID.',
  })
  assetId!: string;

  @ApiProperty({
    example: 'Technologies',
    description:
      'Asset category (Technologies, DNS, HTTP, TLS, Certificates, Security Headers, Infrastructure Services, Detected Platforms).',
  })
  category!: string;

  @ApiProperty({
    example: 'Google Web Server (gws)',
    description: 'Human-readable asset name.',
  })
  name!: string;

  @ApiProperty({
    example: 'gws',
    description: 'Canonical value of the asset.',
  })
  value!: string;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Asset status (ACTIVE, INACTIVE, DEPRECATED, UNKNOWN).',
  })
  status!: string;

  @ApiProperty({
    example: 'CERTAIN',
    description: 'Confidence rating (CERTAIN, PROBABLE, UNKNOWN).',
  })
  confidence!: string;

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
    example: 'snap-28364062',
    description: 'Current infrastructure snapshot ID.',
    nullable: true,
  })
  currentSnapshotId!: string | null;

  @ApiProperty({
    example: 'http-discovery',
    description: 'Originating discovery plugin module.',
  })
  sourcePlugin!: string;

  @ApiProperty({
    example: 'http-knowledge',
    description: 'Originating knowledge normalizer plugin module.',
  })
  knowledgePlugin!: string;

  @ApiProperty({
    example: 2,
    description: 'Count of raw evidence artifacts backing this asset.',
  })
  evidenceCount!: number;

  @ApiProperty({
    example: 1,
    description: 'Count of active findings associated with this asset.',
  })
  findingCount!: number;
}
