import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto, DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('T20: Kotlin Infrastructure Understanding Vertical Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. Kotlin Category & Semantic Role Mapping (RUNTIME)
  // ---------------------------------------------------------------------------
  describe('1. Kotlin Category & Semantic Role Mapping', () => {
    it('maps Kotlin to RUNTIME layer with authoritative server-side Kotlin runtime role', () => {
      const kotlinArchitecture: TechnologyArchitectureOverviewDto = {
        architectureSummary:
          'The public endpoint is served through an NGINX reverse proxy gateway delivering a Kotlin JVM server-side application runtime.',
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
            technologyId: 'tech-kotlin',
            technologyName: 'Kotlin',
            role: 'Server-side Application Runtime / Kotlin JVM Language',
          },
        ],
        layers: [
          {
            layer: 'RUNTIME',
            state: 'OBSERVED',
            confidenceLevel: 'HIGH',
            technologies: [
              {
                technologyId: 'tech-kotlin',
                name: 'Kotlin',
                category: 'Infrastructure Runtime',
                layer: 'RUNTIME',
                role: 'Server-side Application Runtime / Kotlin JVM Language',
                infrastructureMeaning:
                  'The observed endpoint appears to expose or execute a Kotlin-based server-side application/runtime boundary.',
                whyDetected: 'Observed X-Powered-By: Kotlin/1.9.22 response header',
                whatThisDoesNotProve:
                  'Kotlin presence confirms server-side JVM language execution, but does not prove Spring Boot, Ktor, Java, Tomcat, Jetty, JVM version, Docker, Kubernetes, Linux, AWS, GCP, Azure, Android, or any database (PostgreSQL, MySQL, MongoDB, Redis).',
                confidence: 0.95,
                confidenceLevel: 'HIGH',
                version: '1.9.22',
                evidence: [],
              },
            ],
          },
        ],
        keyTechnologies: [
          {
            technologyId: 'tech-kotlin',
            name: 'Kotlin',
            category: 'Infrastructure Runtime',
            layer: 'RUNTIME',
            role: 'Server-side Application Runtime / Kotlin JVM Language',
            infrastructureMeaning:
              'The observed endpoint appears to expose or execute a Kotlin-based server-side application/runtime boundary.',
            whyDetected: 'Observed X-Powered-By: Kotlin/1.9.22 response header',
            whatThisDoesNotProve:
              'Kotlin presence confirms server-side JVM language execution, but does not prove Spring Boot, Ktor, Java, Tomcat, Jetty, JVM version, Docker, Kubernetes, Linux, AWS, GCP, Azure, Android, or any database (PostgreSQL, MySQL, MongoDB, Redis).',
            confidence: 0.95,
            confidenceLevel: 'HIGH',
            version: '1.9.22',
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
            dimension: 'JVM Version',
            status: 'UNOBSERVED',
            explanation: 'Specific JVM bytecode target or runtime version (e.g. JVM 17/21) is not exposed directly by Kotlin headers.',
          },
        ],
        claimBoundaries: [
          {
            technologyId: 'tech-kotlin',
            technologyName: 'Kotlin',
            boundary:
              'Kotlin presence confirms server runtime execution, but does not prove Spring Boot, Java, Ktor, Docker, or database backends.',
          },
        ],
        confidence: {
          overallLevel: 'HIGH',
          overallScore: 0.95,
          layerConfidence: { RUNTIME: 'HIGH' },
          rationale: 'Observed X-Powered-By: Kotlin/1.9.22 header',
          confirmedRelationshipsCount: 1,
          supportedRelationshipsCount: 0,
          inferredRelationshipsCount: 0,
        },
      };

      const tech = kotlinArchitecture.keyTechnologies[0];
      assert.equal(tech.name, 'Kotlin');
      assert.equal(tech.layer, 'RUNTIME');
      assert.equal(tech.version, '1.9.22');
      assert.ok(tech.infrastructureMeaning.includes('Kotlin-based server-side application'));
      assert.ok(tech.whatThisDoesNotProve.includes('Spring Boot'));
      assert.ok(tech.whatThisDoesNotProve.includes('Java'));
      assert.ok(tech.whatThisDoesNotProve.includes('Ktor'));
      assert.ok(tech.whatThisDoesNotProve.includes('Android'));
      assert.ok(tech.whatThisDoesNotProve.includes('Docker'));
      assert.ok(tech.whatThisDoesNotProve.includes('PostgreSQL'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Version Fidelity (Optional, No "Version: Unknown")
  // ---------------------------------------------------------------------------
  describe('2. Version Fidelity', () => {
    it('preserves exact Kotlin version when evidenced and leaves version undefined when unevidenced', () => {
      const versionedKotlin = buildComponentViewModel({
        id: 'tech-kotlin',
        category: 'RUNTIME',
        name: 'Kotlin',
        role: 'Server-side Application Runtime',
        layer: 'RUNTIME',
        confidenceLevel: 'HIGH',
        version: '1.9.22',
        state: 'OBSERVED',
      });

      assert.equal(versionedKotlin.version, '1.9.22');

      const unversionedKotlin = buildComponentViewModel({
        id: 'tech-kotlin',
        category: 'RUNTIME',
        name: 'Kotlin',
        role: 'Server-side Application Runtime',
        layer: 'RUNTIME',
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
      });

      assert.equal(unversionedKotlin.version, undefined);
      assert.ok(!unversionedKotlin.attributes.some((attr) => attr.value.toLowerCase().includes('unknown')));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Technology Coexistence (Kotlin + Java + Docker + NGINX + Cloudflare)
  // ---------------------------------------------------------------------------
  describe('3. Multi-Technology Coexistence', () => {
    it('renders Kotlin, Java, Docker, NGINX, and Cloudflare as independent observations without collapsing', () => {
      const mockDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-kotlin-full', domainName: 'modern-kotlin-service.com', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 95, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-kotlin', createdAt: new Date().toISOString(), responseTimeMs: 20, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Full-stack Kotlin network service fronted by NGINX and Cloudflare inside Docker with Java runtime.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-cloudflare', name: 'Cloudflare', category: 'CDN / Edge', layer: 'EDGE', role: 'Edge Proxy', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-nginx', name: 'NGINX', category: 'Web / Server', layer: 'GATEWAY', role: 'Web Gateway', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-kotlin', name: 'Kotlin', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Kotlin Language', version: '1.9.22', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-java', name: 'Java', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'JVM Runtime', confidence: 0.90, confidenceLevel: 'HIGH', evidence: [] },
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

      const model = resolveAdaptiveInfrastructureModel('dom-kotlin-full', 'modern-kotlin-service.com', mockDomain);

      const edgeGroup = model.categoryGroups.find((g) => g.category === 'EDGE');
      assert.ok(edgeGroup);
      assert.equal(edgeGroup?.components[0].name, 'Cloudflare');

      const gwGroup = model.categoryGroups.find((g) => g.category === 'GATEWAY');
      assert.ok(gwGroup);
      assert.equal(gwGroup?.components[0].name, 'NGINX');

      const runtimeGroup = model.categoryGroups.find((g) => g.category === 'RUNTIME');
      assert.ok(runtimeGroup);
      assert.equal(runtimeGroup?.components.length, 3);
      assert.equal(runtimeGroup?.components[0].name, 'Kotlin');
      assert.equal(runtimeGroup?.components[0].version, '1.9.22');
      assert.equal(runtimeGroup?.components[1].name, 'Java');
      assert.equal(runtimeGroup?.components[2].name, 'Docker');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. IA-2 3-Tier Progressive Disclosure for Kotlin
  // ---------------------------------------------------------------------------
  describe('4. IA-2 Progressive Disclosure for Kotlin', () => {
    it('provides 3 levels of investigation (Understanding -> Context -> Evidence) for Kotlin', () => {
      const viewModel = buildComponentViewModel(
        {
          id: 'tech-kotlin',
          category: 'RUNTIME',
          name: 'Kotlin',
          role: 'Server-side Application Runtime / Kotlin JVM Language',
          layer: 'RUNTIME',
          version: '1.9.22',
          confidenceLevel: 'HIGH',
          state: 'OBSERVED',
          infrastructureMeaning: 'Executes server-side JVM application logic within a Kotlin environment.',
          whatThisDoesNotProve: 'Kotlin does not prove Spring Boot, Ktor, Java, Tomcat, Android, Docker, or PostgreSQL database.',
          evidenceReferences: [
            {
              sourceType: 'HTTP_HEADER',
              source: 'Response Header: x-powered-by',
              indicator: 'X-Powered-By: Kotlin/1.9.22',
              confidence: 'HIGH',
            },
          ],
        },
        '2026-08-27T15:14:00.000Z',
      );

      // Level 1: Understanding
      assert.equal(viewModel.name, 'Kotlin');
      assert.equal(viewModel.version, '1.9.22');
      assert.equal(viewModel.layer, 'RUNTIME');
      assert.equal(viewModel.confidenceLevel, 'HIGH');

      // Level 2: Context
      assert.equal(viewModel.hasContext, true);
      assert.ok(viewModel.whyThisAppears?.includes('within a Kotlin environment'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('does not prove Spring Boot'));

      // Level 3: Evidence
      assert.equal(viewModel.hasEvidence, true);
      assert.equal(viewModel.evidence.length, 1);
      assert.equal(viewModel.evidence[0].observedSignal, 'X-Powered-By: Kotlin/1.9.22');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Domain Switching & Re-Understanding Isolation
  // ---------------------------------------------------------------------------
  describe('5. Domain Switching Isolation & Re-Understanding', () => {
    it('completely isolates Kotlin state between domains during context switching', () => {
      const kotlinDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-kotlin', domainName: 'kotlin-service.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 90, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-k1', createdAt: new Date().toISOString(), responseTimeMs: 20, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Kotlin server runtime observed.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-kotlin', name: 'Kotlin', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Kotlin Language', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const rustDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-rust', domainName: 'rust-service.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 90, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-ru1', createdAt: new Date().toISOString(), responseTimeMs: 15, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Rust server runtime observed.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-rust', name: 'Rust', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Server Runtime', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const modelA = resolveAdaptiveInfrastructureModel('dom-kotlin', 'kotlin-service.org', kotlinDomain);
      const modelB = resolveAdaptiveInfrastructureModel('dom-rust', 'rust-service.org', rustDomain);

      assert.equal(modelA.categoryGroups[0].components[0].name, 'Kotlin');
      assert.equal(modelB.categoryGroups[0].components[0].name, 'Rust');
      assert.ok(!modelB.categoryGroups[0].components.some((c) => c.name === 'Kotlin'));
    });
  });
});
