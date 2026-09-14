import { ApiProperty } from '@nestjs/swagger';
import { FindingEvidenceDto } from './finding-evidence.dto';
import { FindingObservationDto } from './finding-observation.dto';
import { FindingRecommendationDto } from './finding-recommendation.dto';
import { FindingTimelineDto } from './finding-timeline.dto';

export class RuleExplainabilityDto {
  @ApiProperty({ example: 'http.missing-hsts' })
  ruleId!: string;

  @ApiProperty({ example: '1.0.0' })
  ruleVersion!: string;

  @ApiProperty({ example: 'Missing HSTS Header Rule' })
  name!: string;

  @ApiProperty({ example: 'SECURITY_HEADER' })
  category!: string;

  @ApiProperty({
    example:
      'Evaluates strictTransportSecurity canonical observation state. Triggers when state === MISSING.',
  })
  evaluationLogic!: string;
}

export class ProcessingEvidenceItemDto {
  @ApiProperty({ example: 'Finding resolved' })
  step!: string;

  @ApiProperty({
    example: 'SUCCESS',
    description: 'SUCCESS | WARNING | ERROR | INFO',
  })
  status!: string;

  @ApiProperty({
    example: 'Finding find-http-missing-hsts-123 resolved from snapshot',
    required: false,
  })
  description?: string;

  @ApiProperty({ example: '2026-08-25T12:00:00Z', required: false })
  timestamp?: Date | string;

  @ApiProperty({ required: false })
  metadata?: Record<string, unknown>;
}

export class FindingEvidenceLineageDto {
  @ApiProperty({ example: 'snp-3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1' })
  snapshotId!: string;

  @ApiProperty({ example: 'security_header' })
  observationKey!: string;

  @ApiProperty({
    example: 'Strict-Transport-Security is absent',
    required: false,
  })
  observedValue?: string;

  @ApiProperty({ example: 'rule.http.security_header', required: false })
  ruleId?: string;

  @ApiProperty({ example: '2026-08-25T12:00:00Z', required: false })
  evaluationTimestamp?: string;
}

export class FindingDetailDto {
  @ApiProperty({ example: 'find-http-missing-hsts-123' })
  id!: string;

  @ApiProperty({ example: '2e5b652d-c186-41de-8c68-144f58308e24' })
  domainId!: string;

  @ApiProperty({ example: 'snp-3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1' })
  snapshotId!: string;

  @ApiProperty({ example: 'example.com' })
  domainName!: string;

  @ApiProperty({ example: 'SECURITY_HEADER' })
  category!: string;

  @ApiProperty({
    example: 'HIGH',
    description: 'Severity level (CRITICAL, HIGH, MEDIUM, LOW, INFO).',
  })
  severity!: string;

  @ApiProperty({
    example: 'CERTAIN',
    description: 'Confidence model rating (CERTAIN, PROBABLE, UNKNOWN).',
  })
  confidence!: string;

  @ApiProperty({
    example: 'OPEN',
    description: 'Canonical state (OPEN, RESOLVED, REGRESSED, ACKNOWLEDGED).',
  })
  state!: string;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Canonical status (ACTIVE, RESOLVED, MUTED).',
  })
  status!: string;

  @ApiProperty({ example: 'Missing HSTS Header' })
  title!: string;

  @ApiProperty({
    example:
      'Your web application does not send the Strict-Transport-Security response header. This exposes users to downgrade attacks.',
  })
  description!: string;

  @ApiProperty({
    example:
      'Your web application does not send the Strict-Transport-Security response header. This exposes users to downgrade attacks.',
  })
  explanation!: string;

  @ApiProperty({
    example:
      'Configure the Strict-Transport-Security HTTP response header on your web server or CDN with a max-age of at least 31536000 seconds (1 year).',
    required: false,
  })
  remediation?: string;

  @ApiProperty({
    example: 'SECURITY_HARDENING_GAP',
    description:
      'Risk Classification (CONFIRMED_SECURITY_CONDITION, SECURITY_HARDENING_GAP, OPERATIONAL_OBSERVATION, INFORMATIONAL_OBSERVATION)',
    required: false,
  })
  riskClassification?: string;

  @ApiProperty({
    example:
      'HSTS ensures user agents only interact with the domain over authenticated TLS channels, mitigating transport downgrade attacks.',
    required: false,
  })
  severityRationale?: string;

  @ApiProperty({
    example:
      'This observation does not establish that network traffic is currently being intercepted or downgraded. It identifies the absence of a proactive HTTPS enforcement header.',
    required: false,
  })
  whatThisDoesNotProve?: string;

  @ApiProperty({
    example: 'COMPLETED',
    description:
      'Explicit processing state (COMPLETED, PARTIAL, INVALID, FAILED).',
  })
  processingStatus!: string;

  @ApiProperty({
    example:
      'Infrastructure was processed successfully and finding state verified.',
  })
  processingSummary!: string;

  @ApiProperty({ type: [ProcessingEvidenceItemDto] })
  processingEvidence!: ProcessingEvidenceItemDto[];

  @ApiProperty({ type: FindingEvidenceLineageDto, required: false })
  lineage?: FindingEvidenceLineageDto;

  @ApiProperty({ example: '2026-08-25T12:00:00Z' })
  detectedAt!: Date | string;

  @ApiProperty({ example: '2026-08-25T12:00:00Z' })
  createdAt!: Date | string;

  @ApiProperty({ type: RuleExplainabilityDto })
  rule!: RuleExplainabilityDto;

  @ApiProperty({ type: [FindingObservationDto] })
  observations!: FindingObservationDto[];

  @ApiProperty({ type: [FindingEvidenceDto] })
  evidence!: FindingEvidenceDto[];

  @ApiProperty({ type: FindingTimelineDto })
  timeline!: FindingTimelineDto;

  @ApiProperty({ type: [FindingRecommendationDto] })
  recommendations!: FindingRecommendationDto[];
}
