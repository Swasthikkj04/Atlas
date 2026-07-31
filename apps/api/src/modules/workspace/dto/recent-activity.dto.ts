import { ApiProperty } from '@nestjs/swagger';

export class RecentActivityDto {
  @ApiProperty({
    description: 'Unique identifier of the activity.',
    example: '2f0d8c9d-4d8f-4d6d-9b3e-f3c1d5b0c123',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Activity type.',
    example: 'UNDERSTANDING_COMPLETED',
  })
  type!: string;

  @ApiProperty({
    description: 'Human-readable activity title.',
    example: 'Infrastructure understanding completed.',
  })
  title!: string;

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
    description: 'Timestamp when the activity occurred.',
    example: '2026-07-23T09:15:00.000Z',
    type: String,
    format: 'date-time',
  })
  occurredAt!: Date;
}
