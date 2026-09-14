/**
 * S-05: Security Headers Policy & Evaluator
 *
 * Enforces production HTTP security headers baseline across API responses:
 * - Strict-Transport-Security (HSTS)
 * - Content-Security-Policy (CSP)
 * - X-Frame-Options (Clickjacking defense-in-depth)
 * - X-Content-Type-Options (MIME sniffing prevention)
 * - Referrer-Policy (Referrer leakage control)
 * - Permissions-Policy (Feature minimization)
 * - Cross-Origin-Opener-Policy (COOP)
 * - Cross-Origin-Resource-Policy (CORP)
 */

export interface SecurityHeaderConfiguration {
  readonly hstsMaxAge: number;
  readonly hstsIncludeSubDomains: boolean;
  readonly hstsPreload: boolean;
  readonly frameOptions: 'DENY' | 'SAMEORIGIN';
  readonly contentTypeOptions: 'nosniff';
  readonly referrerPolicy:
    'strict-origin-when-cross-origin' | 'no-referrer' | 'same-origin';
  readonly permissionsPolicy: string;
  readonly crossOriginOpenerPolicy:
    'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';
  readonly crossOriginResourcePolicy:
    'same-origin' | 'same-site' | 'cross-origin';
  readonly contentSecurityPolicy: string;
  readonly docsContentSecurityPolicy: string;
}

export const CANONICAL_PERMISSIONS_POLICY =
  'camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=(), accelerometer=(), gyroscope=(), magnetometer=()';

export const CANONICAL_CSP_POLICY =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';";

export const CANONICAL_DOCS_CSP_POLICY =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';";

export const DEFAULT_SECURITY_HEADER_CONFIG: SecurityHeaderConfiguration = {
  hstsMaxAge: 31536000, // 1 year
  hstsIncludeSubDomains: true,
  hstsPreload: true,
  frameOptions: 'DENY',
  contentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: CANONICAL_PERMISSIONS_POLICY,
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',
  contentSecurityPolicy: CANONICAL_CSP_POLICY,
  docsContentSecurityPolicy: CANONICAL_DOCS_CSP_POLICY,
};

/**
 * Builds the HSTS header string
 */
export function buildHstsHeader(
  config: SecurityHeaderConfiguration = DEFAULT_SECURITY_HEADER_CONFIG,
): string {
  let header = `max-age=${config.hstsMaxAge}`;
  if (config.hstsIncludeSubDomains) {
    header += '; includeSubDomains';
  }
  if (config.hstsPreload) {
    header += '; preload';
  }
  return header;
}

/**
 * Evaluates whether a set of response headers complies with the S-05 security header baseline
 */
export interface HeaderEvaluationResult {
  readonly compliant: boolean;
  readonly missingHeaders: string[];
  readonly invalidHeaders: {
    header: string;
    actual: string;
    expected: string;
  }[];
  readonly violations: string[];
}

export function evaluateSecurityHeaders(
  headers: Record<string, string | undefined>,
  options: { isHttps?: boolean; isProduction?: boolean; isDocs?: boolean } = {},
): HeaderEvaluationResult {
  const missingHeaders: string[] = [];
  const invalidHeaders: { header: string; actual: string; expected: string }[] =
    [];
  const violations: string[] = [];

  const normHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (v !== undefined) {
      normHeaders[k.toLowerCase()] = v;
    }
  }

  // 1. HSTS (Required on HTTPS or Production)
  if (options.isHttps || options.isProduction) {
    const hsts = normHeaders['strict-transport-security'];
    if (!hsts) {
      missingHeaders.push('Strict-Transport-Security');
      violations.push(
        'Missing Strict-Transport-Security on HTTPS/production response (S05-I02)',
      );
    } else {
      if (
        !hsts.includes('max-age=') ||
        parseInt(hsts.match(/max-age=(\d+)/)?.[1] || '0', 10) < 15552000
      ) {
        invalidHeaders.push({
          header: 'Strict-Transport-Security',
          actual: hsts,
          expected: 'max-age >= 15552000 (>= 180 days)',
        });
        violations.push('HSTS max-age is too short or missing (S05-33)');
      }
      if (!hsts.toLowerCase().includes('includesubdomains')) {
        violations.push('HSTS missing includeSubDomains directive (S05-I02)');
      }
    }
  }

  // 2. X-Frame-Options
  const xfo = normHeaders['x-frame-options'];
  if (!xfo) {
    missingHeaders.push('X-Frame-Options');
    violations.push('Missing X-Frame-Options header (S05-I04)');
  } else if (
    xfo.toUpperCase() !== 'DENY' &&
    xfo.toUpperCase() !== 'SAMEORIGIN'
  ) {
    invalidHeaders.push({
      header: 'X-Frame-Options',
      actual: xfo,
      expected: 'DENY or SAMEORIGIN',
    });
    violations.push('X-Frame-Options contains weak value (S05-35)');
  }

  // 3. X-Content-Type-Options
  const xcto = normHeaders['x-content-type-options'];
  if (!xcto) {
    missingHeaders.push('X-Content-Type-Options');
    violations.push('Missing X-Content-Type-Options header (S05-I05, S05-34)');
  } else if (xcto.toLowerCase() !== 'nosniff') {
    invalidHeaders.push({
      header: 'X-Content-Type-Options',
      actual: xcto,
      expected: 'nosniff',
    });
    violations.push('X-Content-Type-Options must be "nosniff" (S05-05)');
  }

  // 4. Referrer-Policy
  const rp = normHeaders['referrer-policy'];
  if (!rp) {
    missingHeaders.push('Referrer-Policy');
    violations.push('Missing Referrer-Policy header (S05-I06)');
  } else if (
    ![
      'strict-origin-when-cross-origin',
      'no-referrer',
      'same-origin',
      'strict-origin',
    ].includes(rp.toLowerCase())
  ) {
    invalidHeaders.push({
      header: 'Referrer-Policy',
      actual: rp,
      expected: 'strict-origin-when-cross-origin or stricter',
    });
    violations.push('Referrer-Policy is permissive or invalid (S05-22)');
  }

  // 5. Permissions-Policy
  const pp = normHeaders['permissions-policy'];
  if (!pp) {
    missingHeaders.push('Permissions-Policy');
    violations.push('Missing Permissions-Policy header (S05-I07)');
  }

  // 6. Content-Security-Policy
  const csp = normHeaders['content-security-policy'];
  if (!csp) {
    missingHeaders.push('Content-Security-Policy');
    violations.push('Missing Content-Security-Policy header (S05-I03)');
  } else {
    // Check for dangerous directives
    if (csp.includes('unsafe-eval') && !options.isDocs) {
      violations.push(
        'CSP contains dangerous unsafe-eval directive in production/API surface (S05-07)',
      );
    }
    if (csp.includes('default-src *') || csp.includes('script-src *')) {
      violations.push(
        'CSP contains wildcard script-src or default-src (S05-06, S05-08)',
      );
    }
    if (
      !csp.includes("frame-ancestors 'none'") &&
      !csp.includes('frame-ancestors') &&
      !options.isDocs
    ) {
      violations.push('CSP missing frame-ancestors directive (S05-04)');
    }
  }

  // 7. Leakage check (X-Powered-By)
  if (normHeaders['x-powered-by']) {
    violations.push(
      'Response leaks server identity in X-Powered-By header (S05-I12)',
    );
  }

  return {
    compliant:
      missingHeaders.length === 0 &&
      invalidHeaders.length === 0 &&
      violations.length === 0,
    missingHeaders,
    invalidHeaders,
    violations,
  };
}
