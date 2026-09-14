import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto, DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('Move 1: Interactive Ingress Flow & Topology Visualizer Verification', () => {
  const sampleArchitectureDto: TechnologyArchitectureOverviewDto = {
    architectureSummary:
      'The public endpoint is routed through Cloudflare Anycast edge, proxied via NGINX, and executes a Python FastAPI backend runtime.',
    ingressPath: [
      {
        hop: 0,
        layer: 'GATEWAY',
        technologyId: 'public-endpoint',
        technologyName: 'Public Endpoint',
        role: 'Public Ingress Gateway / DNS Routing',
      },
      {
        hop: 1,
        layer: 'EDGE',
        technologyId: 'tech-cloudflare',
        technologyName: 'Cloudflare',
        role: 'Edge Proxy & Anycast Acceleration',
      },
      {
        hop: 2,
        layer: 'GATEWAY',
        technologyId: 'tech-nginx',
        technologyName: 'NGINX',
        role: 'Reverse Proxy & Ingress Gateway',
      },
      {
        hop: 3,
        layer: 'RUNTIME',
        technologyId: 'tech-python',
        technologyName: 'Python',
        role: 'Server-side Application Runtime',
      },
    ],
    layers: [
      {
        layer: 'EDGE',
        state: 'OBSERVED',
        technologies: [
          {
            technologyId: 'tech-cloudflare',
            name: 'Cloudflare',
            category: 'CDN / Edge',
            layer: 'EDGE',
            role: 'Edge Proxy',
            confidence: 0.98,
            confidenceLevel: 'HIGH',
            evidence: [
              {
                sourceType: 'HTTP',
                source: 'Response Header: server',
                indicator: 'Server: cloudflare',
                confidence: 'HIGH',
              },
            ],
          },
        ],
      },
      {
        layer: 'GATEWAY',
        state: 'OBSERVED',
        technologies: [
          {
            technologyId: 'tech-nginx',
            name: 'NGINX',
            category: 'Web / Server',
            layer: 'GATEWAY',
            role: 'Reverse Proxy Gateway',
            version: '1.24.0',
            confidence: 0.95,
            confidenceLevel: 'HIGH',
            evidence: [
              {
                sourceType: 'HTTP',
                source: 'Response Header: server',
                indicator: 'Server: nginx/1.24.0',
                confidence: 'HIGH',
              },
            ],
          },
        ],
      },
      {
        layer: 'RUNTIME',
        state: 'OBSERVED',
        technologies: [
          {
            technologyId: 'tech-python',
            name: 'Python',
            category: 'Infrastructure Runtime',
            layer: 'RUNTIME',
            role: 'Server-side Application Runtime',
            version: '3.11.4',
            confidence: 0.95,
            confidenceLevel: 'HIGH',
            whyDetected: 'Observed Server: Python/3.11.4 WSGI server response header',
            whatThisDoesNotProve:
              'Python presence confirms runtime execution, but does not prove Django, Flask, FastAPI, PostgreSQL, Docker, or Linux.',
            evidence: [
              {
                sourceType: 'HTTP',
                source: 'Response Header: server',
                indicator: 'Server: Python/3.11.4',
                confidence: 'HIGH',
              },
            ],
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
        role: 'Edge Proxy',
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        evidence: [
          {
            sourceType: 'HTTP',
            source: 'Response Header: server',
            indicator: 'Server: cloudflare',
            confidence: 'HIGH',
          },
        ],
      },
      {
        technologyId: 'tech-nginx',
        name: 'NGINX',
        category: 'Web / Server',
        layer: 'GATEWAY',
        role: 'Reverse Proxy Gateway',
        version: '1.24.0',
        confidence: 0.95,
        confidenceLevel: 'HIGH',
        evidence: [
          {
            sourceType: 'HTTP',
            source: 'Response Header: server',
            indicator: 'Server: nginx/1.24.0',
            confidence: 'HIGH',
          },
        ],
      },
      {
        technologyId: 'tech-python',
        name: 'Python',
        category: 'Infrastructure Runtime',
        layer: 'RUNTIME',
        role: 'Server-side Application Runtime',
        version: '3.11.4',
        confidence: 0.95,
        confidenceLevel: 'HIGH',
        whyDetected: 'Observed Server: Python/3.11.4 WSGI server response header',
        whatThisDoesNotProve:
          'Python presence confirms runtime execution, but does not prove Django, Flask, FastAPI, PostgreSQL, Docker, or Linux.',
        evidence: [
          {
            sourceType: 'HTTP',
            source: 'Response Header: server',
            indicator: 'Server: Python/3.11.4',
            confidence: 'HIGH',
          },
        ],
      },
    ],
    integrations: [],
    knownUnknowns: [
      {
        dimension: 'Database Backend',
        status: 'UNOBSERVED',
        explanation: 'Backend database is unobservable from public HTTP/API responses.',
      },
    ],
    claimBoundaries: [
      {
        technologyId: 'tech-python',
        technologyName: 'Python',
        boundary: 'Python presence does not prove Django, Flask, PostgreSQL, or Docker containerization.',
      },
    ],
    confidence: {
      overallLevel: 'HIGH',
      overallScore: 0.95,
      layerConfidence: { EDGE: 'HIGH', GATEWAY: 'HIGH', RUNTIME: 'HIGH' },
      rationale: 'Observed authoritative headers across Edge, Gateway, and Runtime tiers.',
      confirmedRelationshipsCount: 2,
      supportedRelationshipsCount: 1,
      inferredRelationshipsCount: 0,
    },
  };

  const sampleDomain: DomainOverviewResponseDto = {
    domain: { id: 'dom-sample-1', domainName: 'api.enterprise-service.io', monitoringEnabled: true, createdAt: new Date().toISOString() },
    health: { score: 95, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
    latestSnapshot: { id: 'snap-1', createdAt: '2026-08-27T18:00:00.000Z', responseTimeMs: 18, httpStatus: 200 },
    latestBrief: null,
    findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
    recentFindings: [],
    recentChanges: [],
    latestVerification: null,
    statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
    infrastructure: {
      technologyArchitecture: sampleArchitectureDto,
    },
  };

  // ---------------------------------------------------------------------------
  // 1. Data-Path Pipeline Structure & Ingress Flow Resolution
  // ---------------------------------------------------------------------------
  describe('1. Data-Path Pipeline Structure & Ingress Flow Resolution', () => {
    it('resolves authoritative ingress path with ordered hops from Edge to Gateway to Runtime', () => {
      const model = resolveAdaptiveInfrastructureModel('dom-sample-1', 'api.enterprise-service.io', sampleDomain);

      assert.equal(model.ingressPath.length, 4);
      assert.equal(model.ingressPath[0].technologyName, 'Public Endpoint');
      assert.equal(model.ingressPath[1].technologyName, 'Cloudflare');
      assert.equal(model.ingressPath[1].layer, 'EDGE');
      assert.equal(model.ingressPath[2].technologyName, 'NGINX');
      assert.equal(model.ingressPath[2].layer, 'GATEWAY');
      assert.equal(model.ingressPath[3].technologyName, 'Python');
      assert.equal(model.ingressPath[3].layer, 'RUNTIME');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Sealed Internal Perimeter Isolation
  // ---------------------------------------------------------------------------
  describe('2. Sealed Internal Perimeter Isolation', () => {
    it('accurately reports unobserved database/VPC dimensions as sealed behind the gateway', () => {
      const model = resolveAdaptiveInfrastructureModel('dom-sample-1', 'api.enterprise-service.io', sampleDomain);

      assert.equal(model.unobservedDimensions.length, 1);
      assert.equal(model.unobservedDimensions[0].dimension, 'Database Backend');
      assert.equal(model.unobservedDimensions[0].status, 'UNOBSERVED');
      assert.ok(model.unobservedDimensions[0].explanation?.includes('unobservable from public HTTP'));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. IA-2 Deep Forensic Progressive Disclosure Integration
  // ---------------------------------------------------------------------------
  describe('3. IA-2 Deep Forensic Progressive Disclosure Integration', () => {
    it('binds Level 1 (Understanding), Level 2 (Context), and Level 3 (Wire Evidence) for inspected topology nodes', () => {
      const model = resolveAdaptiveInfrastructureModel('dom-sample-1', 'api.enterprise-service.io', sampleDomain);
      const pythonComp = model.categoryGroups.find((g) => g.category === 'RUNTIME')?.components[0]!;

      const viewModel = buildComponentViewModel(pythonComp, model.observedTimestamp);

      // Level 1: Understanding
      assert.equal(viewModel.name, 'Python');
      assert.equal(viewModel.version, '3.11.4');
      assert.equal(viewModel.layer, 'RUNTIME');
      assert.equal(viewModel.confidenceLevel, 'HIGH');

      // Level 2: Context & Claim Boundaries
      assert.equal(viewModel.hasContext, true);
      assert.ok(viewModel.whyThisAppears?.includes('Python/3.11.4 WSGI server'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('does not prove Django'));

      // Level 3: Wire Evidence
      assert.equal(viewModel.hasEvidence, true);
      assert.equal(viewModel.evidence[0].observedSignal, 'Server: Python/3.11.4');
      assert.equal(viewModel.evidence[0].sourceType, 'HTTP');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Domain Isolation & Dynamic Topology Adaptation
  // ---------------------------------------------------------------------------
  describe('4. Domain Isolation & Dynamic Topology Adaptation', () => {
    it('dynamically adapts the topology data-path to different domain architectures without hardcoding', () => {
      const staticDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-static', domainName: 'static-site.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 100, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-static', createdAt: new Date().toISOString(), responseTimeMs: 12, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Single-tier Apache web server origin.',
            ingressPath: [
              { hop: 0, layer: 'GATEWAY', technologyId: 'public-endpoint', technologyName: 'Public Endpoint', role: 'Ingress' },
              { hop: 1, layer: 'GATEWAY', technologyId: 'tech-apache', technologyName: 'Apache HTTP Server', role: 'Web Server' },
            ],
            keyTechnologies: [
              { technologyId: 'tech-apache', name: 'Apache HTTP Server', category: 'Web / Server', layer: 'GATEWAY', role: 'Web Server', version: '2.4.52', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const modelMulti = resolveAdaptiveInfrastructureModel('dom-sample-1', 'api.enterprise-service.io', sampleDomain);
      const modelStatic = resolveAdaptiveInfrastructureModel('dom-static', 'static-site.org', staticDomain);

      assert.equal(modelMulti.ingressPath.length, 4);
      assert.equal(modelStatic.ingressPath.length, 2);
      assert.equal(modelStatic.ingressPath[1].technologyName, 'Apache HTTP Server');
    });
  });
});
