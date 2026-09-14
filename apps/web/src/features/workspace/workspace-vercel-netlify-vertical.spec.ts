import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel, type AdaptiveInfrastructureComponent } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('T30: Edge Cloud & Serverless Platform (Vercel & Netlify) Vertical UI Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. Component-Specific Semantic Layer Mapping (Vercel & Netlify -> PLATFORM)
  // ---------------------------------------------------------------------------
  describe('1. Component-Specific Semantic Layer Mapping', () => {
    it('maps Vercel and Netlify to PLATFORM without conflation or automatic framework inference', () => {
      const overview: DomainOverviewResponseDto = {
        domain: {
          id: 'dom-vercel-netlify',
          domainName: 'edge-platform.io',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        discovery: {
          dns: { authoritativeServers: ['ns1.vercel-dns.com'], recordCounts: { a: 1, cname: 1 } },
          http: { reachable: true, statusCode: 200, responseTimeMs: 25 },
        },
        infrastructure: {
          cdn: 'Vercel Edge Network',
          webServer: 'Vercel',
          technologyArchitecture: {
            architectureSummary:
              'The public endpoint is deployed on Vercel Edge Platform and serves static and serverless web assets.',
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
                layer: 'PLATFORM',
                technologyId: 'tech-vercel',
                technologyName: 'Vercel',
                role: 'Edge Platform / Frontend Serverless Ingress',
                relationshipType: 'SERVES',
              },
            ],
            layers: [
              {
                layer: 'PLATFORM',
                state: 'OBSERVED',
                confidenceLevel: 'HIGH',
                technologies: [
                  {
                    technologyId: 'tech-vercel',
                    name: 'Vercel',
                    category: 'Cloud / Infrastructure',
                    layer: 'PLATFORM',
                    role: 'Edge Platform / Frontend Serverless Ingress',
                    version: undefined,
                    infrastructureMeaning:
                      'The public endpoint appears to use Vercel for edge delivery, asset distribution, and frontend/serverless web hosting.',
                    whyDetected: 'Observed x-vercel-id header and cname.vercel-dns.com',
                    whatThisDoesNotProve:
                      'Vercel edge platform evidence confirms edge delivery and routing, but does not prove Next.js, React, Node.js, Vercel Functions, PostgreSQL, Supabase, Neon, AWS origin hosting, Docker containerization, or Kubernetes orchestration without direct independent evidence.',
                    confidence: 0.99,
                    confidenceLevel: 'HIGH',
                    evidence: [
                      {
                        sourceType: 'HTTP',
                        source: 'Response Header: x-vercel-id',
                        indicator: 'x-vercel-id: iad1::5q8v7-1724912345678-abcdef',
                        observedValue: 'iad1::5q8v7-1724912345678-abcdef',
                        confidence: 'HIGH',
                      },
                      {
                        sourceType: 'DNS',
                        source: 'CNAME Records',
                        indicator: 'cname.vercel-dns.com CNAME',
                        observedValue: 'cname.vercel-dns.com',
                        confidence: 'HIGH',
                      },
                    ],
                  },
                ],
              },
            ],
            keyTechnologies: [
              {
                technologyId: 'tech-vercel',
                name: 'Vercel',
                category: 'Cloud / Infrastructure',
                layer: 'PLATFORM',
                role: 'Edge Platform / Frontend Serverless Ingress',
                version: undefined,
              },
            ],
            integrations: [],
            knownUnknowns: [
              {
                dimension: 'Application Framework & Backend Runtime',
                status: 'UNOBSERVED',
                rationale: 'No Next.js, React, or Node.js runtime signatures directly observed.',
              },
              {
                dimension: 'Database Backend & Storage',
                status: 'UNOBSERVED',
                rationale: 'No relational or serverless database wire telemetry directly observed.',
              },
            ],
            claimBoundaries: [
              {
                technologyId: 'tech-vercel',
                technologyName: 'Vercel',
                boundary:
                  'Vercel confirms edge platform routing but does not prove Next.js, React, Node.js, or backend database services.',
              },
            ],
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-vercel-netlify', 'edge-platform.io', overview);
      assert.ok(model.hasObservedInfrastructure);

      // Verify category groups
      const platformGroup = model.categoryGroups.find((g) => g.category === 'PLATFORM');
      assert.ok(platformGroup, 'PLATFORM category group must be present');
      assert.equal(platformGroup.label, 'Platform & CMS');

      const vercelComp = platformGroup.components.find((c) => c.name === 'Vercel' || c.id === 'tech-vercel');
      assert.ok(vercelComp, 'Vercel component must be present in PLATFORM');
      assert.equal(vercelComp.name, 'Vercel');
      assert.equal(vercelComp.version, undefined);

      // Verify known unknowns: Application framework and DB remain unobserved
      const unobserved = model.unobservedDimensions;
      assert.ok(
        unobserved.some((u) => String(u.dimension).includes('Framework') && u.status === 'UNOBSERVED'),
        'Application framework must be explicitly unobserved',
      );
      assert.ok(
        unobserved.some((u) => String(u.dimension).includes('Database') && u.status === 'UNOBSERVED'),
        'Database backend must be explicitly unobserved',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Progressive Disclosure (Level 1, Level 2, Level 3)
  // ---------------------------------------------------------------------------
  describe('2. Progressive Disclosure (Level 1, Level 2, Level 3)', () => {
    it('constructs Level 1, 2, and 3 view models for Netlify with strict version undefined and evidence lineage', () => {
      const rawNetlify: AdaptiveInfrastructureComponent = {
        id: 'tech-netlify',
        category: 'PLATFORM',
        name: 'Netlify',
        technology: 'Netlify',
        layer: 'PLATFORM',
        role: 'Edge Platform / Static & Serverless Ingress',
        version: undefined,
        infrastructureMeaning:
          'The public endpoint appears to use Netlify for edge delivery, asset distribution, and static/serverless web hosting.',
        whyDetected: 'Observed Server: Netlify and x-nf-request-id header',
        whatThisDoesNotProve:
          'Netlify edge platform evidence confirms edge delivery and routing, but does not prove React, Vue, Svelte, SvelteKit, Astro, JAMstack architecture, Netlify Functions, origin cloud hosting (AWS), Docker containerization, Kubernetes orchestration, or backend database services without direct independent evidence.',
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
        evidenceReferences: [
          {
            sourceType: 'HTTP',
            source: 'Response Header: server',
            indicator: 'Server: Netlify',
            observedValue: 'Netlify',
            confidence: 'HIGH',
          },
          {
            sourceType: 'HTTP',
            source: 'Response Header: x-nf-request-id',
            indicator: 'x-nf-request-id: 01HN8Q4V2E45P67890ABCDEF',
            observedValue: '01HN8Q4V2E45P67890ABCDEF',
            confidence: 'HIGH',
          },
          {
            sourceType: 'DNS',
            source: 'CNAME Records',
            indicator: 'netlify.app CNAME',
            observedValue: 'custom-app.netlify.app',
            confidence: 'HIGH',
          },
        ],
      };

      const viewModel = buildComponentViewModel(rawNetlify, 'custom-app.io');

      // Level 1: Primary Summary
      assert.equal(viewModel.name, 'Netlify');
      assert.equal(viewModel.role, 'Edge Platform / Static & Serverless Ingress');
      assert.equal(viewModel.version, undefined);
      assert.equal(viewModel.confidenceLevel, 'HIGH');
      assert.notEqual(viewModel.version, 'Unknown');
      assert.notEqual(viewModel.version, 'Version: Unknown');

      // Level 2: Expanded Details
      assert.ok(viewModel.whyThisAppears?.includes('Netlify'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('React'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('JAMstack'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('Docker'));

      // Level 3: Evidence Lineage
      assert.equal(viewModel.evidence.length, 3);
      assert.equal(viewModel.evidence[0].sourceDescription, 'Response Header: server');
      assert.equal(viewModel.evidence[0].observedValue, 'Netlify');
      assert.equal(viewModel.evidence[1].sourceDescription, 'Response Header: x-nf-request-id');
      assert.equal(viewModel.evidence[1].observedValue, '01HN8Q4V2E45P67890ABCDEF');
      assert.equal(viewModel.evidence[2].sourceDescription, 'CNAME Records');
      assert.equal(viewModel.evidence[2].observedValue, 'custom-app.netlify.app');
    });

    it('does not emit "Version: Unknown" when Vercel has version undefined', () => {
      const rawVercelUnversioned: AdaptiveInfrastructureComponent = {
        id: 'tech-vercel',
        category: 'PLATFORM',
        name: 'Vercel',
        technology: 'Vercel',
        layer: 'PLATFORM',
        role: 'Edge Platform / Frontend Serverless Ingress',
        version: undefined,
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
        evidenceReferences: [],
      };

      const viewModel = buildComponentViewModel(rawVercelUnversioned, 'vercel.app');
      assert.equal(viewModel.version, undefined);
      assert.notEqual(viewModel.version, 'Unknown');
      assert.notEqual(viewModel.version, 'Version: Unknown');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Technology Coexistence across Tiers
  // ---------------------------------------------------------------------------
  describe('3. Multi-Technology Coexistence across Tiers', () => {
    it('coexists Cloudflare (EDGE), Vercel (PLATFORM), Next.js (APPLICATION), and Node.js (RUNTIME)', () => {
      const multiTierOverview: DomainOverviewResponseDto = {
        domain: {
          id: 'dom-multi-tier',
          domainName: 'fullstack-saas.com',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        discovery: {
          dns: { authoritativeServers: ['ns1.cloudflare.com'], recordCounts: { a: 2, cname: 1 } },
          http: { reachable: true, statusCode: 200, responseTimeMs: 18 },
        },
        infrastructure: {
          cdn: 'Cloudflare',
          webServer: 'Vercel',
          technologyArchitecture: {
            architectureSummary:
              'Endpoint is fronted by Cloudflare edge, routed by Vercel platform, running Next.js on Node.js.',
            ingressPath: [],
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
                    role: 'Global Edge Network / Anycast DNS / CDN',
                    confidence: 0.99,
                    confidenceLevel: 'HIGH',
                    evidence: [],
                  },
                ],
              },
              {
                layer: 'PLATFORM',
                state: 'OBSERVED',
                confidenceLevel: 'HIGH',
                technologies: [
                  {
                    technologyId: 'tech-vercel',
                    name: 'Vercel',
                    category: 'Cloud / Infrastructure',
                    layer: 'PLATFORM',
                    role: 'Edge Platform / Frontend Serverless Ingress',
                    confidence: 0.99,
                    confidenceLevel: 'HIGH',
                    evidence: [],
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
                    category: 'Framework / Application',
                    layer: 'APPLICATION',
                    role: 'React Application Framework',
                    confidence: 0.98,
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
                technologyId: 'tech-cloudflare',
                name: 'Cloudflare',
                category: 'CDN / Edge',
                layer: 'EDGE',
                role: 'Global Edge Network / Anycast DNS / CDN',
              },
              {
                technologyId: 'tech-vercel',
                name: 'Vercel',
                category: 'Cloud / Infrastructure',
                layer: 'PLATFORM',
                role: 'Edge Platform / Frontend Serverless Ingress',
              },
              {
                technologyId: 'tech-nextjs',
                name: 'Next.js',
                category: 'Framework / Application',
                layer: 'APPLICATION',
                role: 'React Application Framework',
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
            knownUnknowns: [],
            claimBoundaries: [],
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-multi-tier', 'fullstack-saas.com', multiTierOverview);

      const edgeGroup = model.categoryGroups.find((g) => g.category === 'EDGE');
      assert.ok(edgeGroup, 'EDGE group must exist');
      assert.ok(edgeGroup.components.some((c) => c.name === 'Cloudflare'));

      const platformGroup = model.categoryGroups.find((g) => g.category === 'PLATFORM');
      assert.ok(platformGroup, 'PLATFORM group must exist');
      assert.ok(platformGroup.components.some((c) => c.name === 'Vercel'));

      const appGroup = model.categoryGroups.find((g) => g.category === 'APPLICATION');
      assert.ok(appGroup, 'APPLICATION group must exist');
      assert.ok(appGroup.components.some((c) => c.name === 'Next.js'));

      const runtimeGroup = model.categoryGroups.find((g) => g.category === 'RUNTIME');
      assert.ok(runtimeGroup, 'RUNTIME group must exist');
      assert.ok(runtimeGroup.components.some((c) => c.name === 'Node.js'));
    });
  });
});
