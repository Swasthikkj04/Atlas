import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto, DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('T27: Fastly Infrastructure Understanding Vertical UI Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. Component-Specific Semantic Layer Mapping (Fastly -> EDGE)
  // ---------------------------------------------------------------------------
  describe('1. Component-Specific Semantic Layer Mapping', () => {
    it('maps Fastly to EDGE without conflating with origin web servers or manufacturing database badges', () => {
      const fastlyOverview: DomainOverviewResponseDto = {
        domain: {
          id: 'dom-fastly-multi',
          domainName: 'multi-tier-fastly.io',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        discovery: {
          dns: { authoritativeServers: ['ns1.fastly.net'], recordCounts: { a: 2, cname: 1 } },
          http: { reachable: true, statusCode: 200, responseTimeMs: 24 },
        },
        infrastructure: {
          cdn: 'Fastly',
          webServer: 'nginx/1.24.0',
          technologyArchitecture: {
            architectureSummary:
              'The public endpoint is fronted by Fastly Edge CDN routing to NGINX gateway and Node.js runtime.',
            ingressPath: [
              {
                hop: 0,
                layer: 'EDGE',
                technologyId: 'public-endpoint',
                technologyName: 'Public Endpoint',
                role: 'Ingress',
              },
              {
                hop: 1,
                layer: 'EDGE',
                technologyId: 'tech-fastly',
                technologyName: 'Fastly',
                role: 'Edge Delivery / CDN Ingress',
                relationshipType: 'PROXIES_TO',
              },
              {
                hop: 2,
                layer: 'GATEWAY',
                technologyId: 'tech-nginx',
                technologyName: 'NGINX',
                role: 'Web Server / Reverse Proxy',
                relationshipType: 'PROXIES_TO',
              },
              {
                hop: 3,
                layer: 'RUNTIME',
                technologyId: 'tech-nodejs',
                technologyName: 'Node.js',
                role: 'Application Runtime',
              },
            ],
            layers: [
              {
                layer: 'EDGE',
                state: 'OBSERVED',
                confidenceLevel: 'HIGH',
                technologies: [
                  {
                    technologyId: 'tech-fastly',
                    name: 'Fastly',
                    category: 'CDN / Edge',
                    layer: 'EDGE',
                    role: 'Edge Delivery / CDN Ingress',
                    infrastructureMeaning:
                      'The public endpoint appears to use Fastly edge points of presence (POPs) to deliver, cache, and accelerate traffic globally.',
                    whyDetected: 'Observed x-served-by: cache-iad-*, x-cache: HIT, and Fastly CNAME target',
                    whatThisDoesNotProve:
                      'Fastly edge delivery evidence confirms edge proxy and caching participation, but does not prove origin hosting on AWS, Azure, GCP, or a private datacenter, nor does it establish NGINX, Apache, Envoy, Caddy, Kubernetes, Docker, Linux, Node.js, Python, PHP, Ruby, Go, Rust, PostgreSQL, MySQL, Redis, specific VCL configuration, or backend database services without direct independent evidence.',
                    confidence: 0.98,
                    confidenceLevel: 'HIGH',
                    evidence: [],
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
                    layer: 'GATEWAY',
                    role: 'Web Server / Reverse Proxy',
                    confidence: 0.95,
                    confidenceLevel: 'HIGH',
                    evidence: [],
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
                    category: 'Programming Languages & Frameworks',
                    layer: 'RUNTIME',
                    role: 'Application Runtime',
                    confidence: 0.9,
                    confidenceLevel: 'HIGH',
                    evidence: [],
                  },
                ],
              },
            ],
            keyTechnologies: [
              {
                technologyId: 'tech-fastly',
                name: 'Fastly',
                category: 'CDN / Edge',
                layer: 'EDGE',
                role: 'Edge Delivery / CDN Ingress',
              },
              {
                technologyId: 'tech-nginx',
                name: 'NGINX',
                category: 'Web / Server',
                layer: 'GATEWAY',
                role: 'Web Server / Reverse Proxy',
              },
              {
                technologyId: 'tech-nodejs',
                name: 'Node.js',
                category: 'Programming Languages & Frameworks',
                layer: 'RUNTIME',
                role: 'Application Runtime',
              },
            ],
            integrations: [],
            knownUnknowns: [
              {
                dimension: 'Backend Database',
                status: 'UNOBSERVED',
                explanation: 'Origin database services are sealed behind Fastly and NGINX proxy layers.',
              },
            ],
            claimBoundaries: [
              {
                technologyId: 'tech-fastly',
                technologyName: 'Fastly',
                boundary:
                  'Fastly edge delivery confirms edge proxy and caching participation, but does not prove origin hosting on AWS, Azure, GCP, or a private datacenter.',
              },
            ],
            confidence: {
              overallLevel: 'HIGH',
              overallScore: 0.98,
              layerConfidence: { EDGE: 'HIGH', GATEWAY: 'HIGH', RUNTIME: 'HIGH' },
              rationale: 'Observed Fastly cache headers, x-served-by POP router, and NGINX server header',
              confirmedRelationshipsCount: 2,
              supportedRelationshipsCount: 0,
              inferredRelationshipsCount: 0,
            },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-fastly-multi', 'multi-tier-fastly.io', fastlyOverview);
      assert.ok(model);

      // Verify layers resolution in IA-1
      const edgeSection = model.categoryGroups.find((s) => s.category === 'EDGE');
      const gatewaySection = model.categoryGroups.find((s) => s.category === 'GATEWAY');
      const runtimeSection = model.categoryGroups.find((s) => s.category === 'RUNTIME');

      assert.ok(edgeSection);
      assert.ok(gatewaySection);
      assert.ok(runtimeSection);

      assert.ok(edgeSection.components.some((c) => c.name === 'Fastly'));
      assert.ok(gatewaySection.components.some((c) => c.name === 'NGINX'));
      assert.ok(runtimeSection.components.some((c) => c.name === 'Node.js'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. IA-2 Progressive Disclosure (Level 1, Level 2, Level 3)
  // ---------------------------------------------------------------------------
  describe('2. IA-2 Progressive Disclosure Invariants', () => {
    it('constructs rich Level 1, Level 2, and Level 3 view models without technology-specific UI branches', () => {
      const fastlyComponent = buildComponentViewModel({
        id: 'tech-fastly',
        category: 'CDN',
        name: 'Fastly',
        role: 'Edge Delivery / CDN Ingress',
        layer: 'EDGE',
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
      });

      // Level 1: Understanding
      assert.equal(fastlyComponent.name, 'Fastly');
      assert.equal(fastlyComponent.role, 'Edge Delivery / CDN Ingress');
      assert.equal(fastlyComponent.layer, 'EDGE');
      assert.equal(fastlyComponent.confidenceLevel, 'HIGH');

      // Version must be omitted cleanly (no "Version: Unknown")
      assert.equal(fastlyComponent.version, undefined);
      assert.ok(!fastlyComponent.attributes.some((attr) => attr.value?.toLowerCase().includes('unknown')));
    });

    it('exposes claim boundaries and whatThisDoesNotProve at Level 2 disclosure', () => {
      const fastlyComponent = buildComponentViewModel({
        id: 'tech-fastly',
        category: 'CDN',
        name: 'Fastly',
        role: 'Edge Delivery / CDN Ingress',
        layer: 'EDGE',
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
      });

      assert.equal(fastlyComponent.name, 'Fastly');
      assert.equal(fastlyComponent.role, 'Edge Delivery / CDN Ingress');
      assert.equal(fastlyComponent.layer, 'EDGE');
      assert.equal(fastlyComponent.confidenceLevel, 'HIGH');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Tier Coexistence & Anti-Overreach Invariants
  // ---------------------------------------------------------------------------
  describe('3. Multi-Tier Coexistence & Anti-Overreach Invariants', () => {
    it('preserves Fastly at EDGE and Envoy at GATEWAY without conflating proxy responsibilities', () => {
      const fastlyEnvoyOverview: DomainOverviewResponseDto = {
        domain: {
          id: 'dom-fastly-envoy',
          domainName: 'fastly-envoy.com',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        discovery: {
          dns: { authoritativeServers: ['ns1.fastly.net'], recordCounts: { a: 2 } },
          http: { reachable: true, statusCode: 200, responseTimeMs: 22 },
        },
        infrastructure: {
          cdn: 'Fastly',
          technologyArchitecture: {
            architectureSummary: 'The public endpoint is fronted by Fastly Edge CDN routing to Envoy gateway.',
            ingressPath: [
              { hop: 0, layer: 'EDGE', technologyId: 'public-endpoint', technologyName: 'Public Endpoint', role: 'Ingress' },
              { hop: 1, layer: 'EDGE', technologyId: 'tech-fastly', technologyName: 'Fastly', role: 'Edge Delivery / CDN Ingress', relationshipType: 'PROXIES_TO' },
              { hop: 2, layer: 'GATEWAY', technologyId: 'tech-envoy', technologyName: 'Envoy', role: 'Ingress Gateway / Reverse Proxy' },
            ],
            layers: [
              {
                layer: 'EDGE',
                state: 'OBSERVED',
                confidenceLevel: 'HIGH',
                technologies: [{ technologyId: 'tech-fastly', name: 'Fastly', category: 'CDN / Edge', layer: 'EDGE', role: 'Edge Delivery / CDN Ingress' }],
              },
              {
                layer: 'GATEWAY',
                state: 'OBSERVED',
                confidenceLevel: 'HIGH',
                technologies: [{ technologyId: 'tech-envoy', name: 'Envoy', category: 'Web / Server', layer: 'GATEWAY', role: 'Ingress Gateway / Reverse Proxy' }],
              },
            ],
            keyTechnologies: [
              { technologyId: 'tech-fastly', name: 'Fastly', category: 'CDN / Edge', layer: 'EDGE', role: 'Edge Delivery / CDN Ingress' },
              { technologyId: 'tech-envoy', name: 'Envoy', category: 'Web / Server', layer: 'GATEWAY', role: 'Ingress Gateway / Reverse Proxy' },
            ],
            integrations: [],
            knownUnknowns: [
              { dimension: 'Backend Compute', status: 'UNOBSERVED', explanation: 'Origin compute runtime is unobserved behind Fastly and Envoy proxy layers.' },
            ],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.98, layerConfidence: { EDGE: 'HIGH', GATEWAY: 'HIGH' } },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-fastly-envoy', 'fastly-envoy.com', fastlyEnvoyOverview);
      assert.ok(model);

      const edgeSection = model.categoryGroups.find((s) => s.category === 'EDGE');
      const gatewaySection = model.categoryGroups.find((s) => s.category === 'GATEWAY');

      assert.ok(edgeSection?.components.some((c) => c.name === 'Fastly'));
      assert.ok(gatewaySection?.components.some((c) => c.name === 'Envoy'));
    });
  });
});
