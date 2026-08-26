import { ApiProperty } from '@nestjs/swagger';
import { FindingEvidenceDto } from './finding-evidence.dto';
import { FindingObservationDto } from './finding-observation.dto';
import { RuleExplainabilityDto } from './finding-detail.dto';

export class FindingEvidenceResponseDto {
  @ApiProperty({ example: 'find-http-missing-hsts-123' })
  findingId!: string;

  @ApiProperty({ example: '2e5b652d-c186-41de-8c68-144f58308e24' })
  domainId!: string;

  @ApiProperty({ example: 'example.com' })
  domainName!: string;

  @ApiProperty({ example: 'snp-stripe-002' })
  snapshotId!: string;

  @ApiProperty({ type: RuleExplainabilityDto })
  rule!: RuleExplainabilityDto;

  @ApiProperty({ type: [FindingObservationDto] })
  observations!: FindingObservationDto[];

  @ApiProperty({ type: [FindingEvidenceDto] })
  evidence!: FindingEvidenceDto[];
}
