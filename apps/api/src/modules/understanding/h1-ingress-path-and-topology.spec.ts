import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import {
  TechnologyRelationshipType,
  TopologyLayer,
} from '../../infrastructure/discovery/technology/contracts';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';

describe('H1: Ingress Request Path & Topology Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Canonical Ingress Request Path Construction (Client -> Edge -> Gateway -> App -> Runtime -> Sealed Core)', () => {
    it('constructs authoritative 5-hop linear request path from raw evidence', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.16.123.99'],
          cname: [],
          ns: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://enterprise-saas.com',
          finalUrl: 'https://enterprise-saas.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 45,
          headers: {
            server: 'nginx/1.24.0',
            'cf-ray': '8877665544332211-IAD',
            'x-powered-by': 'Next.js',
            'x-node-version': '20.11.0',
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
        ssl: {
          authorized: true,
          protocol: 'TLSv1.3',
          certificate: {
            subject: 'CN=enterprise-saas.com',
            issuer: 'Cloudflare Inc ECC CA-3',
            validFrom: '2026-01-01',
            validTo: '2026-12-31',
            subjectAltNames: ['enterprise-saas.com', '*.enterprise-saas.com'],
          },
        },
      };

      const result = await techDiscovery.discover(
        'enterprise-saas.com',
        snapshot,
      );

      expect(result.topology).toBeDefined();
      expect(result.architectureBrief).toBeDefined();

      const brief = result.architectureBrief;
      const path = brief.architecturePath;

      // Ingress path hops verification
      expect(path.length).toBeGreaterThanOrEqual(4);

      // Hop 0: Public Entrypoint
      expect(path[0].hop).toBe(0);
      expect(path[0].technologyId).toBe('public-endpoint');
      expect(path[0].role).toBe('Client Request Ingress');

      // Edge hop
      const edgeHop = path.find(
        (p) =>
          p.layer === TopologyLayer.EDGE &&
          p.technologyId === 'tech-cloudflare',
      );
      expect(edgeHop).toBeDefined();
      expect(edgeHop?.technologyName).toBe('Cloudflare');

      // Gateway hop
      const gatewayHop = path.find(
        (p) =>
          p.layer === TopologyLayer.GATEWAY && p.technologyId === 'tech-nginx',
      );
      expect(gatewayHop).toBeDefined();
      expect(gatewayHop?.technologyName).toBe('NGINX');

      // Application Framework hop
      const appHop = path.find(
        (p) =>
          p.layer === TopologyLayer.APPLICATION &&
          p.technologyId === 'tech-nextjs',
      );
      expect(appHop).toBeDefined();
      expect(appHop?.technologyName).toBe('Next.js');

      // Runtime hop
      const runtimeHop = path.find(
        (p) =>
          p.layer === TopologyLayer.RUNTIME && p.technologyId === 'tech-nodejs',
      );
      expect(runtimeHop).toBeDefined();
      expect(runtimeHop?.technologyName).toBe('Node.js');
    });
  });

  describe('2. Invariant 1: Observation != Relationship (Evidence-Grounded Connections)', () => {
    it('guarantees relationships are backed by explicit evidence and rationale', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.16.50.1'],
          cname: [],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://grounded-rel.org',
          finalUrl: 'https://grounded-rel.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 38,
          headers: {
            server: 'nginx/1.22.0',
            'cf-ray': '998877665544-SJC',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        htmlBody: '<html><body>Site</body></html>',
      };

      const result = await techDiscovery.discover('grounded-rel.org', snapshot);
      const topology = result.topology;

      // Verify Cloudflare -> NGINX relationship
      const edgeToGateway = topology.relationships.find(
        (r) =>
          r.sourceTechnologyId === 'tech-cloudflare' &&
          r.targetTechnologyId === 'tech-nginx',
      );

      expect(edgeToGateway).toBeDefined();
      expect(edgeToGateway?.relationshipType).toBe(
        TechnologyRelationshipType.FORWARDS_TO,
      );
      expect(edgeToGateway?.evidence.length).toBeGreaterThan(0);
      expect(edgeToGateway?.evidence[0].sourceType).toBe('HTTP');
      expect(edgeToGateway?.explanation).toContain('forwarded downstream');
      expect(edgeToGateway?.claimBoundary).toBeDefined();
    });
  });

  describe('3. Invariant 2: Uncertainty Preservation & Zero Intermediate Node Manufacturing', () => {
    it('does NOT fabricate an intermediate NGINX gateway when only Cloudflare and Node.js are observed', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.16.88.99'],
          cname: [],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://direct-node.io',
          finalUrl: 'https://direct-node.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 60,
          headers: {
            'cf-ray': '1122334455-ORD',
            'x-powered-by': 'Express',
            // No server header (NGINX/Apache absent)
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        htmlBody: '{"status":"ok"}',
      };

      const result = await techDiscovery.discover('direct-node.io', snapshot);
      const brief = result.architectureBrief;
      const topology = result.topology;

      // 1. GATEWAY layer must be empty / unobserved
      const gatewayNodes = topology.layers[TopologyLayer.GATEWAY] || [];
      expect(gatewayNodes.length).toBe(0);

      // 2. Ingress path must jump directly from EDGE to RUNTIME / APP without an invented gateway hop
      const hasFabricatedGateway = brief.architecturePath.some(
        (p) => p.layer === TopologyLayer.GATEWAY,
      );
      expect(hasFabricatedGateway).toBe(false);

      // 3. Gateway layer in layer summaries must be UNOBSERVED
      const gatewaySummary = brief.layers.find(
        (l) => l.layer === TopologyLayer.GATEWAY,
      );
      expect(gatewaySummary?.state).toBe('UNOBSERVED');
    });
  });

  describe('4. Invariant 3: Independent Layers (No Stack Collapsing)', () => {
    it('maintains distinct layer queryability for Edge, Gateway, Platform, Application, and Runtime', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['76.76.21.21'],
          cname: ['cname.vercel-dns.com'],
          ns: ['ns1.vercel-dns.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://multi-tier-coexistence.app',
          finalUrl: 'https://multi-tier-coexistence.app',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 40,
          headers: {
            'x-vercel-id': 'iad1::abc-123',
            'x-powered-by': 'Next.js',
            'x-node-version': '20.0.0',
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

      const result = await techDiscovery.discover(
        'multi-tier-coexistence.app',
        snapshot,
      );
      const brief = result.architectureBrief;
      const topology = result.topology;

      // Platform layer: Vercel
      expect(
        topology.layers[TopologyLayer.PLATFORM].some(
          (n) => n.id === 'tech-vercel',
        ),
      ).toBe(true);

      // Application layer: Next.js
      expect(
        topology.layers[TopologyLayer.APPLICATION].some(
          (n) => n.id === 'tech-nextjs',
        ),
      ).toBe(true);

      // Runtime layer: Node.js
      expect(
        topology.layers[TopologyLayer.RUNTIME].some(
          (n) => n.id === 'tech-nodejs',
        ),
      ).toBe(true);

      // Each layer in brief.layers is individually classified
      expect(
        brief.layers.find((l) => l.layer === TopologyLayer.PLATFORM)?.state,
      ).toBe('OBSERVED');
      expect(
        brief.layers.find((l) => l.layer === TopologyLayer.APPLICATION)?.state,
      ).toBe('OBSERVED');
      expect(
        brief.layers.find((l) => l.layer === TopologyLayer.RUNTIME)?.state,
      ).toBe('OBSERVED');
    });
  });

  describe('5. Invariant 4: Public vs Sealed Boundary (Explicit Known Unknowns)', () => {
    it('explicitly categorizes Database, Cache, and Orchestrator as UNOBSERVED known unknowns', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['151.101.1.69'],
          cname: [],
          ns: ['ns1.fastly.net'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://sealed-perimeter.com',
          finalUrl: 'https://sealed-perimeter.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 35,
          headers: {
            'x-served-by': 'cache-iad-kiad1234-IAD',
            server: 'gunicorn',
            'x-framework': 'Django/4.2.0',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        htmlBody:
          '<input type="hidden" name="csrfmiddlewaretoken" value="xyz" />',
      };

      const result = await techDiscovery.discover(
        'sealed-perimeter.com',
        snapshot,
      );
      const brief = result.architectureBrief;

      // 1. Database Backend Layer is UNOBSERVED
      const dbUnknown = brief.knownUnknowns.find((u) =>
        u.dimension.includes('Database'),
      );
      expect(dbUnknown).toBeDefined();
      expect(dbUnknown?.status).toBe('UNOBSERVED');
      expect(dbUnknown?.whyUnknown).toContain(
        'isolated behind application services',
      );

      // 2. In-Memory Caching Tier is UNOBSERVED
      const cacheUnknown = brief.knownUnknowns.find((u) =>
        u.dimension.includes('Caching'),
      );
      expect(cacheUnknown).toBeDefined();
      expect(cacheUnknown?.status).toBe('UNOBSERVED');

      // 3. Cluster Orchestrator is UNOBSERVED
      const orchUnknown = brief.knownUnknowns.find((u) =>
        u.dimension.includes('Orchestrator'),
      );
      expect(orchUnknown).toBeDefined();
      expect(orchUnknown?.status).toBe('UNOBSERVED');

      // 4. Origin Cloud Provider is MASKED behind Fastly Edge
      const originUnknown = brief.knownUnknowns.find(
        (u) => u.dimension === 'Origin Cloud Provider',
      );
      expect(originUnknown).toBeDefined();
      expect(originUnknown?.status).toBe('MASKED');
    });
  });

  describe('6. Invariant 5: Per-Relationship Confidence Calibration', () => {
    it('calibrates confidence per relationship rather than assigning an arbitrary blanket score', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['23.235.32.133'],
          cname: [],
          ns: ['ns1.fastly.net'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://fastly-caddy-python.io',
          finalUrl: 'https://fastly-caddy-python.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 55,
          headers: {
            'x-served-by': 'cache-iad-kiad1234-IAD',
            server: 'Caddy',
            'x-powered-by': 'Python/3.11',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        htmlBody: '<html>Fastly Caddy Python</html>',
      };

      const result = await techDiscovery.discover(
        'fastly-caddy-python.io',
        snapshot,
      );
      const topology = result.topology;

      expect(topology.relationships.length).toBeGreaterThanOrEqual(2);

      for (const rel of topology.relationships) {
        expect(rel.confidence).toBeGreaterThan(0);
        expect(['HIGH', 'MEDIUM', 'LOW']).toContain(rel.confidenceLevel);
        expect(rel.explanation.length).toBeGreaterThan(10);
        expect(rel.evidence.length).toBeGreaterThan(0);
      }
    });
  });

  describe('7. Invariant 6: Anti-Overreach Invariants', () => {
    it('strictly avoids inferring Postgres from Node.js, Kubernetes from Traefik, or AWS from Cloudflare', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.16.10.1'],
          cname: [],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://anti-overreach.net',
          finalUrl: 'https://anti-overreach.net',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'traefik',
            'cf-ray': '12345678-IAD',
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
        htmlBody: '<html>Anti Overreach</html>',
      };

      const result = await techDiscovery.discover(
        'anti-overreach.net',
        snapshot,
      );
      const topology = result.topology;
      const brief = result.architectureBrief;

      // 1. Node.js / Express must NOT infer PostgreSQL or databases
      const hasPostgres = topology.nodes.some(
        (n) =>
          n.id.includes('postgres') ||
          n.name.toLowerCase().includes('postgres'),
      );
      expect(hasPostgres).toBe(false);

      // 2. Traefik must NOT infer Kubernetes or Docker
      const hasK8s = topology.nodes.some(
        (n) =>
          n.id.includes('kubernetes') ||
          n.name.toLowerCase().includes('kubernetes'),
      );
      expect(hasK8s).toBe(false);

      // 3. Cloudflare must NOT infer AWS or GCP origin
      const hasAws = topology.nodes.some(
        (n) => n.id === 'tech-aws' || n.name === 'Amazon Web Services (AWS)',
      );
      expect(hasAws).toBe(false);

      // 4. Claim boundaries are explicitly documented
      expect(brief.claimBoundaries.length).toBeGreaterThan(0);
      const traefikBoundary = brief.claimBoundaries.find(
        (b) =>
          b.technologyId === 'tech-traefik' || b.technologyName === 'Traefik',
      );
      if (traefikBoundary) {
        expect(traefikBoundary.boundary).toContain('Kubernetes');
      }
    });
  });

  describe('8. Domain Overview Mapper Convergence (TECH-008 / H1)', () => {
    it('maps brief and ingress path to DomainOverview DTO preserving all hops and unknown dimensions', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.16.1.1'],
          cname: [],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://dto-convergence.io',
          finalUrl: 'https://dto-convergence.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 40,
          headers: {
            server: 'nginx',
            'cf-ray': '5544332211-IAD',
            'x-powered-by': 'Django',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        htmlBody: '<html>DTO Convergence</html>',
      };

      const result = await techDiscovery.discover(
        'dto-convergence.io',
        snapshot,
      );

      const mockSnapshotRecord: any = {
        id: 'snap-h1-test',
        domainId: 'dom-h1-test',
        httpStatus: 200,
        responseTimeMs: 40,
        createdAt: new Date(),
        payload: {
          ...snapshot,
          technology: result,
        },
      };

      const overviewDto =
        InfrastructureOverviewMapper.fromSnapshot(mockSnapshotRecord);

      expect(overviewDto.technologyArchitecture).toBeDefined();
      const techArch = overviewDto.technologyArchitecture!;

      expect(techArch.ingressPath.length).toBeGreaterThanOrEqual(3);
      expect(techArch.knownUnknowns.length).toBeGreaterThanOrEqual(3);
      expect(techArch.confidence.overallLevel).toBeDefined();
      expect(techArch.layers.length).toBeGreaterThanOrEqual(5);
    });
  });
});
