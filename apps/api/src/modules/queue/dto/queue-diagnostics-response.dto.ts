import { ApiProperty } from '@nestjs/swagger';

export class WorkerActivityDto {
  @ApiProperty({ example: 2, description: 'Number of active worker threads.' })
  active!: number;

  @ApiProperty({ example: 1, description: 'Number of idle worker threads.' })
  idle!: number;

  @ApiProperty({ example: 1, description: 'Number of busy worker threads processing jobs.' })
  busy!: number;

  @ApiProperty({ example: 18452, description: 'Worker subsystem uptime in seconds.' })
  uptimeSeconds!: number;
}

export class QueueJobCountsDto {
  @ApiProperty({ example: 5, description: 'Number of queued pending jobs.' })
  queued!: number;

  @ApiProperty({ example: 2, description: 'Number of currently running jobs.' })
  running!: number;

  @ApiProperty({ example: 1542, description: 'Cumulative completed jobs count.' })
  completed!: number;

  @ApiProperty({ example: 3, description: 'Cumulative failed jobs count.' })
  failed!: number;

  @ApiProperty({ example: 1, description: 'Currently retrying jobs count.' })
  retrying!: number;
}

export class QueueThroughputDto {
  @ApiProperty({ example: 12.5, description: 'Jobs completed per minute.' })
  jobsPerMinute!: number;

  @ApiProperty({ example: 1450, description: 'Average job processing time in milliseconds.' })
  avgProcessingTimeMs!: number;

  @ApiProperty({ example: 230, description: 'Average queue wait time in milliseconds.' })
  avgQueueWaitTimeMs!: number;
}

export class FailureCategoriesSummaryDto {
  @ApiProperty({ example: 5 })
  NETWORK!: number;

  @ApiProperty({ example: 1 })
  DATABASE!: number;

  @ApiProperty({ example: 3 })
  DISCOVERY!: number;

  @ApiProperty({ example: 2 })
  CONFIGURATION!: number;

  @ApiProperty({ example: 0 })
  UNKNOWN!: number;
}

export class StuckJobStatsDto {
  @ApiProperty({ example: 1, description: 'Total stuck jobs detected by heartbeat monitor.' })
  detected!: number;

  @ApiProperty({ example: 1, description: 'Total stuck jobs successfully recovered.' })
  recovered!: number;

  @ApiProperty({ example: 1.0, description: 'Stuck job recovery success rate (0.0 to 1.0).' })
  recoverySuccessRate!: number;
}

export class QueueDiagnosticsResponseDto {
  @ApiProperty({ example: 'HEALTHY', description: 'Overall queue subsystem health (HEALTHY, DEGRADED, UNHEALTHY).' })
  status!: string;

  @ApiProperty({ type: WorkerActivityDto })
  workers!: WorkerActivityDto;

  @ApiProperty({ type: QueueJobCountsDto })
  jobs!: QueueJobCountsDto;

  @ApiProperty({ type: QueueThroughputDto })
  throughput!: QueueThroughputDto;

  @ApiProperty({ type: FailureCategoriesSummaryDto })
  failures!: FailureCategoriesSummaryDto;

  @ApiProperty({ type: StuckJobStatsDto })
  stuckJobStats!: StuckJobStatsDto;

  @ApiProperty({ example: '2026-07-26T10:15:00Z', description: 'Timestamp of diagnostic report.' })
  timestamp!: string;
}
