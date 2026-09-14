import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveAdaptiveInfrastructureModel,
  normalizeSemanticCategory,
  type AdaptiveInfrastructureModel,
  type SemanticInfrastructureCategory,
} from './contracts/adaptive-infrastructure.contract.ts';
import type { DomainOverviewResponseDto } from '../../types/api/overview.dto';

describe('IA-1: Adaptive Infrastructure Information Model Contracts & Architecture Certification', () => {
  // ---------------------------------------------------------------------------
  // IA-1.1: Semantic Category Normalization (Data-Driven, Zero Hardcoded Tech Names)
  // ---------------------------------------------------------------------------
  describe('IA-1.1: Semantic Category Normalization', () => {
    it('maps standard layers and categories into canonical semantic infrastructure categories', () => {
      assert.equal(normalizeSemanticCategory('EDGE'), 'EDGE');
      assert.equal(normalizeSemanticCategory('CDN / Edge'), 'EDGE');
      assert.equal(normalizeSemanticCategory('GATEWAY'), 'GATEWAY');
      assert.equal(normalizeSemanticCategory('Web / Server'), 'GATEWAY');
      assert.equal(normalizeSemanticCategory('APPLICATION'), 'APPLICATION');
      assert.equal(normalizeSemanticCategory('Web Application Framework'), 'APPLICATION');
      assert.equal(normalizeSemanticCategory('PLATFORM'), 'PLATFORM');
      assert.equal(normalizeSemanticCategory('CMS / Platforms'), 'PLATFORM');
      assert.equal(normalizeSemanticCategory('RUNTIME'), 'RUNTIME');
      assert.equal(normalizeSemanticCategory('Infrastructure Runtime'), 'RUNTIME');
      assert.equal(normalizeSemanticCategory('HOSTING'), 'HOSTING');
      assert.equal(normalizeSemanticCategory('Cloud / Origin'), 'HOSTING');
      assert.equal(normalizeSemanticCategory('DNS'), 'DNS');
      assert.equal(normalizeSemanticCategory('TLS'), 'TLS');
      assert.equal(normalizeSemanticCategory('NETWORK'), 'NETWORK');
      assert.equal(normalizeSemanticCategory('DATABASE'), 'DATABASE');
      assert.equal(normalizeSemanticCategory('CACHE'), 'CACHE');
      assert.equal(normalizeSemanticCategory('SECURITY'), 'SECURITY');
    });

    it('falls back to OTHER for unrecognized or custom categories without breaking', () => {
      assert.equal(normalizeSemanticCategory('Custom Integration'), 'OTHER');
      assert.equal(normalizeSemanticCategory(undefined), 'OTHER');
    });
  });

  // ---------------------------------------------------------------------------
  // IA-1.2: Adaptive Composition across Diverse Infrastructure Shapes
  // ---------------------------------------------------------------------------
  describe('IA-1.2: Adaptive Composition across Diverse Infrastructure Shapes', () => {
    it('Domain A (Edge + Gateway + Application + Runtime): groups dynamically without forced empty categories', () => {
      const mockDomainA: DomainOverviewResponseDto = {
        domain: { id: 'dom-a', domainName: 'domain-a.com', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 95, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-a', createdAt: new Date().toISOString(), responseTimeMs: 120, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          cdn: 'Cloudflare',
          webServer: 'nginx/1.24.0',
          technologies: ['Next.js', 'React', 'Node.js'],
          technologyArchitecture: {
            architectureSummary: 'Next.js application served behind Cloudflare edge and NGINX gateway.',
            ingressPath: [
              { hop: 0, layer: 'EDGE', technologyId: 'tech-cf', technologyName: 'Cloudflare', role: 'Edge Delivery & WAF' },
              { hop: 1, layer: 'GATEWAY', technologyId: 'tech-nginx', technologyName: 'NGINX', role: 'Web Gateway' },
              { hop: 2, layer: 'APPLICATION', technologyId: 'tech-nextjs', technologyName: 'Next.js', role: 'Full-stack App Framework' },
              { hop: 3, layer: 'APPLICATION', technologyId: 'tech-react', technologyName: 'React', role: 'UI Presentation' },
              { hop: 4, layer: 'RUNTIME', technologyId: 'tech-nodejs', technologyName: 'Node.js', role: 'JavaScript Runtime' },
            ],
            keyTechnologies: [
              { technologyId: 'tech-cf', name: 'Cloudflare', category: 'CDN / Edge', layer: 'EDGE', role: 'Edge Delivery & WAF', confidence: 0.99, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-nginx', name: 'NGINX', category: 'Web / Server', layer: 'GATEWAY', role: 'Web Gateway', version: '1.24.0', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-nextjs', name: 'Next.js', category: 'Web Application Framework', layer: 'APPLICATION', role: 'Full-stack App Framework', confidence: 0.92, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-react', name: 'React', category: 'Client UI Library', layer: 'APPLICATION', role: 'UI Presentation', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-nodejs', name: 'Node.js', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'JavaScript Runtime', confidence: 0.90, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [
              { dimension: 'Database Backend', status: 'UNOBSERVED', explanation: 'Database engine is unobservable.' },
            ],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 4, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-a', 'domain-a.com', mockDomainA);

      assert.equal(model.hasObservedInfrastructure, true);
      assert.equal(model.ingressPath.length, 5);

      const observedCategoryNames = model.categoryGroups.map((g) => g.category);
      assert.ok(observedCategoryNames.includes('EDGE'));
      assert.ok(observedCategoryNames.includes('GATEWAY'));
      assert.ok(observedCategoryNames.includes('APPLICATION'));
      assert.ok(observedCategoryNames.includes('RUNTIME'));

      // INVARIANT: DATABASE must NOT be in observed categoryGroups because it is unobserved
      assert.ok(!observedCategoryNames.includes('DATABASE'));

      // INVARIANT: Unobserved dimension is preserved faithfully
      assert.equal(model.unobservedDimensions.length, 1);
      assert.equal(model.unobservedDimensions[0].dimension, 'Database Backend');
      assert.equal(model.unobservedDimensions[0].status, 'UNOBSERVED');
    });

    it('Domain B (Gateway + Django + Python + Route53 + TLS 1.3): renders distinct shape with zero Edge or Platform cards', () => {
      const mockDomainB: DomainOverviewResponseDto = {
        domain: { id: 'dom-b', domainName: 'django-app.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 90, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-b', createdAt: new Date().toISOString(), responseTimeMs: 90, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          webServer: 'nginx',
          technologies: ['Django', 'Python'],
          technologyArchitecture: {
            architectureSummary: 'Django application served via NGINX gateway.',
            ingressPath: [
              { hop: 0, layer: 'GATEWAY', technologyId: 'tech-nginx', technologyName: 'NGINX', role: 'Web Gateway' },
              { hop: 1, layer: 'APPLICATION', technologyId: 'tech-django', technologyName: 'Django', role: 'Application Framework' },
              { hop: 2, layer: 'RUNTIME', technologyId: 'tech-python', technologyName: 'Python', role: 'Execution Runtime' },
            ],
            keyTechnologies: [
              { technologyId: 'tech-nginx', name: 'NGINX', category: 'Web / Server', layer: 'GATEWAY', role: 'Web Gateway', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-django', name: 'Django', category: 'Application Framework', layer: 'APPLICATION', role: 'Application Framework', confidence: 0.92, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-python', name: 'Python', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Execution Runtime', confidence: 0.90, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.92, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 2, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-b', 'django-app.org', mockDomainB);
      const observedCategoryNames = model.categoryGroups.map((g) => g.category);

      assert.ok(observedCategoryNames.includes('GATEWAY'));
      assert.ok(observedCategoryNames.includes('APPLICATION'));
      assert.ok(observedCategoryNames.includes('RUNTIME'));
      assert.ok(!observedCategoryNames.includes('EDGE'), 'No Edge category when CDN is unobserved');
      assert.ok(!observedCategoryNames.includes('PLATFORM'), 'No Platform category when CMS is unobserved');
    });

    it('Domain C (WordPress + PHP + Fastly + NGINX): renders CMS Platform and PHP Runtime', () => {
      const mockDomainC: DomainOverviewResponseDto = {
        domain: { id: 'dom-c', domainName: 'wp-portal.com', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 85, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-c', createdAt: new Date().toISOString(), responseTimeMs: 140, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          cdn: 'Fastly',
          webServer: 'nginx',
          technologies: ['WordPress', 'PHP'],
          technologyArchitecture: {
            architectureSummary: 'WordPress CMS on PHP runtime delivered through Fastly edge.',
            ingressPath: [
              { hop: 0, layer: 'EDGE', technologyId: 'tech-fastly', technologyName: 'Fastly', role: 'Edge Delivery' },
              { hop: 1, layer: 'GATEWAY', technologyId: 'tech-nginx', technologyName: 'NGINX', role: 'Web Gateway' },
              { hop: 2, layer: 'PLATFORM', technologyId: 'tech-wp', technologyName: 'WordPress', role: 'CMS Platform' },
              { hop: 3, layer: 'RUNTIME', technologyId: 'tech-php', technologyName: 'PHP', role: 'Server-side Runtime' },
            ],
            keyTechnologies: [
              { technologyId: 'tech-fastly', name: 'Fastly', category: 'CDN / Edge', layer: 'EDGE', role: 'Edge Delivery', confidence: 0.98, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-nginx', name: 'NGINX', category: 'Web / Server', layer: 'GATEWAY', role: 'Web Gateway', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-wp', name: 'WordPress', category: 'CMS / Platforms', layer: 'PLATFORM', role: 'CMS Platform', version: '6.4.2', confidence: 0.98, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-php', name: 'PHP', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Server-side Runtime', version: '8.2.14', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.96, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 3, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-c', 'wp-portal.com', mockDomainC);
      const observedCategoryNames = model.categoryGroups.map((g) => g.category);

      assert.ok(observedCategoryNames.includes('EDGE'));
      assert.ok(observedCategoryNames.includes('GATEWAY'));
      assert.ok(observedCategoryNames.includes('PLATFORM'));
      assert.ok(observedCategoryNames.includes('RUNTIME'));

      const platformGroup = model.categoryGroups.find((g) => g.category === 'PLATFORM');
      assert.equal(platformGroup?.components[0].name, 'WordPress');
      assert.equal(platformGroup?.components[0].version, '6.4.2');

      const runtimeGroup = model.categoryGroups.find((g) => g.category === 'RUNTIME');
      assert.equal(runtimeGroup?.components[0].name, 'PHP');
      assert.equal(runtimeGroup?.components[0].version, '8.2.14');
    });
  });

  // ---------------------------------------------------------------------------
  // IA-1.3: Extensibility Invariant (Synthetic Future Technology T13_TEST)
  // ---------------------------------------------------------------------------
  describe('IA-1.3: Extensibility & Zero Technology-Specific Branching', () => {
    it('seamlessly accommodates synthetic future technology T13_TEST without frontend code modification', () => {
      const syntheticT13Data: DomainOverviewResponseDto = {
        domain: { id: 'dom-t13', domainName: 'future-tech.io', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 100, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-t13', createdAt: new Date().toISOString(), responseTimeMs: 80, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Future infrastructure executing T13_TEST runtime.',
            ingressPath: [
              { hop: 0, layer: 'RUNTIME', technologyId: 'tech-t13', technologyName: 'T13_TEST', role: 'Next-Gen Runtime' },
            ],
            keyTechnologies: [
              {
                technologyId: 'tech-t13',
                name: 'T13_TEST',
                category: 'Infrastructure Runtime',
                layer: 'RUNTIME',
                role: 'Next-Gen Serverless Execution Runtime',
                version: '1.0.0-rc1',
                confidence: 0.99,
                confidenceLevel: 'HIGH',
                whyDetected: 'Observed X-T13-Runtime-Version header',
                whatThisDoesNotProve: 'T13_TEST presence does not prove underlying host cluster architecture.',
                evidence: [{ observationKey: 'hdr-t13', indicator: 'X-T13-Runtime-Version: 1.0.0-rc1' } as any],
              },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.99, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-t13', 'future-tech.io', syntheticT13Data);

      assert.equal(model.hasObservedInfrastructure, true);
      assert.equal(model.categoryGroups.length, 1);
      assert.equal(model.categoryGroups[0].category, 'RUNTIME');

      const comp = model.categoryGroups[0].components[0];
      assert.equal(comp.name, 'T13_TEST');
      assert.equal(comp.version, '1.0.0-rc1');
      assert.equal(comp.role, 'Next-Gen Serverless Execution Runtime');
      assert.equal(comp.whyDetected, 'Observed X-T13-Runtime-Version header');
      assert.equal(comp.whatThisDoesNotProve, 'T13_TEST presence does not prove underlying host cluster architecture.');
    });
  });

  // ---------------------------------------------------------------------------
  // IA-1.4: Optional Version & Evidence Handling Fidelity
  // ---------------------------------------------------------------------------
  describe('IA-1.4: Optional Version & Evidence Handling Fidelity', () => {
    it('preserves undefined version when version is absent rather than synthesizing "Unknown"', () => {
      const unversionedData: DomainOverviewResponseDto = {
        domain: { id: 'dom-unv', domainName: 'unversioned.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 90, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-unv', createdAt: new Date().toISOString(), responseTimeMs: 100, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          webServer: 'nginx',
          technologyArchitecture: {
            architectureSummary: 'NGINX gateway observed without version disclosure.',
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

      const model = resolveAdaptiveInfrastructureModel('dom-unv', 'unversioned.org', unversionedData);
      const nginxComp = model.categoryGroups[0].components[0];

      assert.equal(nginxComp.name, 'NGINX');
      assert.equal(nginxComp.version, undefined, 'Version must remain undefined without synthetic "Unknown" strings');
    });
  });

  // ---------------------------------------------------------------------------
  // IA-1.5: Failed Understanding UX (Empty / Unavailable Target)
  // ---------------------------------------------------------------------------
  describe('IA-1.5: Failed Understanding UX', () => {
    it('returns empty model for unreachable domain with 0 synthesized categories', () => {
      const unreachableData: DomainOverviewResponseDto = {
        domain: { id: 'dom-fail', domainName: 'unreachable.invalid', monitoringEnabled: false, createdAt: new Date().toISOString() },
        health: { score: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: null,
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 0, totalVerifications: 0, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: null },
        infrastructure: undefined,
      };

      const model = resolveAdaptiveInfrastructureModel('dom-fail', 'unreachable.invalid', unreachableData);

      assert.equal(model.hasObservedInfrastructure, false);
      assert.equal(model.categoryGroups.length, 0);
      assert.equal(model.ingressPath.length, 0);
    });
  });
});
