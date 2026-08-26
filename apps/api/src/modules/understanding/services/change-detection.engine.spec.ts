import { Test, TestingModule } from '@nestjs/testing';
import {
  ChangeSeverity,
  ChangeType,
  FindingCategory,
  FindingModule,
} from '@prisma/client';

import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ChangeDetectionEngine } from './change-detection.engine';

describe('ChangeDetectionEngine', () => {
  let engine: ChangeDetectionEngine;
  let prisma: PrismaService;

  const mockPrisma = {
    changeHistory: {
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeDetectionEngine,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    engine = module.get<ChangeDetectionEngine>(ChangeDetectionEngine);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('1. HTTP Security Headers Change Detection', () => {
    it('detects modified X-Frame-Options header ("X-Frame-Options changed")', () => {
      const prev: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://ding.com',
          finalUrl: 'https://ding.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 80,
          headers: {
            'x-frame-options': 'DENY',
            'strict-transport-security': 'max-age=31536000',
          },
          redirects: [],
          redirectCount: 0,
          error: null,
        },
      };

      const curr: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://ding.com',
          finalUrl: 'https://ding.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 82,
          headers: {
            'x-frame-options': 'SAMEORIGIN',
            'strict-transport-security': 'max-age=31536000',
          },
          redirects: [],
          redirectCount: 0,
          error: null,
        },
      };

      const diffs = engine.computeDifferences(prev, curr);
      expect(diffs).toHaveLength(1);
      expect(diffs[0].title).toBe('X-Frame-Options changed');
      expect(diffs[0].changeType).toBe(ChangeType.MODIFIED);
      expect(diffs[0].severity).toBe(ChangeSeverity.MEDIUM);
      expect(diffs[0].category).toBe(FindingCategory.SECURITY_HEADER);
      expect(diffs[0].module).toBe(FindingModule.HTTP);
      expect(diffs[0].description).toBe(
        "X-Frame-Options response header changed from 'DENY' to 'SAMEORIGIN'.",
      );
    });

    it('detects added and removed security headers', () => {
      const prev: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://ding.com',
          finalUrl: 'https://ding.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 80,
          headers: {
            'content-security-policy': "default-src 'self'",
          },
          redirects: [],
          redirectCount: 0,
          error: null,
        },
      };

      const curr: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://ding.com',
          finalUrl: 'https://ding.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 80,
          headers: {
            'strict-transport-security': 'max-age=31536000; includeSubDomains',
          },
          redirects: [],
          redirectCount: 0,
          error: null,
        },
      };

      const diffs = engine.computeDifferences(prev, curr);
      expect(diffs).toHaveLength(2);

      const added = diffs.find((d) => d.changeType === ChangeType.ADDED);
      const removed = diffs.find((d) => d.changeType === ChangeType.REMOVED);

      expect(added?.title).toBe('Strict-Transport-Security header added');
      expect(removed?.title).toBe('Content-Security-Policy header removed');
    });
  });

  describe('2. Web Server & Status Code Changes', () => {
    it('detects web server header changes', () => {
      const prev: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://ding.com',
          finalUrl: 'https://ding.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 80,
          headers: { server: 'nginx/1.24.0' },
          redirects: [],
          redirectCount: 0,
          error: null,
        },
      };

      const curr: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://ding.com',
          finalUrl: 'https://ding.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 80,
          headers: { server: 'cloudflare' },
          redirects: [],
          redirectCount: 0,
          error: null,
        },
      };

      const diffs = engine.computeDifferences(prev, curr);
      expect(diffs).toHaveLength(1);
      expect(diffs[0].title).toBe('Web server changed');
      expect(diffs[0].description).toBe(
        "Web server changed from 'nginx/1.24.0' to 'cloudflare'.",
      );
    });
  });

  describe('3. TLS / SSL Certificate Changes', () => {
    it('detects TLS certificate renewal', () => {
      const prev: DiscoverySnapshot = {
        ssl: {
          authorized: true,
          error: null,
          certificate: {
            subject: 'ding.com',
            issuer: "Let's Encrypt",
            validFrom: '2026-05-01T00:00:00Z',
            validTo: '2026-08-01T00:00:00Z',
            serialNumber: '123',
            fingerprintSha256: 'abc',
            sans: ['ding.com'],
          },
          protocol: 'TLSv1.3',
          cipher: 'TLS_AES_256_GCM_SHA384',
        },
      };

      const curr: DiscoverySnapshot = {
        ssl: {
          authorized: true,
          error: null,
          certificate: {
            subject: 'ding.com',
            issuer: "Let's Encrypt",
            validFrom: '2026-08-01T00:00:00Z',
            validTo: '2026-11-01T00:00:00Z',
            serialNumber: '456',
            fingerprintSha256: 'def',
            sans: ['ding.com'],
          },
          protocol: 'TLSv1.3',
          cipher: 'TLS_AES_256_GCM_SHA384',
        },
      };

      const diffs = engine.computeDifferences(prev, curr);
      expect(diffs).toHaveLength(1);
      expect(diffs[0].title).toBe('TLS Certificate renewed');
      expect(diffs[0].category).toBe(FindingCategory.CERTIFICATE);
    });
  });

  describe('4. DNS Records & Technologies Changes', () => {
    it('detects DNS A record modification', () => {
      const prev: DiscoverySnapshot = {
        dns: {
          a: ['192.0.2.1'],
          aaaa: [],
          mx: [],
          txt: [],
          ns: ['ns1.example.com'],
          cname: [],
          dmarc: [],
          soa: null,
          responseTimeMs: 15,
        },
      };

      const curr: DiscoverySnapshot = {
        dns: {
          a: ['192.0.2.1', '192.0.2.2'],
          aaaa: [],
          mx: [],
          txt: [],
          ns: ['ns1.example.com'],
          cname: [],
          dmarc: [],
          soa: null,
          responseTimeMs: 15,
        },
      };

      const diffs = engine.computeDifferences(prev, curr);
      expect(diffs).toHaveLength(1);
      expect(diffs[0].title).toBe('DNS IPv4 addresses modified');
      expect(diffs[0].category).toBe(FindingCategory.DNS_RECORD);
    });

    it('detects Technology added and removed', () => {
      const prev: DiscoverySnapshot = {
        technology: {
          technologies: [{ name: 'WordPress' } as any, { name: 'PHP' } as any],
          confidence: 1.0,
          categories: ['CMS'],
        },
      };

      const curr: DiscoverySnapshot = {
        technology: {
          technologies: [{ name: 'Next.js' } as any, { name: 'React' } as any],
          confidence: 1.0,
          categories: ['Framework'],
        },
      };

      const diffs = engine.computeDifferences(prev, curr);
      expect(diffs).toHaveLength(4); // 2 added, 2 removed
    });
  });

  describe('5. Persistence Execution', () => {
    it('persists change events to database via Prisma createMany', async () => {
      const prev: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://ding.com',
          finalUrl: 'https://ding.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 80,
          headers: { 'x-frame-options': 'DENY' },
          redirects: [],
          redirectCount: 0,
          error: null,
        },
      };

      const curr: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://ding.com',
          finalUrl: 'https://ding.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 80,
          headers: { 'x-frame-options': 'SAMEORIGIN' },
          redirects: [],
          redirectCount: 0,
          error: null,
        },
      };

      const count = await engine.detectAndPersistChanges(
        'dom-ding-001',
        'snp-101',
        'snp-102',
        prev,
        curr,
      );

      expect(count).toBe(2);
      expect(mockPrisma.changeHistory.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            domainId: 'dom-ding-001',
            previousSnapshotId: 'snp-101',
            currentSnapshotId: 'snp-102',
            title: 'X-Frame-Options changed',
          }),
        ]),
      });
    });

    it('returns 0 and skips database write when no differences exist', async () => {
      const prev: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://ding.com',
          finalUrl: 'https://ding.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 80,
          headers: { 'x-frame-options': 'DENY' },
          redirects: [],
          redirectCount: 0,
          error: null,
        },
      };

      const count = await engine.detectAndPersistChanges(
        'dom-ding-001',
        'snp-101',
        'snp-102',
        prev,
        prev,
      );

      expect(count).toBe(0);
      expect(mockPrisma.changeHistory.createMany).not.toHaveBeenCalled();
    });
  });
});
