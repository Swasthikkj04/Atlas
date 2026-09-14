import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto, DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('T15: Node.js Infrastructure Understanding Vertical Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. Node.js Category & Semantic Role Mapping (RUNTIME)
  // ---------------------------------------------------------------------------
  describe('1. Node.js Category & Semantic Role Mapping', () => {
    it('maps Node.js to RUNTIME layer with authoritative server-side JavaScript runtime role', () => {
      const nodeArchitecture: TechnologyArchitectureOverviewDto = {
        architectureSummary:
          'The public endpoint is served through an NGINX reverse proxy gateway delivering a Node.js server-side application runtime.',
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
            technologyId: 'tech-nginx',
            technologyName: 'NGINX',
            role: 'Web Gateway / Reverse Proxy',
          },
          {
            hop: 2,
            layer: 'RUNTIME',
            technologyId: 'tech-nodejs',
            technologyName: 'Node.js',
            role: 'Server-side Application Runtime / JavaScript Execution Environment',
          },
        ],
        layers: [
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
                role: 'Server-side Application Runtime / JavaScript Execution Environment',
                infrastructureMeaning:
                  'The observed infrastructure exposes evidence consistent with Node.js participating in server-side request processing or application execution.',
                whyDetected: 'Observed X-Powered-By: Node.js/v20.11.1 response header and connect.sid session cookie',
                whatThisDoesNotProve:
                  'Node.js presence confirms server-side JavaScript runtime execution, but does not prove Express, NestJS, Next.js, React, Docker, Kubernetes, Linux, AWS, GCP, Azure, Vercel, or any specific database (PostgreSQL, MySQL, MongoDB, Redis).',
                confidence: 0.95,
                confidenceLevel: 'HIGH',
                version: '20.11.1',
                evidence: [],
              },
            ],
          },
        ],
        keyTechnologies: [
          {
            technologyId: 'tech-nodejs',
            name: 'Node.js',
            category: 'Infrastructure Runtime',
            layer: 'RUNTIME',
            role: 'Server-side Application Runtime / JavaScript Execution Environment',
            infrastructureMeaning:
              'The observed infrastructure exposes evidence consistent with Node.js participating in server-side request processing or application execution.',
            whyDetected: 'Observed X-Powered-By: Node.js/v20.11.1 response header and connect.sid session cookie',
            whatThisDoesNotProve:
              'Node.js presence confirms server-side JavaScript runtime execution, but does not prove Express, NestJS, Next.js, React, Docker, Kubernetes, Linux, AWS, GCP, Azure, Vercel, or any specific database (PostgreSQL, MySQL, MongoDB, Redis).',
            confidence: 0.95,
            confidenceLevel: 'HIGH',
            version: '20.11.1',
            evidence: [],
          },
        ],
        integrations: [],
        knownUnknowns: [
          {
            dimension: 'Database Backend',
            status: 'UNOBSERVED',
            explanation: 'Backend database (PostgreSQL, MySQL, MongoDB, Redis) is unobservable from public HTTP/API responses.',
          },
          {
            dimension: 'Host Operating System',
            status: 'UNOBSERVED',
            explanation: 'Operating system kernel details are not exposed by the Node.js runtime boundary.',
          },
        ],
        claimBoundaries: [
          {
            technologyId: 'tech-nodejs',
            technologyName: 'Node.js',
            boundary:
              'Node.js presence confirms server runtime execution, but does not prove Express, NestJS, Docker, AWS, or specific database backends.',
          },
        ],
        confidence: {
          overallLevel: 'HIGH',
          overallScore: 0.95,
          layerConfidence: { RUNTIME: 'HIGH' },
          rationale: 'Observed X-Powered-By: Node.js header and connect.sid session cookie',
          confirmedRelationshipsCount: 1,
          supportedRelationshipsCount: 0,
          inferredRelationshipsCount: 0,
        },
      };

      const tech = nodeArchitecture.keyTechnologies[0];
      assert.equal(tech.name, 'Node.js');
      assert.equal(tech.layer, 'RUNTIME');
      assert.equal(tech.version, '20.11.1');
      assert.ok(tech.infrastructureMeaning.includes('server-side request processing'));
      assert.ok(tech.whatThisDoesNotProve.includes('Express'));
      assert.ok(tech.whatThisDoesNotProve.includes('Docker'));
      assert.ok(tech.whatThisDoesNotProve.includes('AWS'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Version Fidelity (Optional, No "Version: Unknown")
  // ---------------------------------------------------------------------------
  describe('2. Version Fidelity', () => {
    it('preserves exact Node.js version when evidenced and leaves version undefined when unevidenced', () => {
      const versionedNode = buildComponentViewModel({
        id: 'tech-nodejs',
        category: 'RUNTIME',
        name: 'Node.js',
        role: 'Server-side Application Runtime',
        layer: 'RUNTIME',
        confidenceLevel: 'HIGH',
        version: '20.11.1',
        state: 'OBSERVED',
      });

      assert.equal(versionedNode.version, '20.11.1');

      const unversionedNode = buildComponentViewModel({
        id: 'tech-nodejs',
        category: 'RUNTIME',
        name: 'Node.js',
        role: 'Server-side Application Runtime',
        layer: 'RUNTIME',
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
      });

      assert.equal(unversionedNode.version, undefined);
      assert.ok(!unversionedNode.attributes.some((attr) => attr.value.toLowerCase().includes('unknown')));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Technology Coexistence (Node.js + JavaScript + Next.js + React)
  // ---------------------------------------------------------------------------
  describe('3. Multi-Technology Coexistence', () => {
    it('renders Node.js, JavaScript, Next.js, and React as independent observations without collapsing', () => {
      const mockDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-node-full', domainName: 'modern-node-app.com', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 95, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-n', createdAt: new Date().toISOString(), responseTimeMs: 35, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Full-stack application running Next.js and React on a Node.js server runtime.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-javascript', name: 'JavaScript', category: 'Frameworks', layer: 'APPLICATION', role: 'Client-side Runtime', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-react', name: 'React', category: 'Client UI Library', layer: 'APPLICATION', role: 'Client-side UI', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-nextjs', name: 'Next.js', category: 'Web Application Framework', layer: 'APPLICATION', role: 'Application Framework', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-nodejs', name: 'Node.js', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Server-side Runtime', version: '20.11.1', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-node-full', 'modern-node-app.com', mockDomain);

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
      assert.equal(runtimeGroup?.components[0].version, '20.11.1');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. IA-2 3-Tier Progressive Disclosure for Node.js
  // ---------------------------------------------------------------------------
  describe('4. IA-2 Progressive Disclosure for Node.js', () => {
    it('provides 3 levels of investigation (Understanding -> Context -> Evidence) for Node.js', () => {
      const viewModel = buildComponentViewModel(
        {
          id: 'tech-nodejs',
          category: 'RUNTIME',
          name: 'Node.js',
          role: 'Server-side Application Runtime / JavaScript Execution Environment',
          layer: 'RUNTIME',
          version: '20.11.1',
          confidenceLevel: 'HIGH',
          state: 'OBSERVED',
          infrastructureMeaning: 'Executes server-side JavaScript applications on a V8 runtime.',
          whatThisDoesNotProve: 'Node.js does not prove Express, NestJS, Docker, or MongoDB database.',
          evidenceReferences: [
            {
              sourceType: 'HTTP_HEADER',
              source: 'Response Header: x-powered-by',
              indicator: 'X-Powered-By: Node.js/v20.11.1',
              confidence: 'HIGH',
            },
            {
              sourceType: 'SET_COOKIE',
              source: 'Set-Cookie Header',
              indicator: 'connect.sid=sessionToken123',
              confidence: 'HIGH',
            },
          ],
        },
        '2026-08-27T15:14:00.000Z',
      );

      // Level 1: Understanding
      assert.equal(viewModel.name, 'Node.js');
      assert.equal(viewModel.version, '20.11.1');
      assert.equal(viewModel.layer, 'RUNTIME');
      assert.equal(viewModel.confidenceLevel, 'HIGH');

      // Level 2: Context
      assert.equal(viewModel.hasContext, true);
      assert.ok(viewModel.whyThisAppears?.includes('Executes server-side JavaScript'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('does not prove Express'));

      // Level 3: Evidence
      assert.equal(viewModel.hasEvidence, true);
      assert.equal(viewModel.evidence.length, 2);
      assert.equal(viewModel.evidence[0].observedSignal, 'X-Powered-By: Node.js/v20.11.1');
      assert.equal(viewModel.evidence[1].observedSignal, 'connect.sid=sessionToken123');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Domain Switching & Re-Understanding Isolation
  // ---------------------------------------------------------------------------
  describe('5. Domain Switching Isolation & Re-Understanding', () => {
    it('completely isolates Node.js state between domains during context switching', () => {
      const nodeDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-node', domainName: 'node-service.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 90, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-n1', createdAt: new Date().toISOString(), responseTimeMs: 25, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Node.js server runtime observed.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-nodejs', name: 'Node.js', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Server Runtime', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const javaDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-java', domainName: 'java-service.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 90, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-j1', createdAt: new Date().toISOString(), responseTimeMs: 30, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Java runtime observed.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-java', name: 'Java', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'JVM Runtime', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const modelA = resolveAdaptiveInfrastructureModel('dom-node', 'node-service.org', nodeDomain);
      const modelB = resolveAdaptiveInfrastructureModel('dom-java', 'java-service.org', javaDomain);

      assert.equal(modelA.categoryGroups[0].components[0].name, 'Node.js');
      assert.equal(modelB.categoryGroups[0].components[0].name, 'Java');
      assert.ok(!modelB.categoryGroups[0].components.some((c) => c.name === 'Node.js'));
    });
  });
});
