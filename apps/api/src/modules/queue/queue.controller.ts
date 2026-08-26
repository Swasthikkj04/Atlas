import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueueDiagnosticsResponseDto } from './dto/queue-diagnostics-response.dto';
import { QueueDiagnosticsService } from './services/queue-diagnostics.service';

@ApiTags('Queue Monitoring & Diagnostics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('queue')
export class QueueController {
  constructor(
    private readonly queueDiagnosticsService: QueueDiagnosticsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Queue Operational Summary & Diagnostics',
    description:
      'Provides operational visibility into Atlas asynchronous processing pipeline (worker activity, queued/running/completed/failed job counts, throughput, latencies, failure classifications, and stuck job recovery stats). Restricted to authenticated operators.',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue diagnostics retrieved successfully.',
    type: QueueDiagnosticsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access - authentication required.',
  })
  async getQueueDiagnostics(): Promise<QueueDiagnosticsResponseDto> {
    return this.queueDiagnosticsService.getQueueDiagnostics();
  }
}
