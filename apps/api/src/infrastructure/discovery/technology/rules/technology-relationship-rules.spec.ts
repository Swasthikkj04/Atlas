import { createTechnologyDetectionContext } from '../context/technology-detection-context.impl';
import {
  TopologyNode,
  TopologyLayer,
  TechnologyCategory,
  TechnologyRelationshipType,
} from '../contracts';
import { EdgeToEndpointRule } from './edge/edge-to-endpoint.rule';
import { EdgeToGatewayRule } from './edge/edge-to-gateway.rule';
import { GatewayToApplicationRule } from './gateway/gateway-to-application.rule';
import { ApplicationToRuntimeRule } from './application/application-to-runtime.rule';
import { ApplicationToIntegrationRule } from './application/application-to-integration.rule';
import { PlatformHostingRule } from './hosting/platform-hosting.rule';
import { SecurityEnforcementRule } from './security/security-enforcement.rule';

describe('Technology Relationship Rules Unit Tests (TECH-003)', () => {
  const context = createTechnologyDetectionContext({
    domainName: 'test-stack.io',
  });

  const createNode = (
    id: string,
    name: string,
    layer: TopologyLayer,
    category: TechnologyCategory | string = TechnologyCategory.WEB_SERVER,
  ): TopologyNode => ({
    id,
    technologyId: id,
    name,
    category,
    layer,
    role: `${name} Role`,
    infrastructureMeaning: `${name} Meaning`,
    whyDetected: `Observed ${name} signals`,
    confidence: 0.98,
    confidenceLevel: 'HIGH',
    evidenceCount: 1,
    whatThisDoesNotProve: `Does not prove origin compute for ${name}`,
  });

  describe('EdgeToEndpointRule', () => {
    const rule = new EdgeToEndpointRule();

    it('maps edge nodes to public endpoint', () => {
      const edgeNode = createNode(
        'tech-cloudflare',
        'Cloudflare',
        TopologyLayer.EDGE,
        TechnologyCategory.CDN_EDGE,
      );

      const rels = rule.evaluate([edgeNode], context);
      expect(rels).toHaveLength(1);
      expect(rels[0].relationshipType).toBe(TechnologyRelationshipType.EDGE_OF);
      expect(rels[0].sourceTechnologyId).toBe('tech-cloudflare');
      expect(rels[0].targetTechnologyId).toBe('public-endpoint');
      expect(rels[0].evidenceState).toBe('CONFIRMED');
    });

    it('returns empty array when no edge nodes exist', () => {
      const appNode = createNode(
        'tech-nextjs',
        'Next.js',
        TopologyLayer.APPLICATION,
      );
      expect(rule.evaluate([appNode], context)).toHaveLength(0);
    });
  });

  describe('EdgeToGatewayRule', () => {
    const rule = new EdgeToGatewayRule();

    it('maps edge forward to gateway when both are present', () => {
      const edge = createNode('tech-cf', 'Cloudflare', TopologyLayer.EDGE);
      const gateway = createNode('tech-nginx', 'NGINX', TopologyLayer.GATEWAY);

      const rels = rule.evaluate([edge, gateway], context);
      expect(rels).toHaveLength(1);
      expect(rels[0].relationshipType).toBe(
        TechnologyRelationshipType.FORWARDS_TO,
      );
      expect(rels[0].sourceTechnologyId).toBe('tech-cf');
      expect(rels[0].targetTechnologyId).toBe('tech-nginx');
      expect(rels[0].evidenceState).toBe('SUPPORTED');
    });
  });

  describe('GatewayToApplicationRule', () => {
    const rule = new GatewayToApplicationRule();

    it('maps gateway reverse proxy to application framework', () => {
      const gateway = createNode('tech-nginx', 'NGINX', TopologyLayer.GATEWAY);
      const app = createNode(
        'tech-nextjs',
        'Next.js',
        TopologyLayer.APPLICATION,
      );

      const rels = rule.evaluate([gateway, app], context);
      expect(rels).toHaveLength(1);
      expect(rels[0].relationshipType).toBe(
        TechnologyRelationshipType.PROXIES_TO,
      );
      expect(rels[0].sourceTechnologyId).toBe('tech-nginx');
      expect(rels[0].targetTechnologyId).toBe('tech-nextjs');
      expect(rels[0].explanation).toContain('terminating HTTP requests');
    });
  });

  describe('ApplicationToRuntimeRule', () => {
    const rule = new ApplicationToRuntimeRule();

    it('maps application framework to container runtime', () => {
      const app = createNode(
        'tech-nextjs',
        'Next.js',
        TopologyLayer.APPLICATION,
      );
      const runtime = createNode(
        'tech-docker',
        'Docker',
        TopologyLayer.RUNTIME,
      );

      const rels = rule.evaluate([app, runtime], context);
      expect(rels).toHaveLength(1);
      expect(rels[0].relationshipType).toBe(TechnologyRelationshipType.RUNS_ON);
      expect(rels[0].sourceTechnologyId).toBe('tech-nextjs');
      expect(rels[0].targetTechnologyId).toBe('tech-docker');
      expect(rels[0].claimBoundary).toContain('cloud provider');
    });
  });

  describe('ApplicationToIntegrationRule', () => {
    const rule = new ApplicationToIntegrationRule();

    it('maps application to analytics observability as REPORTS_TO and payments as INTEGRATES_WITH', () => {
      const app = createNode(
        'tech-nextjs',
        'Next.js',
        TopologyLayer.APPLICATION,
      );
      const sentry = createNode(
        'tech-sentry',
        'Sentry',
        TopologyLayer.INTEGRATION,
        TechnologyCategory.ANALYTICS,
      );
      const stripe = createNode(
        'tech-stripe',
        'Stripe',
        TopologyLayer.INTEGRATION,
        TechnologyCategory.PAYMENTS,
      );

      const rels = rule.evaluate([app, sentry, stripe], context);
      expect(rels).toHaveLength(2);

      const sentryRel = rels.find(
        (r) => r.targetTechnologyId === 'tech-sentry',
      );
      expect(sentryRel.relationshipType).toBe(
        TechnologyRelationshipType.REPORTS_TO,
      );
      expect(sentryRel.sourceTechnologyId).toBe('tech-nextjs');
      expect(sentryRel.evidenceState).toBe('CONFIRMED');

      const stripeRel = rels.find(
        (r) => r.targetTechnologyId === 'tech-stripe',
      );
      expect(stripeRel.relationshipType).toBe(
        TechnologyRelationshipType.INTEGRATES_WITH,
      );
      expect(stripeRel.evidenceState).toBe('CONFIRMED');
    });
  });

  describe('PlatformHostingRule', () => {
    const rule = new PlatformHostingRule();

    it('maps CMS platform to public endpoint as SERVES', () => {
      const platform = createNode(
        'tech-shopify',
        'Shopify',
        TopologyLayer.PLATFORM,
        TechnologyCategory.CMS,
      );

      const rels = rule.evaluate([platform], context);
      expect(rels).toHaveLength(1);
      expect(rels[0].relationshipType).toBe(TechnologyRelationshipType.SERVES);
      expect(rels[0].sourceTechnologyId).toBe('tech-shopify');
      expect(rels[0].targetTechnologyId).toBe('public-endpoint');
    });
  });

  describe('SecurityEnforcementRule', () => {
    const rule = new SecurityEnforcementRule();

    it('maps HSTS security policy to public endpoint as USES', () => {
      const sec = createNode(
        'tech-hsts',
        'HTTP Strict Transport Security (HSTS)',
        TopologyLayer.SECURITY,
        TechnologyCategory.SECURITY,
      );

      const rels = rule.evaluate([sec], context);
      expect(rels).toHaveLength(1);
      expect(rels[0].relationshipType).toBe(TechnologyRelationshipType.USES);
      expect(rels[0].sourceTechnologyId).toBe('tech-hsts');
      expect(rels[0].targetTechnologyId).toBe('public-endpoint');
    });
  });
});
