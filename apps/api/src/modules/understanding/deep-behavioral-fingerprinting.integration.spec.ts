import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';

describe('Move 2: Deep Wire & Behavioral Fingerprinting Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let snapshotMemoryService: SnapshotMemoryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Stripped Header Infrastructure Discovery', () => {
    it('discovers Cloudflare Edge and Java Runtime when all Server and X-Powered-By banners are stripped', async () => {
      const strippedSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://secure.banking-origin.com',
          finalUrl: 'https://secure.banking-origin.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 24,
          headers: {
            'content-type': 'text/html; charset=UTF-8',
            'cf-ray': '89b1425a1b329124-IAD',
            'cf-cache-status': 'DYNAMIC',
            'set-cookie':
              'JSESSIONID=F091A8C2B3E41254; Path=/; Secure; HttpOnly',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        ssl: {
          reachable: true,
          supported: true,
          responseTimeMs: 20,
          certificate: {
            issuer: 'Cloudflare Inc ECC CA-3',
            subject: 'secure.banking-origin.com',
            validFrom: '2026-01-01',
            validTo: '2026-12-31',
            serialNumber: '12345678',
          },
          error: null,
        },
      };

      const result = await techDiscovery.discover(
        'secure.banking-origin.com',
        strippedSnapshot,
      );

      // 1. Cloudflare at Edge
      const cloudflare = result.technologies.find(
        (t) => t.id === 'tech-cloudflare',
      );
      expect(cloudflare).toBeDefined();
      expect(cloudflare?.name).toBe('Cloudflare');
      expect(cloudflare?.category).toBe('CDN / Edge');
      expect(cloudflare?.confidenceLevel).toBe('HIGH');

      // 2. Java at Runtime
      const java = result.technologies.find((t) => t.id === 'tech-java');
      expect(java).toBeDefined();
      expect(java?.name).toBe('Java');
      expect(java?.category).toBe('Infrastructure Runtime');
      expect(java?.confidenceLevel).toBe('HIGH');
      expect(
        java?.evidence.some((e) => e.indicator.includes('JSESSIONID')),
      ).toBe(true);

      // 3. Topology & Architecture Synthesis
      const topo = result.topology;
      const cfNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-cloudflare',
      );
      expect(cfNode?.layer).toBe(TopologyLayer.EDGE);

      const javaNode = topo.nodes.find((n) => n.technologyId === 'tech-java');
      expect(javaNode?.layer).toBe(TopologyLayer.RUNTIME);

      const brief = result.architectureBrief;
      expect(brief).toBeDefined();
      expect(brief?.architecturePath.map((p) => p.technologyName)).toContain(
        'Cloudflare',
      );
      expect(brief?.architecturePath.map((p) => p.technologyName)).toContain(
        'Java',
      );
    });

    it('discovers .NET runtime and AWS CloudFront when banners are stripped but .AspNetCore session and CloudFront headers exist', async () => {
      const strippedSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://api.cloud-enterprise.net',
          finalUrl: 'https://api.cloud-enterprise.net',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 19,
          headers: {
            'content-type': 'application/json',
            'x-amz-cf-id': 'k83j91_kLMA91024==',
            'x-amz-cf-pop': 'IAD89-C1',
            'set-cookie':
              '.AspNetCore.Cookies=CfDJ8N9...; path=/; secure; samesite=lax; httponly',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover(
        'api.cloud-enterprise.net',
        strippedSnapshot,
      );

      const cloudfront = result.technologies.find(
        (t) => t.id === 'tech-cloudfront',
      );
      expect(cloudfront).toBeDefined();
      expect(cloudfront?.name).toBe('AWS CloudFront');

      const dotnet = result.technologies.find((t) => t.id === 'tech-dotnet');
      expect(dotnet).toBeDefined();
      expect(dotnet?.name).toBe('.NET');
      expect(dotnet?.category).toBe('Infrastructure Runtime');
    });
  });

  describe('2. Multi-Signal Corroboration & Memory Stability', () => {
    it('corroborates Node.js wire behavior and preserves immutable snapshot memory', async () => {
      const nodeSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://microservice.internal.io',
          finalUrl: 'https://microservice.internal.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 14,
          headers: {
            connection: 'keep-alive',
            'keep-alive': 'timeout=5',
            'set-cookie': 'connect.sid=s%3A_J89...; Path=/; HttpOnly',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover(
        'microservice.internal.io',
        nodeSnapshot,
      );
      const node = result.technologies.find((t) => t.id === 'tech-nodejs');
      expect(node).toBeDefined();

      const memory = snapshotMemoryService.createSnapshotMemory(
        'snp-behavioral-1',
        'dom-behavioral-1',
        'microservice.internal.io',
        { technology: result },
      );

      expect(memory.fingerprints.technologyFingerprint).toBeDefined();
      expect(memory.technologies.some((t) => t.name === 'Node.js')).toBe(true);
    });
  });
});
