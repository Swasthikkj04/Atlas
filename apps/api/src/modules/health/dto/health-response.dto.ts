import { ApiProperty } from '@nestjs/swagger';

export class DatabaseCheckDto {
  @ApiProperty({ example: 'UP', description: 'Database status (UP/DOWN).' })
  status!: string;

  @ApiProperty({
    example: 3,
    description: 'Database query ping latency in milliseconds.',
  })
  latencyMs!: number;
}

export class WorkerCheckDto {
  @ApiProperty({
    example: 'UP',
    description: 'Worker subsystem status (UP/DOWN).',
  })
  status!: string;
}

export class MemoryCheckDto {
  @ApiProperty({ example: 'UP', description: 'Memory status (UP/DEGRADED).' })
  status!: string;

  @ApiProperty({ example: 112, description: 'Heap memory used in megabytes.' })
  heapUsedMB!: number;

  @ApiProperty({ example: 204, description: 'Heap memory total in megabytes.' })
  heapTotalMB!: number;

  @ApiProperty({
    example: 180,
    description: 'Resident Set Size memory in megabytes.',
  })
  rssMB!: number;
}

export class ProcessCheckDto {
  @ApiProperty({ example: 'UP', description: 'Process status.' })
  status!: string;

  @ApiProperty({ example: 18452, description: 'Process uptime in seconds.' })
  uptimeSeconds!: number;

  @ApiProperty({ example: 1234, description: 'Process ID.' })
  pid!: number;

  @ApiProperty({ example: 'v24.0.0', description: 'Node.js runtime version.' })
  nodeVersion!: string;

  @ApiProperty({ example: 'production', description: 'Environment name.' })
  environment!: string;
}

export class SubsystemChecksDto {
  @ApiProperty({ type: DatabaseCheckDto })
  database!: DatabaseCheckDto;

  @ApiProperty({ type: WorkerCheckDto })
  worker!: WorkerCheckDto;

  @ApiProperty({ type: MemoryCheckDto })
  memory!: MemoryCheckDto;

  @ApiProperty({ type: ProcessCheckDto })
  process!: ProcessCheckDto;
}

export class HealthResponseDto {
  @ApiProperty({
    example: 'HEALTHY',
    description:
      'Overall platform health status (HEALTHY, DEGRADED, UNHEALTHY).',
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
    type: SubsystemChecksDto,
    description: 'Comprehensive subsystem health checks.',
  })
  checks!: SubsystemChecksDto;

  @ApiProperty({
    example: '2026-07-26T08:10:11.542Z',
    description: 'Timestamp of check.',
  })
  timestamp!: string;
}
