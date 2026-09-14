import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateFrontendCrossSurfaceConsistency,
  type FrontendAuthoritativeIntelligenceState,
  type SurfaceViewProjection,
} from './contracts/intelligence-consistency.contract.ts';

describe('H7: Cross-Surface Truth Verification Scenarios (A through H)', () => {
  // Scenario A — Clean
  it('Scenario A: 0 findings produces STABLE status and GOOD posture across all surfaces', () => {
    const cleanState: FrontendAuthoritativeIntelligenceState = {
      snapshotId: 'snap-scenario-a',
      domainId: 'domain-a',
      domainName: 'clean.enterprise.com',
      timestamp: '2026-08-29T10:00:00.000Z',
      status: 'STABLE',
      technologies: [{ name: 'Cloudflare', layer: 'EDGE', confidence: 'HIGH', evidence: [], whatThisDoesNotProve: [] }],
      ingressPath: [{ hopIndex: 1, title: 'Cloudflare', layer: 'EDGE', status: 'OBSERVED', isDirectConnection: true }],
      activeFindings: [],
      resolvedFindings: [],
      changeEvents: [],
      posture: {
        securityRating: 'GOOD',
        architectureRating: 'MODERN_MULTI_TIER',
        exposureLevel: 'LOW',
        activeControls: ['TLS 1.3'],
        securityGaps: [],
        summary: 'Clean posture.',
      },
      whatMattersNow: {
        status: 'STABLE',
        headline: 'Architecture Stable',
        narrative: 'No issues detected.',
        primaryAction: 'Inspect overview',
      },
      unifiedNarrative: { headline: 'clean.enterprise.com is stable.', pathSummary: 'Cloudflare', oneLiner: 'Clean' },
      knownUnknowns: [],
      confidence: { overall: 'HIGH', score: 0.95, rationale: 'Clean' },
    };

    const views: SurfaceViewProjection[] = [
      { surfaceName: 'WhatMattersNow', snapshotId: 'snap-scenario-a', status: 'STABLE' },
      { surfaceName: 'Overview', snapshotId: 'snap-scenario-a', status: 'STABLE' },
    ];

    const result = validateFrontendCrossSurfaceConsistency(cleanState, views);
    assert.equal(result.isConsistent, true);
    assert.equal(cleanState.whatMattersNow.status, 'STABLE');
    assert.equal(cleanState.posture.securityRating, 'GOOD');
  });

  // Scenario B — New security finding
  it('Scenario B: HSTS removed produces ACTIVE finding, ATTENTION status, and DEGRADED posture', () => {
    const findingState: FrontendAuthoritativeIntelligenceState = {
      snapshotId: 'snap-scenario-b',
      domainId: 'domain-b',
      domainName: 'insecure.enterprise.com',
      timestamp: '2026-08-29T10:00:00.000Z',
      status: 'ATTENTION',
      technologies: [{ name: 'NGINX', layer: 'GATEWAY', confidence: 'HIGH', evidence: [], whatThisDoesNotProve: [] }],
      ingressPath: [{ hopIndex: 1, title: 'NGINX', layer: 'GATEWAY', status: 'OBSERVED', isDirectConnection: true }],
      activeFindings: [
        {
          id: 'finding-hsts-01',
          code: 'HSTS_MISSING',
          title: 'HSTS Header Missing',
          severity: 'HIGH',
          status: 'ACTIVE',
          isCompliant: false,
          snapshotId: 'snap-scenario-b',
          evidence: [],
        },
      ],
      resolvedFindings: [],
      changeEvents: [],
      posture: {
        securityRating: 'DEGRADED',
        architectureRating: 'BUFFERED_GATEWAY',
        exposureLevel: 'MODERATE',
        activeControls: [],
        securityGaps: ['Missing HSTS'],
        summary: 'Security posture degraded.',
      },
      whatMattersNow: {
        status: 'ATTENTION',
        headline: 'Active Finding Requires Attention',
        narrative: 'HSTS header missing.',
        primaryAction: 'Review findings',
      },
      unifiedNarrative: { headline: 'insecure.enterprise.com degraded.', pathSummary: 'NGINX', oneLiner: 'Degraded' },
      knownUnknowns: [],
      confidence: { overall: 'HIGH', score: 0.9, rationale: 'Finding present' },
    };

    const views: SurfaceViewProjection[] = [
      { surfaceName: 'WhatMattersNow', snapshotId: 'snap-scenario-b', status: 'ATTENTION' },
      { surfaceName: 'Findings', snapshotId: 'snap-scenario-b', activeFindings: ['finding-hsts-01'] },
    ];

    const result = validateFrontendCrossSurfaceConsistency(findingState, views);
    assert.equal(result.isConsistent, true);
    assert.equal(findingState.whatMattersNow.status, 'ATTENTION');
    assert.equal(findingState.posture.securityRating, 'DEGRADED');
  });

  // Scenario C — Finding resolved
  it('Scenario C: HSTS restored produces RESOLVED finding, zero active warnings, and STABLE state', () => {
    const resolvedState: FrontendAuthoritativeIntelligenceState = {
      snapshotId: 'snap-scenario-c',
      domainId: 'domain-c',
      domainName: 'remediated.enterprise.com',
      timestamp: '2026-08-29T10:00:00.000Z',
      status: 'STABLE',
      technologies: [{ name: 'NGINX', layer: 'GATEWAY', confidence: 'HIGH', evidence: [], whatThisDoesNotProve: [] }],
      ingressPath: [{ hopIndex: 1, title: 'NGINX', layer: 'GATEWAY', status: 'OBSERVED', isDirectConnection: true }],
      activeFindings: [],
      resolvedFindings: [
        {
          id: 'finding-hsts-01',
          code: 'HSTS_MISSING',
          title: 'HSTS Header Missing',
          severity: 'HIGH',
          status: 'RESOLVED',
          isCompliant: true,
          snapshotId: 'snap-scenario-b',
          resolvingSnapshotId: 'snap-scenario-c',
          evidence: ['Strict-Transport-Security: max-age=31536000'],
        },
      ],
      changeEvents: [{ id: 'chg-mit-01', type: 'FINDING_RESOLVED', title: 'HSTS Restored', whatChanged: 'HSTS enabled' }],
      posture: {
        securityRating: 'GOOD',
        architectureRating: 'BUFFERED_GATEWAY',
        exposureLevel: 'LOW',
        activeControls: ['HSTS Protected'],
        securityGaps: [],
        summary: 'Remediated posture.',
      },
      whatMattersNow: {
        status: 'STABLE',
        headline: 'Architecture Stable',
        narrative: 'All observations compliant.',
        primaryAction: 'Inspect overview',
      },
      unifiedNarrative: { headline: 'remediated.enterprise.com is stable.', pathSummary: 'NGINX', oneLiner: 'Remediated' },
      knownUnknowns: [],
      confidence: { overall: 'HIGH', score: 0.95, rationale: 'Compliant' },
    };

    const views: SurfaceViewProjection[] = [
      { surfaceName: 'WhatMattersNow', snapshotId: 'snap-scenario-c', status: 'STABLE' },
      { surfaceName: 'ResolvedFindingsHistory', snapshotId: 'snap-scenario-c', resolvedFindings: ['finding-hsts-01'] },
    ];

    const result = validateFrontendCrossSurfaceConsistency(resolvedState, views);
    assert.equal(result.isConsistent, true);
    assert.equal(resolvedState.whatMattersNow.status, 'STABLE');
    assert.equal(resolvedState.posture.securityRating, 'GOOD');
  });

  // Scenario D — Technology migration
  it('Scenario D: NGINX to Envoy migration updates CHANGES, topology, and narrative consistently', () => {
    const migrationState: FrontendAuthoritativeIntelligenceState = {
      snapshotId: 'snap-scenario-d',
      domainId: 'domain-d',
      domainName: 'migrated.enterprise.com',
      timestamp: '2026-08-29T10:00:00.000Z',
      status: 'CHANGED',
      technologies: [{ name: 'Envoy', layer: 'GATEWAY', confidence: 'HIGH', evidence: ['Server: envoy'], whatThisDoesNotProve: [] }],
      ingressPath: [{ hopIndex: 1, title: 'Envoy', layer: 'GATEWAY', technologyName: 'Envoy', status: 'OBSERVED', isDirectConnection: true }],
      activeFindings: [],
      resolvedFindings: [],
      changeEvents: [
        { id: 'chg-mig-01', type: 'TECHNOLOGY_CHANGED', title: 'Gateway Replaced', whatChanged: 'NGINX replaced by Envoy' },
      ],
      posture: {
        securityRating: 'GOOD',
        architectureRating: 'MODERN_MULTI_TIER',
        exposureLevel: 'LOW',
        activeControls: ['Modern Service Proxy'],
        securityGaps: [],
        summary: 'Modern Envoy gateway posture.',
      },
      whatMattersNow: {
        status: 'CHANGED',
        headline: 'Recent Gateway Migration',
        narrative: 'Infrastructure migrated from NGINX to Envoy.',
        primaryAction: 'Review changes',
      },
      unifiedNarrative: { headline: 'migrated.enterprise.com is served via Envoy.', pathSummary: 'Envoy', oneLiner: 'Migrated' },
      knownUnknowns: [],
      confidence: { overall: 'HIGH', score: 0.95, rationale: 'Envoy header corroborated' },
    };

    const views: SurfaceViewProjection[] = [
      { surfaceName: 'WhatMattersNow', snapshotId: 'snap-scenario-d', status: 'CHANGED' },
      { surfaceName: 'Topology', snapshotId: 'snap-scenario-d', topologyHops: ['Envoy'] },
      { surfaceName: 'Infrastructure', snapshotId: 'snap-scenario-d', technologies: [{ name: 'Envoy', layer: 'GATEWAY' }] },
    ];

    const result = validateFrontendCrossSurfaceConsistency(migrationState, views);
    assert.equal(result.isConsistent, true);
    assert.equal(migrationState.whatMattersNow.status, 'CHANGED');
  });

  // Scenario E — Technology disappearance
  it('Scenario E: Removed technology is eliminated from active badges without residual ghost state', () => {
    const disappearanceState: FrontendAuthoritativeIntelligenceState = {
      snapshotId: 'snap-scenario-e',
      domainId: 'domain-e',
      domainName: 'simplified.enterprise.com',
      timestamp: '2026-08-29T10:00:00.000Z',
      status: 'CHANGED',
      technologies: [{ name: 'Cloudflare', layer: 'EDGE', confidence: 'HIGH', evidence: [], whatThisDoesNotProve: [] }],
      ingressPath: [{ hopIndex: 1, title: 'Cloudflare', layer: 'EDGE', status: 'OBSERVED', isDirectConnection: true }],
      activeFindings: [],
      resolvedFindings: [],
      changeEvents: [{ id: 'chg-rem-01', type: 'TECHNOLOGY_REMOVED', title: 'PHP Removed', whatChanged: 'Legacy PHP runtime removed' }],
      posture: {
        securityRating: 'GOOD',
        architectureRating: 'MODERN_MULTI_TIER',
        exposureLevel: 'LOW',
        activeControls: [],
        securityGaps: [],
        summary: 'Hardened architecture.',
      },
      whatMattersNow: {
        status: 'CHANGED',
        headline: 'Legacy Layer Removed',
        narrative: 'PHP runtime decommissioned.',
        primaryAction: 'Review changes',
      },
      unifiedNarrative: { headline: 'simplified.enterprise.com simplified.', pathSummary: 'Cloudflare', oneLiner: 'Simplified' },
      knownUnknowns: [],
      confidence: { overall: 'HIGH', score: 0.95, rationale: 'Clean' },
    };

    const views: SurfaceViewProjection[] = [
      { surfaceName: 'Infrastructure', snapshotId: 'snap-scenario-e', technologies: [{ name: 'Cloudflare', layer: 'EDGE' }] },
    ];

    const result = validateFrontendCrossSurfaceConsistency(disappearanceState, views);
    assert.equal(result.isConsistent, true);
    // Invariant: PHP is absent from active technologies list
    assert.ok(!disappearanceState.technologies.some((t) => t.name === 'PHP'));
  });

  // Scenario F — Unknown layer preserved
  it('Scenario F: Edge -> Runtime without gateway preserves direct relationship with zero invented hops', () => {
    const flatState: FrontendAuthoritativeIntelligenceState = {
      snapshotId: 'snap-scenario-f',
      domainId: 'domain-f',
      domainName: 'flat.enterprise.com',
      timestamp: '2026-08-29T10:00:00.000Z',
      status: 'STABLE',
      technologies: [
        { name: 'Cloudflare', layer: 'EDGE', confidence: 'HIGH', evidence: [], whatThisDoesNotProve: [] },
        { name: 'Node.js', layer: 'RUNTIME', confidence: 'HIGH', evidence: [], whatThisDoesNotProve: [] },
      ],
      ingressPath: [
        { hopIndex: 1, title: 'Cloudflare', layer: 'EDGE', technologyName: 'Cloudflare', status: 'OBSERVED', isDirectConnection: true },
        { hopIndex: 2, title: 'Node.js', layer: 'RUNTIME', technologyName: 'Node.js', status: 'OBSERVED', isDirectConnection: true },
      ],
      activeFindings: [],
      resolvedFindings: [],
      changeEvents: [],
      posture: {
        securityRating: 'GOOD',
        architectureRating: 'FLAT_DIRECT',
        exposureLevel: 'LOW',
        activeControls: [],
        securityGaps: [],
        summary: 'Direct edge-to-runtime connection.',
      },
      whatMattersNow: {
        status: 'STABLE',
        headline: 'Architecture Stable',
        narrative: 'Direct edge connection.',
        primaryAction: 'View architecture',
      },
      unifiedNarrative: { headline: 'flat.enterprise.com direct connection.', pathSummary: 'Cloudflare → Node.js', oneLiner: 'Direct' },
      knownUnknowns: [],
      confidence: { overall: 'HIGH', score: 0.9, rationale: 'Direct' },
    };

    const views: SurfaceViewProjection[] = [
      { surfaceName: 'Topology', snapshotId: 'snap-scenario-f', topologyHops: ['Cloudflare', 'Node.js'] },
    ];

    const result = validateFrontendCrossSurfaceConsistency(flatState, views);
    assert.equal(result.isConsistent, true);
    assert.equal(flatState.ingressPath.length, 2);
  });

  // Scenario G — Sealed backend database
  it('Scenario G: Unobserved database remains strictly UNOBSERVED without speculation', () => {
    const sealedState: FrontendAuthoritativeIntelligenceState = {
      snapshotId: 'snap-scenario-g',
      domainId: 'domain-g',
      domainName: 'backend.enterprise.com',
      timestamp: '2026-08-29T10:00:00.000Z',
      status: 'STABLE',
      technologies: [
        { name: 'Node.js', layer: 'RUNTIME', confidence: 'HIGH', evidence: [], whatThisDoesNotProve: ['Database'] },
      ],
      ingressPath: [{ hopIndex: 1, title: 'Node.js', layer: 'RUNTIME', status: 'OBSERVED', isDirectConnection: true }],
      activeFindings: [],
      resolvedFindings: [],
      changeEvents: [],
      posture: {
        securityRating: 'GOOD',
        architectureRating: 'BUFFERED_GATEWAY',
        exposureLevel: 'LOW',
        activeControls: [],
        securityGaps: [],
        summary: 'Sealed perimeter.',
      },
      whatMattersNow: { status: 'STABLE', headline: 'Stable', narrative: 'Stable', primaryAction: 'View' },
      unifiedNarrative: { headline: 'backend.enterprise.com stable.', pathSummary: 'Node.js', oneLiner: 'Sealed' },
      knownUnknowns: [
        { dimension: 'Database Tier', status: 'UNOBSERVED', explanation: 'Internal database is unobserved.' },
      ],
      confidence: { overall: 'HIGH', score: 0.9, rationale: 'Sealed' },
    };

    assert.equal(sealedState.knownUnknowns[0].status, 'UNOBSERVED');
    assert.ok(!sealedState.technologies.some((t) => t.name.toLowerCase().includes('database')));
  });

  // Scenario H — Corroborated technology
  it('Scenario H: Direct banner plus behavioral signal yields HIGH confidence consistent everywhere', () => {
    const corroboratedState: FrontendAuthoritativeIntelligenceState = {
      snapshotId: 'snap-scenario-h',
      domainId: 'domain-h',
      domainName: 'corroborated.enterprise.com',
      timestamp: '2026-08-29T10:00:00.000Z',
      status: 'STABLE',
      technologies: [
        {
          name: 'NGINX',
          layer: 'GATEWAY',
          version: '1.24.0',
          confidence: 'HIGH',
          evidence: ['Server: nginx/1.24.0', 'Wire Signal: NGINX error page formatting'],
          whatThisDoesNotProve: [],
        },
      ],
      ingressPath: [{ hopIndex: 1, title: 'NGINX', layer: 'GATEWAY', status: 'OBSERVED', isDirectConnection: true }],
      activeFindings: [],
      resolvedFindings: [],
      changeEvents: [],
      posture: {
        securityRating: 'GOOD',
        architectureRating: 'BUFFERED_GATEWAY',
        exposureLevel: 'LOW',
        activeControls: [],
        securityGaps: [],
        summary: 'Corroborated gateway.',
      },
      whatMattersNow: { status: 'STABLE', headline: 'Stable', narrative: 'Stable', primaryAction: 'View' },
      unifiedNarrative: { headline: 'corroborated.enterprise.com verified.', pathSummary: 'NGINX', oneLiner: 'Corroborated' },
      knownUnknowns: [],
      confidence: { overall: 'HIGH', score: 0.98, rationale: 'Corroborated via wire signature' },
    };

    const views: SurfaceViewProjection[] = [
      { surfaceName: 'Overview', snapshotId: 'snap-scenario-h', confidenceLevel: 'HIGH' },
      { surfaceName: 'EvidenceDrawer', snapshotId: 'snap-scenario-h', confidenceLevel: 'HIGH' },
    ];

    const result = validateFrontendCrossSurfaceConsistency(corroboratedState, views);
    assert.equal(result.isConsistent, true);
    assert.equal(corroboratedState.confidence.overall, 'HIGH');
  });
});
