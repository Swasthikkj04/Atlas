/**
 * S-05: CSRF Protection Policy & Boundary Evaluator
 *
 * Enforces fail-closed CSRF defenses across state-changing operations (POST, PUT, PATCH, DELETE):
 * - Multi-layered CSRF defense (S05-I10, S05-13, S05-14)
 * - Origin & Referer header verification
 * - Custom header enforcement (X-Requested-With, x-csrf-token)
 * - SameSite Cookie Isolation (Strict / Lax)
 */

export interface CsrfProtectionConfig {
  readonly allowedOrigins: string[];
  readonly enforceCustomHeader: boolean;
  readonly cookieSameSite: 'strict' | 'lax' | 'none';
  readonly cookieSecure: boolean;
  readonly cookieHttpOnly: boolean;
}

export const DEFAULT_CSRF_CONFIG: CsrfProtectionConfig = {
  allowedOrigins: [
    'https://argonion.com',
    'https://www.argonion.com',
    'https://app.argonion.com',
    'https://nebula.argonion.com',
  ],
  enforceCustomHeader: true,
  cookieSameSite: 'lax',
  cookieSecure: true,
  cookieHttpOnly: true,
};

export const STATE_CHANGING_METHODS = new Set([
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]);

export interface CsrfEvaluationResult {
  readonly valid: boolean;
  readonly httpStatus: number;
  readonly reason?: string;
  readonly decision:
    | 'SAFE_METHOD_ALLOWED'
    | 'BEARER_AUTH_ALLOWED'
    | 'CSRF_VALIDATED'
    | 'CROSS_ORIGIN_CSRF_REJECTED'
    | 'MISSING_ORIGIN_HEADER_REJECTED'
    | 'CUSTOM_HEADER_MISSING_REJECTED'
    | 'UNSAFE_SAMESITE_COOKIE_REJECTED';
}

/**
 * Evaluates whether an incoming HTTP request satisfies Nebula's CSRF boundary controls
 */
export function evaluateCsrfProtection(
  request: {
    method: string;
    origin?: string | null;
    referer?: string | null;
    headers?: Record<string, string | undefined>;
    hasAuthHeader?: boolean;
    cookieSameSite?: string;
    cookieSecure?: boolean;
    isApiRequest?: boolean;
  },
  config: CsrfProtectionConfig = DEFAULT_CSRF_CONFIG,
): CsrfEvaluationResult {
  const method = request.method.toUpperCase();

  // 1. Safe idempotent methods (GET, HEAD, OPTIONS) do not alter server state
  if (!STATE_CHANGING_METHODS.has(method)) {
    return {
      valid: true,
      httpStatus: 200,
      decision: 'SAFE_METHOD_ALLOWED',
    };
  }

  // 2. Bearer token in Authorization header (custom header not automatically attached by browser cross-origin forms)
  if (request.hasAuthHeader || request.headers?.['authorization']) {
    return {
      valid: true,
      httpStatus: 200,
      decision: 'BEARER_AUTH_ALLOWED',
    };
  }

  // 3. Cookie configuration validation (S05-36, S05-37, S05-38)
  if (
    request.cookieSameSite &&
    ['none'].includes(request.cookieSameSite.toLowerCase())
  ) {
    return {
      valid: false,
      httpStatus: 403,
      reason:
        'Unsafe SameSite=None cookie configuration detected without strict partitioning (S05-38)',
      decision: 'UNSAFE_SAMESITE_COOKIE_REJECTED',
    };
  }

  // 4. Origin / Referer Verification for Browser State Changes (S05-13, S05-14)
  const origin = request.origin?.trim() || null;
  const referer = request.referer?.trim() || null;

  if (origin) {
    if (!config.allowedOrigins.includes(origin)) {
      return {
        valid: false,
        httpStatus: 403,
        reason: `CSRF rejected: Request Origin '${origin}' does not match allowed origins (S05-13, S05-14)`,
        decision: 'CROSS_ORIGIN_CSRF_REJECTED',
      };
    }
  } else if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = refererUrl.origin;
      if (!config.allowedOrigins.includes(refererOrigin)) {
        return {
          valid: false,
          httpStatus: 403,
          reason: `CSRF rejected: Referer '${refererOrigin}' does not match allowed origins (S05-13, S05-14)`,
          decision: 'CROSS_ORIGIN_CSRF_REJECTED',
        };
      }
    } catch {
      return {
        valid: false,
        httpStatus: 403,
        reason: 'CSRF rejected: Invalid Referer URL format (S05-14)',
        decision: 'CROSS_ORIGIN_CSRF_REJECTED',
      };
    }
  }

  // 5. Custom header check (X-Requested-With / x-csrf-token / application/json)
  if (config.enforceCustomHeader) {
    const headers = request.headers || {};
    const normHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      if (v) normHeaders[k.toLowerCase()] = v;
    }

    const hasCsrfToken = !!normHeaders['x-csrf-token'];
    const hasRequestedWith = !!normHeaders['x-requested-with'];
    const hasJsonContent =
      normHeaders['content-type']?.includes('application/json');

    if (!hasCsrfToken && !hasRequestedWith && !hasJsonContent) {
      return {
        valid: false,
        httpStatus: 403,
        reason:
          'CSRF rejected: Missing required custom header or JSON content-type (S05-14)',
        decision: 'CUSTOM_HEADER_MISSING_REJECTED',
      };
    }
  }

  return {
    valid: true,
    httpStatus: 200,
    decision: 'CSRF_VALIDATED',
  };
}
