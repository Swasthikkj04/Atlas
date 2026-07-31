import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Raw single-use password reset token received via email link',
    example: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({
    description: 'New account password (min 8 characters)',
    example: 'NewSecurePassword123!',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
