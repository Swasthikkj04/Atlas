import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { SnapshotFingerprintService } from './services/snapshot-fingerprint.service';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { InfrastructureSnapshotService } from '../infrastructure-snapshots/services/infrastructure-snapshot.service';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';

describe('TECH-005: Infrastructure Snapshot Memory & Temporal Baseline Integration', () => {
  let moduleRef: TestingModule;
  let memoryService: SnapshotMemoryService;
  let fingerprintService: SnapshotFingerprintService;
  let techDiscovery: TechnologyDiscoveryService;
  let snapshotService: InfrastructureSnapshotService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    memoryService = moduleRef.get(SnapshotMemoryService);
    fingerprintService = moduleRef.get(SnapshotFingerprintService);
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    snapshotService = moduleRef.get(InfrastructureSnapshotService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Immutable Temporal Snapshot Memory Lifecycle', () => {
    it('synthesizes complete snapshot memory with deterministic fingerprints from live discovery output', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.21.50.60'],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          cname: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://saas-memory.io',
          finalUrl: 'https://saas-memory.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'cloudflare',
            'cf-ray': '89a123-iad',
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

      const techResult = await techDiscovery.discover(
        'saas-memory.io',
        snapshot,
      );
      snapshot.technology = techResult;

      const observedTime = new Date('2026-08-25T14:30:00Z');
      const memory = memoryService.createSnapshotMemory(
        'snap-temporal-001',
        'dom-temporal-001',
        'saas-memory.io',
        snapshot,
        observedTime,
      );

      expect(memory.snapshotId).toBe('snap-temporal-001');
      expect(memory.domainId).toBe('dom-temporal-001');
      expect(memory.domainName).toBe('saas-memory.io');
      expect(memory.observedAt).toBe('2026-08-25T14:30:00.000Z');
      expect(memory.snapshotVersion).toBe('2.0.0');

      // Structured Technology, Topology, Architecture Brief Memory
      expect(memory.technologies).toHaveLength(3);
      expect(memory.topology.totalNodes).toBe(3);
      expect(memory.architectureBrief.summary).toBeDefined();

      // Fingerprints
      expect(memory.fingerprints.technologyFingerprint).toHaveLength(64);
      expect(memory.fingerprints.topologyFingerprint).toHaveLength(64);
      expect(memory.fingerprints.architectureFingerprint).toHaveLength(64);
      expect(memory.fingerprints.overallFingerprint).toHaveLength(64);

      // Known Unknowns Preserved in Memory
      const maskedOrigin = memory.architectureBrief.knownUnknowns.find(
        (u) => u.dimension === 'Origin Cloud Provider',
      );
      expect(maskedOrigin?.status).toBe('MASKED');
    });

    it('guarantees identical fingerprints for repeated identical observations (Idempotent Baseline)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.21.50.60'],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          cname: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://saas-memory.io',
          finalUrl: 'https://saas-memory.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'cloudflare',
            'cf-ray': '89a123-iad',
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

      const techResult1 = await techDiscovery.discover(
        'saas-memory.io',
        snapshot,
      );
      const snapshot1: DiscoverySnapshot = {
        ...snapshot,
        technology: techResult1,
      };

      const techResult2 = await techDiscovery.discover(
        'saas-memory.io',
        snapshot,
      );
      const snapshot2: DiscoverySnapshot = {
        ...snapshot,
        technology: techResult2,
      };

      const mem1 = memoryService.createSnapshotMemory(
        'snap-run-1',
        'dom-1',
        'saas-memory.io',
        snapshot1,
        new Date('2026-08-25T10:00:00Z'),
      );
      const mem2 = memoryService.createSnapshotMemory(
        'snap-run-2',
        'dom-1',
        'saas-memory.io',
        snapshot2,
        new Date('2026-08-26T10:00:00Z'),
      );

      const comparison = memoryService.compareBaselines(mem2, mem1);

      expect(comparison.isIdentical).toBe(true);
      expect(comparison.hasTechnologyChanges).toBe(false);
      expect(comparison.hasTopologyChanges).toBe(false);
      expect(comparison.hasArchitectureChanges).toBe(false);
      expect(mem1.fingerprints.overallFingerprint).toBe(
        mem2.fingerprints.overallFingerprint,
      );
    });

    it('preserves historical snapshot unchanged when an integration is attached in a future run', async () => {
      // Historical Snapshot (Day 1: Cloudflare + Next.js)
      const historicalDiscovery: DiscoverySnapshot = {
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
          url: 'https://evolving.app',
          finalUrl: 'https://evolving.app',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
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
      historicalDiscovery.technology = await techDiscovery.discover(
        'evolving.app',
        historicalDiscovery,
      );

      const historicalMemory = memoryService.createSnapshotMemory(
        'snap-aug-25',
        'dom-evolve',
        'evolving.app',
        historicalDiscovery,
        new Date('2026-08-25T12:00:00Z'),
      );

      // Current Snapshot (Day 2: Cloudflare + Next.js + Sentry APM attached)
      const currentDiscovery: DiscoverySnapshot = {
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
          url: 'https://evolving.app',
          finalUrl: 'https://evolving.app',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'cloudflare',
            'cf-ray': '222222-iad',
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
      currentDiscovery.technology = await techDiscovery.discover(
        'evolving.app',
        currentDiscovery,
      );

      const currentMemory = memoryService.createSnapshotMemory(
        'snap-aug-27',
        'dom-evolve',
        'evolving.app',
        currentDiscovery,
        new Date('2026-08-27T12:00:00Z'),
      );

      // Verify Differential Comparison
      const diff = memoryService.compareBaselines(
        currentMemory,
        historicalMemory,
      );
      expect(diff.isIdentical).toBe(false);
      expect(diff.hasTechnologyChanges).toBe(true);
      expect(diff.hasArchitectureChanges).toBe(true);

      // Verify Immutability of Historical Memory
      expect(historicalMemory.technologies).toHaveLength(3);
      expect(historicalMemory.architectureBrief.integrations).toHaveLength(0);
      expect(historicalMemory.observedAt).toBe('2026-08-25T12:00:00.000Z');

      // Verify Current Memory contains Sentry integration
      expect(currentMemory.technologies).toHaveLength(4);
      expect(currentMemory.architectureBrief.integrations).toHaveLength(1);
      expect(currentMemory.architectureBrief.integrations[0].name).toBe(
        'Sentry',
      );
    });
  });
});
