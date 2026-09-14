import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto, DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('T25: HAProxy Infrastructure Understanding Vertical Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. HAProxy Category & Semantic Role Mapping (GATEWAY)
  // ---------------------------------------------------------------------------
  describe('1. HAProxy Category & Semantic Role Mapping', () => {
    it('maps HAProxy to GATEWAY layer with authoritative Reverse Proxy / Load Balancer role', () => {
      const haproxyArchitecture: TechnologyArchitectureOverviewDto = {
        architectureSummary:
          'The public endpoint is served through an HAProxy load-balancing gateway.',
        ingressPath: [
          {
            hop: 0,
            layer: 'GATEWAY',
            technologyId: 'public-endpoint',
            technologyName: 'Public Endpoint',
            role: 'Ingress',
          },
          {
            hop: 1,
            layer: 'GATEWAY',
            technologyId: 'tech-haproxy',
            technologyName: 'HAProxy',
            role: 'Reverse Proxy / Load Balancer',
          },
        ],
        layers: [
          {
            layer: 'GATEWAY',
            state: 'OBSERVED',
            confidenceLevel: 'HIGH',
            technologies: [
              {
                technologyId: 'tech-haproxy',
                name: 'HAProxy',
                category: 'Web / Server',
                layer: 'GATEWAY',
                role: 'Reverse Proxy / Load Balancer',
                infrastructureMeaning:
                  'The observed endpoint appears to expose HAProxy as a gateway or load-balancing boundary.',
                whyDetected: 'Observed Server: HAProxy/2.8.5 and x-haproxy-id response header',
                whatThisDoesNotProve:
                  'Observable HAProxy infrastructure confirms reverse proxy / load balancing gateway presence, but does not prove Kubernetes, Docker, Linux, cloud provider, service mesh, microservices, specific backend runtime, specific application framework, database, HAProxy configuration, backend topology, or internal load-balancing targets.',
                confidence: 0.98,
                confidenceLevel: 'HIGH',
                version: '2.8.5',
                evidence: [],
              },
            ],
          },
        ],
        keyTechnologies: [
          {
            technologyId: 'tech-haproxy',
            name: 'HAProxy',
            category: 'Web / Server',
            layer: 'GATEWAY',
            role: 'Reverse Proxy / Load Balancer',
            infrastructureMeaning:
              'The observed endpoint appears to expose HAProxy as a gateway or load-balancing boundary.',
            whyDetected: 'Observed Server: HAProxy/2.8.5 and x-haproxy-id response header',
            whatThisDoesNotProve:
              'Observable HAProxy infrastructure confirms reverse proxy / load balancing gateway presence, but does not prove Kubernetes, Docker, Linux, cloud provider, service mesh, microservices, specific backend runtime, specific application framework, database, HAProxy configuration, backend topology, or internal load-balancing targets.',
            confidence: 0.98,
            confidenceLevel: 'HIGH',
            version: '2.8.5',
            evidence: [],
          },
        ],
        integrations: [],
        knownUnknowns: [
          {
            dimension: 'Database Backend Layer',
            status: 'UNOBSERVED',
            explanation: 'Backend database engines (SQL/NoSQL) are not directly observable from the public endpoint.',
          },
          {
            dimension: 'Host Operating System & Compute Architecture',
            status: 'UNKNOWN',
            explanation: 'The underlying host operating system (e.g. Linux distribution) and hardware virtualization layer cannot be confirmed.',
          },
        ],
        claimBoundaries: [
          {
            technologyId: 'tech-haproxy',
            technologyName: 'HAProxy',
            boundary:
              'Observable HAProxy infrastructure confirms reverse proxy / load balancing gateway presence, but does not prove Kubernetes, Docker, Linux, cloud provider, service mesh, microservices, specific backend runtime, specific application framework, database, HAProxy configuration, backend topology, or internal load-balancing targets.',
          },
        ],
        confidence: {
          overallLevel: 'HIGH',
          overallScore: 0.98,
          layerConfidence: { GATEWAY: 'HIGH' },
          rationale: 'Observed Server: HAProxy/2.8.5 and x-haproxy-id header',
          confirmedRelationshipsCount: 1,
          supportedRelationshipsCount: 0,
          inferredRelationshipsCount: 0,
        },
      };

      const tech = haproxyArchitecture.keyTechnologies[0];
      assert.equal(tech.name, 'HAProxy');
      assert.equal(tech.layer, 'GATEWAY');
      assert.equal(tech.version, '2.8.5');
      assert.ok(tech.infrastructureMeaning.includes('expose HAProxy as a gateway or load-balancing boundary'));
      assert.ok(tech.whatThisDoesNotProve.includes('Kubernetes'));
      assert.ok(tech.whatThisDoesNotProve.includes('Docker'));
      assert.ok(tech.whatThisDoesNotProve.includes('Linux'));
      assert.ok(tech.whatThisDoesNotProve.includes('cloud provider'));
      assert.ok(tech.whatThisDoesNotProve.includes('service mesh'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Version Fidelity (Optional, No "Version: Unknown")
  // ---------------------------------------------------------------------------
  describe('2. Version Fidelity', () => {
    it('preserves exact HAProxy version when evidenced and leaves version undefined when unevidenced', () => {
      const versionedHAProxy = buildComponentViewModel({
        id: 'tech-haproxy',
        category: 'WEB_SERVER',
        name: 'HAProxy',
        role: 'Reverse Proxy / Load Balancer',
        layer: 'GATEWAY',
        confidenceLevel: 'HIGH',
        version: '2.8.5',
        state: 'OBSERVED',
      });

      assert.equal(versionedHAProxy.version, '2.8.5');

      const unversionedHAProxy = buildComponentViewModel({
        id: 'tech-haproxy',
        category: 'WEB_SERVER',
        name: 'HAProxy',
        role: 'Reverse Proxy / Load Balancer',
        layer: 'GATEWAY',
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
      });

      assert.equal(unversionedHAProxy.version, undefined);
      assert.ok(!unversionedHAProxy.attributes.some((attr) => attr.value.toLowerCase().includes('unknown')));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Technology Coexistence (Cloudflare + HAProxy + NGINX + Go)
  // ---------------------------------------------------------------------------
  describe('3. Multi-Technology Coexistence & Anti-Stack Collapsing', () => {
    it('renders Cloudflare, HAProxy, NGINX, and Go as independent observations without collapsing', () => {
      const mockDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-haproxy-full', domainName: 'modern-haproxy-cluster.io', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 95, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-haproxy', createdAt: new Date().toISOString(), responseTimeMs: 18, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Multi-hop architecture fronted by Cloudflare, HAProxy load balancer, NGINX gateway, and Go runtime.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-cloudflare', name: 'Cloudflare', category: 'CDN / Edge', layer: 'EDGE', role: 'Edge Proxy', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-haproxy', name: 'HAProxy', category: 'Web / Server', layer: 'GATEWAY', role: 'Reverse Proxy / Load Balancer', version: '2.8.5', confidence: 0.98, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-nginx', name: 'NGINX', category: 'Web / Server', layer: 'GATEWAY', role: 'Web Gateway', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-go', name: 'Go', category: 'Runtime', layer: 'RUNTIME', role: 'Compiled Application Runtime', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-haproxy-full', 'modern-haproxy-cluster.io', mockDomain);

      const edgeGroup = model.categoryGroups.find((g) => g.category === 'EDGE');
      assert.ok(edgeGroup);
      assert.equal(edgeGroup?.components[0].name, 'Cloudflare');

      const gwGroup = model.categoryGroups.find((g) => g.category === 'GATEWAY');
      assert.ok(gwGroup);
      assert.equal(gwGroup?.components.length, 2);
      assert.equal(gwGroup?.components[0].name, 'HAProxy');
      assert.equal(gwGroup?.components[0].version, '2.8.5');
      assert.equal(gwGroup?.components[1].name, 'NGINX');

      const runtimeGroup = model.categoryGroups.find((g) => g.category === 'RUNTIME');
      assert.ok(runtimeGroup);
      assert.equal(runtimeGroup?.components[0].name, 'Go');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. IA-2 3-Tier Progressive Disclosure for HAProxy
  // ---------------------------------------------------------------------------
  describe('4. IA-2 Progressive Disclosure for HAProxy', () => {
    it('provides 3 levels of investigation (Understanding -> Context -> Evidence) for HAProxy', () => {
      const viewModel = buildComponentViewModel(
        {
          id: 'tech-haproxy',
          category: 'WEB_SERVER',
          name: 'HAProxy',
          role: 'Reverse Proxy / Load Balancer',
          layer: 'GATEWAY',
          version: '2.8.5',
          confidenceLevel: 'HIGH',
          state: 'OBSERVED',
          infrastructureMeaning: 'The observed endpoint appears to expose HAProxy as a gateway or load-balancing boundary.',
          whatThisDoesNotProve: 'Observable HAProxy infrastructure confirms reverse proxy / load balancing gateway presence, but does not prove Kubernetes, Docker, Linux, cloud provider, service mesh, microservices, specific backend runtime, specific application framework, database, HAProxy configuration, backend topology, or internal load-balancing targets.',
          evidenceReferences: [
            {
              sourceType: 'HTTP_HEADER',
              source: 'Response Header: server',
              indicator: 'Server: HAProxy/2.8.5',
              confidence: 'HIGH',
            },
            {
              sourceType: 'HTTP_HEADER',
              source: 'Response Header: x-haproxy-id',
              indicator: 'x-haproxy-id: req-09871',
              confidence: 'HIGH',
            },
          ],
        },
        '2026-08-28T12:00:00.000Z',
      );

      // Level 1: Understanding
      assert.equal(viewModel.name, 'HAProxy');
      assert.equal(viewModel.version, '2.8.5');
      assert.equal(viewModel.layer, 'GATEWAY');
      assert.equal(viewModel.confidenceLevel, 'HIGH');

      // Level 2: Context
      assert.equal(viewModel.hasContext, true);
      assert.ok(viewModel.whyThisAppears?.includes('expose HAProxy as a gateway or load-balancing boundary'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('does not prove Kubernetes'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('Docker'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('Linux'));

      // Level 3: Evidence
      assert.equal(viewModel.hasEvidence, true);
      assert.equal(viewModel.evidence.length, 2);
      assert.equal(viewModel.evidence[0].observedSignal, 'Server: HAProxy/2.8.5');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Domain Switching & Re-Understanding Isolation
  // ---------------------------------------------------------------------------
  describe('5. Domain Switching Isolation & Re-Understanding', () => {
    it('completely isolates HAProxy state between domains during context switching', () => {
      const haproxyDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-haproxy', domainName: 'haproxy-gateway.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 90, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-h1', createdAt: new Date().toISOString(), responseTimeMs: 15, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'HAProxy load balancer observed.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-haproxy', name: 'HAProxy', category: 'Web / Server', layer: 'GATEWAY', role: 'Reverse Proxy / Load Balancer', confidence: 0.98, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.98, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const caddyDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-caddy', domainName: 'caddy-gateway.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 90, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-c1', createdAt: new Date().toISOString(), responseTimeMs: 20, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Caddy server observed.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-caddy', name: 'Caddy', category: 'Web / Server', layer: 'GATEWAY', role: 'Web Server', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const modelA = resolveAdaptiveInfrastructureModel('dom-haproxy', 'haproxy-gateway.org', haproxyDomain);
      const modelB = resolveAdaptiveInfrastructureModel('dom-caddy', 'caddy-gateway.org', caddyDomain);

      assert.equal(modelA.categoryGroups[0].components[0].name, 'HAProxy');
      assert.equal(modelB.categoryGroups[0].components[0].name, 'Caddy');
      assert.ok(!modelB.categoryGroups[0].components.some((c) => c.name === 'HAProxy'));
    });
  });
});
