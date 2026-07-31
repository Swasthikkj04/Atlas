import { ApiProperty } from '@nestjs/swagger';

export class ReadinessChecksDto {
  @ApiProperty({
    example: 'UP',
    description: 'Database connectivity status (UP/DOWN).',
  })
  database!: string;

  @ApiProperty({
    example: 'UP',
    description: 'Worker subsystem status (UP/DOWN).',
  })
  worker!: string;

  @ApiProperty({
    example: 'UP',
    description: 'Configuration subsystem status (UP/DOWN).',
  })
  configuration!: string;
}

export class ReadinessResponseDto {
  @ApiProperty({
    example: 'READY',
    description: 'Overall readiness status (READY/NOT_READY).',
  })
  status!: string;

  @ApiProperty({
    example: 'atlas-api',
    description: 'Application service identifier.',
  })
  service!: string;

  @ApiProperty({ example: '1.0.0', description: 'Application version.' })
  version!: string;

  @ApiProperty({
    type: ReadinessChecksDto,
    description: 'Individual readiness check results.',
  })
  checks!: ReadinessChecksDto;

  @ApiProperty({
    example: '2026-07-26T08:10:11.542Z',
    description: 'Timestamp of check.',
  })
  timestamp!: string;
}
