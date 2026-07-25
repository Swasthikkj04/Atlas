import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { HealthResponseDto } from './dto/health-response.dto';
import { LivenessResponseDto } from './dto/liveness-response.dto';
import { ReadinessResponseDto } from './dto/readiness-response.dto';
import { HealthService } from './health.service';

@ApiTags('Health & Monitoring')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @ApiOperation({
    summary: 'Kubernetes Liveness Probe',
    description:
      'Verifies only that the application process is alive. Does not check external dependencies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Process is alive.',
    type: LivenessResponseDto,
  })
  getLiveness(): LivenessResponseDto {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Kubernetes Readiness Probe',
    description:
      'Determines whether the application is ready to accept production traffic by verifying critical dependencies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is ready to accept traffic.',
    type: ReadinessResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Application is not ready to accept traffic.',
  })
  async getReadiness(): Promise<ReadinessResponseDto> {
    return this.healthService.getReadiness();
  }

  @Get()
  @ApiOperation({
    summary: 'Overall Platform Health Summary',
    description:
      'Provides a comprehensive operational summary of the API, Database, Worker, Memory, and Process subsystems.',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform health summary retrieved successfully.',
    type: HealthResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Critical dependency down - platform unhealthy.',
  })
  async getHealth(): Promise<HealthResponseDto> {
    return this.healthService.getOverallHealth();
  }
}
