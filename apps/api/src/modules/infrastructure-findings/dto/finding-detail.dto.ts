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

export class FindingDetailDto {
  @ApiProperty({ example: 'find-http-missing-hsts-123' })
  id!: string;

  @ApiProperty({ example: '2e5b652d-c186-41de-8c68-144f58308e24' })
  domainId!: string;

  @ApiProperty({ example: 'example.com' })
  domainName!: string;

  @ApiProperty({ example: 'Missing HSTS Header' })
  title!: string;

  @ApiProperty({
    example:
      'Your web application does not send the Strict-Transport-Security response header. This exposes users to downgrade attacks.',
  })
  description!: string;

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
