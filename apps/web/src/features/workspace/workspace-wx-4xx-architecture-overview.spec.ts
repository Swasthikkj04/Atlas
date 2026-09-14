import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { DomainOverviewResponseDto } from '../../types/api/overview.dto';
import {
  resolveAdaptiveInfrastructureModel,
  synthesizeArchitecturalHeroSummary,
  resolveArchitecturalBoundaries,
  resolveWhatMattersNow,
  WX_4XX_CERTIFIED_INVARIANTS,
} from './contracts/adaptive-infrastructure.contract.ts';

const mockDomainWithEdgeAndGateway: DomainOverviewResponseDto = {
  domain: {
    id: 'dom-stripe-prod',
    domainName: 'stripe.com',
    monitoringEnabled: true,
    createdAt: '2026-08-20T00:00:00.000Z',
  },
  health: {
    score: 95,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
  },
  latestSnapshot: {
    id: 'snp-stripe-002',
    createdAt: '2026-08-28T18:19:00.000Z',
    responseTimeMs: 145,
    httpStatus: 200,
  },
  latestBrief: null,
  findingsSummary: {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
  },
  recentFindings: [],
  recentChanges: [],
  latestVerification: null,
  infrastructure: {
    ipv4Addresses: ['93.184.216.34', '93.184.216.35'],
    ipv6Addresses: ['2606:2800:220:1:248:1893:25c8:1946'],
    webServer: 'nginx/1.24.0',
    cdn: 'Cloudflare',
    sslValid: true,
    sslExpiresAt: '2027-01-01T00:00:00.000Z',
    technologies: ['Cloudflare', 'NGINX', 'Python', 'FastAPI'],
    httpStatus: 200,
    responseTimeMs: 145,
    technologyArchitecture: {
      architectureSummary:
        'Traffic reaches a Cloudflare Anycast edge, passes through NGINX, and enters a protected internal boundary.',
      ingressPath: [
        {
          hop: 0,
          layer: 'EDGE',
          technologyId: 'tech-cloudflare',
          technologyName: 'Cloudflare',
          role: 'Edge Delivery & Anycast Acceleration',
        },
        {
          hop: 1,
          layer: 'GATEWAY',
          technologyId: 'tech-nginx',
          technologyName: 'NGINX',
          role: 'Web Gateway & Reverse Proxy',
        },
        {
          hop: 2,
          layer: 'RUNTIME',
          technologyId: 'tech-python',
          technologyName: 'Python',
          role: 'Application Runtime',
        },
      ],
      keyTechnologies: [
        {
          technologyId: 'tech-cloudflare',
          name: 'Cloudflare',
          category: 'CDN / Edge',
          layer: 'EDGE',
          role: 'Edge Delivery',
          confidence: 0.99,
          confidenceLevel: 'HIGH',
          evidence: [
            {
              sourceType: 'HTTP',
              source: 'Response Header',
              indicator: 'server: cloudflare',
              confidence: 'HIGH',
            },
          ],
        },
        {
          technologyId: 'tech-nginx',
          name: 'NGINX',
          category: 'Web / Server',
          layer: 'GATEWAY',
          role: 'Web Gateway',
          version: '1.24.0',
          confidence: 0.95,
          confidenceLevel: 'HIGH',
          whyDetected: 'Observed Server header and proxy response patterns',
          whatThisDoesNotProve: 'NGINX presence does not establish internal application or database tier.',
          evidence: [
            {
              sourceType: 'HTTP',
              source: 'Response Header',
              indicator: 'server: nginx/1.24.0',
              confidence: 'HIGH',
            },
          ],
        },
      ],
      layers: [],
      integrations: [],
      knownUnknowns: [],
      claimBoundaries: [],
      confidence: {
        overallLevel: 'HIGH',
        overallScore: 0.96,
        layerConfidence: {},
        rationale: '',
        confirmedRelationshipsCount: 3,
        supportedRelationshipsCount: 0,
        inferredRelationshipsCount: 0,
      },
    },
  },
  statistics: {
    totalSnapshots: 12,
    totalVerifications: 48,
    totalFindings: 0,
    criticalFindings: 0,
    changesLast30Days: 0,
    lastUnderstandingAt: '2026-08-28T18:19:00.000Z',
  },
};

