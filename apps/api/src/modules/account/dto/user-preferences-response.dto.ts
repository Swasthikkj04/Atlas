import { ApiProperty } from '@nestjs/swagger';

export class UserPreferencesResponseDto {
  @ApiProperty({
    enum: ['system', 'light', 'dark'],
    description: 'Resolved interface theme preference',
    example: 'system',
  })
  theme: 'system' | 'light' | 'dark';

  @ApiProperty({
    enum: ['system', 'standard', 'reduced'],
    description: 'Resolved motion preference',
    example: 'system',
  })
  motion: 'system' | 'standard' | 'reduced';

  @ApiProperty({
    description: 'Timestamp of last preference update',
    example: '2026-08-21T12:00:00.000Z',
  })
  updatedAt: Date;
}
