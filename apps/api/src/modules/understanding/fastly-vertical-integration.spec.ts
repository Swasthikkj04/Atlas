import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { FastlyDetector } from '../../infrastructure/discovery/technology/detectors/cdn/fastly.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import {
  TopologyLayer,
  TechnologyCategory,
} from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { TechnologyChangeClassification } from './contracts/technology-change.interface';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';
import { DeepBehavioralFingerprintingEngine } from '../../infrastructure/discovery/technology/engine/deep-behavioral-fingerprinting.engine';

describe('T27: Fastly Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let fastlyDetector: FastlyDetector;
  let behavioralEngine: DeepBehavioralFingerprintingEngine;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    fastlyDetector = moduleRef.get(FastlyDetector);
    behavioralEngine = moduleRef.get(DeepBehavioralFingerprintingEngine);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  // ---------------------------------------------------------------------------
  // 1. Component-Specific Fastly Detection (TECH-001)
  // ---------------------------------------------------------------------------
  describe('1. Component-Specific Fastly Detection (TECH-001)', () => {
    it('detects Fastly from x-served-by and x-cache headers with HIGH confidence (T27-01)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['151.101.1.140', '151.101.65.140'],
          cname: ['dualstack.fastly.net'],
          ns: ['ns1.fastly.net'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://cdn.example-media.com',
          finalUrl: 'https://cdn.example-media.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 24,
          headers: {
            'x-served-by': 'cache-iad-kcgs7200020-IAD',
            'x-cache': 'HIT',
            'x-cache-hits': '3',
            'x-timer': 'S1698240000,VS0,VE1',
            'x-fastly-request-id': 'abcdef1234567890',
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
        'cdn.example-media.com',
        snapshot,
      );

      const fastly = result.technologies.find((t) => t.id === 'tech-fastly');
      expect(fastly).toBeDefined();
      expect(fastly?.name).toBe('Fastly');
      expect(fastly?.category).toBe('CDN / Edge');
      expect(fastly?.confidenceLevel).toBe('HIGH');
      expect(fastly?.role).toBe('Edge Delivery / CDN Ingress');
      expect(fastly?.evidence.length).toBeGreaterThanOrEqual(4);
    });

    it('correctly captures Fastly cache HIT telemetry (T27-02)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['151.101.2.132'],
          cname: [],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://assets.fastly-cached.io',
          finalUrl: 'https://assets.fastly-cached.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 18,
          headers: {
            'x-served-by': 'cache-ord10620-ORD',
            'x-cache': 'HIT, HIT',
            'x-cache-hits': '5',
            'x-timer': 'S1698240000,VS0,VE1',
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
        'assets.fastly-cached.io',
        snapshot,
      );

      const fastly = result.technologies.find((t) => t.id === 'tech-fastly');
      expect(fastly).toBeDefined();
      const cacheEvidence = fastly?.evidence.find((e) =>
        e.indicator.includes('cache and request timing telemetry'),
      );
      expect(cacheEvidence).toBeDefined();
      expect(cacheEvidence?.observedValue).toContain('x-cache: HIT, HIT');
      expect(cacheEvidence?.observedValue).toContain('x-cache-hits: 5');
    });

    it('correctly captures Fastly cache MISS telemetry without security classification (T27-03)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['151.101.2.132'],
          cname: [],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://api.fastly-dynamic.io',
          finalUrl: 'https://api.fastly-dynamic.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 120,
          headers: {
            'x-served-by': 'cache-bwi5073-BWI',
            'x-cache': 'MISS',
            'x-cache-hits': '0',
            'x-timer': 'S1698240000,VS0,VE115',
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
        'api.fastly-dynamic.io',
        snapshot,
      );

      const fastly = result.technologies.find((t) => t.id === 'tech-fastly');
      expect(fastly).toBeDefined();
      const cacheEvidence = fastly?.evidence.find((e) =>
        e.indicator.includes('cache and request timing telemetry'),
      );
      expect(cacheEvidence?.observedValue).toContain('x-cache: MISS');
    });

    it('detects Fastly with DNS CNAME corroboration (T27-04)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['151.101.65.140'],
          cname: ['prod.fastly.net', 'fallback.fastlylb.net'],
          ns: ['ns1.external-dns.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://routed-cname.com',
          finalUrl: 'https://routed-cname.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 40,
          headers: {
            'x-served-by': 'cache-fra-eddf8230043-FRA',
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

      const result = await techDiscovery.discover('routed-cname.com', snapshot);

      const fastly = result.technologies.find((t) => t.id === 'tech-fastly');
      expect(fastly).toBeDefined();
      const dnsEvidence = fastly?.evidence.find((e) => e.sourceType === 'DNS');
      expect(dnsEvidence).toBeDefined();
      expect(dnsEvidence?.observedValue).toContain('fastly.net');
    });

    it('returns null when no Fastly signals are present (T27-05)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['1.1.1.1'],
          cname: [],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://cloudflare-only.com',
          finalUrl: 'https://cloudflare-only.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            server: 'cloudflare',
            'cf-ray': '89a123456789-iad',
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
        'cloudflare-only.com',
        snapshot,
      );
      const fastly = result.technologies.find((t) => t.id === 'tech-fastly');
      expect(fastly).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Strict Anti-Overreach Boundaries (TECH-002)
  // ---------------------------------------------------------------------------
  describe('2. Strict Anti-Overreach Boundaries (TECH-002)', () => {
    it('enforces whatThisDoesNotProve claim boundaries against origin and database assumptions (T27-06 & T27-13)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['151.101.1.140'],
          cname: ['dualstack.fastly.net'],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://sealed-origin.fastly-edge.io',
          finalUrl: 'https://sealed-origin.fastly-edge.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'x-served-by': 'cache-iad-kcgs7200020-IAD',
            'x-cache': 'HIT',
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
        'sealed-origin.fastly-edge.io',
        snapshot,
      );

      const fastly = result.technologies.find((t) => t.id === 'tech-fastly');
      expect(fastly).toBeDefined();
      expect(fastly?.whatThisDoesNotProve).toBeDefined();
      expect(fastly?.whatThisDoesNotProve).toContain(
        'does not prove origin hosting on AWS, Azure, GCP',
      );
      expect(fastly?.whatThisDoesNotProve).toContain('PostgreSQL');
      expect(fastly?.whatThisDoesNotProve).toContain('Kubernetes');

      // Invariant: Unobserved origin technologies are NEVER fabricated
      const unevidenced = [
        'tech-aws',
        'tech-gcp',
        'tech-azure',
        'tech-docker',
        'tech-kubernetes',
      ];
      for (const techId of unevidenced) {
        expect(
          result.technologies.find((t) => t.id === techId),
        ).toBeUndefined();
      }
    });

    it('does not expose version when unversioned (T27-09)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['151.101.1.140'],
          cname: [],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://unversioned.fastly-edge.io',
          finalUrl: 'https://unversioned.fastly-edge.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'x-served-by': 'cache-iad-kcgs7200020-IAD',
            'x-cache': 'HIT',
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
        'unversioned.fastly-edge.io',
        snapshot,
      );
      const fastly = result.technologies.find((t) => t.id === 'tech-fastly');
      expect(fastly?.version).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Tier Topology Composition & Coexistence (TECH-003)
  // ---------------------------------------------------------------------------
  describe('3. Multi-Tier Topology Composition & Coexistence (TECH-003)', () => {
    it('composes Fastly (EDGE) + NGINX (GATEWAY) + Node.js (RUNTIME) multi-tier path (T27-07 & T27-08)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['151.101.1.140'],
          cname: ['dualstack.fastly.net'],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://fastly-nginx-node.com',
          finalUrl: 'https://fastly-nginx-node.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 45,
          headers: {
            'x-served-by': 'cache-iad-kcgs7200020-IAD',
            'x-cache': 'HIT',
            server: 'nginx/1.24.0',
            'x-powered-by': 'Express',
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
        'fastly-nginx-node.com',
        snapshot,
      );

      const fastly = result.technologies.find((t) => t.id === 'tech-fastly');
      const nginx = result.technologies.find((t) => t.id === 'tech-nginx');
      const node = result.technologies.find((t) => t.id === 'tech-nodejs');

      expect(fastly).toBeDefined();
      expect(nginx).toBeDefined();
      expect(node).toBeDefined();

      // Semantic Layer Invariant
      expect(fastly?.category).toBe('CDN / Edge');
      expect(nginx?.category).toBe('Web / Server');
    });

    it('coexists with Envoy gateway without conflating edge roles', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['151.101.1.140'],
          cname: ['dualstack.fastly.net'],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://fastly-envoy.com',
          finalUrl: 'https://fastly-envoy.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 38,
          headers: {
            'x-served-by': 'cache-iad-kcgs7200020-IAD',
            'x-cache': 'MISS',
            'x-envoy-upstream-service-time': '25',
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

      const result = await techDiscovery.discover('fastly-envoy.com', snapshot);

      const fastly = result.technologies.find((t) => t.id === 'tech-fastly');
      const envoy = result.technologies.find((t) => t.id === 'tech-envoy');

      expect(fastly).toBeDefined();
      expect(envoy).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Snapshot Memory & Immutability (TECH-005)
  // ---------------------------------------------------------------------------
  describe('4. Snapshot Memory & Immutability (TECH-005)', () => {
    it('produces deterministic immutable fingerprint for Fastly infrastructure snapshots', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['151.101.1.140'],
          cname: ['dualstack.fastly.net'],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://fastly-snapshot.io',
          finalUrl: 'https://fastly-snapshot.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 22,
          headers: {
            'x-served-by': 'cache-iad-kcgs7200020-IAD',
            'x-cache': 'HIT',
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

      const result1 = await techDiscovery.discover(
        'fastly-snapshot.io',
        snapshot,
      );
      const result2 = await techDiscovery.discover(
        'fastly-snapshot.io',
        snapshot,
      );

      expect(result1.technologies.length).toBe(result2.technologies.length);
      expect(result1.technologies[0].id).toBe(result2.technologies[0].id);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Change Intelligence Delta (TECH-006 & T27-11)
  // ---------------------------------------------------------------------------
  describe('5. Change Intelligence Delta (TECH-006 & T27-11)', () => {
    it('detects Fastly appearance when migrating from direct origin to Fastly CDN', async () => {
      const prevSnapshot: DiscoverySnapshot = {
        dns: {
          a: ['192.0.2.1'],
          cname: [],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://migrate-fastly.io',
          finalUrl: 'https://migrate-fastly.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 40,
          headers: { server: 'nginx/1.24.0' },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              version: '1.24.0',
              category: 'Web / Server',
              confidence: 0.95,
              confidenceLevel: 'HIGH',
              evidence: [],
              signals: [],
            } as any,
          ],
        },
      };

      const currSnapshot: DiscoverySnapshot = {
        dns: {
          a: ['151.101.1.140'],
          cname: ['dualstack.fastly.net'],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://migrate-fastly.io',
          finalUrl: 'https://migrate-fastly.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'x-served-by': 'cache-iad-kcgs7200020-IAD',
            'x-cache': 'HIT',
            server: 'nginx/1.24.0',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        technology: {
          technologies: [
            {
              id: 'tech-fastly',
              name: 'Fastly',
              version: undefined,
              category: 'CDN / Edge',
              confidence: 0.98,
              confidenceLevel: 'HIGH',
              evidence: [],
              signals: [],
            } as any,
            {
              id: 'tech-nginx',
              name: 'NGINX',
              version: '1.24.0',
              category: 'Web / Server',
              confidence: 0.95,
              confidenceLevel: 'HIGH',
              evidence: [],
              signals: [],
            } as any,
          ],
        },
      };

      const diffs = changeAnalyzer.analyzeDifferences(
        prevSnapshot,
        currSnapshot,
      );
      const fastlyDiff = diffs.find((d) => d.technologyId === 'tech-fastly');
      expect(fastlyDiff).toBeDefined();
      expect(fastlyDiff?.classification).toBe(
        TechnologyChangeClassification.TECHNOLOGY_ADDED,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 6. InfrastructureOverviewMapper UI Convergence (TECH-008 & IA-1/IA-2)
  // ---------------------------------------------------------------------------
  describe('6. InfrastructureOverviewMapper UI Convergence (TECH-008 & IA-1/IA-2)', () => {
    it('maps Fastly cleanly into categoryGroups at EDGE layer with progressive disclosure evidence (T27-12)', () => {
      const mockSnapshot = {
        id: 'snap-fastly-prod',
        domainId: 'dom-fastly-prod',
        jobId: 'job-fastly-001',
        createdAt: new Date(),
        payload: {
          dns: {
            ns: ['ns1.fastly.net'],
            a: ['151.101.1.140'],
            cname: ['dualstack.fastly.net'],
          },
          http: {
            statusCode: 200,
            headers: {
              'x-served-by': 'cache-iad-kcgs7200020-IAD',
              'x-cache': 'HIT',
              'x-fastly-request-id': 'abcdef1234567890',
            },
          },
          technology: {
            architectureBrief: {
              summary: 'Public endpoint uses Fastly edge acceleration.',
              architecturePath: [
                {
                  hop: 0,
                  layer: TopologyLayer.EDGE,
                  technologyId: 'public-endpoint',
                  technologyName: 'Public Endpoint',
                  role: 'Ingress',
                },
                {
                  hop: 1,
                  layer: TopologyLayer.EDGE,
                  technologyId: 'tech-fastly',
                  technologyName: 'Fastly',
                  role: 'Edge Delivery',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.EDGE,
                  technologies: [
                    {
                      technologyId: 'tech-fastly',
                      name: 'Fastly',
                      role: 'Edge Delivery',
                      layer: TopologyLayer.EDGE,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-fastly',
                  name: 'Fastly',
                  role: 'Edge Delivery',
                  layer: TopologyLayer.EDGE,
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-fastly',
                  technologyName: 'Fastly',
                  boundary:
                    'Fastly edge presence does not prove origin hosting or database',
                },
              ],
              confidence: { overallLevel: 'HIGH', overallScore: 0.98 },
            },
          },
        },
      };

      const overview = InfrastructureOverviewMapper.fromSnapshot(
        mockSnapshot as any,
      );
      expect(overview.cdn).toBe('Fastly');
      expect(overview.technologyArchitecture).toBeDefined();
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('Fastly');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Negative Anti-Overreach Invariants
  // ---------------------------------------------------------------------------
  describe('7. Negative Anti-Overreach Invariants', () => {
    it('strictly avoids manufacturing origin compute or database technologies from Fastly edge telemetry', () => {
      expect(fastlyDetector.id).toBe('tech-fastly');
      expect(fastlyDetector.whatThisDoesNotProve).toContain(
        'origin hosting on AWS, Azure, GCP',
      );
      expect(fastlyDetector.whatThisDoesNotProve).toContain('PostgreSQL');
      expect(fastlyDetector.whatThisDoesNotProve).toContain('Redis');
      expect(fastlyDetector.whatThisDoesNotProve).toContain('Kubernetes');
      expect(fastlyDetector.whatThisDoesNotProve).toContain('Docker');
    });
  });
});
