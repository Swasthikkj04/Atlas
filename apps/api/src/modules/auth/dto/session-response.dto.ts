import { ApiProperty } from '@nestjs/swagger';

export class UserSessionResponseDto {
  @ApiProperty({ example: 'ses-550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Chrome on Linux' })
  deviceName: string;

  @ApiProperty({ example: 'Desktop' })
  deviceType: string;

  @ApiProperty({ example: 'Chrome' })
  browser: string;

  @ApiProperty({ example: 'Linux' })
  operatingSystem: string;

  @ApiProperty({ example: '127.0.0.1' })
  ipAddress: string;

  @ApiProperty({ example: '2026-07-31T19:50:00.000Z' })
  lastActivityAt: Date;

  @ApiProperty({ example: '2026-08-07T19:50:00.000Z' })
  expiresAt: Date;

  @ApiProperty({ example: '2026-07-31T19:50:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: true, required: false })
  isCurrent?: boolean;
}
