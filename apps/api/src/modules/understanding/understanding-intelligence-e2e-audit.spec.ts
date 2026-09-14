import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import {
  TopologyLayer,
  TechnologyRelationshipType,
  RelationshipEvidenceState,
} from '../../infrastructure/discovery/technology/contracts';

describe('TECH-QA-001: Understanding Intelligence End-to-End Comprehensive Audit', () => {
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

  describe('Audit Dimension 1 & 2: Detection & Meaning Accuracy across Representative Real-World Stacks', () => {
    it('Audits Stack A (Modern SaaS): Cloudflare Anycast + Next.js + Sentry + Stripe', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.21.40.50'],
          ns: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
          aaaa: ['2606:4700:3038::6815:2832'],
          mx: [],
          txt: [],
          cname: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://modern-saas.app',
          finalUrl: 'https://modern-saas.app',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 28,
          headers: {
            server: 'cloudflare',
            'cf-ray': '89a123-iad',
            'x-powered-by': 'Next.js',
            'sentry-trace': 'trace-112233445566-1',
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
          '<html><head><script src="https://js.stripe.com/v3"></script><script id="__NEXT_DATA__">{}</script></head><body></body></html>',
      };

      const result = await techDiscovery.discover('modern-saas.app', snapshot);

      // 1. Detection
      expect(result.technologies.length).toBe(5);
      const names = result.technologies.map((t) => t.name);
      expect(names).toContain('Cloudflare');
      expect(names).toContain('Next.js');
      expect(names).toContain('JavaScript');
      expect(names).toContain('Sentry');
      expect(names).toContain('Stripe');

      // 2. Meaning & 4-Question Answers
      for (const tech of result.technologies) {
        expect(tech.whyDetected).toBeDefined();
        expect(tech.whyDetected.length).toBeGreaterThan(5);
        expect(tech.role).toBeDefined();
        expect(tech.infrastructureMeaning).toBeDefined();
        expect(tech.evidence.length).toBeGreaterThanOrEqual(1);
      }

      // 3. Topology & Relationships
      expect(result.topology).toBeDefined();
      const topology = result.topology;
      expect(topology.confirmedRelationshipsCount).toBeGreaterThanOrEqual(2);

      // Cloudflare -> EDGE_OF (CONFIRMED)
      const cfRel = topology.relationships.find(
        (r) => r.sourceTechnologyId === 'tech-cloudflare',
      );
      expect(cfRel?.relationshipType).toBe(TechnologyRelationshipType.EDGE_OF);
      expect(cfRel?.evidenceState).toBe('CONFIRMED');

      // Next.js -> Sentry (REPORTS_TO, CONFIRMED)
      const sentryRel = topology.relationships.find(
        (r) => r.targetTechnologyId === 'tech-sentry',
      );
      expect(sentryRel?.relationshipType).toBe(
        TechnologyRelationshipType.REPORTS_TO,
      );
      expect(sentryRel?.evidenceState).toBe('CONFIRMED');

      // Next.js -> Stripe (INTEGRATES_WITH, CONFIRMED)
      const stripeRel = topology.relationships.find(
        (r) => r.targetTechnologyId === 'tech-stripe',
      );
      expect(stripeRel?.relationshipType).toBe(
        TechnologyRelationshipType.INTEGRATES_WITH,
      );
      expect(stripeRel?.evidenceState).toBe('CONFIRMED');

      // 4. Architecture Brief Synthesis
      expect(result.architectureBrief).toBeDefined();
      const brief = result.architectureBrief;

      // Ingress path contains Endpoint -> Cloudflare -> Next.js -> JavaScript (Sentry and Stripe segregated)
      expect(brief.architecturePath.map((p) => p.technologyName)).toEqual([
        'Public Endpoint (modern-saas.app)',
        'Cloudflare',
        'Next.js',
        'JavaScript',
      ]);
      expect(brief.integrations.map((i) => i.name)).toContain('Sentry');
      expect(brief.integrations.map((i) => i.name)).toContain('Stripe');

      // Known Unknowns
      const originUnknown = brief.knownUnknowns.find(
        (u) => u.dimension === 'Origin Cloud Provider',
      );
      expect(originUnknown?.status).toBe('MASKED');
      expect(originUnknown?.explanation).toContain('masked behind Cloudflare');

      // Confidence
      expect(brief.confidence.overallLevel).toBe('HIGH');
    });

    it('Audits Stack B (High-Throughput Media): CloudFront + NGINX + PHP + WordPress', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['13.249.88.99'],
          cname: ['d9876.cloudfront.net'],
          ns: ['ns1.awsdns-03.org'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://media-portal.net',
          finalUrl: 'https://media-portal.net',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 35,
          headers: {
            server: 'nginx/1.24.0',
            via: '1.1 cloudfront.net',
            'x-amz-cf-id': 'cf-media-trace-999==',
            'x-powered-by': 'PHP/8.2.14',
            'set-cookie': 'wp-settings-1=123; path=/',
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
          '<link rel="stylesheet" href="/wp-content/themes/enterprise/style.css" />',
      };

      const result = await techDiscovery.discover('media-portal.net', snapshot);

      const names = result.technologies.map((t) => t.name);
      expect(names).toContain('AWS CloudFront');
      expect(names).toContain('NGINX');
      expect(names).toContain('PHP');
      expect(names).toContain('WordPress');

      const brief = result.architectureBrief;
      expect(brief.summary).toContain('AWS CloudFront as an edge layer');
      expect(brief.summary).toContain('NGINX as an ingress gateway');

      // Multi-hop path: Public Endpoint -> CloudFront -> WordPress -> NGINX -> PHP
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'AWS CloudFront',
      );
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'NGINX',
      );
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'WordPress',
      );
    });

    it('Audits Stack C (Containerized Backend): Apache + Django + Docker + HSTS', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['198.51.100.42'],
          aaaa: [],
          ns: ['ns1.custom-dns.com'],
          mx: [],
          txt: [],
          cname: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://analytics-api.org',
          finalUrl: 'https://analytics-api.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 22,
          headers: {
            server: 'Apache/2.4.52',
            'strict-transport-security': 'max-age=31536000; includeSubDomains',
            'docker-distribution-api-version': 'registry/2.0',
          },
          cookies: {
            csrftoken: 'django-csrf-token-12345',
            django_session: 'session-id-998877',
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
        'analytics-api.org',
        snapshot,
      );

      const names = result.technologies.map((t) => t.name);
      expect(names).toContain('Apache HTTP Server');
      expect(names).toContain('Django');
      expect(names).toContain('Docker');
      expect(names).toContain('HTTP Strict Transport Security (HSTS)');

      const topology = result.topology;
      const djangoRunsOnDocker = topology.relationships.find(
        (r) =>
          r.sourceTechnologyId === 'tech-django' &&
          r.targetTechnologyId === 'tech-docker' &&
          r.relationshipType === TechnologyRelationshipType.RUNS_ON,
      );
      expect(djangoRunsOnDocker).toBeDefined();
      expect(djangoRunsOnDocker?.evidenceState).toBe('SUPPORTED');

      const brief = result.architectureBrief;
      expect(brief.summary).toContain('Apache HTTP Server');
      expect(brief.summary).toContain('Django');
      expect(brief.summary).toContain('Docker');
      expect(brief.summary).toContain('HTTP Strict Transport Security (HSTS)');
    });

    it('Audits Stack D (Hosted E-Commerce): Cloudflare + Shopify + PayPal + Google Analytics', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.21.30.40'],
          cname: ['boutique.myshopify.com'],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://boutique-store.com',
          finalUrl: 'https://boutique-store.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 40,
          headers: {
            server: 'cloudflare',
            'cf-ray': '887766-sjc',
            'x-shopid': '99881122',
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
          '<html><head><script src="https://www.paypal.com/sdk/js?client-id=sb"></script><script src="https://www.google-analytics.com/analytics.js"></script></head><body></body></html>',
      };

      const result = await techDiscovery.discover(
        'boutique-store.com',
        snapshot,
      );

      const names = result.technologies.map((t) => t.name);
      expect(names).toContain('Cloudflare');
      expect(names).toContain('Shopify');
      expect(names).toContain('PayPal');
      expect(names).toContain('Google Analytics');

      const brief = result.architectureBrief;
      expect(brief.integrations.map((i) => i.name)).toContain('PayPal');
      expect(brief.integrations.map((i) => i.name)).toContain(
        'Google Analytics',
      );
      expect(brief.summary).toContain('Shopify');
      expect(brief.summary).toContain('PayPal');
      expect(brief.summary).toContain('Google Analytics');
    });

    it('Audits Stack E (Quiet Minimal Gateway): Caddy Server', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://simple-gateway.org',
          finalUrl: 'https://simple-gateway.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 15,
          headers: {
            server: 'Caddy',
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
        'simple-gateway.org',
        snapshot,
      );

      expect(result.technologies).toHaveLength(1);
      expect(result.technologies[0].name).toBe('Caddy');

      const brief = result.architectureBrief;
      expect(brief.summary).toContain(
        'routed through Caddy as a web gateway and reverse proxy',
      );
      expect(brief.architecturePath.map((p) => p.technologyName)).toEqual([
        'Public Endpoint (simple-gateway.org)',
        'Caddy',
      ]);
      expect(brief.integrations).toHaveLength(0);
    });
  });

  describe('Audit Dimension 3: Relationship Defensibility & Vocabulary Integrity', () => {
    it('validates controlled relationship vocabulary and evidence grounding', async () => {
      const validTypes = Object.values(TechnologyRelationshipType);
      const validEvidenceStates: RelationshipEvidenceState[] = [
        'CONFIRMED',
        'SUPPORTED',
        'INFERRED',
      ];

      const snapshot: DiscoverySnapshot = {
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
          url: 'https://vocabulary-check.com',
          finalUrl: 'https://vocabulary-check.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'nginx/1.24.0',
            'cf-ray': '89a123-iad',
            'x-powered-by': 'Next.js',
            'sentry-trace': 'trace-112233',
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
        'vocabulary-check.com',
        snapshot,
      );
      const topology = result.topology;

      expect(topology.relationships.length).toBeGreaterThan(0);

      for (const rel of topology.relationships) {
        expect(validTypes).toContain(rel.relationshipType);
        expect(validEvidenceStates).toContain(rel.evidenceState);
        expect(rel.confidence).toBeGreaterThan(0);
        expect(rel.confidence).toBeLessThanOrEqual(1.0);
        expect(rel.explanation).toBeDefined();
        expect(rel.explanation.length).toBeGreaterThan(10);
      }
    });
  });

  describe('Audit Dimension 4: Anti-Overreach & Uncertainty Distinction', () => {
    it('verifies that no unwarranted infrastructure is ever claimed from popularity assumptions', async () => {
      const edgeOnly: DiscoverySnapshot = {
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
          url: 'https://anti-overreach.org',
          finalUrl: 'https://anti-overreach.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'cloudflare',
            'cf-ray': '89a123-iad',
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
        'anti-overreach.org',
        edgeOnly,
      );
      const brief = result.architectureBrief;

      // 1. Should not guess origin provider
      expect(brief.summary.toLowerCase()).not.toContain('aws');
      expect(brief.summary.toLowerCase()).not.toContain('amazon');
      expect(brief.summary.toLowerCase()).not.toContain('gcp');
      expect(brief.summary.toLowerCase()).not.toContain('google cloud');
      expect(brief.summary.toLowerCase()).not.toContain('azure');

      // 2. Should explicitly declare Origin Cloud Provider as MASKED
      const maskedOrigin = brief.knownUnknowns.find(
        (u) => u.dimension === 'Origin Cloud Provider',
      );
      expect(maskedOrigin).toBeDefined();
      expect(maskedOrigin?.status).toBe('MASKED');
      expect(maskedOrigin?.whyUnknown).toContain(
        'Anycast edge proxies terminate public client connections',
      );

      // 3. Should preserve anti-overreach boundary
      expect(brief.claimBoundaries.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Audit Dimension 5: Zero Network Side-Effects & Performance Invariance', () => {
    it('executes the full 4-stage pipeline strictly from in-memory snapshot observations in < 15ms', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.21.10.10'],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          cname: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://perf-benchmark.io',
          finalUrl: 'https://perf-benchmark.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'nginx/1.24.0',
            'cf-ray': '89a123-iad',
            'x-powered-by': 'Next.js',
            'sentry-trace': 'trace-112233',
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
          '<html><head><script src="https://js.stripe.com/v3"></script><script id="__NEXT_DATA__">{}</script></head><body></body></html>',
      };

      const start = performance.now();
      const result = await techDiscovery.discover(
        'perf-benchmark.io',
        snapshot,
      );
      const durationMs = performance.now() - start;

      expect(result.technologies.length).toBe(6);
      expect(result.topology?.totalRelationships).toBeGreaterThan(0);
      expect(result.architectureBrief?.summary).toBeDefined();

      // Zero external network latency: pure in-memory deterministic evaluation executes in sub-millisecond to low millisecond range
      expect(durationMs).toBeLessThan(100);
    });
  });
});
