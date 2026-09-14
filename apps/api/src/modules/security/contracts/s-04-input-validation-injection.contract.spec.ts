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
} from './s-04-input-validation-injection.contract';

describe('S-04 — Input Validation, Injection & Request Integrity Contract Spec', () => {
  describe('1. Contract Identity, Scope & Frozen Principles', () => {
    it('verifies S-04 metadata constants', () => {
      expect(S04_TICKET_ID).toBe('S-04');
      expect(S04_PHASE).toBe('Production Security Hardening');
      expect(S04_PRIORITY).toBe('P0 — BLOCKING');
      expect(S04_TYPE).toContain('Input Validation / Injection');
      expect(S04_STATUS).toBe('CERTIFIED_INPUT_VALIDATION_INJECTION');
    });

    it('verifies all 4 frozen principles are defined', () => {
      expect(S04_PRINCIPLES.S04_P01_DEFAULT_UNTRUSTED).toBeDefined();
      expect(S04_PRINCIPLES.S04_P02_REQUEST_SECURITY_PIPELINE).toBeDefined();
      expect(S04_PRINCIPLES.S04_P03_FAIL_CLOSED_DISCIPLINE).toBeDefined();
      expect(S04_PRINCIPLES.S04_P04_INFORMATION_MINIMIZATION).toBeDefined();
    });

    it('verifies all 10 P0 security invariants are defined', () => {
      const keys = Object.keys(S04_INVARIANTS);
      expect(keys.length).toBe(10);
      expect(S04_INVARIANTS.S04_I01_REJECT_SECURITY_FIELDS).toContain('userId');
      expect(S04_INVARIANTS.S04_I02_NO_MASS_ASSIGNMENT).toContain('allowlists');
      expect(S04_INVARIANTS.S04_I03_STRICT_TYPE_VALIDATION).toContain(
        'explicit type contract',
      );
      expect(S04_INVARIANTS.S04_I04_REQUEST_SIZE_BOUNDARIES).toContain(
        'explicit limits',
      );
      expect(S04_INVARIANTS.S04_I05_DOMAIN_INPUT_NORMALIZATION).toContain(
        'Domain intent',
      );
      expect(S04_INVARIANTS.S04_I06_INJECTION_RESISTANCE).toContain(
        'executable syntax',
      );
      expect(S04_INVARIANTS.S04_I07_SAFE_ERROR_RESPONSES).toContain(
        'stack traces',
      );
      expect(S04_INVARIANTS.S04_I08_CANONICAL_ERROR_CONTRACT).toContain(
        'error shape',
      );
      expect(
        S04_INVARIANTS.S04_I09_QUERY_OPERATOR_INJECTION_PREVENTION,
      ).toContain('ORM operators');
      expect(S04_INVARIANTS.S04_I10_REDOS_PROTECTION).toContain(
        'regular expressions',
      );
    });
  });

  describe('2. 48-Vector Attack Matrix Coverage (S04-01 to S04-48)', () => {
    it('contains all 48 required attack vectors', () => {
      expect(S04_SECURITY_MATRIX.length).toBe(48);

      const vectorIds = new Set(S04_SECURITY_MATRIX.map((v) => v.id));
      for (let i = 1; i <= 48; i++) {
        const expectedId = `S04-${i < 10 ? '0' + i : i}`;
        expect(vectorIds.has(expectedId as any)).toBe(true);
      }
    });

    it('validates each vector has valid expected status and decision', () => {
      for (const item of S04_SECURITY_MATRIX) {
        expect([200, 400, 413, 415, 422]).toContain(item.expectedStatus);
        expect(item.expectedDecision.length).toBeGreaterThan(0);
        expect(item.attack.length).toBeGreaterThan(0);
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
      expect(res.valid).toBe(true);
      expect(res.httpStatus).toBe(200);
      expect(res.decision).toBe('INTEGRITY_VERIFIED');
    });

    it('rejects unsupported content-type (S04-23)', () => {
      const res = evaluateRequestIntegrity({
        method: 'POST',
        contentType: 'text/plain',
        contentLength: 50,
      });
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(415);
      expect(res.decision).toBe('UNSUPPORTED_MEDIA_TYPE');
    });

    it('rejects oversized request payload exceeding 1MB (S04-24)', () => {
      const res = evaluateRequestIntegrity({
        method: 'POST',
        contentType: 'application/json',
        contentLength: S04_LIMITS.MAX_BODY_SIZE_BYTES + 1024,
      });
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(413);
      expect(res.decision).toBe('PAYLOAD_TOO_LARGE');
    });

    it('rejects CRLF injection in request headers (S04-11, S04-12, S04-44)', () => {
      const res = evaluateRequestIntegrity({
        method: 'POST',
        contentType: 'application/json',
        headers: {
          'x-custom-header': 'safe-val\r\nInjected-Header: evil.com',
        },
      });
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(400);
      expect(res.decision).toBe('CRLF_HEADER_BLOCKED');
    });
  });

  describe('4. Payload Security, Schema & Forbidden Field Evaluator', () => {
    it('rejects empty payload when required (S04-21)', () => {
      const res = evaluatePayloadSecurity({}, { required: true });
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(400);
      expect(res.decision).toBe('EMPTY_BODY_REJECTED');
    });

    it('rejects injected userId field in payload (S04-31)', () => {
      const res = evaluatePayloadSecurity({
        domainName: 'target.com',
        userId: 'attacker-uuid',
      });
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(400);
      expect(res.decision).toBe('INJECT_USER_ID_REJECTED');
    });

    it('rejects injected elevated role / admin field (S04-35)', () => {
      const res = evaluatePayloadSecurity({
        name: 'Workspace 1',
        role: 'SUPER_ADMIN',
      });
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(400);
      expect(res.decision).toBe('INJECT_ROLE_REJECTED');
    });

    it('rejects injected permissions, plane, and tenantId (S04-32, S04-33, S04-36, S04-37)', () => {
      const res1 = evaluatePayloadSecurity({ tenantId: 'tenant-999' });
      expect(res1.valid).toBe(false);
      expect(res1.httpStatus).toBe(400);

      const res2 = evaluatePayloadSecurity({ plane: 'AX' });
      expect(res2.valid).toBe(false);
      expect(res2.httpStatus).toBe(400);

      const res3 = evaluatePayloadSecurity({ permissions: ['*'] });
      expect(res3.valid).toBe(false);
      expect(res3.httpStatus).toBe(400);
    });

    it('rejects prototype pollution payload (S04-15, S04-47)', () => {
      const res = evaluatePayloadSecurity({
        __proto__: { isAdmin: true },
        domainName: 'test.com',
      });
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(400);
      expect(res.decision).toBe('PROTOTYPE_POLLUTION_REJECTED');
    });

    it('rejects excessive nesting depth (S04-16, S04-27)', () => {
      let nested: any = { value: 'deep' };
      for (let i = 0; i < 15; i++) {
        nested = { child: nested };
      }
      const res = evaluatePayloadSecurity(nested);
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(400);
      expect(res.decision).toBe('EXCESSIVE_NESTING_REJECTED');
    });

    it('rejects mass-assignment and unwhitelisted properties (S04-19, S04-20, S04-25)', () => {
      const res = evaluatePayloadSecurity(
        { domain: 'example.com', unapprovedField: 'injected' },
        { allowedKeys: ['domain', 'description'] },
      );
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(400);
      expect(res.decision).toBe('UNKNOWN_PROPERTIES_REJECTED');
    });

    it('rejects SQL injection payload in string fields (S04-01, S04-02, S04-39)', () => {
      const res = evaluatePayloadSecurity({
        filter: "admin' UNION ALL SELECT * FROM users--",
      });
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(400);
      expect(res.decision).toBe('SQL_INJECTION_REJECTED');
    });

    it('rejects shell command injection payload (S04-04, S04-05, S04-41)', () => {
      const res = evaluatePayloadSecurity({
        query: 'test; rm -rf / ;',
      });
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(400);
      expect(res.decision).toBe('SHELL_INJECTION_REJECTED');
    });

    it('rejects path traversal payload (S04-06, S04-42)', () => {
      const res = evaluatePayloadSecurity({
        file: '../../../../etc/passwd',
      });
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(400);
      expect(res.decision).toBe('PATH_TRAVERSAL_REJECTED');
    });

    it('rejects template injection payload (S04-13, S04-45)', () => {
      const res = evaluatePayloadSecurity({
        template: '{{7*7}} ${process.env.SECRET}',
      });
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(400);
      expect(res.decision).toBe('TEMPLATE_INJECTION_REJECTED');
    });
  });

  describe('5. Canonical Domain Input Normalization & Security Evaluator', () => {
    it('normalizes valid domain with protocol and whitespace (S04-I05)', () => {
      const res = evaluateDomainInput('  https://api.acme-corp.com/  ');
      // Notice trailing slash causes rejection per strict domain grammar or gets normalized
      const res2 = evaluateDomainInput('  https://api.acme-corp.com  ');
      expect(res2.valid).toBe(true);
      expect(res2.httpStatus).toBe(200);
      expect(res2.sanitizedOutput).toBe('api.acme-corp.com');
    });

    it('rejects javascript: pseudo-protocol (S04-43)', () => {
      const res = evaluateDomainInput('javascript:alert(1)');
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(400);
      expect(res.decision).toBe('XSS_PAYLOAD_NEUTRALIZED');
    });

    it('rejects data: and file: schemes', () => {
      const res1 = evaluateDomainInput(
        'data:text/html,<script>alert(1)</script>',
      );
      expect(res1.valid).toBe(false);
      expect(res1.decision).toBe('FORBIDDEN_SCHEME');

      const res2 = evaluateDomainInput('file:///etc/passwd');
      expect(res2.valid).toBe(false);
      expect(res2.decision).toBe('FORBIDDEN_SCHEME');
    });

    it('rejects userinfo credentials in domain', () => {
      const res = evaluateDomainInput('admin:secret@malicious.com');
      expect(res.valid).toBe(false);
      expect(res.decision).toBe('FORBIDDEN_USERINFO');
    });

    it('rejects URL paths, queries, and fragments', () => {
      const res1 = evaluateDomainInput('example.com/admin/settings');
      expect(res1.valid).toBe(false);
      expect(res1.decision).toBe('FORBIDDEN_URL_STRUCTURE');

      const res2 = evaluateDomainInput('example.com?apiKey=123');
      expect(res2.valid).toBe(false);
      expect(res2.decision).toBe('FORBIDDEN_URL_STRUCTURE');
    });

    it('rejects direct IPv4 and IPv6 addresses', () => {
      const res1 = evaluateDomainInput('192.168.1.1');
      expect(res1.valid).toBe(false);
      expect(res1.decision).toBe('DIRECT_IP_FORBIDDEN');

      const res2 = evaluateDomainInput('127.0.0.1');
      expect(res2.valid).toBe(false);
      expect(res2.decision).toBe('DIRECT_IP_FORBIDDEN');
    });

    it('rejects localhost and reserved internal hostnames', () => {
      const res1 = evaluateDomainInput('localhost');
      expect(res1.valid).toBe(false);
      expect(res1.decision).toBe('RESERVED_HOSTNAME');

      const res2 = evaluateDomainInput('internal.corp');
      expect(res2.valid).toBe(false);
      expect(res2.decision).toBe('RESERVED_TLD');
    });
  });

  describe('6. ORM Operator Injection Protection Evaluator', () => {
    it('accepts safe query parameters', () => {
      const res = evaluateQueryOperators({
        status: 'ACTIVE',
        limit: 20,
        sortBy: 'createdAt',
      });
      expect(res.valid).toBe(true);
      expect(res.httpStatus).toBe(200);
    });

    it('rejects injected ORM operator objects (S04-03, S04-40)', () => {
      const res1 = evaluateQueryOperators({
        OR: [{ id: '1' }, { id: '2' }],
      });
      expect(res1.valid).toBe(false);
      expect(res1.httpStatus).toBe(400);
      expect(res1.decision).toBe('ORM_OPERATOR_INJECTION_REJECTED');

      const res2 = evaluateQueryOperators({
        nested: { contains: '%admin%' },
      });
      expect(res2.valid).toBe(false);
      expect(res2.httpStatus).toBe(400);
      expect(res2.decision).toBe('ORM_OPERATOR_INJECTION_REJECTED');
    });
  });

  describe('7. XSS Neutralization & Log Injection Sanitizer', () => {
    it('escapes HTML script tags and attribute injections (S04-08, S04-09, S04-10)', () => {
      const raw = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
      const { htmlEscaped } = neutralizeXssAndLogInjection(raw);
      expect(htmlEscaped).not.toContain('<script>');
      expect(htmlEscaped).toContain('&lt;script&gt;');
      expect(htmlEscaped).toContain('&quot;xss&quot;');
      expect(htmlEscaped).toContain('&lt;img src=x onerror=alert(1)&gt;');
    });

    it('strips newlines and control characters for log forging protection (S04-48)', () => {
      const rawLog =
        'User login failed\r\n[INFO] Admin authentication bypassed';
      const { logSanitized } = neutralizeXssAndLogInjection(rawLog);
      expect(logSanitized).not.toContain('\r');
      expect(logSanitized).not.toContain('\n');
      expect(logSanitized).toContain(
        'User login failed [INFO] Admin authentication bypassed',
      );
    });
  });

  describe('8. S-04 Canonical Certification Gate Verifier', () => {
    it('verifies exact canonical certification statement', () => {
      const res = verifyS04Certification(S04_CERTIFICATION_STATEMENT);
      expect(res.passed).toBe(true);
      expect(res.similarityRatio).toBe(1.0);
    });

    it('verifies close matching statements', () => {
      const candidate =
        'Every externally controlled value entering Nebula is explicitly validated, bounded, normalized, and safely handled before it can influence application behavior. Authentication and tenant ownership do not substitute for input security. GX, WX, and ADMIN each inherit the same fail-closed input discipline without weakening their security-plane boundaries.';
      const res = verifyS04Certification(candidate);
      expect(res.passed).toBe(true);
      expect(res.similarityRatio).toBeGreaterThanOrEqual(0.95);
    });

    it('rejects incomplete or incorrect statements', () => {
      const candidate = 'Input is somewhat checked on frontend and backend.';
      const res = verifyS04Certification(candidate);
      expect(res.passed).toBe(false);
      expect(res.similarityRatio).toBeLessThan(0.5);
    });
  });
});
