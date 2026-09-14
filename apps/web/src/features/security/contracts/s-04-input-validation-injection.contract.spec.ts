import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  S04_TICKET_ID,
  S04_PHASE,
  S04_PRIORITY,
  S04_TYPE,
  S04_STATUS,
  S04_PRINCIPLES,
  S04_INVARIANTS,
  S04_SECURITY_MATRIX,
  S04_LIMITS,
  S04_CERTIFICATION_STATEMENT,
  evaluateRequestIntegrity,
  evaluatePayloadSecurity,
  evaluateDomainInput,
  evaluateQueryOperators,
  neutralizeXssAndLogInjection,
  verifyS04Certification,
} from './s-04-input-validation-injection.contract.ts';

describe('S-04 — Input Validation, Injection & Request Integrity Web Contract Spec', () => {
  describe('1. Contract Identity & Frozen Principles', () => {
    it('verifies S-04 metadata constants', () => {
      assert.equal(S04_TICKET_ID, 'S-04');
      assert.equal(S04_PHASE, 'Production Security Hardening');
      assert.equal(S04_PRIORITY, 'P0 — BLOCKING');
      assert.ok(S04_TYPE.includes('Input Validation / Injection'));
      assert.equal(S04_STATUS, 'CERTIFIED_INPUT_VALIDATION_INJECTION');
    });

    it('verifies all 4 frozen principles', () => {
      assert.ok(S04_PRINCIPLES.S04_P01_DEFAULT_UNTRUSTED);
      assert.ok(S04_PRINCIPLES.S04_P02_REQUEST_SECURITY_PIPELINE);
      assert.ok(S04_PRINCIPLES.S04_P03_FAIL_CLOSED_DISCIPLINE);
      assert.ok(S04_PRINCIPLES.S04_P04_INFORMATION_MINIMIZATION);
    });

    it('verifies all 10 P0 security invariants', () => {
      const keys = Object.keys(S04_INVARIANTS);
      assert.equal(keys.length, 10);
      assert.ok(S04_INVARIANTS.S04_I01_REJECT_SECURITY_FIELDS.includes('userId'));
      assert.ok(S04_INVARIANTS.S04_I02_NO_MASS_ASSIGNMENT.includes('allowlists'));
      assert.ok(S04_INVARIANTS.S04_I03_STRICT_TYPE_VALIDATION.includes('explicit type contract'));
      assert.ok(S04_INVARIANTS.S04_I04_REQUEST_SIZE_BOUNDARIES.includes('explicit limits'));
      assert.ok(S04_INVARIANTS.S04_I05_DOMAIN_INPUT_NORMALIZATION.includes('Domain intent'));
      assert.ok(S04_INVARIANTS.S04_I06_INJECTION_RESISTANCE.includes('executable syntax'));
      assert.ok(S04_INVARIANTS.S04_I07_SAFE_ERROR_RESPONSES.includes('stack traces'));
      assert.ok(S04_INVARIANTS.S04_I08_CANONICAL_ERROR_CONTRACT.includes('error shape'));
      assert.ok(S04_INVARIANTS.S04_I09_QUERY_OPERATOR_INJECTION_PREVENTION.includes('ORM operators'));
      assert.ok(S04_INVARIANTS.S04_I10_REDOS_PROTECTION.includes('regular expressions'));
    });
  });

  describe('2. 48-Vector Attack Matrix Coverage (S04-01 to S04-48)', () => {
    it('contains all 48 required attack vectors', () => {
      assert.equal(S04_SECURITY_MATRIX.length, 48);

      const vectorIds = new Set(S04_SECURITY_MATRIX.map((v) => v.id));
      for (let i = 1; i <= 48; i++) {
        const expectedId = `S04-${i < 10 ? '0' + i : i}`;
        assert.ok(vectorIds.has(expectedId as any), `Missing vector ${expectedId}`);
      }
    });

    it('validates each vector has valid expected status and decision', () => {
      for (const item of S04_SECURITY_MATRIX) {
        assert.ok([200, 400, 413, 415, 422].includes(item.expectedStatus));
        assert.ok(item.expectedDecision.length > 0);
        assert.ok(item.attack.length > 0);
      }
    });
  });

  describe('3. Request Integrity & Transport Validation Evaluator', () => {
    it('accepts valid application/json payload with proper bounds', () => {
      const res = evaluateRequestIntegrity({
        method: 'POST',
        contentType: 'application/json; charset=utf-8',
        contentLength: 512,
        headers: { 'user-agent': 'Nebula-Client/1.0' },
      });
      assert.equal(res.valid, true);
      assert.equal(res.httpStatus, 200);
      assert.equal(res.decision, 'INTEGRITY_VERIFIED');
    });

    it('rejects unsupported content-type (S04-23)', () => {
      const res = evaluateRequestIntegrity({
        method: 'POST',
        contentType: 'text/plain',
        contentLength: 50,
      });
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 415);
      assert.equal(res.decision, 'UNSUPPORTED_MEDIA_TYPE');
    });

    it('rejects oversized request payload exceeding 1MB (S04-24)', () => {
      const res = evaluateRequestIntegrity({
        method: 'POST',
        contentType: 'application/json',
        contentLength: S04_LIMITS.MAX_BODY_SIZE_BYTES + 1024,
      });
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 413);
      assert.equal(res.decision, 'PAYLOAD_TOO_LARGE');
    });

    it('rejects CRLF injection in request headers (S04-11, S04-12, S04-44)', () => {
      const res = evaluateRequestIntegrity({
        method: 'POST',
        contentType: 'application/json',
        headers: {
          'x-custom-header': 'safe-val\r\nInjected-Header: evil.com',
        },
      });
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.decision, 'CRLF_HEADER_BLOCKED');
    });
  });

  describe('4. Payload Security, Schema & Forbidden Field Evaluator', () => {
    it('rejects empty payload when required (S04-21)', () => {
      const res = evaluatePayloadSecurity({}, { required: true });
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.decision, 'EMPTY_BODY_REJECTED');
    });

    it('rejects injected userId field in payload (S04-31)', () => {
      const res = evaluatePayloadSecurity({
        domainName: 'target.com',
        userId: 'attacker-uuid',
      });
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.decision, 'INJECT_USER_ID_REJECTED');
    });

    it('rejects injected elevated role / admin field (S04-35)', () => {
      const res = evaluatePayloadSecurity({
        name: 'Workspace 1',
        role: 'SUPER_ADMIN',
      });
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.decision, 'INJECT_ROLE_REJECTED');
    });

    it('rejects injected permissions, plane, and tenantId (S04-32, S04-33, S04-36, S04-37)', () => {
      const res1 = evaluatePayloadSecurity({ tenantId: 'tenant-999' });
      assert.equal(res1.valid, false);
      assert.equal(res1.httpStatus, 400);

      const res2 = evaluatePayloadSecurity({ plane: 'AX' });
      assert.equal(res2.valid, false);
      assert.equal(res2.httpStatus, 400);

      const res3 = evaluatePayloadSecurity({ permissions: ['*'] });
      assert.equal(res3.valid, false);
      assert.equal(res3.httpStatus, 400);
    });

    it('rejects prototype pollution payload (S04-15, S04-47)', () => {
      const res = evaluatePayloadSecurity({
        __proto__: { isAdmin: true },
        domainName: 'test.com',
      });
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.decision, 'PROTOTYPE_POLLUTION_REJECTED');
    });

    it('rejects excessive nesting depth (S04-16, S04-27)', () => {
      let nested: any = { value: 'deep' };
      for (let i = 0; i < 15; i++) {
        nested = { child: nested };
      }
      const res = evaluatePayloadSecurity(nested);
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.decision, 'EXCESSIVE_NESTING_REJECTED');
    });

    it('rejects mass-assignment and unwhitelisted properties (S04-19, S04-20, S04-25)', () => {
      const res = evaluatePayloadSecurity(
        { domain: 'example.com', unapprovedField: 'injected' },
        { allowedKeys: ['domain', 'description'] }
      );
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.decision, 'UNKNOWN_PROPERTIES_REJECTED');
    });

    it('rejects SQL injection payload in string fields (S04-01, S04-02, S04-39)', () => {
      const res = evaluatePayloadSecurity({
        filter: "admin' UNION ALL SELECT * FROM users--",
      });
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.decision, 'SQL_INJECTION_REJECTED');
    });

    it('rejects shell command injection payload (S04-04, S04-05, S04-41)', () => {
      const res = evaluatePayloadSecurity({
        query: 'test; rm -rf / ;',
      });
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.decision, 'SHELL_INJECTION_REJECTED');
    });

    it('rejects path traversal payload (S04-06, S04-42)', () => {
      const res = evaluatePayloadSecurity({
        file: '../../../../etc/passwd',
      });
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.decision, 'PATH_TRAVERSAL_REJECTED');
    });

    it('rejects template injection payload (S04-13, S04-45)', () => {
      const res = evaluatePayloadSecurity({
        template: '{{7*7}} ${process.env.SECRET}',
      });
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.decision, 'TEMPLATE_INJECTION_REJECTED');
    });
  });

  describe('5. Canonical Domain Input Normalization & Security Evaluator', () => {
    it('normalizes valid domain with protocol and whitespace (S04-I05)', () => {
      const res = evaluateDomainInput('  https://api.acme-corp.com  ');
      assert.equal(res.valid, true);
      assert.equal(res.httpStatus, 200);
      assert.equal(res.sanitizedOutput, 'api.acme-corp.com');
    });

    it('rejects javascript: pseudo-protocol (S04-43)', () => {
      const res = evaluateDomainInput('javascript:alert(1)');
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.decision, 'XSS_PAYLOAD_NEUTRALIZED');
    });

    it('rejects data: and file: schemes', () => {
      const res1 = evaluateDomainInput('data:text/html,<script>alert(1)</script>');
      assert.equal(res1.valid, false);
      assert.equal(res1.decision, 'FORBIDDEN_SCHEME');

      const res2 = evaluateDomainInput('file:///etc/passwd');
      assert.equal(res2.valid, false);
      assert.equal(res2.decision, 'FORBIDDEN_SCHEME');
    });

    it('rejects userinfo credentials in domain', () => {
      const res = evaluateDomainInput('admin:secret@malicious.com');
      assert.equal(res.valid, false);
      assert.equal(res.decision, 'FORBIDDEN_USERINFO');
    });

    it('rejects URL paths, queries, and fragments', () => {
      const res1 = evaluateDomainInput('example.com/admin/settings');
      assert.equal(res1.valid, false);
      assert.equal(res1.decision, 'FORBIDDEN_URL_STRUCTURE');

      const res2 = evaluateDomainInput('example.com?apiKey=123');
      assert.equal(res2.valid, false);
      assert.equal(res2.decision, 'FORBIDDEN_URL_STRUCTURE');
    });

    it('rejects direct IPv4 and IPv6 addresses', () => {
      const res1 = evaluateDomainInput('192.168.1.1');
      assert.equal(res1.valid, false);
      assert.equal(res1.decision, 'DIRECT_IP_FORBIDDEN');

      const res2 = evaluateDomainInput('127.0.0.1');
      assert.equal(res2.valid, false);
      assert.equal(res2.decision, 'DIRECT_IP_FORBIDDEN');
    });

    it('rejects localhost and reserved internal hostnames', () => {
      const res1 = evaluateDomainInput('localhost');
      assert.equal(res1.valid, false);
      assert.equal(res1.decision, 'RESERVED_HOSTNAME');

      const res2 = evaluateDomainInput('internal.corp');
      assert.equal(res2.valid, false);
      assert.equal(res2.decision, 'RESERVED_TLD');
    });
  });

  describe('6. ORM Operator Injection Protection Evaluator', () => {
    it('accepts safe query parameters', () => {
      const res = evaluateQueryOperators({
        status: 'ACTIVE',
        limit: 20,
        sortBy: 'createdAt',
      });
      assert.equal(res.valid, true);
      assert.equal(res.httpStatus, 200);
    });

    it('rejects injected ORM operator objects (S04-03, S04-40)', () => {
      const res1 = evaluateQueryOperators({
        OR: [{ id: '1' }, { id: '2' }],
      });
      assert.equal(res1.valid, false);
      assert.equal(res1.httpStatus, 400);
      assert.equal(res1.decision, 'ORM_OPERATOR_INJECTION_REJECTED');

      const res2 = evaluateQueryOperators({
        nested: { contains: '%admin%' },
      });
      assert.equal(res2.valid, false);
      assert.equal(res2.httpStatus, 400);
      assert.equal(res2.decision, 'ORM_OPERATOR_INJECTION_REJECTED');
    });
  });

  describe('7. XSS Neutralization & Log Injection Sanitizer', () => {
    it('escapes HTML script tags and attribute injections (S04-08, S04-09, S04-10)', () => {
      const raw = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
      const { htmlEscaped } = neutralizeXssAndLogInjection(raw);
      assert.ok(!htmlEscaped.includes('<script>'));
      assert.ok(htmlEscaped.includes('&lt;script&gt;'));
      assert.ok(htmlEscaped.includes('&quot;xss&quot;'));
      assert.ok(htmlEscaped.includes('&lt;img src=x onerror=alert(1)&gt;'));
    });

    it('strips newlines and control characters for log forging protection (S04-48)', () => {
      const rawLog = 'User login failed\r\n[INFO] Admin authentication bypassed';
      const { logSanitized } = neutralizeXssAndLogInjection(rawLog);
      assert.ok(!logSanitized.includes('\r'));
      assert.ok(!logSanitized.includes('\n'));
      assert.ok(logSanitized.includes('User login failed [INFO] Admin authentication bypassed'));
    });
  });

  describe('8. S-04 Canonical Certification Gate Verifier', () => {
    it('verifies exact canonical certification statement', () => {
      const res = verifyS04Certification(S04_CERTIFICATION_STATEMENT);
      assert.equal(res.passed, true);
      assert.equal(res.similarityRatio, 1.0);
    });

    it('verifies close matching statements', () => {
      const candidate =
        'Every externally controlled value entering Nebula is explicitly validated, bounded, normalized, and safely handled before it can influence application behavior. Authentication and tenant ownership do not substitute for input security. GX, WX, and ADMIN each inherit the same fail-closed input discipline without weakening their security-plane boundaries.';
      const res = verifyS04Certification(candidate);
      assert.equal(res.passed, true);
      assert.ok(res.similarityRatio >= 0.95);
    });

    it('rejects incomplete or incorrect statements', () => {
      const candidate = 'Input is somewhat checked on frontend and backend.';
      const res = verifyS04Certification(candidate);
      assert.equal(res.passed, false);
      assert.ok(res.similarityRatio < 0.5);
    });
  });
});
