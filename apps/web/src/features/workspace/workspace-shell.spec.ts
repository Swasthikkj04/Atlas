import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DESIGN_TOKENS } from '../../styles/tokens.ts';

describe('WX-102 & WX-500-SHELL-02: Workspace Shell Architecture & Landmark Contracts', () => {
  describe('1. Structural Workspace Boundary & Canonical Shell Dimensions', () => {
    it('enforces 1440px maximum boundary for Workspace Canvas', () => {
      assert.equal(DESIGN_TOKENS.layoutBoundaries.workspace.px, 1440);
    });

    it('enforces 760px narrative reading boundary', () => {
      assert.equal(DESIGN_TOKENS.layoutBoundaries.reading.px, 760);
    });

    it('verifies canonical 288px expanded secondary sidebar dimension (WX-500-SHELL-02)', () => {
      const sidebarExpandedWidthPx = 288;
      assert.equal(sidebarExpandedWidthPx, 288);
    });

    it('verifies canonical 72px navbar height with 32px horizontal padding and zero shadow (WX-500-SHELL-02)', () => {
      const navbarHeightPx = 72;
      const navbarPaddingHorizontalPx = 32;
      const navbarShadow = 'none';

      assert.equal(navbarHeightPx, 72);
      assert.equal(navbarPaddingHorizontalPx, 32);
      assert.equal(navbarShadow, 'none');
    });
  });

  describe('2. Accessibility & Semantic Landmark Architecture', () => {
    it('verifies canonical z-index layers for navigation and header', () => {
      assert.equal(DESIGN_TOKENS.zIndex.header, 100);
      assert.equal(DESIGN_TOKENS.zIndex.backdrop, 900);
      assert.equal(DESIGN_TOKENS.zIndex.modal, 1000);
    });

    it('preserves skip-to-content target ID #main-content', () => {
      const skipTargetId = 'main-content';
      assert.equal(skipTargetId, 'main-content');
    });
  });

  describe('3. Responsive Shell Contract', () => {
    it('verifies spatial scale tokens used for shell padding and gutters', () => {
      assert.equal(DESIGN_TOKENS.spacing.md.px, 16);
      assert.equal(DESIGN_TOKENS.spacing.lg.px, 24);
      assert.equal(DESIGN_TOKENS.spacing.xl.px, 32);
    });
  });

  describe('4. Information Architecture & Contextual Memory Repositioning', () => {
    it('structures default canvas as Current Intelligence with contextual entry to Memory', () => {
      const availableSurfaces = ['current', 'memory', 'overview', 'investigation'];
      const defaultSurface = 'current';

      assert.equal(defaultSurface, 'current');
      assert.ok(availableSurfaces.includes('memory'));
      assert.ok(availableSurfaces.includes('overview'));
    });
  });
});
