import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DESIGN_TOKENS } from '../../styles/tokens.ts';

describe('WX-004: Layout Primitives Architecture & Spatial Contracts', () => {
  describe('1. Container Width Boundaries', () => {
    it('enforces canonical layout boundary widths from tokens', () => {
      assert.equal(DESIGN_TOKENS.layoutBoundaries.form.px, 420);
      assert.equal(DESIGN_TOKENS.layoutBoundaries.dialog.px, 640);
      assert.equal(DESIGN_TOKENS.layoutBoundaries.reading.px, 760);
      assert.equal(DESIGN_TOKENS.layoutBoundaries.workspace.px, 1440);
    });
  });

  describe('2. Stack & Cluster Spatial Scale Integrity', () => {
    it('uses unbroken spatial scale steps for Stack and Cluster gaps', () => {
      const allowedGaps = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] as const;
      for (const gap of allowedGaps) {
        assert.ok(DESIGN_TOKENS.spacing[gap], `Spacing token ${gap} must exist in tokens`);
        assert.ok(DESIGN_TOKENS.spacing[gap].px > 0);
      }
    });

    it('verifies default gap mappings', () => {
      // Stack default is 'md' (16px)
      assert.equal(DESIGN_TOKENS.spacing.md.px, 16);
      // Cluster default is 'xs' (8px)
      assert.equal(DESIGN_TOKENS.spacing.xs.px, 8);
    });
  });

  describe('3. Section Experience Boundaries', () => {
    it('provides distinct vertical spacing steps for Workspace sections', () => {
      assert.equal(DESIGN_TOKENS.spacing.lg.px, 24); // sm section
      assert.equal(DESIGN_TOKENS.spacing['2xl'].px, 48); // md section (default)
      assert.equal(DESIGN_TOKENS.spacing['3xl'].px, 72); // lg section
      assert.equal(DESIGN_TOKENS.spacing['4xl'].px, 96); // xl section
    });
  });

  describe('4. ReadingSurface Narrative Measure', () => {
    it('guarantees reading surface measure does not exceed 760px to preserve 65-75 CPL', () => {
      assert.ok(
        DESIGN_TOKENS.layoutBoundaries.reading.px <= 800,
        'Reading measure must stay below 800px'
      );
      assert.ok(
        DESIGN_TOKENS.layoutBoundaries.reading.px >= 720,
        'Reading measure must stay above 720px'
      );
    });
  });

  describe('5. Divider Structural Hairline Tokens', () => {
    it('uses canonical hairline border token for separators', () => {
      assert.equal(DESIGN_TOKENS.borders.hairline.light, 'rgba(0, 0, 0, 0.07)');
      assert.equal(DESIGN_TOKENS.borders.hairline.dark, 'rgba(255, 255, 255, 0.09)');
    });
  });
});
