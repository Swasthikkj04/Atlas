import { ApiProperty } from '@nestjs/swagger';

export class LatestBriefDto {
  @ApiProperty({
    description: 'Infrastructure health assessment',
    example: 'GOOD',
  })
  overallHealth!: string;

  @ApiProperty({
    description: 'AI-generated infrastructure summary',
    example:
      'The infrastructure is healthy overall. HTTPS is correctly configured, although SPF and DMARC records are missing.',
  })
  summary!: string;

  @ApiProperty({
    description: 'Key infrastructure highlights',
    type: [String],
    example: [
      'TLS certificate is valid',
      'HTTP endpoint responds with 200 OK',
      'Cloudflare CDN detected',
    ],
  })
  highlights!: string[];

  @ApiProperty({
    description: 'Recommended next actions',
    type: [String],
    example: [
      'Configure an SPF record',
      'Publish a DMARC policy',
      'Enable HSTS',
    ],
  })
  recommendations!: string[];

  @ApiProperty({
    description: 'Time the brief was generated',
  })
  generatedAt!: Date;
}
