import { ApiProperty } from '@nestjs/swagger';

export type DriftChangeType = 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';
export type DriftRiskLevel = 'CLEAN' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export class DiffItemDto {
  @ApiProperty({ example: 'A Records' })
  field: string;

  @ApiProperty({
    example: 'MODIFIED',
    enum: ['ADDED', 'REMOVED', 'MODIFIED', 'UNCHANGED'],
  })
  type: DriftChangeType;

  @ApiProperty({ required: false })
  previousValue?: any;

  @ApiProperty({ required: false })
  currentValue?: any;

  @ApiProperty({
    example: 'IP address shifted from 104.21.4.1 to 172.67.182.5',
  })
  description: string;

  @ApiProperty({
    example: 'LOW',
    enum: ['CLEAN', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
  })
  severity: DriftRiskLevel;
}

export class DnsDriftSummaryDto {
  @ApiProperty({ type: [DiffItemDto] })
  changes: DiffItemDto[];

  @ApiProperty({ example: false })
  ipShiftDetected: boolean;

  @ApiProperty({ example: false })
  nameserverShiftDetected: boolean;
}

export class TlsDriftSummaryDto {
  @ApiProperty({ type: [DiffItemDto] })
  changes: DiffItemDto[];

  @ApiProperty({ example: 85 })
  daysRemainingPrevious?: number;

  @ApiProperty({ example: 45 })
  daysRemainingCurrent?: number;

  @ApiProperty({ example: false })
  issuerChanged: boolean;
}

export class HttpDriftSummaryDto {
  @ApiProperty({ type: [DiffItemDto] })
  changes: DiffItemDto[];

  @ApiProperty({ example: 200 })
  previousStatus?: number;

  @ApiProperty({ example: 200 })
  currentStatus?: number;

  @ApiProperty({ example: 5 })
  noiseHeadersSuppressed: number;
}

export class TechDriftSummaryDto {
  @ApiProperty({ type: [DiffItemDto] })
  changes: DiffItemDto[];

  @ApiProperty({ example: ['Cloudflare', 'Next.js'] })
  addedTechnologies: string[];

  @ApiProperty({ example: ['Express'] })
  removedTechnologies: string[];
}

export class SnapshotDriftForensicsResponseDto {
  @ApiProperty({ example: 'snp-base-123' })
  baseSnapshotId: string;

  @ApiProperty({ example: 'snp-target-456' })
  targetSnapshotId: string;

  @ApiProperty({ example: '3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1' })
  domainId: string;

  @ApiProperty({ example: 'example.com' })
  domainName: string;

  @ApiProperty({ example: '2026-09-01T12:00:00Z' })
  baseCapturedAt: Date;

  @ApiProperty({ example: '2026-09-06T12:00:00Z' })
  targetCapturedAt: Date;

  @ApiProperty({ example: 25 })
  driftScore: number;

  @ApiProperty({
    example: 'LOW',
    enum: ['CLEAN', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
  })
  riskLevel: DriftRiskLevel;

  @ApiProperty({ example: true })
  hasMeaningfulDrift: boolean;

  @ApiProperty({ example: 3 })
  totalChangesCount: number;

  @ApiProperty({
    example: [
      'TLS certificate is active with 45 days remaining (decreased from 85 days).',
      'No critical DNS routing hijacks detected.',
    ],
  })
  forensicNarrative: string[];

  @ApiProperty({ type: DnsDriftSummaryDto })
  dns: DnsDriftSummaryDto;

  @ApiProperty({ type: TlsDriftSummaryDto })
  tls: TlsDriftSummaryDto;

  @ApiProperty({ type: HttpDriftSummaryDto })
  http: HttpDriftSummaryDto;

  @ApiProperty({ type: TechDriftSummaryDto })
  technology: TechDriftSummaryDto;
}
