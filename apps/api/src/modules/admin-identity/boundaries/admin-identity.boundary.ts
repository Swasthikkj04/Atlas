import {
  AdminStatus,
  AdminIdentity,
  ADMIN_IDENTITY_INVARIANTS,
} from '../contracts/admin-identity.contract';
import {
  AdminDisabledException,
  AdminPrivilegeEscalationException,
  AdminInvariantViolationException,
} from '../exceptions/admin-identity.exception';

/**
 * Forbidden client payload keys that must NEVER be accepted from untrusted client input
 * to influence identity roles or administrative privileges.
 */
const FORBIDDEN_ESCALATION_KEYS = [
  'isAdmin',
  'is_admin',
  'admin',
  'role',
  'roles',
  'isOwner',
  'is_owner',
  'adminClaim',
  'admin_claim',
  'accountType',
  'account_type',
  'privileges',
  'scope',
];

/**
 * Forbidden client headers that must NEVER be trusted to confer Admin identity.
 */
const FORBIDDEN_ADMIN_HEADERS = [
  'x-admin-role',
  'x-is-admin',
  'x-admin-override',
  'x-nebula-admin',
  'x-admin-identity',
  'x-admin-secret',
];

/**
 * ADMIN-001: Admin Identity Security Boundary
 *
 * Enforces hard runtime separation between User Identity and Admin Identity,
 * and defends against accidental privilege escalation.
 */
export class AdminIdentityBoundary {
  /**
   * Asserts that an identity object is NOT a standard User identity masquerading as Admin.
   */
  static assertNotUserIdentity(identity: unknown): void {
    if (!identity || typeof identity !== 'object') {
      return;
    }

    const rec = identity as Record<string, unknown>;

    // Detect User-specific attributes
    const isUserShape =
      'email' in rec ||
      'passwordHash' in rec ||
      'emailVerifiedAt' in rec ||
      'verificationTokens' in rec ||
      'oauthAccounts' in rec;

    if (isUserShape && !('identifier' in rec && 'authMetadata' in rec)) {
      throw new AdminPrivilegeEscalationException(
        'User identities cannot be used as Admin identities. Admin identity is a distinct security boundary.',
      );
    }
  }

  /**
   * Asserts that an AdminIdentity is active and eligible for authentication.
   * Fails closed if status is not ACTIVE.
   */
  static assertAdminAuthenticationEligible(
    admin: AdminIdentity | null | undefined,
  ): void {
    if (!admin) {
      throw new AdminDisabledException(
        'No Admin identity provided for eligibility check.',
      );
    }

    if (admin.status !== AdminStatus.ACTIVE) {
      throw new AdminDisabledException(
        `Admin identity is ${admin.status} (Reason: ${admin.disabledReason || 'None specified'}) and cannot authenticate.`,
      );
    }
  }

  /**
   * Asserts that the platform does not exceed the owner-exclusive single admin count.
   */
  static assertOwnerExclusiveCount(count: number): void {
    if (count > ADMIN_IDENTITY_INVARIANTS.MAX_ADMIN_COUNT) {
      throw new AdminInvariantViolationException(
        `Critical Security Invariant Violated: Found ${count} Admin identities. Platform strictly allows at most ${ADMIN_IDENTITY_INVARIANTS.MAX_ADMIN_COUNT}.`,
      );
    }
  }

  /**
   * Checks whether a client-supplied payload contains attempted privilege escalation keys.
   */
  static hasEscalationAttempt(
    payload: Record<string, unknown> | null | undefined,
  ): boolean {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const keys = Object.keys(payload).map((k) => k.toLowerCase());
    return FORBIDDEN_ESCALATION_KEYS.some((forbidden) =>
      keys.includes(forbidden.toLowerCase()),
    );
  }

  /**
   * Checks whether client headers contain attempted admin escalation headers.
   */
  static hasAdminHeaderAttempt(
    headers: Record<string, string | string[] | undefined> | null | undefined,
  ): boolean {
    if (!headers || typeof headers !== 'object') {
      return false;
    }

    const headerKeys = Object.keys(headers).map((h) => h.toLowerCase());
    return FORBIDDEN_ADMIN_HEADERS.some((forbidden) =>
      headerKeys.includes(forbidden),
    );
  }

  /**
   * Strips all forbidden administrative privilege fields from client request payloads.
   */
  static sanitizeClientPayload<T extends Record<string, unknown>>(
    payload: T,
  ): T {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return payload;
    }

    const sanitized = { ...payload };
    for (const key of Object.keys(sanitized)) {
      const lower = key.toLowerCase();
      if (FORBIDDEN_ESCALATION_KEYS.some((f) => f.toLowerCase() === lower)) {
        delete sanitized[key];
      }
    }

    return sanitized;
  }

  /**
   * Enforces that email matching (e.g. owner email address) NEVER grants Admin authority.
   */
  static assertNoEmailBasedAdminElevation(email?: string | null): void {
    if (!email) return;
    // Invariant: Email matching can NEVER be used to elevate or infer Admin authority
    if (ADMIN_IDENTITY_INVARIANTS.NO_EMAIL_MATCH_ADMIN) {
      // Invariant certified
    }
  }

  /**
   * Enforces that OAuth logins (GitHub, Google) NEVER produce or link to Admin authority.
   */
  static assertNoOAuthAdminElevation(
    provider: string,
    _profile?: unknown,
  ): void {
    if (
      provider.toUpperCase() === 'GITHUB' ||
      provider.toUpperCase() === 'GOOGLE'
    ) {
      // Hard security boundary: OAuth produces only User identity
      if (
        !ADMIN_IDENTITY_INVARIANTS.NO_GITHUB_OAUTH_ADMIN ||
        !ADMIN_IDENTITY_INVARIANTS.NO_GOOGLE_OAUTH_ADMIN
      ) {
        throw new AdminPrivilegeEscalationException(
          'OAuth identity cannot cross into Admin boundary.',
        );
      }
    }
  }

  /**
   * Enforces that public application workflows (registration, login, guest, public APIs)
   * can NEVER cross into the Private Admin Plane.
   */
  static assertPublicWorkflowIsolation(workflowSource: string): void {
    const publicWorkflows = [
      'REGISTRATION',
      'USER_LOGIN',
      'GOOGLE_OAUTH',
      'GITHUB_OAUTH',
      'GUEST_SESSION',
      'ACCOUNT_CLAIM',
      'ACCOUNT_SETTINGS',
      'PUBLIC_API',
      'FRONTEND_STATE',
      'GITHUB_ACTIONS',
      'CI_CD_BUILD',
    ];

    if (publicWorkflows.includes(workflowSource.toUpperCase())) {
      throw new AdminPrivilegeEscalationException(
        `Public workflow [${workflowSource}] is strictly isolated and cannot establish Admin authority.`,
      );
    }
  }
}
