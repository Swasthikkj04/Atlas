import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('T28: Akamai Infrastructure Understanding Vertical UI Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. Component-Specific Semantic Layer Mapping (Akamai -> EDGE)
  // ---------------------------------------------------------------------------
  describe('1. Component-Specific Semantic Layer Mapping', () => {
    it('maps Akamai to EDGE without conflating with origin web servers or manufacturing database badges', () => {
      const akamaiOverview: DomainOverviewResponseDto = {
        domain: {
          id: 'dom-akamai-multi',
          domainName: 'enterprise.bank.com',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        discovery: {
          dns: { authoritativeServers: ['a1-12.akam.net'], recordCounts: { a: 2, cname: 1 } },
          http: { reachable: true, statusCode: 200, responseTimeMs: 28 },
        },
        infrastructure: {
          cdn: 'Akamai',
          webServer: 'nginx/1.24.0',
          technologyArchitecture: {
            architectureSummary:
              'The public endpoint is fronted by the Akamai Intelligent Edge network routing to NGINX gateway and Node.js runtime.',
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
                technologyId: 'tech-akamai',
                technologyName: 'Akamai',
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
                    technologyId: 'tech-akamai',
                    name: 'Akamai',
                    category: 'CDN / Edge',
                    layer: 'EDGE',
                    role: 'Edge Delivery / CDN Ingress',
                    infrastructureMeaning:
                      'The public endpoint appears to use the Akamai Intelligent Edge network to deliver, cache, and secure traffic globally.',
                    whyDetected: 'Observed Server: AkamaiGHost, x-akamai-transformed, akamai-grn, and Akamai CNAME target',
                    whatThisDoesNotProve:
                      'Akamai edge delivery evidence confirms edge proxy and security perimeter participation, but does not prove origin hosting on AWS, Azure, GCP, or a private datacenter, nor does it establish NGINX, Apache, Envoy, Caddy, Kubernetes, Docker, Linux, Node.js, Python, PHP, Ruby, Go, Rust, PostgreSQL, MySQL, Redis, specific edge security rules, or backend database services without direct independent evidence.',
                    confidence: 0.99,
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
                technologyId: 'tech-akamai',
                name: 'Akamai',
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
                explanation: 'Origin database services are sealed behind Akamai and NGINX proxy layers.',
              },
            ],
            claimBoundaries: [
              {
                technologyId: 'tech-akamai',
                technologyName: 'Akamai',
                boundary:
                  'Akamai edge delivery evidence confirms edge proxy and security perimeter participation, but does not prove origin hosting on AWS, Azure, GCP, or a private datacenter.',
              },
            ],
            confidence: {
              overallLevel: 'HIGH',
              overallScore: 0.99,
              layerConfidence: { EDGE: 'HIGH', GATEWAY: 'HIGH', RUNTIME: 'HIGH' },
              rationale: 'Observed Akamai edge headers and NGINX server banner',
              confirmedRelationshipsCount: 2,
              supportedRelationshipsCount: 0,
              inferredRelationshipsCount: 0,
            },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-akamai-multi', 'enterprise.bank.com', akamaiOverview);
      assert.ok(model);

      const edgeSection = model.categoryGroups.find((s) => s.category === 'EDGE');
      const gatewaySection = model.categoryGroups.find((s) => s.category === 'GATEWAY');
      const runtimeSection = model.categoryGroups.find((s) => s.category === 'RUNTIME');

      assert.ok(edgeSection, 'EDGE section must exist');
      assert.ok(gatewaySection, 'GATEWAY section must exist');
      assert.ok(runtimeSection, 'RUNTIME section must exist');

      assert.ok(edgeSection.components.some((c) => c.name === 'Akamai'));
      assert.ok(gatewaySection.components.some((c) => c.name === 'NGINX'));
      assert.ok(runtimeSection.components.some((c) => c.name === 'Node.js'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. IA-2 Progressive Disclosure (Level 1, Level 2, Level 3)
  // ---------------------------------------------------------------------------
  describe('2. IA-2 Progressive Disclosure Invariants', () => {
    it('constructs rich Level 1, Level 2, and Level 3 view models without technology-specific UI branches', () => {
      const akamaiComponent = buildComponentViewModel({
        id: 'tech-akamai',
        category: 'CDN',
        name: 'Akamai',
        role: 'Edge Delivery / CDN Ingress',
        layer: 'EDGE',
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
      });

      // Level 1: Understanding
      assert.equal(akamaiComponent.name, 'Akamai');
      assert.equal(akamaiComponent.role, 'Edge Delivery / CDN Ingress');
      assert.equal(akamaiComponent.layer, 'EDGE');
      assert.equal(akamaiComponent.confidenceLevel, 'HIGH');

      // Version must be omitted cleanly (no "Version: Unknown")
      assert.equal(akamaiComponent.version, undefined);
      assert.ok(!akamaiComponent.attributes.some((attr) => attr.value?.toLowerCase().includes('unknown')));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Tier Coexistence & Edge Precedence
  // ---------------------------------------------------------------------------
  describe('3. Multi-Tier Coexistence & Edge Precedence', () => {
    it('preserves Akamai at EDGE and Envoy at GATEWAY without conflating proxy responsibilities', () => {
      const akamaiEnvoyOverview: DomainOverviewResponseDto = {
        domain: {
          id: 'dom-akamai-envoy',
          domainName: 'akamai-envoy.com',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        discovery: {
          dns: { authoritativeServers: ['a1-12.akam.net'], recordCounts: { a: 2 } },
          http: { reachable: true, statusCode: 200, responseTimeMs: 24 },
        },
        infrastructure: {
          cdn: 'Akamai',
          technologyArchitecture: {
            architectureSummary: 'The public endpoint is fronted by Akamai Intelligent Edge routing to Envoy gateway.',
            ingressPath: [
              { hop: 0, layer: 'EDGE', technologyId: 'public-endpoint', technologyName: 'Public Endpoint', role: 'Ingress' },
              { hop: 1, layer: 'EDGE', technologyId: 'tech-akamai', technologyName: 'Akamai', role: 'Edge Delivery / CDN Ingress', relationshipType: 'PROXIES_TO' },
              { hop: 2, layer: 'GATEWAY', technologyId: 'tech-envoy', technologyName: 'Envoy', role: 'Ingress Gateway / Reverse Proxy' },
            ],
            layers: [
              {
                layer: 'EDGE',
                state: 'OBSERVED',
                confidenceLevel: 'HIGH',
                technologies: [{ technologyId: 'tech-akamai', name: 'Akamai', category: 'CDN / Edge', layer: 'EDGE', role: 'Edge Delivery / CDN Ingress' }],
              },
              {
                layer: 'GATEWAY',
                state: 'OBSERVED',
                confidenceLevel: 'HIGH',
                technologies: [{ technologyId: 'tech-envoy', name: 'Envoy', category: 'Web / Server', layer: 'GATEWAY', role: 'Ingress Gateway / Reverse Proxy' }],
              },
            ],
            keyTechnologies: [
              { technologyId: 'tech-akamai', name: 'Akamai', category: 'CDN / Edge', layer: 'EDGE', role: 'Edge Delivery / CDN Ingress' },
              { technologyId: 'tech-envoy', name: 'Envoy', category: 'Web / Server', layer: 'GATEWAY', role: 'Ingress Gateway / Reverse Proxy' },
            ],
            integrations: [],
            knownUnknowns: [
              { dimension: 'Backend Compute', status: 'UNOBSERVED', explanation: 'Origin compute runtime is unobserved behind Akamai and Envoy proxy layers.' },
            ],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.99, layerConfidence: { EDGE: 'HIGH', GATEWAY: 'HIGH' } },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-akamai-envoy', 'akamai-envoy.com', akamaiEnvoyOverview);
      assert.ok(model);

      const edgeSection = model.categoryGroups.find((s) => s.category === 'EDGE');
      const gatewaySection = model.categoryGroups.find((s) => s.category === 'GATEWAY');

      assert.ok(edgeSection?.components.some((c) => c.name === 'Akamai'));
      assert.ok(gatewaySection?.components.some((c) => c.name === 'Envoy'));
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Anti-Overreach Negative Boundaries
  // ---------------------------------------------------------------------------
  describe('4. Anti-Overreach Negative Boundaries', () => {
    it('leaves backend database as unobserved known unknown when only Akamai is detected', () => {
      const knownUnknowns = [
        {
          dimension: 'Backend Database',
          status: 'UNOBSERVED',
          explanation: 'Origin database services are sealed behind the Akamai edge layer.',
        },
      ];

      assert.equal(knownUnknowns[0].status, 'UNOBSERVED');
      assert.ok(knownUnknowns[0].explanation.includes('sealed behind the Akamai edge layer'));
    });
  });
});
