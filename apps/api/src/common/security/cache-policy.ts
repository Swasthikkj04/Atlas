/**
 * S-05: Cache Isolation Policy & Sensitive Route Guard
 *
 * Enforces strict cache control across authenticated, session, and workspace routes:
 * - Prevents public caching of private workspace responses (S05-I11, S05-19)
 * - Prevents caching of logout & session revocation responses (S05-20)
 * - Controls sensitive page retention and browser history cache (S05-21, S05-39)
 */

export interface CacheIsolationHeaders {
  'Cache-Control': string;
  Pragma?: string;
  Expires?: string;
}

export const SENSITIVE_CACHE_CONTROL_HEADER =
  'private, no-cache, no-store, must-revalidate';

export const SENSITIVE_CACHE_HEADERS: CacheIsolationHeaders = {
  'Cache-Control': SENSITIVE_CACHE_CONTROL_HEADER,
  Pragma: 'no-cache',
  Expires: '0',
};

export const PUBLIC_STATIC_CACHE_CONTROL =
  'public, max-age=31536000, immutable';

export interface CacheEvaluationResult {
  readonly compliant: boolean;
  readonly isSensitive: boolean;
  readonly headers: CacheIsolationHeaders;
  readonly violations: string[];
}

/**
 * Determines whether a route or endpoint handles sensitive / authenticated data
 */
export function isSensitiveCacheRoute(
  path: string,
  isAuthenticated: boolean = true,
): boolean {
  if (isAuthenticated) return true;
  const lower = path.toLowerCase();
  const sensitiveKeywords = [
    '/auth',
    '/session',
    '/workspace',
    '/user',
    '/admin',
    '/logout',
    '/settings',
    '/profile',
    '/token',
    '/refresh',
    '/domains',
    '/findings',
  ];
  return sensitiveKeywords.some((kw) => lower.includes(kw));
}

/**
 * Evaluates cache header compliance on an HTTP response
 */
export function evaluateCacheIsolation(
  path: string,
  responseHeaders: Record<string, string | undefined>,
  isAuthenticated: boolean = true,
): CacheEvaluationResult {
  const isSensitive = isSensitiveCacheRoute(path, isAuthenticated);
  const violations: string[] = [];

  const normHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(responseHeaders)) {
    if (v) normHeaders[k.toLowerCase()] = v;
  }

  const cacheControl = normHeaders['cache-control'] || '';

  if (isSensitive) {
    if (!cacheControl) {
      violations.push(
        'Sensitive response is missing Cache-Control header (S05-I11)',
      );
    } else {
      if (cacheControl.includes('public')) {
        violations.push(
          'Sensitive workspace/session response is marked as "public" cache (S05-19)',
        );
      }
      if (!cacheControl.includes('no-store')) {
        violations.push(
          'Sensitive workspace/session response is missing "no-store" directive (S05-21, S05-39)',
        );
      }
      if (!cacheControl.includes('no-cache')) {
        violations.push(
          'Sensitive response missing "no-cache" directive (S05-I11)',
        );
      }
    }
  }

  return {
    compliant: violations.length === 0,
    isSensitive,
    headers: isSensitive
      ? SENSITIVE_CACHE_HEADERS
      : { 'Cache-Control': 'public, max-age=3600' },
    violations,
  };
}
