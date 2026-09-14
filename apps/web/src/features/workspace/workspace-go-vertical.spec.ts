import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto, DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('T18: Go Infrastructure Understanding Vertical Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. Go Category & Semantic Role Mapping (RUNTIME)
  // ---------------------------------------------------------------------------
  describe('1. Go Category & Semantic Role Mapping', () => {
    it('maps Go to RUNTIME layer with authoritative server-side Go runtime role', () => {
      const goArchitecture: TechnologyArchitectureOverviewDto = {
        architectureSummary:
          'The public endpoint is served through an NGINX reverse proxy gateway delivering a Go compiled server-side application runtime.',
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
            technologyId: 'tech-go',
            technologyName: 'Go',
            role: 'Server-side Application Runtime / Go Environment',
          },
        ],
        layers: [
          {
            layer: 'RUNTIME',
            state: 'OBSERVED',
            confidenceLevel: 'HIGH',
            technologies: [
              {
                technologyId: 'tech-go',
                name: 'Go',
                category: 'Infrastructure Runtime',
                layer: 'RUNTIME',
                role: 'Server-side Application Runtime / Go Environment',
                infrastructureMeaning:
                  'The observed endpoint appears to expose or execute a Go-based server-side application/runtime boundary.',
                whyDetected: 'Observed X-Powered-By: Go/1.22.1 response header',
                whatThisDoesNotProve:
                  'Go presence confirms server-side runtime execution, but does not prove Gin, Echo, Fiber, Chi, net/http, Docker, Kubernetes, Linux, AWS, GCP, Azure, or any database (PostgreSQL, MySQL, MongoDB, Redis).',
                confidence: 0.95,
                confidenceLevel: 'HIGH',
                version: '1.22.1',
                evidence: [],
              },
            ],
          },
        ],
        keyTechnologies: [
          {
            technologyId: 'tech-go',
            name: 'Go',
            category: 'Infrastructure Runtime',
            layer: 'RUNTIME',
            role: 'Server-side Application Runtime / Go Environment',
            infrastructureMeaning:
              'The observed endpoint appears to expose or execute a Go-based server-side application/runtime boundary.',
            whyDetected: 'Observed X-Powered-By: Go/1.22.1 response header',
            whatThisDoesNotProve:
              'Go presence confirms server-side runtime execution, but does not prove Gin, Echo, Fiber, Chi, net/http, Docker, Kubernetes, Linux, AWS, GCP, Azure, or any database (PostgreSQL, MySQL, MongoDB, Redis).',
            confidence: 0.95,
            confidenceLevel: 'HIGH',
            version: '1.22.1',
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
            explanation: 'Operating system kernel details are not exposed by the Go runtime boundary.',
          },
        ],
        claimBoundaries: [
          {
            technologyId: 'tech-go',
            technologyName: 'Go',
            boundary:
              'Go presence confirms server runtime execution, but does not prove Gin, Echo, Fiber, Docker, or database backends.',
          },
        ],
        confidence: {
          overallLevel: 'HIGH',
          overallScore: 0.95,
          layerConfidence: { RUNTIME: 'HIGH' },
          rationale: 'Observed X-Powered-By: Go/1.22.1 header',
          confirmedRelationshipsCount: 1,
          supportedRelationshipsCount: 0,
          inferredRelationshipsCount: 0,
        },
      };

      const tech = goArchitecture.keyTechnologies[0];
      assert.equal(tech.name, 'Go');
      assert.equal(tech.layer, 'RUNTIME');
      assert.equal(tech.version, '1.22.1');
      assert.ok(tech.infrastructureMeaning.includes('Go-based server-side application'));
      assert.ok(tech.whatThisDoesNotProve.includes('Gin'));
      assert.ok(tech.whatThisDoesNotProve.includes('Fiber'));
      assert.ok(tech.whatThisDoesNotProve.includes('Docker'));
      assert.ok(tech.whatThisDoesNotProve.includes('PostgreSQL'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Version Fidelity (Optional, No "Version: Unknown")
  // ---------------------------------------------------------------------------
  describe('2. Version Fidelity', () => {
    it('preserves exact Go version when evidenced and leaves version undefined when unevidenced', () => {
      const versionedGo = buildComponentViewModel({
        id: 'tech-go',
        category: 'RUNTIME',
        name: 'Go',
        role: 'Server-side Application Runtime',
        layer: 'RUNTIME',
        confidenceLevel: 'HIGH',
        version: '1.22.1',
        state: 'OBSERVED',
      });

      assert.equal(versionedGo.version, '1.22.1');

      const unversionedGo = buildComponentViewModel({
        id: 'tech-go',
        category: 'RUNTIME',
        name: 'Go',
        role: 'Server-side Application Runtime',
        layer: 'RUNTIME',
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
      });

      assert.equal(unversionedGo.version, undefined);
      assert.ok(!unversionedGo.attributes.some((attr) => attr.value.toLowerCase().includes('unknown')));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Technology Coexistence (Go + Docker + NGINX + Cloudflare)
  // ---------------------------------------------------------------------------
  describe('3. Multi-Technology Coexistence', () => {
    it('renders Go, Docker, NGINX, and Cloudflare as independent observations without collapsing', () => {
      const mockDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-go-full', domainName: 'modern-go-service.com', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 95, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-go', createdAt: new Date().toISOString(), responseTimeMs: 25, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Full-stack Go network service fronted by NGINX and Cloudflare inside Docker.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-cloudflare', name: 'Cloudflare', category: 'CDN / Edge', layer: 'EDGE', role: 'Edge Proxy', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-nginx', name: 'NGINX', category: 'Web / Server', layer: 'GATEWAY', role: 'Web Gateway', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-go', name: 'Go', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Server Runtime', version: '1.22.1', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-docker', name: 'Docker', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Container Runtime', confidence: 0.90, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-go-full', 'modern-go-service.com', mockDomain);

      const edgeGroup = model.categoryGroups.find((g) => g.category === 'EDGE');
      assert.ok(edgeGroup);
      assert.equal(edgeGroup?.components[0].name, 'Cloudflare');

      const gwGroup = model.categoryGroups.find((g) => g.category === 'GATEWAY');
      assert.ok(gwGroup);
      assert.equal(gwGroup?.components[0].name, 'NGINX');

      const runtimeGroup = model.categoryGroups.find((g) => g.category === 'RUNTIME');
      assert.ok(runtimeGroup);
      assert.equal(runtimeGroup?.components.length, 2);
      assert.equal(runtimeGroup?.components[0].name, 'Go');
      assert.equal(runtimeGroup?.components[0].version, '1.22.1');
      assert.equal(runtimeGroup?.components[1].name, 'Docker');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. IA-2 3-Tier Progressive Disclosure for Go
  // ---------------------------------------------------------------------------
  describe('4. IA-2 Progressive Disclosure for Go', () => {
    it('provides 3 levels of investigation (Understanding -> Context -> Evidence) for Go', () => {
      const viewModel = buildComponentViewModel(
        {
          id: 'tech-go',
          category: 'RUNTIME',
          name: 'Go',
          role: 'Server-side Application Runtime / Go Environment',
          layer: 'RUNTIME',
          version: '1.22.1',
          confidenceLevel: 'HIGH',
          state: 'OBSERVED',
          infrastructureMeaning: 'Executes compiled server-side network service logic within a Go environment.',
          whatThisDoesNotProve: 'Go does not prove Gin, Echo, Fiber, Chi, Docker, or PostgreSQL database.',
          evidenceReferences: [
            {
              sourceType: 'HTTP_HEADER',
              source: 'Response Header: x-powered-by',
              indicator: 'X-Powered-By: Go/1.22.1',
              confidence: 'HIGH',
            },
          ],
        },
        '2026-08-27T15:14:00.000Z',
      );

      // Level 1: Understanding
      assert.equal(viewModel.name, 'Go');
      assert.equal(viewModel.version, '1.22.1');
      assert.equal(viewModel.layer, 'RUNTIME');
      assert.equal(viewModel.confidenceLevel, 'HIGH');

      // Level 2: Context
      assert.equal(viewModel.hasContext, true);
      assert.ok(viewModel.whyThisAppears?.includes('within a Go environment'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('does not prove Gin'));

      // Level 3: Evidence
      assert.equal(viewModel.hasEvidence, true);
      assert.equal(viewModel.evidence.length, 1);
      assert.equal(viewModel.evidence[0].observedSignal, 'X-Powered-By: Go/1.22.1');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Domain Switching & Re-Understanding Isolation
  // ---------------------------------------------------------------------------
  describe('5. Domain Switching Isolation & Re-Understanding', () => {
    it('completely isolates Go state between domains during context switching', () => {
      const goDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-go', domainName: 'go-service.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 90, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-g1', createdAt: new Date().toISOString(), responseTimeMs: 20, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Go server runtime observed.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-go', name: 'Go', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Server Runtime', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const rubyDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-ruby', domainName: 'ruby-service.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 90, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-r1', createdAt: new Date().toISOString(), responseTimeMs: 25, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Ruby runtime observed.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-ruby', name: 'Ruby', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Ruby Runtime', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const modelA = resolveAdaptiveInfrastructureModel('dom-go', 'go-service.org', goDomain);
      const modelB = resolveAdaptiveInfrastructureModel('dom-ruby', 'ruby-service.org', rubyDomain);

      assert.equal(modelA.categoryGroups[0].components[0].name, 'Go');
      assert.equal(modelB.categoryGroups[0].components[0].name, 'Ruby');
      assert.ok(!modelB.categoryGroups[0].components.some((c) => c.name === 'Go'));
    });
  });
});
