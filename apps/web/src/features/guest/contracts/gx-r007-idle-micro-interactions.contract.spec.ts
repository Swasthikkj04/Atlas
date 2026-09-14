import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_R007_TICKET_ID,
  GX_R007_PHASE,
  GX_R007_STATUS,
  GX_R007_MOTION_PHILOSOPHY,
  GX_R007_FROZEN_PRINCIPLE,
  GX_R007_NEBULA_PAUSE_MS,
  GX_R007_CERTIFICATION_GATE_STATEMENT,
  MOTION_HIERARCHY_TIERS,
  SURFACE_INTERACTION_RULES,
  CURSOR_LANGUAGE_MATRIX,
  REDUCED_MOTION_INVARIANTS,
  TOUCH_ERGONOMICS_INVARIANTS,
  EXPLICITLY_REJECTED_MOTION_PATTERNS,
  validateMotionRules,
  verifyGXR007CertificationGate,
} from './gx-r007-idle-micro-interactions.contract.ts';

describe('GX-R007: Idle Micro-Interactions & Motion Language Contract', () => {
  describe('1. Canonical Metadata & Principles', () => {
    it('defines ticket metadata and status', () => {
      assert.equal(GX_R007_TICKET_ID, 'GX-R007');
      assert.equal(GX_R007_PHASE, 'Guest Experience Redesign');
      assert.equal(GX_R007_STATUS, 'FROZEN_MOTION_LANGUAGE');
    });

    it('embodies the canonical motion philosophy and frozen principle', () => {
      assert.equal(GX_R007_MOTION_PHILOSOPHY, 'INPUT → RESPOND → ACKNOWLEDGE → SETTLE');
      assert.equal(
        GX_R007_FROZEN_PRINCIPLE,
        'Motion should communicate state, not decorate the interface.'
      );
      assert.equal(GX_R007_NEBULA_PAUSE_MS, 520);
    });

    it('passes the 🔒 GX-R007 Certification Gate with canonical statement', () => {
      const statement =
        'Every idle-state interaction has a defined motion or no-motion rule across Level 1 (120–180ms), Level 2 (220–360ms), and Level 3 (~520ms Nebula Pause), strictly prohibiting perpetual animation, bouncy physics, and layout shift.';
      const result = verifyGXR007CertificationGate(statement);

      assert.equal(result.passed, true);
      assert.equal(result.canonicalStatement, GX_R007_CERTIFICATION_GATE_STATEMENT);
      assert.equal(result.similarityRatio, 1);
    });

    it('rejects an invalid statement proposing perpetual bouncy animations', () => {
      const statement = 'Infinite particle animations with bouncy spring physics and floating widgets everywhere.';
      const result = verifyGXR007CertificationGate(statement);

      assert.equal(result.passed, false);
      assert.ok(result.similarityRatio < 0.4);
    });
  });

  describe('2. Three-Tier Motion Hierarchy', () => {
    it('defines exactly 3 motion hierarchy tiers', () => {
      assert.equal(MOTION_HIERARCHY_TIERS.length, 3);
      const levels = MOTION_HIERARCHY_TIERS.map((t) => t.level);
      assert.deepEqual(levels, [
        'LEVEL_1_MICRO',
        'LEVEL_2_INTERFACE',
        'LEVEL_3_NEBULA_TRANSITION',
      ]);
    });

    it('calibrates Level 1 Micro motion within 120–180ms', () => {
      const micro = MOTION_HIERARCHY_TIERS.find((t) => t.level === 'LEVEL_1_MICRO')!;
      assert.equal(micro.minDurationMs, 120);
      assert.equal(micro.maxDurationMs, 180);
      assert.ok(micro.useCases.includes('hover states'));
      assert.ok(micro.useCases.includes('focus ring appearance'));
    });

    it('calibrates Level 2 Interface motion within 220–360ms', () => {
      const iface = MOTION_HIERARCHY_TIERS.find((t) => t.level === 'LEVEL_2_INTERFACE')!;
      assert.equal(iface.minDurationMs, 220);
      assert.equal(iface.maxDurationMs, 360);
      assert.ok(iface.useCases.includes('validation message appearance'));
      assert.ok(iface.useCases.includes('shell state changes'));
    });

    it('calibrates Level 3 Nebula Transition to ~520ms', () => {
      const pause = MOTION_HIERARCHY_TIERS.find((t) => t.level === 'LEVEL_3_NEBULA_TRANSITION')!;
      assert.ok(pause.minDurationMs <= 520 && pause.maxDurationMs >= 520);
      assert.ok(pause.useCases.some((u) => u.includes('understanding')));
    });
  });

  describe('3. Surface Interaction Rules', () => {
    it('defines rules for all 6 core interactive surfaces', () => {
      assert.equal(SURFACE_INTERACTION_RULES.length, 6);
      const surfaces = SURFACE_INTERACTION_RULES.map((s) => s.surface);
      assert.deepEqual(surfaces, [
        'Domain Input Focus',
        'Typing Behavior',
        'Valid State Transition',
        'Primary CTA (Understand →)',
        'Sample Domain Shortcuts',
        'Inline Validation Error',
      ]);
    });

    it('enforces spatial stability and prohibits decorative clutter per surface', () => {
      SURFACE_INTERACTION_RULES.forEach((rule) => {
        assert.ok(rule.allowedMotion.length > 0);
        assert.ok(rule.prohibitedMotion.length >= 3);
        assert.ok(rule.spatialGuarantee.length > 0);
      });
    });
  });

  describe('4. Cursor & Pointer Language Matrix', () => {
    it('defines expected cursors for all interactive elements', () => {
      assert.equal(CURSOR_LANGUAGE_MATRIX.length, 6);
      const ctaEnabled = CURSOR_LANGUAGE_MATRIX.find((c) => c.element.includes('Enabled'))!;
      assert.equal(ctaEnabled.expectedCursor, 'pointer');

      const ctaDisabled = CURSOR_LANGUAGE_MATRIX.find((c) => c.element.includes('Disabled'))!;
      assert.equal(ctaDisabled.expectedCursor, 'not-allowed');

      const input = CURSOR_LANGUAGE_MATRIX.find((c) => c.element.includes('Input'))!;
      assert.equal(input.expectedCursor, 'text');

      const staticText = CURSOR_LANGUAGE_MATRIX.find((c) => c.element.includes('Static'))!;
      assert.equal(staticText.expectedCursor, 'default');
    });
  });

  describe('5. Accessibility, Reduced Motion & Touch Invariants', () => {
    it('codifies all 5 reduced motion invariants', () => {
      assert.equal(REDUCED_MOTION_INVARIANTS.length, 5);
      assert.ok(REDUCED_MOTION_INVARIANTS.some((i) => i.includes('prefers-reduced-motion')));
      assert.ok(REDUCED_MOTION_INVARIANTS.some((i) => i.includes('Nebula Pause')));
    });

    it('codifies all 4 touch ergonomics invariants', () => {
      assert.equal(TOUCH_ERGONOMICS_INVARIANTS.length, 4);
      assert.ok(TOUCH_ERGONOMICS_INVARIANTS.some((i) => i.includes('44px')));
      assert.ok(TOUCH_ERGONOMICS_INVARIANTS.some((i) => i.includes('Zero hover-dependent')));
    });
  });

  describe('6. 14 Explicitly Rejected Motion Anti-Patterns', () => {
    it('enumerates and strictly rejects all 14 motion anti-patterns', () => {
      assert.equal(EXPLICITLY_REJECTED_MOTION_PATTERNS.length, 14);
      assert.ok(EXPLICITLY_REJECTED_MOTION_PATTERNS.includes('Particle animations or floating starfield dust'));
      assert.ok(EXPLICITLY_REJECTED_MOTION_PATTERNS.includes('Perpetual constellation / node drift animations'));
      assert.ok(EXPLICITLY_REJECTED_MOTION_PATTERNS.includes('Floating or levitating cards'));
      assert.ok(EXPLICITLY_REJECTED_MOTION_PATTERNS.includes('Pulsing or breathing input borders'));
      assert.ok(EXPLICITLY_REJECTED_MOTION_PATTERNS.includes('AI sparkle / shimmer effects'));
      assert.ok(EXPLICITLY_REJECTED_MOTION_PATTERNS.includes('Excessive spring physics with overshoot/bounce'));
      assert.ok(EXPLICITLY_REJECTED_MOTION_PATTERNS.includes('Shake-to-error vibration animations'));
    });
  });

  describe('7. Motion Rules Validator Engine', () => {
    it('passes compliant motion configuration', () => {
      const result = validateMotionRules({
        maxMicroDurationMs: 160,
        maxInterfaceDurationMs: 300,
        nebulaPauseMs: 520,
        hasPerpetualMotion: false,
        hasSpringOvershoot: false,
        supportsReducedMotion: true,
        preservesSpatialStability: true,
        avoidsCelebratoryValidation: true,
      });

      assert.equal(result.valid, true);
      assert.equal(result.violation, undefined);
    });

    it('rejects perpetual background animations', () => {
      const result = validateMotionRules({
        maxMicroDurationMs: 160,
        maxInterfaceDurationMs: 300,
        nebulaPauseMs: 520,
        hasPerpetualMotion: true,
        hasSpringOvershoot: false,
        supportsReducedMotion: true,
        preservesSpatialStability: true,
        avoidsCelebratoryValidation: true,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Perpetual background'));
    });

    it('rejects spring overshoot and excessive duration', () => {
      const result = validateMotionRules({
        maxMicroDurationMs: 250,
        maxInterfaceDurationMs: 300,
        nebulaPauseMs: 520,
        hasPerpetualMotion: false,
        hasSpringOvershoot: true,
        supportsReducedMotion: true,
        preservesSpatialStability: true,
        avoidsCelebratoryValidation: true,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Spring overshoot'));
    });
  });
});
