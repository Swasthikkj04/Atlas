import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPasswordPolicy } from '../validators/password-policy.validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current account password for verification',
    example: 'CurrentSecurePassword123!',
  })
  @IsString({ message: 'Current password must be a string' })
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword!: string;

  @ApiProperty({
    description: 'New account password satisfying canonical password policy',
    example: 'NewSuperSecurePassword456!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString({ message: 'New password must be a string' })
  @IsStrongPasswordPolicy()
  newPassword!: string;
}
