import { ApiProperty } from '@nestjs/swagger';
import { UserAccountStatus } from '@prisma/client';

export class UserProfileResponseDto {
  @ApiProperty({
    description: 'Unique user identifier (UUID)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id!: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'Swasthik K J',
  })
  fullName!: string;

  @ApiProperty({
    description: 'Primary email address',
    example: 'swasthik@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Optional avatar URL',
    example: 'https://example.com/avatar.png',
    required: false,
    nullable: true,
  })
  avatarUrl?: string | null;

  @ApiProperty({
    description: 'Account status',
    enum: UserAccountStatus,
    example: 'ACTIVE',
  })
  status!: UserAccountStatus;

  @ApiProperty({
    description: 'Timestamp when the user account was created',
    example: '2026-07-25T19:46:15.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp when the user account was last updated',
    example: '2026-08-21T14:00:00.000Z',
  })
  updatedAt!: Date;
}
