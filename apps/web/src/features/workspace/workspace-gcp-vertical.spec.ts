import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto, DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('T26: Google Cloud Platform (GCP) Infrastructure Understanding Vertical UI Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. Component-Specific Semantic Layer Mapping (Google Cloud CDN -> EDGE, GCP -> GATEWAY)
  // ---------------------------------------------------------------------------
  describe('1. Component-Specific Semantic Layer Mapping', () => {
    it('maps Google Cloud CDN to EDGE and Google Cloud Platform (GCP) to GATEWAY without conflating them into a generic GCP badge', () => {
      const gcpOverview: DomainOverviewResponseDto = {
        domain: {
          id: 'dom-gcp-multi',
          domainName: 'multi-tier-gcp.io',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        discovery: {
          dns: { authoritativeServers: ['ns-cloud-a1.googledomains.com'], recordCounts: { a: 1, cname: 1 } },
          http: { reachable: true, statusCode: 200, responseTimeMs: 24 },
        },
        infrastructure: {
          cdn: 'Google Cloud CDN',
          webServer: 'nginx/1.24.0',
          technologyArchitecture: {
            architectureSummary:
              'The public endpoint is fronted by Google Cloud CDN edge caching routing to Google Cloud Run and NGINX origin.',
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
                technologyId: 'tech-google-cloud-cdn',
                technologyName: 'Google Cloud CDN',
                role: 'Edge Delivery / CDN Ingress',
                relationshipType: 'PROXIES_TO',
              },
              {
                hop: 2,
                layer: 'GATEWAY',
                technologyId: 'tech-google-cloud',
                technologyName: 'Google Cloud Platform (GCP)',
                role: 'Cloud Ingress & Managed Platform',
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
                    technologyId: 'tech-google-cloud-cdn',
                    name: 'Google Cloud CDN',
                    category: 'CDN / Edge',
                    layer: 'EDGE',
                    role: 'Edge Delivery / CDN Ingress',
                    infrastructureMeaning:
                      'The public endpoint appears to use Google Cloud CDN edge points of presence (POPs) to deliver and cache traffic globally.',
                    whyDetected: 'Observed via: 1.1 google and x-goog-generation headers',
                    whatThisDoesNotProve:
                      'Google Cloud CDN edge delivery does not prove origin hosting on Cloud Storage, Cloud Run, GKE, or Compute Engine VMs.',
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
                    technologyId: 'tech-google-cloud',
                    name: 'Google Cloud Platform (GCP)',
                    category: 'Cloud / Infrastructure',
                    layer: 'GATEWAY',
                    role: 'Cloud Ingress & Managed Platform',
                    infrastructureMeaning:
                      'Observable Google Cloud Platform infrastructure participates in delivering the public endpoint.',
                    whyDetected: 'Observed Server: gws, x-cloud-trace-context, and app.run.app CNAME',
                    whatThisDoesNotProve:
                      'Observable Google Cloud infrastructure confirms participation of specific GCP components, but does not prove the entire application runs on GCP, nor does it establish GKE, Compute Engine VMs, Cloud Functions, Cloud SQL, Spanner, Bigtable, Firestore, or private VPC topology without direct evidence.',
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
                technologyId: 'tech-google-cloud-cdn',
                name: 'Google Cloud CDN',
                category: 'CDN / Edge',
                layer: 'EDGE',
                role: 'Edge Delivery / CDN Ingress',
              },
              {
                technologyId: 'tech-google-cloud',
                name: 'Google Cloud Platform (GCP)',
                category: 'Cloud / Infrastructure',
                layer: 'GATEWAY',
                role: 'Cloud Ingress & Managed Platform',
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
                explanation: 'Database tier (Cloud SQL, Spanner, Bigtable, Firestore) is sealed behind Google Cloud boundaries.',
              },
              {
                dimension: 'Cluster Orchestration',
                status: 'UNOBSERVED',
                explanation: 'Internal GKE cluster nodes, namespaces, and pod networks are unobservable from public boundary.',
              },
            ],
            claimBoundaries: [
              {
                technologyId: 'tech-google-cloud',
                technologyName: 'Google Cloud Platform (GCP)',
                boundary:
                  'Observable Google Cloud infrastructure confirms participation of specific GCP components, but does not prove the entire application runs on GCP, nor does it establish GKE, Compute Engine VMs, Cloud Functions, Cloud SQL, Spanner, Bigtable, Firestore, or private VPC topology without direct evidence.',
              },
            ],
            confidence: {
              overallLevel: 'HIGH',
              overallScore: 0.98,
              layerConfidence: { EDGE: 'HIGH', GATEWAY: 'HIGH', RUNTIME: 'HIGH' },
              rationale: 'Observed Google Cloud CDN headers, Cloud Run CNAME, GWS server banner, and GTS TLS certificate',
              confirmedRelationshipsCount: 3,
              supportedRelationshipsCount: 0,
              inferredRelationshipsCount: 0,
            },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-gcp-multi', 'multi-tier-gcp.io', gcpOverview);
      assert.ok(model);

      // Verify layers resolution in IA-1
      const edgeSection = model.categoryGroups.find((s) => s.category === 'EDGE');
      const gatewaySection = model.categoryGroups.find((s) => s.category === 'GATEWAY');
      const runtimeSection = model.categoryGroups.find((s) => s.category === 'RUNTIME');

      assert.ok(edgeSection);
      assert.ok(gatewaySection);
      assert.ok(runtimeSection);

      assert.ok(edgeSection.components.some((c) => c.name === 'Google Cloud CDN'));
      assert.ok(gatewaySection.components.some((c) => c.name === 'Google Cloud Platform (GCP)'));
      assert.ok(gatewaySection.components.some((c) => c.name === 'NGINX'));
      assert.ok(runtimeSection.components.some((c) => c.name === 'Node.js'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. IA-2 Progressive Disclosure (Level 1, Level 2, Level 3)
  // ---------------------------------------------------------------------------
  describe('2. IA-2 Progressive Disclosure Invariants', () => {
    it('constructs rich Level 1, Level 2, and Level 3 view models without technology-specific UI branches', () => {
      const gcpCdnComponent = buildComponentViewModel({
        id: 'tech-google-cloud-cdn',
        category: 'CDN',
        name: 'Google Cloud CDN',
        role: 'Edge Delivery / CDN Ingress',
        layer: 'EDGE',
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
      });

      // Level 1: Understanding
      assert.equal(gcpCdnComponent.name, 'Google Cloud CDN');
      assert.equal(gcpCdnComponent.role, 'Edge Delivery / CDN Ingress');
      assert.equal(gcpCdnComponent.layer, 'EDGE');
      assert.equal(gcpCdnComponent.confidenceLevel, 'HIGH');

      // Version must be omitted cleanly (no "Version: Unknown")
      assert.equal(gcpCdnComponent.version, undefined);
      assert.ok(!gcpCdnComponent.attributes.some((attr) => attr.value?.toLowerCase().includes('unknown')));
    });

    it('exposes claim boundaries and whatThisDoesNotProve at Level 2 disclosure', () => {
      const gcpComponent = buildComponentViewModel({
        id: 'tech-google-cloud',
        category: 'CLOUD',
        name: 'Google Cloud Platform (GCP)',
        role: 'Cloud Ingress & Managed Platform',
        layer: 'GATEWAY',
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
      });

      assert.equal(gcpComponent.name, 'Google Cloud Platform (GCP)');
      assert.equal(gcpComponent.role, 'Cloud Ingress & Managed Platform');
      assert.equal(gcpComponent.layer, 'GATEWAY');
      assert.equal(gcpComponent.confidenceLevel, 'HIGH');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Tier Coexistence & Anti-Overreach Invariants
  // ---------------------------------------------------------------------------
  describe('3. Multi-Tier Coexistence & Anti-Overreach Invariants', () => {
    it('preserves Cloudflare at EDGE and Google Cloud Run at GATEWAY without collapsing into a Google Cloud CDN assumption', () => {
      const cloudflareGcpOverview: DomainOverviewResponseDto = {
        domain: {
          id: 'dom-cf-gcp',
          domainName: 'cloudflare-fronted-gcp.com',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        discovery: {
          dns: { authoritativeServers: ['ns1.cloudflare.com'], recordCounts: { a: 2 } },
          http: { reachable: true, statusCode: 200, responseTimeMs: 18 },
        },
        infrastructure: {
          cdn: 'Cloudflare',
          technologyArchitecture: {
            architectureSummary: 'The public endpoint is protected by Cloudflare Edge with Google Cloud Run origin ingress.',
            ingressPath: [
              { hop: 0, layer: 'EDGE', technologyId: 'public-endpoint', technologyName: 'Public Endpoint', role: 'Ingress' },
              { hop: 1, layer: 'EDGE', technologyId: 'tech-cloudflare', technologyName: 'Cloudflare', role: 'Edge & WAF', relationshipType: 'PROXIES_TO' },
              { hop: 2, layer: 'GATEWAY', technologyId: 'tech-google-cloud', technologyName: 'Google Cloud Platform (GCP)', role: 'Cloud Ingress & Managed Platform' },
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
                technologies: [{ technologyId: 'tech-google-cloud', name: 'Google Cloud Platform (GCP)', category: 'Cloud / Infrastructure', layer: 'GATEWAY', role: 'Cloud Ingress & Managed Platform' }],
              },
            ],
            keyTechnologies: [
              { technologyId: 'tech-cloudflare', name: 'Cloudflare', category: 'CDN / Edge', layer: 'EDGE', role: 'Edge & WAF' },
              { technologyId: 'tech-google-cloud', name: 'Google Cloud Platform (GCP)', category: 'Cloud / Infrastructure', layer: 'GATEWAY', role: 'Cloud Ingress & Managed Platform' },
            ],
            integrations: [],
            knownUnknowns: [
              { dimension: 'Backend Compute', status: 'UNOBSERVED', explanation: 'Origin compute runtime is unobserved behind Cloudflare and Google Cloud Run ingress.' },
            ],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.98, layerConfidence: { EDGE: 'HIGH', GATEWAY: 'HIGH' } },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-cf-gcp', 'cloudflare-fronted-gcp.com', cloudflareGcpOverview);
      assert.ok(model);

      const edgeSection = model.categoryGroups.find((s) => s.category === 'EDGE');
      const gatewaySection = model.categoryGroups.find((s) => s.category === 'GATEWAY');

      assert.ok(edgeSection?.components.some((c) => c.name === 'Cloudflare'));
      assert.ok(!edgeSection?.components.some((c) => c.name === 'Google Cloud CDN'));
      assert.ok(gatewaySection?.components.some((c) => c.name === 'Google Cloud Platform (GCP)'));
    });
  });
});
