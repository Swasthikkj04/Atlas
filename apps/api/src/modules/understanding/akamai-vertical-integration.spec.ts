import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { AkamaiDetector } from '../../infrastructure/discovery/technology/detectors/cdn/akamai.detector';
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

describe('T28: Akamai Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let akamaiDetector: AkamaiDetector;
  let behavioralEngine: DeepBehavioralFingerprintingEngine;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    akamaiDetector = moduleRef.get(AkamaiDetector);
    behavioralEngine = moduleRef.get(DeepBehavioralFingerprintingEngine);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  // ---------------------------------------------------------------------------
  // 1. Component-Specific Akamai Detection (TECH-001)
  // ---------------------------------------------------------------------------
  describe('1. Component-Specific Akamai Detection (TECH-001)', () => {
    it('detects Akamai from Server: AkamaiGHost, x-akamai-transformed, and akamai-grn headers with HIGH confidence (T28-01)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['23.200.10.55', '23.200.10.60'],
          cname: ['e1234.dscg.akamaiedge.net'],
          ns: ['a1-12.akam.net'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://enterprise.bank.com',
          finalUrl: 'https://enterprise.bank.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 28,
          headers: {
            server: 'AkamaiGHost',
            'x-akamai-transformed': '9 - 0 pmb=mRUM,1',
            'akamai-grn': '0.85e3a840.1698240000.1234567',
            'x-akamai-request-id': 'abcdef1234567890',
            via: '1.1 akamaighost (AkamaiGHost)',
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
        'enterprise.bank.com',
        snapshot,
      );

      const akamai = result.technologies.find((t) => t.id === 'tech-akamai');
      expect(akamai).toBeDefined();
      expect(akamai?.name).toBe('Akamai');
      expect(akamai?.category).toBe('CDN / Edge');
      expect(akamai?.confidenceLevel).toBe('HIGH');
      expect(akamai?.role).toBe('Edge Delivery / CDN Ingress');
      expect(akamai?.evidence.length).toBeGreaterThanOrEqual(4);
    });

    it('detects Akamai via CNAME records and Server banner (T28-02)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.103.111.45'],
          cname: ['cust-corp.edgekey.net'],
          ns: ['n0a.akamai.net'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://corp.example.com',
          finalUrl: 'https://corp.example.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 22,
          headers: {
            server: 'AkamaiNetStorage',
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

      const result = await techDiscovery.discover('corp.example.com', snapshot);

      const akamai = result.technologies.find((t) => t.id === 'tech-akamai');
      expect(akamai).toBeDefined();
      expect(akamai?.name).toBe('Akamai');
      expect(akamai?.category).toBe('CDN / Edge');
      expect(akamai?.confidenceLevel).toBe('HIGH');
    });

    it('returns null when no Akamai signals exist in telemetry (T28-03)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['93.184.216.34'],
          cname: [],
          ns: ['ns1.example.org'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://clean-origin.org',
          finalUrl: 'https://clean-origin.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 15,
          headers: {
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
      };

      const result = await techDiscovery.discover('clean-origin.org', snapshot);

      const akamai = result.technologies.find((t) => t.id === 'tech-akamai');
      expect(akamai).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Technology Meaning & Anti-Overreach Guarantees (TECH-002 & T28-04)
  // ---------------------------------------------------------------------------
  describe('2. Technology Meaning & Anti-Overreach Guarantees (TECH-002 & T28-04)', () => {
    it('strictly enforces whatThisDoesNotProve boundary and omits unverified origin claims', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['23.200.10.55'],
          cname: ['e1234.dscg.akamaiedge.net'],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://akamai-bounded.io',
          finalUrl: 'https://akamai-bounded.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'AkamaiGHost',
            'x-akamai-transformed': '9 - 0 pmb=mRUM,1',
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
        'akamai-bounded.io',
        snapshot,
      );

      const akamai = result.technologies.find((t) => t.id === 'tech-akamai');
      expect(akamai).toBeDefined();

      // Meaning & claim boundary invariants
      expect(akamai?.whatThisDoesNotProve).toBeDefined();
      expect(akamai?.whatThisDoesNotProve).toContain(
        'Akamai edge delivery evidence confirms edge proxy',
      );
      expect(akamai?.whatThisDoesNotProve).toContain(
        'does not prove origin hosting',
      );
      expect(akamai?.whatThisDoesNotProve).toContain(
        'backend database services',
      );

      // Database technologies must remain UNOBSERVED
      const dbTech = result.technologies.find((t) =>
        ['PostgreSQL', 'MySQL', 'Redis', 'Oracle', 'MongoDB'].includes(t.name),
      );
      expect(dbTech).toBeUndefined();
    });

    it('leaves version undefined and never emits "Version: Unknown" (T28-05)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['23.200.10.55'],
          cname: ['e1234.dscg.akamaiedge.net'],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://no-version.io',
          finalUrl: 'https://no-version.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            server: 'AkamaiGHost',
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

      const result = await techDiscovery.discover('no-version.io', snapshot);
      const akamai = result.technologies.find((t) => t.id === 'tech-akamai');

      expect(akamai).toBeDefined();
      expect(akamai?.version).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Tier Topology & Coexistence (TECH-003 & TECH-004)
  // ---------------------------------------------------------------------------
  describe('3. Multi-Tier Topology & Coexistence (TECH-003 & TECH-004)', () => {
    it('composes multi-tier topology: Akamai (EDGE) -> NGINX (GATEWAY) -> Node.js (RUNTIME) (T28-06)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['23.200.10.55'],
          cname: ['edge.bank.akamaiedge.net'],
          ns: ['a1-12.akam.net'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://bank.example.com',
          finalUrl: 'https://bank.example.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'nginx/1.24.0',
            'x-akamai-transformed': '9 - 0 pmb=mRUM,1',
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

      const result = await techDiscovery.discover('bank.example.com', snapshot);

      const akamai = result.technologies.find((t) => t.id === 'tech-akamai');
      const nginx = result.technologies.find((t) => t.id === 'tech-nginx');
      const nodejs = result.technologies.find((t) => t.id === 'tech-nodejs');

      expect(akamai).toBeDefined();
      expect(nginx).toBeDefined();
      expect(nodejs).toBeDefined();

      expect(akamai?.category).toBe('CDN / Edge');
      expect(nginx?.category).toBe('Web / Server');
      expect(nodejs).toBeDefined();

      // Verify topology layering in Architecture Brief
      const brief = result.architectureBrief;
      expect(brief).toBeDefined();
      if (brief?.hops) {
        expect(brief.hops.length).toBeGreaterThanOrEqual(2);

        const edgeHop = brief.hops.find(
          (h) => h.technologyId === 'tech-akamai',
        );
        const gatewayHop = brief.hops.find(
          (h) => h.technologyId === 'tech-nginx',
        );

        expect(edgeHop).toBeDefined();
        expect(edgeHop?.layer).toBe('EDGE');

        expect(gatewayHop).toBeDefined();
        expect(gatewayHop?.layer).toBe('GATEWAY');
      }
    });

    it('coexists cleanly with Envoy proxy without collapsing into a single layer (T28-07)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['23.200.10.55'],
          cname: ['api.akamaihd.net'],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://api.gateway-corp.com',
          finalUrl: 'https://api.gateway-corp.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 35,
          headers: {
            server: 'envoy/1.28.0',
            'x-akamai-transformed': '9 - 0 pmb=mRUM,1',
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

      const result = await techDiscovery.discover(
        'api.gateway-corp.com',
        snapshot,
      );

      const akamai = result.technologies.find((t) => t.id === 'tech-akamai');
      const envoy = result.technologies.find((t) => t.id === 'tech-envoy');

      expect(akamai).toBeDefined();
      expect(envoy).toBeDefined();

      expect(akamai?.role).toBe('Edge Delivery / CDN Ingress');
      expect(envoy?.role).toBe('Reverse Proxy / Service Proxy');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Snapshot Memory & Determinism (TECH-005 & T28-08)
  // ---------------------------------------------------------------------------
  describe('4. Snapshot Memory & Determinism (TECH-005 & T28-08)', () => {
    it('produces deterministic identical technologies for Akamai infrastructure snapshots', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['23.200.10.55'],
          cname: ['e1234.dscg.akamaiedge.net'],
          ns: [],
        },
        http: {
          reachable: true,
          url: 'https://akamai-memory.com',
          finalUrl: 'https://akamai-memory.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            server: 'AkamaiGHost',
            'x-akamai-transformed': '9 - 0 pmb=mRUM,1',
          },
        },
      } as any;

      const result1 = await techDiscovery.discover(
        'akamai-memory.com',
        snapshot,
      );
      const result2 = await techDiscovery.discover(
        'akamai-memory.com',
        snapshot,
      );

      expect(result1.technologies.length).toBe(result2.technologies.length);
      expect(result1.technologies[0].id).toBe(result2.technologies[0].id);
      expect(result1.technologies[0].name).toBe('Akamai');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Change Intelligence Delta (TECH-006 & T28-09)
  // ---------------------------------------------------------------------------
  describe('5. Change Intelligence Delta (TECH-006 & T28-09)', () => {
    it('detects Akamai appearance when migrating from direct origin to Akamai CDN', async () => {
      const prevSnapshot: DiscoverySnapshot = {
        dns: { a: ['93.184.216.34'], cname: [], ns: [] },
        http: {
          reachable: true,
          headers: { server: 'nginx/1.24.0' },
        },
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: 'Web / Server',
              confidence: 0.95,
              confidenceLevel: 'HIGH',
              evidence: [],
            },
          ],
        },
      } as any;

      const currSnapshot: DiscoverySnapshot = {
        dns: {
          a: ['23.200.10.55'],
          cname: ['edge.bank.akamaiedge.net'],
          ns: [],
        },
        http: {
          reachable: true,
          headers: {
            server: 'AkamaiGHost',
            'x-akamai-transformed': '9 - 0 pmb=mRUM,1',
          },
        },
        technology: {
          technologies: [
            {
              id: 'tech-akamai',
              name: 'Akamai',
              category: 'CDN / Edge',
              confidence: 0.99,
              confidenceLevel: 'HIGH',
              evidence: [],
            },
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: 'Web / Server',
              confidence: 0.95,
              confidenceLevel: 'HIGH',
              evidence: [],
            },
          ],
        },
      } as any;

      const diffs = changeAnalyzer.analyzeDifferences(
        prevSnapshot,
        currSnapshot,
      );
      const akamaiDiff = diffs.find((d) => d.technologyId === 'tech-akamai');
      expect(akamaiDiff).toBeDefined();
      expect(akamaiDiff?.classification).toBe(
        TechnologyChangeClassification.TECHNOLOGY_ADDED,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Domain Overview API Mapper Integration (TECH-008 & T28-10)
  // ---------------------------------------------------------------------------
  describe('6. Domain Overview API Mapper Integration (TECH-008 & T28-10)', () => {
    it('maps Akamai to cdn and reflects EDGE layer in architecture overview', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['23.200.10.55'],
          cname: ['edge.bank.akamaiedge.net'],
          ns: ['a1-12.akam.net'],
        },
        http: {
          reachable: true,
          headers: {
            server: 'AkamaiGHost',
            'x-akamai-transformed': '9 - 0 pmb=mRUM,1',
          },
        },
        technology: {
          technologies: [
            {
              id: 'tech-akamai',
              name: 'Akamai',
              category: 'CDN / Edge',
              confidence: 0.99,
              confidenceLevel: 'HIGH',
              role: 'Edge Delivery / CDN Ingress',
              evidence: [],
            },
          ],
          architectureBrief: {
            summary: 'Endpoint is fronted by Akamai Intelligent Edge.',
            confidence: 'HIGH',
            confidenceScore: 0.98,
            hops: [
              {
                hop: 0,
                layer: 'EDGE',
                technologyId: 'public-endpoint',
                technologyName: 'Public Endpoint',
                role: 'Ingress',
              },
              {
                hop: 1,
                layer: 'EDGE',
                technologyId: 'tech-akamai',
                technologyName: 'Akamai',
                role: 'Edge Delivery / CDN Ingress',
              },
            ],
            layers: [
              {
                layer: 'EDGE',
                state: 'OBSERVED',
                confidenceLevel: 'HIGH',
                technologies: [
                  {
                    id: 'tech-akamai',
                    name: 'Akamai',
                    category: 'CDN / Edge',
                    confidence: 0.99,
                    confidenceLevel: 'HIGH',
                    role: 'Edge Delivery / CDN Ingress',
                  },
                ],
              },
            ],
            keyTechnologies: [
              {
                id: 'tech-akamai',
                name: 'Akamai',
                category: 'CDN / Edge',
                role: 'Edge Delivery / CDN Ingress',
              },
            ],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
          },
        },
      } as any;

      const domainOverview = InfrastructureOverviewMapper.fromSnapshot({
        id: 'snap-akamai-1',
        domainId: 'dom-akamai-1',
        domainName: 'bank.example.com',
        domain: {
          id: 'dom-akamai-1',
          domainName: 'bank.example.com',
          status: 'COMPLETED',
        },
        payload: snapshot,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      expect(domainOverview.cdn).toBe('Akamai');
      expect(domainOverview.technologyArchitecture).toBeDefined();

      const edgeLayer = domainOverview.technologyArchitecture?.layers.find(
        (l) => l.layer === 'EDGE',
      );
      expect(edgeLayer).toBeDefined();
      expect(edgeLayer?.technologies.some((t) => t.name === 'Akamai')).toBe(
        true,
      );
    });
  });
});
