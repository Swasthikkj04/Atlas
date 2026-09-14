/**
 * S-04 Canonical Security Error Contract
 */

export interface CanonicalSecurityError {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

export const SECURITY_ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_DOMAIN: 'INVALID_DOMAIN',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  UNSUPPORTED_FIELD: 'UNSUPPORTED_FIELD',
  INJECTION_DETECTED: 'INJECTION_DETECTED',
  MASS_ASSIGNMENT_DENIED: 'MASS_ASSIGNMENT_DENIED',
  FORBIDDEN_SECURITY_FIELD: 'FORBIDDEN_SECURITY_FIELD',
  EXCESSIVE_NESTING: 'EXCESSIVE_NESTING',
  ARRAY_TOO_LARGE: 'ARRAY_TOO_LARGE',
  STRING_TOO_LONG: 'STRING_TOO_LONG',
  TYPE_MISMATCH: 'TYPE_MISMATCH',
} as const;

export function formatSecurityError(
  code: keyof typeof SECURITY_ERROR_CODES | string,
  message: string,
  details?: unknown,
): CanonicalSecurityError {
  return {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}
