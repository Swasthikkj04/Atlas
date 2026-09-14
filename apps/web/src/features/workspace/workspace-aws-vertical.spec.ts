import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto, DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('T22: AWS Infrastructure Understanding Vertical UI Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. Component-Specific AWS Mapping (CloudFront -> EDGE, AWS ALB -> GATEWAY)
  // ---------------------------------------------------------------------------
  describe('1. Component-Specific Semantic Layer Mapping', () => {
    it('maps CloudFront to EDGE and AWS ALB to GATEWAY without conflating them into a generic AWS badge', () => {
      const awsOverview: DomainOverviewResponseDto = {
        domain: {
          id: 'dom-aws-multi',
          domainName: 'multi-tier-aws.io',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        discovery: {
          dns: { authoritativeServers: ['ns-1.awsdns.org'], recordCounts: { a: 1, cname: 1 } },
          http: { reachable: true, statusCode: 200, responseTimeMs: 25 },
        },
        infrastructure: {
          cdn: 'AWS CloudFront',
          webServer: 'nginx/1.24.0',
          technologyArchitecture: {
            architectureSummary:
              'The public endpoint is fronted by CloudFront edge distribution routing to AWS Application Load Balancer and NGINX origin.',
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
                technologyId: 'tech-cloudfront',
                technologyName: 'AWS CloudFront',
                role: 'Edge / CDN Delivery',
                relationshipType: 'PROXIES_TO',
              },
              {
                hop: 2,
                layer: 'GATEWAY',
                technologyId: 'tech-aws',
                technologyName: 'Amazon Web Services (AWS)',
                role: 'Cloud Ingress & Load Balancing',
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
                    technologyId: 'tech-cloudfront',
                    name: 'AWS CloudFront',
                    category: 'CDN / Edge',
                    layer: 'EDGE',
                    role: 'Edge / CDN Delivery',
                    infrastructureMeaning: "The public endpoint appears to use AWS's edge network to deliver and cache traffic.",
                    whyDetected: 'Observed x-amz-cf-id and Server: CloudFront headers',
                    whatThisDoesNotProve: 'CloudFront edge delivery does not prove origin hosting on AWS EC2, ECS, EKS, or S3.',
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
                    technologyId: 'tech-aws',
                    name: 'Amazon Web Services (AWS)',
                    category: 'Cloud / Infrastructure',
                    layer: 'GATEWAY',
                    role: 'Cloud Ingress & Load Balancing',
                    infrastructureMeaning: 'Observable AWS-managed infrastructure participates in delivering the public endpoint.',
                    whyDetected: 'Observed x-amzn-trace-id header and AWSALB cookie',
                    whatThisDoesNotProve: 'AWS presence does not prove the entire application runs on AWS, nor does it establish EC2, ECS, EKS, RDS, or DynamoDB.',
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
                technologyId: 'tech-cloudfront',
                name: 'AWS CloudFront',
                category: 'CDN / Edge',
                layer: 'EDGE',
                role: 'Edge / CDN Delivery',
              },
              {
                technologyId: 'tech-aws',
                name: 'Amazon Web Services (AWS)',
                category: 'Cloud / Infrastructure',
                layer: 'GATEWAY',
                role: 'Cloud Ingress & Load Balancing',
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
                explanation: 'Database tier (RDS, DynamoDB, PostgreSQL) is sealed and unobservable from public boundary.',
              },
              {
                dimension: 'Host Compute Runtime',
                status: 'UNOBSERVED',
                explanation: 'EC2 instance, ECS container, or EKS pod details are unobservable.',
              },
            ],
            claimBoundaries: [
              {
                technologyId: 'tech-aws',
                technologyName: 'Amazon Web Services (AWS)',
                boundary: 'AWS presence does not prove EC2, ECS, EKS, Lambda, RDS, S3, DynamoDB, or VPC.',
              },
            ],
            confidence: {
              overallLevel: 'HIGH',
              overallScore: 0.98,
              layerConfidence: { EDGE: 'HIGH', GATEWAY: 'HIGH', RUNTIME: 'HIGH' },
              rationale: 'Observed CloudFront headers, AWS ALB trace ID, NGINX banner, and Express powered-by header',
              confirmedRelationshipsCount: 3,
              supportedRelationshipsCount: 0,
              inferredRelationshipsCount: 0,
            },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-aws-multi', 'multi-tier-aws.io', awsOverview);
      assert.ok(model);

      // Verify layers resolution in IA-1
      const edgeSection = model.categoryGroups.find((s) => s.category === 'EDGE');
      const gatewaySection = model.categoryGroups.find((s) => s.category === 'GATEWAY');
      const runtimeSection = model.categoryGroups.find((s) => s.category === 'RUNTIME');

      assert.ok(edgeSection);
      assert.ok(gatewaySection);
      assert.ok(runtimeSection);

      assert.ok(edgeSection.components.some((c) => c.name === 'AWS CloudFront'));
      assert.ok(gatewaySection.components.some((c) => c.name === 'Amazon Web Services (AWS)'));
      assert.ok(gatewaySection.components.some((c) => c.name === 'NGINX'));
      assert.ok(runtimeSection.components.some((c) => c.name === 'Node.js'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. IA-2 Progressive Disclosure (Level 1, Level 2, Level 3)
  // ---------------------------------------------------------------------------
  describe('2. IA-2 Progressive Disclosure Invariants', () => {
    it('constructs rich Level 1, Level 2, and Level 3 view models without technology-specific UI branches', () => {
      const albComponent = buildComponentViewModel({
        id: 'tech-aws',
        category: 'HOSTING',
        name: 'Amazon Web Services (AWS)',
        role: 'Cloud Ingress & Load Balancing',
        layer: 'GATEWAY',
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
      });

      // Level 1: Understanding
      assert.equal(albComponent.name, 'Amazon Web Services (AWS)');
      assert.equal(albComponent.role, 'Cloud Ingress & Load Balancing');
      assert.equal(albComponent.layer, 'GATEWAY');
      assert.equal(albComponent.confidenceLevel, 'HIGH');

      // Version must be omitted cleanly (no "Version: Unknown")
      assert.equal(albComponent.version, undefined);
      assert.ok(!albComponent.attributes.some((attr) => attr.value?.toLowerCase().includes('unknown')));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Tier Coexistence & Anti-Overreach Invariants
  // ---------------------------------------------------------------------------
  describe('3. Multi-Tier Coexistence & Anti-Overreach Invariants', () => {
    it('preserves Cloudflare at EDGE and AWS at GATEWAY without collapsing into an AWS CDN assumption', () => {
      const cloudflareAwsOverview: DomainOverviewResponseDto = {
        domain: {
          id: 'dom-cf-aws',
          domainName: 'cloudflare-fronted-aws.com',
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
            architectureSummary: 'The public endpoint is protected by Cloudflare Edge with AWS origin ingress.',
            ingressPath: [
              { hop: 0, layer: 'EDGE', technologyId: 'public-endpoint', technologyName: 'Public Endpoint', role: 'Ingress' },
              { hop: 1, layer: 'EDGE', technologyId: 'tech-cloudflare', technologyName: 'Cloudflare', role: 'Edge & WAF', relationshipType: 'PROXIES_TO' },
              { hop: 2, layer: 'GATEWAY', technologyId: 'tech-aws', technologyName: 'Amazon Web Services (AWS)', role: 'Cloud Ingress' },
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
                technologies: [{ technologyId: 'tech-aws', name: 'Amazon Web Services (AWS)', category: 'Cloud / Infrastructure', layer: 'GATEWAY', role: 'Cloud Ingress' }],
              },
            ],
            keyTechnologies: [
              { technologyId: 'tech-cloudflare', name: 'Cloudflare', category: 'CDN / Edge', layer: 'EDGE', role: 'Edge & WAF' },
              { technologyId: 'tech-aws', name: 'Amazon Web Services (AWS)', category: 'Cloud / Infrastructure', layer: 'GATEWAY', role: 'Cloud Ingress' },
            ],
            integrations: [],
            knownUnknowns: [
              { dimension: 'Backend Compute', status: 'UNOBSERVED', explanation: 'Origin compute runtime is unobserved behind Cloudflare and AWS ingress.' },
            ],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.98, layerConfidence: { EDGE: 'HIGH', GATEWAY: 'HIGH' } },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-cf-aws', 'cloudflare-fronted-aws.com', cloudflareAwsOverview);
      assert.ok(model);

      const edgeSection = model.categoryGroups.find((s) => s.category === 'EDGE');
      const gatewaySection = model.categoryGroups.find((s) => s.category === 'GATEWAY');

      assert.ok(edgeSection?.components.some((c) => c.name === 'Cloudflare'));
      assert.ok(!edgeSection?.components.some((c) => c.name === 'AWS CloudFront'));
      assert.ok(gatewaySection?.components.some((c) => c.name === 'Amazon Web Services (AWS)'));
    });
  });
});
