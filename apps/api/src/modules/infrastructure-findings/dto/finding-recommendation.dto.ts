import { ApiProperty } from '@nestjs/swagger';

export class FindingRecommendationDto {
  @ApiProperty({
    example: 'Enable HSTS Header',
    description: 'Recommendation action title.',
  })
  title!: string;

  @ApiProperty({
    example:
      'Configure the Strict-Transport-Security response header with max-age=31536000 and includeSubDomains.',
    description: 'Detailed remediation guidance.',
  })
  description!: string;

  @ApiProperty({
    example: 'HIGH',
    description: 'Remediation priority (HIGH, MEDIUM, LOW).',
  })
  priority!: string;

  @ApiProperty({
    example: 'LOW',
    description: 'Estimated implementation effort (LOW, MEDIUM, HIGH).',
  })
  estimatedEffort!: string;

  @ApiProperty({
    example: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security'],
    description: 'Reference links and documentation.',
  })
  references!: string[];
}
