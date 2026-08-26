/**
 * Authoritative Account Lifecycle & Data Retention Contract (AX-108).
 *
 * Enforces canonical account lifecycle states, destructive operation confirmation
 * policies, re-authentication requirements, and data retention rules.
 */

export type AccountStatus =
  | 'ACTIVE'
  | 'DEACTIVATED'
  | 'SUSPENDED'
  | 'LOCKED'
  | 'DELETED'
  | 'PENDING_VERIFICATION';

export interface AccountOverview {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly status: AccountStatus;
  readonly hasPassword: boolean;
  readonly connectedProviders: string[];
  readonly activeSessionsCount: number;
  readonly createdAt: string | Date;
}

export interface DeactivateAccountPayload {
  readonly currentPassword?: string;
  readonly confirmText?: string;
}

export interface DeleteAccountPayload {
  readonly currentPassword?: string;
  readonly confirmText: string;
}

/**
 * Format account status into human-friendly badge label and UI severity tone.
 */
export function formatAccountStatus(status: AccountStatus): {
  label: string;
  tone: 'success' | 'warning' | 'destructive' | 'neutral';
} {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Active', tone: 'success' };
    case 'DEACTIVATED':
      return { label: 'Deactivated', tone: 'warning' };
    case 'SUSPENDED':
      return { label: 'Suspended', tone: 'destructive' };
    case 'LOCKED':
      return { label: 'Locked', tone: 'destructive' };
    case 'DELETED':
      return { label: 'Deleted', tone: 'neutral' };
    case 'PENDING_VERIFICATION':
      return { label: 'Pending Verification', tone: 'warning' };
    default:
      return { label: status, tone: 'neutral' };
  }
}

/**
 * Validates whether a destructive confirmation submission is well-formed before dispatching.
 */
export function isLifecycleDestructiveActionAllowed(
  hasPassword: boolean,
  passwordInput: string,
  confirmInput: string,
  requiredConfirmText: string,
): boolean {
  if (hasPassword && (!passwordInput || passwordInput.trim().length === 0)) {
    return false;
  }
  return confirmInput.trim().toUpperCase() === requiredConfirmText.toUpperCase();
}

/**
 * Twelve Certified P0 Account Lifecycle Hard Invariants (AX-108).
 */
export const ACCOUNT_LIFECYCLE_HARD_INVARIANTS = [
  'NO_UNAUTHORIZED_ACCOUNT_LIFECYCLE_CHANGE',
  'NO_CROSS_USER_RESOURCE_DELETION',
  'NO_UNCONFIRMED_DESTRUCTIVE_ACTION',
  'REAUTHENTICATION_REQUIRED_FOR_HIGH_RISK_OPERATION',
  'NO_PARTIAL_ACCOUNT_DELETION',
  'NO_ORPHANED_AUTHENTICATION_IDENTITIES',
  'NO_ACTIVE_SESSION_AFTER_ACCOUNT_TERMINATION',
  'NO_ACCIDENTAL_HISTORICAL_TRUTH_DESTRUCTION',
  'RETENTION_POLICY_IS_EXPLICIT',
  'NO_FAKE_DELETION_SUCCESS',
  'NO_MOCKED_LIFECYCLE_BEHAVIOR',
  'NO_SECURITY_ACTIVITY_UI_FABRICATION',
] as const;
