import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_R003_TICKET_ID,
  GX_R003_PHASE,
  GX_R003_STATUS,
  GX_R003_CORE_PRINCIPLE,
  GX_R003_CANONICAL_RULE,
  GX_R003_ATMOSPHERIC_PRINCIPLE,
  GX_R003_CERTIFICATION_GATE_STATEMENT,
  GUEST_SHELL_LAYERS,
  CANONICAL_GUEST_ENTRY_SEQUENCE,
  SHELL_SEVEN_STATE_CONTRACT,
  RESPONSIVE_SHELL_TIERS,
  ATMOSPHERIC_LAYER_CONTRACT,
  EXPLICITLY_REJECTED_SHELL_PATTERNS,
  validateGuestShellStructure,
  validateInvestigationContextPreservation,
  verifyGXR003CertificationGate,
} from './gx-r003-shell-entry.contract.ts';

describe('GX-R003: Guest Shell & Entry Architecture Contract', () => {
  describe('1. Canonical Core Principle & Certification Gate', () => {
    it('defines the canonical ticket metadata and status', () => {
      assert.equal(GX_R003_TICKET_ID, 'GX-R003');
      assert.equal(GX_R003_PHASE, 'GX-R — Nebula First Experience Redesign');
      assert.equal(GX_R003_STATUS, 'FROZEN_SHELL_ARCHITECTURE');
    });

    it('embodies the core principle, canonical rule, and atmospheric principle', () => {
      assert.equal(
        GX_R003_CORE_PRINCIPLE,
        'The shell should disappear into the experience. The intelligence should remain the focus.'
      );
      assert.equal(GX_R003_CANONICAL_RULE, 'The Guest Workspace is an environment, not a page.');
      assert.equal(
        GX_R003_ATMOSPHERIC_PRINCIPLE,
        'Atmosphere establishes identity. Intelligence establishes value.'
      );
    });

    it('passes the 🔒 GX-R003 Certification Gate with canonical statement', () => {
      const statement =
        'A guest can enter Nebula, identify the domain being understood, recognize the current state, move through the intelligence surfaces, investigate evidence, and return to their previous context — all within one coherent bounded environment.';
      const result = verifyGXR003CertificationGate(statement);

      assert.equal(result.passed, true);
      assert.equal(result.canonicalStatement, GX_R003_CERTIFICATION_GATE_STATEMENT);
      assert.equal(result.centralRule, GX_R003_CANONICAL_RULE);
      assert.equal(result.similarityRatio, 1);
    });

    it('rejects an invalid statement that treats GX as an uncontained landing page report', () => {
      const statement = 'A guest visits a marketing website that shows scan graphs and leads to a signup wall.';
      const result = verifyGXR003CertificationGate(statement);

      assert.equal(result.passed, false);
      assert.ok(result.similarityRatio < 0.4);
    });
  });

  describe('2. Five Architectural Layers of the Guest Shell', () => {
    it('defines exactly the 5 canonical architectural layers in order', () => {
      assert.equal(GUEST_SHELL_LAYERS.length, 5);
      const layerIds = GUEST_SHELL_LAYERS.map((l) => l.layerId);
      assert.deepEqual(layerIds, [
        'BRAND_IDENTITY',
        'ORIENTATION_CONTEXT',
        'INTELLIGENCE_CANVAS',
        'CONTEXTUAL_ACTIONS',
        'QUIET_PRODUCT_SIGNATURE',
      ]);
    });

    it('enforces monotonic layer order 1 to 5 with explicit prohibited patterns', () => {
      GUEST_SHELL_LAYERS.forEach((layer, idx) => {
        assert.equal(layer.layerOrder, idx + 1);
        assert.ok(layer.name.length > 0);
        assert.ok(layer.description.length > 0);
        assert.ok(layer.visualCharacteristics.length > 0);
        assert.ok(layer.prohibitedPatterns.length >= 3);
      });
    });

    it('identifies Intelligence Canvas as the primary visual region', () => {
      const canvas = GUEST_SHELL_LAYERS.find((l) => l.layerId === 'INTELLIGENCE_CANVAS')!;
      assert.ok(canvas.description.includes('Primary visual region'));
      assert.ok(canvas.visualCharacteristics.includes('65-75 CPL'));
    });
  });

  describe('3. Canonical Guest Entry Sequence', () => {
    it('defines the 5-stage entry sequence from root to workspace', () => {
      assert.equal(CANONICAL_GUEST_ENTRY_SEQUENCE.length, 5);
      const stages = CANONICAL_GUEST_ENTRY_SEQUENCE.map((s) => s.stage);
      assert.deepEqual(stages, [
        'PUBLIC_ROOT',
        'GUEST_ENTRY',
        'DOMAIN_INTENT',
        'BEGIN_UNDERSTANDING',
        'GUEST_WORKSPACE',
      ]);
    });

    it('maintains strict sequential step progression from 1 to 5', () => {
      CANONICAL_GUEST_ENTRY_SEQUENCE.forEach((step, idx) => {
        assert.equal(step.stepNumber, idx + 1);
        assert.ok(step.path.length > 0);
        assert.ok(step.description.length > 0);
      });
    });
  });

  describe('4. Seven-State Shell Stability Contract', () => {
    it('covers all 7 canonical resilience states', () => {
      assert.equal(SHELL_SEVEN_STATE_CONTRACT.length, 7);
      const states = SHELL_SEVEN_STATE_CONTRACT.map((s) => s.state);
      assert.deepEqual(states, [
        'IDLE',
        'UNDERSTANDING',
        'PARTIAL',
        'READY',
        'QUIET',
        'MEANINGFUL_CHANGE',
        'FAILURE',
      ]);
    });

    it('mandates that layout jumps are strictly prohibited across all states', () => {
      SHELL_SEVEN_STATE_CONTRACT.forEach((stateContract) => {
        assert.equal(
          stateContract.layoutJumpProhibited,
          true,
          `State ${stateContract.state} must prohibit layout jumps`
        );
        assert.ok(stateContract.shellPosture.length > 15);
        assert.ok(stateContract.visualFocus.length > 5);
      });
    });
  });

  describe('5. Responsive Shell Frame Transformation', () => {
    it('specifies behaviors across Desktop, Tablet, and Mobile tiers', () => {
      assert.equal(RESPONSIVE_SHELL_TIERS.length, 3);
      const tiers = RESPONSIVE_SHELL_TIERS.map((t) => t.tier);
      assert.deepEqual(tiers, ['Desktop', 'Tablet', 'Mobile']);
    });

    it('prohibits infinite report scrolling across all screen tiers', () => {
      RESPONSIVE_SHELL_TIERS.forEach((tier) => {
        assert.ok(
          tier.scrollingRule.includes('zero infinite page scroll') ||
            tier.scrollingRule.includes('infinite report dump prohibited') ||
            tier.scrollingRule.includes('Contained region scrolling')
        );
      });
    });
  });

  describe('6. Atmospheric Layer Contract', () => {
    it('defines permitted vs forbidden atmospheric rules', () => {
      assert.ok(ATMOSPHERIC_LAYER_CONTRACT.permitted.length >= 4);
      assert.ok(ATMOSPHERIC_LAYER_CONTRACT.forbidden.length >= 4);
      assert.equal(
        ATMOSPHERIC_LAYER_CONTRACT.governingPrinciple,
        'Atmosphere establishes identity. Intelligence establishes value.'
      );
    });
  });

  describe('7. Explicitly Rejected Shell Patterns', () => {
    it('codifies all 9 prohibited shell anti-patterns', () => {
      assert.equal(EXPLICITLY_REJECTED_SHELL_PATTERNS.length, 9);
      assert.ok(EXPLICITLY_REJECTED_SHELL_PATTERNS.includes('Marketing landing page disguised as GX'));
      assert.ok(EXPLICITLY_REJECTED_SHELL_PATTERNS.includes('Long-form report container with infinite scroll'));
      assert.ok(EXPLICITLY_REJECTED_SHELL_PATTERNS.includes('Full Workspace clone with disabled upgrade buttons'));
      assert.ok(EXPLICITLY_REJECTED_SHELL_PATTERNS.includes('Persistent upgrade/signup banners crowding the screen'));
    });
  });

  describe('8. Shell Invariant Validators', () => {
    it('passes compliant shell structure with all 5 layers', () => {
      const result = validateGuestShellStructure({
        layersPresent: [
          'BRAND_IDENTITY',
          'ORIENTATION_CONTEXT',
          'INTELLIGENCE_CANVAS',
          'CONTEXTUAL_ACTIONS',
          'QUIET_PRODUCT_SIGNATURE',
        ],
        maintainsContextPreservation: true,
        usesInfiniteReportContainer: false,
        hasStableStateTransitions: true,
      });

      assert.equal(result.valid, true);
      assert.equal(result.violation, undefined);
    });

    it('rejects shell missing required layers', () => {
      const result = validateGuestShellStructure({
        layersPresent: ['BRAND_IDENTITY', 'INTELLIGENCE_CANVAS'],
        maintainsContextPreservation: true,
        usesInfiniteReportContainer: false,
        hasStableStateTransitions: true,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Missing required shell layer(s)'));
    });

    it('rejects shell using infinite report container', () => {
      const result = validateGuestShellStructure({
        layersPresent: [
          'BRAND_IDENTITY',
          'ORIENTATION_CONTEXT',
          'INTELLIGENCE_CANVAS',
          'CONTEXTUAL_ACTIONS',
          'QUIET_PRODUCT_SIGNATURE',
        ],
        maintainsContextPreservation: true,
        usesInfiniteReportContainer: true,
        hasStableStateTransitions: true,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Infinite-scroll report containers are strictly prohibited'));
    });

    it('validates investigation context preservation mechanics', () => {
      const validFlow = validateInvestigationContextPreservation({
        triggerAction: 'click Understand why →',
        opensContextualSurface: true,
        locksBackgroundCanvas: true,
        preservesOriginContext: true,
        restoresFocusOnDismiss: true,
      });
      assert.equal(validFlow.valid, true);

      const invalidFlow = validateInvestigationContextPreservation({
        triggerAction: 'click Understand why →',
        opensContextualSurface: false,
        locksBackgroundCanvas: false,
        preservesOriginContext: false,
        restoresFocusOnDismiss: false,
      });
      assert.equal(invalidFlow.valid, false);
      assert.ok(invalidFlow.violation?.includes('Investigation must open in a contextual surface'));
    });
  });
});
