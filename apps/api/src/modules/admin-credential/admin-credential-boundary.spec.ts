import { AdminCredentialBoundary } from './boundaries/admin-credential.boundary';
import {
  AdminCredentialStatus,
  ADMIN_CREDENTIAL_POLICY,
} from './contracts/admin-credential.contract';
import {
  AdminCredentialPolicyViolationException,
  AdminCredentialEscalationException,
  AdminCredentialDisabledException,
  AdminCredentialRevokedException,
} from './exceptions/admin-credential.exception';

describe('ADMIN-002: AdminCredentialBoundary & Cryptographic Policy Tests', () => {
  describe('1. Password Policy & Complexity', () => {
    it('accepts compliant high-entropy passwords (>= 16 characters with complexity)', () => {
      const validPasswords = [
        'V3ry$ecureP@ssw0rd!LongEnough',
        'C0mpl3x#Admin%Credential_2026',
        'Kx9#mQ2$vL8!pZ5@wN4^',
      ];

      for (const pass of validPasswords) {
        expect(() =>
          AdminCredentialBoundary.assertPasswordPolicy(pass),
        ).not.toThrow();
      }
    });

    it('rejects passwords shorter than 16 characters', () => {
      expect(() =>
        AdminCredentialBoundary.assertPasswordPolicy('Short1!Aa'),
      ).toThrow(AdminCredentialPolicyViolationException);
    });

    it('rejects passwords missing uppercase letters', () => {
      expect(() =>
        AdminCredentialBoundary.assertPasswordPolicy('v3ry$ecurep@ssw0rd!long'),
      ).toThrow(AdminCredentialPolicyViolationException);
    });

    it('rejects passwords missing lowercase letters', () => {
      expect(() =>
        AdminCredentialBoundary.assertPasswordPolicy('V3RY$ECUREP@SSW0RD!LONG'),
      ).toThrow(AdminCredentialPolicyViolationException);
    });

    it('rejects passwords missing numbers', () => {
      expect(() =>
        AdminCredentialBoundary.assertPasswordPolicy(
          'VerySecurePassword!WithoutDigits',
        ),
      ).toThrow(AdminCredentialPolicyViolationException);
    });

    it('rejects passwords missing special characters', () => {
      expect(() =>
        AdminCredentialBoundary.assertPasswordPolicy(
          'VerySecurePassword123456789',
        ),
      ).toThrow(AdminCredentialPolicyViolationException);
    });
  });

  describe('2. User vs Admin Credential Boundary Separation', () => {
    it('rejects standard User credentials attempting to attach to Admin identity', () => {
      const userCredential = {
        id: 'user-cred-1',
        userId: 'usr-12345678',
        passwordHash: '$argon2id$...',
      };

      expect(() =>
        AdminCredentialBoundary.assertNotUserCredential(userCredential),
      ).toThrow(AdminCredentialEscalationException);
    });

    it('permits valid Admin credential objects', () => {
      const adminCredential = {
        id: 'admin-cred-1',
        adminId: 'adm-00000001',
        verifierHash: '$argon2id$...',
      };

      expect(() =>
        AdminCredentialBoundary.assertNotUserCredential(adminCredential),
      ).not.toThrow();
    });
  });

  describe('3. Credential Status Boundary Assertions', () => {
    it('passes when status is ACTIVE', () => {
      expect(() =>
        AdminCredentialBoundary.assertCredentialStatus(
          AdminCredentialStatus.ACTIVE,
        ),
      ).not.toThrow();
    });

    it('throws AdminCredentialDisabledException when status is DISABLED', () => {
      expect(() =>
        AdminCredentialBoundary.assertCredentialStatus(
          AdminCredentialStatus.DISABLED,
        ),
      ).toThrow(AdminCredentialDisabledException);
    });

    it('throws AdminCredentialRevokedException when status is REVOKED', () => {
      expect(() =>
        AdminCredentialBoundary.assertCredentialStatus(
          AdminCredentialStatus.REVOKED,
        ),
      ).toThrow(AdminCredentialRevokedException);
    });
  });

  describe('4. Anti-Leakage Secret Protection in Logs & Metadata', () => {
    it('detects and blocks attempted logging of plaintext passwords or hashes', () => {
      const unsafePayloads = [
        { password: 'PlainTextPassword123!' },
        { verifierHash: '$argon2id$...' },
        { secret: 'raw-secret' },
        { privateKey: '-----BEGIN PRIVATE KEY-----' },
        { plainTextPassword: 'secret' },
      ];

      for (const payload of unsafePayloads) {
        expect(() =>
          AdminCredentialBoundary.assertNoSecretLeakage(payload),
        ).toThrow();
      }
    });

    it('permits safe metadata logging payloads', () => {
      const safePayload = {
        adminId: 'adm-00000001',
        attempt: 1,
        success: false,
        failureCategory: 'INVALID_CREDENTIALS',
        timestamp: new Date(),
      };

      expect(() =>
        AdminCredentialBoundary.assertNoSecretLeakage(safePayload),
      ).not.toThrow();
    });
  });

  describe('5. Policy Constants Integrity', () => {
    it('verifies all certified ADMIN_CREDENTIAL_POLICY rules are present and correct', () => {
      expect(ADMIN_CREDENTIAL_POLICY.MAX_FAILED_ATTEMPTS).toBe(5);
      expect(ADMIN_CREDENTIAL_POLICY.LOCKOUT_DURATION_MS).toBe(15 * 60 * 1000);
      expect(ADMIN_CREDENTIAL_POLICY.MIN_PASSWORD_LENGTH).toBe(16);
      expect(ADMIN_CREDENTIAL_POLICY.NO_PLAINTEXT_STORAGE).toBe(true);
      expect(ADMIN_CREDENTIAL_POLICY.NO_PUBLIC_RECOVERY_FLOW).toBe(true);
      expect(ADMIN_CREDENTIAL_POLICY.SERVER_SIDE_ONLY_VERIFICATION).toBe(true);
      expect(ADMIN_CREDENTIAL_POLICY.FAIL_CLOSED_ON_DISABLED_OR_REVOKED).toBe(
        true,
      );
    });
  });
});
