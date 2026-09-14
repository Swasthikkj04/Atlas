import { ADMIN_WEBAUTHN_POLICY } from '../contracts/admin-webauthn.contract';
import {
  AdminWebAuthnUnauthorizedException,
  AdminWebAuthnLimitExceededException,
  AdminWebAuthnVerificationFailedException,
} from '../exceptions/admin-webauthn.exception';

/**
 * ADMIN-003: Admin WebAuthn Security Boundary
 *
 * Enforces Relying Party origin validation, anti-escalation, passkey limits,
 * and zero-leakage security invariants.
 */
export class AdminWebAuthnBoundary {
  /**
   * Asserts that a candidate credential is NOT a normal User WebAuthn credential.
   */
  static assertNotUserWebAuthnCredential(candidate: unknown): void {
    if (!candidate || typeof candidate !== 'object') {
      return;
    }

    const rec = candidate as Record<string, unknown>;
    if ('userId' in rec && !('adminId' in rec)) {
      throw new AdminWebAuthnUnauthorizedException(
        'User WebAuthn credentials cannot be attached to Admin identities. Security boundary crossover rejected.',
      );
    }
  }

  /**
   * Validates that the request origin is within the server's authorized origins.
   */
  static assertValidOrigin(origin: string): void {
    if (!origin || typeof origin !== 'string') {
      throw new AdminWebAuthnVerificationFailedException(
        'Missing or invalid Origin header.',
      );
    }

    const normalized = origin.trim().toLowerCase();
    const isAllowed = ADMIN_WEBAUTHN_POLICY.origins.some(
      (o) => o.trim().toLowerCase() === normalized,
    );

    if (!isAllowed) {
      throw new AdminWebAuthnVerificationFailedException(
        `Untrusted WebAuthn origin [${origin}]. Origin must match server Relying Party configuration.`,
      );
    }
  }

  /**
   * Enforces the maximum active passkey limit per Admin identity.
   */
  static assertPasskeyLimit(activeCount: number): void {
    if (activeCount >= ADMIN_WEBAUTHN_POLICY.maxAdminPasskeys) {
      throw new AdminWebAuthnLimitExceededException(
        `Maximum allowed Admin passkeys (${ADMIN_WEBAUTHN_POLICY.maxAdminPasskeys}) reached. Please revoke an unused passkey first.`,
      );
    }
  }

  /**
   * Verifies that audit logging payloads do not contain sensitive private key or secret material.
   */
  static assertNoSecretLeakage(payload: Record<string, unknown>): void {
    const forbiddenKeys = [
      'privatekey',
      'secret',
      'password',
      'verifierhash',
      'rawcredential',
      'clientdatajson',
    ];

    for (const key of Object.keys(payload)) {
      if (forbiddenKeys.includes(key.toLowerCase())) {
        throw new Error(
          `Security Violation: Attempted to log sensitive WebAuthn material under key: ${key}`,
        );
      }
    }
  }
}
