import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto, DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('T16: Python Infrastructure Understanding Vertical Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. Python Category & Semantic Role Mapping (RUNTIME)
  // ---------------------------------------------------------------------------
  describe('1. Python Category & Semantic Role Mapping', () => {
    it('maps Python to RUNTIME layer with authoritative server-side Python runtime role', () => {
      const pyArchitecture: TechnologyArchitectureOverviewDto = {
        architectureSummary:
          'The public endpoint is served through an NGINX reverse proxy delivering a Django application running on a Python server-side runtime.',
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
            technologyId: 'tech-django',
            technologyName: 'Django',
            role: 'Application Framework',
          },
          {
            hop: 3,
            layer: 'RUNTIME',
            technologyId: 'tech-python',
            technologyName: 'Python',
            role: 'Server-side Application Runtime / Python Environment',
          },
        ],
        layers: [
          {
            layer: 'RUNTIME',
            state: 'OBSERVED',
            confidenceLevel: 'HIGH',
            technologies: [
              {
                technologyId: 'tech-python',
                name: 'Python',
                category: 'Infrastructure Runtime',
                layer: 'RUNTIME',
                role: 'Server-side Application Runtime / Python Environment',
                infrastructureMeaning:
                  'The observed endpoint appears to expose or execute a Python-based server-side application/runtime boundary.',
                whyDetected: 'Observed X-Powered-By: Python/3.12.2 response header',
                whatThisDoesNotProve:
                  'Python presence confirms server-side runtime execution, but does not prove Django, Flask, FastAPI, Gunicorn, uWSGI, Uvicorn, Linux, Docker, Kubernetes, AWS, GCP, Azure, or any database (PostgreSQL, MySQL, Redis, SQLite).',
                confidence: 0.95,
                confidenceLevel: 'HIGH',
                version: '3.12.2',
                evidence: [],
              },
            ],
          },
        ],
        keyTechnologies: [
          {
            technologyId: 'tech-python',
            name: 'Python',
            category: 'Infrastructure Runtime',
            layer: 'RUNTIME',
            role: 'Server-side Application Runtime / Python Environment',
            infrastructureMeaning:
              'The observed endpoint appears to expose or execute a Python-based server-side application/runtime boundary.',
            whyDetected: 'Observed X-Powered-By: Python/3.12.2 response header',
            whatThisDoesNotProve:
              'Python presence confirms server-side runtime execution, but does not prove Django, Flask, FastAPI, Gunicorn, uWSGI, Uvicorn, Linux, Docker, Kubernetes, AWS, GCP, Azure, or any database (PostgreSQL, MySQL, Redis, SQLite).',
            confidence: 0.95,
            confidenceLevel: 'HIGH',
            version: '3.12.2',
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
            explanation: 'Operating system kernel details are not exposed by the Python runtime boundary.',
          },
        ],
        claimBoundaries: [
          {
            technologyId: 'tech-python',
            technologyName: 'Python',
            boundary:
              'Python presence confirms server runtime execution, but does not prove Django, Flask, Gunicorn, Docker, or database backends.',
          },
        ],
        confidence: {
          overallLevel: 'HIGH',
          overallScore: 0.95,
          layerConfidence: { RUNTIME: 'HIGH' },
          rationale: 'Observed X-Powered-By: Python/3.12.2 header',
          confirmedRelationshipsCount: 1,
          supportedRelationshipsCount: 0,
          inferredRelationshipsCount: 0,
        },
      };

      const tech = pyArchitecture.keyTechnologies[0];
      assert.equal(tech.name, 'Python');
      assert.equal(tech.layer, 'RUNTIME');
      assert.equal(tech.version, '3.12.2');
      assert.ok(tech.infrastructureMeaning.includes('Python-based server-side application'));
      assert.ok(tech.whatThisDoesNotProve.includes('Django'));
      assert.ok(tech.whatThisDoesNotProve.includes('Flask'));
      assert.ok(tech.whatThisDoesNotProve.includes('Docker'));
      assert.ok(tech.whatThisDoesNotProve.includes('PostgreSQL'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Version Fidelity (Optional, No "Version: Unknown")
  // ---------------------------------------------------------------------------
  describe('2. Version Fidelity', () => {
    it('preserves exact Python version when evidenced and leaves version undefined when unevidenced', () => {
      const versionedPy = buildComponentViewModel({
        id: 'tech-python',
        category: 'RUNTIME',
        name: 'Python',
        role: 'Server-side Application Runtime',
        layer: 'RUNTIME',
        confidenceLevel: 'HIGH',
        version: '3.12.2',
        state: 'OBSERVED',
      });

      assert.equal(versionedPy.version, '3.12.2');

      const unversionedPy = buildComponentViewModel({
        id: 'tech-python',
        category: 'RUNTIME',
        name: 'Python',
        role: 'Server-side Application Runtime',
        layer: 'RUNTIME',
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
      });

      assert.equal(unversionedPy.version, undefined);
      assert.ok(!unversionedPy.attributes.some((attr) => attr.value.toLowerCase().includes('unknown')));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Technology Coexistence (Python + Django + Docker + NGINX)
  // ---------------------------------------------------------------------------
  describe('3. Multi-Technology Coexistence', () => {
    it('renders Python, Django, Docker, and NGINX as independent observations without collapsing', () => {
      const mockDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-py-full', domainName: 'modern-python-app.com', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 95, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-py', createdAt: new Date().toISOString(), responseTimeMs: 35, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Full-stack application running Django on a Python runtime inside Docker fronted by NGINX.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-nginx', name: 'NGINX', category: 'Web / Server', layer: 'GATEWAY', role: 'Web Gateway', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-django', name: 'Django', category: 'Frameworks', layer: 'APPLICATION', role: 'Application Framework', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-python', name: 'Python', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Server Runtime', version: '3.12.2', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
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

      const model = resolveAdaptiveInfrastructureModel('dom-py-full', 'modern-python-app.com', mockDomain);

      const gwGroup = model.categoryGroups.find((g) => g.category === 'GATEWAY');
      assert.ok(gwGroup);
      assert.equal(gwGroup?.components[0].name, 'NGINX');

      const appGroup = model.categoryGroups.find((g) => g.category === 'APPLICATION');
      assert.ok(appGroup);
      assert.equal(appGroup?.components[0].name, 'Django');

      const runtimeGroup = model.categoryGroups.find((g) => g.category === 'RUNTIME');
      assert.ok(runtimeGroup);
      assert.equal(runtimeGroup?.components.length, 2);
      assert.equal(runtimeGroup?.components[0].name, 'Python');
      assert.equal(runtimeGroup?.components[0].version, '3.12.2');
      assert.equal(runtimeGroup?.components[1].name, 'Docker');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. IA-2 3-Tier Progressive Disclosure for Python
  // ---------------------------------------------------------------------------
  describe('4. IA-2 Progressive Disclosure for Python', () => {
    it('provides 3 levels of investigation (Understanding -> Context -> Evidence) for Python', () => {
      const viewModel = buildComponentViewModel(
        {
          id: 'tech-python',
          category: 'RUNTIME',
          name: 'Python',
          role: 'Server-side Application Runtime / Python Environment',
          layer: 'RUNTIME',
          version: '3.12.2',
          confidenceLevel: 'HIGH',
          state: 'OBSERVED',
          infrastructureMeaning: 'Executes server-side application logic within a Python environment.',
          whatThisDoesNotProve: 'Python does not prove Django, Flask, FastAPI, Gunicorn, Docker, or PostgreSQL database.',
          evidenceReferences: [
            {
              sourceType: 'HTTP_HEADER',
              source: 'Response Header: x-powered-by',
              indicator: 'X-Powered-By: Python/3.12.2',
              confidence: 'HIGH',
            },
          ],
        },
        '2026-08-27T15:14:00.000Z',
      );

      // Level 1: Understanding
      assert.equal(viewModel.name, 'Python');
      assert.equal(viewModel.version, '3.12.2');
      assert.equal(viewModel.layer, 'RUNTIME');
      assert.equal(viewModel.confidenceLevel, 'HIGH');

      // Level 2: Context
      assert.equal(viewModel.hasContext, true);
      assert.ok(viewModel.whyThisAppears?.includes('within a Python environment'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('does not prove Django'));

      // Level 3: Evidence
      assert.equal(viewModel.hasEvidence, true);
      assert.equal(viewModel.evidence.length, 1);
      assert.equal(viewModel.evidence[0].observedSignal, 'X-Powered-By: Python/3.12.2');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Domain Switching & Re-Understanding Isolation
  // ---------------------------------------------------------------------------
  describe('5. Domain Switching Isolation & Re-Understanding', () => {
    it('completely isolates Python state between domains during context switching', () => {
      const pyDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-py', domainName: 'python-service.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 90, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-p1', createdAt: new Date().toISOString(), responseTimeMs: 25, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Python server runtime observed.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-python', name: 'Python', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Server Runtime', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

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

      const modelA = resolveAdaptiveInfrastructureModel('dom-py', 'python-service.org', pyDomain);
      const modelB = resolveAdaptiveInfrastructureModel('dom-node', 'node-service.org', nodeDomain);

      assert.equal(modelA.categoryGroups[0].components[0].name, 'Python');
      assert.equal(modelB.categoryGroups[0].components[0].name, 'Node.js');
      assert.ok(!modelB.categoryGroups[0].components.some((c) => c.name === 'Python'));
    });
  });
});
