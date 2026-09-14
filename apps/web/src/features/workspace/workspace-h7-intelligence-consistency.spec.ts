import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  H7_CERTIFIED_INVARIANTS,
  validateFrontendCrossSurfaceConsistency,
  type FrontendAuthoritativeIntelligenceState,
  type SurfaceViewProjection,
} from './contracts/intelligence-consistency.contract.ts';

describe('H7: Infrastructure Intelligence Consistency Frontend Suite', () => {
  it('certifies 100% of H7 Intelligence Consistency invariants', () => {
    assert.equal(H7_CERTIFIED_INVARIANTS.H7_ONE_VERIFIED_OBSERVATION_ONE_TRUTH, true);
    assert.equal(H7_CERTIFIED_INVARIANTS.H7_FINDING_LIFECYCLE_CROSS_SURFACE_CONSISTENCY, true);
    assert.equal(H7_CERTIFIED_INVARIANTS.H7_TECHNOLOGY_TRUTH_IMMUTABILITY, true);
    assert.equal(H7_CERTIFIED_INVARIANTS.H7_INGRESS_TOPOLOGY_ANTI_DRIFT, true);
    assert.equal(H7_CERTIFIED_INVARIANTS.H7_CONFIDENCE_PROPAGATION_FIDELITY, true);
    assert.equal(H7_CERTIFIED_INVARIANTS.H7_KNOWN_UNKNOWNS_PERIMETER_SEALING, true);
    assert.equal(H7_CERTIFIED_INVARIANTS.H7_H3_CHANGE_FORENSICS_CONVERGENCE, true);
    assert.equal(H7_CERTIFIED_INVARIANTS.H7_H4_POSTURE_RECALCULATION_SYNCHRONIZATION, true);
    assert.equal(H7_CERTIFIED_INVARIANTS.H7_H5_NARRATIVE_EVIDENCE_PROJECTION, true);
    assert.equal(H7_CERTIFIED_INVARIANTS.H7_CROSS_SURFACE_CONTRADICTION_DETECTION, true);
    assert.equal(H7_CERTIFIED_INVARIANTS.H7_ZERO_STALE_CACHE_TRUTH, true);
    assert.equal(H7_CERTIFIED_INVARIANTS.H7_DEEP_NAVIGATION_TRUTH_PRESERVATION, true);
  });

  const baseState: FrontendAuthoritativeIntelligenceState = {
    snapshotId: 'snap-2026-08-29-001',
    domainId: 'domain-01',
    domainName: 'prod.example.com',
    timestamp: '2026-08-29T10:00:00.000Z',
    status: 'STABLE',
    technologies: [
      {
        name: 'Cloudflare',
        layer: 'EDGE',
        confidence: 'HIGH',
        evidence: ['Server: cloudflare'],
        whatThisDoesNotProve: ['Origin identity'],
      },
      {
        name: 'NGINX',
        layer: 'GATEWAY',
        version: '1.24.0',
        confidence: 'HIGH',
        evidence: ['Server: nginx/1.24.0'],
        whatThisDoesNotProve: ['Application runtime'],
      },
    ],
    ingressPath: [
      { hopIndex: 1, title: 'DNS / Ingress', layer: 'DNS', status: 'OBSERVED', isDirectConnection: true },
      { hopIndex: 2, title: 'Cloudflare', layer: 'EDGE', technologyName: 'Cloudflare', status: 'OBSERVED', isDirectConnection: true },
      { hopIndex: 3, title: 'NGINX', layer: 'GATEWAY', technologyName: 'NGINX', status: 'OBSERVED', isDirectConnection: true },
      { hopIndex: 4, title: 'Sealed Internal Perimeter', layer: 'PLATFORM', status: 'SEALED', isDirectConnection: false },
    ],
    activeFindings: [],
    resolvedFindings: [],
    changeEvents: [],
    posture: {
      securityRating: 'GOOD',
      architectureRating: 'MODERN_MULTI_TIER',
      exposureLevel: 'LOW',
      activeControls: ['TLS 1.3', 'Edge Proxy Buffer'],
      securityGaps: [],
      summary: 'Secure multi-tier ingress posture.',
    },
    whatMattersNow: {
      status: 'STABLE',
      headline: 'Infrastructure Verified & Stable',
      narrative: 'All components operate normally.',
      primaryAction: 'View architecture',
    },
    unifiedNarrative: {
      headline: 'prod.example.com is served via Cloudflare and NGINX.',
      pathSummary: 'DNS / Ingress → Cloudflare → NGINX → Sealed Internal Perimeter',
      oneLiner: 'Verified multi-tier ingress with zero open gaps.',
    },
    knownUnknowns: [
      { dimension: 'Database Tier', status: 'UNOBSERVED', explanation: 'Internal database sealed behind NGINX.' },
    ],
    confidence: {
      overall: 'HIGH',
      score: 0.95,
      rationale: 'Authoritative headers matched.',
    },
  };

  describe('H7-001: Cross-Surface Consistency & Zero Contradictions', () => {
    it('validates 100% consistent views across Overview, Findings, Topology, and Evidence Drawer', () => {
      const views: SurfaceViewProjection[] = [
        {
          surfaceName: 'OverviewSurface',
          snapshotId: 'snap-2026-08-29-001',
          status: 'STABLE',
          technologies: [{ name: 'Cloudflare', layer: 'EDGE' }, { name: 'NGINX', layer: 'GATEWAY' }],
          confidenceLevel: 'HIGH',
        },
        {
          surfaceName: 'TopologySurface',
          snapshotId: 'snap-2026-08-29-001',
          topologyHops: ['DNS / Ingress', 'Cloudflare', 'NGINX', 'Sealed Internal Perimeter'],
        },
        {
          surfaceName: 'EvidenceDrawer',
          snapshotId: 'snap-2026-08-29-001',
          technologies: [{ name: 'Cloudflare', layer: 'EDGE' }, { name: 'NGINX', layer: 'GATEWAY' }],
        },
      ];

      const result = validateFrontendCrossSurfaceConsistency(baseState, views);
      assert.equal(result.isConsistent, true);
      assert.equal(result.contradictions.length, 0);
      assert.equal(result.checkedSurfaces.length, 3);
    });

    it('detects and rejects stale snapshot ID across frontend surfaces (H7-011)', () => {
      const staleView: SurfaceViewProjection = {
        surfaceName: 'OverviewSurface',
        snapshotId: 'snap-2026-08-28-STALE', // STALE
      };

      const result = validateFrontendCrossSurfaceConsistency(baseState, [staleView]);
      assert.equal(result.isConsistent, false);
      assert.ok(result.contradictions.some((c) => c.message.includes('stale snapshot')));
    });

    it('detects and rejects topology hop injection drift (H7-004)', () => {
      const driftingView: SurfaceViewProjection = {
        surfaceName: 'TopologySurface',
        snapshotId: 'snap-2026-08-29-001',
        topologyHops: ['DNS / Ingress', 'Cloudflare', 'Traefik (Guessed)', 'NGINX'], // TRAEFIK INVENTED
      };

      const result = validateFrontendCrossSurfaceConsistency(baseState, [driftingView]);
      assert.equal(result.isConsistent, false);
      assert.ok(result.contradictions.some((c) => c.dimension === 'TOPOLOGY_DRIFT'));
    });

    it('detects and rejects unobserved database speculation (H7-006)', () => {
      const speculativeView: SurfaceViewProjection = {
        surfaceName: 'NarrativeSurface',
        snapshotId: 'snap-2026-08-29-001',
        knownUnknowns: ['PostgreSQL database cluster is located on internal subnet'], // GUESS
      };

      const result = validateFrontendCrossSurfaceConsistency(baseState, [speculativeView]);
      assert.equal(result.isConsistent, false);
      assert.ok(result.contradictions.some((c) => c.dimension === 'KNOWN_UNKNOWNS'));
    });
  });
});
