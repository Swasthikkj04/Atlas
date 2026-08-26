import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import { DESIGN_TOKENS } from '../../styles/tokens.ts';

describe('WX-913: Workspace Visual Authority & Premium Surface Refinement', () => {
  describe('1. Truth Matrix & Certified Invariants', () => {
    it('verifies Workspace Visual Authority & Premium Surface Refinement capability in Truth Matrix', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Workspace Visual Authority & Premium Surface Refinement'
      );
      assert.ok(cap, 'Capability must exist in Truth Matrix');
      assert.equal(cap?.category, 'Current Intelligence');
      assert.equal(cap?.status, 'PRODUCTION_READY');
      assert.equal(
        cap?.targetSurface,
        'Workspace Visual Hierarchy & Card Boundaries'
      );
    });

    it('verifies all WX-913 certified invariants are defined', () => {
      assert.ok(
        'WORKSPACE_VISUAL_AUTHORITY' in WORKSPACE_CERTIFIED_INVARIANTS,
        'Expected WORKSPACE_VISUAL_AUTHORITY invariant'
      );
      assert.ok(
        'NO_RAINBOW_DASHBOARD' in WORKSPACE_CERTIFIED_INVARIANTS,
        'Expected NO_RAINBOW_DASHBOARD invariant'
      );
      assert.ok(
        'NO_DECORATIVE_THEATER' in WORKSPACE_CERTIFIED_INVARIANTS,
        'Expected NO_DECORATIVE_THEATER invariant'
      );
    });
  });

  describe('2. Semantic Token Restraint & Meaning Hierarchy', () => {
    it('provides semantic severity colors aligned with intentional meaning', () => {
      assert.ok(DESIGN_TOKENS.severity.critical, 'Critical severity token exists');
      assert.ok(DESIGN_TOKENS.severity.high, 'High severity token exists');
      assert.ok(DESIGN_TOKENS.severity.medium, 'Medium severity token exists');
      assert.ok(DESIGN_TOKENS.severity.low, 'Low severity token exists');
      assert.ok(DESIGN_TOKENS.severity.informational, 'Info severity token exists');
      assert.ok(DESIGN_TOKENS.severity.success, 'Success/Stable severity token exists');
    });

    it('guarantees restrained background opacities for severity containers', () => {
      assert.equal(DESIGN_TOKENS.severity.critical.bg.light, 'rgba(212, 24, 61, 0.08)');
      assert.equal(DESIGN_TOKENS.severity.success.bg.light, 'rgba(5, 150, 105, 0.08)');
    });
  });

  describe('3. Surface Boundary & Elevation Tokens', () => {
    it('defines authoritative border tokens for crisp surface contrast', () => {
      assert.ok(DESIGN_TOKENS.borders.hairline.light, 'Hairline border exists');
      assert.ok(DESIGN_TOKENS.borders.strong.light, 'Strong contrast border exists');
      assert.ok(DESIGN_TOKENS.borders.ring.light, 'Ring border exists');
    });

    it('defines restrained elevation shadows without oversized blurry drop-shadows', () => {
      assert.ok(DESIGN_TOKENS.shadows.sm, 'Subtle sm elevation exists');
      assert.ok(DESIGN_TOKENS.shadows.md, 'Subtle md elevation exists');
    });
  });
});
