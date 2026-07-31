import { ApiPropertyOptional } from '@nestjs/swagger';
import { FindingCategory, Severity } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FindingsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter findings by domain ID.',
    example: '2e5b652d-c186-41de-8c68-144f58308e24',
  })
  @IsOptional()
  @IsString()
  domainId?: string;

  @ApiPropertyOptional({
    description: 'Filter findings by severity.',
    enum: Severity,
  })
  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @ApiPropertyOptional({
    description: 'Filter findings by category.',
    enum: FindingCategory,
  })
  @IsOptional()
  @IsEnum(FindingCategory)
  category?: FindingCategory;

  @ApiPropertyOptional({
    description:
      'Filter findings by state (OPEN, RESOLVED, REGRESSED, ACKNOWLEDGED).',
    example: 'OPEN',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description:
      'Filter findings by confidence rating (CERTAIN, PROBABLE, UNKNOWN).',
    example: 'CERTAIN',
  })
  @IsOptional()
  @IsString()
  confidence?: string;

  @ApiPropertyOptional({
    description: 'Free-text search query across title and description.',
    example: 'HSTS',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination.',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page.',
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
