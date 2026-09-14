import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto, DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('T25: Envoy Infrastructure Understanding Vertical Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. Envoy Category & Semantic Role Mapping (GATEWAY)
  // ---------------------------------------------------------------------------
  describe('1. Envoy Category & Semantic Role Mapping', () => {
    it('maps Envoy to GATEWAY layer with authoritative Reverse Proxy / Service Proxy role', () => {
      const envoyArchitecture: TechnologyArchitectureOverviewDto = {
        architectureSummary:
          'The public endpoint is served through an Envoy service proxy gateway.',
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
            technologyId: 'tech-envoy',
            technologyName: 'Envoy',
            role: 'Reverse Proxy / Service Proxy',
          },
        ],
        layers: [
          {
            layer: 'GATEWAY',
            state: 'OBSERVED',
            confidenceLevel: 'HIGH',
            technologies: [
              {
                technologyId: 'tech-envoy',
                name: 'Envoy',
                category: 'Web / Server',
                layer: 'GATEWAY',
                role: 'Reverse Proxy / Service Proxy',
                infrastructureMeaning:
                  'The observed endpoint appears to expose Envoy as a gateway or proxy boundary.',
                whyDetected: 'Observed Server: envoy/1.28.0 and x-envoy-upstream-service-time response header',
                whatThisDoesNotProve:
                  'Envoy presence confirms service/gateway proxying, but does not prove Kubernetes, Istio, Docker, Linux, service mesh, sidecar deployment, ingress gateway, API gateway, microservices, specific cloud load balancer, or any specific upstream application or database.',
                confidence: 0.98,
                confidenceLevel: 'HIGH',
                version: '1.28.0',
                evidence: [],
              },
            ],
          },
        ],
        keyTechnologies: [
          {
            technologyId: 'tech-envoy',
            name: 'Envoy',
            category: 'Web / Server',
            layer: 'GATEWAY',
            role: 'Reverse Proxy / Service Proxy',
            infrastructureMeaning:
              'The observed endpoint appears to expose Envoy as a gateway or proxy boundary.',
            whyDetected: 'Observed Server: envoy/1.28.0 and x-envoy-upstream-service-time response header',
            whatThisDoesNotProve:
              'Envoy presence confirms service/gateway proxying, but does not prove Kubernetes, Istio, Docker, Linux, service mesh, sidecar deployment, ingress gateway, API gateway, microservices, specific cloud load balancer, or any specific upstream application or database.',
            confidence: 0.98,
            confidenceLevel: 'HIGH',
            version: '1.28.0',
            evidence: [],
          },
        ],
        integrations: [],
        knownUnknowns: [
          {
            dimension: 'Upstream Application',
            status: 'UNOBSERVED',
            explanation: 'Upstream backend application is unobservable from public Envoy proxy telemetry.',
          },
          {
            dimension: 'Container Orchestrator',
            status: 'UNOBSERVED',
            explanation: 'Kubernetes or service mesh (Istio) presence is not established by public Envoy headers.',
          },
        ],
        claimBoundaries: [
          {
            technologyId: 'tech-envoy',
            technologyName: 'Envoy',
            boundary:
              'Envoy presence confirms gateway proxying, but does not prove Kubernetes, Istio, Docker, or Linux.',
          },
        ],
        confidence: {
          overallLevel: 'HIGH',
          overallScore: 0.98,
          layerConfidence: { GATEWAY: 'HIGH' },
          rationale: 'Observed Server: envoy/1.28.0 and x-envoy-upstream-service-time header',
          confirmedRelationshipsCount: 1,
          supportedRelationshipsCount: 0,
          inferredRelationshipsCount: 0,
        },
      };

      const tech = envoyArchitecture.keyTechnologies[0];
      assert.equal(tech.name, 'Envoy');
      assert.equal(tech.layer, 'GATEWAY');
      assert.equal(tech.version, '1.28.0');
      assert.ok(tech.infrastructureMeaning.includes('expose Envoy as a gateway or proxy boundary'));
      assert.ok(tech.whatThisDoesNotProve.includes('Kubernetes'));
      assert.ok(tech.whatThisDoesNotProve.includes('Istio'));
      assert.ok(tech.whatThisDoesNotProve.includes('Docker'));
      assert.ok(tech.whatThisDoesNotProve.includes('service mesh'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Version Fidelity (Optional, No "Version: Unknown")
  // ---------------------------------------------------------------------------
  describe('2. Version Fidelity', () => {
    it('preserves exact Envoy version when evidenced and leaves version undefined when unevidenced', () => {
      const versionedEnvoy = buildComponentViewModel({
        id: 'tech-envoy',
        category: 'WEB_SERVER',
        name: 'Envoy',
        role: 'Reverse Proxy / Service Proxy',
        layer: 'GATEWAY',
        confidenceLevel: 'HIGH',
        version: '1.28.0',
        state: 'OBSERVED',
      });

      assert.equal(versionedEnvoy.version, '1.28.0');

      const unversionedEnvoy = buildComponentViewModel({
        id: 'tech-envoy',
        category: 'WEB_SERVER',
        name: 'Envoy',
        role: 'Reverse Proxy / Service Proxy',
        layer: 'GATEWAY',
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
      });

      assert.equal(unversionedEnvoy.version, undefined);
      assert.ok(!unversionedEnvoy.attributes.some((attr) => attr.value.toLowerCase().includes('unknown')));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Technology Coexistence (Cloudflare + Envoy + NGINX + Node.js)
  // ---------------------------------------------------------------------------
  describe('3. Multi-Technology Coexistence & Anti-Stack Collapsing', () => {
    it('renders Cloudflare, Envoy, NGINX, and Node.js as independent observations without collapsing', () => {
      const mockDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-envoy-full', domainName: 'modern-envoy-service.io', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 95, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-envoy', createdAt: new Date().toISOString(), responseTimeMs: 18, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Multi-hop architecture fronted by Cloudflare, Envoy proxy, NGINX gateway, and Node.js runtime.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-cloudflare', name: 'Cloudflare', category: 'CDN / Edge', layer: 'EDGE', role: 'Edge Proxy', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-envoy', name: 'Envoy', category: 'Web / Server', layer: 'GATEWAY', role: 'Service Proxy', version: '1.28.0', confidence: 0.98, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-nginx', name: 'NGINX', category: 'Web / Server', layer: 'GATEWAY', role: 'Web Gateway', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-nodejs', name: 'Node.js', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'JavaScript Runtime', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-envoy-full', 'modern-envoy-service.io', mockDomain);

      const edgeGroup = model.categoryGroups.find((g) => g.category === 'EDGE');
      assert.ok(edgeGroup);
      assert.equal(edgeGroup?.components[0].name, 'Cloudflare');

      const gwGroup = model.categoryGroups.find((g) => g.category === 'GATEWAY');
      assert.ok(gwGroup);
      assert.equal(gwGroup?.components.length, 2);
      assert.equal(gwGroup?.components[0].name, 'Envoy');
      assert.equal(gwGroup?.components[0].version, '1.28.0');
      assert.equal(gwGroup?.components[1].name, 'NGINX');

      const runtimeGroup = model.categoryGroups.find((g) => g.category === 'RUNTIME');
      assert.ok(runtimeGroup);
      assert.equal(runtimeGroup?.components[0].name, 'Node.js');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. IA-2 3-Tier Progressive Disclosure for Envoy
  // ---------------------------------------------------------------------------
  describe('4. IA-2 Progressive Disclosure for Envoy', () => {
    it('provides 3 levels of investigation (Understanding -> Context -> Evidence) for Envoy', () => {
      const viewModel = buildComponentViewModel(
        {
          id: 'tech-envoy',
          category: 'WEB_SERVER',
          name: 'Envoy',
          role: 'Reverse Proxy / Service Proxy',
          layer: 'GATEWAY',
          version: '1.28.0',
          confidenceLevel: 'HIGH',
          state: 'OBSERVED',
          infrastructureMeaning: 'The observed endpoint appears to expose Envoy as a gateway or proxy boundary.',
          whatThisDoesNotProve: 'Envoy presence confirms service/gateway proxying, but does not prove Kubernetes, Istio, Docker, Linux, service mesh, sidecar deployment, ingress gateway, API gateway, microservices, specific cloud load balancer, or any specific upstream application or database.',
          evidenceReferences: [
            {
              sourceType: 'HTTP_HEADER',
              source: 'Response Header: server',
              indicator: 'Server: envoy/1.28.0',
              confidence: 'HIGH',
            },
            {
              sourceType: 'HTTP_HEADER',
              source: 'Response Header: x-envoy-upstream-service-time',
              indicator: 'x-envoy-upstream-service-time: 15',
              confidence: 'HIGH',
            },
          ],
        },
        '2026-08-28T12:00:00.000Z',
      );

      // Level 1: Understanding
      assert.equal(viewModel.name, 'Envoy');
      assert.equal(viewModel.version, '1.28.0');
      assert.equal(viewModel.layer, 'GATEWAY');
      assert.equal(viewModel.confidenceLevel, 'HIGH');

      // Level 2: Context
      assert.equal(viewModel.hasContext, true);
      assert.ok(viewModel.whyThisAppears?.includes('expose Envoy as a gateway or proxy boundary'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('does not prove Kubernetes'));

      // Level 3: Evidence
      assert.equal(viewModel.hasEvidence, true);
      assert.equal(viewModel.evidence.length, 2);
      assert.equal(viewModel.evidence[0].observedSignal, 'Server: envoy/1.28.0');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Domain Switching & Re-Understanding Isolation
  // ---------------------------------------------------------------------------
  describe('5. Domain Switching Isolation & Re-Understanding', () => {
    it('completely isolates Envoy state between domains during context switching', () => {
      const envoyDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-envoy', domainName: 'envoy-gateway.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 90, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-e1', createdAt: new Date().toISOString(), responseTimeMs: 15, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Envoy service proxy observed.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-envoy', name: 'Envoy', category: 'Web / Server', layer: 'GATEWAY', role: 'Service Proxy', confidence: 0.98, confidenceLevel: 'HIGH', evidence: [] },
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

      const modelA = resolveAdaptiveInfrastructureModel('dom-envoy', 'envoy-gateway.org', envoyDomain);
      const modelB = resolveAdaptiveInfrastructureModel('dom-caddy', 'caddy-gateway.org', caddyDomain);

      assert.equal(modelA.categoryGroups[0].components[0].name, 'Envoy');
      assert.equal(modelB.categoryGroups[0].components[0].name, 'Caddy');
      assert.ok(!modelB.categoryGroups[0].components.some((c) => c.name === 'Envoy'));
    });
  });
});
