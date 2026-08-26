import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DeactivateAccountDto {
  @ApiPropertyOptional({
    description: 'Current password for password-authenticated accounts',
    example: 'CurrentP@ssword123!',
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiPropertyOptional({
    description: 'Explicit confirmation string e.g. "DEACTIVATE"',
    example: 'DEACTIVATE',
  })
  @IsOptional()
  @IsString()
  confirmText?: string;
}
