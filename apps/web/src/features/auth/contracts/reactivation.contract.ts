/**
 * Authoritative Account Reactivation & Lifecycle Recovery Contract (AX-112).
 *
 * Enforces the protocol for restoring legitimately deactivated Nebula user accounts
 * without data loss, session contamination, or account recreation.
 */

export interface ReactivationRequestInput {
  readonly email: string;
}

export interface ReactivationConfirmInput {
  readonly token: string;
}

export interface ReactivationValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
}

export function validateReactivationEmail(email?: string | null): ReactivationValidationResult {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email address is required.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }
  return { isValid: true };
}

export function validateReactivationToken(token?: string | null): ReactivationValidationResult {
  if (!token || !token.trim()) {
    return { isValid: false, error: 'Reactivation token is required.' };
  }
  if (token.trim().length < 16) {
    return { isValid: false, error: 'Invalid reactivation token format.' };
  }
  return { isValid: true };
}

/**
 * Certified P0/P1 Invariants for AX-112 Account Reactivation & Lifecycle Recovery.
 */
export const REACTIVATION_HARD_INVARIANTS = [
  'NO_REACTIVATION_WITHOUT_VERIFICATION',
  'NO_RAW_REACTIVATION_TOKEN_STORAGE',
  'NO_REACTIVATION_TOKEN_REUSE',
  'NO_EXPIRED_REACTIVATION_TOKEN',
  'NO_ACCOUNT_ENUMERATION',
  'NO_SILENT_OAUTH_REACTIVATION',
  'NO_OLD_SESSION_REUSE',
  'NO_DUPLICATE_USER_CREATION',
  'NO_HISTORICAL_DATA_LOSS',
  'NO_HISTORICAL_DATA_MUTATION',
  'NO_PARTIAL_REACTIVATION',
  'NO_CROSS_USER_REACTIVATION',
  'NO_TOKEN_LOGGING',
  'NO_UNAUTHORIZED_REACTIVATION',
  'REACTIVATION_RESTORES_SAME_ACCOUNT_IDENTITY',
] as const;
