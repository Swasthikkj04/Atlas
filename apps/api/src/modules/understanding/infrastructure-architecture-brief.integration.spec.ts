import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';

describe('TECH-004: Infrastructure Architecture Brief & Synthesis Integration', () => {
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

  describe('1. Full Pipeline Architecture Synthesis for Modern Web Stacks', () => {
    it('synthesizes Architecture Brief for Cloudflare + NGINX + Next.js + Sentry + Stripe stack', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.21.15.20'],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          cname: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://saas-unicorn.io',
          finalUrl: 'https://saas-unicorn.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'nginx/1.24.0',
            'cf-ray': '89a123bc-iad',
            'x-powered-by': 'Next.js',
            'sentry-trace': 'trace-abcdef1234567890-1',
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

      const result = await techDiscovery.discover('saas-unicorn.io', snapshot);

      expect(result.architectureBrief).toBeDefined();
      const brief = result.architectureBrief;

      // 1. Executive Summary
      expect(brief.summary).toContain('Cloudflare as an edge layer');
      expect(brief.summary).toContain('NGINX');
      expect(brief.summary).toContain('Next.js');
      expect(brief.summary).toContain('Sentry');
      expect(brief.summary).toContain('Stripe');

      // 2. Architecture Path: Public Endpoint -> Cloudflare -> NGINX -> Next.js
      expect(brief.architecturePath.length).toBeGreaterThanOrEqual(4);
      expect(brief.architecturePath[0].technologyId).toBe('public-endpoint');
      expect(brief.architecturePath[1].technologyName).toBe('Cloudflare');
      expect(brief.architecturePath[2].technologyName).toBe('NGINX');
      expect(brief.architecturePath[3].technologyName).toBe('Next.js');

      // 3. Integrations Segregation
      expect(brief.integrations.map((i) => i.name)).toContain('Sentry');
      expect(brief.integrations.map((i) => i.name)).toContain('Stripe');

      // 4. Layers Breakdown
      const edgeLayer = brief.layers.find(
        (l) => l.layer === TopologyLayer.EDGE,
      );
      expect(edgeLayer.state).toBe('OBSERVED');
      expect(edgeLayer.technologies[0].name).toBe('Cloudflare');

      const appLayer = brief.layers.find(
        (l) => l.layer === TopologyLayer.APPLICATION,
      );
      expect(appLayer.state).toBe('OBSERVED');
      expect(appLayer.technologies[0].name).toBe('Next.js');

      // 5. Confidence Synthesis
      expect(brief.confidence.overallLevel).toBe('HIGH');
      expect(brief.confidence.overallScore).toBeGreaterThanOrEqual(0.85);

      // 6. Known Unknowns (First-class trust)
      const originUnknown = brief.knownUnknowns.find(
        (u) => u.dimension === 'Origin Cloud Provider',
      );
      expect(originUnknown).toBeDefined();
      expect(originUnknown?.status).toBe('MASKED');
      expect(originUnknown?.explanation).toContain('masked behind Cloudflare');

      // 7. Claim Boundaries
      const vercelBoundary = brief.claimBoundaries.find((b) =>
        b.boundary.includes('Vercel'),
      );
      expect(vercelBoundary).toBeDefined();
    });

    it('synthesizes Architecture Brief for CloudFront + Apache + Django + Docker stack', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['13.249.50.60'],
          cname: ['d54321.cloudfront.net'],
          ns: ['ns1.awsdns-02.org'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://enterprise-django.org',
          finalUrl: 'https://enterprise-django.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 40,
          headers: {
            server: 'Apache/2.4.52',
            'x-amz-cf-id': 'cf-trace-777==',
            via: '1.1 cloudfront.net',
            'x-docker-registry-version': '2.0',
          },
          cookies: {
            csrftoken: 'django-csrf-token-12345',
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
        'enterprise-django.org',
        snapshot,
      );

      expect(result.architectureBrief).toBeDefined();
      const brief = result.architectureBrief;

      expect(brief.summary).toContain('AWS CloudFront');
      expect(brief.summary).toContain('Apache');
      expect(brief.summary).toContain('Django');
      expect(brief.summary).toContain('Docker');

      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'AWS CloudFront',
      );
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'Apache HTTP Server',
      );
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'Django',
      );
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'Docker',
      );
    });

    it('synthesizes Architecture Brief for Cloudflare + Shopify + Stripe stack', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.21.20.30'],
          cname: ['boutique.myshopify.com'],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://fashion-boutique.com',
          finalUrl: 'https://fashion-boutique.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 45,
          headers: {
            server: 'cloudflare',
            'cf-ray': '89a123-iad',
            'x-shopid': '55443322',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        htmlBody: '<script src="https://js.stripe.com/v3"></script>',
      };

      const result = await techDiscovery.discover(
        'fashion-boutique.com',
        snapshot,
      );

      expect(result.architectureBrief).toBeDefined();
      const brief = result.architectureBrief;

      expect(brief.summary).toContain('Cloudflare');
      expect(brief.summary).toContain('Shopify');
      expect(brief.summary).toContain('Stripe');

      const platformLayer = brief.layers.find(
        (l) => l.layer === TopologyLayer.PLATFORM,
      );
      expect(platformLayer.state).toBe('OBSERVED');
      expect(platformLayer.technologies[0].name).toBe('Shopify');
    });
  });

  describe('2. Anti-Overreach & Uncertainty Integrity', () => {
    it('strictly avoids asserting EC2 or AWS origin hosting when only CloudFront is observed', async () => {
      const cloudfrontOnly: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://cdn-fronted.com',
          finalUrl: 'https://cdn-fronted.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'x-amz-cf-id': 'cf-only-123',
            via: '1.1 cloudfront.net',
            server: 'custom-web',
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
        'cdn-fronted.com',
        cloudfrontOnly,
      );
      const brief = result.architectureBrief;

      // Ensure summary never says EC2
      expect(brief.summary.toLowerCase()).not.toContain('ec2');
      expect(brief.summary.toLowerCase()).not.toContain('elastic compute');

      // Ensure path never contains EC2
      const ec2Path = brief.architecturePath.find((p) =>
        p.technologyName.toLowerCase().includes('ec2'),
      );
      expect(ec2Path).toBeUndefined();

      // Ensure claim boundaries include CloudFront origin caveat
      const cfBoundary = brief.claimBoundaries.find((b) =>
        b.boundary.includes(
          'CloudFront edge delivery does not prove origin hosting on AWS EC2',
        ),
      );
      expect(cfBoundary).toBeDefined();
    });

    it('strictly avoids asserting Vercel hosting when only Next.js framework is observed', async () => {
      const nextjsOnly: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://self-hosted-node.io',
          finalUrl: 'https://self-hosted-node.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 35,
          headers: {
            server: 'nginx/1.22.0',
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

      const result = await techDiscovery.discover(
        'self-hosted-node.io',
        nextjsOnly,
      );
      const brief = result.architectureBrief;

      expect(brief.summary.toLowerCase()).not.toContain('vercel');
      expect(
        brief.architecturePath.find((p) =>
          p.technologyName.toLowerCase().includes('vercel'),
        ),
      ).toBeUndefined();

      const vercelBoundary = brief.claimBoundaries.find((b) =>
        b.boundary.includes(
          'Next.js framework usage does not prove hosting on Vercel',
        ),
      );
      expect(vercelBoundary).toBeDefined();
    });
  });
});
