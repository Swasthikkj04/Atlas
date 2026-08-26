import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DESIGN_TOKENS } from './tokens.ts';

describe('WX-002: Design Token Foundation Contracts', () => {
  describe('1. Surface Hierarchy Tokens', () => {
    it('defines authoritative light and dark surfaces matching WX-000', () => {
      assert.equal(DESIGN_TOKENS.surfaces.app.light, '#FAFAFA');
      assert.equal(DESIGN_TOKENS.surfaces.app.dark, '#0F1115');

      assert.equal(DESIGN_TOKENS.surfaces.understanding.light, '#FFFFFF');
      assert.equal(DESIGN_TOKENS.surfaces.understanding.dark, '#14171C');

      assert.equal(DESIGN_TOKENS.surfaces.matters.light, '#F7F8FA');
      assert.equal(DESIGN_TOKENS.surfaces.matters.dark, '#181C22');

      assert.equal(DESIGN_TOKENS.surfaces.infrastructure.light, '#F8F9FA');
      assert.equal(DESIGN_TOKENS.surfaces.infrastructure.dark, '#15191F');

      assert.equal(DESIGN_TOKENS.surfaces.evidence.light, '#F3F5F7');
      assert.equal(DESIGN_TOKENS.surfaces.evidence.dark, '#1C2128');

      assert.equal(DESIGN_TOKENS.surfaces.preserve.light, '#EEF2F5');
      assert.equal(DESIGN_TOKENS.surfaces.preserve.dark, '#20262E');
    });

    it('defines CSS variable bindings for all surface tokens', () => {
      assert.equal(DESIGN_TOKENS.surfaces.app.var, 'var(--surface-app)');
      assert.equal(DESIGN_TOKENS.surfaces.understanding.var, 'var(--surface-understanding)');
      assert.equal(DESIGN_TOKENS.surfaces.matters.var, 'var(--surface-matters)');
      assert.equal(DESIGN_TOKENS.surfaces.infrastructure.var, 'var(--surface-infrastructure)');
      assert.equal(DESIGN_TOKENS.surfaces.evidence.var, 'var(--surface-evidence)');
      assert.equal(DESIGN_TOKENS.surfaces.preserve.var, 'var(--surface-preserve)');
    });
  });

  describe('2. Text & Border Hierarchy Tokens', () => {
    it('defines primary and secondary text tokens matching WX-000', () => {
      assert.equal(DESIGN_TOKENS.text.foreground.light, '#111110');
      assert.equal(DESIGN_TOKENS.text.foreground.dark, '#F0F0EE');

      assert.equal(DESIGN_TOKENS.text.mutedForeground.light, '#6C6C72');
      assert.equal(DESIGN_TOKENS.text.mutedForeground.dark, '#88887E');
    });

    it('defines hairline, strong, and focus border tokens', () => {
      assert.equal(DESIGN_TOKENS.borders.hairline.light, 'rgba(0, 0, 0, 0.07)');
      assert.equal(DESIGN_TOKENS.borders.hairline.dark, 'rgba(255, 255, 255, 0.09)');

      assert.equal(DESIGN_TOKENS.borders.strong.light, 'rgba(0, 0, 0, 0.12)');
      assert.equal(DESIGN_TOKENS.borders.strong.dark, 'rgba(255, 255, 255, 0.15)');

      assert.equal(DESIGN_TOKENS.borders.ring.light, 'rgba(26, 86, 219, 0.45)');
      assert.equal(DESIGN_TOKENS.borders.ring.dark, 'rgba(96, 165, 250, 0.55)');
    });
  });

  describe('3. Six-Tier Semantic Severity Tokens', () => {
    const levels = ['critical', 'high', 'medium', 'low', 'informational', 'success'] as const;

    it('defines text, bg, and border for all 6 severity tiers', () => {
      for (const level of levels) {
        const token = DESIGN_TOKENS.severity[level];
        assert.ok(token, `Severity token ${level} must exist`);
        assert.ok(token.text.light && token.text.dark && token.text.var);
        assert.ok(token.bg.light && token.bg.dark && token.bg.var);
        assert.ok(token.border.light && token.border.dark && token.border.var);
      }
    });

    it('guarantees restrained background opacities (8% light / 12% dark)', () => {
      assert.ok(DESIGN_TOKENS.severity.critical.bg.light.includes('0.08'));
      assert.ok(DESIGN_TOKENS.severity.critical.bg.dark.includes('0.12'));
      assert.ok(DESIGN_TOKENS.severity.high.bg.light.includes('0.08'));
      assert.ok(DESIGN_TOKENS.severity.high.bg.dark.includes('0.12'));
    });
  });

  describe('4. Spatial Scale Tokens (Base-8 / Base-4 Rhythm)', () => {
    it('defines unbroken 10-step spatial rhythm from 2px to 96px', () => {
      assert.equal(DESIGN_TOKENS.spacing['3xs'].px, 2);
      assert.equal(DESIGN_TOKENS.spacing['2xs'].px, 4);
      assert.equal(DESIGN_TOKENS.spacing.xs.px, 8);
      assert.equal(DESIGN_TOKENS.spacing.sm.px, 12);
      assert.equal(DESIGN_TOKENS.spacing.md.px, 16);
      assert.equal(DESIGN_TOKENS.spacing.lg.px, 24);
      assert.equal(DESIGN_TOKENS.spacing.xl.px, 32);
      assert.equal(DESIGN_TOKENS.spacing['2xl'].px, 48);
      assert.equal(DESIGN_TOKENS.spacing['3xl'].px, 72);
      assert.equal(DESIGN_TOKENS.spacing['4xl'].px, 96);
    });
  });

  describe('5. Shape, Elevation & Layout Boundary Tokens', () => {
    it('defines radius scale from 2px (xs) to 9999px (pill)', () => {
      assert.equal(DESIGN_TOKENS.radius.xs.px, 2);
      assert.equal(DESIGN_TOKENS.radius.sm.px, 4);
      assert.equal(DESIGN_TOKENS.radius.md.px, 8);
      assert.equal(DESIGN_TOKENS.radius.lg.px, 12);
      assert.equal(DESIGN_TOKENS.radius.xl.px, 16);
      assert.equal(DESIGN_TOKENS.radius['2xl'].px, 24);
      assert.equal(DESIGN_TOKENS.radius.pill.px, 9999);
    });

    it('defines layout boundaries matching frozen measures', () => {
      assert.equal(DESIGN_TOKENS.layoutBoundaries.form.px, 420);
      assert.equal(DESIGN_TOKENS.layoutBoundaries.dialog.px, 640);
      assert.ok(
        DESIGN_TOKENS.layoutBoundaries.reading.px >= 720 &&
          DESIGN_TOKENS.layoutBoundaries.reading.px <= 800,
        'Reading measure must stay between 720px and 800px'
      );
      assert.equal(DESIGN_TOKENS.layoutBoundaries.workspace.px, 1440);
    });

    it('defines canonical z-index scale layers', () => {
      assert.equal(DESIGN_TOKENS.zIndex.base, 0);
      assert.equal(DESIGN_TOKENS.zIndex.card, 1);
      assert.equal(DESIGN_TOKENS.zIndex.sticky, 50);
      assert.equal(DESIGN_TOKENS.zIndex.header, 100);
      assert.equal(DESIGN_TOKENS.zIndex.dropdown, 200);
      assert.equal(DESIGN_TOKENS.zIndex.backdrop, 900);
      assert.equal(DESIGN_TOKENS.zIndex.modal, 1000);
      assert.equal(DESIGN_TOKENS.zIndex.popover, 1050);
      assert.equal(DESIGN_TOKENS.zIndex.tooltip, 1100);
      assert.equal(DESIGN_TOKENS.zIndex.toast, 1200);
    });

    it('defines motion duration scale including the 520ms Nebula Pause', () => {
      assert.equal(DESIGN_TOKENS.motion.durations.instant, '100ms');
      assert.equal(DESIGN_TOKENS.motion.durations.fast, '180ms');
      assert.equal(DESIGN_TOKENS.motion.durations.normal, '250ms');
      assert.equal(DESIGN_TOKENS.motion.durations.slow, '380ms');
      assert.equal(DESIGN_TOKENS.motion.durations.deliberate, '580ms');
      assert.equal(DESIGN_TOKENS.motion.durations.pause, '520ms');
    });
  });
});
