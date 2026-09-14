import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_R008_TICKET_ID,
  GX_R008_PHASE,
  GX_R008_STATUS,
  GX_R008_FROZEN_PRINCIPLE,
  GX_R008_NEBULA_PAUSE_MS,
  GX_R008_CERTIFICATION_GATE_STATEMENT,
  CANONICAL_COGNITIVE_STAGES,
  TRANSITION_STATE_RULES,
  UNDERSTANDING_TRANSITION_INVARIANTS,
  PROHIBITED_TRANSITION_ANTI_PATTERNS,
  validateTransitionStateMachine,
  verifyGXR008CertificationGate,
} from './gx-r008-understanding-transition.contract.ts';

describe('GX-R008: Understanding Transition Contract', () => {
  describe('1. Canonical Metadata & Principles', () => {
    it('defines ticket metadata and status', () => {
      assert.equal(GX_R008_TICKET_ID, 'GX-R008');
      assert.equal(GX_R008_PHASE, 'Guest Experience Redesign');
      assert.equal(GX_R008_STATUS, 'FROZEN_TRANSITION_CONTRACT');
    });

    it('embodies the frozen understanding principle', () => {
      assert.equal(
        GX_R008_FROZEN_PRINCIPLE,
        'The transition should feel like Nebula beginning to understand — not a scanner running checks.'
      );
      assert.equal(GX_R008_NEBULA_PAUSE_MS, 520);
    });

    it('passes the 🔒 GX-R008 Acceptance Gate with canonical statement', () => {
      const statement =
        'A guest can submit a domain and experience a calm, spatially stable transition in which Nebula visibly begins forming an understanding, without feeling that they have entered a conventional security scanner.';
      const result = verifyGXR008CertificationGate(statement);

      assert.equal(result.passed, true);
      assert.equal(result.canonicalStatement, GX_R008_CERTIFICATION_GATE_STATEMENT);
      assert.equal(result.similarityRatio, 1);
    });

    it('rejects an invalid statement proposing a scanner dashboard with percentage bars', () => {
      const statement = 'A fast scanning radar dashboard that shows 500 checks and percentage completion counters.';
      const result = verifyGXR008CertificationGate(statement);

      assert.equal(result.passed, false);
      assert.ok(result.similarityRatio < 0.4);
    });
  });

  describe('2. Progressive Cognitive Stages vs Scanner Terminology', () => {
    it('defines exactly 4 canonical cognitive understanding stages', () => {
      assert.equal(CANONICAL_COGNITIVE_STAGES.length, 4);
      const statements = CANONICAL_COGNITIVE_STAGES.map((s) => s.statement);
      assert.deepEqual(statements, [
        'Establishing the perimeter.',
        'Reading the infrastructure.',
        'Connecting the signals.',
        'Building the current understanding.',
      ]);
    });

    it('explicitly contrasts every cognitive stage against prohibited scanner terminology', () => {
      CANONICAL_COGNITIVE_STAGES.forEach((stage) => {
        assert.ok(stage.id.startsWith('stage_'));
        assert.ok(stage.statement.endsWith('.'));
        assert.ok(stage.subtext.length > 20);
        assert.ok(stage.minDurationMs >= 700);
        assert.ok(stage.prohibitedScannerEquivalent.length > 0);
      });
    });
  });

  describe('3. Transition State Machine Rules', () => {
    it('defines all canonical state transition pathways', () => {
      assert.equal(TRANSITION_STATE_RULES.length, 7);
      const fromStates = TRANSITION_STATE_RULES.map((r) => r.from);
      assert.ok(fromStates.includes('IDLE'));
      assert.ok(fromStates.includes('COMMIT_INTENT'));
      assert.ok(fromStates.includes('NEBULA_PAUSE'));
      assert.ok(fromStates.includes('UNDERSTANDING'));
      assert.ok(fromStates.includes('PARTIAL_UNDERSTANDING'));
    });

    it('supports immediate transition to partial understanding when canonical signals arrive', () => {
      const partialRule = TRANSITION_STATE_RULES.find(
        (r) => r.from === 'UNDERSTANDING' && r.to === 'PARTIAL_UNDERSTANDING'
      );
      assert.ok(partialRule);
      assert.ok(partialRule.guarantee.includes('meaningful intelligence immediately'));
    });
  });

  describe('4. Scope, Accessibility & Stability Invariants', () => {
    it('codifies all 8 transition invariants', () => {
      assert.equal(UNDERSTANDING_TRANSITION_INVARIANTS.length, 8);
      assert.ok(UNDERSTANDING_TRANSITION_INVARIANTS.some((i) => i.includes('Submission handoff freezes domain intent')));
      assert.ok(UNDERSTANDING_TRANSITION_INVARIANTS.some((i) => i.includes('Domain remains continuously visible')));
      assert.ok(UNDERSTANDING_TRANSITION_INVARIANTS.some((i) => i.includes('aria-live="polite"')));
      assert.ok(UNDERSTANDING_TRANSITION_INVARIANTS.some((i) => i.includes('zero stack traces')));
    });
  });

  describe('5. Eight Explicitly Prohibited Scanner Anti-Patterns', () => {
    it('enumerates all 8 prohibited anti-patterns', () => {
      assert.equal(PROHIBITED_TRANSITION_ANTI_PATTERNS.length, 8);
      assert.ok(PROHIBITED_TRANSITION_ANTI_PATTERNS.some((p) => p.includes('Percentage completion')));
      assert.ok(PROHIBITED_TRANSITION_ANTI_PATTERNS.some((p) => p.includes('Fake technical check counters')));
      assert.ok(PROHIBITED_TRANSITION_ANTI_PATTERNS.some((p) => p.includes('Replacing the entire page with a full-screen loading spinner')));
      assert.ok(PROHIBITED_TRANSITION_ANTI_PATTERNS.some((p) => p.includes('Artificial 5–10 second delays')));
    });
  });

  describe('6. State Machine Configuration Validator', () => {
    it('approves a compliant transition configuration', () => {
      const result = validateTransitionStateMachine({
        hasPercentageCounter: false,
        hasCheckCounter: false,
        hasScannerTerminology: false,
        hasPageReplacementLoader: false,
        hasArtificialLongDelays: false,
        supportsPartialUnderstanding: true,
        preservesDomainVisibility: true,
        hidesStackTracesOnError: true,
        usesPoliteAriaLive: true,
        nebulaPauseMs: 520,
      });

      assert.equal(result.valid, true);
      assert.equal(result.violation, undefined);
    });

    it('rejects percentage completion counters', () => {
      const result = validateTransitionStateMachine({
        hasPercentageCounter: true,
        hasCheckCounter: false,
        hasScannerTerminology: false,
        hasPageReplacementLoader: false,
        hasArtificialLongDelays: false,
        supportsPartialUnderstanding: true,
        preservesDomainVisibility: true,
        hidesStackTracesOnError: true,
        usesPoliteAriaLive: true,
        nebulaPauseMs: 520,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Percentage counters'));
    });

    it('rejects full page loader takeovers', () => {
      const result = validateTransitionStateMachine({
        hasPercentageCounter: false,
        hasCheckCounter: false,
        hasScannerTerminology: false,
        hasPageReplacementLoader: true,
        hasArtificialLongDelays: false,
        supportsPartialUnderstanding: true,
        preservesDomainVisibility: true,
        hidesStackTracesOnError: true,
        usesPoliteAriaLive: true,
        nebulaPauseMs: 520,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Replacing the entire page'));
    });

    it('rejects scanner terminology', () => {
      const result = validateTransitionStateMachine({
        hasPercentageCounter: false,
        hasCheckCounter: false,
        hasScannerTerminology: true,
        hasPageReplacementLoader: false,
        hasArtificialLongDelays: false,
        supportsPartialUnderstanding: true,
        preservesDomainVisibility: true,
        hidesStackTracesOnError: true,
        usesPoliteAriaLive: true,
        nebulaPauseMs: 520,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Scanner vocabulary'));
    });
  });
});
