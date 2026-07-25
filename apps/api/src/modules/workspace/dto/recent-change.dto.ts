import { ApiProperty } from '@nestjs/swagger';

export class RecentChangeDto {
  @ApiProperty({
    description: 'Unique identifier of the change record.',
    example: 'd9b2a1c0-3e4f-5a6b-7c8d-9e0f1a2b3c4d',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Associated domain identifier.',
    example: '3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
    format: 'uuid',
  })
  domainId!: string;

  @ApiProperty({
    description: 'Associated domain name.',
    example: 'example.com',
  })
  domainName!: string;

  @ApiProperty({
    description: 'Category or module of the change.',
    example: 'DNS',
  })
  changeType!: string;

  @ApiProperty({
    description: 'Title of the detected change.',
    example: 'A record updated',
  })
  title!: string;

  @ApiProperty({
    description: 'Severity level of the change.',
    example: 'MEDIUM',
  })
  severity!: string;

  @ApiProperty({
    description: 'Timestamp when the change was detected.',
    example: '2026-07-24T18:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  detectedAt!: Date;
}
