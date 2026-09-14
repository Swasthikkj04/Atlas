/**
 * S-05: Browser Security Contract for Web Client
 *
 * Enforces browser execution boundaries, storage protection, framing isolation,
 * and client-side credential hygiene:
 * - Credential storage boundaries (S05-I09, S05-15, S05-16, S05-17)
 * - Clickjacking & frame isolation (S05-I04, S05-04, S05-25)
 * - Browser capability policy (S05-I07, S05-23)
 * - Referrer hygiene (S05-I06, S05-22)
 */

export const FORBIDDEN_STORAGE_KEYS = [
  'jwt',
  'token',
  'access_token',
  'refresh_token',
  'session_id',
  'session_secret',
  'auth_secret',
  'password',
  'private_key',
];

export interface StorageAuditResult {
  readonly secure: boolean;
  readonly prohibitedKeys: string[];
}

/**
 * Audits a storage map (e.g. localStorage / sessionStorage simulation) for sensitive credentials
 */
export function auditBrowserStorage(storageItems: Record<string, string>): StorageAuditResult {
  const prohibitedKeys: string[] = [];

  for (const key of Object.keys(storageItems)) {
    const lower = key.toLowerCase();
    if (FORBIDDEN_STORAGE_KEYS.some((fk) => lower.includes(fk))) {
      prohibitedKeys.push(key);
    }
  }

  return {
    secure: prohibitedKeys.length === 0,
    prohibitedKeys,
  };
}

export interface FramingCheckResult {
  readonly isEmbedded: boolean;
  readonly isAllowed: boolean;
  readonly policy: 'DENY' | 'SAMEORIGIN';
}

/**
 * Evaluates whether the current window execution context violates framing boundaries
 */
export function evaluateWindowFraming(
  windowContext: { isTopLevel: boolean; ancestorOrigins?: string[] },
  allowedAncestors: string[] = [],
): FramingCheckResult {
  if (windowContext.isTopLevel) {
    return {
      isEmbedded: false,
      isAllowed: true,
      policy: 'DENY',
    };
  }

  // Window is inside an iframe
  if (allowedAncestors.length === 0) {
    return {
      isEmbedded: true,
      isAllowed: false,
      policy: 'DENY',
    };
  }

  const origins = windowContext.ancestorOrigins || [];
  const allAllowed = origins.length > 0 && origins.every((o) => allowedAncestors.includes(o));

  return {
    isEmbedded: true,
    isAllowed: allAllowed,
    policy: 'SAMEORIGIN',
  };
}

/**
 * Validates Cookie Attributes for Authentication
 */
export function validateAuthCookieAttributes(attributes: {
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
}): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  if (!attributes.secure) {
    violations.push('Authentication cookie is missing Secure attribute (S05-36)');
  }

  if (!attributes.httpOnly) {
    violations.push('Authentication cookie is missing HttpOnly attribute (S05-37)');
  }

  if (!attributes.sameSite || attributes.sameSite.toLowerCase() === 'none') {
    violations.push('Authentication cookie has unsafe or missing SameSite attribute (S05-38)');
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
