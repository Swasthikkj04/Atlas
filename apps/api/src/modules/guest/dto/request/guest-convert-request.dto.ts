import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class GuestConvertRequestDto {
  @ApiProperty({ example: 'Jane Doe', description: 'Full name of user registering account' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'jane@example.com', description: 'Valid email address for workspace' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Account password (min 8 characters)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
