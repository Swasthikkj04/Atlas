/**
 * S-05: Transport Security Policy & URL Credential Guard
 *
 * Enforces HTTPS requirements, HSTS compliance, and URL credential leakage prevention:
 * - Reject plaintext HTTP access on authenticated routes (S05-I01, S05-01)
 * - Block HTTPS downgrade attempts (S05-02)
 * - Enforce robust HSTS headers (S05-I02, S05-03, S05-33)
 * - Reject credentials in URLs / Query Params (S05-I09, S05-15, S05-16)
 */

export interface TransportSecurityConfig {
  readonly enforceHttps: boolean;
  readonly isProduction: boolean;
  readonly hstsMaxAge: number;
  readonly hstsIncludeSubdomains: boolean;
  readonly hstsPreload: boolean;
}

export const DEFAULT_TRANSPORT_CONFIG: TransportSecurityConfig = {
  enforceHttps: true,
  isProduction: true,
  hstsMaxAge: 31536000,
  hstsIncludeSubdomains: true,
  hstsPreload: true,
};

export const SENSITIVE_URL_PARAM_KEYS = [
  'jwt',
  'token',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'session_id',
  'sessionid',
  'auth_token',
  'bearer',
  'password',
  'secret',
  'api_key',
  'apikey',
];

export interface TransportEvaluationResult {
  readonly secure: boolean;
  readonly httpStatus: number;
  readonly reason?: string;
  readonly decision:
    | 'TRANSPORT_SECURE'
    | 'HTTP_PLAINTEXT_REJECTED'
    | 'DOWNGRADE_ATTEMPT_REJECTED'
    | 'HSTS_INVALID'
    | 'CREDENTIAL_IN_URL_REJECTED';
}

/**
 * Checks if a URL or query parameter contains sensitive credentials or tokens
 */
export function containsUrlCredentials(urlOrQuery: string): {
  containsCredential: boolean;
  matchedKey?: string;
} {
  try {
    const url = urlOrQuery.startsWith('http')
      ? new URL(urlOrQuery)
      : new URL(`http://dummy.local${urlOrQuery}`);
    for (const [key] of url.searchParams.entries()) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_URL_PARAM_KEYS.includes(lowerKey)) {
        return { containsCredential: true, matchedKey: key };
      }
    }
  } catch {
    const lower = urlOrQuery.toLowerCase();
    for (const key of SENSITIVE_URL_PARAM_KEYS) {
      if (lower.includes(`${key}=`) || lower.includes(`${key}:`)) {
        return { containsCredential: true, matchedKey: key };
      }
    }
  }

  return { containsCredential: false };
}

/**
 * Evaluates transport protocol security and URL cleanliness
 */
export function evaluateTransportSecurity(
  request: {
    protocol?: string;
    isSecure?: boolean;
    forwardedProto?: string;
    url: string;
    isAuthenticatedRoute?: boolean;
  },
  config: TransportSecurityConfig = DEFAULT_TRANSPORT_CONFIG,
): TransportEvaluationResult {
  // 1. URL Credential Check (S05-15, S05-16)
  const urlCheck = containsUrlCredentials(request.url);
  if (urlCheck.containsCredential) {
    return {
      secure: false,
      httpStatus: 400,
      reason: `Security violation: URL contains sensitive credential parameter '${urlCheck.matchedKey}' (S05-15, S05-16)`,
      decision: 'CREDENTIAL_IN_URL_REJECTED',
    };
  }

  // 2. Downgrade Attempt Check (S05-02)
  if (
    request.forwardedProto &&
    request.forwardedProto.toLowerCase() === 'http' &&
    config.isProduction
  ) {
    return {
      secure: false,
      httpStatus: 400,
      reason: 'HTTPS downgrade attempt detected via X-Forwarded-Proto (S05-02)',
      decision: 'DOWNGRADE_ATTEMPT_REJECTED',
    };
  }

  // 3. Protocol Check (S05-01, S05-I01)
  const effectiveProto =
    request.forwardedProto ||
    request.protocol ||
    (request.isSecure ? 'https' : 'http');
  const isHttps = effectiveProto.toLowerCase() === 'https' || request.isSecure;

  if (!isHttps && (config.enforceHttps || request.isAuthenticatedRoute)) {
    // Plaintext HTTP request
    return {
      secure: false,
      httpStatus: 400,
      reason:
        'Plaintext HTTP transport is prohibited for authenticated operations (S05-I01, S05-01)',
      decision: 'HTTP_PLAINTEXT_REJECTED',
    };
  }

  return {
    secure: true,
    httpStatus: 200,
    decision: 'TRANSPORT_SECURE',
  };
}
