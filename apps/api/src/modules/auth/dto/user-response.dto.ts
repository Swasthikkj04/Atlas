import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique user identifier (UUID)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id!: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'Jane Doe',
  })
  fullName!: string;

  @ApiProperty({
    description: 'Primary email address',
    example: 'jane.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Timestamp when the user account was created',
    example: '2026-07-25T19:46:15.000Z',
    required: false,
  })
  createdAt?: Date;
}