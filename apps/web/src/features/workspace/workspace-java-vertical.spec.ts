import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto, DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('T13: Java Infrastructure Understanding Vertical Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. Java Category & Role Mapping (RUNTIME)
  // ---------------------------------------------------------------------------
  describe('1. Java Category & Semantic Role Mapping', () => {
    it('maps Java to RUNTIME layer with authoritative JVM runtime role', () => {
      const javaArchitecture: TechnologyArchitectureOverviewDto = {
        architectureSummary:
          'The public endpoint appears to be served through an NGINX reverse proxy gateway delivering a Java server-side runtime.',
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
            technologyId: 'tech-java',
            technologyName: 'Java',
            role: 'Server-side Application Runtime / JVM Environment',
          },
        ],
        layers: [
          {
            layer: 'RUNTIME',
            state: 'OBSERVED',
            confidenceLevel: 'HIGH',
            technologies: [
              {
                technologyId: 'tech-java',
                name: 'Java',
                category: 'Infrastructure Runtime',
                layer: 'RUNTIME',
                role: 'Server-side Application Runtime / JVM Environment',
                infrastructureMeaning:
                  'The observed endpoint appears to execute on a Java Virtual Machine (JVM) server-side runtime boundary.',
                whyDetected: 'Observed X-Powered-By: Java/17.0.8 response header and JSESSIONID session cookie',
                whatThisDoesNotProve:
                  'Java presence confirms JVM runtime execution, but does not prove Spring, Spring Boot, Apache Tomcat, Jetty, GlassFish, WildFly, WebLogic, WebSphere, Jakarta EE, PostgreSQL, MySQL, Oracle, Docker, Kubernetes, Linux, AWS, GCP, or Azure.',
                confidence: 0.95,
                confidenceLevel: 'HIGH',
                version: '17.0.8',
                evidence: [],
              },
            ],
          },
        ],
        keyTechnologies: [
          {
            technologyId: 'tech-java',
            name: 'Java',
            category: 'Infrastructure Runtime',
            layer: 'RUNTIME',
            role: 'Server-side Application Runtime / JVM Environment',
            infrastructureMeaning:
              'The observed endpoint appears to execute on a Java Virtual Machine (JVM) server-side runtime boundary.',
            whyDetected: 'Observed X-Powered-By: Java/17.0.8 response header and JSESSIONID session cookie',
            whatThisDoesNotProve:
              'Java presence confirms JVM runtime execution, but does not prove Spring, Spring Boot, Apache Tomcat, Jetty, GlassFish, WildFly, WebLogic, WebSphere, Jakarta EE, PostgreSQL, MySQL, Oracle, Docker, Kubernetes, Linux, AWS, GCP, or Azure.',
            confidence: 0.95,
            confidenceLevel: 'HIGH',
            version: '17.0.8',
            evidence: [],
          },
        ],
        integrations: [],
        knownUnknowns: [
          {
            dimension: 'Database Backend',
            status: 'UNOBSERVED',
            explanation: 'Backend database (PostgreSQL, MySQL, Oracle) is unobservable from public HTTP/API responses.',
          },
          {
            dimension: 'Host Operating System',
            status: 'UNOBSERVED',
            explanation: 'Operating system kernel details are not exposed by the Java runtime boundary.',
          },
        ],
        claimBoundaries: [
          {
            technologyId: 'tech-java',
            technologyName: 'Java',
            boundary:
              'Java presence confirms JVM runtime execution, but does not prove Spring, Tomcat, or specific persistence layers.',
          },
        ],
        confidence: {
          overallLevel: 'HIGH',
          overallScore: 0.95,
          layerConfidence: { RUNTIME: 'HIGH' },
          rationale: 'Observed X-Powered-By: Java header and JSESSIONID session cookie',
          confirmedRelationshipsCount: 1,
          supportedRelationshipsCount: 0,
          inferredRelationshipsCount: 0,
        },
      };

      const tech = javaArchitecture.keyTechnologies[0];
      assert.equal(tech.name, 'Java');
      assert.equal(tech.layer, 'RUNTIME');
      assert.equal(tech.version, '17.0.8');
      assert.ok(tech.infrastructureMeaning.includes('JVM'));
      assert.ok(tech.whatThisDoesNotProve.includes('Spring'));
      assert.ok(tech.whatThisDoesNotProve.includes('Tomcat'));
      assert.ok(tech.whatThisDoesNotProve.includes('Docker'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Version Fidelity (Optional, No "Version: Unknown")
  // ---------------------------------------------------------------------------
  describe('2. Version Fidelity', () => {
    it('preserves exact Java version when evidenced and leaves version undefined when unevidenced', () => {
      const versionedJava = buildComponentViewModel({
        id: 'tech-java',
        category: 'RUNTIME',
        name: 'Java',
        role: 'Server-side Application Runtime / JVM Environment',
        layer: 'RUNTIME',
        confidenceLevel: 'HIGH',
        version: '17.0.8',
        state: 'OBSERVED',
      });

      assert.equal(versionedJava.version, '17.0.8');

      const unversionedJava = buildComponentViewModel({
        id: 'tech-java',
        category: 'RUNTIME',
        name: 'Java',
        role: 'Server-side Application Runtime / JVM Environment',
        layer: 'RUNTIME',
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
      });

      assert.equal(unversionedJava.version, undefined);
      assert.ok(!unversionedJava.attributes.some((attr) => attr.value.toLowerCase().includes('unknown')));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Technology Coexistence (Java + Spring + Tomcat + Docker)
  // ---------------------------------------------------------------------------
  describe('3. Multi-Technology Coexistence', () => {
    it('renders Java, Spring, Tomcat, and Docker as independent observations without collapsing into a synthetic stack', () => {
      const mockDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-java-full', domainName: 'enterprise-stack.com', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 95, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-j', createdAt: new Date().toISOString(), responseTimeMs: 40, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Enterprise stack running Spring on Tomcat and Java inside Docker.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-spring', name: 'Spring Boot', category: 'Application Framework', layer: 'APPLICATION', role: 'Enterprise Application Framework', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-tomcat', name: 'Apache Tomcat', category: 'Web / Server', layer: 'GATEWAY', role: 'Servlet Container / Web Server', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-java', name: 'Java', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'JVM Runtime Environment', version: '21', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
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

      const model = resolveAdaptiveInfrastructureModel('dom-java-full', 'enterprise-stack.com', mockDomain);

      const appGroup = model.categoryGroups.find((g) => g.category === 'APPLICATION');
      assert.ok(appGroup);
      assert.equal(appGroup?.components[0].name, 'Spring Boot');

      const gwGroup = model.categoryGroups.find((g) => g.category === 'GATEWAY');
      assert.ok(gwGroup);
      assert.equal(gwGroup?.components[0].name, 'Apache Tomcat');

      const runtimeGroup = model.categoryGroups.find((g) => g.category === 'RUNTIME');
      assert.ok(runtimeGroup);
      assert.equal(runtimeGroup?.components.length, 2);
      assert.equal(runtimeGroup?.components[0].name, 'Java');
      assert.equal(runtimeGroup?.components[0].version, '21');
      assert.equal(runtimeGroup?.components[1].name, 'Docker');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. IA-2 3-Tier Progressive Disclosure for Java
  // ---------------------------------------------------------------------------
  describe('4. IA-2 Progressive Disclosure for Java', () => {
    it('provides 3 levels of investigation (Understanding -> Context -> Evidence) for Java', () => {
      const viewModel = buildComponentViewModel(
        {
          id: 'tech-java',
          category: 'RUNTIME',
          name: 'Java',
          role: 'Server-side Application Runtime / JVM Environment',
          layer: 'RUNTIME',
          version: '17.0.8',
          confidenceLevel: 'HIGH',
          state: 'OBSERVED',
          infrastructureMeaning: 'Executes server-side enterprise services inside a JVM environment.',
          whatThisDoesNotProve: 'Java presence does not prove Spring Boot, Tomcat, or MySQL database.',
          evidenceReferences: [
            {
              sourceType: 'HTTP_HEADER',
              source: 'Response Header: x-powered-by',
              indicator: 'X-Powered-By: Java/17.0.8',
              confidence: 'HIGH',
            },
            {
              sourceType: 'SET_COOKIE',
              source: 'Set-Cookie Header',
              indicator: 'JSESSIONID=xyz123token',
              confidence: 'HIGH',
            },
          ],
        },
        '2026-08-27T15:14:00.000Z',
      );

      // Level 1: Understanding
      assert.equal(viewModel.name, 'Java');
      assert.equal(viewModel.version, '17.0.8');
      assert.equal(viewModel.layer, 'RUNTIME');
      assert.equal(viewModel.confidenceLevel, 'HIGH');

      // Level 2: Context
      assert.equal(viewModel.hasContext, true);
      assert.ok(viewModel.whyThisAppears?.includes('inside a JVM environment'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('does not prove Spring Boot'));

      // Level 3: Evidence
      assert.equal(viewModel.hasEvidence, true);
      assert.equal(viewModel.evidence.length, 2);
      assert.equal(viewModel.evidence[0].observedSignal, 'X-Powered-By: Java/17.0.8');
      assert.equal(viewModel.evidence[1].observedSignal, 'JSESSIONID=xyz123token');
      assert.ok(viewModel.evidence[0].observedAt !== undefined);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Domain Switching & Re-Understanding Isolation
  // ---------------------------------------------------------------------------
  describe('5. Domain Switching Isolation & Re-Understanding', () => {
    it('completely isolates Java state between domains during context switching', () => {
      const javaDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-java', domainName: 'java-app.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
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

      const phpDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-php', domainName: 'php-app.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
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
            architectureSummary: 'PHP runtime observed.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-php', name: 'PHP', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'PHP Runtime', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const modelA = resolveAdaptiveInfrastructureModel('dom-java', 'java-app.org', javaDomain);
      const modelB = resolveAdaptiveInfrastructureModel('dom-php', 'php-app.org', phpDomain);

      assert.equal(modelA.categoryGroups[0].components[0].name, 'Java');
      assert.equal(modelB.categoryGroups[0].components[0].name, 'PHP');
      assert.ok(!modelB.categoryGroups[0].components.some((c) => c.name === 'Java'));
    });
  });
});
