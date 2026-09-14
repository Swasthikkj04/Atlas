import { AdminSessionBoundary } from './boundaries/admin-session.boundary';
import {
  AdminJwtInvalidException,
  AdminUserJwtCrossoverException,
} from './exceptions/admin-session.exception';
import { AdminJwtPayload } from './contracts/admin-session.contract';

describe('ADMIN-005: AdminSessionBoundary & User JWT Crossover Protection', () => {
  describe('1. User JWT Crossover Rejection', () => {
    it('rejects standard User JWT payloads attempting to authenticate in Admin plane', () => {
      const userPayload = {
        iss: 'nebula-auth',
        typ: 'user-access',
        userId: 'usr-1001-2002',
        email: 'developer@example.com',
        role: 'ADMIN', // Client/User trying to fake role: ADMIN inside user token
      };

      expect(() => {
        AdminSessionBoundary.assertNotUserToken(userPayload);
      }).toThrow(AdminUserJwtCrossoverException);
    });

    it('permits clean Admin JWT payloads', () => {
      const adminPayload = {
        iss: 'nebula-admin',
        aud: 'nebula-admin-api',
        typ: 'admin-access',
        sub: 'adm-00000001',
        sid: 'ses-00000001',
        identifier: 'platform-owner',
        aal: 'AAL3',
        kid: 'admin-key-v1',
      };

      expect(() => {
        AdminSessionBoundary.assertNotUserToken(adminPayload);
      }).not.toThrow();
    });
  });

  describe('2. Admin JWT Claims Assertions', () => {
    const validAdminPayload: AdminJwtPayload = {
      iss: 'nebula-admin',
      aud: 'nebula-admin-api',
      typ: 'admin-access',
      sub: 'adm-00000001',
      sid: 'ses-00000001',
      identifier: 'platform-owner',
      aal: 'AAL3',
      kid: 'admin-key-v1',
    };

    it('accepts compliant Admin JWT claims', () => {
      expect(() => {
        AdminSessionBoundary.assertAdminJwtClaims(validAdminPayload);
      }).not.toThrow();
    });

    it('rejects invalid issuer', () => {
      expect(() => {
        AdminSessionBoundary.assertAdminJwtClaims({
          ...validAdminPayload,
          iss: 'invalid-issuer',
        });
      }).toThrow(AdminJwtInvalidException);
    });

    it('rejects invalid audience', () => {
      expect(() => {
        AdminSessionBoundary.assertAdminJwtClaims({
          ...validAdminPayload,
          aud: 'invalid-audience',
        });
      }).toThrow(AdminJwtInvalidException);
    });

    it('rejects missing sub or sid claims', () => {
      expect(() => {
        AdminSessionBoundary.assertAdminJwtClaims({
          ...validAdminPayload,
          sub: '',
        });
      }).toThrow(AdminJwtInvalidException);

      expect(() => {
        AdminSessionBoundary.assertAdminJwtClaims({
          ...validAdminPayload,
          sid: '',
        });
      }).toThrow(AdminJwtInvalidException);
    });
  });

  describe('3. Anti-Leakage Secret Protection in Logs', () => {
    it('detects and blocks attempted logging of signing keys or session secrets', () => {
      const unsafePayloads = [
        { signingKey: 'secret-key-material' },
        { cookieSecret: 'cookie-secret' },
        { refreshToken: 'raw-token' },
      ];

      for (const payload of unsafePayloads) {
        expect(() =>
          AdminSessionBoundary.assertNoSecretLeakage(payload),
        ).toThrow();
      }
    });

    it('permits safe audit metadata logging payloads', () => {
      const safePayload = {
        sessionId: 'ses-00000001',
        adminId: 'adm-00000001',
        event: 'ADMIN_SESSION_CREATED',
        timestamp: new Date(),
      };

      expect(() =>
        AdminSessionBoundary.assertNoSecretLeakage(safePayload),
      ).not.toThrow();
    });
  });
});
