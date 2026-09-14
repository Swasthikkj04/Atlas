import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto, DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('H1: Ingress Request Path & Architecture Topology Frontend Intelligence', () => {
  const sampleArchitectureDto: TechnologyArchitectureOverviewDto = {
    architectureSummary:
      'The public endpoint is fronted by Cloudflare Anycast edge, routed through NGINX ingress gateway, executing Next.js application framework on Node.js runtime substrate.',
    ingressPath: [
      {
        hop: 0,
        layer: 'EDGE',
        technologyId: 'public-endpoint',
        technologyName: 'Public Endpoint (enterprise-production.io)',
        role: 'Client Request Ingress',
        relationshipType: 'EDGE_OF',
      },
      {
        hop: 1,
        layer: 'EDGE',
        technologyId: 'tech-cloudflare',
        technologyName: 'Cloudflare',
        role: 'Edge Proxy & Anycast Acceleration',
        relationshipType: 'EDGE_OF',
      },
      {
        hop: 2,
        layer: 'GATEWAY',
        technologyId: 'tech-nginx',
        technologyName: 'NGINX',
        role: 'Reverse Proxy & Ingress Gateway',
        relationshipType: 'FORWARDS_TO',
      },
      {
        hop: 3,
        layer: 'APPLICATION',
        technologyId: 'tech-nextjs',
        technologyName: 'Next.js',
        role: 'Application Framework Layer',
        relationshipType: 'PROXIES_TO',
      },
      {
        hop: 4,
        layer: 'RUNTIME',
        technologyId: 'tech-nodejs',
        technologyName: 'Node.js',
        role: 'Server-side Application Runtime',
        relationshipType: 'RUNS_ON',
      },
    ],
    layers: [
      {
        layer: 'EDGE',
        state: 'OBSERVED',
        confidenceLevel: 'HIGH',
        technologies: [
          {
            technologyId: 'tech-cloudflare',
            name: 'Cloudflare',
            category: 'CDN / Edge',
            layer: 'EDGE',
            role: 'Edge Proxy & Anycast Acceleration',
            infrastructureMeaning: 'Cloudflare operates at the outer edge, terminating client TLS and mitigating DDoS.',
            whyDetected: 'Observed cf-ray header and Cloudflare Anycast IP range',
            whatThisDoesNotProve: 'Cloudflare presence does not reveal private upstream origin IP or cloud hosting provider.',
            confidence: 0.98,
            confidenceLevel: 'HIGH',
            evidence: [
              {
                sourceType: 'HTTP',
                source: 'Response Header: cf-ray',
                indicator: 'cf-ray: 88776655-IAD',
                confidence: 'HIGH',
              },
            ],
          },
        ],
      },
      {
        layer: 'GATEWAY',
        state: 'OBSERVED',
        confidenceLevel: 'HIGH',
        technologies: [
          {
            technologyId: 'tech-nginx',
            name: 'NGINX',
            category: 'Web / Server',
            version: '1.24.0',
            layer: 'GATEWAY',
            role: 'Reverse Proxy & Ingress Gateway',
            infrastructureMeaning: 'NGINX handles reverse proxy routing, SSL termination, and static asset delivery.',
            whyDetected: 'Observed Server: nginx/1.24.0 response header',
            whatThisDoesNotProve: 'NGINX does not prove host OS, containerization, or backend application framework.',
            confidence: 0.95,
            confidenceLevel: 'HIGH',
            evidence: [
              {
                sourceType: 'HTTP',
                source: 'Response Header: server',
                indicator: 'Server: nginx/1.24.0',
                confidence: 'HIGH',
              },
            ],
          },
        ],
      },
      {
        layer: 'APPLICATION',
        state: 'OBSERVED',
        confidenceLevel: 'HIGH',
        technologies: [
          {
            technologyId: 'tech-nextjs',
            name: 'Next.js',
            category: 'Application Framework',
            layer: 'APPLICATION',
            role: 'Application Framework Layer',
            infrastructureMeaning: 'Next.js performs server-side rendering and API route handling.',
            whyDetected: 'Observed X-Powered-By: Next.js header and Next hydration script',
            whatThisDoesNotProve: 'Next.js does not prove database type or cloud hosting environment.',
            confidence: 0.95,
            confidenceLevel: 'HIGH',
            evidence: [
              {
                sourceType: 'HTTP',
                source: 'Response Header: x-powered-by',
                indicator: 'X-Powered-By: Next.js',
                confidence: 'HIGH',
              },
            ],
          },
        ],
      },
      {
        layer: 'RUNTIME',
        state: 'OBSERVED',
        confidenceLevel: 'HIGH',
        technologies: [
          {
            technologyId: 'tech-nodejs',
            name: 'Node.js',
            category: 'Infrastructure Runtime',
            version: '20.11.0',
            layer: 'RUNTIME',
            role: 'Server-side Application Runtime',
            infrastructureMeaning: 'Node.js V8 JavaScript engine executes application backend services.',
            whyDetected: 'Observed X-Node-Version: 20.11.0 header',
            whatThisDoesNotProve: 'Node.js presence confirms JavaScript runtime, but does not prove PostgreSQL, MySQL, Redis, Docker, or Linux.',
            confidence: 0.95,
            confidenceLevel: 'HIGH',
            evidence: [
              {
                sourceType: 'HTTP',
                source: 'Response Header: x-node-version',
                indicator: 'X-Node-Version: 20.11.0',
                confidence: 'HIGH',
              },
            ],
          },
        ],
      },
    ],
    keyTechnologies: [
      {
        technologyId: 'tech-cloudflare',
        name: 'Cloudflare',
        category: 'CDN / Edge',
        layer: 'EDGE',
        role: 'Edge Proxy & Anycast Acceleration',
        infrastructureMeaning: 'Cloudflare operates at the outer edge, terminating client TLS and mitigating DDoS.',
        whyDetected: 'Observed cf-ray header and Cloudflare Anycast IP range',
        whatThisDoesNotProve: 'Cloudflare presence does not reveal private upstream origin IP or cloud hosting provider.',
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        evidence: [
          {
            sourceType: 'HTTP',
            source: 'Response Header: cf-ray',
            indicator: 'cf-ray: 88776655-IAD',
            confidence: 'HIGH',
          },
        ],
      },
      {
        technologyId: 'tech-nginx',
        name: 'NGINX',
        category: 'Web / Server',
        version: '1.24.0',
        layer: 'GATEWAY',
        role: 'Reverse Proxy & Ingress Gateway',
        infrastructureMeaning: 'NGINX handles reverse proxy routing, SSL termination, and static asset delivery.',
        whyDetected: 'Observed Server: nginx/1.24.0 response header',
        whatThisDoesNotProve: 'NGINX does not prove host OS, containerization, or backend application framework.',
        confidence: 0.95,
        confidenceLevel: 'HIGH',
        evidence: [
          {
            sourceType: 'HTTP',
            source: 'Response Header: server',
            indicator: 'Server: nginx/1.24.0',
            confidence: 'HIGH',
          },
        ],
      },
      {
        technologyId: 'tech-nextjs',
        name: 'Next.js',
        category: 'Application Framework',
        layer: 'APPLICATION',
        role: 'Application Framework Layer',
        infrastructureMeaning: 'Next.js performs server-side rendering and API route handling.',
        whyDetected: 'Observed X-Powered-By: Next.js header and Next hydration script',
        whatThisDoesNotProve: 'Next.js does not prove database type or cloud hosting environment.',
        confidence: 0.95,
        confidenceLevel: 'HIGH',
        evidence: [
          {
            sourceType: 'HTTP',
            source: 'Response Header: x-powered-by',
            indicator: 'X-Powered-By: Next.js',
            confidence: 'HIGH',
          },
        ],
      },
      {
        technologyId: 'tech-nodejs',
        name: 'Node.js',
        category: 'Infrastructure Runtime',
        version: '20.11.0',
        layer: 'RUNTIME',
        role: 'Server-side Application Runtime',
        infrastructureMeaning: 'Node.js V8 JavaScript engine executes application backend services.',
        whyDetected: 'Observed X-Node-Version: 20.11.0 header',
        whatThisDoesNotProve: 'Node.js presence confirms JavaScript runtime, but does not prove PostgreSQL, MySQL, Redis, Docker, or Linux.',
        confidence: 0.95,
        confidenceLevel: 'HIGH',
        evidence: [
          {
            sourceType: 'HTTP',
            source: 'Response Header: x-node-version',
            indicator: 'X-Node-Version: 20.11.0',
            confidence: 'HIGH',
          },
        ],
      },
    ],
    integrations: [],
    knownUnknowns: [
      {
        dimension: 'Database Backend Layer',
        status: 'UNOBSERVED',
        explanation: 'Backend database engines (PostgreSQL, MySQL, MongoDB, DynamoDB) reside sealed behind application layers and are unobserved from public endpoints.',
        whyUnknown: 'Database connections and cluster storage reside isolated behind application services.',
      },
      {
        dimension: 'In-Memory Caching Tier',
        status: 'UNOBSERVED',
        explanation: 'Internal caching tiers (Redis, Memcached, Key-Value stores) operate behind gateways and are not publicly exposed.',
        whyUnknown: 'In-memory caches reside within internal private application perimeters.',
      },
      {
        dimension: 'Cluster Orchestrator & Compute Substrate',
        status: 'UNOBSERVED',
        explanation: 'Container schedulers and cluster orchestrators (Kubernetes, Docker Swarm, Nomad) reside within private VPC subnets without public ingress telemetry.',
        whyUnknown: 'Orchestrator control planes and worker nodes are sealed behind public ingress gateways.',
      },
    ],
    claimBoundaries: [
      {
        technologyId: 'tech-cloudflare',
        technologyName: 'Cloudflare',
        boundary: 'Cloudflare presence does not reveal private upstream origin IP or cloud hosting provider.',
      },
      {
        technologyId: 'tech-nginx',
        technologyName: 'NGINX',
        boundary: 'NGINX does not prove host OS, containerization, or backend application framework.',
      },
      {
        technologyId: 'tech-nodejs',
        technologyName: 'Node.js',
        boundary: 'Node.js presence confirms JavaScript runtime, but does not prove PostgreSQL, MySQL, Redis, Docker, or Linux.',
      },
    ],
    confidence: {
      overallLevel: 'HIGH',
      overallScore: 0.95,
      layerConfidence: {
        EDGE: 'HIGH',
        GATEWAY: 'HIGH',
        APPLICATION: 'HIGH',
        RUNTIME: 'HIGH',
      },
      rationale: 'High confidence derived from verified multi-hop ingress headers across all public layers.',
      confirmedRelationshipsCount: 3,
      supportedRelationshipsCount: 2,
      inferredRelationshipsCount: 0,
    },
  };

  const mockOverviewDto: DomainOverviewResponseDto = {
    domain: { id: 'dom-h1-1', domainName: 'enterprise-production.io', monitoringEnabled: true, createdAt: new Date().toISOString() },
    health: { score: 95, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
    latestSnapshot: { id: 'snap-1', createdAt: '2026-08-27T18:00:00.000Z', responseTimeMs: 35, httpStatus: 200 },
    latestBrief: null,
    findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
    recentFindings: [],
    recentChanges: [],
    latestVerification: null,
    statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
    infrastructure: {
      technologyArchitecture: sampleArchitectureDto,
    },
  };

  describe('1. Ingress Request Path Sequence & Hop Fidelity', () => {
    it('resolves the 5-hop canonical ingress sequence without loss of order or metadata', () => {
      const model = resolveAdaptiveInfrastructureModel('dom-h1-1', 'enterprise-production.io', mockOverviewDto);

      assert.ok(model.ingressPath);
      assert.strictEqual(model.ingressPath.length, 5);

      // Hop 0: Public Endpoint
      assert.strictEqual(model.ingressPath[0].hop, 0);
      assert.strictEqual(model.ingressPath[0].technologyId, 'public-endpoint');

      // Hop 1: Edge (Cloudflare)
      assert.strictEqual(model.ingressPath[1].hop, 1);
      assert.strictEqual(model.ingressPath[1].technologyId, 'tech-cloudflare');
      assert.strictEqual(model.ingressPath[1].layer, 'EDGE');

      // Hop 2: Gateway (NGINX)
      assert.strictEqual(model.ingressPath[2].hop, 2);
      assert.strictEqual(model.ingressPath[2].technologyId, 'tech-nginx');
      assert.strictEqual(model.ingressPath[2].layer, 'GATEWAY');

      // Hop 3: Application (Next.js)
      assert.strictEqual(model.ingressPath[3].hop, 3);
      assert.strictEqual(model.ingressPath[3].technologyId, 'tech-nextjs');
      assert.strictEqual(model.ingressPath[3].layer, 'APPLICATION');

      // Hop 4: Runtime (Node.js)
      assert.strictEqual(model.ingressPath[4].hop, 4);
      assert.strictEqual(model.ingressPath[4].technologyId, 'tech-nodejs');
      assert.strictEqual(model.ingressPath[4].layer, 'RUNTIME');
    });
  });

  describe('2. Invariant 2: Uncertainty Preservation (Gaps are Respected, Not Synthesized)', () => {
    it('preserves direct Edge -> Node.js path without fabricating intermediate Gateway', () => {
      const gapDomain: DomainOverviewResponseDto = {
        ...mockOverviewDto,
        infrastructure: {
          ...mockOverviewDto.infrastructure,
          technologyArchitecture: {
            ...sampleArchitectureDto,
            ingressPath: [
              {
                hop: 0,
                layer: 'EDGE',
                technologyId: 'public-endpoint',
                technologyName: 'Public Endpoint',
                role: 'Client Request Ingress',
              },
              {
                hop: 1,
                layer: 'EDGE',
                technologyId: 'tech-cloudflare',
                technologyName: 'Cloudflare',
                role: 'Edge Proxy',
              },
              {
                hop: 2,
                layer: 'RUNTIME',
                technologyId: 'tech-nodejs',
                technologyName: 'Node.js',
                role: 'Server Runtime',
              },
            ],
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-h1-1', 'enterprise-production.io', gapDomain);

      assert.strictEqual(model.ingressPath.length, 3);
      const hasGatewayHop = model.ingressPath.some((h) => h.layer === 'GATEWAY');
      assert.strictEqual(hasGatewayHop, false, 'Should not synthesize an unobserved GATEWAY hop');
    });
  });

  describe('3. Invariant 4: Sealed Internal Perimeter & Explicit Unknowns', () => {
    it('preserves Database, Cache, and Orchestrator as explicit UNOBSERVED dimensions', () => {
      const model = resolveAdaptiveInfrastructureModel('dom-h1-1', 'enterprise-production.io', mockOverviewDto);

      assert.ok(model.unobservedDimensions.length >= 3);

      const dbUnknown = model.unobservedDimensions.find((u) => u.dimension.includes('Database'));
      assert.ok(dbUnknown);
      assert.strictEqual(dbUnknown?.status, 'UNOBSERVED');
      assert.ok(dbUnknown?.explanation.includes('sealed behind application layers'));

      const cacheUnknown = model.unobservedDimensions.find((u) => u.dimension.includes('Caching'));
      assert.ok(cacheUnknown);
      assert.strictEqual(cacheUnknown?.status, 'UNOBSERVED');

      const orchUnknown = model.unobservedDimensions.find((u) => u.dimension.includes('Orchestrator'));
      assert.ok(orchUnknown);
      assert.strictEqual(orchUnknown?.status, 'UNOBSERVED');
    });
  });

  describe('4. Invariant 5: Wire Evidence Lineage & Component Inspection', () => {
    it('constructs detailed ComponentViewModel with wire evidence for hop inspection', () => {
      const model = resolveAdaptiveInfrastructureModel('dom-h1-1', 'enterprise-production.io', mockOverviewDto);

      const nodejsComponent = model.categoryGroups
        .flatMap((g) => g.components)
        .find((c) => c.id === 'tech-nodejs');

      assert.ok(nodejsComponent);
      assert.strictEqual(nodejsComponent?.version, '20.11.0');

      const viewModel = buildComponentViewModel(nodejsComponent!, new Date().toISOString());

      assert.strictEqual(viewModel.name, 'Node.js');
      assert.strictEqual(viewModel.version, '20.11.0');
      assert.strictEqual(viewModel.hasEvidence, true);
      assert.strictEqual(viewModel.evidence.length, 1);
      assert.strictEqual(viewModel.evidence[0].sourceType, 'HTTP');
      assert.strictEqual(viewModel.evidence[0].observedSignal, 'X-Node-Version: 20.11.0');
    });
  });

  describe('5. Invariant 6: Anti-Overreach UI Boundaries', () => {
    it('surfaces claim boundaries to prevent unjustified downstream inferences', () => {
      const model = resolveAdaptiveInfrastructureModel('dom-h1-1', 'enterprise-production.io', mockOverviewDto);

      assert.strictEqual(model.claimBoundaries.length, 3);

      const nodejsBoundary = model.claimBoundaries.find((b) => b.technologyId === 'tech-nodejs');
      assert.ok(nodejsBoundary);
      assert.ok(nodejsBoundary?.boundary.includes('does not prove PostgreSQL'));
    });
  });
});
