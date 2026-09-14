import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import {
  TechnologyRelationshipType,
  TopologyLayer,
} from '../../infrastructure/discovery/technology/contracts';

describe('TECH-003: Infrastructure Relationship Mapping & Topology Model Integration', () => {
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

  describe('1. Realistic Multi-Tier Stack Topology Construction', () => {
    it('constructs topology for CloudFront + NGINX + Next.js stack', async () => {
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
          url: 'https://gateway-app.io',
          finalUrl: 'https://gateway-app.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 50,
          headers: {
            server: 'nginx/1.24.0',
            'x-amz-cf-id': 'cf-trace-888==',
            via: '1.1 cloudfront.net',
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

      const result = await techDiscovery.discover('gateway-app.io', snapshot);

      expect(result.topology).toBeDefined();
      const topology = result.topology;

      expect(topology.totalNodes).toBeGreaterThanOrEqual(3);

      // Verify Nodes & Layers
      const cloudfrontNode = topology.nodes.find(
        (n) => n.id === 'tech-cloudfront',
      );
      const nginxNode = topology.nodes.find((n) => n.id === 'tech-nginx');
      const nextjsNode = topology.nodes.find((n) => n.id === 'tech-nextjs');

      expect(cloudfrontNode?.layer).toBe(TopologyLayer.EDGE);
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);
      expect(nextjsNode?.layer).toBe(TopologyLayer.APPLICATION);

      // Verify Relationships
      // 1. CloudFront EDGE_OF endpoint
      const edgeRel = topology.relationships.find(
        (r) =>
          r.sourceTechnologyId === 'tech-cloudfront' &&
          r.relationshipType === TechnologyRelationshipType.EDGE_OF,
      );
      expect(edgeRel).toBeDefined();
      expect(edgeRel?.evidenceState).toBe('CONFIRMED');

      // 2. CloudFront FORWARDS_TO NGINX
      const fwdRel = topology.relationships.find(
        (r) =>
          r.sourceTechnologyId === 'tech-cloudfront' &&
          r.targetTechnologyId === 'tech-nginx' &&
          r.relationshipType === TechnologyRelationshipType.FORWARDS_TO,
      );
      expect(fwdRel).toBeDefined();
      expect(fwdRel?.evidenceState).toBe('SUPPORTED');

      // 3. NGINX PROXIES_TO Next.js
      const proxyRel = topology.relationships.find(
        (r) =>
          r.sourceTechnologyId === 'tech-nginx' &&
          r.targetTechnologyId === 'tech-nextjs' &&
          r.relationshipType === TechnologyRelationshipType.PROXIES_TO,
      );
      expect(proxyRel).toBeDefined();
      expect(proxyRel?.evidenceState).toBe('SUPPORTED');
    });

    it('constructs topology for Cloudflare + Next.js + Sentry stack', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.21.5.5'],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          cname: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://saas-platform.com',
          finalUrl: 'https://saas-platform.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 35,
          headers: {
            server: 'cloudflare',
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
        'saas-platform.com',
        snapshot,
      );
      expect(result.topology).toBeDefined();
      const topology = result.topology;

      // Sentry REPORTS_TO
      const sentryRel = topology.relationships.find(
        (r) =>
          r.targetTechnologyId === 'tech-sentry' &&
          r.relationshipType === TechnologyRelationshipType.REPORTS_TO,
      );
      expect(sentryRel).toBeDefined();
      expect(sentryRel?.evidenceState).toBe('CONFIRMED');
      expect(sentryRel?.explanation).toContain(
        'exports distributed performance and error telemetry',
      );
    });

    it('constructs topology for Cloudflare + Shopify + Stripe stack', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.21.10.10'],
          cname: ['shops.myshopify.com'],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://retail.store',
          finalUrl: 'https://retail.store',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 40,
          headers: {
            server: 'cloudflare',
            'cf-ray': '89a123-iad',
            'x-shopid': '998877',
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
          '<html><head><script src="https://js.stripe.com/v3"></script></head><body></body></html>',
      };

      const result = await techDiscovery.discover('retail.store', snapshot);
      expect(result.topology).toBeDefined();
      const topology = result.topology;

      // Shopify SERVES
      const shopifyRel = topology.relationships.find(
        (r) =>
          r.sourceTechnologyId === 'tech-shopify' &&
          r.relationshipType === TechnologyRelationshipType.SERVES,
      );
      expect(shopifyRel).toBeDefined();
      expect(shopifyRel?.evidenceState).toBe('CONFIRMED');

      // Stripe INTEGRATES_WITH
      const stripeRel = topology.relationships.find(
        (r) =>
          r.targetTechnologyId === 'tech-stripe' &&
          r.relationshipType === TechnologyRelationshipType.INTEGRATES_WITH,
      );
      expect(stripeRel).toBeDefined();
      expect(stripeRel?.evidenceState).toBe('CONFIRMED');
    });

    it('constructs topology for NGINX + Docker stack', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://containerized.internal',
          finalUrl: 'https://containerized.internal',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            server: 'nginx/1.24.0',
            'docker-distribution-api-version': 'registry/2.0',
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
        'containerized.internal',
        snapshot,
      );
      expect(result.topology).toBeDefined();
      const topology = result.topology;

      const dockerRel = topology.relationships.find(
        (r) =>
          r.sourceTechnologyId === 'tech-nginx' &&
          r.targetTechnologyId === 'tech-docker' &&
          r.relationshipType === TechnologyRelationshipType.RUNS_ON,
      );
      expect(dockerRel).toBeDefined();
      expect(dockerRel?.evidenceState).toBe('SUPPORTED');
    });
  });

  describe('2. Negative Tests: Strict Anti-Overreach & Anti-Invention Invariants', () => {
    it('does NOT infer Next.js -> Vercel when only Next.js is detected on custom host', async () => {
      const selfHostedNextJs: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://self-hosted-next.org',
          finalUrl: 'https://self-hosted-next.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'nginx',
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
        'self-hosted-next.org',
        selfHostedNextJs,
      );
      const topology = result.topology;

      // Must NOT contain Vercel node or relationship
      const vercelNode = topology.nodes.find((n) => n.id === 'tech-vercel');
      expect(vercelNode).toBeUndefined();

      const vercelRel = topology.relationships.find(
        (r) =>
          r.sourceTechnologyId === 'tech-vercel' ||
          r.targetTechnologyId === 'tech-vercel',
      );
      expect(vercelRel).toBeUndefined();
    });

    it('does NOT infer CloudFront -> AWS EC2 without direct EC2 compute telemetry', async () => {
      const customOriginCloudFront: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://custom-origin.com',
          finalUrl: 'https://custom-origin.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 40,
          headers: {
            'x-amz-cf-id': 'cf-edge-trace-1',
            via: '1.1 cloudfront.net',
            server: 'Apache/2.4.52',
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
        'custom-origin.com',
        customOriginCloudFront,
      );
      const topology = result.topology;

      // Must NOT claim AWS EC2 or general AWS host compute
      const ec2Node = topology.nodes.find((n) => n.name.includes('EC2'));
      expect(ec2Node).toBeUndefined();

      // CloudFront claim boundary must warn about origin assumption
      const cloudfrontRel = topology.relationships.find(
        (r) => r.sourceTechnologyId === 'tech-cloudfront',
      );
      expect(cloudfrontRel?.claimBoundary).toContain(
        'CloudFront edge delivery does not prove origin hosting on AWS EC2',
      );
    });

    it('does NOT infer Docker -> AWS/GCP without direct cloud compute evidence', async () => {
      const localDocker: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://on-prem.corp',
          finalUrl: 'https://on-prem.corp',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'docker-distribution-api-version': 'registry/2.0',
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

      const result = await techDiscovery.discover('on-prem.corp', localDocker);
      const topology = result.topology;

      expect(topology.nodes.find((n) => n.id === 'tech-aws')).toBeUndefined();
      expect(topology.nodes.find((n) => n.id === 'tech-gcp')).toBeUndefined();
      expect(topology.nodes.find((n) => n.id === 'tech-azure')).toBeUndefined();
    });

    it('does NOT infer NGINX -> Linux OS without explicit OS banner evidence', async () => {
      const nginxSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://just-nginx.com',
          finalUrl: 'https://just-nginx.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 15,
          headers: {
            server: 'nginx',
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
        'just-nginx.com',
        nginxSnapshot,
      );
      const topology = result.topology;

      expect(
        topology.nodes.find((n) => n.name.toLowerCase().includes('linux')),
      ).toBeUndefined();
    });
  });
});
