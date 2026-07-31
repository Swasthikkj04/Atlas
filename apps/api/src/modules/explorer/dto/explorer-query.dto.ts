import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ExplorerQueryDto {
  @ApiPropertyOptional({
    description: 'Filter assets by domain ID.',
    example: '2e5b652d-c186-41de-8c68-144f58308e24',
  })
  @IsOptional()
  @IsString()
  domainId?: string;

  @ApiPropertyOptional({
    description:
      'Filter assets by category (Technologies, DNS, HTTP, TLS, Certificates, Security Headers, Infrastructure Services, Detected Platforms).',
    example: 'Technologies',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Free-text search query across asset name and value.',
    example: 'Cloudflare',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      'Filter assets by confidence rating (CERTAIN, PROBABLE, UNKNOWN).',
    example: 'CERTAIN',
  })
  @IsOptional()
  @IsString()
  confidence?: string;

  @ApiPropertyOptional({
    description: 'Page number for offset pagination.',
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
