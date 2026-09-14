import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_R016_TICKET_ID,
  GX_R016_PHASE,
  GX_R016_STATUS,
  GX_R016_PRIMARY_PRINCIPLE,
  GX_R016_FROZEN_PRINCIPLES,
  GX_R016_ACCEPTANCE_GATE_STATEMENT,
  GX_R016_CERTIFICATION_GATE_STATEMENT,
  NEBULA_MEMORY_CORE_THESIS,
  GX_R016_INVARIANTS,
  GX_R016_PROHIBITED_ANTIPATTERNS,
  CANONICAL_HISTORY_BLUEPRINT_CAPABILITIES,
  verifyGXR016CertificationGate,
  deriveMemoryActivationNarrative,
  auditHistoryAccessPermission,
  validateClaimBridgePayload,
  generateGenesisTimelineBaseline,
  evaluateHistoryBridgeState,
  validateMemoryMetaphorCopy,
} from './gx-r016-history-claim-bridge.contract.ts';

describe('GX-R016: History & Claim Bridge Contract', () => {
  describe('1. Canonical Metadata & Acceptance Gate', () => {
    it('defines ticket metadata, phase, and frozen status', () => {
      assert.equal(GX_R016_TICKET_ID, 'GX-R016');
      assert.equal(GX_R016_PHASE, 'GX-R — Nebula First Experience Redesign');
      assert.equal(GX_R016_STATUS, 'FROZEN_HISTORY_CLAIM_BRIDGE_CONTRACT');
      assert.ok(GX_R016_PRIMARY_PRINCIPLE.includes('Nebula beginning to remember'));
    });

    it('embodies the 5 frozen principles and memory core thesis', () => {
      assert.equal(GX_R016_FROZEN_PRINCIPLES.length, 5);
      assert.ok(GX_R016_FROZEN_PRINCIPLES.some((p) => p.includes('architectural reality')));
      assert.ok(GX_R016_FROZEN_PRINCIPLES.some((p) => p.includes('beginning to remember')));
      assert.ok(GX_R016_FROZEN_PRINCIPLES.some((p) => p.includes('Zero-friction session handover')));
      assert.ok(NEBULA_MEMORY_CORE_THESIS.differentiatingFactor.includes('persistence and memory'));
    });

    it('passes the 🔒 GX-R016 Certification Gate with canonical statement', () => {
      const result = verifyGXR016CertificationGate(GX_R016_CERTIFICATION_GATE_STATEMENT);
      assert.equal(result.passed, true);
      assert.equal(result.canonicalAnswer, GX_R016_CERTIFICATION_GATE_STATEMENT);
    });

    it('passes the 🔒 GX-R016 Certification Gate with semantically equivalent statement', () => {
      const statement =
        'History is an architectural boundary for ephemeral sessions. Continuous tracking represents Nebula beginning to remember, creating a workspace baseline.';
      const result = verifyGXR016CertificationGate(statement);
      assert.equal(result.passed, true);
    });

    it('rejects a statement promoting artificial paywalls or transactional upgrades', () => {
      const paywallStatement =
        'History is locked behind a paywall so users must pay a subscription price to unlock.';
      const result = verifyGXR016CertificationGate(paywallStatement);
      assert.equal(result.passed, false);
      assert.ok(result.reasoning.includes('does not meet GX-R016 certification criteria'));
    });
  });

  describe('2. Memory Metaphor Authority & Copy Validation', () => {
    it('validates calm, memory-centered narrative copy', () => {
      const compliantCopy =
        'Nebula is ready to remember your infrastructure. In ephemeral mode, Nebula captures this single moment. In Workspace, Nebula begins continuous snapshot memory.';
      const result = validateMemoryMetaphorCopy(compliantCopy);
      assert.equal(result.valid, true);
      assert.equal(result.violations.length, 0);
    });

    it('rejects coercive sales copy and paywall tropes', () => {
      const coerciveCopy =
        'Special offer! Upgrade to Pro to see your full history. Buy now before your data is deleted in 5 minutes!';
      const result = validateMemoryMetaphorCopy(coerciveCopy);
      assert.equal(result.valid, false);
      assert.ok(result.violations.length >= 2);
    });

    it('derives authoritative memory activation narrative with signal counts', () => {
      const narrative = deriveMemoryActivationNarrative('stripe.com', 42);
      assert.equal(narrative.domain, 'stripe.com');
      assert.ok(narrative.headline.includes('stripe.com'));
      assert.ok(narrative.genesisDescription.includes('42 verified wire signals'));
      assert.equal(narrative.callToActionText, 'Begin Continuous Memory →');
    });
  });

  describe('3. History Access Permissions & Architectural Boundary', () => {
    it('locks history for ephemeral guest users with explanatory boundary reason', () => {
      const audit = auditHistoryAccessPermission(true, 0);
      assert.equal(audit.isAllowed, false);
      assert.equal(audit.verdict, 'LOCKED_EPHEMERAL_BOUNDARY');
      assert.ok(audit.reason.includes('ephemeral guest mode'));
    });

    it('permits history access for authenticated workspace users', () => {
      const audit = auditHistoryAccessPermission(false, 10);
      assert.equal(audit.isAllowed, true);
      assert.equal(audit.verdict, 'PERMITTED');
    });

    it('rejects invalid negative history depths', () => {
      const audit = auditHistoryAccessPermission(false, -5);
      assert.equal(audit.isAllowed, false);
      assert.equal(audit.verdict, 'INVALID_TARGET');
    });
  });

  describe('4. Claim Bridge Payload Validation & Genesis Baseline Handover', () => {
    it('validates a complete and well-formed ClaimBridgePayload', () => {
      const validPayload = {
        domain: 'stripe.com',
        sessionId: 'ses_test_123',
        jobId: 'job_test_456',
        baselineSnapshotTimestamp: new Date().toISOString(),
        capturedSignalsCount: 38,
        ingressHopsCount: 5,
        actionableFindingsCount: 2,
        claimInitiatedAt: new Date().toISOString(),
      };

      const result = validateClaimBridgePayload(validPayload);
      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });

    it('identifies missing domain, session ID, or job ID in claim payload', () => {
      const invalidPayload = {
        domain: '',
        sessionId: '',
        jobId: '',
        capturedSignalsCount: -1,
      };

      const result = validateClaimBridgePayload(invalidPayload);
      assert.equal(result.valid, false);
      assert.ok(result.errors.length >= 3);
    });

    it('generates an authoritative Genesis Baseline node (Snapshot #0)', () => {
      const genesis = generateGenesisTimelineBaseline(
        'stripe.com',
        'ses_genesis_abc123',
        'job_genesis_456',
        52
      );

      assert.equal(genesis.domain, 'stripe.com');
      assert.equal(genesis.epoch, 'GENESIS');
      assert.equal(genesis.isAuthoritativeBaseline, true);
      assert.equal(genesis.totalSignals, 52);
      assert.ok(genesis.nodeId.startsWith('snap_genesis_'));
    });
  });

  describe('5. History Bridge State Evaluator', () => {
    it('resolves CONTINUOUS_LINEAGE for authenticated workspace users', () => {
      const state = evaluateHistoryBridgeState({
        isGuest: false,
        hasSession: true,
      });

      assert.equal(state.status, 'CONTINUOUS_LINEAGE');
      assert.equal(state.canClaim, false);
    });

    it('resolves CLAIM_PENDING with canClaim=true for active guest session', () => {
      const state = evaluateHistoryBridgeState({
        isGuest: true,
        hasSession: true,
        isExpired: false,
      });

      assert.equal(state.status, 'CLAIM_PENDING');
      assert.equal(state.canClaim, true);
      assert.ok(state.explanation.includes('Ready to preserve as Genesis Baseline'));
    });

    it('resolves EPHEMERAL_OBSERVATION with canClaim=false for expired session', () => {
      const state = evaluateHistoryBridgeState({
        isGuest: true,
        hasSession: true,
        isExpired: true,
      });

      assert.equal(state.status, 'EPHEMERAL_OBSERVATION');
      assert.equal(state.canClaim, false);
      assert.ok(state.explanation.includes('expired'));
    });
  });

  describe('6. Ten Core Invariants & Anti-Patterns Verification', () => {
    it('verifies all 10 core invariants are present and frozen', () => {
      assert.equal(GX_R016_INVARIANTS.length, 10);
      assert.ok(GX_R016_INVARIANTS.some((i) => i.includes('Ephemeral Temporal Grounding')));
      assert.ok(GX_R016_INVARIANTS.some((i) => i.includes('Memory Metaphor Authority')));
      assert.ok(GX_R016_INVARIANTS.some((i) => i.includes('Genesis Baseline Preservation')));
      assert.ok(GX_R016_INVARIANTS.some((i) => i.includes('Zero Synthetic Diffing')));
      assert.ok(GX_R016_INVARIANTS.some((i) => i.includes('Multi-Tenant Memory Isolation')));
    });

    it('verifies all 6 prohibited anti-patterns are documented', () => {
      assert.equal(GX_R016_PROHIBITED_ANTIPATTERNS.length, 6);
      assert.ok(GX_R016_PROHIBITED_ANTIPATTERNS.includes('COERCIVE_COUNTDOWN_ULTIMATUM'));
      assert.ok(GX_R016_PROHIBITED_ANTIPATTERNS.includes('PAYWALL_PRICING_PROMOTION'));
      assert.ok(GX_R016_PROHIBITED_ANTIPATTERNS.includes('SYNTHETIC_DIFF_FABRICATION'));
    });

    it('verifies canonical history blueprint capabilities', () => {
      assert.equal(CANONICAL_HISTORY_BLUEPRINT_CAPABILITIES.length, 4);
      assert.ok(CANONICAL_HISTORY_BLUEPRINT_CAPABILITIES.some((c) => c.role === 'LINEAGE'));
      assert.ok(CANONICAL_HISTORY_BLUEPRINT_CAPABILITIES.some((c) => c.role === 'DIFF'));
      assert.ok(CANONICAL_HISTORY_BLUEPRINT_CAPABILITIES.some((c) => c.role === 'DRIFT'));
      assert.ok(CANONICAL_HISTORY_BLUEPRINT_CAPABILITIES.some((c) => c.role === 'TIMELINE'));
    });
  });
});
