import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  S4_CONTENT_SECURITY_INVARIANTS,
  evaluateClientContentSecurity,
} from './contracts/content-security.contract.ts';

describe('S4 — Content Security & Asset Integrity Intelligence (Frontend Contract)', () => {
  it('certifies all S4 content security frozen invariants', () => {
    assert.equal(S4_CONTENT_SECURITY_INVARIANTS.S4_CSP_POLICY_ANALYSIS_INTEGRITY, true);
    assert.equal(S4_CONTENT_SECURITY_INVARIANTS.S4_PERMISSIVE_DIRECTIVE_DETECTION, true);
    assert.equal(S4_CONTENT_SECURITY_INVARIANTS.S4_CROSS_ORIGIN_ISOLATION_INTEGRITY, true);
    assert.equal(S4_CONTENT_SECURITY_INVARIANTS.S4_PERMISSIONS_POLICY_HYGIENE_INTEGRITY, true);
    assert.equal(S4_CONTENT_SECURITY_INVARIANTS.S4_ANTI_OVERREACH_ENFORCEMENT, true);
  });

  it('correctly parses strict CSP, COOP/COEP isolation and Permissions-Policy on compliant domain', () => {
    const headers = {
      'content-security-policy': "default-src 'self'; script-src 'self' https://trusted.cdn.com; object-src 'none'",
      'cross-origin-opener-policy': 'same-origin',
      'cross-origin-embedder-policy': 'require-corp',
      'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    };

    const assessment = evaluateClientContentSecurity('hardened.app.corp', headers);
    assert.equal(assessment.overallScore, 100);
    assert.equal(assessment.isCompliant, true);
    assert.equal(assessment.csp.present, true);
    assert.equal(assessment.csp.isStrict, true);
    assert.equal(assessment.csp.hasUnsafeInline, false);
    assert.equal(assessment.crossOriginIsolation.isIsolated, true);
    assert.equal(assessment.permissionsPolicy.isConfigured, true);
  });

  it('flags permissive CSP with unsafe-inline and unsafe-eval tokens', () => {
    const headers = {
      'content-security-policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
    };

    const assessment = evaluateClientContentSecurity('legacy.app.internal', headers);
    assert.equal(assessment.csp.present, true);
    assert.equal(assessment.csp.hasUnsafeInline, true);
    assert.equal(assessment.csp.hasUnsafeEval, true);
    assert.equal(assessment.csp.isStrict, false);
    assert.deepEqual(assessment.csp.permissiveTokens, ["'unsafe-inline'", "'unsafe-eval'"]);
    assert.ok(assessment.overallScore < 80);
    assert.equal(assessment.isCompliant, false);
  });

  it('handles missing security headers safely with structured fallbacks', () => {
    const assessment = evaluateClientContentSecurity('unhardened.xyz', {});
    assert.equal(assessment.csp.present, false);
    assert.equal(assessment.crossOriginIsolation.isIsolated, false);
    assert.equal(assessment.permissionsPolicy.isConfigured, false);
    assert.equal(assessment.isCompliant, false);
    assert.equal(assessment.overallScore, 40);
  });
});
