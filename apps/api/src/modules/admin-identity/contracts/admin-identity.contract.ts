/**
 * ADMIN-001: Admin Identity Architecture Contracts
 *
 * Establishes the authoritative conceptual contracts and invariants for the
 * owner-exclusive Admin identity boundary in Nebula.
 *
 * Invariant:
 * - Admin identity is fundamentally distinct from normal User identity.
 * - Exactly one authorized Admin identity exists for the entire platform.
 * - Admin access is never obtainable through user registration, OAuth, guest flows,
 *   self-service role changes, or client manipulation.
 */

export enum AdminStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
}

export interface AdminIdentity {
  readonly id: string;
  readonly identifier: string;
  readonly status: AdminStatus;
  readonly authMetadata?: Record<string, unknown> | null;
  readonly lastAuthenticatedAt?: Date | null;
  readonly disabledAt?: Date | null;
  readonly disabledReason?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AdminIdentityPublicDto {
  readonly id: string;
  readonly identifier: string;
  readonly status: AdminStatus;
  readonly lastAuthenticatedAt?: Date | null;
  readonly disabledAt?: Date | null;
  readonly disabledReason?: string | null;
  readonly createdAt: Date;
}

export const ADMIN_IDENTITY_INVARIANTS = {
  /** Exactly one authorized Admin identity can exist on the platform. */
  MAX_ADMIN_COUNT: 1,

  /** Complete isolation: No public application workflow can create, elevate, or authenticate Admin identity. */
  PUBLIC_WORKFLOW_ISOLATION: true,

  /** Admin identity is owner-exclusive and cannot be self-provisioned or self-promoted by normal users. */
  NO_USER_SELF_PROMOTION: true,

  /** Admin authority is NOT a role attribute on normal User entities. */
  NO_USER_ROLE_ADMIN: true,

  /** GitHub OAuth login/registration produces ONLY normal User identity, NEVER Admin identity. */
  NO_GITHUB_OAUTH_ADMIN: true,

  /** Google OAuth login/registration produces ONLY normal User identity, NEVER Admin identity. */
  NO_GOOGLE_OAUTH_ADMIN: true,

  /** Guest identity conversion cannot produce Admin identity. */
  NO_GUEST_ADMIN: true,

  /** Email address matching (e.g. matching owner email or domain) must NEVER confer Admin authority. */
  NO_EMAIL_MATCH_ADMIN: true,

  /** GitHub Actions / CI/CD pipelines build and test code but do NOT possess Admin authority. */
  NO_CI_CD_ADMIN_AUTHORITY: true,

  /** Public application APIs cannot provide public admin creation/bootstrap/reset endpoints. */
  NO_PUBLIC_PROVISIONING_ENDPOINTS: true,

  /** When Admin identity is DISABLED, authentication must fail closed immediately. */
  FAIL_CLOSED_WHEN_DISABLED: true,

  /** Client request bodies, JWT claims, and headers cannot supply or dictate Admin status. */
  REJECT_CLIENT_ADMIN_CLAIMS: true,

  /** Hard security plane separation between Public Surface and Private Admin Plane. */
  HARD_SECURITY_BOUNDARY: true,
} as const;
