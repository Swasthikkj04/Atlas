import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { CaddyDetector } from '../../infrastructure/discovery/technology/detectors/web-servers/caddy.detector';
import { TraefikDetector } from '../../infrastructure/discovery/technology/detectors/web-servers/traefik.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import {
  TopologyLayer,
  TechnologyCategory,
} from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { TechnologyChangeClassification } from './contracts/technology-change.interface';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';

describe('T29: Modern Ingress Gateway (Caddy & Traefik) Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let caddyDetector: CaddyDetector;
  let traefikDetector: TraefikDetector;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    caddyDetector = moduleRef.get(CaddyDetector);
    traefikDetector = moduleRef.get(TraefikDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  // ---------------------------------------------------------------------------
  // 1. Component-Specific Caddy Detection (TECH-001)
  // ---------------------------------------------------------------------------
  describe('1. Component-Specific Caddy Detection (TECH-001)', () => {
    it('detects Caddy from Server: Caddy/v2.7.6 with version extraction and HIGH confidence (T29-01)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['198.51.100.25'],
          cname: [],
          ns: ['ns1.example.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://caddy-app.io',
          finalUrl: 'https://caddy-app.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 32,
          headers: {
            server: 'Caddy/v2.7.6',
            'strict-transport-security': 'max-age=31536000; includeSubDomains',
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

      const result = await techDiscovery.discover('caddy-app.io', snapshot);

      const caddy = result.technologies.find((t) => t.id === 'tech-caddy');
      expect(caddy).toBeDefined();
      expect(caddy?.name).toBe('Caddy');
      expect(caddy?.category).toBe('Web / Server');
      expect(caddy?.confidenceLevel).toBe('HIGH');
      expect(caddy?.role).toContain('Web Server / Ingress Gateway');
      expect(caddy?.version).toBe('2.7.6');
      expect(caddy?.whatThisDoesNotProve).toBeDefined();
      expect(caddy?.whatThisDoesNotProve).toContain('Docker');
      expect(caddy?.whatThisDoesNotProve).toContain('Kubernetes');
    });

    it('detects Caddy via custom headers without version hallucination (T29-02)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['198.51.100.26'],
          cname: [],
          ns: ['ns1.example.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://custom-caddy.org',
          finalUrl: 'https://custom-caddy.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'Caddy',
            'x-caddy-router': 'tls-auto',
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

      const result = await techDiscovery.discover('custom-caddy.org', snapshot);

      const caddy = result.technologies.find((t) => t.id === 'tech-caddy');
      expect(caddy).toBeDefined();
      expect(caddy?.version).toBeUndefined();
      expect(caddy?.confidenceLevel).toBe('HIGH');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Component-Specific Traefik Detection (TECH-001)
  // ---------------------------------------------------------------------------
  describe('2. Component-Specific Traefik Detection (TECH-001)', () => {
    it('detects Traefik from Server: traefik/v2.10.4 with version extraction and HIGH confidence (T29-03)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['203.0.113.80'],
          cname: [],
          ns: ['ns1.example.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://traefik-ingress.io',
          finalUrl: 'https://traefik-ingress.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'traefik/v2.10.4',
            'strict-transport-security': 'max-age=31536000',
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
        'traefik-ingress.io',
        snapshot,
      );

      const traefik = result.technologies.find((t) => t.id === 'tech-traefik');
      expect(traefik).toBeDefined();
      expect(traefik?.name).toBe('Traefik');
      expect(traefik?.category).toBe('Web / Server');
      expect(traefik?.confidenceLevel).toBe('HIGH');
      expect(traefik?.role).toContain('Ingress Gateway / Reverse Proxy');
      expect(traefik?.version).toBe('2.10.4');
      expect(traefik?.whatThisDoesNotProve).toBeDefined();
      expect(traefik?.whatThisDoesNotProve).toContain('Kubernetes');
      expect(traefik?.whatThisDoesNotProve).toContain('Docker');
    });

    it('detects Traefik via routing headers without version hallucination (T29-04)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['203.0.113.81'],
          cname: [],
          ns: ['ns1.example.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://microservices.io',
          finalUrl: 'https://microservices.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 27,
          headers: {
            'x-traefik-router': 'api-v1@file',
            'x-traefik-service': 'api-service@file',
            via: '1.1 traefik',
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

      const result = await techDiscovery.discover('microservices.io', snapshot);

      const traefik = result.technologies.find((t) => t.id === 'tech-traefik');
      expect(traefik).toBeDefined();
      expect(traefik?.version).toBeUndefined();
      expect(traefik?.confidenceLevel).toBe('HIGH');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Negative Detection & Isolation (TECH-001)
  // ---------------------------------------------------------------------------
  describe('3. Negative Detection & Isolation (TECH-001)', () => {
    it('returns null for Caddy and Traefik when standard NGINX is observed (T29-05)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['1.1.1.1'],
          cname: [],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://nginx-only.com',
          finalUrl: 'https://nginx-only.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 15,
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

      const result = await techDiscovery.discover('nginx-only.com', snapshot);

      expect(result.technologies.some((t) => t.id === 'tech-caddy')).toBe(
        false,
      );
      expect(result.technologies.some((t) => t.id === 'tech-traefik')).toBe(
        false,
      );
      expect(result.technologies.some((t) => t.id === 'tech-nginx')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Anti-Overreach Invariants: No Automatic Docker/Kubernetes Inference
  // ---------------------------------------------------------------------------
  describe('4. Anti-Overreach Invariants: No Automatic Docker/Kubernetes Inference (TECH-002)', () => {
    it('guarantees Caddy presence does NOT fabricate Docker or database detections (T29-06)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['198.51.100.50'],
          cname: [],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://pure-caddy.com',
          finalUrl: 'https://pure-caddy.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: { server: 'Caddy/v2.7.6' },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover('pure-caddy.com', snapshot);

      // Caddy detected
      expect(result.technologies.some((t) => t.id === 'tech-caddy')).toBe(true);

      // Invariants: Docker, Kubernetes, Databases MUST NOT be inferred
      expect(result.technologies.some((t) => t.id === 'tech-docker')).toBe(
        false,
      );
      expect(result.technologies.some((t) => t.id === 'tech-kubernetes')).toBe(
        false,
      );
      expect(
        result.technologies.some(
          (t) => t.id.includes('postgres') || t.id.includes('mysql'),
        ),
      ).toBe(false);

      // Known unknowns must explicitly mark backend containerization/compute
      const knownUnknowns = result.architectureBrief.knownUnknowns;
      expect(
        knownUnknowns.some(
          (u) =>
            u.dimension.toLowerCase().includes('compute') ||
            u.dimension.toLowerCase().includes('application'),
        ),
      ).toBe(true);
    });

    it('guarantees Traefik presence does NOT fabricate Kubernetes or Docker Swarm detections (T29-07)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['203.0.113.90'],
          cname: [],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://pure-traefik.com',
          finalUrl: 'https://pure-traefik.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 22,
          headers: { server: 'traefik/v2.10.4' },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover('pure-traefik.com', snapshot);

      // Traefik detected
      expect(result.technologies.some((t) => t.id === 'tech-traefik')).toBe(
        true,
      );

      // Invariants: Kubernetes, Docker, Databases MUST NOT be inferred
      expect(result.technologies.some((t) => t.id === 'tech-kubernetes')).toBe(
        false,
      );
      expect(result.technologies.some((t) => t.id === 'tech-docker')).toBe(
        false,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Multi-Tier Coexistence & Topology (TECH-003)
  // ---------------------------------------------------------------------------
  describe('5. Multi-Tier Coexistence & Topology (TECH-003)', () => {
    it('composes Fastly (EDGE) -> Caddy (GATEWAY) -> Node.js (RUNTIME) multi-tier topology (T29-08)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['151.101.1.1'],
          cname: ['dualstack.fastly.net'],
          ns: ['ns1.fastly.net'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://fastly-caddy-node.io',
          finalUrl: 'https://fastly-caddy-node.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'x-served-by': 'cache-iad-kcgs7200020-IAD',
            'x-cache': 'HIT',
            server: 'Caddy/v2.7.6',
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
        'fastly-caddy-node.io',
        snapshot,
      );

      const fastly = result.technologies.find((t) => t.id === 'tech-fastly');
      const caddy = result.technologies.find((t) => t.id === 'tech-caddy');
      const nodejs = result.technologies.find((t) => t.id === 'tech-nodejs');

      expect(fastly).toBeDefined();
      expect(caddy).toBeDefined();
      expect(nodejs).toBeDefined();

      // Verify layer placement
      const edgeLayer = result.architectureBrief.layers.find(
        (l) => l.layer === TopologyLayer.EDGE,
      );
      const gatewayLayer = result.architectureBrief.layers.find(
        (l) => l.layer === TopologyLayer.GATEWAY,
      );
      const runtimeLayer = result.architectureBrief.layers.find(
        (l) => l.layer === TopologyLayer.RUNTIME,
      );

      expect(edgeLayer?.technologies.some((t) => t.name === 'Fastly')).toBe(
        true,
      );
      expect(gatewayLayer?.technologies.some((t) => t.name === 'Caddy')).toBe(
        true,
      );
      expect(runtimeLayer?.technologies.some((t) => t.name === 'Node.js')).toBe(
        true,
      );
    });

    it('coexists Cloudflare (EDGE) -> Traefik (GATEWAY) -> Envoy (GATEWAY) -> Django (APPLICATION) (T29-09)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.16.12.34'],
          cname: [],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://edge-traefik-envoy-django.com',
          finalUrl: 'https://edge-traefik-envoy-django.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 35,
          headers: {
            'cf-ray': '89a123456789-iad',
            server: 'traefik/v2.10.4',
            'x-envoy-upstream-service-time': '12',
            'set-cookie': 'csrftoken=xyz789; Path=/',
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
        'edge-traefik-envoy-django.com',
        snapshot,
      );

      const cloudflare = result.technologies.find(
        (t) => t.id === 'tech-cloudflare',
      );
      const traefik = result.technologies.find((t) => t.id === 'tech-traefik');
      const envoy = result.technologies.find((t) => t.id === 'tech-envoy');
      const django = result.technologies.find((t) => t.id === 'tech-django');

      expect(cloudflare).toBeDefined();
      expect(traefik).toBeDefined();
      expect(envoy).toBeDefined();
      expect(django).toBeDefined();

      const gatewayLayer = result.architectureBrief.layers.find(
        (l) => l.layer === TopologyLayer.GATEWAY,
      );
      expect(gatewayLayer?.technologies.some((t) => t.name === 'Traefik')).toBe(
        true,
      );
      expect(gatewayLayer?.technologies.some((t) => t.name === 'Envoy')).toBe(
        true,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Snapshot Determinism & Change Intelligence (TECH-005, TECH-006)
  // ---------------------------------------------------------------------------
  describe('6. Snapshot Determinism & Change Intelligence (TECH-005, TECH-006)', () => {
    it('produces deterministic snapshot memory and identifies TECHNOLOGY_ADDED delta upon Caddy deployment (T29-10)', async () => {
      const prevSnapshot: DiscoverySnapshot = {
        dns: { a: ['198.51.100.10'], cname: [], ns: [] },
        http: {
          reachable: true,
          headers: { server: 'Apache/2.4.58' },
        },
        technology: {
          technologies: [
            {
              id: 'tech-apache',
              name: 'Apache HTTP Server',
              category: 'Web / Server',
              confidence: 0.95,
              confidenceLevel: 'HIGH',
              evidence: [],
            },
          ],
        },
      } as any;

      const currSnapshot: DiscoverySnapshot = {
        dns: { a: ['198.51.100.10'], cname: [], ns: [] },
        http: {
          reachable: true,
          headers: { server: 'Caddy/v2.7.6' },
        },
        technology: {
          technologies: [
            {
              id: 'tech-caddy',
              name: 'Caddy',
              category: 'Web / Server',
              confidence: 0.99,
              confidenceLevel: 'HIGH',
              version: '2.7.6',
              evidence: [],
            },
          ],
        },
      } as any;

      const prevMemory = snapshotMemoryService.createSnapshotMemory(
        'snap-prev',
        'dom-migrating',
        'migrating-app.io',
        prevSnapshot,
      );

      const currMemory = snapshotMemoryService.createSnapshotMemory(
        'snap-curr',
        'dom-migrating',
        'migrating-app.io',
        currSnapshot,
      );

      expect(prevMemory.fingerprints.topologyFingerprint).toBeDefined();
      expect(currMemory.fingerprints.topologyFingerprint).toBeDefined();

      const diffs = changeAnalyzer.analyzeDifferences(
        prevSnapshot,
        currSnapshot,
      );
      const caddyDiff = diffs.find((d) => d.technologyId === 'tech-caddy');

      expect(caddyDiff).toBeDefined();
      expect(caddyDiff?.classification).toBe(
        TechnologyChangeClassification.TECHNOLOGY_ADDED,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Domain Overview API Mapper Integration (TECH-008)
  // ---------------------------------------------------------------------------
  describe('7. Domain Overview API Mapper Integration (TECH-008)', () => {
    it('maps Caddy and Traefik correctly into DomainOverviewResponseDto (T29-11)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: { a: ['203.0.113.100'], cname: [], ns: [] },
        http: {
          reachable: true,
          headers: {
            server: 'traefik/v2.10.4',
          },
        },
        technology: {
          technologies: [
            {
              id: 'tech-traefik',
              name: 'Traefik',
              category: 'Web / Server',
              confidence: 0.99,
              confidenceLevel: 'HIGH',
              role: 'Ingress Gateway / Reverse Proxy',
              version: '2.10.4',
              evidence: [],
            },
          ],
          architectureBrief: {
            summary: 'Endpoint is served by Traefik Ingress Gateway.',
            confidence: 'HIGH',
            confidenceScore: 0.98,
            hops: [],
            layers: [
              {
                layer: 'GATEWAY',
                state: 'OBSERVED',
                confidenceLevel: 'HIGH',
                technologies: [
                  {
                    id: 'tech-traefik',
                    name: 'Traefik',
                    category: 'Web / Server',
                    confidence: 0.99,
                    confidenceLevel: 'HIGH',
                    role: 'Ingress Gateway / Reverse Proxy',
                    version: '2.10.4',
                  },
                ],
              },
            ],
            keyTechnologies: [
              {
                id: 'tech-traefik',
                name: 'Traefik',
                category: 'Web / Server',
                role: 'Ingress Gateway / Reverse Proxy',
                version: '2.10.4',
              },
            ],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
          },
        },
      } as any;

      const domainOverview = InfrastructureOverviewMapper.fromSnapshot({
        id: 'snap-traefik-1',
        domainId: 'dom-traefik-1',
        domainName: 'traefik.example.com',
        domain: {
          id: 'dom-traefik-1',
          domainName: 'traefik.example.com',
          status: 'COMPLETED',
        },
        payload: snapshot,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      expect(domainOverview.webServer).toContain('traefik');
      expect(domainOverview.technologyArchitecture).toBeDefined();

      const gatewayLayer = domainOverview.technologyArchitecture?.layers.find(
        (l) => l.layer === 'GATEWAY',
      );
      expect(gatewayLayer).toBeDefined();
      expect(gatewayLayer?.technologies.some((t) => t.name === 'Traefik')).toBe(
        true,
      );
    });
  });
});
