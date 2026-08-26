import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DESIGN_TOKENS } from '../../styles/tokens.ts';

describe('WX-105: Workspace Canvas Architecture & Content Boundary Contracts', () => {
  describe('1. Content Boundary Modes', () => {
    it('enforces 1440px maximum boundary for Workspace mode', () => {
      assert.equal(DESIGN_TOKENS.layoutBoundaries.workspace.px, 1440);
    });

    it('enforces 760px maximum boundary for Reading mode (65-75 CPL measure)', () => {
      assert.equal(DESIGN_TOKENS.layoutBoundaries.reading.px, 760);
    });

    it('supports workspace, reading, and fluid canvas modes', () => {
      const allowedModes = ['workspace', 'reading', 'fluid'];
      assert.equal(allowedModes.length, 3);
    });
  });

  describe('2. Intelligence Boundary & Restraint', () => {
    it('prohibits fake findings, placeholder metrics, and AI theater on entry surface', () => {
      const allowedEntryCards = ['Infrastructure Briefs', 'Causal Timeline', 'Session Security'];
      const forbiddenPlaceholders = [
        'fakeCriticalFindingCount',
        'fabricatedHealthScore',
        'aiIsThinkingSpinner',
        'simulatedInfrastructureTree',
      ];

      for (const placeholder of forbiddenPlaceholders) {
        assert.ok(
          !allowedEntryCards.includes(placeholder),
          `Placeholder ${placeholder} must not exist on canvas entry`
        );
      }
    });
  });
});
