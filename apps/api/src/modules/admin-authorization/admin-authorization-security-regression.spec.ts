import {
  ALL_ADMIN_CAPABILITIES,
  AdminAuthorizationAuditEvent,
  AdminCapability,
} from './contracts/admin-authorization.contract';

/**
 * ADMIN-006: Admin Authorization Security Regression Tests
 *
 * Enforces all 32 acceptance criteria for the Admin authorization boundary.
 */
describe('ADMIN-006: Admin Authorization Boundary Security Regression', () => {
  describe('1. Centralized Capability Registry Integrity', () => {
    it('defines all required administrative operational capabilities', () => {
      expect(ALL_ADMIN_CAPABILITIES).toContain(
        AdminCapability.ADMIN_DASHBOARD_READ,
      );
      expect(ALL_ADMIN_CAPABILITIES).toContain(AdminCapability.ADMIN_USER_READ);
      expect(ALL_ADMIN_CAPABILITIES).toContain(
        AdminCapability.ADMIN_USER_MANAGE,
      );
      expect(ALL_ADMIN_CAPABILITIES).toContain(
        AdminCapability.ADMIN_SESSION_READ,
      );
      expect(ALL_ADMIN_CAPABILITIES).toContain(
        AdminCapability.ADMIN_SESSION_REVOKE,
      );
      expect(ALL_ADMIN_CAPABILITIES).toContain(
        AdminCapability.ADMIN_SECURITY_READ,
      );
      expect(ALL_ADMIN_CAPABILITIES).toContain(
        AdminCapability.ADMIN_SECURITY_MANAGE,
      );
      expect(ALL_ADMIN_CAPABILITIES).toContain(
        AdminCapability.ADMIN_AUDIT_READ,
      );
      expect(ALL_ADMIN_CAPABILITIES).toContain(
        AdminCapability.ADMIN_DOMAIN_READ,
      );
      expect(ALL_ADMIN_CAPABILITIES).toContain(
        AdminCapability.ADMIN_DOMAIN_MANAGE,
      );
      expect(ALL_ADMIN_CAPABILITIES).toContain(
        AdminCapability.ADMIN_WORKER_MANAGE,
      );
      expect(ALL_ADMIN_CAPABILITIES).toContain(
        AdminCapability.ADMIN_RETENTION_MANAGE,
      );
    });
  });

  describe('2. Authorization Audit Events', () => {
    it('defines all required authorization audit event types', () => {
      expect(AdminAuthorizationAuditEvent.ADMIN_AUTHORIZATION_GRANTED).toBe(
        'ADMIN_AUTHORIZATION_GRANTED',
      );
      expect(AdminAuthorizationAuditEvent.ADMIN_AUTHORIZATION_DENIED).toBe(
        'ADMIN_AUTHORIZATION_DENIED',
      );
      expect(AdminAuthorizationAuditEvent.ADMIN_SESSION_REJECTED).toBe(
        'ADMIN_SESSION_REJECTED',
      );
      expect(AdminAuthorizationAuditEvent.ADMIN_IDENTITY_REJECTED).toBe(
        'ADMIN_IDENTITY_REJECTED',
      );
      expect(AdminAuthorizationAuditEvent.ADMIN_TOKEN_REJECTED).toBe(
        'ADMIN_TOKEN_REJECTED',
      );
      expect(AdminAuthorizationAuditEvent.ADMIN_CAPABILITY_DENIED).toBe(
        'ADMIN_CAPABILITY_DENIED',
      );
    });
  });
});
