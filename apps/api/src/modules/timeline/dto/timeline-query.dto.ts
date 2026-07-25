import { ApiPropertyOptional } from '@nestjs/swagger';
import { ChangeSeverity, ChangeType, FindingCategory, FindingModule } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class TimelineQueryDto {
  @ApiPropertyOptional({
    description: 'Filter timeline changes by domain ID.',
    example: '3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
  })
  @IsOptional()
  @IsString()
  domainId?: string;

  @ApiPropertyOptional({
    description: 'Filter timeline changes by severity.',
    enum: ChangeSeverity,
  })
  @IsOptional()
  @IsEnum(ChangeSeverity)
  severity?: ChangeSeverity;

  @ApiPropertyOptional({
    description: 'Filter timeline changes by change type.',
    enum: ChangeType,
  })
  @IsOptional()
  @IsEnum(ChangeType)
  changeType?: ChangeType;

  @ApiPropertyOptional({
    description: 'Filter timeline changes by module.',
    enum: FindingModule,
  })
  @IsOptional()
  @IsEnum(FindingModule)
  module?: FindingModule;

  @ApiPropertyOptional({
    description: 'Filter timeline changes by category.',
    enum: FindingCategory,
  })
  @IsOptional()
  @IsEnum(FindingCategory)
  category?: FindingCategory;

  @ApiPropertyOptional({
    description: 'Filter timeline changes detected after startDate.',
    example: '2026-07-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter timeline changes detected before endDate.',
    example: '2026-07-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Search query string to filter changes by title or description.',
    example: 'HSTS',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for offset pagination.',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cursor ID for pagination.',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

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
