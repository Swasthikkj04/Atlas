import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeleteAccountDto {
  @ApiPropertyOptional({
    description: 'Current password for password-authenticated accounts',
    example: 'CurrentP@ssword123!',
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({
    description: 'Explicit confirmation string ("DELETE")',
    example: 'DELETE',
  })
  @IsString()
  @IsNotEmpty({
    message: 'Explicit confirmation required. Please type DELETE.',
  })
  confirmText: string;
}
