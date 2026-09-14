import { SubdomainDiscoveryController } from './subdomain-discovery.controller';
import { SubdomainDiscoveryService } from '../subdomain-discovery.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('SubdomainDiscoveryController', () => {
  let controller: SubdomainDiscoveryController;
  let prismaMock: any;
  let subdomainServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      domain: {
        findUnique: jest.fn(),
      },
    };

    subdomainServiceMock = {
      discoverSubdomains: jest.fn().mockResolvedValue({
        domain: 'example.com',
        totalDiscovered: 3,
        subdomains: [],
        wildcardDetected: false,
        wildcardIps: [],
        environmentsSummary: {
          PRODUCTION: 2,
          STAGING: 1,
          DEVELOPMENT: 0,
          INTERNAL: 0,
          DEPRECATED: 0,
          UNKNOWN: 0,
        },
        takeoverRisksSummary: {
          NONE: 3,
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          CRITICAL: 0,
        },
        executionDurationMs: 120,
        scannedAt: new Date().toISOString(),
      }),
    };

    controller = new SubdomainDiscoveryController(
      prismaMock,
      subdomainServiceMock,
    );
  });

  describe('GET /domains/:id/subdomains', () => {
    it('returns subdomain report for existing domain', async () => {
      prismaMock.domain.findUnique.mockResolvedValue({
        id: 'dom-123',
        domainName: 'example.com',
      });

      const res = await controller.getSubdomains('dom-123');

      expect(res.domain).toBe('example.com');
      expect(res.totalDiscovered).toBe(3);
      expect(subdomainServiceMock.discoverSubdomains).toHaveBeenCalledWith(
        'example.com',
      );
    });

    it('throws NotFoundException when domain does not exist', async () => {
      prismaMock.domain.findUnique.mockResolvedValue(null);

      await expect(controller.getSubdomains('dom-404')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('POST /domains/:id/subdomains/scan', () => {
    it('initiates fresh scan for existing domain', async () => {
      prismaMock.domain.findUnique.mockResolvedValue({
        id: 'dom-123',
        domainName: 'example.com',
      });

      const res = await controller.triggerScan('dom-123');

      expect(res.totalDiscovered).toBe(3);
      expect(subdomainServiceMock.discoverSubdomains).toHaveBeenCalledWith(
        'example.com',
      );
    });
  });
});
