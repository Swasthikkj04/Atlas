import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto, DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('H2: Deep Wire & Behavioral Fingerprinting Frontend Intelligence', () => {
  const sampleBehavioralDto: TechnologyArchitectureOverviewDto = {
    architectureSummary:
      'The public endpoint exposes NGINX-compatible gateway behavior and Node.js server-side runtime characteristics corroborated via wire telemetry.',
    ingressPath: [
      {
        hop: 0,
        layer: 'EDGE',
        technologyId: 'public-endpoint',
        technologyName: 'Public Endpoint (api.behavioral-target.io)',
        role: 'Client Request Ingress',
        relationshipType: 'EDGE_OF',
      },
      {
        hop: 1,
        layer: 'GATEWAY',
        technologyId: 'tech-nginx',
        technologyName: 'NGINX',
        role: 'Web Server / Reverse Proxy Gateway',
        relationshipType: 'FORWARDS_TO',
      },
      {
        hop: 2,
        layer: 'RUNTIME',
        technologyId: 'tech-nodejs',
        technologyName: 'Node.js',
        role: 'Server-side Application Runtime / JavaScript Execution Environment',
        relationshipType: 'RUNS_ON',
      },
    ],
    layers: [
      {
        layer: 'GATEWAY',
        state: 'OBSERVED',
        confidenceLevel: 'MEDIUM',
        technologies: [
          {
            technologyId: 'tech-nginx',
            name: 'NGINX',
            category: 'Web / Server',
            layer: 'GATEWAY',
            role: 'Web Server / Reverse Proxy Gateway',
            infrastructureMeaning:
              'Public endpoint exhibits behavioral characteristics consistent with NGINX (Hexadecimal ETag and byte-range support).',
            whyDetected:
              'Public endpoint behavior is consistent with NGINX. Identified via 2 independent wire behavioral signals.',
            whatThisDoesNotProve:
              'Behavioral wire signals indicate NGINX characteristics, but absence of direct explicit banners prevents deterministic version or configuration verification.',
            confidence: 0.75,
            confidenceLevel: 'MEDIUM',
            evidence: [
              {
                sourceType: 'WIRE_BEHAVIOR',
                source: 'Response Header Format: Hex ETag',
                indicator: 'ETag: "65a123-1b4" (Hexadecimal format)',
                observedValue: 'ETag Hex format matching NGINX inode-size-time format',
                confidence: 'MEDIUM',
              },
              {
                sourceType: 'WIRE_BEHAVIOR',
                source: 'Response Header: Accept-Ranges',
                indicator: 'Accept-Ranges: bytes',
                observedValue: 'Byte range handling supported',
                confidence: 'MEDIUM',
              },
            ],
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
            role: 'Server-side Application Runtime / JavaScript Execution Environment',
            infrastructureMeaning:
              'The observed infrastructure exposes evidence consistent with Node.js participating in server-side request processing.',
            whyDetected:
              'Corroborated by socket keep-alive parameterization (timeout=5) and connect.sid session cookie telemetry.',
            whatThisDoesNotProve:
              'Node.js presence confirms server-side JavaScript runtime execution, but does not prove Express, NestJS, Docker, Kubernetes, Linux, AWS, GCP, Azure, or any specific database.',
            confidence: 0.95,
            confidenceLevel: 'HIGH',
            evidence: [
              {
                sourceType: 'WIRE_BEHAVIOR',
                source: 'Response Header: Keep-Alive',
                indicator: 'Keep-Alive: timeout=5',
                observedValue: 'Default Node.js HTTP server socket timeout parameterization',
                confidence: 'HIGH',
              },
              {
                sourceType: 'WIRE_BEHAVIOR',
                source: 'Response Header: Set-Cookie',
                indicator: 'Set-Cookie: connect.sid=s%3A88273645.xyz',
                observedValue: 'Standard Express/Connect session cookie structure',
                confidence: 'HIGH',
              },
            ],
          },
        ],
      },
    ],
    keyTechnologies: [
      {
        technologyId: 'tech-nginx',
        name: 'NGINX',
        category: 'Web / Server',
        layer: 'GATEWAY',
        role: 'Web Server / Reverse Proxy Gateway',
        infrastructureMeaning:
          'Public endpoint exhibits behavioral characteristics consistent with NGINX.',
        whyDetected:
          'Public endpoint behavior is consistent with NGINX. Identified via 2 independent wire behavioral signals.',
        whatThisDoesNotProve:
          'Behavioral wire signals indicate NGINX characteristics, but absence of direct explicit banners prevents deterministic version or configuration verification.',
        confidence: 0.75,
        confidenceLevel: 'MEDIUM',
        evidence: [
          {
            sourceType: 'WIRE_BEHAVIOR',
            source: 'Response Header Format: Hex ETag',
            indicator: 'ETag: "65a123-1b4"',
            confidence: 'MEDIUM',
          },
        ],
      },
      {
        technologyId: 'tech-nodejs',
        name: 'Node.js',
        category: 'Infrastructure Runtime',
        layer: 'RUNTIME',
        role: 'Server-side Application Runtime / JavaScript Execution Environment',
        infrastructureMeaning:
          'The observed infrastructure exposes evidence consistent with Node.js participating in server-side request processing.',
        whyDetected:
          'Corroborated by socket keep-alive parameterization (timeout=5) and connect.sid session cookie telemetry.',
        whatThisDoesNotProve:
          'Node.js presence confirms server-side JavaScript runtime execution, but does not prove Express, NestJS, Docker, Kubernetes, Linux, AWS, GCP, Azure, or any specific database.',
        confidence: 0.95,
        confidenceLevel: 'HIGH',
        evidence: [
          {
            sourceType: 'WIRE_BEHAVIOR',
            source: 'Response Header: Keep-Alive',
            indicator: 'Keep-Alive: timeout=5',
            confidence: 'HIGH',
          },
        ],
      },
    ],
    integrations: [],
    knownUnknowns: [
      {
        dimension: 'Database Backend Layer',
        status: 'UNOBSERVED',
        explanation: 'Database tier resides behind application runtime and produces no direct public wire artifacts.',
        whyUnknown: 'Internal network isolation prevents public telemetry leakage.',
      },
      {
        dimension: 'In-Memory Caching Tier',
        status: 'UNOBSERVED',
        explanation: 'Internal caching clusters (Redis / Memcached) are non-routable from public perimeter.',
        whyUnknown: 'No public headers or protocol leakage observed.',
      },
    ],
    claimBoundaries: [
      {
        technologyId: 'tech-nginx',
        technologyName: 'NGINX',
        boundary: 'Behavioral evidence indicates NGINX compatibility; absence of direct banner prevents exact version claim.',
      },
    ],
    confidence: {
      overallLevel: 'HIGH',
      overallScore: 0.88,
      layerConfidence: {
        GATEWAY: 'MEDIUM',
        RUNTIME: 'HIGH',
      },
      rationale: 'High confidence runtime corroboration with medium confidence gateway wire fingerprint.',
      confirmedRelationshipsCount: 1,
      supportedRelationshipsCount: 1,
      inferredRelationshipsCount: 0,
    },
  };

  const sampleDomainOverview: DomainOverviewResponseDto = {
    id: 'dom-behavioral-01',
    name: 'api.behavioral-target.io',
    createdAt: '2026-08-29T14:00:00Z',
    updatedAt: '2026-08-29T14:00:00Z',
    dns: {
      status: 'VERIFIED',
      records: {
        a: ['198.51.100.42'],
        cname: [],
        ns: ['ns1.dnsimple.com'],
      },
    },
    infrastructure: {
      ipv4Addresses: ['198.51.100.42'],
      ipv6Addresses: [],
      webServer: 'NGINX (Behavioral)',
      cdn: null,
      sslValid: true,
      sslExpiresAt: '2026-12-31T00:00:00Z',
      technologies: ['NGINX', 'Node.js'],
      httpStatus: 200,
      responseTimeMs: 35,
      hostingProvider: 'Unknown Hosting',
      hostingDecision: 'UNKNOWN',
      hostingConfidence: 'LOW',
      hostingExplanation: 'Self-hosted or unbranded hosting provider',
      edgeProvider: null,
      edgeConfidence: 'LOW',
      dnsProvider: 'DNSimple',
      dnsConfidence: 'HIGH',
      attribution: null,
      technologyArchitecture: sampleBehavioralDto,
    },
    latestSnapshot: {
      id: 'snap-beh-01',
      domainId: 'dom-behavioral-01',
      status: 'SUCCESS',
      createdAt: '2026-08-29T14:00:00Z',
    },
  };

  describe('1. Progressive Disclosure Level 1: Understanding', () => {
    it('constructs adaptive model with calibrated confidence levels and clear semantic roles', () => {
      const model = resolveAdaptiveInfrastructureModel(
        sampleDomainOverview.id,
        sampleDomainOverview.name,
        sampleDomainOverview,
      );

      assert.equal(model.domainName, 'api.behavioral-target.io');
      assert.equal(model.hasObservedInfrastructure, true);
      assert.ok(model.categoryGroups.length >= 2);

      const gatewayGroup = model.categoryGroups.find((g) => g.category === 'GATEWAY');
      assert.ok(gatewayGroup);
      const nginx = gatewayGroup.components.find((c) => c.name === 'NGINX');
      assert.ok(nginx);
      assert.equal(nginx.confidenceLevel, 'MEDIUM');
      assert.equal(nginx.version, undefined); // Anti-overreach: no fabricated version

      const runtimeGroup = model.categoryGroups.find((g) => g.category === 'RUNTIME');
      assert.ok(runtimeGroup);
      const node = runtimeGroup.components.find((c) => c.name === 'Node.js');
      assert.ok(node);
      assert.equal(node.confidenceLevel, 'HIGH');
    });
  });

  describe('2. Progressive Disclosure Level 2: Why This Appears & Claim Boundaries', () => {
    it('presents honest detection rationale and strict non-proven boundaries for behavioral signals', () => {
      const model = resolveAdaptiveInfrastructureModel(
        sampleDomainOverview.id,
        sampleDomainOverview.name,
        sampleDomainOverview,
      );
      const gatewayGroup = model.categoryGroups.find((g) => g.category === 'GATEWAY')!;
      const nginx = gatewayGroup.components.find((c) => c.name === 'NGINX')!;

      assert.ok(nginx.whyDetected?.includes('behavior is consistent with NGINX'));
      assert.ok(nginx.whatThisDoesNotProve?.includes('absence of direct explicit banners'));

      // Verify sealed core remains unobserved
      assert.ok(model.unobservedDimensions.length >= 2);
      const dbUnknown = model.unobservedDimensions.find((u: any) => u.dimension.includes('Database'));
      assert.ok(dbUnknown);
      assert.equal(dbUnknown.status, 'UNOBSERVED');
    });
  });

  describe('3. Progressive Disclosure Level 3: Wire Evidence Lineage', () => {
    it('builds detailed component view model with raw wire behavior evidence indicators', () => {
      const model = resolveAdaptiveInfrastructureModel(
        sampleDomainOverview.id,
        sampleDomainOverview.name,
        sampleDomainOverview,
      );
      const gatewayGroup = model.categoryGroups.find((g) => g.category === 'GATEWAY')!;
      const nginx = gatewayGroup.components.find((c) => c.name === 'NGINX')!;

      const viewModel = buildComponentViewModel(nginx);

      assert.equal(viewModel.name, 'NGINX');
      assert.equal(viewModel.confidenceLevel, 'MEDIUM');
      assert.ok(viewModel.whyThisAppears?.includes('consistent with NGINX'));
      assert.ok(viewModel.evidence && viewModel.evidence.length >= 1);

      const wireEv = viewModel.evidence[0];
      assert.equal(wireEv.sourceType, 'WIRE_BEHAVIOR');
      assert.ok(wireEv.observedSignal?.includes('ETag'));
    });
  });

  describe('4. H1 Topology Integration with Behavioral Signals', () => {
    it('renders clean linear ingress path with verified wire-evidenced components', () => {
      const model = resolveAdaptiveInfrastructureModel(
        sampleDomainOverview.id,
        sampleDomainOverview.name,
        sampleDomainOverview,
      );

      assert.ok(model.ingressPath);
      assert.equal(model.ingressPath.length, 3);
      assert.equal(model.ingressPath[0].technologyName, 'Public Endpoint (api.behavioral-target.io)');
      assert.equal(model.ingressPath[1].technologyName, 'NGINX');
      assert.equal(model.ingressPath[2].technologyName, 'Node.js');
    });
  });

  describe('5. Findings Boundary: Clean Separation from Security Vulnerabilities', () => {
    it('verifies behavioral wire markers do not create phantom security findings in UI model', () => {
      const model = resolveAdaptiveInfrastructureModel(
        sampleDomainOverview.id,
        sampleDomainOverview.name,
        sampleDomainOverview,
      );

      // Model components contain only architectural metadata
      const allComponents = model.categoryGroups.flatMap((g) => g.components);
      for (const comp of allComponents) {
        assert.notEqual(comp.category, 'SECURITY');
        assert.ok(comp.role && comp.role.length > 0);
      }
    });
  });
});
