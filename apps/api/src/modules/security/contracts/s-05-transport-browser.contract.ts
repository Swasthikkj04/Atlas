/**
 * S-05 — Security Headers, Transport & Browser Boundary Contract
 *
 * Phase: Production Security Hardening
 * Ticket ID: S-05
 * Priority: P0 — BLOCKING
 * Type: Security / HTTP / Browser Security / Transport / Backend / Web / Contract
 * Depends on: S-01 🔒, S-02 🔒, S-03 🔒, S-04 🔒
 * Blocks: S-06 → S-12 and Production Release
 * Status: 🔒 CERTIFIED_TRANSPORT_BROWSER_SECURITY
 *
 * Certification objective:
 * "Nebula's browser and HTTP transport surface must be explicitly hardened so that
 * authenticated credentials, protected resources, browser execution contexts,
 * framing contexts, content types, and cross-origin requests cannot be abused to
 * bypass or weaken the established security boundary."
 */

export const S05_TICKET_ID = 'S-05' as const;
export const S05_PHASE = 'Production Security Hardening' as const;
export const S05_PRIORITY = 'P0 — BLOCKING' as const;
export const S05_TYPE =
  'Security / HTTP / Browser Security / Transport / Backend / Web / Contract' as const;
export const S05_STATUS = 'CERTIFIED_TRANSPORT_BROWSER_SECURITY' as const;

/**
 * 1. Frozen Security Principles
 */
export const S05_PRINCIPLES = {
  S05_P01_PERIMETER_CONTINUITY:
    'The application boundary does not end at the API route. Transport and browser behavior are part of the security perimeter.',
  S05_P02_NO_COMPENSATING_ASSUMPTION:
    'No layer is permitted to assume that another layer will compensate for it (HTTPS -> Security Headers -> CORS / Origin -> Cookie / CSRF -> Content / MIME -> S-02 Auth -> S-03 Authz -> Resource).',
  S05_P03_GX_WX_BROWSER_ISOLATION:
    'Same browser != same security context. Same origin != same authorization plane. Authenticated browser != authenticated GX. GX navigation != WX authorization.',
  S05_P04_DIRECT_API_INDEPENDENCE:
    'Direct API requests bypassing browser controls are independently secured by S-02 authentication and S-03 authorization.',
} as const;

/**
 * 2. Canonical Certification Gates
 */
export const S05_CERTIFICATION_STATEMENT =
  "Nebula's browser and HTTP transport surface must be explicitly hardened so that authenticated credentials, protected resources, browser execution contexts, framing contexts, content types, and cross-origin requests cannot be abused to bypass or weaken the established security boundary." as const;

export const S05_SECONDARY_GATE =
  "Nebula's transport, browser, origin, credential, framing, content, and caching boundaries are explicitly enforced and independently verified. Browser behavior cannot weaken the authentication, authorization, tenant-isolation, or GX/WX security boundaries established by S-01 through S-04." as const;

/**
 * 3. 12 P0 Security Invariants
 */
export interface SecurityInvariant {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly standard: string;
}

