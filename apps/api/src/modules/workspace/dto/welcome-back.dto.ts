import { ApiProperty } from '@nestjs/swagger';

export class WelcomeBackDto {
  @ApiProperty({
    description: 'User full name.',
    example: 'John Doe',
  })
  fullName!: string;

  @ApiProperty({
    description: 'User email address.',
    example: 'user@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Timestamp of the latest completed infrastructure scan.',
    example: '2026-07-24T19:00:00.000Z',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  lastScan!: Date | null;
}
