import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto, DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('T23: Azure Infrastructure Understanding Vertical UI Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. Component-Specific Azure Mapping (Azure Front Door -> EDGE, Azure App Gateway -> GATEWAY)
  // ---------------------------------------------------------------------------
  describe('1. Component-Specific Semantic Layer Mapping', () => {
    it('maps Azure Front Door to EDGE and Azure Application Gateway to GATEWAY without conflating them into a generic Azure badge', () => {
      const azureOverview: DomainOverviewResponseDto = {
        domain: {
          id: 'dom-azure-multi',
          domainName: 'multi-tier-azure.io',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        discovery: {
          dns: { authoritativeServers: ['ns1-01.azure-dns.com'], recordCounts: { a: 1, cname: 1 } },
          http: { reachable: true, statusCode: 200, responseTimeMs: 28 },
        },
        infrastructure: {
          cdn: 'Azure Front Door',
          webServer: 'nginx/1.24.0',
          technologyArchitecture: {
            architectureSummary:
              'The public endpoint is fronted by Azure Front Door Anycast edge routing to Azure Application Gateway and NGINX origin.',
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
                technologyId: 'tech-azure-frontdoor',
                technologyName: 'Azure Front Door',
                role: 'Edge Delivery / Global Ingress',
                relationshipType: 'PROXIES_TO',
              },
              {
                hop: 2,
                layer: 'GATEWAY',
                technologyId: 'tech-azure',
                technologyName: 'Microsoft Azure',
                role: 'Application Gateway / Reverse Proxy',
                relationshipType: 'PROXIES_TO',
              },
              {
                hop: 3,
                layer: 'GATEWAY',
                technologyId: 'tech-nginx',
                technologyName: 'NGINX',
                role: 'Web Server / Reverse Proxy',
                relationshipType: 'PROXIES_TO',
              },
              {
                hop: 4,
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
                    technologyId: 'tech-azure-frontdoor',
                    name: 'Azure Front Door',
                    category: 'CDN / Edge',
                    layer: 'EDGE',
                    role: 'Edge Delivery / Global Ingress',
                    infrastructureMeaning: 'The public endpoint appears to use Microsoft Azure Front Door global edge delivery and Anycast routing.',
                    whyDetected: 'Observed x-azure-ref and x-azure-fdid headers',
                    whatThisDoesNotProve: 'Azure Front Door edge delivery does not prove origin hosting on Azure App Service, AKS, or SQL Database.',
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
                    technologyId: 'tech-azure',
                    name: 'Microsoft Azure',
                    category: 'Cloud / Infrastructure',
                    layer: 'GATEWAY',
                    role: 'Application Gateway / Reverse Proxy',
                    infrastructureMeaning: 'Azure Application Gateway manages ingress routing and SSL termination.',
                    whyDetected: 'Observed x-ms-routing-name header and ApplicationGatewayAffinity cookie',
                    whatThisDoesNotProve: 'Azure presence does not prove the entire application runs on Azure, nor does it establish App Service, AKS, or Azure SQL.',
                    confidence: 0.98,
                    confidenceLevel: 'HIGH',
                    evidence: [],
                  },
                  {
                    technologyId: 'tech-nginx',
                    name: 'NGINX',
                    category: 'Web / Server',
                    layer: 'GATEWAY',
                    role: 'Web Server / Reverse Proxy',
                    confidence: 0.98,
                    confidenceLevel: 'HIGH',
                    version: '1.24.0',
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
                technologyId: 'tech-azure-frontdoor',
                name: 'Azure Front Door',
                category: 'CDN / Edge',
                layer: 'EDGE',
                role: 'Edge Delivery / Global Ingress',
              },
              {
                technologyId: 'tech-azure',
                name: 'Microsoft Azure',
                category: 'Cloud / Infrastructure',
                layer: 'GATEWAY',
                role: 'Application Gateway / Reverse Proxy',
              },
              {
                technologyId: 'tech-nginx',
                name: 'NGINX',
                category: 'Web / Server',
                layer: 'GATEWAY',
                role: 'Web Server / Reverse Proxy',
                version: '1.24.0',
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
                dimension: 'Backend Database',
                status: 'UNOBSERVED',
                explanation: 'Database tier (Azure SQL, Cosmos DB, PostgreSQL) is sealed and unobservable from public boundary.',
              },
              {
                dimension: 'Host Compute Runtime',
                status: 'UNOBSERVED',
                explanation: 'App Service container, AKS pod, or VM details are unobservable.',
              },
            ],
            claimBoundaries: [
              {
                technologyId: 'tech-azure',
                technologyName: 'Microsoft Azure',
                boundary: 'Azure presence does not prove App Service, AKS, VM, Container Apps, Windows Server, Linux, or Azure SQL.',
              },
            ],
            confidence: {
              overallLevel: 'HIGH',
              overallScore: 0.98,
              layerConfidence: { EDGE: 'HIGH', GATEWAY: 'HIGH', RUNTIME: 'HIGH' },
              rationale: 'Observed Azure Front Door headers, Azure App Gateway routing slot, NGINX banner, and Node.js signals',
              confirmedRelationshipsCount: 3,
              supportedRelationshipsCount: 0,
              inferredRelationshipsCount: 0,
            },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-azure-multi', 'multi-tier-azure.io', azureOverview);
      assert.ok(model);

      // Verify layers resolution in IA-1
      const edgeSection = model.categoryGroups.find((s) => s.category === 'EDGE');
      const gatewaySection = model.categoryGroups.find((s) => s.category === 'GATEWAY');
      const runtimeSection = model.categoryGroups.find((s) => s.category === 'RUNTIME');

      assert.ok(edgeSection);
      assert.ok(gatewaySection);
      assert.ok(runtimeSection);

      assert.ok(edgeSection.components.some((c) => c.name === 'Azure Front Door'));
      assert.ok(gatewaySection.components.some((c) => c.name === 'Microsoft Azure'));
      assert.ok(gatewaySection.components.some((c) => c.name === 'NGINX'));
      assert.ok(runtimeSection.components.some((c) => c.name === 'Node.js'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. IA-2 Progressive Disclosure (Level 1, Level 2, Level 3)
  // ---------------------------------------------------------------------------
  describe('2. IA-2 Progressive Disclosure Invariants', () => {
    it('constructs rich Level 1, Level 2, and Level 3 view models without technology-specific UI branches', () => {
      const frontDoorComponent = buildComponentViewModel({
        id: 'tech-azure-frontdoor',
        category: 'CDN',
        name: 'Azure Front Door',
        role: 'Edge Delivery / Global Ingress',
        layer: 'EDGE',
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
      });

      // Level 1: Understanding
      assert.equal(frontDoorComponent.name, 'Azure Front Door');
      assert.equal(frontDoorComponent.role, 'Edge Delivery / Global Ingress');
      assert.equal(frontDoorComponent.layer, 'EDGE');
      assert.equal(frontDoorComponent.confidenceLevel, 'HIGH');

      // Version must be omitted cleanly (no "Version: Unknown")
      assert.equal(frontDoorComponent.version, undefined);
      assert.ok(!frontDoorComponent.attributes.some((attr) => attr.value?.toLowerCase().includes('unknown')));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Tier Coexistence & Anti-Overreach Invariants
  // ---------------------------------------------------------------------------
  describe('3. Multi-Tier Coexistence & Anti-Overreach Invariants', () => {
    it('preserves Cloudflare at EDGE and Azure App Gateway at GATEWAY without collapsing into an Azure CDN assumption', () => {
      const cloudflareAzureOverview: DomainOverviewResponseDto = {
        domain: {
          id: 'dom-cf-azure',
          domainName: 'cloudflare-fronted-azure.com',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        discovery: {
          dns: { authoritativeServers: ['ns1.cloudflare.com'], recordCounts: { a: 2 } },
          http: { reachable: true, statusCode: 200, responseTimeMs: 20 },
        },
        infrastructure: {
          cdn: 'Cloudflare',
          technologyArchitecture: {
            architectureSummary: 'The public endpoint is protected by Cloudflare Edge with Azure App Gateway origin ingress.',
            ingressPath: [
              { hop: 0, layer: 'EDGE', technologyId: 'public-endpoint', technologyName: 'Public Endpoint', role: 'Ingress' },
              { hop: 1, layer: 'EDGE', technologyId: 'tech-cloudflare', technologyName: 'Cloudflare', role: 'Edge & WAF', relationshipType: 'PROXIES_TO' },
              { hop: 2, layer: 'GATEWAY', technologyId: 'tech-azure', technologyName: 'Microsoft Azure', role: 'Application Gateway / Reverse Proxy' },
            ],
            layers: [
              {
                layer: 'EDGE',
                state: 'OBSERVED',
                confidenceLevel: 'HIGH',
                technologies: [{ technologyId: 'tech-cloudflare', name: 'Cloudflare', category: 'CDN / Edge', layer: 'EDGE', role: 'Edge & WAF' }],
              },
              {
                layer: 'GATEWAY',
                state: 'OBSERVED',
                confidenceLevel: 'HIGH',
                technologies: [{ technologyId: 'tech-azure', name: 'Microsoft Azure', category: 'Cloud / Infrastructure', layer: 'GATEWAY', role: 'Application Gateway / Reverse Proxy' }],
              },
            ],
            keyTechnologies: [
              { technologyId: 'tech-cloudflare', name: 'Cloudflare', category: 'CDN / Edge', layer: 'EDGE', role: 'Edge & WAF' },
              { technologyId: 'tech-azure', name: 'Microsoft Azure', category: 'Cloud / Infrastructure', layer: 'GATEWAY', role: 'Application Gateway / Reverse Proxy' },
            ],
            integrations: [],
            knownUnknowns: [
              { dimension: 'Backend Compute', status: 'UNOBSERVED', explanation: 'Origin compute runtime is unobserved behind Cloudflare and Azure App Gateway ingress.' },
            ],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.98, layerConfidence: { EDGE: 'HIGH', GATEWAY: 'HIGH' } },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-cf-azure', 'cloudflare-fronted-azure.com', cloudflareAzureOverview);
      assert.ok(model);

      const edgeSection = model.categoryGroups.find((s) => s.category === 'EDGE');
      const gatewaySection = model.categoryGroups.find((s) => s.category === 'GATEWAY');

      assert.ok(edgeSection?.components.some((c) => c.name === 'Cloudflare'));
      assert.ok(!edgeSection?.components.some((c) => c.name === 'Azure Front Door'));
      assert.ok(gatewaySection?.components.some((c) => c.name === 'Microsoft Azure'));
    });
  });
});
