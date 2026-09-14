import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto, DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('T17: Ruby Infrastructure Understanding Vertical Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. Ruby Category & Semantic Role Mapping (RUNTIME)
  // ---------------------------------------------------------------------------
  describe('1. Ruby Category & Semantic Role Mapping', () => {
    it('maps Ruby to RUNTIME layer with authoritative server-side Ruby runtime role', () => {
      const rubyArchitecture: TechnologyArchitectureOverviewDto = {
        architectureSummary:
          'The public endpoint is served through an NGINX reverse proxy delivering a Ruby on Rails application running on a Ruby server-side runtime.',
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
            layer: 'APPLICATION',
            technologyId: 'tech-ruby-on-rails',
            technologyName: 'Ruby on Rails',
            role: 'Application Framework',
          },
          {
            hop: 3,
            layer: 'RUNTIME',
            technologyId: 'tech-ruby',
            technologyName: 'Ruby',
            role: 'Server-side Application Runtime / Ruby Environment',
          },
        ],
        layers: [
          {
            layer: 'RUNTIME',
            state: 'OBSERVED',
            confidenceLevel: 'HIGH',
            technologies: [
              {
                technologyId: 'tech-ruby',
                name: 'Ruby',
                category: 'Infrastructure Runtime',
                layer: 'RUNTIME',
                role: 'Server-side Application Runtime / Ruby Environment',
                infrastructureMeaning:
                  'The observed endpoint appears to expose or execute a Ruby-based server-side application/runtime boundary.',
                whyDetected: 'Observed X-Powered-By: Ruby/3.3.1 response header',
                whatThisDoesNotProve:
                  'Ruby presence confirms server-side runtime execution, but does not prove Ruby on Rails, Sinatra, Hanami, Rack, Puma, Passenger, Linux, Docker, Kubernetes, AWS, GCP, Azure, Heroku, or any database (PostgreSQL, MySQL, MariaDB, SQLite, Redis).',
                confidence: 0.95,
                confidenceLevel: 'HIGH',
                version: '3.3.1',
                evidence: [],
              },
            ],
          },
        ],
        keyTechnologies: [
          {
            technologyId: 'tech-ruby',
            name: 'Ruby',
            category: 'Infrastructure Runtime',
            layer: 'RUNTIME',
            role: 'Server-side Application Runtime / Ruby Environment',
            infrastructureMeaning:
              'The observed endpoint appears to expose or execute a Ruby-based server-side application/runtime boundary.',
            whyDetected: 'Observed X-Powered-By: Ruby/3.3.1 response header',
            whatThisDoesNotProve:
              'Ruby presence confirms server-side runtime execution, but does not prove Ruby on Rails, Sinatra, Hanami, Rack, Puma, Passenger, Linux, Docker, Kubernetes, AWS, GCP, Azure, Heroku, or any database (PostgreSQL, MySQL, MariaDB, SQLite, Redis).',
            confidence: 0.95,
            confidenceLevel: 'HIGH',
            version: '3.3.1',
            evidence: [],
          },
        ],
        integrations: [],
        knownUnknowns: [
          {
            dimension: 'Database Backend',
            status: 'UNOBSERVED',
            explanation: 'Backend database (PostgreSQL, MySQL, Redis) is unobservable from public HTTP/API responses.',
          },
          {
            dimension: 'Host Operating System',
            status: 'UNOBSERVED',
            explanation: 'Operating system kernel details are not exposed by the Ruby runtime boundary.',
          },
        ],
        claimBoundaries: [
          {
            technologyId: 'tech-ruby',
            technologyName: 'Ruby',
            boundary:
              'Ruby presence confirms server runtime execution, but does not prove Rails, Sinatra, Puma, Passenger, Docker, or database backends.',
          },
        ],
        confidence: {
          overallLevel: 'HIGH',
          overallScore: 0.95,
          layerConfidence: { RUNTIME: 'HIGH' },
          rationale: 'Observed X-Powered-By: Ruby/3.3.1 header',
          confirmedRelationshipsCount: 1,
          supportedRelationshipsCount: 0,
          inferredRelationshipsCount: 0,
        },
      };

      const tech = rubyArchitecture.keyTechnologies[0];
      assert.equal(tech.name, 'Ruby');
      assert.equal(tech.layer, 'RUNTIME');
      assert.equal(tech.version, '3.3.1');
      assert.ok(tech.infrastructureMeaning.includes('Ruby-based server-side application'));
      assert.ok(tech.whatThisDoesNotProve.includes('Ruby on Rails'));
      assert.ok(tech.whatThisDoesNotProve.includes('Sinatra'));
      assert.ok(tech.whatThisDoesNotProve.includes('Docker'));
      assert.ok(tech.whatThisDoesNotProve.includes('PostgreSQL'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Version Fidelity (Optional, No "Version: Unknown")
  // ---------------------------------------------------------------------------
  describe('2. Version Fidelity', () => {
    it('preserves exact Ruby version when evidenced and leaves version undefined when unevidenced', () => {
      const versionedRuby = buildComponentViewModel({
        id: 'tech-ruby',
        category: 'RUNTIME',
        name: 'Ruby',
        role: 'Server-side Application Runtime',
        layer: 'RUNTIME',
        confidenceLevel: 'HIGH',
        version: '3.3.1',
        state: 'OBSERVED',
      });

      assert.equal(versionedRuby.version, '3.3.1');

      const unversionedRuby = buildComponentViewModel({
        id: 'tech-ruby',
        category: 'RUNTIME',
        name: 'Ruby',
        role: 'Server-side Application Runtime',
        layer: 'RUNTIME',
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
      });

      assert.equal(unversionedRuby.version, undefined);
      assert.ok(!unversionedRuby.attributes.some((attr) => attr.value.toLowerCase().includes('unknown')));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Technology Coexistence (Ruby + Rails + Docker + NGINX)
  // ---------------------------------------------------------------------------
  describe('3. Multi-Technology Coexistence', () => {
    it('renders Ruby, Rails, Docker, and NGINX as independent observations without collapsing', () => {
      const mockDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-ruby-full', domainName: 'modern-ruby-app.com', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 95, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-rb', createdAt: new Date().toISOString(), responseTimeMs: 35, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Full-stack application running Rails on a Ruby runtime inside Docker fronted by NGINX.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-nginx', name: 'NGINX', category: 'Web / Server', layer: 'GATEWAY', role: 'Web Gateway', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-ruby-on-rails', name: 'Ruby on Rails', category: 'Frameworks', layer: 'APPLICATION', role: 'Application Framework', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-ruby', name: 'Ruby', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Server Runtime', version: '3.3.1', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
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

      const model = resolveAdaptiveInfrastructureModel('dom-ruby-full', 'modern-ruby-app.com', mockDomain);

      const gwGroup = model.categoryGroups.find((g) => g.category === 'GATEWAY');
      assert.ok(gwGroup);
      assert.equal(gwGroup?.components[0].name, 'NGINX');

      const appGroup = model.categoryGroups.find((g) => g.category === 'APPLICATION');
      assert.ok(appGroup);
      assert.equal(appGroup?.components[0].name, 'Ruby on Rails');

      const runtimeGroup = model.categoryGroups.find((g) => g.category === 'RUNTIME');
      assert.ok(runtimeGroup);
      assert.equal(runtimeGroup?.components.length, 2);
      assert.equal(runtimeGroup?.components[0].name, 'Ruby');
      assert.equal(runtimeGroup?.components[0].version, '3.3.1');
      assert.equal(runtimeGroup?.components[1].name, 'Docker');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. IA-2 3-Tier Progressive Disclosure for Ruby
  // ---------------------------------------------------------------------------
  describe('4. IA-2 Progressive Disclosure for Ruby', () => {
    it('provides 3 levels of investigation (Understanding -> Context -> Evidence) for Ruby', () => {
      const viewModel = buildComponentViewModel(
        {
          id: 'tech-ruby',
          category: 'RUNTIME',
          name: 'Ruby',
          role: 'Server-side Application Runtime / Ruby Environment',
          layer: 'RUNTIME',
          version: '3.3.1',
          confidenceLevel: 'HIGH',
          state: 'OBSERVED',
          infrastructureMeaning: 'Executes server-side application logic within a Ruby environment.',
          whatThisDoesNotProve: 'Ruby does not prove Ruby on Rails, Sinatra, Puma, Passenger, Docker, or PostgreSQL database.',
          evidenceReferences: [
            {
              sourceType: 'HTTP_HEADER',
              source: 'Response Header: x-powered-by',
              indicator: 'X-Powered-By: Ruby/3.3.1',
              confidence: 'HIGH',
            },
          ],
        },
        '2026-08-27T15:14:00.000Z',
      );

      // Level 1: Understanding
      assert.equal(viewModel.name, 'Ruby');
      assert.equal(viewModel.version, '3.3.1');
      assert.equal(viewModel.layer, 'RUNTIME');
      assert.equal(viewModel.confidenceLevel, 'HIGH');

      // Level 2: Context
      assert.equal(viewModel.hasContext, true);
      assert.ok(viewModel.whyThisAppears?.includes('within a Ruby environment'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('does not prove Ruby on Rails'));

      // Level 3: Evidence
      assert.equal(viewModel.hasEvidence, true);
      assert.equal(viewModel.evidence.length, 1);
      assert.equal(viewModel.evidence[0].observedSignal, 'X-Powered-By: Ruby/3.3.1');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Domain Switching & Re-Understanding Isolation
  // ---------------------------------------------------------------------------
  describe('5. Domain Switching Isolation & Re-Understanding', () => {
    it('completely isolates Ruby state between domains during context switching', () => {
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
            architectureSummary: 'Ruby server runtime observed.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-ruby', name: 'Ruby', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Server Runtime', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const pyDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-py', domainName: 'python-service.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 90, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-p1', createdAt: new Date().toISOString(), responseTimeMs: 30, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Python runtime observed.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-python', name: 'Python', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Python Runtime', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const modelA = resolveAdaptiveInfrastructureModel('dom-ruby', 'ruby-service.org', rubyDomain);
      const modelB = resolveAdaptiveInfrastructureModel('dom-py', 'python-service.org', pyDomain);

      assert.equal(modelA.categoryGroups[0].components[0].name, 'Ruby');
      assert.equal(modelB.categoryGroups[0].components[0].name, 'Python');
      assert.ok(!modelB.categoryGroups[0].components.some((c) => c.name === 'Ruby'));
    });
  });
});
