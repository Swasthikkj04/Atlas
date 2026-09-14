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
  evaluateSecurityHeaders,
  evaluateCorsRequest,
  evaluateCsrfProtection,
  evaluateTransportSecurity,
  evaluateCacheIsolation,
  evaluateBrowserBoundaryAttackVector,
  verifyS05Certification,
  containsUrlCredentials,
  DEFAULT_SECURITY_HEADER_CONFIG,
  CANONICAL_CSP_POLICY,
  CANONICAL_PERMISSIONS_POLICY,
} from './s-05-transport-browser.contract';

describe('S-05 — Security Headers, Transport & Browser Boundary Contract Spec', () => {
  describe('1. Contract Identity, Scope & Frozen Principles', () => {
    it('verifies S-05 metadata constants', () => {
      expect(S05_TICKET_ID).toBe('S-05');
      expect(S05_PHASE).toBe('Production Security Hardening');
      expect(S05_PRIORITY).toBe('P0 — BLOCKING');
      expect(S05_TYPE).toContain('Browser Security / Transport');
      expect(S05_STATUS).toBe('CERTIFIED_TRANSPORT_BROWSER_SECURITY');
    });

    it('verifies all 4 frozen principles are defined', () => {
      expect(S05_PRINCIPLES.S05_P01_PERIMETER_CONTINUITY).toContain(
        'security perimeter',
      );
      expect(S05_PRINCIPLES.S05_P02_NO_COMPENSATING_ASSUMPTION).toContain(
        'No layer is permitted to assume',
      );
      expect(S05_PRINCIPLES.S05_P03_GX_WX_BROWSER_ISOLATION).toContain(
        'Same browser != same security context',
      );
      expect(S05_PRINCIPLES.S05_P04_DIRECT_API_INDEPENDENCE).toContain(
        'Direct API requests',
      );
    });

    it('verifies all 12 P0 security invariants are defined', () => {
      const keys = Object.keys(S05_INVARIANTS);
      expect(keys.length).toBe(12);
      expect(S05_INVARIANTS['S05-I01'].description).toContain('HTTPS');
      expect(S05_INVARIANTS['S05-I02'].description).toContain(
        'Strict-Transport-Security',
      );
      expect(S05_INVARIANTS['S05-I03'].description).toContain(
        'Content Security Policy',
      );
      expect(S05_INVARIANTS['S05-I04'].description).toContain('Clickjacking');
      expect(S05_INVARIANTS['S05-I05'].description).toContain('nosniff');
      expect(S05_INVARIANTS['S05-I06'].description).toContain(
        'strict-origin-when-cross-origin',
      );
      expect(S05_INVARIANTS['S05-I07'].description).toContain(
        'Permissions Policy',
      );
      expect(S05_INVARIANTS['S05-I08'].description).toContain(
        'Access-Control-Allow-Origin: * strictly forbidden',
      );
      expect(S05_INVARIANTS['S05-I09'].description).toContain(
        'Secure, HttpOnly, SameSite',
      );
      expect(S05_INVARIANTS['S05-I10'].description).toContain('CSRF Boundary');
      expect(S05_INVARIANTS['S05-I11'].description).toContain(
        'Cache-Control: private, no-cache, no-store',
      );
      expect(S05_INVARIANTS['S05-I12'].description).toContain(
        'Credential Leakage Prevention',
      );
    });
  });

  describe('2. 40-Vector Attack Matrix Coverage (S05-01 to S05-40)', () => {
    it('contains all 40 required attack vectors', () => {
      expect(S05_ATTACK_MATRIX.length).toBe(40);

      const vectorIds = new Set(S05_ATTACK_MATRIX.map((v) => v.id));
      for (let i = 1; i <= 40; i++) {
        const expectedId = `S05-${i < 10 ? '0' + i : i}`;
        expect(vectorIds.has(expectedId as any)).toBe(true);
      }
    });

    it('validates each vector has valid expected status and decision', () => {
      for (const vector of S05_ATTACK_MATRIX) {
        expect(vector.id).toMatch(/^S05-\d{2}$/);
        expect(vector.description.length).toBeGreaterThan(5);
        expect([200, 400, 403, 413, 415, 500]).toContain(vector.expectedStatus);
        expect(vector.expectedDecision.length).toBeGreaterThan(0);
      }
    });
  });

  describe('3. Transport Security & Protocol Evaluator', () => {
    it('accepts valid HTTPS request on authenticated route', () => {
      const res = evaluateTransportSecurity({
        protocol: 'https',
        isSecure: true,
        url: '/api/v1/workspace/overview',
        isAuthenticatedRoute: true,
      });
      expect(res.secure).toBe(true);
      expect(res.decision).toBe('TRANSPORT_SECURE');
    });

    it('rejects plaintext HTTP request on authenticated route (S05-01, S05-I01)', () => {
      const res = evaluateTransportSecurity({
        protocol: 'http',
        isSecure: false,
        url: '/api/v1/workspace/overview',
        isAuthenticatedRoute: true,
      });
      expect(res.secure).toBe(false);
      expect(res.httpStatus).toBe(400);
      expect(res.decision).toBe('HTTP_PLAINTEXT_REJECTED');
    });

    it('rejects HTTPS downgrade attempt via X-Forwarded-Proto (S05-02)', () => {
      const res = evaluateTransportSecurity({
        forwardedProto: 'http',
        isSecure: false,
        url: '/api/v1/workspace/overview',
      });
      expect(res.secure).toBe(false);
      expect(res.decision).toBe('DOWNGRADE_ATTEMPT_REJECTED');
    });

    it('detects and rejects JWT in URL query parameters (S05-15)', () => {
      const res = evaluateTransportSecurity({
        protocol: 'https',
        isSecure: true,
        url: '/api/v1/workspace?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      });
      expect(res.secure).toBe(false);
      expect(res.decision).toBe('CREDENTIAL_IN_URL_REJECTED');
    });

    it('detects and rejects refresh token in URL (S05-16)', () => {
      const res = evaluateTransportSecurity({
        protocol: 'https',
        isSecure: true,
        url: '/api/v1/auth/refresh?refresh_token=secret_refresh_abc123',
      });
      expect(res.secure).toBe(false);
      expect(res.decision).toBe('CREDENTIAL_IN_URL_REJECTED');
    });

    it('recognizes clean URL without credentials', () => {
      const check = containsUrlCredentials(
        '/api/v1/workspace/domains?filter=active&sort=desc',
      );
      expect(check.containsCredential).toBe(false);
    });
  });

  describe('4. Security Headers Evaluator', () => {
    it('accepts compliant security headers baseline', () => {
      const headers = {
        'Strict-Transport-Security':
          'max-age=31536000; includeSubDomains; preload',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': CANONICAL_PERMISSIONS_POLICY,
        'Content-Security-Policy': CANONICAL_CSP_POLICY,
      };
      const res = evaluateSecurityHeaders(headers, {
        isHttps: true,
        isProduction: true,
      });
      expect(res.compliant).toBe(true);
      expect(res.missingHeaders.length).toBe(0);
      expect(res.violations.length).toBe(0);
    });

    it('detects missing HSTS header (S05-03, S05-I02)', () => {
      const headers = {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': CANONICAL_PERMISSIONS_POLICY,
        'Content-Security-Policy': CANONICAL_CSP_POLICY,
      };
      const res = evaluateSecurityHeaders(headers, {
        isHttps: true,
        isProduction: true,
      });
      expect(res.compliant).toBe(false);
      expect(res.missingHeaders).toContain('Strict-Transport-Security');
    });

    it('detects weak HSTS max-age (S05-33)', () => {
      const headers = {
        'Strict-Transport-Security': 'max-age=3600', // too short
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': CANONICAL_PERMISSIONS_POLICY,
        'Content-Security-Policy': CANONICAL_CSP_POLICY,
      };
      const res = evaluateSecurityHeaders(headers, {
        isHttps: true,
        isProduction: true,
      });
      expect(res.compliant).toBe(false);
      expect(res.violations.some((v) => v.includes('HSTS max-age'))).toBe(true);
    });

    it('detects missing X-Frame-Options / clickjacking protection (S05-04, S05-I04, S05-35)', () => {
      const headers = {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': CANONICAL_PERMISSIONS_POLICY,
        'Content-Security-Policy': CANONICAL_CSP_POLICY,
      };
      const res = evaluateSecurityHeaders(headers, {
        isHttps: true,
        isProduction: true,
      });
      expect(res.compliant).toBe(false);
      expect(res.missingHeaders).toContain('X-Frame-Options');
    });

    it('detects missing X-Content-Type-Options (S05-05, S05-I05, S05-34)', () => {
      const headers = {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': CANONICAL_PERMISSIONS_POLICY,
        'Content-Security-Policy': CANONICAL_CSP_POLICY,
      };
      const res = evaluateSecurityHeaders(headers, {
        isHttps: true,
        isProduction: true,
      });
      expect(res.compliant).toBe(false);
      expect(res.missingHeaders).toContain('X-Content-Type-Options');
    });

    it('detects unsafe-eval in Content-Security-Policy (S05-07, S05-I03)', () => {
      const headers = {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': CANONICAL_PERMISSIONS_POLICY,
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self' 'unsafe-eval';",
      };
      const res = evaluateSecurityHeaders(headers, {
        isHttps: true,
        isProduction: true,
      });
      expect(res.compliant).toBe(false);
      expect(res.violations.some((v) => v.includes('unsafe-eval'))).toBe(true);
    });

    it('detects server identity leak in X-Powered-By (S05-I12)', () => {
      const headers = {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': CANONICAL_PERMISSIONS_POLICY,
        'Content-Security-Policy': CANONICAL_CSP_POLICY,
        'X-Powered-By': 'Express',
      };
      const res = evaluateSecurityHeaders(headers, {
        isHttps: true,
        isProduction: true,
      });
      expect(res.compliant).toBe(false);
      expect(res.violations.some((v) => v.includes('X-Powered-By'))).toBe(true);
    });
  });

  describe('5. CORS Policy & Origin Boundary Evaluator', () => {
    it('allows whitelisted origin with credentials', () => {
      const res = evaluateCorsRequest({
        origin: 'https://argonion.com',
        isCredentialed: true,
      });
      expect(res.allowed).toBe(true);
      expect(res.decision).toBe('ORIGIN_ALLOWED');
      expect(res.headers['Access-Control-Allow-Origin']).toBe(
        'https://argonion.com',
      );
      expect(res.headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('allows whitelisted www subdomain origin with credentials', () => {
      const res = evaluateCorsRequest({
        origin: 'https://www.argonion.com',
        isCredentialed: true,
      });
      expect(res.allowed).toBe(true);
      expect(res.decision).toBe('ORIGIN_ALLOWED');
      expect(res.headers['Access-Control-Allow-Origin']).toBe(
        'https://www.argonion.com',
      );
      expect(res.headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('allows whitelisted nebula workspace origin with credentials', () => {
      const res = evaluateCorsRequest({
        origin: 'https://nebula.argonion.com',
        isCredentialed: true,
      });
      expect(res.allowed).toBe(true);
      expect(res.decision).toBe('ORIGIN_ALLOWED');
      expect(res.headers['Access-Control-Allow-Origin']).toBe(
        'https://nebula.argonion.com',
      );
      expect(res.headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('allows non-browser direct API request with no origin (S05-40)', () => {
      const res = evaluateCorsRequest({
        origin: null,
      });
      expect(res.allowed).toBe(true);
      expect(res.decision).toBe('NO_ORIGIN_ALLOWED');
    });

    it('rejects untrusted foreign origin (S05-10, S05-11, S05-26)', () => {
      const res = evaluateCorsRequest({
        origin: 'https://malicious-attacker.com',
        isCredentialed: true,
      });
      expect(res.allowed).toBe(false);
      expect(res.httpStatus).toBe(403);
      expect(res.decision).toBe('UNTRUSTED_ORIGIN_REJECTED');
    });

    it('rejects wildcard origin with credentials (S05-09, S05-I08)', () => {
      const res = evaluateCorsRequest(
        {
          origin: 'https://any-site.com',
          isCredentialed: true,
        },
        {
          allowedOrigins: ['*'],
          allowCredentials: true,
          allowedMethods: ['GET', 'POST'],
          allowedHeaders: ['Content-Type'],
          exposedHeaders: [],
          maxAge: 3600,
        },
      );
      expect(res.allowed).toBe(false);
      expect(res.decision).toBe('WILDCARD_CREDENTIALS_REJECTED');
    });

    it('enforces plane boundary between WX and ADMIN origins (S05-27, S05-28)', () => {
      const res = evaluateCorsRequest({
        origin: 'https://app.argonion.com',
        targetPlane: 'ADMIN',
        originPlane: 'WX',
      });
      expect(res.allowed).toBe(false);
      expect(res.decision).toBe('PLANE_BOUNDARY_REJECTED');
    });
  });

  describe('6. CSRF Boundary Protection Evaluator', () => {
    it('allows safe idempotent read methods (GET, HEAD, OPTIONS)', () => {
      const res = evaluateCsrfProtection({
        method: 'GET',
        origin: 'https://random-origin.com',
      });
      expect(res.valid).toBe(true);
      expect(res.decision).toBe('SAFE_METHOD_ALLOWED');
    });

    it('allows bearer authenticated state changes', () => {
      const res = evaluateCsrfProtection({
        method: 'POST',
        hasAuthHeader: true,
      });
      expect(res.valid).toBe(true);
      expect(res.decision).toBe('BEARER_AUTH_ALLOWED');
    });

    it('rejects state change from unwhitelisted origin (S05-13, S05-14)', () => {
      const res = evaluateCsrfProtection({
        method: 'POST',
        origin: 'https://evil-site.com',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(res.valid).toBe(false);
      expect(res.decision).toBe('CROSS_ORIGIN_CSRF_REJECTED');
    });

    it('rejects state change with unsafe SameSite=None cookie (S05-38)', () => {
      const res = evaluateCsrfProtection({
        method: 'POST',
        origin: 'https://argonion.com',
        cookieSameSite: 'none',
      });
      expect(res.valid).toBe(false);
      expect(res.decision).toBe('UNSAFE_SAMESITE_COOKIE_REJECTED');
    });

    it('rejects state change missing custom header or json content-type (S05-14)', () => {
      const res = evaluateCsrfProtection({
        method: 'POST',
        origin: 'https://argonion.com',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      });
      expect(res.valid).toBe(false);
      expect(res.decision).toBe('CUSTOM_HEADER_MISSING_REJECTED');
    });

    it('validates compliant state-changing request with JSON and origin', () => {
      const res = evaluateCsrfProtection({
        method: 'POST',
        origin: 'https://argonion.com',
        headers: {
          'content-type': 'application/json',
          'x-requested-with': 'XMLHttpRequest',
        },
      });
      expect(res.valid).toBe(true);
      expect(res.decision).toBe('CSRF_VALIDATED');
    });
  });

  describe('7. Cache Isolation & Sensitive Route Evaluator', () => {
    it('verifies compliant no-store cache headers on sensitive workspace routes', () => {
      const res = evaluateCacheIsolation('/api/v1/workspace/overview', {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      });
      expect(res.compliant).toBe(true);
      expect(res.isSensitive).toBe(true);
      expect(res.violations.length).toBe(0);
    });

    it('detects public caching violation on private workspace responses (S05-19)', () => {
      const res = evaluateCacheIsolation('/api/v1/workspace/overview', {
        'Cache-Control': 'public, max-age=3600',
      });
      expect(res.compliant).toBe(false);
      expect(res.violations.some((v) => v.includes('public'))).toBe(true);
    });

    it('detects missing no-store on sensitive auth/logout response (S05-20, S05-21, S05-39)', () => {
      const res = evaluateCacheIsolation('/api/v1/auth/logout', {
        'Cache-Control': 'private, max-age=3600',
      });
      expect(res.compliant).toBe(false);
      expect(res.violations.some((v) => v.includes('no-store'))).toBe(true);
    });
  });

  describe('8. 40-Vector Scenario Engine & Certification Gate', () => {
    it('evaluates framing attack vectors (S05-04, S05-25)', () => {
      const res1 = evaluateBrowserBoundaryAttackVector('S05-04', {});
      expect(res1.httpStatus).toBe(403);
      expect(res1.decision).toBe('FRAMING_BLOCKED');

      const res2 = evaluateBrowserBoundaryAttackVector('S05-25', {});
      expect(res2.httpStatus).toBe(403);
      expect(res2.decision).toBe('WX_FRAMING_BLOCKED');
    });

    it('evaluates MIME sniffing attack (S05-05)', () => {
      const res = evaluateBrowserBoundaryAttackVector('S05-05', {});
      expect(res.httpStatus).toBe(400);
      expect(res.decision).toBe('MIME_SNIFFING_BLOCKED');
    });

    it('verifies exact canonical certification statement', () => {
      expect(verifyS05Certification(S05_CERTIFICATION_STATEMENT)).toBe(true);
      expect(verifyS05Certification(S05_SECONDARY_GATE)).toBe(true);
    });

    it('rejects invalid or blank certification statements', () => {
      expect(verifyS05Certification('')).toBe(false);
      expect(verifyS05Certification('Arbitrary statement')).toBe(false);
    });
  });
});
