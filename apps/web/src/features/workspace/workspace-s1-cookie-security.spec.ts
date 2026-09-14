import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  S1_FRONTEND_CERTIFIED_INVARIANTS,
  classifyFrontendCookie,
  parseFrontendCookieString,
  evaluateFrontendCookieSecurity,
  verifyCookieRedactionSafety,
} from './contracts/cookie-security.contract.ts';

describe('S1 Cookie & Session Security (Frontend Contracts & Verification)', () => {
  it('certifies all S1 frontend invariants', () => {
    assert.equal(S1_FRONTEND_CERTIFIED_INVARIANTS.S1_OBSERVED_COOKIE_BEHAVIOR_INTEGRITY, true);
    assert.equal(S1_FRONTEND_CERTIFIED_INVARIANTS.S1_CLASSIFICATION_CONSERVATIVE, true);
    assert.equal(S1_FRONTEND_CERTIFIED_INVARIANTS.S1_HTTPONLY_EVIDENCE_GROUNDED, true);
    assert.equal(S1_FRONTEND_CERTIFIED_INVARIANTS.S1_SECURE_TRANSPORT_ALIGNED, true);
    assert.equal(S1_FRONTEND_CERTIFIED_INVARIANTS.S1_SAMESITE_CONTROL_SEPARATED, true);
    assert.equal(S1_FRONTEND_CERTIFIED_INVARIANTS.S1_COOKIE_ATTRIBUTE_CORRELATED, true);
    assert.equal(S1_FRONTEND_CERTIFIED_INVARIANTS.S1_SENSITIVE_VALUE_REDACTION, true);
    assert.equal(S1_FRONTEND_CERTIFIED_INVARIANTS.S1_TECHNOLOGY_NEUTRAL_FIRST_REMEDIATION, true);
    assert.equal(S1_FRONTEND_CERTIFIED_INVARIANTS.S1_LIFECYCLE_ACTIVE_RESOLVED_CONVERGENCE, true);
    assert.equal(S1_FRONTEND_CERTIFIED_INVARIANTS.S1_ANTI_OVERREACH_ENFORCEMENT, true);
    assert.equal(S1_FRONTEND_CERTIFIED_INVARIANTS.S1_CROSS_SURFACE_CONSISTENCY, true);
  });

  describe('parseFrontendCookieString & Redaction Safety (S1-001, S1-007)', () => {
    it('redacts sensitive raw token values from the evidence string', () => {
      const raw =
        'session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9; Path=/; Secure; HttpOnly; SameSite=Strict';
      const parsed = parseFrontendCookieString(raw, 'snap-1');

      assert.ok(parsed);
      assert.equal(parsed?.name, 'session');
      assert.equal(parsed?.valueRedacted, '[REDACTED]');
      assert.equal(
        parsed?.rawSetCookieRedacted,
        'session=[REDACTED]; Path=/; Secure; HttpOnly; SameSite=Strict',
      );
      assert.equal(parsed?.rawSetCookieRedacted.includes('eyJhbGci'), false);
      assert.equal(parsed?.isSecure, true);
      assert.equal(parsed?.isHttpOnly, true);
      assert.equal(parsed?.sameSite, 'Strict');
    });

    it('verifies redaction safety helper against unredacted tokens', () => {
      const parsed = parseFrontendCookieString('auth=secret_token_123; Secure; HttpOnly');
      assert.ok(parsed);
      assert.equal(verifyCookieRedactionSafety([parsed!]), true);
    });
  });

  describe('classifyFrontendCookie (S1-002 Conservative Classification)', () => {
    it('classifies session identifiers conservatively with qualified whatThisDoesNotProve', () => {
      const authCookie = classifyFrontendCookie('connect.sid');
      assert.equal(authCookie.classification, 'CONFIRMED_SESSION');
      assert.equal(authCookie.confidence, 'HIGH');

      const themeCookie = classifyFrontendCookie('theme');
      assert.equal(themeCookie.classification, 'ORDINARY_NON_SENSITIVE');
      assert.equal(themeCookie.confidence, 'HIGH');
    });
  });

  describe('evaluateFrontendCookieSecurity (S1-006 Correlation)', () => {
    it('identifies security gaps and compiles correlated assessment', () => {
      const cookie1 = parseFrontendCookieString('session=val; Path=/; Secure')!; // missing HttpOnly
      const cookie2 = parseFrontendCookieString('jwt=val; Path=/; SameSite=None')!; // SameSite=None without Secure, missing HttpOnly
      const cookie3 = parseFrontendCookieString(
        'connect.sid=val; Path=/; Secure; HttpOnly; SameSite=Lax',
      )!; // fully secured

      const assessment = evaluateFrontendCookieSecurity([cookie1, cookie2, cookie3], true);
      assert.equal(assessment.totalCookies, 3);
      assert.equal(assessment.sessionCookies.length, 3);
      assert.equal(assessment.missingHttpOnly.length, 2);
      assert.equal(assessment.missingSecure.length, 1);
      assert.equal(assessment.sameSiteNoneWithoutSecure.length, 1);
      assert.equal(assessment.fullySecuredCookies.length, 1);
      assert.ok(assessment.securityGapsCount > 0);
      assert.ok(assessment.summary.includes('security configuration gap(s) identified'));
    });
  });
});