export const S05_INVARIANTS: Record<string, SecurityInvariant> = {
  'S05-I01': {
    id: 'S05-I01',
    name: 'HTTPS Enforcement',
    description:
      'Production authenticated traffic must use HTTPS. No authenticated API operation permitted over plaintext transport.',
    standard: 'RFC 9110 / TLS 1.3 Strict Transport',
  },
  'S05-I02': {
    id: 'S05-I02',
    name: 'Strict Transport Security (HSTS)',
    description:
      'Strict-Transport-Security with max-age >= 31536000, includeSubDomains, and preload.',
    standard: 'RFC 6797',
  },
  'S05-I03': {
    id: 'S05-I03',
    name: 'Content Security Policy (CSP)',
    description:
      'Content Security Policy (CSP): Browser execution surface must have an explicit CSP preventing arbitrary scripts, unsafe-eval, and uncontrolled framing.',
    standard: 'W3C CSP Level 3',
  },
  'S05-I04': {
    id: 'S05-I04',
    name: 'Clickjacking Protection',
    description:
      "Clickjacking Protection: Protected surfaces must not be frameable by arbitrary origins (frame-ancestors 'none', X-Frame-Options: DENY).",
    standard: 'RFC 7034 / CSP frame-ancestors',
  },
  'S05-I05': {
    id: 'S05-I05',
    name: 'MIME Sniffing Protection',
    description:
      'Production responses must include X-Content-Type-Options: nosniff and correct content types.',
    standard: 'Fetch Spec / MIME Sniffing Standard',
  },
  'S05-I06': {
    id: 'S05-I06',
    name: 'Referrer Control',
    description:
      'Referrer-Policy: strict-origin-when-cross-origin to prevent leakage of sensitive navigation paths.',
    standard: 'W3C Referrer Policy',
  },
  'S05-I07': {
    id: 'S05-I07',
    name: 'Permissions Policy',
    description:
      'Permissions Policy: Browser hardware capabilities (camera, microphone, geolocation, usb, payment) explicitly disabled.',
    standard: 'W3C Permissions Policy',
  },
  'S05-I08': {
    id: 'S05-I08',
    name: 'CORS Allowlist',
    description:
      'CORS Allowlist: Explicit origin allowlist required; Access-Control-Allow-Origin: * strictly forbidden for credentialed APIs.',
    standard: 'W3C Fetch / CORS',
  },
  'S05-I09': {
    id: 'S05-I09',
    name: 'Credential Boundary',
    description:
      'Credential Boundary: Cookies must use Secure, HttpOnly, SameSite. Credentials prohibited in URLs, localStorage, DOM, logs.',
    standard: 'RFC 6265bis',
  },
  'S05-I10': {
    id: 'S05-I10',
    name: 'CSRF Boundary',
    description:
      'CSRF Boundary: State-changing requests require multi-layered defense: SameSite cookie isolation, Origin validation, and custom headers.',
    standard: 'OWASP CSRF Defense Standard',
  },
  'S05-I11': {
    id: 'S05-I11',
    name: 'Cache Isolation',
    description:
      'Cache Isolation: Sensitive responses must establish Cache-Control: private, no-cache, no-store, must-revalidate.',
    standard: 'RFC 9111 HTTP Caching',
  },
  'S05-I12': {
    id: 'S05-I12',
    name: 'Credential Leakage Prevention',
    description:
      'Credential Leakage Prevention: JWTs, session tokens, and secrets must never be exposed via headers, error responses, redirects, or logs.',
    standard: 'OWASP ASVS v4.0 / CWE-598',
  },
};

/**
 * 4. 40-Vector Attack Matrix
 */
export interface AttackVectorScenario {
  readonly id: string;
  readonly description: string;
  readonly category:
    | 'TRANSPORT'
    | 'FRAMING'
    | 'MIME'
    | 'CSP'
    | 'CORS_ORIGIN'
    | 'CSRF'
    | 'CREDENTIALS'
    | 'CACHE'
    | 'REFERRER_CAPABILITIES'
    | 'POLICY_INTEGRITY';
  readonly expectedStatus: number;
  readonly expectedDecision: string;
}

