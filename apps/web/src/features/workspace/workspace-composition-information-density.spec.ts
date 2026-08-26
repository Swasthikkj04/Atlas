import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';

describe('WX-914: Workspace Composition & Information Density Correction', () => {
  describe('1. Truth Matrix & Certified Invariants', () => {
    it('verifies Workspace Composition & Information Density capability in Truth Matrix', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Workspace Composition & Information Density'
      );
      assert.ok(cap, 'Capability must exist in Truth Matrix');
      assert.equal(cap?.category, 'Current Intelligence');
      assert.equal(cap?.status, 'PRODUCTION_READY');
      assert.equal(
        cap?.frontendComponent,
        'CurrentIntelligence (ExecutiveBrief + CompactInfrastructureOverview Grid)'
      );
      assert.equal(
        cap?.targetSurface,
        'Top-Level 2-Column Overview Composition'
      );
    });

    it('verifies all WX-914 certified invariants are defined', () => {
      assert.ok(
        'COMPACT_OVERVIEW_COMPOSITION' in WORKSPACE_CERTIFIED_INVARIANTS,
        'Expected COMPACT_OVERVIEW_COMPOSITION invariant'
      );
      assert.ok(
        'TWO_COLUMN_DESKTOP_INTELLIGENCE_GRID' in WORKSPACE_CERTIFIED_INVARIANTS,
        'Expected TWO_COLUMN_DESKTOP_INTELLIGENCE_GRID invariant'
      );
    });
  });

  describe('2. Canonical Information Architecture Hierarchy', () => {
    it('enforces the intelligence-first hierarchy without report document sprawl', () => {
      assert.equal(
        WORKSPACE_CERTIFIED_INVARIANTS.COMPACT_OVERVIEW_COMPOSITION,
        'Overview establishes the 2-column top composition with Executive Brief and Compact Infrastructure Overview side-by-side on desktop, followed by dominant Primary Story.'
      );
      assert.equal(
        WORKSPACE_CERTIFIED_INVARIANTS.TWO_COLUMN_DESKTOP_INTELLIGENCE_GRID,
        'On desktop breakpoints, Executive Brief and Compact Infrastructure Overview share the top-level grid without giant single-column card stretching.'
      );
    });
  });
});
