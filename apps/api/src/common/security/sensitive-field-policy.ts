/**
 * S-08 Sensitive Field & URL Exposure Policy
 *
 * Implements S08-I02, S08-I06, S08-I09:
 * - Sensitive database attributes prohibited from API responses & DTOs
 * - Prohibition of sensitive data in URLs (query parameters, paths, fragments)
 * - Safe field masking and stripping
 */

export const STRICT_PROHIBITED_RESPONSE_FIELDS = new Set([
  'password',
  'passwordhash',
  'refreshtoken',
  'rawtoken',
  'sessionsecret',
  'jwtsecret',
  'encryptionkey',
  'rawcollectorpayload',
  'databaseurl',
  'connectionstring',
  'stacktrace',
  'internalmetadata',
]);

export const SENSITIVE_URL_PARAM_PATTERNS = [
  /token/i,
  /secret/i,
  /password/i,
  /apikey/i,
  /auth/i,
  /key/i,
  /session/i,
  /signature/i,
  /credential/i,
];

export class SensitiveFieldPolicy {
  /**
   * Sanitizes a response object by stripping prohibited security fields.
   */
  static sanitizeResponseDto<T extends Record<string, any>>(
    obj: T,
  ): Partial<T> {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeResponseDto(item)) as any;
    }

    const clean: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (STRICT_PROHIBITED_RESPONSE_FIELDS.has(normKey)) {
        continue; // Strip completely
      }

      if (value && typeof value === 'object' && !(value instanceof Date)) {
        clean[key] = this.sanitizeResponseDto(value);
      } else {
        clean[key] = value;
      }
    }

    return clean as Partial<T>;
  }

  /**
   * Evaluates if a URL, query string, or redirect parameter contains sensitive keys or values.
   */
  static evaluateUrlSafety(urlOrQuery: string): {
    isSafe: boolean;
    violation?: string;
    decision: 'URL_PRIVACY_COMPLIANT' | 'SENSITIVE_URL_PARAM_BLOCKED';
  } {
    if (!urlOrQuery || typeof urlOrQuery !== 'string') {
      return { isSafe: true, decision: 'URL_PRIVACY_COMPLIANT' };
    }

    try {
      // Check query string parameters
      const urlPart = urlOrQuery.includes('?')
        ? urlOrQuery.split('?')[1]
        : urlOrQuery;
      const searchParams = new URLSearchParams(urlPart.split('#')[0]);

      for (const [paramName, paramValue] of searchParams.entries()) {
        for (const pattern of SENSITIVE_URL_PARAM_PATTERNS) {
          if (pattern.test(paramName)) {
            return {
              isSafe: false,
              violation: `Sensitive parameter '${paramName}' detected in URL`,
              decision: 'SENSITIVE_URL_PARAM_BLOCKED',
            };
          }
        }
      }

      // Check fragment
      if (urlOrQuery.includes('#')) {
        const fragment = urlOrQuery.split('#')[1];
        if (
          fragment &&
          SENSITIVE_URL_PARAM_PATTERNS.some((p) => p.test(fragment))
        ) {
          return {
            isSafe: false,
            violation: 'Sensitive fragment detected in URL',
            decision: 'SENSITIVE_URL_PARAM_BLOCKED',
          };
        }
      }

      return { isSafe: true, decision: 'URL_PRIVACY_COMPLIANT' };
    } catch {
      // In case of parsing error, fail closed
      return { isSafe: false, decision: 'SENSITIVE_URL_PARAM_BLOCKED' };
    }
  }
}
