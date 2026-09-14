import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { ChangeDetectionEngine } from './services/change-detection.engine';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { FindingModule } from '@prisma/client';

describe('TECH-006: Technology Change Intelligence & Architecture Drift Integration', () => {
  let moduleRef: TestingModule;
  let changeEngine: ChangeDetectionEngine;
  let techDiscovery: TechnologyDiscoveryService;
  let prisma: PrismaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    changeEngine = moduleRef.get(ChangeDetectionEngine);
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Real-World Architecture Evolution Scenarios', () => {
    it('Scenario A: Edge + App evolvles to Edge + Gateway + App (NGINX added, path changed)', async () => {
      // Snapshot 1 (Day 1: Cloudflare + Next.js)
      const snap1: DiscoverySnapshot = {
        dns: {
          a: ['104.21.1.1'],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          cname: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://scenario-a.com',
          finalUrl: 'https://scenario-a.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'cloudflare',
            'cf-ray': '111111-iad',
            'x-powered-by': 'Next.js',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        htmlBody: '<script id="__NEXT_DATA__">{}</script>',
      };
      snap1.technology = await techDiscovery.discover('scenario-a.com', snap1);

      // Snapshot 2 (Day 2: NGINX gateway added in front of Next.js)
      const snap2: DiscoverySnapshot = {
        dns: {
          a: ['104.21.1.1'],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          cname: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://scenario-a.com',
          finalUrl: 'https://scenario-a.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 28,
          headers: {
            server: 'nginx/1.24.0',
            'cf-ray': '222222-iad',
            'x-powered-by': 'Next.js',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        htmlBody: '<script id="__NEXT_DATA__">{}</script>',
      };
      snap2.technology = await techDiscovery.discover('scenario-a.com', snap2);

      const diffs = changeEngine.computeDifferences(snap1, snap2);
      const techDiffs = diffs.filter(
        (d) => d.module === FindingModule.TECHNOLOGY,
      );

      expect(techDiffs.length).toBeGreaterThanOrEqual(1);
      const nginxAdded = techDiffs.find((d) =>
        d.title.includes('Technology added: NGINX'),
      );
      expect(nginxAdded).toBeDefined();
    });

    it('Scenario B: Gateway Migration (Cloudflare + NGINX -> Cloudflare + Caddy)', async () => {
      // Snapshot 1 (NGINX Gateway)
      const snap1: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://scenario-b.com',
          finalUrl: 'https://scenario-b.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: { server: 'nginx/1.24.0', 'cf-ray': '1111-iad' },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };
      snap1.technology = await techDiscovery.discover('scenario-b.com', snap1);

      // Snapshot 2 (Caddy Gateway)
      const snap2: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://scenario-b.com',
          finalUrl: 'https://scenario-b.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: { server: 'Caddy', 'cf-ray': '2222-iad' },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };
      snap2.technology = await techDiscovery.discover('scenario-b.com', snap2);

      const diffs = changeEngine.computeDifferences(snap1, snap2);
      const techDiffs = diffs.filter(
        (d) => d.module === FindingModule.TECHNOLOGY,
      );

      expect(techDiffs.some((d) => d.title.includes('Caddy'))).toBe(true);
      expect(techDiffs.some((d) => d.title.includes('NGINX'))).toBe(true);
    });

    it('Scenario C: Integration Attached (Next.js -> Next.js + Sentry)', async () => {
      const snap1: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://scenario-c.com',
          finalUrl: 'https://scenario-c.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: { 'x-powered-by': 'Next.js' },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        htmlBody: '<script id="__NEXT_DATA__">{}</script>',
      };
      snap1.technology = await techDiscovery.discover('scenario-c.com', snap1);

      const snap2: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://scenario-c.com',
          finalUrl: 'https://scenario-c.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'x-powered-by': 'Next.js',
            'sentry-trace': 'trace-998877-1',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        htmlBody: '<script id="__NEXT_DATA__">{}</script>',
      };
      snap2.technology = await techDiscovery.discover('scenario-c.com', snap2);

      const diffs = changeEngine.computeDifferences(snap1, snap2);
      const sentryDiff = diffs.find((d) => d.title.includes('Sentry'));

      expect(sentryDiff).toBeDefined();
      expect(sentryDiff?.title).toContain('Sentry');
      expect(sentryDiff?.module).toBe(FindingModule.TECHNOLOGY);
    });
  });

  describe('2. Idempotency & Database Persistence Gate', () => {
    it('executes detectAndPersistChanges idempotently without creating duplicate events on re-run', async () => {
      const snap1: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://idempotent-test.com',
          finalUrl: 'https://idempotent-test.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: { server: 'nginx/1.24.0' },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const snap2: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://idempotent-test.com',
          finalUrl: 'https://idempotent-test.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: { server: 'Apache/2.4.52' },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      // Mocking prisma createMany and count for domain test
      const createManySpy = jest
        .spyOn(prisma.changeHistory, 'createMany')
        .mockResolvedValue({ count: 2 });
      const countSpy = jest
        .spyOn(prisma.changeHistory, 'count')
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(2);

      const run1Count = await changeEngine.detectAndPersistChanges(
        'dom-idem-001',
        'snp-run-1',
        'snp-run-2',
        snap1,
        snap2,
      );

      expect(run1Count).toBe(2);
      expect(createManySpy).toHaveBeenCalledTimes(1);

      // Second run with same snapshot IDs
      const run2Count = await changeEngine.detectAndPersistChanges(
        'dom-idem-001',
        'snp-run-1',
        'snp-run-2',
        snap1,
        snap2,
      );

      expect(run2Count).toBe(2);
      // createMany must NOT be called a second time
      expect(createManySpy).toHaveBeenCalledTimes(1);

      createManySpy.mockRestore();
      countSpy.mockRestore();
    });
  });
});
