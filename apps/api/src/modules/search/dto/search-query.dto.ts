import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SearchQueryDto {
  @ApiPropertyOptional({
    description: 'Search query string (supports q or query parameter).',
    example: 'google',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Search query string alias.',
    example: 'google',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description:
      'Optional entity type filter (e.g. DOMAIN, FINDING, CHANGE, INFRASTRUCTURE, BRIEF, ACTIVITY).',
    example: 'FINDING',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description:
      'Optional domain identifier to scope search within a specific domain.',
    example: 'd9b2a1c0-3e4f-5a6b-7c8d-9e0f1a2b3c4d',
  })
  @IsOptional()
  @IsString()
  domainId?: string;

  @ApiPropertyOptional({
    description:
      'Optional finding severity filter (e.g. CRITICAL, HIGH, MEDIUM, LOW, INFO).',
    example: 'HIGH',
  })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional({
    description: 'Optional time range filter (e.g. 24h, 7d, 30d).',
    example: '7d',
  })
  @IsOptional()
  @IsString()
  timeRange?: string;

  @ApiPropertyOptional({
    description: 'Optional canonical status filter.',
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of results to return.',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
