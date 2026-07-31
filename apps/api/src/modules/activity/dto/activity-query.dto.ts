import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ActivityQueryDto {
  @ApiPropertyOptional({
    description: 'Filter activity by domain ID.',
    example: '3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
  })
  @IsOptional()
  @IsString()
  domainId?: string;

  @ApiPropertyOptional({
    description:
      'Filter activity by severity (INFO, LOW, MEDIUM, HIGH, CRITICAL).',
    example: 'CRITICAL',
  })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional({
    description: 'Filter activity by module (DNS, SSL, HTTP, etc.).',
    example: 'DNS',
  })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({
    description:
      'Filter activity by event type (CHANGE_DETECTED, VERIFICATION_COMPLETED, UNDERSTANDING_COMPLETED, CRITICAL_FINDING).',
    example: 'CHANGE_DETECTED',
  })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional({
    description: 'Filter activity occurred after startDate.',
    example: '2026-07-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter activity occurred before endDate.',
    example: '2026-07-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Cursor ID for pagination.',
    example: 'act-c1234567-89ab-cdef-0123-456789abcdef',
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
