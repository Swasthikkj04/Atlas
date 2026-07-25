import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from './user-response.dto';

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Success status message confirming registration',
    example: 'User registered successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Details of the newly registered user profile (excluding sensitive fields)',
    type: UserResponseDto,
  })
  user!: UserResponseDto;
}
