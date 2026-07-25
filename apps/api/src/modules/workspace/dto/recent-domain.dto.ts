import { ApiProperty } from '@nestjs/swagger';

export class RecentDomainDto {
  @ApiProperty({
    description: 'Unique identifier of the domain.',
    example: '3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Fully qualified domain name.',
    example: 'example.com',
  })
  domainName!: string;

  @ApiProperty({
    description: 'Whether background monitoring is enabled for the domain.',
    example: true,
  })
  monitoringEnabled!: boolean;

  @ApiProperty({
    description: 'Timestamp when the domain was added.',
    example: '2026-07-24T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt!: Date;
}
