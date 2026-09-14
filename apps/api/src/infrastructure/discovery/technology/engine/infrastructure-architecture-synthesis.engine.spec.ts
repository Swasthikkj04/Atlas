import { InfrastructureArchitectureSynthesisEngine } from './infrastructure-architecture-synthesis.engine';
import { createTechnologyDetectionContext } from '../context/technology-detection-context.impl';
import {
  InfrastructureTopology,
  TopologyLayer,
  TechnologyRelationshipType,
} from '../contracts';

describe('InfrastructureArchitectureSynthesisEngine (TECH-004)', () => {
  let synthesisEngine: InfrastructureArchitectureSynthesisEngine;

  beforeEach(() => {
    synthesisEngine = new InfrastructureArchitectureSynthesisEngine();
  });

  const createMockTopology = (opts?: {
    withEdge?: boolean;
    withGateway?: boolean;
    withApp?: boolean;
    withRuntime?: boolean;
    withIntegrations?: boolean;
  }): InfrastructureTopology => {
    const nodes: any[] = [];
    const relationships: any[] = [];
    const layers: Record<TopologyLayer, any[]> = {
      [TopologyLayer.EDGE]: [],
      [TopologyLayer.GATEWAY]: [],
      [TopologyLayer.APPLICATION]: [],
      [TopologyLayer.RUNTIME]: [],
      [TopologyLayer.PLATFORM]: [],
      [TopologyLayer.INTEGRATION]: [],
      [TopologyLayer.SECURITY]: [],
    };

    if (opts?.withEdge) {
      const node = {
        id: 'tech-cloudflare',
        technologyId: 'tech-cloudflare',
        name: 'Cloudflare',
        category: 'CDN / Edge',
        layer: TopologyLayer.EDGE,
        role: 'Global Edge Network & WAF',
        infrastructureMeaning: 'Protected by Cloudflare Anycast edge',
        whyDetected: 'Observed cf-ray and Server: cloudflare header',
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        evidenceCount: 2,
        whatThisDoesNotProve:
          'Presence of Cloudflare edge proxy does not identify the origin server provider.',
      };
      nodes.push(node);
      layers[TopologyLayer.EDGE].push(node);

      relationships.push({
        id: 'rel-cf-endpoint',
        sourceTechnologyId: 'tech-cloudflare',
        sourceTechnologyName: 'Cloudflare',
        targetTechnologyId: 'public-endpoint',
        targetTechnologyName: 'Public Endpoint',
        relationshipType: TechnologyRelationshipType.EDGE_OF,
        evidenceState: 'CONFIRMED',
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        explanation: 'Cloudflare operates at the outer edge of the endpoint.',
        evidence: [
          {
            sourceType: 'HTTP',
            source: 'Response Header: cf-ray',
            indicator: 'cf-ray',
            confidence: 'HIGH',
          },
        ],
        claimBoundary: node.whatThisDoesNotProve,
      });
    }

    if (opts?.withGateway) {
      const node = {
        id: 'tech-nginx',
        technologyId: 'tech-nginx',
        name: 'NGINX',
        category: 'Web Server',
        layer: TopologyLayer.GATEWAY,
        role: 'Reverse Proxy & Ingress Gateway',
        infrastructureMeaning: 'NGINX web gateway',
        whyDetected: 'Observed Server: nginx/1.24.0',
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        version: '1.24.0',
        evidenceCount: 1,
        whatThisDoesNotProve:
          'Exposed NGINX header does not prove underlying Linux distribution.',
      };
      nodes.push(node);
      layers[TopologyLayer.GATEWAY].push(node);

      if (opts.withEdge) {
        relationships.push({
          id: 'rel-cf-nginx',
          sourceTechnologyId: 'tech-cloudflare',
          sourceTechnologyName: 'Cloudflare',
          targetTechnologyId: 'tech-nginx',
          targetTechnologyName: 'NGINX',
          relationshipType: TechnologyRelationshipType.FORWARDS_TO,
          evidenceState: 'SUPPORTED',
          confidence: 0.95,
          confidenceLevel: 'HIGH',
          explanation: 'Edge forwards traffic to NGINX gateway.',
          evidence: [],
        });
      }
    }

    if (opts?.withApp) {
      const node = {
        id: 'tech-nextjs',
        technologyId: 'tech-nextjs',
        name: 'Next.js',
        category: 'Frameworks',
        layer: TopologyLayer.APPLICATION,
        role: 'Application Framework',
        infrastructureMeaning: 'Next.js SSR/SSG application',
        whyDetected: 'Observed X-Powered-By: Next.js and __NEXT_DATA__',
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        evidenceCount: 2,
        whatThisDoesNotProve:
          'Next.js framework usage does not prove hosting on Vercel.',
      };
      nodes.push(node);
      layers[TopologyLayer.APPLICATION].push(node);

      if (opts.withGateway) {
        relationships.push({
          id: 'rel-nginx-nextjs',
          sourceTechnologyId: 'tech-nginx',
          sourceTechnologyName: 'NGINX',
          targetTechnologyId: 'tech-nextjs',
          targetTechnologyName: 'Next.js',
          relationshipType: TechnologyRelationshipType.PROXIES_TO,
          evidenceState: 'SUPPORTED',
          confidence: 0.95,
          confidenceLevel: 'HIGH',
          explanation: 'NGINX proxies traffic to Next.js.',
          evidence: [],
        });
      }
    }

    if (opts?.withRuntime) {
      const node = {
        id: 'tech-docker',
        technologyId: 'tech-docker',
        name: 'Docker',
        category: 'Infrastructure Runtime',
        layer: TopologyLayer.RUNTIME,
        role: 'Container Runtime',
        infrastructureMeaning: 'Workloads execute inside Docker containers',
        whyDetected: 'Observed Docker registry headers',
        confidence: 0.95,
        confidenceLevel: 'HIGH',
        evidenceCount: 1,
        whatThisDoesNotProve:
          'Docker container signatures do not prove cloud provider hosting.',
      };
      nodes.push(node);
      layers[TopologyLayer.RUNTIME].push(node);

      if (opts.withApp) {
        relationships.push({
          id: 'rel-nextjs-docker',
          sourceTechnologyId: 'tech-nextjs',
          sourceTechnologyName: 'Next.js',
          targetTechnologyId: 'tech-docker',
          targetTechnologyName: 'Docker',
          relationshipType: TechnologyRelationshipType.RUNS_ON,
          evidenceState: 'SUPPORTED',
          confidence: 0.95,
          confidenceLevel: 'HIGH',
          explanation: 'Next.js application runs on Docker.',
          evidence: [],
        });
      }
    }

    if (opts?.withIntegrations) {
      const sentryNode = {
        id: 'tech-sentry',
        technologyId: 'tech-sentry',
        name: 'Sentry',
        category: 'Analytics / Observability',
        layer: TopologyLayer.INTEGRATION,
        role: 'Error Monitoring & APM',
        infrastructureMeaning: 'Sentry telemetry integration',
        whyDetected: 'Observed sentry-trace header',
        confidence: 0.95,
        confidenceLevel: 'HIGH',
        evidenceCount: 1,
        whatThisDoesNotProve: 'Sentry client SDK does not expose backend APM.',
      };
      const stripeNode = {
        id: 'tech-stripe',
        technologyId: 'tech-stripe',
        name: 'Stripe',
        category: 'Payments',
        layer: TopologyLayer.INTEGRATION,
        role: 'Payment Processing Gateway',
        infrastructureMeaning: 'Stripe payment checkout integration',
        whyDetected: 'Observed js.stripe.com/v3 script',
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        evidenceCount: 1,
        whatThisDoesNotProve:
          'Stripe integration does not expose merchant banking.',
      };
      nodes.push(sentryNode, stripeNode);
      layers[TopologyLayer.INTEGRATION].push(sentryNode, stripeNode);

      if (opts.withApp) {
        relationships.push({
          id: 'rel-nextjs-sentry',
          sourceTechnologyId: 'tech-nextjs',
          sourceTechnologyName: 'Next.js',
          targetTechnologyId: 'tech-sentry',
          targetTechnologyName: 'Sentry',
          relationshipType: TechnologyRelationshipType.REPORTS_TO,
          evidenceState: 'CONFIRMED',
          confidence: 0.95,
          confidenceLevel: 'HIGH',
          explanation: 'Next.js exports telemetry to Sentry.',
          evidence: [],
        });
        relationships.push({
          id: 'rel-nextjs-stripe',
          sourceTechnologyId: 'tech-nextjs',
          sourceTechnologyName: 'Next.js',
          targetTechnologyId: 'tech-stripe',
          targetTechnologyName: 'Stripe',
          relationshipType: TechnologyRelationshipType.INTEGRATES_WITH,
          evidenceState: 'CONFIRMED',
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          explanation: 'Next.js integrates checkout with Stripe.',
          evidence: [],
        });
      }
    }

    return {
      nodes,
      relationships,
      layers,
      summary: 'Generated topology summary',
      totalNodes: nodes.length,
      totalRelationships: relationships.length,
      confirmedRelationshipsCount: relationships.filter(
        (r) => r.evidenceState === 'CONFIRMED',
      ).length,
      supportedRelationshipsCount: relationships.filter(
        (r) => r.evidenceState === 'SUPPORTED',
      ).length,
      inferredRelationshipsCount: relationships.filter(
        (r) => r.evidenceState === 'INFERRED',
      ).length,
      generatedAt: new Date().toISOString(),
    };
  };

  it('synthesizes complete architecture brief answering what the infrastructure looks like as a system', async () => {
    const topology = createMockTopology({
      withEdge: true,
      withGateway: true,
      withApp: true,
      withRuntime: true,
      withIntegrations: true,
    });

    const context = createTechnologyDetectionContext({
      domainName: 'production-app.io',
    });

    const brief = await synthesisEngine.synthesize(topology, context);

    // 1. Executive Summary
    expect(brief.summary).toContain('Cloudflare as an edge layer');
    expect(brief.summary).toContain('NGINX as an ingress gateway');
    expect(brief.summary).toContain('Next.js');
    expect(brief.summary).toContain('Docker');
    expect(brief.summary).toContain('Sentry');
    expect(brief.summary).toContain('Stripe');

    // 2. Architecture Path
    expect(brief.architecturePath.length).toBeGreaterThanOrEqual(4);
    expect(brief.architecturePath[0].technologyId).toBe('public-endpoint');
    expect(brief.architecturePath[1].technologyName).toBe('Cloudflare');
    expect(brief.architecturePath[2].technologyName).toBe('NGINX');
    expect(brief.architecturePath[3].technologyName).toBe('Next.js');
    expect(brief.architecturePath[4].technologyName).toBe('Docker');

    // Integrations excluded from linear ingress path
    expect(
      brief.architecturePath.find((p) => p.technologyName === 'Sentry'),
    ).toBeUndefined();
    expect(
      brief.architecturePath.find((p) => p.technologyName === 'Stripe'),
    ).toBeUndefined();

    // 3. Layer Breakdown
    expect(brief.layers).toHaveLength(7);
    const edgeLayer = brief.layers.find((l) => l.layer === TopologyLayer.EDGE);
    expect(edgeLayer.state).toBe('OBSERVED');
    expect(edgeLayer.technologies).toHaveLength(1);
    expect(edgeLayer.technologies[0].name).toBe('Cloudflare');

    const appLayer = brief.layers.find(
      (l) => l.layer === TopologyLayer.APPLICATION,
    );
    expect(appLayer.state).toBe('OBSERVED');
    expect(appLayer.technologies[0].name).toBe('Next.js');

    // 4. Key Technologies vs Integrations
    expect(brief.keyTechnologies.map((t) => t.name)).toContain('Cloudflare');
    expect(brief.keyTechnologies.map((t) => t.name)).toContain('NGINX');
    expect(brief.keyTechnologies.map((t) => t.name)).toContain('Next.js');
    expect(brief.keyTechnologies.map((t) => t.name)).toContain('Docker');
    expect(brief.integrations.map((t) => t.name)).toEqual(['Sentry', 'Stripe']);

    // 5. Confidence Synthesis
    expect(brief.confidence.overallLevel).toBe('HIGH');
    expect(brief.confidence.overallScore).toBeGreaterThan(0.85);
    expect(brief.confidence.layerConfidence[TopologyLayer.EDGE]).toBe('HIGH');
    expect(brief.confidence.rationale).toContain(
      'Architecture confidence is HIGH',
    );

    // 6. Known Unknowns (First-class trust)
    expect(brief.knownUnknowns.length).toBeGreaterThanOrEqual(3);
    const originUnknown = brief.knownUnknowns.find(
      (u) => u.dimension === 'Origin Cloud Provider',
    );
    expect(originUnknown).toBeDefined();
    expect(originUnknown?.status).toBe('MASKED');

    // 7. Claim Boundaries
    expect(brief.claimBoundaries.length).toBeGreaterThanOrEqual(4);
    const nextBoundary = brief.claimBoundaries.find((b) =>
      b.boundary.includes('Vercel'),
    );
    expect(nextBoundary).toBeDefined();
  });

  it('handles empty topologies gracefully without errors', async () => {
    const emptyTopology = createMockTopology({});
    const context = createTechnologyDetectionContext({
      domainName: 'empty-site.com',
    });

    const brief = await synthesisEngine.synthesize(emptyTopology, context);

    expect(brief.summary).toContain(
      'No public application framework, gateway, or edge infrastructure technologies were observed',
    );
    expect(brief.architecturePath).toHaveLength(1);
    expect(brief.keyTechnologies).toHaveLength(0);
    expect(brief.integrations).toHaveLength(0);
    expect(brief.confidence.overallLevel).toBe('INCONCLUSIVE');
  });
});
