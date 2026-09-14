import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { VercelDetector } from '../../infrastructure/discovery/technology/detectors/cloud/vercel.detector';
import { NetlifyDetector } from '../../infrastructure/discovery/technology/detectors/cloud/netlify.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import {
  TopologyLayer,
  TechnologyCategory,
} from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { TechnologyChangeClassification } from './contracts/technology-change.interface';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';

describe('T30: Edge Cloud & Serverless Platform (Vercel & Netlify) Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let vercelDetector: VercelDetector;
  let netlifyDetector: NetlifyDetector;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    vercelDetector = moduleRef.get(VercelDetector);
    netlifyDetector = moduleRef.get(NetlifyDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  // ---------------------------------------------------------------------------
  // 1. Vercel Positive Header & Telemetry Detection (TECH-001)
  // ---------------------------------------------------------------------------
  describe('1. Vercel Positive Header & Telemetry Detection (TECH-001)', () => {
    it('detects Vercel from x-vercel-id, x-vercel-cache, and Server: vercel headers (T30-01)', async () => {
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
          url: 'https://vercel-edge-app.com',
          finalUrl: 'https://vercel-edge-app.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'Vercel',
            'x-vercel-id': 'iad1::5q8v7-1724912345678-abcdef',
            'x-vercel-cache': 'HIT',
            'x-vercel-edge-region': 'iad1',
            'x-vercel-ip-country': 'US',
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
          valid: true,
          certificate: {
            subjectAltName: 'DNS:*.vercel.app, DNS:vercel-edge-app.com',
          } as any,
        } as any,
      };

      const result = await techDiscovery.discover(
        'vercel-edge-app.com',
        snapshot,
      );

      const vercel = result.technologies.find((t) => t.id === 'tech-vercel');
      expect(vercel).toBeDefined();
      expect(vercel?.name).toBe('Vercel');
      expect(vercel?.category).toBe(TechnologyCategory.CLOUD_INFRASTRUCTURE);
      expect(vercel?.confidenceLevel).toBe('HIGH');
      expect(vercel?.role).toContain('Edge Platform');
      expect(vercel?.version).toBeUndefined();
      expect(vercel?.evidence.length).toBeGreaterThanOrEqual(4);
      expect(vercel?.whatThisDoesNotProve).toBeDefined();
      expect(vercel?.whatThisDoesNotProve).toContain('Next.js');
      expect(vercel?.whatThisDoesNotProve).toContain('React');
      expect(vercel?.whatThisDoesNotProve).toContain('Node.js');
      expect(vercel?.whatThisDoesNotProve).toContain('PostgreSQL');
    });

    it('detects Vercel via DNS CNAME, A record, and TLS SAN without version hallucination (T30-02)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['76.76.21.21'],
          cname: ['cname.vercel-dns.com'],
          ns: ['ns1.vercel-dns.com', 'ns2.vercel-dns.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://custom-domain.org',
          finalUrl: 'https://custom-domain.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'content-type': 'text/html; charset=utf-8',
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
          valid: true,
          certificate: {
            subjectAltName: 'DNS:*.vercel.app, DNS:custom-domain.org',
          } as any,
        } as any,
      };

      const result = await techDiscovery.discover(
        'custom-domain.org',
        snapshot,
      );

      const vercel = result.technologies.find((t) => t.id === 'tech-vercel');
      expect(vercel).toBeDefined();
      expect(vercel?.name).toBe('Vercel');
      expect(vercel?.version).toBeUndefined();
      expect(vercel?.confidenceLevel).toBe('HIGH');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Netlify Positive Header & Telemetry Detection (TECH-001)
  // ---------------------------------------------------------------------------
  describe('2. Netlify Positive Header & Telemetry Detection (TECH-001)', () => {
    it('detects Netlify from x-nf-request-id and Server: Netlify headers (T30-03)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['75.2.60.5'],
          cname: ['site-abc.netlify.app'],
          ns: ['dns1.p01.nsone.net', 'dns2.p01.nsone.net'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://netlify-site.com',
          finalUrl: 'https://netlify-site.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 28,
          headers: {
            server: 'Netlify',
            'x-nf-request-id': '01HN8Q4V2E45P67890ABCDEF',
            'x-nf-deploy-id': '64e8b9a12c4d5e6f7a8b9c0d',
            'x-nf-account-id': 'acct_12345',
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
          valid: true,
          certificate: {
            subjectAltName: 'DNS:*.netlify.app, DNS:netlify-site.com',
          } as any,
        } as any,
      };

      const result = await techDiscovery.discover('netlify-site.com', snapshot);

      const netlify = result.technologies.find((t) => t.id === 'tech-netlify');
      expect(netlify).toBeDefined();
      expect(netlify?.name).toBe('Netlify');
      expect(netlify?.category).toBe(TechnologyCategory.CLOUD_INFRASTRUCTURE);
      expect(netlify?.confidenceLevel).toBe('HIGH');
      expect(netlify?.role).toContain('Edge Platform');
      expect(netlify?.version).toBeUndefined();
      expect(netlify?.evidence.length).toBeGreaterThanOrEqual(4);
      expect(netlify?.whatThisDoesNotProve).toBeDefined();
      expect(netlify?.whatThisDoesNotProve).toContain('React');
      expect(netlify?.whatThisDoesNotProve).toContain('Vue');
      expect(netlify?.whatThisDoesNotProve).toContain('JAMstack');
      expect(netlify?.whatThisDoesNotProve).toContain('Docker');
    });

    it('detects Netlify via CNAME and TLS SAN without version hallucination (T30-04)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['100.24.50.1'],
          cname: ['custom-docs.netlify.app'],
          ns: ['ns1.example.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://docs.myproduct.io',
          finalUrl: 'https://docs.myproduct.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 35,
          headers: {
            'content-type': 'text/html; charset=utf-8',
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
          valid: true,
          certificate: {
            subjectAltName: 'DNS:*.netlify.app, DNS:docs.myproduct.io',
          } as any,
        } as any,
      };

      const result = await techDiscovery.discover(
        'docs.myproduct.io',
        snapshot,
      );

      const netlify = result.technologies.find((t) => t.id === 'tech-netlify');
      expect(netlify).toBeDefined();
      expect(netlify?.name).toBe('Netlify');
      expect(netlify?.version).toBeUndefined();
      expect(netlify?.confidenceLevel).toBe('HIGH');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Negative Isolation & Anti-Overreach Invariants (TECH-002)
  // ---------------------------------------------------------------------------
  describe('3. Negative Isolation & Anti-Overreach Invariants (TECH-002)', () => {
    it('returns null for Vercel and Netlify when standard NGINX origin headers exist (T30-05)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['93.184.216.34'],
          cname: [],
          ns: ['ns1.example.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://standard-nginx.org',
          finalUrl: 'https://standard-nginx.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 40,
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

      const result = await techDiscovery.discover(
        'standard-nginx.org',
        snapshot,
      );

      expect(
        result.technologies.find((t) => t.id === 'tech-vercel'),
      ).toBeUndefined();
      expect(
        result.technologies.find((t) => t.id === 'tech-netlify'),
      ).toBeUndefined();
      expect(
        result.technologies.find((t) => t.id === 'tech-nginx'),
      ).toBeDefined();
    });

    it('enforces that Vercel alone does NOT invent Next.js, React, Node.js, or Databases (T30-06)', async () => {
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
          url: 'https://static-html-on-vercel.com',
          finalUrl: 'https://static-html-on-vercel.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 22,
          headers: {
            server: 'Vercel',
            'x-vercel-id': 'iad1::12345-67890',
            'content-type': 'text/html',
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
        'static-html-on-vercel.com',
        snapshot,
      );

      expect(
        result.technologies.find((t) => t.id === 'tech-vercel'),
      ).toBeDefined();
      expect(
        result.technologies.find((t) => t.id === 'tech-nextjs'),
      ).toBeUndefined();
      expect(
        result.technologies.find((t) => t.id === 'tech-react'),
      ).toBeUndefined();
      expect(
        result.technologies.find((t) => t.id === 'tech-nodejs'),
      ).toBeUndefined();
      expect(
        result.technologies.find((t) => t.id === 'tech-docker'),
      ).toBeUndefined();
      expect(
        result.technologies.find((t) => t.id === 'tech-kubernetes'),
      ).toBeUndefined();

      // Known unknowns in brief mark runtime/database as unobserved
      const brief = result.architectureBrief;
      expect(brief.knownUnknowns.length).toBeGreaterThanOrEqual(1);
    });

    it('enforces that Netlify alone does NOT invent React, Vue, Svelte, or Docker (T30-07)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['75.2.60.5'],
          cname: ['plain-site.netlify.app'],
          ns: ['dns1.p01.nsone.net'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://plain-site.netlify.app',
          finalUrl: 'https://plain-site.netlify.app',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'Netlify',
            'x-nf-request-id': '01HN8Q4V2E45P67890ABCDEF',
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
        'plain-site.netlify.app',
        snapshot,
      );

      expect(
        result.technologies.find((t) => t.id === 'tech-netlify'),
      ).toBeDefined();
      expect(
        result.technologies.find((t) => t.id === 'tech-react'),
      ).toBeUndefined();
      expect(
        result.technologies.find((t) => t.id === 'tech-vue'),
      ).toBeUndefined();
      expect(
        result.technologies.find((t) => t.id === 'tech-svelte'),
      ).toBeUndefined();
      expect(
        result.technologies.find((t) => t.id === 'tech-docker'),
      ).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Multi-Tier Independent Coexistence & Topology (TECH-003)
  // ---------------------------------------------------------------------------
  describe('4. Multi-Tier Independent Coexistence & Topology (TECH-003)', () => {
    it('accurately resolves Cloudflare (EDGE) -> Vercel (PLATFORM) -> Next.js (APPLICATION) (T30-08)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.21.55.2'],
          cname: ['cname.vercel-dns.com'],
          ns: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://saas-dashboard.com',
          finalUrl: 'https://saas-dashboard.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'cf-ray': '89a123456789-iad',
            'x-vercel-id': 'iad1::5q8v7-1724912345678-abcdef',
            'x-vercel-cache': 'HIT',
            'x-powered-by': 'Next.js',
          },
          bodySnippet: '<div id="__next"><div>Hello Next.js</div></div>',
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
        'saas-dashboard.com',
        snapshot,
      );

      const cf = result.technologies.find((t) => t.id === 'tech-cloudflare');
      const vercel = result.technologies.find((t) => t.id === 'tech-vercel');
      const nextjs = result.technologies.find((t) => t.id === 'tech-nextjs');

      expect(cf).toBeDefined();
      expect(vercel).toBeDefined();
      expect(nextjs).toBeDefined();

      const topology = result.topology;
      const vercelNode = topology.nodes.find((n) => n.id === 'tech-vercel');
      expect(vercelNode?.layer).toBe(TopologyLayer.PLATFORM);

      const nextNode = topology.nodes.find((n) => n.id === 'tech-nextjs');
      expect(nextNode?.layer).toBe(TopologyLayer.APPLICATION);
    });

    it('accurately resolves Netlify (PLATFORM) + React (APPLICATION) independent coexistence (T30-09)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['75.2.60.5'],
          cname: ['react-app.netlify.app'],
          ns: ['dns1.p01.nsone.net'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://react-app.netlify.app',
          finalUrl: 'https://react-app.netlify.app',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'Netlify',
            'x-nf-request-id': '01HN8Q4V2E45P67890ABCDEF',
          },
          bodySnippet:
            '<div id="root" data-reactroot=""><div class="app">React App</div></div>',
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
        'react-app.netlify.app',
        snapshot,
      );

      const netlify = result.technologies.find((t) => t.id === 'tech-netlify');
      const react = result.technologies.find((t) => t.id === 'tech-react');

      expect(netlify).toBeDefined();
      expect(react).toBeDefined();

      const topology = result.topology;
      const netlifyNode = topology.nodes.find((n) => n.id === 'tech-netlify');
      expect(netlifyNode?.layer).toBe(TopologyLayer.PLATFORM);

      const reactNode = topology.nodes.find((n) => n.id === 'tech-react');
      expect(reactNode?.layer).toBe(TopologyLayer.APPLICATION);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Snapshot Memory & Change Intelligence (TECH-005 / TECH-006)
  // ---------------------------------------------------------------------------
  describe('5. Snapshot Memory & Change Intelligence (TECH-005 / TECH-006)', () => {
    it('produces deterministic snapshots and detects TECHNOLOGY_ADDED when migrating from Apache to Vercel (T30-10)', async () => {
      const domain = 'migration-test.io';

      // Snapshot 1: Traditional Apache server
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

      // Snapshot 2: Migrated to Vercel
      const currSnapshot: DiscoverySnapshot = {
        dns: { a: ['76.76.21.21'], cname: ['cname.vercel-dns.com'], ns: [] },
        http: {
          reachable: true,
          headers: {
            server: 'Vercel',
            'x-vercel-id': 'iad1::5q8v7-1724912345678-abcdef',
            'x-vercel-cache': 'HIT',
          },
        },
        technology: {
          technologies: [
            {
              id: 'tech-vercel',
              name: 'Vercel',
              category: 'Cloud / Infrastructure',
              confidence: 0.99,
              confidenceLevel: 'HIGH',
              evidence: [],
            },
          ],
        },
      } as any;

      const prevMemory = snapshotMemoryService.createSnapshotMemory(
        'snap-prev',
        'dom-migrating',
        domain,
        prevSnapshot,
      );

      const currMemory = snapshotMemoryService.createSnapshotMemory(
        'snap-curr',
        'dom-migrating',
        domain,
        currSnapshot,
      );

      expect(prevMemory.fingerprints.topologyFingerprint).toBeDefined();
      expect(currMemory.fingerprints.topologyFingerprint).toBeDefined();

      const diffs = changeAnalyzer.analyzeDifferences(
        prevSnapshot,
        currSnapshot,
      );
      const vercelDiff = diffs.find((d) => d.technologyId === 'tech-vercel');

      expect(vercelDiff).toBeDefined();
      expect(vercelDiff?.classification).toBe(
        TechnologyChangeClassification.TECHNOLOGY_ADDED,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Domain Overview Mapper & Neutral Finding Integrity (TECH-007 / TECH-008)
  // ---------------------------------------------------------------------------
  describe('6. Domain Overview Mapper & Neutral Finding Integrity (TECH-008)', () => {
    it('maps Vercel correctly into DomainOverviewResponseDto (T30-11)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: { a: ['76.76.21.21'], cname: ['cname.vercel-dns.com'], ns: [] },
        http: {
          reachable: true,
          headers: {
            server: 'Vercel',
            'x-vercel-id': 'iad1::5q8v7-1724912345678-abcdef',
          },
        },
        technology: {
          technologies: [
            {
              id: 'tech-vercel',
              name: 'Vercel',
              category: 'Cloud / Infrastructure',
              confidence: 0.99,
              confidenceLevel: 'HIGH',
              role: 'Edge Platform / Frontend Serverless Ingress',
              evidence: [],
            },
          ],
          architectureBrief: {
            summary: 'Endpoint is served by Vercel Edge Platform.',
            confidence: 'HIGH',
            confidenceScore: 0.98,
            hops: [],
            layers: [
              {
                layer: 'PLATFORM',
                state: 'OBSERVED',
                confidenceLevel: 'HIGH',
                technologies: [
                  {
                    id: 'tech-vercel',
                    name: 'Vercel',
                    category: 'Cloud / Infrastructure',
                    confidence: 0.99,
                    confidenceLevel: 'HIGH',
                    role: 'Edge Platform / Frontend Serverless Ingress',
                  },
                ],
              },
            ],
            keyTechnologies: [
              {
                id: 'tech-vercel',
                name: 'Vercel',
                category: 'Cloud / Infrastructure',
                role: 'Edge Platform / Frontend Serverless Ingress',
              },
            ],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
          },
        },
      } as any;

      const domainOverview = InfrastructureOverviewMapper.fromSnapshot({
        id: 'snap-vercel-1',
        domainId: 'dom-vercel-1',
        domainName: 'vercel.example.com',
        domain: {
          id: 'dom-vercel-1',
          domainName: 'vercel.example.com',
          status: 'COMPLETED',
        },
        payload: snapshot,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      expect(domainOverview.technologyArchitecture).toBeDefined();

      const platformLayer = domainOverview.technologyArchitecture?.layers.find(
        (l) => l.layer === 'PLATFORM',
      );
      expect(platformLayer).toBeDefined();
      expect(platformLayer?.technologies.some((t) => t.name === 'Vercel')).toBe(
        true,
      );
    });
  });
});
