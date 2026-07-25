import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Primary email address for authentication',
    example: 'jane.doe@example.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Account password (minimum 8 characters)',
    example: 'SuperSecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}