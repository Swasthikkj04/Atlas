import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { IsStrongPasswordPolicy } from '../validators/password-policy.validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'Jane Doe',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty({
    description: 'Primary email address for authentication',
    example: 'jane.doe@example.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Account password satisfying canonical password strength policy',
    example: 'SuperSecurePassword123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @IsStrongPasswordPolicy()
  password!: string;

  @ApiProperty({
    description: 'Password confirmation (must match password)',
    example: 'SuperSecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  confirmPassword!: string;
}
