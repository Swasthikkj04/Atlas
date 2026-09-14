import { AdminCredentialStatus } from '../../admin-credential/contracts/admin-credential.contract';

/**
 * ADMIN-003: Admin WebAuthn & Passkey Enrollment Contracts
 *
 * Establishes Relying Party configuration, cryptographic registration invariants,
 * challenge lifecycle, and audit event definitions.
 */

export interface AdminWebAuthnConfig {
  readonly rpId: string;
  readonly rpName: string;
  readonly origins: string[];
  readonly challengeTtlMs: number;
  readonly maxAdminPasskeys: number;
  readonly requireUserVerification: boolean;
  readonly supportedAlgorithms: number[];
}

export const ADMIN_WEBAUTHN_POLICY: AdminWebAuthnConfig = {
  rpId: process.env.ADMIN_WEBAUTHN_RP_ID || 'localhost',
  rpName: 'Nebula Platform Admin',
  origins: (
    process.env.ADMIN_WEBAUTHN_ORIGINS ||
    'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173'
  ).split(','),
  challengeTtlMs: 5 * 60 * 1000, // 5 minutes
  maxAdminPasskeys: 5,
  requireUserVerification: true,
  supportedAlgorithms: [-7, -257], // ES256, RS256
} as const;

export enum AdminWebAuthnAuditEvent {
  ADMIN_WEBAUTHN_ENROLLMENT_STARTED = 'ADMIN_WEBAUTHN_ENROLLMENT_STARTED',
  ADMIN_WEBAUTHN_ENROLLMENT_FAILED = 'ADMIN_WEBAUTHN_ENROLLMENT_FAILED',
  ADMIN_WEBAUTHN_ENROLLMENT_COMPLETED = 'ADMIN_WEBAUTHN_ENROLLMENT_COMPLETED',
  ADMIN_WEBAUTHN_CREDENTIAL_DISABLED = 'ADMIN_WEBAUTHN_CREDENTIAL_DISABLED',
  ADMIN_WEBAUTHN_CREDENTIAL_REVOKED = 'ADMIN_WEBAUTHN_CREDENTIAL_REVOKED',
  ADMIN_WEBAUTHN_AUTHENTICATION_STARTED = 'ADMIN_WEBAUTHN_AUTHENTICATION_STARTED',
  ADMIN_WEBAUTHN_AUTHENTICATION_FAILED = 'ADMIN_WEBAUTHN_AUTHENTICATION_FAILED',
  ADMIN_WEBAUTHN_AUTHENTICATION_SUCCEEDED = 'ADMIN_WEBAUTHN_AUTHENTICATION_SUCCEEDED',
  ADMIN_WEBAUTHN_AUTHENTICATOR_REJECTED = 'ADMIN_WEBAUTHN_AUTHENTICATOR_REJECTED',
}

export interface AuthenticatedAdminResult {
  readonly authenticated: true;
  readonly adminIdentityId: string;
  readonly identifier: string;
  readonly credentialId: string;
  readonly authenticationTime: Date;
  readonly assuranceLevel: 'AAL3';
}

export interface AdminWebAuthnCredentialDto {
  readonly id: string;
  readonly adminId: string;
  readonly credentialId: string;
  readonly deviceLabel?: string | null;
  readonly transports: string[];
  readonly status: AdminCredentialStatus;
  readonly lastUsedAt?: Date | null;
  readonly createdAt: Date;
}
