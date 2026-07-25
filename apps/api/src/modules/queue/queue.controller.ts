import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { QueueDiagnosticsResponseDto } from './dto/queue-diagnostics-response.dto';
import { QueueDiagnosticsService } from './services/queue-diagnostics.service';

@ApiTags('Queue Monitoring & Diagnostics')
@Controller('queue')
export class QueueController {
  constructor(private readonly queueDiagnosticsService: QueueDiagnosticsService) {}

  @Get()
  @ApiOperation({
    summary: 'Queue Operational Summary & Diagnostics',
    description:
      'Provides real-time visibility into Atlas asynchronous processing pipeline (worker activity, queued/running/completed/failed job counts, throughput, latencies, failure classifications, and stuck job recovery stats).',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue diagnostics retrieved successfully.',
    type: QueueDiagnosticsResponseDto,
  })
  async getQueueDiagnostics(): Promise<QueueDiagnosticsResponseDto> {
    return this.queueDiagnosticsService.getQueueDiagnostics();
  }
}
