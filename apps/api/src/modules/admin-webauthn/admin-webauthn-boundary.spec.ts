import { AdminWebAuthnBoundary } from './boundaries/admin-webauthn.boundary';
import { ADMIN_WEBAUTHN_POLICY } from './contracts/admin-webauthn.contract';
import {
  AdminWebAuthnUnauthorizedException,
  AdminWebAuthnLimitExceededException,
  AdminWebAuthnVerificationFailedException,
} from './exceptions/admin-webauthn.exception';

describe('ADMIN-003: AdminWebAuthnBoundary & Cryptographic Policy Tests', () => {
  describe('1. User vs Admin WebAuthn Boundary Separation', () => {
    it('rejects standard User WebAuthn credentials attempting to cross into Admin plane', () => {
      const userWebAuthnCred = {
        id: 'webauthn-user-1',
        userId: 'usr-9999-9999',
        credentialId: 'user-cred-1234',
        publicKey: Buffer.from([1, 2, 3]),
      };

      expect(() => {
        AdminWebAuthnBoundary.assertNotUserWebAuthnCredential(userWebAuthnCred);
      }).toThrow(AdminWebAuthnUnauthorizedException);
    });

    it('permits Admin WebAuthn credential entities', () => {
      const adminWebAuthnCred = {
        id: 'webauthn-adm-1',
        adminId: 'adm-00000001',
        credentialId: 'admin-cred-1234',
      };

      expect(() => {
        AdminWebAuthnBoundary.assertNotUserWebAuthnCredential(
          adminWebAuthnCred,
        );
      }).not.toThrow();
    });
  });

  describe('2. Relying Party Origin Validation', () => {
    it('accepts configured trusted origins', () => {
      expect(() =>
        AdminWebAuthnBoundary.assertValidOrigin('http://localhost:5173'),
      ).not.toThrow();
      expect(() =>
        AdminWebAuthnBoundary.assertValidOrigin('http://localhost:3000'),
      ).not.toThrow();
    });

    it('rejects untrusted or malicious origins', () => {
      expect(() =>
        AdminWebAuthnBoundary.assertValidOrigin('https://evil-hacker.com'),
      ).toThrow(AdminWebAuthnVerificationFailedException);
      expect(() =>
        AdminWebAuthnBoundary.assertValidOrigin('http://spoofed-origin.net'),
      ).toThrow(AdminWebAuthnVerificationFailedException);
    });
  });

  describe('3. Controlled Passkey Enrollment Limit Enforcement', () => {
    it('allows enrollment when active passkey count is below maximum limit', () => {
      expect(() => AdminWebAuthnBoundary.assertPasskeyLimit(0)).not.toThrow();
      expect(() => AdminWebAuthnBoundary.assertPasskeyLimit(4)).not.toThrow();
    });

    it('rejects enrollment when maximum active passkey limit (5) is reached', () => {
      expect(() => AdminWebAuthnBoundary.assertPasskeyLimit(5)).toThrow(
        AdminWebAuthnLimitExceededException,
      );
      expect(() => AdminWebAuthnBoundary.assertPasskeyLimit(6)).toThrow(
        AdminWebAuthnLimitExceededException,
      );
    });
  });

  describe('4. Anti-Leakage Secret Protection in Logs', () => {
    it('detects and blocks attempted logging of private keys or raw credential materials', () => {
      const unsafePayloads = [
        { privateKey: '-----BEGIN PRIVATE KEY-----' },
        { secret: 'raw-secret' },
        { clientDataJSON: 'raw-json' },
      ];

      for (const payload of unsafePayloads) {
        expect(() =>
          AdminWebAuthnBoundary.assertNoSecretLeakage(payload),
        ).toThrow();
      }
    });

    it('permits safe audit metadata logging payloads', () => {
      const safePayload = {
        adminId: 'adm-00000001',
        credentialId: 'mock-passkey-id',
        deviceLabel: 'YubiKey 5C NFC',
        event: 'ADMIN_WEBAUTHN_ENROLLMENT_COMPLETED',
        timestamp: new Date(),
      };

      expect(() =>
        AdminWebAuthnBoundary.assertNoSecretLeakage(safePayload),
      ).not.toThrow();
    });
  });

  describe('5. Policy Integrity Verification', () => {
    it('verifies that ADMIN_WEBAUTHN_POLICY invariants are configured properly', () => {
      expect(ADMIN_WEBAUTHN_POLICY.rpName).toBe('Nebula Platform Admin');
      expect(ADMIN_WEBAUTHN_POLICY.rpId).toBeDefined();
      expect(ADMIN_WEBAUTHN_POLICY.challengeTtlMs).toBe(300000); // 5 minutes
      expect(ADMIN_WEBAUTHN_POLICY.maxAdminPasskeys).toBe(5);
      expect(ADMIN_WEBAUTHN_POLICY.requireUserVerification).toBe(true);
      expect(ADMIN_WEBAUTHN_POLICY.supportedAlgorithms).toContain(-7); // ES256
      expect(ADMIN_WEBAUTHN_POLICY.supportedAlgorithms).toContain(-257); // RS256
    });
  });
});
