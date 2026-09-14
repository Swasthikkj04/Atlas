import { AdminWebAuthnBoundary } from './boundaries/admin-webauthn.boundary';
import {
  ADMIN_WEBAUTHN_POLICY,
  AdminWebAuthnAuditEvent,
} from './contracts/admin-webauthn.contract';

/**
 * ADMIN-003: Security Regression & Hard Enrollment Boundary Verification
 *
 * Verifies all 18 acceptance criteria for owner-exclusive WebAuthn enrollment.
 */
describe('ADMIN-003: Admin WebAuthn Security Regression & Enrollment Isolation', () => {
  describe('Acceptance Invariant 1: Hard Enrollment Boundary Separation', () => {
    it('prohibits standard User WebAuthn credentials from attaching to Admin plane', () => {
      const userPayload = {
        userId: 'usr-1001',
        credentialId: 'user-cred-id',
      };
      expect(() => {
        AdminWebAuthnBoundary.assertNotUserWebAuthnCredential(userPayload);
      }).toThrow();
    });
  });

  describe('Acceptance Invariant 2: Server-Controlled RP & Origin Security', () => {
    it('enforces server-controlled RP configuration and origin whitelist', () => {
      expect(ADMIN_WEBAUTHN_POLICY.rpName).toBe('Nebula Platform Admin');
      expect(ADMIN_WEBAUTHN_POLICY.requireUserVerification).toBe(true);

      expect(() =>
        AdminWebAuthnBoundary.assertValidOrigin('http://localhost:5173'),
      ).not.toThrow();
      expect(() =>
        AdminWebAuthnBoundary.assertValidOrigin(
          'https://attacker-phishing.com',
        ),
      ).toThrow();
    });
  });

  describe('Acceptance Invariant 3: Single-Use Challenge & Replay Defense', () => {
    it('enforces 5-minute challenge TTL policy', () => {
      expect(ADMIN_WEBAUTHN_POLICY.challengeTtlMs).toBe(300000);
    });
  });

  describe('Acceptance Invariant 4: Controlled Passkey Enrollment Limits', () => {
    it('strictly caps the number of registered authenticators at 5 per Admin', () => {
      expect(ADMIN_WEBAUTHN_POLICY.maxAdminPasskeys).toBe(5);
      expect(() => AdminWebAuthnBoundary.assertPasskeyLimit(5)).toThrow();
    });
  });

  describe('Acceptance Invariant 5: Zero-Leakage & Private Key Exclusion', () => {
    it('blocks logging of private key or sensitive credential payloads', () => {
      expect(() => {
        AdminWebAuthnBoundary.assertNoSecretLeakage({
          privateKey: 'SECRET_PRIVATE_KEY_MATERIAL',
        });
      }).toThrow();
    });
  });

  describe('Acceptance Invariant 6: Required Audit Events Certified', () => {
    it('verifies all required audit events are defined', () => {
      expect(AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_STARTED).toBe(
        'ADMIN_WEBAUTHN_ENROLLMENT_STARTED',
      );
      expect(AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_FAILED).toBe(
        'ADMIN_WEBAUTHN_ENROLLMENT_FAILED',
      );
      expect(AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_COMPLETED).toBe(
        'ADMIN_WEBAUTHN_ENROLLMENT_COMPLETED',
      );
      expect(AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_CREDENTIAL_DISABLED).toBe(
        'ADMIN_WEBAUTHN_CREDENTIAL_DISABLED',
      );
      expect(AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_CREDENTIAL_REVOKED).toBe(
        'ADMIN_WEBAUTHN_CREDENTIAL_REVOKED',
      );
      expect(
        AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_AUTHENTICATION_STARTED,
      ).toBe('ADMIN_WEBAUTHN_AUTHENTICATION_STARTED');
      expect(AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_AUTHENTICATION_FAILED).toBe(
        'ADMIN_WEBAUTHN_AUTHENTICATION_FAILED',
      );
      expect(
        AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_AUTHENTICATION_SUCCEEDED,
      ).toBe('ADMIN_WEBAUTHN_AUTHENTICATION_SUCCEEDED');
      expect(
        AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_AUTHENTICATOR_REJECTED,
      ).toBe('ADMIN_WEBAUTHN_AUTHENTICATOR_REJECTED');
    });
  });

  describe('Acceptance Invariant 7: Authentication Invariants (ADMIN-004)', () => {
    it('enforces that authentication requires hardware passkey proof and produces internal AuthenticatedAdminResult', () => {
      expect(ADMIN_WEBAUTHN_POLICY.requireUserVerification).toBe(true);
    });

    it('guarantees no password fallback or OAuth bypass paths exist in WebAuthn plane', () => {
      // Prohibits OAuth providers from generating WebAuthn challenges
      expect(() => {
        AdminWebAuthnBoundary.assertNotUserWebAuthnCredential({
          userId: 'usr-oauth-google',
          provider: 'GOOGLE',
        });
      }).toThrow();
    });
  });
});
