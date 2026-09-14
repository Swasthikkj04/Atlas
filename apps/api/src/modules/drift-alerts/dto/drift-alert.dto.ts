import { ApiProperty } from '@nestjs/swagger';
import { DiffItemDto } from '../../infrastructure-snapshots/dto/snapshot-drift.dto';
import type { DriftRiskLevel } from '../../infrastructure-snapshots/dto/snapshot-drift.dto';

export type DriftAlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
export type DriftAlertCategory =
  'DNS' | 'TLS' | 'HTTP_SECURITY' | 'TECH_STACK' | 'ROUTING';

export class DriftAlertDto {
  @ApiProperty({ example: 'alert_98a7sd6f' })
  id: string;

  @ApiProperty({ example: 'dom-123' })
  domainId: string;

  @ApiProperty({ example: 'example.com' })
  domainName: string;

  @ApiProperty({ example: 'snp-target-456' })
  snapshotId: string;

  @ApiProperty({ example: 'snp-base-123', required: false })
  previousSnapshotId?: string;

  @ApiProperty({ example: 65 })
  driftScore: number;

  @ApiProperty({
    example: 'HIGH',
    enum: ['CLEAN', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
  })
  riskLevel: DriftRiskLevel;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'],
  })
  status: DriftAlertStatus;

  @ApiProperty({
    example: 'HTTP_SECURITY',
    enum: ['DNS', 'TLS', 'HTTP_SECURITY', 'TECH_STACK', 'ROUTING'],
  })
  category: DriftAlertCategory;

  @ApiProperty({ example: 'Critical Security Header Removed' })
  title: string;

  @ApiProperty({
    example: 'Content-Security-Policy was removed from HTTP response headers.',
  })
  summary: string;

  @ApiProperty({
    type: [String],
    example: ['CSP header missing on target edge.'],
  })
  forensicNarrative: string[];

  @ApiProperty({ type: [DiffItemDto] })
  changes: DiffItemDto[];

  @ApiProperty({ example: '2026-09-06T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-06T12:05:00Z', required: false })
  acknowledgedAt?: Date;

  @ApiProperty({ example: 'user-123', required: false })
  acknowledgedBy?: string;
}

export class AcknowledgeAlertDto {
  @ApiProperty({ example: 'ACKNOWLEDGED', enum: ['ACKNOWLEDGED', 'RESOLVED'] })
  status: 'ACKNOWLEDGED' | 'RESOLVED';
}
