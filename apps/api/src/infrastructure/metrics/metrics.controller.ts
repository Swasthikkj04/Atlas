import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { MetricsService } from './metrics.service';

@ApiTags('Metrics & Telemetry')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({
    summary: 'Export Prometheus operational metrics',
    description:
      'Exposes operational telemetry metrics for Prometheus scraping in standard exposition text format (HTTP, Discovery, Findings, Timeline, Explorer, Auth, Database, Memory, Process).',
  })
  @ApiResponse({
    status: 200,
    description: 'Prometheus metrics exported successfully.',
  })
  getMetrics(): string {
    return this.metricsService.getMetricsText();
  }
}
