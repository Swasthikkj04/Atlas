import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel, type AdaptiveInfrastructureComponent } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('T29: Modern Ingress Gateway (Caddy & Traefik) Vertical UI Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. Component-Specific Semantic Layer Mapping (Caddy & Traefik -> GATEWAY)
  // ---------------------------------------------------------------------------
  describe('1. Component-Specific Semantic Layer Mapping', () => {
    it('maps Caddy and Traefik to GATEWAY without conflation or automatic container inference', () => {
      const overview: DomainOverviewResponseDto = {
        domain: {
          id: 'dom-caddy-traefik',
          domainName: 'ingress.cloudnative.io',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        discovery: {
          dns: { authoritativeServers: ['ns1.example.com'], recordCounts: { a: 1, cname: 0 } },
          http: { reachable: true, statusCode: 200, responseTimeMs: 25 },
        },
        infrastructure: {
          cdn: 'Fastly',
          webServer: 'Caddy/v2.7.6',
          technologyArchitecture: {
            architectureSummary:
              'The public endpoint is fronted by Fastly edge forwarding to Caddy ingress gateway and Node.js runtime.',
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
                technologyId: 'tech-caddy',
                technologyName: 'Caddy',
                role: 'Web Server / Ingress Gateway',
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
                    technologyId: 'tech-caddy',
                    name: 'Caddy',
                    category: 'Web / Server',
                    layer: 'GATEWAY',
                    role: 'Web Server / Ingress Gateway',
                    version: '2.7.6',
                    infrastructureMeaning:
                      'The public endpoint appears to use Caddy as an ingress web server and reverse proxy with automatic TLS management.',
                    whyDetected: 'Observed Server: Caddy/v2.7.6',
                    whatThisDoesNotProve:
                      'Caddy web server evidence confirms ingress gateway and automated TLS termination, but does not prove containerization (Docker, Podman), orchestration (Kubernetes), origin hosting (AWS, Azure, GCP, private VPS), Go application runtime, or backend database services without direct independent evidence.',
                    confidence: 0.99,
                    confidenceLevel: 'HIGH',
                    evidence: [
                      {
                        sourceType: 'HTTP',
                        source: 'Response Header: server',
                        indicator: 'Server: Caddy/v2.7.6',
                        observedValue: 'Caddy/v2.7.6',
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
                    layer: 'RUNTIME',
                    role: 'Application Runtime',
                    confidence: 0.95,
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
                technologyId: 'tech-caddy',
                name: 'Caddy',
                category: 'Web / Server',
                layer: 'GATEWAY',
                role: 'Web Server / Ingress Gateway',
                version: '2.7.6',
              },
              {
                technologyId: 'tech-nodejs',
                name: 'Node.js',
                category: 'Infrastructure Runtime',
                layer: 'RUNTIME',
                role: 'Application Runtime',
              },
            ],
            integrations: [],
            knownUnknowns: [
              {
                dimension: 'Container Orchestration & Runtime',
                status: 'UNOBSERVED',
                rationale: 'No Docker, Kubernetes, or container runtime wire signatures directly observed.',
              },
            ],
            claimBoundaries: [
              {
                technologyId: 'tech-caddy',
                technologyName: 'Caddy',
                boundary: 'Caddy confirms ingress gateway but does not prove Docker or Kubernetes containerization.',
              },
            ],
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-caddy-traefik', 'ingress.cloudnative.io', overview);
      assert.ok(model.hasObservedInfrastructure);

      // Verify category groups
      const gatewayGroup = model.categoryGroups.find((g) => g.category === 'GATEWAY');
      assert.ok(gatewayGroup, 'GATEWAY category group must be present');
      assert.equal(gatewayGroup.label, 'Web Gateway & Reverse Proxy');

      const caddyComp = gatewayGroup.components.find((c) => c.name === 'Caddy' || c.id === 'tech-caddy');
      assert.ok(caddyComp, 'Caddy component must be present in GATEWAY');
      assert.equal(caddyComp.name, 'Caddy');
      assert.equal(caddyComp.version, '2.7.6');

      // Verify known unknowns: Containerization remains unobserved
      const unobserved = model.unobservedDimensions;
      assert.ok(
        unobserved.some((u) => String(u.dimension).includes('Container') && u.status === 'UNOBSERVED'),
        'Container orchestration must be explicitly unobserved',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Progressive Disclosure (Level 1, Level 2, Level 3)
  // ---------------------------------------------------------------------------
  describe('2. Progressive Disclosure (Level 1, Level 2, Level 3)', () => {
    it('constructs Level 1, 2, and 3 view models for Traefik with version fidelity and no hallucinations', () => {
      const rawTraefik: AdaptiveInfrastructureComponent = {
        id: 'tech-traefik',
        category: 'GATEWAY',
        name: 'Traefik',
        technology: 'Traefik',
        layer: 'GATEWAY',
        role: 'Ingress Gateway / Reverse Proxy',
        version: '2.10.4',
        infrastructureMeaning:
          'The public endpoint appears to use Traefik as an edge router and ingress reverse proxy for routing traffic to backend services.',
        whyDetected: 'Observed Server: traefik/v2.10.4 and x-traefik-router header',
        whatThisDoesNotProve:
          'Traefik ingress gateway evidence confirms reverse proxy routing and traffic management, but does not prove orchestration (Kubernetes, Docker Swarm, Nomad), container runtime (Docker, containerd), origin cloud hosting (AWS, Azure, GCP), microservice architecture, or backend database services without direct independent evidence.',
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
        evidenceReferences: [
          {
            sourceType: 'HTTP',
            source: 'Response Header: server',
            indicator: 'Server: traefik/v2.10.4',
            observedValue: 'traefik/v2.10.4',
            confidence: 'HIGH',
          },
          {
            sourceType: 'HTTP',
            source: 'Response Header: x-traefik-router',
            indicator: 'x-traefik-router: api@file',
            observedValue: 'api@file',
            confidence: 'HIGH',
          },
        ],
      };

      const viewModel = buildComponentViewModel(rawTraefik, 'ingress.cloudnative.io');

      // Level 1: Primary Summary
      assert.equal(viewModel.name, 'Traefik');
      assert.equal(viewModel.role, 'Ingress Gateway / Reverse Proxy');
      assert.equal(viewModel.version, '2.10.4');
      assert.equal(viewModel.confidenceLevel, 'HIGH');
      assert.notEqual(viewModel.version, 'Unknown');
      assert.notEqual(viewModel.version, 'Version: Unknown');

      // Level 2: Expanded Details
      assert.ok(viewModel.whyThisAppears?.includes('Traefik'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('Kubernetes'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('Docker'));

      // Level 3: Evidence Lineage
      assert.equal(viewModel.evidence.length, 2);
      assert.equal(viewModel.evidence[0].sourceDescription, 'Response Header: server');
      assert.equal(viewModel.evidence[0].observedValue, 'traefik/v2.10.4');
      assert.equal(viewModel.evidence[1].sourceDescription, 'Response Header: x-traefik-router');
      assert.equal(viewModel.evidence[1].observedValue, 'api@file');
    });

    it('does not emit "Version: Unknown" when Caddy is unversioned', () => {
      const rawCaddyUnversioned: AdaptiveInfrastructureComponent = {
        id: 'tech-caddy',
        category: 'GATEWAY',
        name: 'Caddy',
        technology: 'Caddy',
        layer: 'GATEWAY',
        role: 'Web Server / Ingress Gateway',
        version: undefined,
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
        evidenceReferences: [],
      };

      const viewModel = buildComponentViewModel(rawCaddyUnversioned, 'caddy.dev');
      assert.equal(viewModel.version, undefined);
      assert.notEqual(viewModel.version, 'Unknown');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Technology Coexistence in GATEWAY Layer
  // ---------------------------------------------------------------------------
  describe('3. Multi-Technology Coexistence in GATEWAY Layer', () => {
    it('coexists Traefik + Envoy in GATEWAY layer without collision', () => {
      const multiGatewayOverview: DomainOverviewResponseDto = {
        domain: {
          id: 'dom-multi-gw',
          domainName: 'gateway.internal.net',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        discovery: {
          dns: { authoritativeServers: ['ns1.internal.net'], recordCounts: { a: 1, cname: 0 } },
          http: { reachable: true, statusCode: 200, responseTimeMs: 20 },
        },
        infrastructure: {
          webServer: 'traefik/v2.10.4',
          technologyArchitecture: {
            architectureSummary: 'Endpoint uses Traefik ingress and Envoy service proxy.',
            ingressPath: [],
            layers: [
              {
                layer: 'GATEWAY',
                state: 'OBSERVED',
                confidenceLevel: 'HIGH',
                technologies: [
                  {
                    technologyId: 'tech-traefik',
                    name: 'Traefik',
                    category: 'Web / Server',
                    layer: 'GATEWAY',
                    role: 'Ingress Gateway / Reverse Proxy',
                    version: '2.10.4',
                    confidence: 0.99,
                    confidenceLevel: 'HIGH',
                    evidence: [],
                  },
                  {
                    technologyId: 'tech-envoy',
                    name: 'Envoy',
                    category: 'Web / Server',
                    layer: 'GATEWAY',
                    role: 'Service Proxy / Mesh Gateway',
                    version: '1.28.0',
                    confidence: 0.95,
                    confidenceLevel: 'HIGH',
                    evidence: [],
                  },
                ],
              },
            ],
            keyTechnologies: [
              {
                technologyId: 'tech-traefik',
                name: 'Traefik',
                category: 'Web / Server',
                layer: 'GATEWAY',
                role: 'Ingress Gateway / Reverse Proxy',
                version: '2.10.4',
              },
              {
                technologyId: 'tech-envoy',
                name: 'Envoy',
                category: 'Web / Server',
                layer: 'GATEWAY',
                role: 'Service Proxy / Mesh Gateway',
                version: '1.28.0',
              },
            ],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-multi-gw', 'gateway.internal.net', multiGatewayOverview);
      const gatewayGroup = model.categoryGroups.find((g) => g.category === 'GATEWAY');
      assert.ok(gatewayGroup);
      assert.equal(gatewayGroup.components.length, 2);

      const names = gatewayGroup.components.map((c) => c.name);
      assert.ok(names.includes('Traefik'));
      assert.ok(names.includes('Envoy'));
    });
  });
});
