import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GuestProgressDto {
  @ApiProperty({ example: 35 })
  percentage: number;

  @ApiProperty({ example: 'Observing public infrastructure...' })
  message: string;
}

export class GuestSummaryDto {
  @ApiProperty({
    example: 'github.com operates a high-availability multi-region edge...',
  })
  executiveBrief: string;

  @ApiProperty({ example: ['Dual-layer CDN', 'HTTP/3 Enabled', 'Strict HSTS'] })
  highlights: string[];

  @ApiProperty({ example: 'LOW' })
  riskLevel: string;
}

export class GuestStatsDto {
  @ApiProperty({ example: 12 })
  hosts: number;

  @ApiProperty({ example: 45 })
  services: number;

  @ApiProperty({ example: 3 })
  findings: number;
}

export class GuestNextActionDto {
  @ApiProperty({ example: 'CREATE_ACCOUNT' })
  action: string;
}

export class GuestUnderstandingStatusDto {
  @ApiProperty({
    example: 'COMPLETED',
    description:
      'Presentation state: PENDING | DISCOVERING | ANALYZING | GENERATING_SUMMARY | COMPLETED | FAILED',
  })
  status: string;

  @ApiPropertyOptional({ type: GuestProgressDto })
  progress?: GuestProgressDto;

  @ApiPropertyOptional({ type: GuestSummaryDto })
  summary?: GuestSummaryDto;

  @ApiPropertyOptional({ type: GuestStatsDto })
  stats?: GuestStatsDto;

  @ApiPropertyOptional({ type: GuestNextActionDto })
  next?: GuestNextActionDto;

  @ApiPropertyOptional({
    example: 'We could not complete infrastructure understanding.',
  })
  message?: string;

  @ApiPropertyOptional({ example: true })
  retryAvailable?: boolean;
}
