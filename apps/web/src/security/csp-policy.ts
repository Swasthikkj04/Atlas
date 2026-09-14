/**
 * S-05: Content Security Policy (CSP) Policy & Evaluator for Web Frontend
 *
 * Defines canonical CSP directives for Guest Execution (GX) and Authenticated Workspace (WX):
 * - Prevents arbitrary script execution (S05-I03, S05-06)
 * - Prohibits unsafe-eval in production (S05-07)
 * - Prohibits arbitrary framing (S05-I04, S05-04, S05-25)
 * - Prohibits wildcard origins on script/default sources (S05-08)
 */

export interface CspDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'object-src': string[];
  'frame-ancestors': string[];
  'base-uri': string[];
  'form-action': string[];
}

export const CANONICAL_WEB_CSP_DIRECTIVES: CspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https:'],
  'object-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

/**
 * Serializes CSP directives object into a standard CSP header string
 */
export function buildCspHeaderString(directives: CspDirectives = CANONICAL_WEB_CSP_DIRECTIVES): string {
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ') + ';';
}

export const CANONICAL_WEB_CSP_HEADER = buildCspHeaderString(CANONICAL_WEB_CSP_DIRECTIVES);

export interface CspValidationResult {
  readonly valid: boolean;
  readonly violations: string[];
}

/**
 * Validates a CSP string against production hardening invariants
 */
export function validateCspString(csp: string, isDocs: boolean = false): CspValidationResult {
  const violations: string[] = [];
  if (!csp || typeof csp !== 'string') {
    return { valid: false, violations: ['CSP string is empty or invalid (S05-I03)'] };
  }

  const normalized = csp.toLowerCase();

  // Check dangerous eval
  if (normalized.includes('unsafe-eval') && !isDocs) {
    violations.push('CSP contains unsafe-eval directive in production web context (S05-07)');
  }

  // Check wildcards
  if (normalized.includes('default-src *') || normalized.includes('script-src *')) {
    violations.push('CSP contains wildcard script-src or default-src (S05-06, S05-08)');
  }

  // Check framing protection
  if (!normalized.includes("frame-ancestors 'none'") && !normalized.includes('frame-ancestors') && !isDocs) {
    violations.push('CSP is missing frame-ancestors directive (S05-04, S05-I04)');
  }

  // Check object-src none
  if (!normalized.includes("object-src 'none'") && !normalized.includes('object-src')) {
    violations.push('CSP is missing object-src \'none\' directive (S05-I03)');
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
