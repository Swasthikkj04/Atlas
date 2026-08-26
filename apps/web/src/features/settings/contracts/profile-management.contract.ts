/**
 * Authoritative Profile & Account Management Contract (AX-103).
 *
 * Enforces validation, input sanitization, and security boundaries
 * for user profile updates.
 */

export interface ProfileValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
  readonly sanitizedFullName?: string;
}

/**
 * Validates and sanitizes a user profile full name input.
 *
 * Rules:
 * - Must be a string
 * - Cannot be empty or only whitespace
 * - Minimum length: 2 characters
 * - Maximum length: 100 characters
 * - Internal duplicate whitespaces are collapsed
 */
export function validateProfileFullName(rawFullName: unknown): ProfileValidationResult {
  if (typeof rawFullName !== 'string') {
    return {
      isValid: false,
      error: 'Full name must be a text value.',
    };
  }

  const trimmed = rawFullName.trim().replace(/\s+/g, ' ');

  if (!trimmed || trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Full name cannot be empty.',
    };
  }

  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: 'Full name must be at least 2 characters.',
    };
  }

  if (trimmed.length > 100) {
    return {
      isValid: false,
      error: 'Full name must not exceed 100 characters.',
    };
  }

  return {
    isValid: true,
    sanitizedFullName: trimmed,
  };
}

/**
 * Ten Certified P0 Profile Management Hard Invariants (AX-103).
 */
export const PROFILE_MANAGEMENT_HARD_INVARIANTS = [
  'NO_UNAUTHORIZED_PROFILE_MUTATION',
  'NO_MASS_ASSIGNMENT_PROFILE_UPDATE',
  'NO_EMAIL_CHANGE_WITHOUT_VERIFICATION',
  'NO_ACCOUNT_STATUS_MUTATION_FROM_PROFILE',
  'NO_MOCKED_PROFILE_DATA',
  'NO_FRONTEND_ONLY_PROFILE_STATE',
  'NO_STALE_WORKSPACE_IDENTITY_AFTER_UPDATE',
  'NO_SENSITIVE_FIELD_EXPOSURE',
  'NO_UNAUTHENTICATED_PROFILE_UPDATE',
  'NO_BROKEN_SETTINGS_ACCOUNT_ROUTE',
] as const;
