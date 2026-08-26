import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DESIGN_TOKENS } from '../../styles/tokens.ts';

describe('WX-003: Typography Hierarchy & Font Foundation Contracts', () => {
  it('defines the three canonical font families without foreign additions', () => {
    assert.ok(DESIGN_TOKENS.typography.fonts.sans.includes('DM Sans'));
    assert.ok(DESIGN_TOKENS.typography.fonts.display.includes('Newsreader'));
    assert.ok(DESIGN_TOKENS.typography.fonts.mono.includes('JetBrains Mono'));
  });

  it('verifies display scale fluid clamp expressions', () => {
    assert.ok(DESIGN_TOKENS.typography.scale.display2xl.size.startsWith('clamp('));
    assert.ok(DESIGN_TOKENS.typography.scale.displayXl.size.startsWith('clamp('));
  });

  it('verifies 4-tier heading scale', () => {
    assert.equal(DESIGN_TOKENS.typography.scale.heading1.px, 36);
    assert.equal(DESIGN_TOKENS.typography.scale.heading2.px, 24);
    assert.equal(DESIGN_TOKENS.typography.scale.heading3.px, 20);
    assert.equal(DESIGN_TOKENS.typography.scale.heading4.px, 16);
  });

  it('verifies technical typography and metadata scale', () => {
    assert.equal(DESIGN_TOKENS.typography.scale.monoCode.px, 13);
    assert.equal(DESIGN_TOKENS.typography.scale.monoSm.px, 12);
  });
});
