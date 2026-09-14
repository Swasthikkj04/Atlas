import { AdminIdentityBoundary } from './boundaries/admin-identity.boundary';
import {
  AdminStatus,
  ADMIN_IDENTITY_INVARIANTS,
} from './contracts/admin-identity.contract';
import {
  AdminDisabledException,
  AdminPrivilegeEscalationException,
  AdminInvariantViolationException,
} from './exceptions/admin-identity.exception';

describe('ADMIN-001: AdminIdentityBoundary & Anti-Escalation Hardening', () => {
  describe('1. Hard Separation Between User and Admin Identities', () => {
    it('rejects standard User identity objects passed to Admin contexts', () => {
      const mockUser = {
        id: 'usr-12345678',
        email: 'attacker@evil.com',
        fullName: 'Evil User',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$...',
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
      };

      expect(() => {
        AdminIdentityBoundary.assertNotUserIdentity(mockUser);
      }).toThrow(AdminPrivilegeEscalationException);
    });

    it('permits genuine AdminIdentity objects through boundary', () => {
      const mockAdmin = {
        id: 'adm-00000001',
        identifier: 'platform-owner',
        status: AdminStatus.ACTIVE,
        authMetadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => {
        AdminIdentityBoundary.assertNotUserIdentity(mockAdmin);
      }).not.toThrow();
    });
  });

  describe('2. Fail-Closed Eligibility Invariants', () => {
    it('passes when AdminIdentity is ACTIVE', () => {
      const activeAdmin = {
        id: 'adm-00000001',
        identifier: 'platform-owner',
        status: AdminStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => {
        AdminIdentityBoundary.assertAdminAuthenticationEligible(activeAdmin);
      }).not.toThrow();
    });

    it('throws AdminDisabledException when AdminIdentity is DISABLED', () => {
      const disabledAdmin = {
        id: 'adm-00000001',
        identifier: 'platform-owner',
        status: AdminStatus.DISABLED,
        disabledReason: 'Security rotation',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => {
        AdminIdentityBoundary.assertAdminAuthenticationEligible(disabledAdmin);
      }).toThrow(AdminDisabledException);
    });

    it('throws AdminDisabledException when Admin is null or undefined (fail closed)', () => {
      expect(() => {
        AdminIdentityBoundary.assertAdminAuthenticationEligible(null);
      }).toThrow(AdminDisabledException);

      expect(() => {
        AdminIdentityBoundary.assertAdminAuthenticationEligible(undefined);
      }).toThrow(AdminDisabledException);
    });
  });

  describe('3. Owner-Exclusive Count Bounds', () => {
    it('passes when count is 0 or 1', () => {
      expect(() =>
        AdminIdentityBoundary.assertOwnerExclusiveCount(0),
      ).not.toThrow();
      expect(() =>
        AdminIdentityBoundary.assertOwnerExclusiveCount(1),
      ).not.toThrow();
    });

    it('throws AdminInvariantViolationException when count exceeds 1', () => {
      expect(() => AdminIdentityBoundary.assertOwnerExclusiveCount(2)).toThrow(
        AdminInvariantViolationException,
      );
      expect(() => AdminIdentityBoundary.assertOwnerExclusiveCount(5)).toThrow(
        AdminInvariantViolationException,
      );
    });
  });

  describe('4. Client-Controlled Privilege Escalation Defense', () => {
    it('detects forbidden admin escalation keys in client payloads', () => {
      const escalationPayloads = [
        { email: 'user@example.com', isAdmin: true },
        { email: 'user@example.com', is_admin: true },
        { email: 'user@example.com', admin: true },
        { email: 'user@example.com', role: 'ADMIN' },
        { email: 'user@example.com', role: 'admin' },
        { email: 'user@example.com', roles: ['ADMIN'] },
        { email: 'user@example.com', isOwner: true },
        { email: 'user@example.com', adminClaim: 'authorized' },
        { email: 'user@example.com', accountType: 'ADMIN' },
      ];

      for (const payload of escalationPayloads) {
        expect(AdminIdentityBoundary.hasEscalationAttempt(payload)).toBe(true);
      }
    });

    it('returns false for clean normal user payloads', () => {
      const normalPayload = {
        email: 'user@example.com',
        fullName: 'Jane Doe',
        password: 'SecurePassword123!',
      };

      expect(AdminIdentityBoundary.hasEscalationAttempt(normalPayload)).toBe(
        false,
      );
    });

    it('detects forbidden client admin headers', () => {
      const forbiddenHeaders = [
        { 'x-admin-role': 'true' },
        { 'x-is-admin': '1' },
        { 'x-admin-override': 'platform-owner' },
        { 'x-nebula-admin': 'true' },
        { 'x-admin-identity': 'adm-001' },
        { 'x-admin-secret': 'secret-token' },
      ];

      for (const header of forbiddenHeaders) {
        expect(AdminIdentityBoundary.hasAdminHeaderAttempt(header)).toBe(true);
      }
    });

    it('returns false for standard headers', () => {
      const normalHeaders = {
        'content-type': 'application/json',
        authorization: 'Bearer user-token',
        'x-correlation-id': 'corr-1234',
      };

      expect(AdminIdentityBoundary.hasAdminHeaderAttempt(normalHeaders)).toBe(
        false,
      );
    });

    it('sanitizes client payloads by stripping all forbidden escalation keys', () => {
      const maliciousPayload = {
        email: 'user@example.com',
        fullName: 'Jane Doe',
        isAdmin: true,
        role: 'ADMIN',
        isOwner: true,
        accountType: 'ADMIN',
        customSetting: 'dark-mode',
      };

      const sanitized =
        AdminIdentityBoundary.sanitizeClientPayload(maliciousPayload);

      expect(sanitized).toEqual({
        email: 'user@example.com',
        fullName: 'Jane Doe',
        customSetting: 'dark-mode',
      });
      expect((sanitized as any).isAdmin).toBeUndefined();
      expect((sanitized as any).role).toBeUndefined();
      expect((sanitized as any).isOwner).toBeUndefined();
      expect((sanitized as any).accountType).toBeUndefined();
    });
  });

  describe('5. Certified Invariants Contract Verification', () => {
    it('verifies all certified ADMIN_IDENTITY_INVARIANTS are defined and truthy', () => {
      expect(ADMIN_IDENTITY_INVARIANTS.MAX_ADMIN_COUNT).toBe(1);
      expect(ADMIN_IDENTITY_INVARIANTS.PUBLIC_WORKFLOW_ISOLATION).toBe(true);
      expect(ADMIN_IDENTITY_INVARIANTS.NO_USER_SELF_PROMOTION).toBe(true);
      expect(ADMIN_IDENTITY_INVARIANTS.NO_USER_ROLE_ADMIN).toBe(true);
      expect(ADMIN_IDENTITY_INVARIANTS.NO_GITHUB_OAUTH_ADMIN).toBe(true);
      expect(ADMIN_IDENTITY_INVARIANTS.NO_GOOGLE_OAUTH_ADMIN).toBe(true);
      expect(ADMIN_IDENTITY_INVARIANTS.NO_GUEST_ADMIN).toBe(true);
      expect(ADMIN_IDENTITY_INVARIANTS.NO_EMAIL_MATCH_ADMIN).toBe(true);
      expect(ADMIN_IDENTITY_INVARIANTS.NO_CI_CD_ADMIN_AUTHORITY).toBe(true);
      expect(ADMIN_IDENTITY_INVARIANTS.NO_PUBLIC_PROVISIONING_ENDPOINTS).toBe(
        true,
      );
      expect(ADMIN_IDENTITY_INVARIANTS.FAIL_CLOSED_WHEN_DISABLED).toBe(true);
      expect(ADMIN_IDENTITY_INVARIANTS.REJECT_CLIENT_ADMIN_CLAIMS).toBe(true);
      expect(ADMIN_IDENTITY_INVARIANTS.HARD_SECURITY_BOUNDARY).toBe(true);
    });
  });
});
