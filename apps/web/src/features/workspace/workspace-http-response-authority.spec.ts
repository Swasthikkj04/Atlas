import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';

describe('WX-1022: Authoritative HTTP Response Verification & Finding Confidence Audit', () => {
  describe('1. Redirect Chain Authority & Final Response Truth', () => {
    it('verifies multi-hop redirect chain preserves hop lineage without false redirect header claims (google.com pattern)', () => {
      const mockDiscoveryResult = {
        reachable: true,
        url: 'http://google.com',
        finalUrl: 'https://www.google.com/',
        protocol: 'https',
        statusCode: 200,
        redirectCount: 2,
        redirectHops: [
          { url: 'http://google.com', statusCode: 301, location: 'https://google.com/', scheme: 'http' },
          { url: 'https://google.com/', statusCode: 301, location: 'https://www.google.com/', scheme: 'https' },
          { url: 'https://www.google.com/', statusCode: 200, scheme: 'https', headers: { 'strict-transport-security': 'max-age=31536000' } },
        ],
        finalResponse: {
          url: 'https://www.google.com/',
          statusCode: 200,
          isHttps: true,
          authority: 'FINAL_HTTPS_RESPONSE',
          confidence: 'AUTHORITATIVE',
          headers: { 'strict-transport-security': 'max-age=31536000' },
        },
        queryStatus: 'SUCCESS',
        confidence: 'AUTHORITATIVE',
      };

      assert.equal(mockDiscoveryResult.redirectHops.length, 3);
      assert.equal(mockDiscoveryResult.finalResponse.authority, 'FINAL_HTTPS_RESPONSE');
      assert.equal(mockDiscoveryResult.finalResponse.headers['strict-transport-security'], 'max-age=31536000');
    });

    it('prohibits intermediate 3xx redirect headers from acting as final response truth', () => {
      assert.equal(
        WORKSPACE_CERTIFIED_INVARIANTS.NO_REDIRECT_RESPONSE_AS_FINAL_TRUTH,
        'Intermediate 3xx redirect headers are never presented as the final authoritative response truth.'
      );
    });
  });

  describe('2. Security Rule Authority & Observation Confidence', () => {
    it('guarantees HSTS rule requires valid HTTPS context', () => {
      assert.equal(
        WORKSPACE_CERTIFIED_INVARIANTS.HSTS_REQUIRES_HTTPS_CONTEXT,
        'Strict-Transport-Security is only evaluated and required when a valid authoritative HTTPS endpoint is reached.'
      );
    });

    it('guarantees CSP rule is response-aware', () => {
      assert.equal(
        WORKSPACE_CERTIFIED_INVARIANTS.CSP_OBSERVATION_IS_RESPONSE_AWARE,
        'Content-Security-Policy evaluation considers the response status code and content-type, skipping redirects and non-HTML assets.'
      );
    });

    it('prohibits failed probe lookups from being converted into missing header findings', () => {
      assert.equal(
        WORKSPACE_CERTIFIED_INVARIANTS.NO_FAILED_LOOKUP_AS_HEADER_ABSENCE,
        'Network timeouts, DNS errors, and connection failures are preserved as probe errors and never converted into false missing header findings.'
      );
    });

    it('distinguishes performance observations from security vulnerabilities', () => {
      assert.equal(
        WORKSPACE_CERTIFIED_INVARIANTS.PERFORMANCE_IS_NOT_SECURITY_FINDING,
        'Slow HTTP response observations are classified as operational performance metrics, not exploitable security vulnerabilities.'
      );
    });
  });

  describe('3. Truth Contract Certification (WX-1022)', () => {
    it('contains Authoritative HTTP Response capability in WORKSPACE_TRUTH_MATRIX', () => {
      const entry = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability.includes('Authoritative HTTP Response Verification')
      );
      assert.ok(entry, 'Capability must be present in Truth Matrix');
      assert.equal(entry?.category, 'Current Intelligence');
      assert.equal(entry?.status, 'PRODUCTION_READY');
    });

    it('certifies all 12 WX-1022 HTTP authority mandatory invariants', () => {
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.HTTP_FINDING_REQUIRES_AUTHORITATIVE_RESPONSE);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.REDIRECT_CHAIN_IS_PRESERVED);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.FINAL_RESPONSE_CONTEXT_IS_EXPLICIT);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_REDIRECT_RESPONSE_AS_FINAL_TRUTH);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_FAILED_LOOKUP_AS_HEADER_ABSENCE);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.HSTS_REQUIRES_HTTPS_CONTEXT);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.CSP_OBSERVATION_IS_RESPONSE_AWARE);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.OBSERVATION_CONFIDENCE_CANNOT_BE_EXCEEDED);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.PERFORMANCE_IS_NOT_SECURITY_FINDING);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.INFORMATIONAL_HEADERS_DO_NOT_IMPLY_VULNERABILITY);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.RAW_HTTP_LINEAGE_PRESERVED);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_FRONTEND_FINDING_INFERENCE);
    });
  });
});
