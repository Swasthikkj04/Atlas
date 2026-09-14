import { InfrastructureRelationshipEngine } from './infrastructure-relationship.engine';
import { TechnologyRelationshipRegistryService } from '../registry/technology-relationship-registry.service';
import { createTechnologyDetectionContext } from '../context/technology-detection-context.impl';
import {
  DetectedTechnology,
  TechnologyCategory,
  TopologyLayer,
  TechnologyRelationshipType,
} from '../contracts';
import { EdgeToEndpointRule } from '../rules/edge/edge-to-endpoint.rule';
import { EdgeToGatewayRule } from '../rules/edge/edge-to-gateway.rule';
import { GatewayToApplicationRule } from '../rules/gateway/gateway-to-application.rule';
import { ApplicationToIntegrationRule } from '../rules/application/application-to-integration.rule';

describe('InfrastructureRelationshipEngine (TECH-003)', () => {
  let registry: TechnologyRelationshipRegistryService;
  let engine: InfrastructureRelationshipEngine;

  beforeEach(() => {
    registry = new TechnologyRelationshipRegistryService();
    registry.register(new EdgeToEndpointRule());
    registry.register(new EdgeToGatewayRule());
    registry.register(new GatewayToApplicationRule());
    registry.register(new ApplicationToIntegrationRule());

    engine = new InfrastructureRelationshipEngine(registry);
  });

  const createTech = (
    id: string,
    name: string,
    category: TechnologyCategory | string,
    role = 'Role',
  ): DetectedTechnology => ({
    id,
    name,
    category,
    status: 'DETECTED',
    confidence: 0.99,
    confidenceLevel: 'HIGH',
    whyDetected: `Observed ${name} signals`,
    role,
    infrastructureMeaning: `${name} provides ${role}`,
    whatThisDoesNotProve: `Does not prove origin compute for ${name}`,
    evidence: [
      {
        sourceType: 'HTTP',
        source: 'Header',
        indicator: name,
        confidence: 'HIGH',
      },
    ],
    signals: [],
    evidenceCount: 1,
  });

  it('builds a layered topology and correlates multi-tier infrastructure graph', async () => {
    const techStack: DetectedTechnology[] = [
      createTech(
        'tech-cloudflare',
        'Cloudflare',
        TechnologyCategory.CDN_EDGE,
        'Edge / CDN',
      ),
      createTech(
        'tech-nginx',
        'NGINX',
        TechnologyCategory.WEB_SERVER,
        'Reverse Proxy',
      ),
      createTech(
        'tech-nextjs',
        'Next.js',
        TechnologyCategory.FRAMEWORK,
        'Application Framework',
      ),
      createTech(
        'tech-sentry',
        'Sentry',
        TechnologyCategory.ANALYTICS,
        'Error Tracking',
      ),
      createTech(
        'tech-stripe',
        'Stripe',
        TechnologyCategory.PAYMENTS,
        'Payment Gateway',
      ),
    ];

    const context = createTechnologyDetectionContext({
      domainName: 'saas.app',
    });

    const topology = await engine.buildTopology(techStack, context);

    expect(topology.totalNodes).toBe(5);
    expect(topology.nodes).toHaveLength(5);

    // Verify layer assignments
    expect(topology.layers[TopologyLayer.EDGE]).toHaveLength(1);
    expect(topology.layers[TopologyLayer.GATEWAY]).toHaveLength(1);
    expect(topology.layers[TopologyLayer.APPLICATION]).toHaveLength(1);
    expect(topology.layers[TopologyLayer.INTEGRATION]).toHaveLength(2);

    // Verify relationships
    expect(topology.totalRelationships).toBeGreaterThanOrEqual(4);

    // 1. Edge of endpoint
    const edgeRel = topology.relationships.find(
      (r) =>
        r.sourceTechnologyId === 'tech-cloudflare' &&
        r.relationshipType === TechnologyRelationshipType.EDGE_OF,
    );
    expect(edgeRel).toBeDefined();
    expect(edgeRel?.evidenceState).toBe('CONFIRMED');

    // 2. Edge forwards to gateway
    const fwdRel = topology.relationships.find(
      (r) =>
        r.sourceTechnologyId === 'tech-cloudflare' &&
        r.targetTechnologyId === 'tech-nginx',
    );
    expect(fwdRel).toBeDefined();
    expect(fwdRel?.relationshipType).toBe(
      TechnologyRelationshipType.FORWARDS_TO,
    );

    // 3. Gateway proxies to application
    const proxyRel = topology.relationships.find(
      (r) =>
        r.sourceTechnologyId === 'tech-nginx' &&
        r.targetTechnologyId === 'tech-nextjs',
    );
    expect(proxyRel).toBeDefined();
    expect(proxyRel?.relationshipType).toBe(
      TechnologyRelationshipType.PROXIES_TO,
    );

    // 4. Application reports to Sentry
    const sentryRel = topology.relationships.find(
      (r) => r.targetTechnologyId === 'tech-sentry',
    );
    expect(sentryRel).toBeDefined();
    expect(sentryRel?.relationshipType).toBe(
      TechnologyRelationshipType.REPORTS_TO,
    );

    // 5. Application integrates with Stripe
    const stripeRel = topology.relationships.find(
      (r) => r.targetTechnologyId === 'tech-stripe',
    );
    expect(stripeRel).toBeDefined();
    expect(stripeRel?.relationshipType).toBe(
      TechnologyRelationshipType.INTEGRATES_WITH,
    );

    // Summary
    expect(topology.summary).toContain('fronted by Cloudflare');
    expect(topology.summary).toContain('routed through NGINX');
    expect(topology.summary).toContain('Next.js');
  });

  it('handles empty technology stacks gracefully without throwing', async () => {
    const context = createTechnologyDetectionContext({
      domainName: 'empty.com',
    });

    const topology = await engine.buildTopology([], context);
    expect(topology.totalNodes).toBe(0);
    expect(topology.totalRelationships).toBe(0);
    expect(topology.summary).toContain(
      'No public application or infrastructure technologies detected',
    );
  });
});
