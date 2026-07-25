import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let healthService: HealthService;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    prismaService = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as jest.Mocked<PrismaService>;

    configService = {
      get: jest.fn().mockReturnValue('test'),
    } as unknown as jest.Mocked<ConfigService>;

    healthService = new HealthService(prismaService, configService);
  });

  describe('1. Liveness Probe (GET /health/live)', () => {
    it('should return UP without hitting database', () => {
      const result = healthService.getLiveness();

      expect(prismaService.$queryRaw).not.toHaveBeenCalled();
      expect(result.status).toBe('UP');
      expect(result.service).toBe('atlas-api');
      expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });
  });

  describe('2. Readiness Probe (GET /health/ready)', () => {
    it('should return READY when database ping succeeds', async () => {
      const result = await healthService.getReadiness();

      expect(prismaService.$queryRaw).toHaveBeenCalled();
      expect(result.status).toBe('READY');
      expect(result.checks.database).toBe('UP');
      expect(result.checks.worker).toBe('UP');
    });

    it('should throw ServiceUnavailableException (503) when database ping fails', async () => {
      prismaService.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      await expect(healthService.getReadiness()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('3. Comprehensive Overall Health (GET /health)', () => {
    it('should return HEALTHY with subsystem details when all services are healthy', async () => {
      const result = await healthService.getOverallHealth();

      expect(result.status).toBe('HEALTHY');
      expect(result.checks.database.status).toBe('UP');
      expect(result.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.checks.memory.status).toBe('UP');
      expect(result.checks.process.status).toBe('UP');
    });

    it('should throw ServiceUnavailableException (503) when database is down', async () => {
      prismaService.$queryRaw.mockRejectedValue(new Error('DB unreachable'));

      await expect(healthService.getOverallHealth()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });
});
