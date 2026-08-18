import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPasswordPolicy } from '../validators/password-policy.validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Raw single-use password reset token received via email link',
    example: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
  })
  @IsNotEmpty()
  @IsString()
  token!: string;

  @ApiProperty({
    description: 'New account password satisfying canonical password strength policy',
    example: 'NewSecurePassword123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsNotEmpty()
  @IsString()
  @IsStrongPasswordPolicy()
  password!: string;
}
