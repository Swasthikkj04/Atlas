/**
 * S-04 Request Limits & Size Boundary Definition
 */

export const REQUEST_LIMITS = {
  MAX_BODY_SIZE_BYTES: 1024 * 1024, // 1 MB
  MAX_JSON_DEPTH: 10,
  MAX_OBJECT_KEYS: 50,
  MAX_ARRAY_LENGTH: 100,
  MAX_STRING_LENGTH: 4096,
  MAX_EMAIL_LENGTH: 254,
  MAX_DOMAIN_LENGTH: 253,
  MAX_URL_LENGTH: 2048,
  MAX_QUERY_STRING_LENGTH: 2048,
  MAX_SEARCH_QUERY_LENGTH: 100,
} as const;

export function measureJsonDepth(obj: unknown, currentDepth = 1): number {
  if (obj === null || typeof obj !== 'object') {
    return currentDepth;
  }

  if (currentDepth > REQUEST_LIMITS.MAX_JSON_DEPTH + 5) {
    return currentDepth; // Bail early on circular / extreme depth
  }

  let maxChildDepth = currentDepth;
  const values = Array.isArray(obj) ? obj : Object.values(obj);

  for (const val of values) {
    if (val !== null && typeof val === 'object') {
      const d = measureJsonDepth(val, currentDepth + 1);
      if (d > maxChildDepth) {
        maxChildDepth = d;
      }
    }
  }

  return maxChildDepth;
}

export function validatePayloadSizeAndShape(payload: unknown): {
  valid: boolean;
  code?: string;
  message?: string;
} {
  if (payload === undefined || payload === null) {
    return { valid: true };
  }

  // Check JSON depth
  if (typeof payload === 'object') {
    const depth = measureJsonDepth(payload);
    if (depth > REQUEST_LIMITS.MAX_JSON_DEPTH) {
      return {
        valid: false,
        code: 'EXCESSIVE_NESTING',
        message: `JSON nesting depth ${depth} exceeds maximum allowed limit of ${REQUEST_LIMITS.MAX_JSON_DEPTH}.`,
      };
    }
  }

  // Check object property count or array lengths
  if (Array.isArray(payload)) {
    if (payload.length > REQUEST_LIMITS.MAX_ARRAY_LENGTH) {
      return {
        valid: false,
        code: 'ARRAY_TOO_LARGE',
        message: `Array length ${payload.length} exceeds maximum limit of ${REQUEST_LIMITS.MAX_ARRAY_LENGTH}.`,
      };
    }
  } else if (typeof payload === 'object' && payload !== null) {
    const keys = Object.keys(payload);
    if (keys.length > REQUEST_LIMITS.MAX_OBJECT_KEYS) {
      return {
        valid: false,
        code: 'TOO_MANY_PROPERTIES',
        message: `Object property count ${keys.length} exceeds limit of ${REQUEST_LIMITS.MAX_OBJECT_KEYS}.`,
      };
    }
  }

  return { valid: true };
}