export const S05_ATTACK_MATRIX: readonly AttackVectorScenario[] = [
  {
    id: 'S05-01',
    description: 'HTTP access to authenticated route',
    category: 'TRANSPORT',
    expectedStatus: 400,
    expectedDecision: 'HTTP_PLAINTEXT_REJECTED',
  },
  {
    id: 'S05-02',
    description: 'HTTPS downgrade attempt',
    category: 'TRANSPORT',
    expectedStatus: 400,
    expectedDecision: 'DOWNGRADE_ATTEMPT_REJECTED',
  },
  {
    id: 'S05-03',
    description: 'Missing HSTS',
    category: 'TRANSPORT',
    expectedStatus: 400,
    expectedDecision: 'HSTS_MISSING',
  },
  {
    id: 'S05-04',
    description: 'Arbitrary iframe embedding',
    category: 'FRAMING',
    expectedStatus: 403,
    expectedDecision: 'FRAMING_BLOCKED',
  },
  {
    id: 'S05-05',
    description: 'MIME sniffing attempt',
    category: 'MIME',
    expectedStatus: 400,
    expectedDecision: 'MIME_SNIFFING_BLOCKED',
  },
  {
    id: 'S05-06',
    description: 'Unauthorized CSP script',
    category: 'CSP',
    expectedStatus: 403,
    expectedDecision: 'CSP_SCRIPT_BLOCKED',
  },
  {
    id: 'S05-07',
    description: 'CSP unsafe-eval regression',
    category: 'CSP',
    expectedStatus: 400,
    expectedDecision: 'UNSAFE_EVAL_PROHIBITED',
  },
  {
    id: 'S05-08',
    description: 'Unauthorized external script',
    category: 'CSP',
    expectedStatus: 403,
    expectedDecision: 'EXTERNAL_SCRIPT_BLOCKED',
  },
  {
    id: 'S05-09',
    description: 'Wildcard authenticated CORS',
    category: 'CORS_ORIGIN',
    expectedStatus: 403,
    expectedDecision: 'WILDCARD_CREDENTIALS_REJECTED',
  },
  {
    id: 'S05-10',
    description: 'Untrusted Origin reflection',
    category: 'CORS_ORIGIN',
    expectedStatus: 403,
    expectedDecision: 'UNTRUSTED_ORIGIN_REJECTED',
  },
  {
    id: 'S05-11',
    description: 'Credentialed request from foreign origin',
    category: 'CORS_ORIGIN',
    expectedStatus: 403,
    expectedDecision: 'UNTRUSTED_ORIGIN_REJECTED',
  },
  {
    id: 'S05-12',
    description: 'Missing Origin validation',
    category: 'CORS_ORIGIN',
    expectedStatus: 403,
    expectedDecision: 'UNTRUSTED_ORIGIN_REJECTED',
  },
  {
    id: 'S05-13',
    description: 'Cross-site state-changing request',
    category: 'CSRF',
    expectedStatus: 403,
    expectedDecision: 'CROSS_ORIGIN_CSRF_REJECTED',
  },
  {
    id: 'S05-14',
    description: 'CSRF against authenticated endpoint',
    category: 'CSRF',
    expectedStatus: 403,
    expectedDecision: 'CUSTOM_HEADER_MISSING_REJECTED',
  },
  {
    id: 'S05-15',
    description: 'JWT in URL',
    category: 'CREDENTIALS',
    expectedStatus: 400,
    expectedDecision: 'CREDENTIAL_IN_URL_REJECTED',
  },
  {
    id: 'S05-16',
    description: 'Refresh token in URL',
    category: 'CREDENTIALS',
    expectedStatus: 400,
    expectedDecision: 'CREDENTIAL_IN_URL_REJECTED',
  },
  {
    id: 'S05-17',
    description: 'Authentication secret in logs',
    category: 'CREDENTIALS',
    expectedStatus: 200,
    expectedDecision: 'LOG_SECRET_REDACTED',
  },
  {
    id: 'S05-18',
    description: 'Authentication secret in error response',
    category: 'CREDENTIALS',
    expectedStatus: 400,
    expectedDecision: 'ERROR_SECRET_REDACTED',
  },
  {
    id: 'S05-19',
    description: 'Private WX response publicly cached',
    category: 'CACHE',
    expectedStatus: 400,
    expectedDecision: 'PUBLIC_CACHE_PROHIBITED',
  },
  {
    id: 'S05-20',
    description: 'Logout response cached',
    category: 'CACHE',
    expectedStatus: 400,
    expectedDecision: 'CACHE_CONTROL_REQUIRED',
  },
  {
    id: 'S05-21',
    description: 'Sensitive page retained through browser cache',
    category: 'CACHE',
    expectedStatus: 400,
    expectedDecision: 'NO_STORE_REQUIRED',
  },
  {
    id: 'S05-22',
    description: 'Referrer leaks protected path',
    category: 'REFERRER_CAPABILITIES',
    expectedStatus: 400,
    expectedDecision: 'PERMISSIVE_REFERRER_REJECTED',
  },
  {
    id: 'S05-23',
    description: 'Arbitrary browser capability access',
    category: 'REFERRER_CAPABILITIES',
    expectedStatus: 403,
    expectedDecision: 'CAPABILITY_BLOCKED',
  },
  {
    id: 'S05-24',
    description: 'Unauthorized cross-origin resource loading',
    category: 'CORS_ORIGIN',
    expectedStatus: 403,
    expectedDecision: 'CROSS_ORIGIN_RESOURCE_BLOCKED',
  },
  {
    id: 'S05-25',
    description: 'GX iframe attempts WX embedding',
    category: 'FRAMING',
    expectedStatus: 403,
    expectedDecision: 'WX_FRAMING_BLOCKED',
  },
  {
    id: 'S05-26',
    description: 'Foreign origin calls authenticated API',
    category: 'CORS_ORIGIN',
    expectedStatus: 403,
    expectedDecision: 'UNTRUSTED_ORIGIN_REJECTED',
  },
  {
    id: 'S05-27',
    description: 'Admin origin calls WX API',
    category: 'CORS_ORIGIN',
    expectedStatus: 403,
    expectedDecision: 'PLANE_BOUNDARY_REJECTED',
  },
  {
    id: 'S05-28',
    description: 'WX origin calls ADMIN API',
    category: 'CORS_ORIGIN',
    expectedStatus: 403,
    expectedDecision: 'PLANE_BOUNDARY_REJECTED',
  },
  {
    id: 'S05-29',
    description: 'CSP regression during build',
    category: 'POLICY_INTEGRITY',
    expectedStatus: 500,
    expectedDecision: 'BUILD_CSP_REGRESSION',
  },
  {
    id: 'S05-30',
    description: 'Security headers missing from API',
    category: 'POLICY_INTEGRITY',
    expectedStatus: 500,
    expectedDecision: 'SECURITY_HEADERS_MISSING',
  },
  {
    id: 'S05-31',
    description: 'Security headers missing from web',
    category: 'POLICY_INTEGRITY',
    expectedStatus: 500,
    expectedDecision: 'SECURITY_HEADERS_MISSING',
  },
  {
    id: 'S05-32',
    description: 'Duplicate/conflicting CSP headers',
    category: 'POLICY_INTEGRITY',
    expectedStatus: 500,
    expectedDecision: 'CONFLICTING_CSP',
  },
  {
    id: 'S05-33',
    description: 'Weak HSTS configuration',
    category: 'TRANSPORT',
    expectedStatus: 400,
    expectedDecision: 'HSTS_INVALID',
  },
  {
    id: 'S05-34',
    description: 'X-Content-Type-Options missing',
    category: 'MIME',
    expectedStatus: 400,
    expectedDecision: 'NOSNIFF_MISSING',
  },
  {
    id: 'S05-35',
    description: 'Clickjacking regression',
    category: 'FRAMING',
    expectedStatus: 400,
    expectedDecision: 'XFO_INVALID',
  },
  {
    id: 'S05-36',
    description: 'Credential cookie lacks Secure',
    category: 'CREDENTIALS',
    expectedStatus: 400,
    expectedDecision: 'COOKIE_SECURE_MISSING',
  },
  {
    id: 'S05-37',
    description: 'Credential cookie lacks HttpOnly where applicable',
    category: 'CREDENTIALS',
    expectedStatus: 400,
    expectedDecision: 'COOKIE_HTTPONLY_MISSING',
  },
  {
    id: 'S05-38',
    description: 'Unsafe SameSite configuration',
    category: 'CREDENTIALS',
    expectedStatus: 400,
    expectedDecision: 'UNSAFE_SAMESITE_COOKIE_REJECTED',
  },
  {
    id: 'S05-39',
    description: 'Browser Back exposes protected cached state',
    category: 'CACHE',
    expectedStatus: 400,
    expectedDecision: 'NO_STORE_REQUIRED',
  },
  {
    id: 'S05-40',
    description: 'Direct API request bypassing browser controls',
    category: 'POLICY_INTEGRITY',
    expectedStatus: 200,
    expectedDecision: 'AUTH_AUTHZ_ENFORCED',
  },
] as const;

export * from '../../../common/security/s-05-transport-browser.contract';
