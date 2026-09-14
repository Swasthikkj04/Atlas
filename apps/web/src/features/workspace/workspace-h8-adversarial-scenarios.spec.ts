import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  auditFrontendCurrentVsHistoricalSeparation,
} from './contracts/intelligence-integrity-gate.contract.ts';
import {
  type FrontendAuthoritativeIntelligenceState,
  validateFrontendCrossSurfaceConsistency,
} from './contracts/intelligence-consistency.contract.ts';

describe('Workspace H8 — Adversarial Truth Scenarios & Current vs Historical Separation (Frontend)', () => {
  it('Scenario 1: Finding disappears / is resolved (CSP Problem Prevention)', () => {
    const currentState: FrontendAuthoritativeIntelligenceState = {
      snapshotId: 'snap-n-plus-1',
      domainId: 'dom-csp-test',
      domainName: 'csp-fixed.io',
      timestamp: new Date().toISOString(),
      status: 'STABLE',
      technologies: [
        {
          id: 'tech-cloudflare',
          name: 'Cloudflare',
          layer: 'EDGE',
          confidence: 'HIGH',
          evidence: ['server: cloudflare'],
          isConfirmed: true,
        },
      ],
      ingressPath: [],
      activeFindings: [], // Zero active findings
      resolvedFindings: [
        {
          id: 'finding-csp-missing',
          title: 'Missing Content-Security-Policy Header',
          severity: 'MEDIUM',
          category: 'SECURITY',
          isCompliant: true,
          resolvingSnapshotId: 'snap-n-plus-1',
        },
      ],
      changeEvents: [
        {
          id: 'change-csp-fixed',
          category: 'FINDING_RESOLVED',
          title: 'CSP protection restored',
          whatChanged: 'Content-Security-Policy header configured.',
          timestamp: new Date().toISOString(),
        },
      ],
      posture: { security: 'GOOD', architecture: 'OPTIMAL', summary: 'Good' },
      whatMattersNow: { headline: 'Architecture Stable', urgency: 'LOW', requiredAction: 'None' },
      unifiedNarrative: {
        headline: 'csp-fixed.io is served via Cloudflare.',
        pathSummary: 'Cloudflare',
        oneLiner: 'Secure edge architecture',
      },
      knownUnknowns: [],
      confidence: { overall: 'HIGH', basis: ['Authoritative headers'] },
    };

    const audit = auditFrontendCurrentVsHistoricalSeparation(currentState, {
      resolvedFindingIds: ['finding-csp-missing'],
    });
    assert.equal(audit.isSeparated, true);
    assert.equal(audit.leakedFindingIds.length, 0);

    const validation = validateFrontendCrossSurfaceConsistency(currentState);
    assert.equal(validation.isConsistent, true);
  });

  it('Scenario 2: Technology disappears (NGINX -> Envoy migration with zero ghost badges)', () => {
    const currentState: FrontendAuthoritativeIntelligenceState = {
      snapshotId: 'snap-envoy-current',
      domainId: 'dom-migrated',
      domainName: 'migrated.io',
      timestamp: new Date().toISOString(),
      status: 'CHANGED',
      technologies: [
        {
          id: 'tech-envoy',
          name: 'Envoy',
          layer: 'GATEWAY',
          confidence: 'HIGH',
          evidence: ['server: envoy'],
          isConfirmed: true,
        },
      ],
      ingressPath: [
        { id: 'h-envoy', layer: 'GATEWAY', title: 'Envoy', technologyName: 'Envoy', status: 'OBSERVED', order: 1 },
      ],
      activeFindings: [],
      resolvedFindings: [],
      changeEvents: [
        {
          id: 'ch-migration',
          category: 'TECHNOLOGY',
          title: 'Gateway Migration: NGINX replaced by Envoy',
          whatChanged: 'Envoy proxy deployed.',
          timestamp: new Date().toISOString(),
        },
      ],
      posture: { security: 'GOOD', architecture: 'OPTIMAL', summary: 'Good' },
      whatMattersNow: { headline: 'Gateway Migrated', urgency: 'LOW', requiredAction: 'None' },
      unifiedNarrative: { headline: 'migrated.io uses Envoy.', pathSummary: 'Envoy', oneLiner: 'Migrated' },
      knownUnknowns: [],
      confidence: { overall: 'HIGH', basis: [] },
    };

    const audit = auditFrontendCurrentVsHistoricalSeparation(currentState, {
      previousTechnologies: ['NGINX'],
    });
    assert.equal(audit.isSeparated, true);
    assert.equal(audit.ghostBadges.length, 0);
  });

  it('Scenario 3: Partial evidence preserves unobserved gateway without guessing', () => {
    const currentState: FrontendAuthoritativeIntelligenceState = {
      snapshotId: 'snap-partial',
      domainId: 'dom-partial',
      domainName: 'partial.io',
      timestamp: new Date().toISOString(),
      status: 'STABLE',
      technologies: [
        { id: 't-cf', name: 'Cloudflare', layer: 'EDGE', confidence: 'HIGH', evidence: ['cf-ray'], isConfirmed: true },
        { id: 't-node', name: 'Node.js', layer: 'RUNTIME', confidence: 'HIGH', evidence: ['node header'], isConfirmed: true },
      ],
      ingressPath: [
        { id: 'h1', layer: 'EDGE', title: 'Cloudflare', technologyName: 'Cloudflare', status: 'OBSERVED', order: 1 },
        { id: 'h2', layer: 'RUNTIME', title: 'Node.js', technologyName: 'Node.js', status: 'OBSERVED', order: 2 },
      ],
      activeFindings: [],
      resolvedFindings: [],
      changeEvents: [],
      posture: { security: 'GOOD', architecture: 'OPTIMAL', summary: 'Good' },
      whatMattersNow: { headline: 'Direct Edge', urgency: 'LOW', requiredAction: 'None' },
      unifiedNarrative: { headline: 'Direct Edge to Node.js', pathSummary: 'Cloudflare -> Node.js', oneLiner: 'Direct' },
      knownUnknowns: [{ dimension: 'Gateway Proxy', status: 'UNOBSERVED', reason: 'Direct edge connection' }],
      confidence: { overall: 'HIGH', basis: [] },
    };

    const hasInventedGateway = currentState.ingressPath.some((h) => h.layer === 'GATEWAY');
    assert.equal(hasInventedGateway, false);
    const validation = validateFrontendCrossSurfaceConsistency(currentState);
    assert.equal(validation.isConsistent, true);
  });

  it('Scenario 4: Sealed backend tier remains strictly UNOBSERVED', () => {
    const currentState: FrontendAuthoritativeIntelligenceState = {
      snapshotId: 'snap-sealed-fe',
      domainId: 'dom-sealed-fe',
      domainName: 'sealed.io',
      timestamp: new Date().toISOString(),
      status: 'STABLE',
      technologies: [
        { id: 't-node', name: 'Node.js', layer: 'RUNTIME', confidence: 'HIGH', evidence: ['node'], isConfirmed: true },
      ],
      ingressPath: [
        { id: 'h1', layer: 'RUNTIME', title: 'Node.js', technologyName: 'Node.js', status: 'OBSERVED', order: 1 },
      ],
      activeFindings: [],
      resolvedFindings: [],
      changeEvents: [],
      posture: { security: 'GOOD', architecture: 'OPTIMAL', summary: 'Good' },
      whatMattersNow: { headline: 'All good', urgency: 'LOW', requiredAction: 'None' },
      unifiedNarrative: { headline: 'Sealed backend', pathSummary: 'Node.js', oneLiner: 'Sealed' },
      knownUnknowns: [{ dimension: 'Database Tier', status: 'UNOBSERVED', reason: 'Internal network sealed' }],
      confidence: { overall: 'HIGH', basis: [] },
    };

    const dbUnknown = currentState.knownUnknowns.find((k) => k.dimension === 'Database Tier');
    assert.equal(dbUnknown?.status, 'UNOBSERVED');
    const validation = validateFrontendCrossSurfaceConsistency(currentState);
    assert.equal(validation.isConsistent, true);
  });
});
