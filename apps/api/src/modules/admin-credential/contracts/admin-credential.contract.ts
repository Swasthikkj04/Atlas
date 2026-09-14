/**
 * ADMIN-002: Admin Credential Architecture Contracts
 *
 * Establishes the authoritative conceptual contracts, lifecycle models,
 * and cryptographic verification policies for owner-exclusive Admin credentials.
 *
 * Invariants:
 * - Admin credentials belong strictly to the single provisioned Admin identity.
 * - User credentials and Admin credentials are separated by a hard boundary (UserCredential != AdminCredential).
 * - Plaintext credentials are NEVER stored or logged.
 * - Credential verification occurs server-side only.
 * - Failed attempts trigger exponential / progressive lockout protection.
 * - Public recovery / email reset flows are strictly forbidden.
 */

export enum AdminCredentialType {
  PRIMARY_PASSWORD = 'PRIMARY_PASSWORD',
  WEBAUTHN_PASSKEY = 'WEBAUTHN_PASSKEY',
}

export enum AdminCredentialStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  REVOKED = 'REVOKED',
}

export enum AdminCredentialFailureCategory {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  CREDENTIAL_LOCKED = 'CREDENTIAL_LOCKED',
  CREDENTIAL_DISABLED = 'CREDENTIAL_DISABLED',
  CREDENTIAL_REVOKED = 'CREDENTIAL_REVOKED',
  IDENTITY_DISABLED = 'IDENTITY_DISABLED',
  IDENTITY_NOT_FOUND = 'IDENTITY_NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export interface AdminCredential {
  readonly id: string;
  readonly adminId: string;
  readonly type: AdminCredentialType;
  readonly verifierHash: string;
  readonly status: AdminCredentialStatus;
  readonly version: number;
  readonly failedAttempts: number;
  readonly lockedUntil?: Date | null;
  readonly lastUsedAt?: Date | null;
  readonly revokedAt?: Date | null;
  readonly revokedReason?: string | null;
  readonly metadata?: Record<string, unknown> | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AdminCredentialPublicDto {
  readonly id: string;
  readonly adminId: string;
  readonly type: AdminCredentialType;
  readonly status: AdminCredentialStatus;
  readonly version: number;
  readonly lastUsedAt?: Date | null;
  readonly createdAt: Date;
}

export interface AdminCredentialVerificationResult {
  readonly success: boolean;
  readonly credentialId?: string;
  readonly failureCategory?: AdminCredentialFailureCategory;
  readonly lockedUntil?: Date | null;
  readonly remainingAttempts?: number;
}

export const ADMIN_CREDENTIAL_POLICY = {
  /** Maximum consecutive failed verification attempts before locking. */
  MAX_FAILED_ATTEMPTS: 5,

  /** Lockout duration in milliseconds upon exceeding max failed attempts (15 minutes). */
  LOCKOUT_DURATION_MS: 15 * 60 * 1000,

  /** Minimum character length for owner Admin primary password. */
  MIN_PASSWORD_LENGTH: 16,

  /** Argon2id high-assurance security parameters. */
  ARGON2_PARAMS: {
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  },

  /** Plaintext storage is strictly prohibited. */
  NO_PLAINTEXT_STORAGE: true,

  /** Public email/SMS reset workflows into the Admin plane are strictly prohibited. */
  NO_PUBLIC_RECOVERY_FLOW: true,

  /** Verification occurs strictly server-side. Frontend can never assert credential validity. */
  SERVER_SIDE_ONLY_VERIFICATION: true,

  /** Fail closed on all disabled or revoked states. */
  FAIL_CLOSED_ON_DISABLED_OR_REVOKED: true,
} as const;
