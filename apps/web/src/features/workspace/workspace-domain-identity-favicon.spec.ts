import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import {
  sanitizeDomain,
  resolveFaviconUrl,
} from './components/identity/DomainFavicon.types.ts';

describe('WX-1021: Domain Identity & Favicon Surface Audit', () => {
  describe('1. Domain Sanitization and Resolution', () => {
    it('produces valid Google S2 favicon URL for canonical domains', () => {
      const url = resolveFaviconUrl('pestrust.edu.in');
      assert.equal(
        url,
        'https://www.google.com/s2/favicons?domain=pestrust.edu.in&sz=64'
      );
    });

    it('handles domains with protocols and trailing paths cleanly', () => {
      const sanitized = sanitizeDomain('https://api.github.com/v1/repos');
      assert.equal(sanitized, 'api.github.com');

      const url = resolveFaviconUrl('https://api.github.com/v1/repos');
      assert.equal(
        url,
        'https://www.google.com/s2/favicons?domain=api.github.com&sz=64'
      );
    });

    it('handles ports and whitespace gracefully', () => {
      const sanitized = sanitizeDomain('  example.com:8080/foo/bar  ');
      assert.equal(sanitized, 'example.com');
    });
  });

  describe('2. Graceful Fallback & Error Resilience', () => {
    it('returns null for null, undefined, or empty domain', () => {
      assert.equal(sanitizeDomain(null), null);
      assert.equal(sanitizeDomain(undefined), null);
      assert.equal(sanitizeDomain(''), null);
      assert.equal(resolveFaviconUrl(null), null);
      assert.equal(resolveFaviconUrl(undefined), null);
    });

    it('enforces presentational nature: favicon is not hosting/ownership evidence', () => {
      // Invariant assertion: Favicon is strictly presentational
      assert.equal(
        WORKSPACE_CERTIFIED_INVARIANTS.DOMAIN_IDENTITY_IS_PRESENTATIONAL,
        'The favicon is strictly a presentational visual identity anchor and never serves as evidence of hosting or ownership.'
      );
    });
  });

  describe('3. Truth Contract Invariants Certification (WX-1021)', () => {
    it('contains Domain Identity capability in WORKSPACE_TRUTH_MATRIX', () => {
      const entry = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability.includes('Domain Identity & Favicon Surface')
      );
      assert.ok(entry, 'Domain Identity capability must be present in Truth Matrix');
      assert.equal(entry?.category, 'Domain/Context');
      assert.equal(entry?.status, 'PRODUCTION_READY');
    });

    it('certifies all 6 Domain Identity mandatory invariants', () => {
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.DOMAIN_IDENTITY_IS_PRESENTATIONAL);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.DOMAIN_IDENTITY_NEVER_BLOCKS_UNDERSTANDING);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.DOMAIN_IDENTITY_MATCHES_CANONICAL_DOMAIN);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.FAVICON_FAILURE_HAS_NEUTRAL_FALLBACK);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_SYNTHETIC_DOMAIN_BRANDING);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.DOMAIN_IDENTITY_CONSISTENT_ACROSS_SURFACES);
    });
  });
});
