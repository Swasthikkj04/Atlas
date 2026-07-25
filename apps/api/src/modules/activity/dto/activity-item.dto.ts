import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivityItemDto {
  @ApiProperty({
    description: 'Unique activity item ID.',
    example: 'act-c1234567-89ab-cdef-0123-456789abcdef',
  })
  id!: string;

  @ApiProperty({
    description: 'Type of workspace activity event.',
    example: 'CHANGE_DETECTED',
  })
  eventType!: string;

  @ApiProperty({
    description: 'Domain ID associated with the activity.',
    example: '3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
    format: 'uuid',
  })
  domainId!: string;

  @ApiProperty({
    description: 'Domain name associated with the activity.',
    example: 'example.com',
  })
  domainName!: string;

  @ApiProperty({
    description: 'Title summarizing the activity.',
    example: 'DNS A record modified',
  })
  title!: string;

  @ApiProperty({
    description: 'Detailed description of the activity event.',
    example: 'A record updated to 1.0.0.1',
  })
  description!: string;

  @ApiPropertyOptional({
    description: 'Severity associated with the activity, if applicable.',
    example: 'HIGH',
  })
  severity?: string;

  @ApiPropertyOptional({
    description: 'Module associated with the activity, if applicable.',
    example: 'DNS',
  })
  module?: string;

  @ApiPropertyOptional({
    description: 'Category associated with the activity, if applicable.',
    example: 'DNS_RECORD',
  })
  category?: string;

  @ApiProperty({
    description: 'Timestamp when the activity occurred.',
    example: '2026-07-24T18:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  occurredAt!: Date;
}
