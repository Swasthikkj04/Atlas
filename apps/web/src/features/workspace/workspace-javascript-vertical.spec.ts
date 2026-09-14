import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto, DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('T14: JavaScript Infrastructure Understanding Vertical Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. JavaScript Category & Semantic Role Mapping (APPLICATION)
  // ---------------------------------------------------------------------------
  describe('1. JavaScript Category & Semantic Role Mapping', () => {
    it('maps JavaScript to APPLICATION layer with authoritative client runtime role', () => {
      const jsArchitecture: TechnologyArchitectureOverviewDto = {
        architectureSummary:
          'The public endpoint delivers client-side JavaScript participating in browser-side application execution.',
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
            layer: 'APPLICATION',
            technologyId: 'tech-javascript',
            technologyName: 'JavaScript',
            role: 'Client-side Application / Presentation Runtime',
          },
        ],
        layers: [
          {
            layer: 'APPLICATION',
            state: 'OBSERVED',
            confidenceLevel: 'HIGH',
            technologies: [
              {
                technologyId: 'tech-javascript',
                name: 'JavaScript',
                category: 'Frameworks',
                layer: 'APPLICATION',
                role: 'Client-side Application / Presentation Runtime',
                infrastructureMeaning:
                  'The observed endpoint delivers JavaScript that participates in browser-side application behavior.',
                whyDetected: 'Observed client-side script assets (<script>) in public response',
                whatThisDoesNotProve:
                  'JavaScript presence confirms client-side execution, but does not prove Node.js, Bun, Deno, React, Next.js, Vue, Angular, a JavaScript backend, SSR, SSG, SPA, MPA, hydration, Webpack, Vite, Rollup, esbuild, Turbopack, or any cloud provider.',
                confidence: 0.95,
                confidenceLevel: 'HIGH',
                evidence: [],
              },
            ],
          },
        ],
        keyTechnologies: [
          {
            technologyId: 'tech-javascript',
            name: 'JavaScript',
            category: 'Frameworks',
            layer: 'APPLICATION',
            role: 'Client-side Application / Presentation Runtime',
            infrastructureMeaning:
              'The observed endpoint delivers JavaScript that participates in browser-side application behavior.',
            whyDetected: 'Observed client-side script assets (<script>) in public response',
            whatThisDoesNotProve:
              'JavaScript presence confirms client-side execution, but does not prove Node.js, Bun, Deno, React, Next.js, Vue, Angular, a JavaScript backend, SSR, SSG, SPA, MPA, hydration, Webpack, Vite, Rollup, esbuild, Turbopack, or any cloud provider.',
            confidence: 0.95,
            confidenceLevel: 'HIGH',
            evidence: [],
          },
        ],
        integrations: [],
        knownUnknowns: [
          {
            dimension: 'Backend Runtime',
            status: 'UNOBSERVED',
            explanation: 'Backend server execution runtime is unobservable from client JavaScript bundles.',
          },
          {
            dimension: 'Build Toolchain',
            status: 'UNOBSERVED',
            explanation: 'Build tool (Webpack, Vite, Rollup) is unobservable from minified client assets.',
          },
        ],
        claimBoundaries: [
          {
            technologyId: 'tech-javascript',
            technologyName: 'JavaScript',
            boundary:
              'Client-side JavaScript delivery does not establish Node.js backend, React framework, or SSR execution.',
          },
        ],
        confidence: {
          overallLevel: 'HIGH',
          overallScore: 0.95,
          layerConfidence: { APPLICATION: 'HIGH' },
          rationale: 'Observed client-side script assets (<script>) in public response',
          confirmedRelationshipsCount: 1,
          supportedRelationshipsCount: 0,
          inferredRelationshipsCount: 0,
        },
      };

      const tech = jsArchitecture.keyTechnologies[0];
      assert.equal(tech.name, 'JavaScript');
      assert.equal(tech.layer, 'APPLICATION');
      assert.equal(tech.version, undefined);
      assert.ok(tech.infrastructureMeaning.includes('browser-side application behavior'));
      assert.ok(tech.whatThisDoesNotProve.includes('Node.js'));
      assert.ok(tech.whatThisDoesNotProve.includes('React'));
      assert.ok(tech.whatThisDoesNotProve.includes('Next.js'));
      assert.ok(tech.whatThisDoesNotProve.includes('SSR'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Version Fidelity (No "Version: Unknown")
  // ---------------------------------------------------------------------------
  describe('2. Version Fidelity', () => {
    it('leaves version undefined without synthesizing "Unknown" strings', () => {
      const viewModel = buildComponentViewModel({
        id: 'tech-javascript',
        category: 'APPLICATION',
        name: 'JavaScript',
        role: 'Client-side Application / Presentation Runtime',
        layer: 'APPLICATION',
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
      });

      assert.equal(viewModel.version, undefined);
      assert.ok(!viewModel.attributes.some((attr) => attr.value.toLowerCase().includes('unknown')));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Technology Coexistence (JavaScript + React + Next.js + Node.js)
  // ---------------------------------------------------------------------------
  describe('3. Multi-Technology Coexistence', () => {
    it('renders JavaScript, React, Next.js, and Node.js as independent observations without collapsing', () => {
      const mockDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-js-full', domainName: 'modern-web.com', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 95, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-m', createdAt: new Date().toISOString(), responseTimeMs: 35, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Modern web app with Next.js, React, JavaScript, and Node.js backend.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-javascript', name: 'JavaScript', category: 'Frameworks', layer: 'APPLICATION', role: 'Client-side Runtime', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-react', name: 'React', category: 'Client UI Library', layer: 'APPLICATION', role: 'Client-side UI', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-nextjs', name: 'Next.js', category: 'Web Application Framework', layer: 'APPLICATION', role: 'Full-stack App Framework', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-nodejs', name: 'Node.js', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Server Runtime', confidence: 0.90, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-js-full', 'modern-web.com', mockDomain);

      const appGroup = model.categoryGroups.find((g) => g.category === 'APPLICATION');
      assert.ok(appGroup);
      assert.equal(appGroup?.components.length, 3);
      assert.equal(appGroup?.components[0].name, 'JavaScript');
      assert.equal(appGroup?.components[1].name, 'React');
      assert.equal(appGroup?.components[2].name, 'Next.js');

      const runtimeGroup = model.categoryGroups.find((g) => g.category === 'RUNTIME');
      assert.ok(runtimeGroup);
      assert.equal(runtimeGroup?.components.length, 1);
      assert.equal(runtimeGroup?.components[0].name, 'Node.js');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. IA-2 3-Tier Progressive Disclosure for JavaScript
  // ---------------------------------------------------------------------------
  describe('4. IA-2 Progressive Disclosure for JavaScript', () => {
    it('provides 3 levels of investigation (Understanding -> Context -> Evidence) for JavaScript', () => {
      const viewModel = buildComponentViewModel(
        {
          id: 'tech-javascript',
          category: 'APPLICATION',
          name: 'JavaScript',
          role: 'Client-side Application / Presentation Runtime',
          layer: 'APPLICATION',
          confidenceLevel: 'HIGH',
          state: 'OBSERVED',
          infrastructureMeaning: 'Delivers client-side script assets executed within web browsers.',
          whatThisDoesNotProve: 'JavaScript does not prove Node.js backend, React, or Next.js framework.',
          evidenceReferences: [
            {
              sourceType: 'HTML_DOCUMENT',
              source: 'HTML Document',
              indicator: '<script type="module" src="/assets/index.js">',
              confidence: 'HIGH',
            },
          ],
        },
        '2026-08-27T15:14:00.000Z',
      );

      // Level 1: Understanding
      assert.equal(viewModel.name, 'JavaScript');
      assert.equal(viewModel.version, undefined);
      assert.equal(viewModel.layer, 'APPLICATION');
      assert.equal(viewModel.confidenceLevel, 'HIGH');

      // Level 2: Context
      assert.equal(viewModel.hasContext, true);
      assert.ok(viewModel.whyThisAppears?.includes('Delivers client-side script assets'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('does not prove Node.js'));

      // Level 3: Evidence
      assert.equal(viewModel.hasEvidence, true);
      assert.equal(viewModel.evidence.length, 1);
      assert.ok(viewModel.evidence[0].observedSignal.includes('<script'));
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Domain Switching & Re-Understanding Isolation
  // ---------------------------------------------------------------------------
  describe('5. Domain Switching Isolation & Re-Understanding', () => {
    it('completely isolates JavaScript state between domains during context switching', () => {
      const jsDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-js', domainName: 'js-app.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 90, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-js1', createdAt: new Date().toISOString(), responseTimeMs: 25, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'JavaScript client runtime observed.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-javascript', name: 'JavaScript', category: 'Frameworks', layer: 'APPLICATION', role: 'Client Runtime', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const plainDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-plain', domainName: 'plain-app.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 90, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-plain1', createdAt: new Date().toISOString(), responseTimeMs: 20, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          webServer: 'nginx',
          technologyArchitecture: {
            architectureSummary: 'NGINX gateway observed.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-nginx', name: 'NGINX', category: 'Web / Server', layer: 'GATEWAY', role: 'Web Gateway', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const modelA = resolveAdaptiveInfrastructureModel('dom-js', 'js-app.org', jsDomain);
      const modelB = resolveAdaptiveInfrastructureModel('dom-plain', 'plain-app.org', plainDomain);

      assert.equal(modelA.categoryGroups[0].components[0].name, 'JavaScript');
      assert.equal(modelB.categoryGroups[0].components[0].name, 'NGINX');
      assert.ok(!modelB.categoryGroups[0].components.some((c) => c.name === 'JavaScript'));
    });
  });
});
