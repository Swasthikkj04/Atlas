import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TechnologyCategory } from '../../infrastructure/discovery/technology/contracts';

describe('TECH-002: Technology Infrastructure Meaning Engine Integration', () => {
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

  describe('1. Evidence-Backed 4-Question Infrastructure Explanations', () => {
    it('generates complete 4-question explanations for CloudFront + Next.js + Sentry stack', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['13.249.100.10'],
          cname: ['d12345.cloudfront.net'],
          ns: ['ns1.awsdns-01.org'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://saas-app.io',
          finalUrl: 'https://saas-app.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 45,
          headers: {
            'x-amz-cf-id': 'cf-trace-999==',
            via: '1.1 cloudfront.net',
            'x-powered-by': 'Next.js',
            'sentry-trace': '1234567890abcdef-1234567890abcdef-1',
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
          responseTimeMs: 25,
          authorized: true,
          certificate: {
            subject: 'CN=saas-app.io',
            issuer: 'Amazon',
            validFrom: '2026-01-01',
            validTo: '2027-01-01',
            serialNumber: '556677',
            subjectAltName: 'DNS:saas-app.io',
          },
          error: null,
        },
      };

      const result = await techDiscovery.discover('saas-app.io', snapshot);

      expect(result.technologies.length).toBeGreaterThanOrEqual(3);

      // 1. Validate AWS CloudFront Meaning
      const cloudfront = result.technologies.find(
        (t) => t.id === 'tech-cloudfront',
      );
      expect(cloudfront).toBeDefined();
      expect(cloudfront.name).toBe('AWS CloudFront');
      expect(cloudfront.category).toBe(TechnologyCategory.CDN_EDGE);
      // Why detected
      expect(cloudfront.whyDetected).toContain('x-amz-cf-id');
      // Role
      expect(cloudfront.role).toContain('Edge / CDN');
      // Meaning
      expect(cloudfront.infrastructureMeaning).toContain("AWS's edge network");
      // Claim boundary
      expect(cloudfront.whatThisDoesNotProve).toContain(
        'CloudFront edge delivery does not prove origin hosting on AWS EC2',
      );

      // 2. Validate Next.js Meaning
      const nextjs = result.technologies.find((t) => t.id === 'tech-nextjs');
      expect(nextjs).toBeDefined();
      expect(nextjs.name).toBe('Next.js');
      expect(nextjs.category).toBe(TechnologyCategory.FRAMEWORK);
      expect(nextjs.whyDetected).toContain('x-powered-by');
      expect(nextjs.role).toContain('React-based application framework');
      expect(nextjs.infrastructureMeaning).toContain('Next.js framework');
      expect(nextjs.whatThisDoesNotProve).toContain(
        'Next.js framework usage does not prove hosting on Vercel',
      );

      // 3. Validate Sentry Meaning
      const sentry = result.technologies.find((t) => t.id === 'tech-sentry');
      expect(sentry).toBeDefined();
      expect(sentry.name).toBe('Sentry');
      expect(sentry.category).toBe(TechnologyCategory.ANALYTICS);
      expect(sentry.role).toContain(
        'Error monitoring and performance telemetry',
      );
      expect(sentry.infrastructureMeaning).toContain(
        'error reports and distributed trace telemetry',
      );
    });

    it('generates complete explanations for E-Commerce stack (Cloudflare + Shopify + Stripe)', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.21.10.20'],
          cname: ['shops.myshopify.com'],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://trendy-store.com',
          finalUrl: 'https://trendy-store.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 60,
          headers: {
            server: 'cloudflare',
            'cf-ray': '89a123-iad',
            'x-shopid': '88776655',
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
          '<html><head><script src="https://js.stripe.com/v3"></script><script src="https://cdn.shopify.com/s/files/1/00/theme.js"></script></head><body></body></html>',
      };

      const result = await techDiscovery.discover('trendy-store.com', snapshot);

      const shopify = result.technologies.find((t) => t.id === 'tech-shopify');
      expect(shopify).toBeDefined();
      expect(shopify.category).toBe(TechnologyCategory.CMS);
      expect(shopify.role).toContain('E-commerce storefront');
      expect(shopify.whyDetected).toContain('x-shopid');

      const stripe = result.technologies.find((t) => t.id === 'tech-stripe');
      expect(stripe).toBeDefined();
      expect(stripe.category).toBe(TechnologyCategory.PAYMENTS);
      expect(stripe.role).toContain('Payment processing gateway');
      expect(stripe.whyDetected).toContain('js.stripe.com');
      expect(stripe.whatThisDoesNotProve).toContain(
        'backend payment gateway architecture',
      );
    });
  });

  describe('2. Absence of Overreach & Evidence Truth Invariant', () => {
    it('never asserts origin compute infrastructure when only edge CDN is detected', async () => {
      const edgeOnlySnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://edge-only.com',
          finalUrl: 'https://edge-only.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'cloudflare',
            'cf-ray': 'cf-edge-001',
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
        'edge-only.com',
        edgeOnlySnapshot,
      );
      const cf = result.technologies.find((t) => t.id === 'tech-cloudflare');

      expect(cf).toBeDefined();
      // Ensure the meaning engine clarifies origin ambiguity
      expect(cf.whatThisDoesNotProve).toContain(
        'underlying origin server hosting provider',
      );
      // Ensure AWS or GCP is NOT falsely claimed
      expect(
        result.technologies.find((t) => t.id === 'tech-aws'),
      ).toBeUndefined();
      expect(
        result.technologies.find((t) => t.id === 'tech-gcp'),
      ).toBeUndefined();
    });
  });
});
