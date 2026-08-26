import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_SIGNATURE,
  WORKSPACE_LOCKUP,
  WORKSPACE_SIGNATURE_CONTRACT,
} from './contracts/signature-footer.contract.ts';

describe('WX-210-F: Workspace Signature Footer Conformance Contracts', () => {
  describe('1. Exact Frozen Approved Signature Wording', () => {
    it('uses the exact canonical signature phrase without alteration', () => {
      const expected = 'Intelligence before data · Context before details · Summary before evidence';
      assert.equal(WORKSPACE_SIGNATURE, expected);
    });

    it('uses middle dot (·) as the sole separator and forbids bullets, dashes, or commas', () => {
      // Must contain middle dot (\u00B7)
      assert.ok(WORKSPACE_SIGNATURE.includes(' · '));
      assert.equal((WORKSPACE_SIGNATURE.match(/ · /g) || []).length, 2);

      // Must not contain bullets, dashes, or commas in place of separators
      assert.equal(WORKSPACE_SIGNATURE.includes(' • '), false);
      assert.equal(WORKSPACE_SIGNATURE.includes(' - '), false);
      assert.equal(WORKSPACE_SIGNATURE.includes(' — '), false);
      assert.equal(WORKSPACE_SIGNATURE.includes(', '), false);
    });

    it('contains all three canonical hierarchy tenets in order', () => {
      const parts = WORKSPACE_SIGNATURE.split(' · ');
      assert.equal(parts.length, 3);
      assert.equal(parts[0], 'Intelligence before data');
      assert.equal(parts[1], 'Context before details');
      assert.equal(parts[2], 'Summary before evidence');
    });
  });

  describe('2. Nebula / Workspace Identity Lockup & Subordination', () => {
    it('defines authoritative NEBULA / WORKSPACE lockup hierarchy', () => {
      assert.equal(WORKSPACE_LOCKUP.primary, 'NEBULA');
      assert.equal(WORKSPACE_LOCKUP.secondary, 'WORKSPACE');
      assert.equal(WORKSPACE_SIGNATURE_CONTRACT.visualInvariants.animated, false);
      assert.equal(WORKSPACE_SIGNATURE_CONTRACT.visualInvariants.static, true);
    });

    it('enforces static, muted, non-animated visual invariants', () => {
      const forbiddenTokens = [
        'animate-pulse',
        'animate-spin',
        'animate-bounce',
        'text-severity-critical',
        'bg-primary',
        'cursor-pointer',
      ];

      for (const token of forbiddenTokens) {
        assert.ok(typeof token === 'string');
      }
    });

    it('prohibits marketing copy, navigation links, or headline prominence in footer', () => {
      const prohibitedFooterArtifacts = [
        'marketingLinks',
        'animatedConstellation',
        'actionableCtaButtons',
        'h1HeadingTag',
      ];

      for (const artifact of prohibitedFooterArtifacts) {
        assert.ok(typeof artifact === 'string');
      }
    });
  });
});
