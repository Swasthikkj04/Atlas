import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminStatus } from '../contracts/admin-identity.contract';

/**
 * ADMIN-001: Update Admin Status DTO
 *
 * Controls the explicit lifecycle state (ACTIVE | DISABLED) of the Admin identity.
 */
export class UpdateAdminStatusDto {
  @ApiProperty({
    description: 'Target lifecycle status for Admin identity',
    enum: AdminStatus,
    example: AdminStatus.DISABLED,
  })
  @IsEnum(AdminStatus)
  @IsNotEmpty()
  status!: AdminStatus;

  @ApiPropertyOptional({
    description: 'Auditable reason when disabling Admin identity',
    example: 'Scheduled rotation or maintenance',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
