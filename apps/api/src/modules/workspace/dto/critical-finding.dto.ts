import { ApiProperty } from '@nestjs/swagger';

export class CriticalFindingDto {
  @ApiProperty({
    description: 'Unique identifier of the finding.',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
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
    description: 'Finding title.',
    example: 'SSL Certificate Expired',
  })
  title!: string;

  @ApiProperty({
    description: 'Finding severity.',
    example: 'CRITICAL',
  })
  severity!: string;

  @ApiProperty({
    description: 'Finding category.',
    example: 'CERTIFICATE',
  })
  category!: string;

  @ApiProperty({
    description: 'Timestamp when the finding was created.',
    example: '2026-07-24T18:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt!: Date;
}
