import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailUserDto {
  @ApiProperty({ example: 'usr-123-uuid' })
  id!: string;

  @ApiProperty({ example: 'Swasthik K J' })
  fullName!: string;

  @ApiProperty({ example: 'swasthik@example.com' })
  email!: string;
}

export class VerifyEmailResponseDto {
  @ApiProperty({
    example: 'Email verified successfully. Your account is now active.',
  })
  message!: string;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Access Token (also set in HTTP-Only cookie)',
    required: false,
  })
  accessToken?: string;

  @ApiProperty({
    example: 'ref_1723456789_xyz',
    description: 'Refresh Token (also set in HTTP-Only cookie)',
    required: false,
  })
  refreshToken?: string;

  @ApiProperty({
    type: VerifyEmailUserDto,
    description: 'Authenticated user profile',
    required: false,
  })
  user?: VerifyEmailUserDto;
}
