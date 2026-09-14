import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  S05_TICKET_ID,
  S05_PHASE,
  S05_PRIORITY,
  S05_TYPE,
  S05_STATUS,
  S05_PRINCIPLES,
  S05_INVARIANTS,
  S05_ATTACK_MATRIX,
  S05_CERTIFICATION_STATEMENT,
  S05_SECONDARY_GATE,
  validateCspString,
  buildCspHeaderString,
  CANONICAL_WEB_CSP_HEADER,
  auditBrowserStorage,
  evaluateWindowFraming,
  validateAuthCookieAttributes,
  verifyS05Certification,
  FORBIDDEN_STORAGE_KEYS,
} from './s-05-transport-browser.contract.ts';

describe('S-05 — Security Headers, Transport & Browser Boundary Web Contract Spec', () => {
  describe('1. Contract Identity & Frozen Principles', () => {
    it('verifies S-05 metadata constants', () => {
      assert.equal(S05_TICKET_ID, 'S-05');
      assert.equal(S05_PHASE, 'Production Security Hardening');
      assert.equal(S05_PRIORITY, 'P0 — BLOCKING');
      assert.ok(S05_TYPE.includes('Browser Security / Transport'));
      assert.equal(S05_STATUS, 'CERTIFIED_TRANSPORT_BROWSER_SECURITY');
    });

    it('verifies all 4 frozen principles', () => {
      assert.ok(S05_PRINCIPLES.S05_P01_PERIMETER_CONTINUITY.includes('security perimeter'));
      assert.ok(S05_PRINCIPLES.S05_P02_NO_COMPENSATING_ASSUMPTION.includes('No layer is permitted to assume'));
      assert.ok(S05_PRINCIPLES.S05_P03_GX_WX_BROWSER_ISOLATION.includes('Same browser != same security context'));
      assert.ok(S05_PRINCIPLES.S05_P04_DIRECT_API_INDEPENDENCE.includes('Direct API requests'));
    });

    it('verifies all 12 P0 security invariants', () => {
      const keys = Object.keys(S05_INVARIANTS);
      assert.equal(keys.length, 12);
      assert.ok(S05_INVARIANTS['S05-I01'].description.includes('HTTPS'));
      assert.ok(S05_INVARIANTS['S05-I02'].description.includes('Strict-Transport-Security'));
      assert.ok(S05_INVARIANTS['S05-I03'].description.includes('Content Security Policy'));
      assert.ok(S05_INVARIANTS['S05-I04'].description.includes('Clickjacking Protection'));
      assert.ok(S05_INVARIANTS['S05-I05'].description.includes('nosniff'));
      assert.ok(S05_INVARIANTS['S05-I06'].description.includes('strict-origin-when-cross-origin'));
      assert.ok(S05_INVARIANTS['S05-I07'].description.includes('Permissions Policy'));
      assert.ok(S05_INVARIANTS['S05-I08'].description.includes('CORS Allowlist'));
      assert.ok(S05_INVARIANTS['S05-I09'].description.includes('Credential Boundary'));
      assert.ok(S05_INVARIANTS['S05-I10'].description.includes('CSRF Boundary'));
      assert.ok(S05_INVARIANTS['S05-I11'].description.includes('Cache Isolation'));
      assert.ok(S05_INVARIANTS['S05-I12'].description.includes('Credential Leakage Prevention'));
    });
  });

  describe('2. 40-Vector Attack Matrix Coverage (S05-01 to S05-40)', () => {
    it('contains all 40 required attack vectors', () => {
      assert.equal(S05_ATTACK_MATRIX.length, 40);

      const vectorIds = new Set(S05_ATTACK_MATRIX.map((v) => v.id));
      for (let i = 1; i <= 40; i++) {
        const expectedId = `S05-${i < 10 ? '0' + i : i}`;
        assert.ok(vectorIds.has(expectedId));
      }
    });

    it('validates each vector has valid expected status and decision', () => {
      for (const vector of S05_ATTACK_MATRIX) {
        assert.match(vector.id, /^S05-\d{2}$/);
        assert.ok(vector.description.length > 5);
        assert.ok([200, 400, 403, 413, 415, 500].includes(vector.expectedStatus));
        assert.ok(vector.expectedDecision.length > 0);
      }
    });
  });

  describe('3. Content Security Policy (CSP) Evaluator', () => {
    it('verifies canonical web CSP policy', () => {
      const res = validateCspString(CANONICAL_WEB_CSP_HEADER);
      assert.equal(res.valid, true);
      assert.equal(res.violations.length, 0);
    });

    it('detects unsafe-eval in production CSP (S05-07)', () => {
      const dangerousCsp = "default-src 'self'; script-src 'self' 'unsafe-eval';";
      const res = validateCspString(dangerousCsp);
      assert.equal(res.valid, false);
      assert.ok(res.violations.some((v) => v.includes('unsafe-eval')));
    });

    it('detects wildcard script-src (S05-06, S05-08)', () => {
      const wildcardCsp = "default-src 'self'; script-src *;";
      const res = validateCspString(wildcardCsp);
      assert.equal(res.valid, false);
      assert.ok(res.violations.some((v) => v.includes('wildcard')));
    });

    it('detects missing frame-ancestors directive (S05-04, S05-I04)', () => {
      const weakCsp = "default-src 'self'; script-src 'self'; object-src 'none';";
      const res = validateCspString(weakCsp);
      assert.equal(res.valid, false);
      assert.ok(res.violations.some((v) => v.includes('frame-ancestors')));
    });
  });

  describe('4. Browser Storage Security Audit (S05-I09)', () => {
    it('accepts clean client storage (theme, UI settings)', () => {
      const storage = {
        'nebula-theme': 'dark',
        'nebula-motion': 'standard',
        'sidebar-expanded': 'true',
      };
      const res = auditBrowserStorage(storage);
      assert.equal(res.secure, true);
      assert.equal(res.prohibitedKeys.length, 0);
    });

    it('flags prohibited credentials stored in browser storage (S05-15, S05-16)', () => {
      const contaminatedStorage = {
        'nebula-theme': 'dark',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'secret_token_value',
      };
      const res = auditBrowserStorage(contaminatedStorage);
      assert.equal(res.secure, false);
      assert.ok(res.prohibitedKeys.includes('jwt'));
      assert.ok(res.prohibitedKeys.includes('refresh_token'));
    });
  });

  describe('5. Framing & Clickjacking Evaluator (S05-04, S05-25)', () => {
    it('validates top-level window execution is safe', () => {
      const res = evaluateWindowFraming({ isTopLevel: true });
      assert.equal(res.isEmbedded, false);
      assert.equal(res.isAllowed, true);
      assert.equal(res.policy, 'DENY');
    });

    it('blocks arbitrary third-party iframe embedding (S05-04)', () => {
      const res = evaluateWindowFraming({ isTopLevel: false, ancestorOrigins: ['https://attacker.com'] });
      assert.equal(res.isEmbedded, true);
      assert.equal(res.isAllowed, false);
    });

    it('blocks GX iframe attempting WX embedding (S05-25)', () => {
      const res = evaluateWindowFraming(
        { isTopLevel: false, ancestorOrigins: ['https://guest.argonion.com'] },
        ['https://argonion.com'],
      );
      assert.equal(res.isEmbedded, true);
      assert.equal(res.isAllowed, false);
    });
  });

  describe('6. Cookie Security Attribute Evaluator (S05-36, S05-37, S05-38)', () => {
    it('validates compliant production authentication cookie', () => {
      const res = validateAuthCookieAttributes({
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
      assert.equal(res.valid, true);
      assert.equal(res.violations.length, 0);
    });

    it('detects missing Secure attribute (S05-36)', () => {
      const res = validateAuthCookieAttributes({
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
      });
      assert.equal(res.valid, false);
      assert.ok(res.violations.some((v) => v.includes('Secure')));
    });

    it('detects missing HttpOnly attribute (S05-37)', () => {
      const res = validateAuthCookieAttributes({
        secure: true,
        httpOnly: false,
        sameSite: 'lax',
      });
      assert.equal(res.valid, false);
      assert.ok(res.violations.some((v) => v.includes('HttpOnly')));
    });

    it('detects unsafe SameSite=None attribute (S05-38)', () => {
      const res = validateAuthCookieAttributes({
        secure: true,
        httpOnly: true,
        sameSite: 'none',
      });
      assert.equal(res.valid, false);
      assert.ok(res.violations.some((v) => v.includes('SameSite')));
    });
  });

  describe('7. Certification Gate Verification', () => {
    it('verifies exact canonical certification statement', () => {
      assert.equal(verifyS05Certification(S05_CERTIFICATION_STATEMENT), true);
      assert.equal(verifyS05Certification(S05_SECONDARY_GATE), true);
    });

    it('rejects invalid or blank statements', () => {
      assert.equal(verifyS05Certification(''), false);
      assert.equal(verifyS05Certification('Unrelated text'), false);
    });
  });
});
