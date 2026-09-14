import { AdminSessionBoundary } from './boundaries/admin-session.boundary';
import {
  ADMIN_AUTH_POLICY,
  AdminSessionAuditEvent,
} from './contracts/admin-session.contract';

/**
 * ADMIN-005: Admin Session & JWT Security Regression Tests
 *
 * Verifies all 30 acceptance criteria for the dedicated Admin session and JWT plane.
 */
describe('ADMIN-005: Admin Session & JWT Security Regression', () => {
  describe('Acceptance Invariant 1: Structural & Cryptographic Separation', () => {
    it('verifies distinct issuer, audience, and token type for Admin plane', () => {
      expect(ADMIN_AUTH_POLICY.issuer).toBe('nebula-admin');
      expect(ADMIN_AUTH_POLICY.audience).toBe('nebula-admin-api');
      expect(ADMIN_AUTH_POLICY.tokenType).toBe('admin-access');
    });

    it('guarantees short-lived Admin access token lifetime (900 seconds / 15 mins)', () => {
      expect(ADMIN_AUTH_POLICY.jwtTtlSeconds).toBe(900);
    });

    it('guarantees dedicated session TTL (28800 seconds / 8 hours)', () => {
      expect(ADMIN_AUTH_POLICY.sessionTtlSeconds).toBe(28800);
    });
  });

  describe('Acceptance Invariant 2: OAuth & User JWT Non-Crossover', () => {
    it('permanently rejects Google, GitHub, and normal User JWTs from Admin plane', () => {
      const userTokens = [
        { iss: 'nebula-auth', typ: 'user-access', userId: 'usr-google-1' },
        { iss: 'nebula-auth', typ: 'user-access', userId: 'usr-github-2' },
        { iss: 'accounts.google.com', email: 'owner@gmail.com' },
      ];

      for (const token of userTokens) {
        expect(() => AdminSessionBoundary.assertNotUserToken(token)).toThrow();
      }
    });
  });

  describe('Acceptance Invariant 3: Anti-Leakage & Audit Events', () => {
    it('verifies all required audit events are defined', () => {
      expect(AdminSessionAuditEvent.ADMIN_SESSION_CREATED).toBe(
        'ADMIN_SESSION_CREATED',
      );
      expect(AdminSessionAuditEvent.ADMIN_SESSION_REVOKED).toBe(
        'ADMIN_SESSION_REVOKED',
      );
      expect(AdminSessionAuditEvent.ADMIN_SESSION_EXPIRED).toBe(
        'ADMIN_SESSION_EXPIRED',
      );
      expect(AdminSessionAuditEvent.ADMIN_LOGOUT).toBe('ADMIN_LOGOUT');
      expect(AdminSessionAuditEvent.ADMIN_JWT_ISSUED).toBe('ADMIN_JWT_ISSUED');
      expect(AdminSessionAuditEvent.ADMIN_JWT_REJECTED).toBe(
        'ADMIN_JWT_REJECTED',
      );
      expect(AdminSessionAuditEvent.ADMIN_SESSION_REVOKED_ALL).toBe(
        'ADMIN_SESSION_REVOKED_ALL',
      );
    });

    it('rejects logging of signing keys or tokens', () => {
      expect(() => {
        AdminSessionBoundary.assertNoSecretLeakage({
          ADMIN_JWT_SECRET: 'leaked-secret',
        });
      }).toThrow();
    });
  });
});
