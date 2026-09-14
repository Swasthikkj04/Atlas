/**
 * S-05: CORS Policy & Origin Boundary Evaluator
 *
 * Enforces explicit origin verification, credential security, and plane-isolated CORS boundaries:
 * - Reject wildcard '*' for credential-bearing APIs (S05-I08, S05-09)
 * - Reject untrusted origin reflection (S05-10)
 * - Enforce explicit allowlist matching (S05-11, S05-26)
 * - Enforce plane isolation across GX, WX, and ADMIN (S05-27, S05-28)
 */

export interface CorsConfiguration {
  readonly allowedOrigins: string[];
  readonly allowCredentials: boolean;
  readonly allowedMethods: string[];
  readonly allowedHeaders: string[];
  readonly exposedHeaders: string[];
  readonly maxAge: number;
}

export const DEFAULT_ALLOWED_METHODS = [
  'GET',
  'HEAD',
  'PUT',
  'PATCH',
  'POST',
  'DELETE',
  'OPTIONS',
];

export const DEFAULT_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'x-csrf-token',
  'x-requested-with',
  'x-correlation-id',
  'x-request-id',
  'Accept',
  'Origin',
];

export const DEFAULT_EXPOSED_HEADERS = [
  'X-Correlation-ID',
  'X-Request-ID',
  'Location',
];

export const DEFAULT_CORS_CONFIG: CorsConfiguration = {
  allowedOrigins: [
    'https://argonion.com',
    'https://www.argonion.com',
    'https://app.argonion.com',
    'https://nebula.argonion.com',
  ],
  allowCredentials: true,
  allowedMethods: DEFAULT_ALLOWED_METHODS,
  allowedHeaders: DEFAULT_ALLOWED_HEADERS,
  exposedHeaders: DEFAULT_EXPOSED_HEADERS,
  maxAge: 86400,
};

export interface CorsEvaluationResult {
  readonly allowed: boolean;
  readonly httpStatus: number;
  readonly origin: string | null;
  readonly headers: Record<string, string>;
  readonly reason?: string;
  readonly decision:
    | 'ORIGIN_ALLOWED'
    | 'SAME_ORIGIN_ALLOWED'
    | 'NO_ORIGIN_ALLOWED'
    | 'WILDCARD_CREDENTIALS_REJECTED'
    | 'UNTRUSTED_ORIGIN_REJECTED'
    | 'FOREIGN_ORIGIN_REJECTED'
    | 'PLANE_BOUNDARY_REJECTED';
}

/**
 * Evaluates an incoming origin and method against CORS policy and generates appropriate headers
 */
export function evaluateCorsRequest(
  request: {
    origin?: string | null;
    method?: string;
    requestHeaders?: string[];
    isCredentialed?: boolean;
    targetPlane?: 'GX' | 'WX' | 'ADMIN';
    originPlane?: 'GX' | 'WX' | 'ADMIN';
  },
  config: CorsConfiguration = DEFAULT_CORS_CONFIG,
): CorsEvaluationResult {
  const origin = request.origin?.trim() || null;
  const isCredentialed = request.isCredentialed ?? true;

  // 1. Direct server-to-server or non-browser request (no Origin header)
  if (!origin) {
    return {
      allowed: true,
      httpStatus: 200,
      origin: null,
      headers: {},
      decision: 'NO_ORIGIN_ALLOWED',
    };
  }

  // 2. Wildcard with credentials check (S05-09)
  if (
    config.allowedOrigins.includes('*') &&
    (isCredentialed || config.allowCredentials)
  ) {
    return {
      allowed: false,
      httpStatus: 403,
      origin: null,
      headers: {},
      reason:
        'Wildcard origin "*" is prohibited for credentialed requests (S05-I08, S05-09)',
      decision: 'WILDCARD_CREDENTIALS_REJECTED',
    };
  }

  // 3. Exact allowlist matching (S05-10, S05-11, S05-26)
  const isAllowedOrigin = config.allowedOrigins.includes(origin);

  if (!isAllowedOrigin) {
    return {
      allowed: false,
      httpStatus: 403,
      origin: null,
      headers: {},
      reason: `Origin '${origin}' is not present in explicit CORS allowlist (S05-10, S05-26)`,
      decision: 'UNTRUSTED_ORIGIN_REJECTED',
    };
  }

  // 4. Plane isolation cross-origin check (S05-27, S05-28)
  // If targetPlane is ADMIN and originPlane is WX/GX without explicit admin elevation, reject
  if (
    request.targetPlane === 'ADMIN' &&
    request.originPlane &&
    request.originPlane !== 'ADMIN'
  ) {
    return {
      allowed: false,
      httpStatus: 403,
      origin: null,
      headers: {},
      reason: `Plane boundary violation: ${request.originPlane} origin cannot access ADMIN plane APIs directly (S05-28)`,
      decision: 'PLANE_BOUNDARY_REJECTED',
    };
  }

  // 5. Build valid CORS response headers
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': config.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': config.allowedHeaders.join(', '),
    'Access-Control-Expose-Headers': config.exposedHeaders.join(', '),
    'Access-Control-Max-Age': config.maxAge.toString(),
  };

  if (config.allowCredentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return {
    allowed: true,
    httpStatus: 200,
    origin,
    headers,
    decision: 'ORIGIN_ALLOWED',
  };
}
