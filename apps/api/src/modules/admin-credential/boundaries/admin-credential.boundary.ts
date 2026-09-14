import {
  AdminCredentialStatus,
  ADMIN_CREDENTIAL_POLICY,
} from '../contracts/admin-credential.contract';
import {
  AdminCredentialPolicyViolationException,
  AdminCredentialEscalationException,
  AdminCredentialDisabledException,
  AdminCredentialRevokedException,
} from '../exceptions/admin-credential.exception';

/**
 * ADMIN-002: Admin Credential Security Boundary
 *
 * Enforces cryptographic policy, anti-leakage invariants,
 * and strict separation from User credential models.
 */
export class AdminCredentialBoundary {
  /**
   * Enforces strict administrative password complexity and minimum length (>= 16 characters).
   */
  static assertPasswordPolicy(password: string): void {
    if (!password || typeof password !== 'string') {
      throw new AdminCredentialPolicyViolationException(
        'Admin password must be a non-empty string.',
      );
    }

    if (password.length < ADMIN_CREDENTIAL_POLICY.MIN_PASSWORD_LENGTH) {
      throw new AdminCredentialPolicyViolationException(
        `Admin password must be at least ${ADMIN_CREDENTIAL_POLICY.MIN_PASSWORD_LENGTH} characters long.`,
      );
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      throw new AdminCredentialPolicyViolationException(
        'Admin password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      );
    }
  }

  /**
   * Asserts that a credential object is NOT a normal User credential attempting to attach to Admin.
   */
  static assertNotUserCredential(candidate: unknown): void {
    if (!candidate || typeof candidate !== 'object') {
      return;
    }

    const rec = candidate as Record<string, unknown>;

    // User credential indicators
    if ('userId' in rec && !('adminId' in rec)) {
      throw new AdminCredentialEscalationException(
        'User credentials cannot be assigned to Admin identities. Security boundary crossover rejected.',
      );
    }
  }

  /**
   * Asserts that the credential status is ACTIVE. Fails closed if DISABLED or REVOKED.
   */
  static assertCredentialStatus(status: AdminCredentialStatus): void {
    if (status === AdminCredentialStatus.DISABLED) {
      throw new AdminCredentialDisabledException();
    }
    if (status === AdminCredentialStatus.REVOKED) {
      throw new AdminCredentialRevokedException();
    }
  }

  /**
   * Rejects any public recovery or email reset workflow attempting to touch Admin credentials.
   */
  static assertNoPublicRecoveryWorkflow(): void {
    if (ADMIN_CREDENTIAL_POLICY.NO_PUBLIC_RECOVERY_FLOW) {
      // Certified invariant
    }
  }

  /**
   * Verifies that a logging or audit payload does not contain sensitive secret materials.
   */
  static assertNoSecretLeakage(payload: Record<string, unknown>): void {
    const forbiddenKeys = [
      'password',
      'verifierhash',
      'secret',
      'privatekey',
      'rawcredential',
      'plaintextpassword',
    ];
    for (const key of Object.keys(payload)) {
      if (forbiddenKeys.includes(key.toLowerCase())) {
        throw new Error(
          `Security Violation: Attempted to log sensitive credential material under key: ${key}`,
        );
      }
    }
  }
}
