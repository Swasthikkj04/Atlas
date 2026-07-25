import { ApiProperty } from '@nestjs/swagger';
import { ChangeSeverity, ChangeType, FindingCategory, FindingModule } from '@prisma/client';

export class TimelineItemDto {
  @ApiProperty({
    description: 'Unique change record ID.',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Domain ID associated with the change.',
    example: '3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
    format: 'uuid',
  })
  domainId!: string;

  @ApiProperty({
    description: 'Domain name associated with the change.',
    example: 'example.com',
  })
  domainName!: string;

  @ApiProperty({
    description: 'Module where change occurred.',
    enum: FindingModule,
    example: 'DNS',
  })
  module!: FindingModule;

  @ApiProperty({
    description: 'Category of the change.',
    enum: FindingCategory,
    example: 'DNS_RECORD',
  })
  category!: FindingCategory;

  @ApiProperty({
    description: 'Type of change.',
    enum: ChangeType,
    example: 'MODIFIED',
  })
  changeType!: ChangeType;

  @ApiProperty({
    description: 'Severity level of the change.',
    enum: ChangeSeverity,
    example: 'HIGH',
  })
  severity!: ChangeSeverity;

  @ApiProperty({
    description: 'Title of the change.',
    example: 'A record updated from 1.1.1.1 to 1.0.0.1',
  })
  title!: string;

  @ApiProperty({
    description: 'Detailed description of the change.',
    example: 'The DNS A record for example.com was modified.',
  })
  description!: string;

  @ApiProperty({
    description: 'Timestamp when the change was detected.',
    example: '2026-07-24T18:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  detectedAt!: Date;
}
