import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PREMIUM_SURFACE_PALETTE,
  PREMIUM_BORDER_TOKENS,
  PREMIUM_SHADOWS,
  PREMIUM_SEMANTIC_PALETTE,
  PREMIUM_BUTTON_TOKENS,
  DESIGN_TOKENS,
} from '../../styles/tokens.ts';
import {
  WORKSPACE_CERTIFIED_INVARIANTS,
  WORKSPACE_TRUTH_MATRIX,
} from './contracts/workspace-redesign-truth-contract.ts';

describe('WX-1017: Workspace Premium Surface Shading & Color Authority', () => {
  describe('1. Neutral Surface & Tonal Depth Tokens', () => {
    it('defines the warm-neutral foundation surface palette', () => {
      assert.equal(PREMIUM_SURFACE_PALETTE.canvas, '#F7F7F5');
      assert.equal(PREMIUM_SURFACE_PALETTE.primary, '#FFFFFF');
      assert.equal(PREMIUM_SURFACE_PALETTE.secondary, '#FAFAF8');
      assert.equal(PREMIUM_SURFACE_PALETTE.elevated, '#FCFCFA');
      assert.equal(PREMIUM_SURFACE_PALETTE.metadata, '#F4F4F1');
      assert.equal(PREMIUM_SURFACE_PALETTE.rowHover, '#F7F8F6');
      assert.equal(PREMIUM_SURFACE_PALETTE.rowActive, '#F1F6F3');
    });

    it('exports premium surface palette in DESIGN_TOKENS', () => {
      assert.equal(DESIGN_TOKENS.premium.surfaces.canvas, '#F7F7F5');
      assert.equal(DESIGN_TOKENS.premium.surfaces.primary, '#FFFFFF');
      assert.equal(DESIGN_TOKENS.premium.surfaces.secondary, '#FAFAF8');
      assert.equal(DESIGN_TOKENS.premium.surfaces.elevated, '#FCFCFA');
      assert.equal(DESIGN_TOKENS.premium.surfaces.metadata, '#F4F4F1');
    });

    it('defines restrained warm-neutral border tokens', () => {
      assert.equal(PREMIUM_BORDER_TOKENS.default, '#E7E7E3');
      assert.equal(PREMIUM_BORDER_TOKENS.strong, '#DCDCD7');
      assert.equal(PREMIUM_BORDER_TOKENS.divider, '#EEEEEB');
      assert.equal(PREMIUM_BORDER_TOKENS.card, '#E1E1DC');
      assert.equal(PREMIUM_BORDER_TOKENS.brief, '#E2E2DE');
      assert.equal(PREMIUM_BORDER_TOKENS.metadata, '#E2E2DD');
      assert.equal(PREMIUM_BORDER_TOKENS.cardHover, '#DADAD5');
    });

    it('defines micro-elevation shadow tokens', () => {
      assert.equal(PREMIUM_SHADOWS.xs, '0 1px 2px rgba(16, 24, 20, 0.035)');
      assert.equal(PREMIUM_SHADOWS.sm, '0 2px 8px rgba(16, 24, 20, 0.045)');
      assert.equal(PREMIUM_SHADOWS.md, '0 4px 16px rgba(16, 24, 20, 0.055)');
      assert.equal(PREMIUM_SHADOWS.button, '0 2px 5px rgba(16, 24, 20, 0.10)');
    });
  });

  describe('2. Frozen Semantic Palette Tokens', () => {
    it('defines authoritative Stable / Good / Secure tokens', () => {
      const stable = PREMIUM_SEMANTIC_PALETTE.stable;
      assert.equal(stable.primary, '#178A68');
      assert.equal(stable.bg, '#EAF7F2');
      assert.equal(stable.border, '#B9E5D6');
      assert.equal(stable.accent, '#1F9D73');
    });

    it('defines authoritative Attention / Warning / Review tokens', () => {
      const attention = PREMIUM_SEMANTIC_PALETTE.attention;
      assert.equal(attention.primary, '#B86F18');
      assert.equal(attention.bg, '#FFF4E3');
      assert.equal(attention.border, '#F0D3A5');
      assert.equal(attention.accent, '#C98224');
    });

    it('defines authoritative High Risk tokens', () => {
      const high = PREMIUM_SEMANTIC_PALETTE.high;
      assert.equal(high.primary, '#C24D57');
      assert.equal(high.bg, '#FFF0F1');
      assert.equal(high.border, '#F0C3C7');
    });

    it('defines authoritative Critical Risk tokens', () => {
      const critical = PREMIUM_SEMANTIC_PALETTE.critical;
      assert.equal(critical.primary, '#A93442');
      assert.equal(critical.bg, '#FDEBEC');
      assert.equal(critical.border, '#E9B3B9');
      assert.equal(critical.accent, '#C94B58');
    });

    it('defines authoritative Informational / Active tokens', () => {
      const info = PREMIUM_SEMANTIC_PALETTE.informational;
      assert.equal(info.primary, '#3568C8');
      assert.equal(info.bg, '#EEF4FF');
      assert.equal(info.border, '#C8D8F6');
    });

    it('defines authoritative Neutral Metadata tokens', () => {
      const neutral = PREMIUM_SEMANTIC_PALETTE.neutralMetadata;
      assert.equal(neutral.text, '#5F625F');
      assert.equal(neutral.bg, '#F4F4F1');
      assert.equal(neutral.border, '#E2E2DD');
    });
  });

  describe('3. Primary Dark CTA Authority (Understand Now Button)', () => {
    it('defines refined primary dark button tokens', () => {
      assert.equal(PREMIUM_BUTTON_TOKENS.bg, '#171816');
      assert.equal(PREMIUM_BUTTON_TOKENS.text, '#FFFFFF');
      assert.equal(PREMIUM_BUTTON_TOKENS.border, '#171816');
      assert.equal(PREMIUM_BUTTON_TOKENS.shadow, '0 2px 5px rgba(16, 24, 20, 0.10)');
      assert.equal(PREMIUM_BUTTON_TOKENS.hoverBg, '#252724');
      assert.equal(PREMIUM_BUTTON_TOKENS.pressedBg, '#0F100F');
      assert.equal(PREMIUM_BUTTON_TOKENS.transition, '150ms ease-out');
    });
  });

  describe('4. Truth Contract & Invariant Certification', () => {
    it('contains WX-1017 in WORKSPACE_TRUTH_MATRIX', () => {
      const truthEntry = WORKSPACE_TRUTH_MATRIX.find(
        (t) => t.capability.includes('WX-1017') || t.capability.includes('Surface Shading')
      );
      assert.ok(truthEntry);
      assert.equal(truthEntry?.status, 'PRODUCTION_READY');
    });

    it('certifies surface hierarchy and color authority invariants', () => {
      assert.ok(
        WORKSPACE_CERTIFIED_INVARIANTS.SURFACE_COMMUNICATES_HIERARCHY.includes('#F7F7F5')
      );
      assert.ok(
        WORKSPACE_CERTIFIED_INVARIANTS.SURFACE_COMMUNICATES_HIERARCHY.includes('#FFFFFF')
      );
      assert.ok(
        WORKSPACE_CERTIFIED_INVARIANTS.COLOR_COMMUNICATES_MEANING.includes('#178A68')
      );
      assert.ok(
        WORKSPACE_CERTIFIED_INVARIANTS.COLOR_COMMUNICATES_MEANING.includes('#A93442')
      );
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_RAINBOW_CARDS);
      assert.ok(
        WORKSPACE_CERTIFIED_INVARIANTS.CALM_RESTRAINED_SURFACES.includes('#E7E7E3')
      );
      assert.ok(
        WORKSPACE_CERTIFIED_INVARIANTS.PRIMARY_DARK_CTA_AUTHORITY.includes('#171816')
      );
    });
  });

  describe('5. Architectural & Visual Principles Compliance', () => {
    it('ensures no conflicting semantic status mappings exist', () => {
      const palette = PREMIUM_SEMANTIC_PALETTE;

      // Unique primary colors for unique meanings
      const primaryColors = [
        palette.stable.primary,
        palette.attention.primary,
        palette.high.primary,
        palette.critical.primary,
        palette.informational.primary,
      ];
      const uniqueColors = new Set(primaryColors);
      assert.equal(uniqueColors.size, primaryColors.length);
    });

    it('verifies contrast-friendly light-mode backgrounds have distinct luminance from white', () => {
      assert.notEqual(PREMIUM_SURFACE_PALETTE.canvas, '#FFFFFF');
      assert.notEqual(PREMIUM_SURFACE_PALETTE.secondary, '#FFFFFF');
      assert.notEqual(PREMIUM_SURFACE_PALETTE.metadata, '#FFFFFF');
      assert.equal(PREMIUM_SURFACE_PALETTE.primary, '#FFFFFF');
    });
  });
});