describe('WX-4XX: Infrastructure Overview — Premium Architecture Intelligence Experience', () => {
  // ---------------------------------------------------------------------------
  // 1. Architecture Hero: Natural Language Synthesis (Section 5)
  // ---------------------------------------------------------------------------
  describe('1. Architecture Hero Synthesis', () => {
    it('uses backend architecture summary when present and synthesizes a flow headline', () => {
      const model = resolveAdaptiveInfrastructureModel(
        'dom-stripe-prod',
        'stripe.com',
        mockDomainWithEdgeAndGateway,
      );

      const hero = synthesizeArchitecturalHeroSummary(model, mockDomainWithEdgeAndGateway);
      assert.ok(hero.headline.length > 0);
      assert.ok(hero.narrative.includes('Traffic reaches a Cloudflare Anycast edge'));
    });

    it('synthesizes clean single-sentence architecture deterministically when summary is missing', () => {
      const dataWithoutSummary: DomainOverviewResponseDto = {
        ...mockDomainWithEdgeAndGateway,
        infrastructure: {
          ...mockDomainWithEdgeAndGateway.infrastructure,
          technologyArchitecture: undefined,
        },
      };

      const model = resolveAdaptiveInfrastructureModel(
        'dom-stripe-prod',
        'stripe.com',
        dataWithoutSummary,
      );

      const hero = synthesizeArchitecturalHeroSummary(model, dataWithoutSummary);
      assert.equal(hero.headline, 'Cloudflare Edge → nginx/1.24.0 → Protected Boundary');
      assert.ok(hero.narrative.includes('Traffic terminates at Cloudflare edge'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Architectural Boundaries: Observed Ingress vs Sealed Perimeter (Section 9 & 10)
  // ---------------------------------------------------------------------------
  describe('2. Architectural Boundaries Resolution', () => {
    it('segregates observed ingress capabilities from sealed internal layers', () => {
      const model = resolveAdaptiveInfrastructureModel(
        'dom-stripe-prod',
        'stripe.com',
        mockDomainWithEdgeAndGateway,
      );

      const boundaries = resolveArchitecturalBoundaries(model, mockDomainWithEdgeAndGateway);

      // Observed boundaries
      assert.ok(boundaries.observed.length >= 4);
      const observedIds = boundaries.observed.map((b) => b.id);
      assert.ok(observedIds.includes('dns_endpoints'));
      assert.ok(observedIds.includes('edge_cdn'));
      assert.ok(observedIds.includes('tls_transport'));
      assert.ok(observedIds.includes('web_gateway'));

      for (const obs of boundaries.observed) {
        assert.equal(obs.status, 'OBSERVED');
      }

      // Sealed / Protected boundaries (Database, VPC, Orchestration, Origin)
      assert.ok(boundaries.sealed.length >= 4);
      const sealedIds = boundaries.sealed.map((s) => s.id);
      assert.ok(sealedIds.includes('sealed_database'));
      assert.ok(sealedIds.includes('sealed_network'));
      assert.ok(sealedIds.includes('sealed_orchestration'));
      assert.ok(sealedIds.includes('sealed_origin'));

      for (const sealed of boundaries.sealed) {
        assert.ok(sealed.status === 'PROTECTED' || sealed.status === 'SEALED');
      }

      // Editorial reassurance note confirming perimeter isolation without failure semantics
      assert.ok(
        boundaries.editorialNote.includes('proper perimeter isolation') ||
          boundaries.editorialNote.includes('not directly exposed'),
      );
      assert.ok(!boundaries.editorialNote.includes('failed'));
      assert.ok(!boundaries.editorialNote.includes('missing'));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. What Matters Now Contextual Intelligence (Section 11 & 19)
  // ---------------------------------------------------------------------------
  describe('3. What Matters Now Intelligence Layer', () => {
    it('resolves STABLE state when no changes or critical findings exist', () => {
      const result = resolveWhatMattersNow(mockDomainWithEdgeAndGateway);
      assert.equal(result.status, 'STABLE');
      assert.equal(result.title, 'Architecture Stable');
      assert.ok(result.subtitle.includes('No meaningful architectural boundary changes'));
      assert.ok(result.lastVerified?.includes('2026'));
      assert.equal(result.actionText, undefined);
    });

    it('resolves CHANGED state with review action when recent changes exist', () => {
      const dataWithChange: DomainOverviewResponseDto = {
        ...mockDomainWithEdgeAndGateway,
        recentChanges: [
          {
            id: 'chg-001',
            title: 'Cloudflare Edge Proxy Added',
            description: 'Edge delivery network active',
            category: 'INFRASTRUCTURE',
            detectedAt: '2026-08-28T18:19:00.000Z',
          },
        ],
      };

      const result = resolveWhatMattersNow(dataWithChange);
      assert.equal(result.status, 'CHANGED');
      assert.equal(result.title, 'Architecture Changed');
      assert.equal(result.subtitle, 'Cloudflare Edge Proxy Added');
      assert.equal(result.actionText, 'Review changes →');
      assert.equal(result.actionTarget, 'changes');
    });

    it('resolves ATTENTION state with findings action when critical findings exist', () => {
      const dataWithCritical: DomainOverviewResponseDto = {
        ...mockDomainWithEdgeAndGateway,
        findingsSummary: {
          total: 1,
          critical: 1,
          high: 0,
          medium: 0,
          low: 0,
          informational: 0,
        },
      };

      const result = resolveWhatMattersNow(dataWithCritical);
      assert.equal(result.status, 'ATTENTION');
      assert.equal(result.title, 'Architectural Exposure Note');
      assert.ok(result.subtitle.includes('critical'));
      assert.equal(result.actionText, 'Review findings →');
      assert.equal(result.actionTarget, 'findings');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Ingress Request Path & Multi-Hop Model (Section 6 & 7)
  // ---------------------------------------------------------------------------
  describe('4. Ingress Request Path & Multi-Hop Model', () => {
    it('populates multi-hop ingress path with layer roles and identities', () => {
      const model = resolveAdaptiveInfrastructureModel(
        'dom-stripe-prod',
        'stripe.com',
        mockDomainWithEdgeAndGateway,
      );

      assert.equal(model.ingressPath.length, 3);
      assert.equal(model.ingressPath[0].technologyName, 'Cloudflare');
      assert.equal(model.ingressPath[0].layer, 'EDGE');
      assert.equal(model.ingressPath[1].technologyName, 'NGINX');
      assert.equal(model.ingressPath[1].layer, 'GATEWAY');
      assert.equal(model.ingressPath[2].technologyName, 'Python');
      assert.equal(model.ingressPath[2].layer, 'RUNTIME');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Certified Frozen Invariants Conformance (Section 20)
  // ---------------------------------------------------------------------------
  describe('5. Certified Invariants Conformance', () => {
    it('verifies all 12 WX-4XX frozen invariants are certified', () => {
      const expectedInvariants = [
        'WX_4XX_ARCHITECTURE_BEFORE_INVENTORY',
        'WX_4XX_HERO_ARCHITECTURAL_SYNTHESIS',
        'WX_4XX_PRIMARY_SURFACE_INGRESS_CENTERPIECE',
        'WX_4XX_INTERACTIVE_TOPOLOGY_INSPECTION',
        'WX_4XX_EXPLICIT_OBSERVED_VS_SEALED_BOUNDARIES',
        'WX_4XX_HONEST_SEALED_EXPLANATIONS_NO_FAILURE_SEMANTICS',
        'WX_4XX_QUIET_CONFIDENCE_INDICATORS',
        'WX_4XX_CONTEXTUAL_SECURITY_ATTACHMENT',
        'WX_4XX_WHAT_MATTERS_NOW_STABILITY_REASSURANCE',
        'WX_4XX_PROGRESSIVE_DISCLOSURE_LINEAGE',
        'WX_4XX_NO_DASHBOARD_TELEMETRY_WALL',
        'WX_4XX_NO_HARDCODED_TECHNOLOGY_BRANCHING',
      ];

      for (const inv of expectedInvariants) {
        assert.ok(
          inv in WX_4XX_CERTIFIED_INVARIANTS,
          `Expected ${inv} in WX_4XX_CERTIFIED_INVARIANTS`,
        );
        assert.equal(
          (WX_4XX_CERTIFIED_INVARIANTS as any)[inv],
          true,
          `${inv} must be true`,
        );
      }
    });
  });
});
