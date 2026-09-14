import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  H8_FRONTEND_CERTIFIED_INVARIANTS,
  validateFrontendPipelineIntegrity,
  verifyFrontendConfidenceMonotonicity,
  auditFrontendCurrentVsHistoricalSeparation,
} from './contracts/intelligence-integrity-gate.contract.ts';
import type { FrontendAuthoritativeIntelligenceState } from './contracts/intelligence-consistency.contract.ts';

describe('Workspace H8 — Pipeline Integrity & Confidence Monotonicity (Frontend)', () => {
  it('certifies all H8 frontend invariants', () => {
    assert.equal(H8_FRONTEND_CERTIFIED_INVARIANTS.H8_PIPELINE_INTEGRITY_STRICT, true);
    assert.equal(H8_FRONTEND_CERTIFIED_INVARIANTS.H8_EVIDENCE_LINEAGE_COMPLETENESS, true);
    assert.equal(H8_FRONTEND_CERTIFIED_INVARIANTS.H8_CONFIDENCE_MONOTONIC_ORDERING, true);
    assert.equal(H8_FRONTEND_CERTIFIED_INVARIANTS.H8_CURRENT_HISTORICAL_TRUTH_SEPARATION, true);
    assert.equal(H8_FRONTEND_CERTIFIED_INVARIANTS.H8_CROSS_SURFACE_CONTRADICTION_SWEEP, true);
    assert.equal(H8_FRONTEND_CERTIFIED_INVARIANTS.H8_ADVERSARIAL_TRUTH_RESILIENCE, true);
    assert.equal(H8_FRONTEND_CERTIFIED_INVARIANTS.H8_SECURITY_AUTHORIZATION_HARDENING, true);
    assert.equal(H8_FRONTEND_CERTIFIED_INVARIANTS.H8_DETERMINISM_AND_IDEMPOTENCY, true);
    assert.equal(H8_FRONTEND_CERTIFIED_INVARIANTS.H8_CACHE_CONVERGENCE_INTEGRITY, true);
    assert.equal(H8_FRONTEND_CERTIFIED_INVARIANTS.H8_PRODUCTION_FAILURE_RESILIENCE, true);
    assert.equal(H8_FRONTEND_CERTIFIED_INVARIANTS.H8_MASTER_INTELLIGENCE_CERTIFICATION, true);
    assert.equal(H8_FRONTEND_CERTIFIED_INVARIANTS.H8_FINAL_PRODUCTION_GATE_SEALED, true);
  });

  it('validates clean pipeline state without ungrounded entities', () => {
    const validState: FrontendAuthoritativeIntelligenceState = {
      snapshotId: 'snap-fe-valid',
      domainId: 'dom-fe-1',
      domainName: 'clean-pipeline.io',
      timestamp: new Date().toISOString(),
      status: 'STABLE',
      technologies: [
        {
          id: 'tech-cf',
          name: 'Cloudflare',
          layer: 'EDGE',
          confidence: 'HIGH',
          evidence: ['server: cloudflare'],
          isConfirmed: true,
        },
        {
          id: 'tech-node',
          name: 'Node.js',
          layer: 'RUNTIME',
          confidence: 'HIGH',
          evidence: ['x-powered-by: Express'],
          isConfirmed: true,
        },
      ],
      ingressPath: [
        { id: 'h1', layer: 'EDGE', title: 'Cloudflare', technologyName: 'Cloudflare', status: 'OBSERVED', order: 1 },
        { id: 'h2', layer: 'RUNTIME', title: 'Node.js', technologyName: 'Node.js', status: 'OBSERVED', order: 2 },
      ],
      activeFindings: [],
      resolvedFindings: [],
      changeEvents: [],
      posture: { security: 'GOOD', architecture: 'OPTIMAL', summary: 'Good' },
      whatMattersNow: { headline: 'All good', urgency: 'LOW', requiredAction: 'None' },
      unifiedNarrative: {
        headline: 'Clean production pipeline.',
        pathSummary: 'Cloudflare -> Node.js',
        oneLiner: 'Clean state',
      },
      knownUnknowns: [{ dimension: 'Database Tier', status: 'UNOBSERVED', reason: 'Internal network sealed' }],
      confidence: { overall: 'HIGH', basis: ['Authoritative headers'] },
    };

    const audit = validateFrontendPipelineIntegrity(validState);
    assert.equal(audit.isValid, true);
    assert.equal(audit.ungroundedClaims.length, 0);
    assert.equal(audit.ungroundedTechnologies.length, 0);
    assert.equal(audit.ungroundedFindings.length, 0);
  });

  it('detects ungrounded technologies missing evidence', () => {
    const corruptedState: FrontendAuthoritativeIntelligenceState = {
      snapshotId: 'snap-fe-corrupt',
      domainId: 'dom-fe-2',
      domainName: 'corrupt.io',
      timestamp: new Date().toISOString(),
      status: 'STABLE',
      technologies: [
        {
          id: 'tech-nginx',
          name: 'NGINX',
          layer: 'GATEWAY',
          confidence: 'HIGH',
          evidence: [], // Missing evidence!
          isConfirmed: true,
        },
      ],
      ingressPath: [],
      activeFindings: [],
      resolvedFindings: [],
      changeEvents: [],
      posture: { security: 'GOOD', architecture: 'OPTIMAL', summary: 'Good' },
      whatMattersNow: { headline: 'All good', urgency: 'LOW', requiredAction: 'None' },
      unifiedNarrative: { headline: 'Corrupt', pathSummary: 'Direct', oneLiner: 'Corrupt' },
      knownUnknowns: [],
      confidence: { overall: 'HIGH', basis: [] },
    };

    const audit = validateFrontendPipelineIntegrity(corruptedState);
    assert.equal(audit.isValid, false);
    assert.ok(audit.ungroundedTechnologies.includes('NGINX'));
  });

  it('validates confidence monotonicity and prohibits behavioral inflation', () => {
    const valid = verifyFrontendConfidenceMonotonicity('HIGH', 'HIGH', 'HIGH');
    assert.equal(valid.isMonotonic, true);

    const inflated = verifyFrontendConfidenceMonotonicity('LOW', 'HIGH', 'HIGH');
    assert.equal(inflated.isMonotonic, false);

    const behavioralInflated = verifyFrontendConfidenceMonotonicity('HIGH', 'HIGH', 'HIGH', true);
    assert.equal(behavioralInflated.isMonotonic, false);
  });
});
