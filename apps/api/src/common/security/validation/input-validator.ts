/**
 * S-04 Input Validator, Type Enforcement & Security Field Guard
 */

export const FORBIDDEN_SECURITY_FIELDS = [
  'userId',
  'ownerId',
  'tenantId',
  'workspaceId',
  'sessionId',
  'role',
  'permissions',
  'plane',
  'identity',
  'isAdmin',
] as const;

export const FORBIDDEN_ORM_OPERATORS = [
  'OR',
  'AND',
  'NOT',
  'contains',
  'startsWith',
  'endsWith',
  'equals',
  'in',
  'notIn',
  'lt',
  'lte',
  'gt',
  'gte',
  'raw',
  'sql',
  'where',
] as const;

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RFC5322_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Checks whether payload contains forbidden client-supplied security fields.
 */
export function containsForbiddenSecurityFields(payload: unknown): {
  found: boolean;
  field?: string;
} {
  if (payload === null || typeof payload !== 'object') {
    return { found: false };
  }

  const obj = payload as Record<string, any>;
  for (const field of FORBIDDEN_SECURITY_FIELDS) {
    if (field in obj && obj[field] !== undefined) {
      return { found: true, field };
    }
  }

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const nested = containsForbiddenSecurityFields(obj[key]);
      if (nested.found) {
        return nested;
      }
    }
  }

  return { found: false };
}

/**
 * Checks whether payload contains forbidden ORM operator injection structures.
 */
export function containsForbiddenOrmOperators(payload: unknown): {
  found: boolean;
  operator?: string;
} {
  if (payload === null || typeof payload !== 'object') {
    return { found: false };
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const res = containsForbiddenOrmOperators(item);
      if (res.found) return res;
    }
    return { found: false };
  }

  const obj = payload as Record<string, any>;
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_ORM_OPERATORS.includes(key as any)) {
      return { found: true, operator: key };
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const nested = containsForbiddenOrmOperators(obj[key]);
      if (nested.found) return nested;
    }
  }

  return { found: false };
}

/**
 * Strictly validates UUID v4 format.
 */
export function isValidUuid(id: unknown): boolean {
  if (typeof id !== 'string') return false;
  return UUID_V4_REGEX.test(id);
}

/**
 * Strictly validates RFC 5322 email syntax and length.
 */
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  if (email.length > 254 || email.length < 3) return false;
  return RFC5322_EMAIL_REGEX.test(email);
}

/**
 * Validates against mass-assignment by checking for unallowed keys against a strict allowlist.
 */
export function validateAgainstMassAssignment<T extends string>(
  payload: Record<string, any>,
  allowedKeys: readonly T[],
): {
  valid: boolean;
  unallowedKeys: string[];
} {
  if (!payload || typeof payload !== 'object') {
    return { valid: true, unallowedKeys: [] };
  }

  const keys = Object.keys(payload);
  const unallowedKeys = keys.filter((k) => !allowedKeys.includes(k as T));

  return {
    valid: unallowedKeys.length === 0,
    unallowedKeys,
  };
}
