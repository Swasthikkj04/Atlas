import { ApiProperty } from '@nestjs/swagger';

export class AccountOverviewResponseDto {
  @ApiProperty({ example: 'usr-123', description: 'Unique user identifier' })
  id: string;

  @ApiProperty({
    example: 'alex@example.com',
    description: 'User primary email address',
  })
  email: string;

  @ApiProperty({
    example: 'Alex Developer',
    description: 'User full display name',
  })
  fullName: string;

  @ApiProperty({
    enum: [
      'ACTIVE',
      'DEACTIVATED',
      'SUSPENDED',
      'LOCKED',
      'DELETED',
      'PENDING_VERIFICATION',
    ],
    example: 'ACTIVE',
    description: 'Current authoritative account lifecycle status',
  })
  status: string;

  @ApiProperty({
    example: true,
    description: 'Whether the account has a password credential established',
  })
  hasPassword: boolean;

  @ApiProperty({
    example: ['GOOGLE'],
    isArray: true,
    description: 'List of external authentication providers connected',
  })
  connectedProviders: string[];

  @ApiProperty({
    example: 2,
    description: 'Count of currently active sessions across all devices',
  })
  activeSessionsCount: number;

  @ApiProperty({
    example: '2026-08-21T10:00:00.000Z',
    description: 'Account creation timestamp',
  })
  createdAt: Date;
}
