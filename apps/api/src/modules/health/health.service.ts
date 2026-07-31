import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';

import { HealthResponseDto } from './dto/health-response.dto';
import { LivenessResponseDto } from './dto/liveness-response.dto';
import { ReadinessResponseDto } from './dto/readiness-response.dto';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  getLiveness(): LivenessResponseDto {
    return {
      status: 'UP',
      service: 'atlas-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  async getReadiness(): Promise<ReadinessResponseDto> {
    let dbStatus = 'UP';
    let isDbHealthy = true;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'DOWN';
      isDbHealthy = false;
    }

    const checks = {
      database: dbStatus,
      worker: 'UP',
      configuration: 'UP',
    };

    const payload: ReadinessResponseDto = {
      status: isDbHealthy ? 'READY' : 'NOT_READY',
      service: 'atlas-api',
      version: '1.0.0',
      checks,
      timestamp: new Date().toISOString(),
    };

    if (!isDbHealthy) {
      throw new ServiceUnavailableException(payload);
    }

    return payload;
  }

  async getOverallHealth(): Promise<HealthResponseDto> {
    let dbStatus = 'UP';
    let dbLatencyMs = 0;
    let isDbHealthy = true;

    const t0 = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - t0;
    } catch {
      dbLatencyMs = Date.now() - t0;
      dbStatus = 'DOWN';
      isDbHealthy = false;
    }

    const mem = process.memoryUsage();
    const heapUsedMB = Math.round(mem.heapUsed / (1024 * 1024));
    const heapTotalMB = Math.round(mem.heapTotal / (1024 * 1024));
    const rssMB = Math.round(mem.rss / (1024 * 1024));

    const isMemDegraded = heapTotalMB > 0 && heapUsedMB / heapTotalMB > 0.9;
    const memStatus = isMemDegraded ? 'DEGRADED' : 'UP';

    let overallStatus = 'HEALTHY';
    if (!isDbHealthy) {
      overallStatus = 'UNHEALTHY';
    } else if (isMemDegraded) {
      overallStatus = 'DEGRADED';
    }

    const payload: HealthResponseDto = {
      status: overallStatus,
      service: 'atlas-api',
      version: '1.0.0',
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        worker: {
          status: 'UP',
        },
        memory: {
          status: memStatus,
          heapUsedMB,
          heapTotalMB,
          rssMB,
        },
        process: {
          status: 'UP',
          uptimeSeconds: Math.floor(process.uptime()),
          pid: process.pid,
          nodeVersion: process.version,
          environment:
            this.configService.get<string>('NODE_ENV') || 'development',
        },
      },
      timestamp: new Date().toISOString(),
    };

    if (overallStatus === 'UNHEALTHY') {
      throw new ServiceUnavailableException(payload);
    }

    return payload;
  }
}
