/**
 * Authoritative Password Management & Credential Security Contract (AX-104).
 *
 * Enforces validation, confirmation matching, and security boundaries
 * for authenticated password changes.
 */

export interface PasswordChangeInput {
  readonly currentPassword?: string;
  readonly newPassword?: string;
  readonly confirmPassword?: string;
}

export interface PasswordChangeValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
  readonly fieldErrors?: {
    readonly currentPassword?: string;
    readonly newPassword?: string;
    readonly confirmPassword?: string;
  };
}

/**
 * Validates the password change form input on the client side.
 * Note: Backend remains authoritative for full security policy enforcement.
 */
export function validatePasswordChangeInput(
  input: PasswordChangeInput,
): PasswordChangeValidationResult {
  const currentPassword = input.currentPassword?.trim() || '';
  const newPassword = input.newPassword || '';
  const confirmPassword = input.confirmPassword || '';

  const fieldErrors: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  } = {};

  if (!currentPassword) {
    fieldErrors.currentPassword = 'Current password is required.';
  }

  if (!newPassword) {
    fieldErrors.newPassword = 'New password is required.';
  } else if (newPassword.length < 8) {
    fieldErrors.newPassword = 'New password must be at least 8 characters.';
  } else if (newPassword.length > 128) {
    fieldErrors.newPassword = 'New password must not exceed 128 characters.';
  } else if (currentPassword && newPassword === currentPassword) {
    fieldErrors.newPassword = 'New password must be different from current password.';
  }

  if (!confirmPassword) {
    fieldErrors.confirmPassword = 'Password confirmation is required.';
  } else if (newPassword && newPassword !== confirmPassword) {
    fieldErrors.confirmPassword = 'Passwords do not match.';
  }

  const hasErrors = Object.keys(fieldErrors).length > 0;

  return {
    isValid: !hasErrors,
    error: hasErrors
      ? fieldErrors.currentPassword ||
        fieldErrors.newPassword ||
        fieldErrors.confirmPassword
      : undefined,
    fieldErrors: hasErrors ? fieldErrors : undefined,
  };
}

/**
 * Twelve Certified P0 Password Management Hard Invariants (AX-104).
 */
export const PASSWORD_MANAGEMENT_HARD_INVARIANTS = [
  'NO_UNAUTHENTICATED_PASSWORD_CHANGE',
  'NO_CLIENT_SELECTED_USER_ID',
  'NO_PLAINTEXT_PASSWORD_PERSISTENCE',
  'NO_PLAINTEXT_PASSWORD_LOGGING',
  'NO_FRONTEND_HASHING',
  'ARGON2_REUSE',
  'CURRENT_PASSWORD_REQUIRED',
  'PASSWORD_POLICY_BACKEND_AUTHORITATIVE',
  'SESSION_SECURITY_AFTER_PASSWORD_CHANGE',
  'NO_PARTIAL_CREDENTIAL_UPDATE',
  'NO_PASSWORD_DATA_IN_RESPONSE',
  'NO_MOCKED_SECURITY_BEHAVIOR',
] as const;
