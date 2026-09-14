import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  S02_TICKET_ID,
  S02_PHASE,
  S02_PRIORITY,
  S02_STATUS,
  S02_PRINCIPLES,
  S02_INVARIANTS,
  S02_SECURITY_EVENTS,
  S02_SECURITY_MATRIX,
  validateAccessToken,
  evaluateRefreshTokenRotation,
  evaluateSessionStatus,
  evaluateGxBoundary,
  evaluateSessionFixation,
  sanitizeLogData,
  verifyS02Certification,
  S02_CERTIFICATION_STATEMENT,
  type AccessTokenClaims,
  type RefreshTokenRecord,
  type UserSessionRecord,
} from './s-02-authentication-session.contract.ts';

describe('S-02 — Authentication & Session Security Web Contract & Test Suite', () => {
  describe('1. Contract Metadata & Security Principles', () => {
    it('enforces ticket metadata and P0 blocking priority', () => {
      assert.equal(S02_TICKET_ID, 'S-02');
      assert.equal(S02_PHASE, 'Production Security Hardening');
      assert.equal(S02_PRIORITY, 'P0 — BLOCKING');
      assert.equal(S02_STATUS, 'CERTIFIED_AUTHENTICATION_SESSION_SECURITY');
    });

    it('defines 4 canonical security principles', () => {
      assert.equal(Object.keys(S02_PRINCIPLES).length, 4);
      assert.ok(S02_PRINCIPLES.S02_P01_EXPLICIT_AUTHENTICATION);
      assert.ok(S02_PRINCIPLES.S02_P02_CONTINUOUS_SESSION_CONTROL);
      assert.ok(S02_PRINCIPLES.S02_P03_ROTATION_AND_REPLAY_DEFENSE);
      assert.ok(S02_PRINCIPLES.S02_P04_GX_WX_STRICT_ISOLATION);
    });

    it('defines 10 hard security invariants', () => {
      assert.equal(Object.keys(S02_INVARIANTS).length, 10);
      assert.ok(S02_INVARIANTS.S02_I01.includes('iss="nebula-auth"'));
      assert.ok(S02_INVARIANTS.S02_I02.includes('iss="nebula-admin-auth"'));
      assert.ok(S02_INVARIANTS.S02_I08.includes('GX cannot create, inherit'));
    });

    it('defines all 12 canonical security events', () => {
      assert.equal(S02_SECURITY_EVENTS.length, 12);
      assert.ok(S02_SECURITY_EVENTS.includes('LOGIN_SUCCESS'));
      assert.ok(S02_SECURITY_EVENTS.includes('LOGIN_FAILURE'));
      assert.ok(S02_SECURITY_EVENTS.includes('OAUTH_AUTHENTICATION'));
      assert.ok(S02_SECURITY_EVENTS.includes('SESSION_CREATED'));
      assert.ok(S02_SECURITY_EVENTS.includes('REFRESH_SUCCESS'));
      assert.ok(S02_SECURITY_EVENTS.includes('REFRESH_FAILURE'));
      assert.ok(S02_SECURITY_EVENTS.includes('REFRESH_REUSE_DETECTED'));
      assert.ok(S02_SECURITY_EVENTS.includes('SESSION_REVOKED'));
      assert.ok(S02_SECURITY_EVENTS.includes('LOGOUT'));
      assert.ok(S02_SECURITY_EVENTS.includes('GLOBAL_LOGOUT'));
      assert.ok(S02_SECURITY_EVENTS.includes('AUTH_RATE_LIMITED'));
      assert.ok(S02_SECURITY_EVENTS.includes('SESSION_INVALIDATED'));
    });

    it('defines complete 24-vector attack matrix (S02-01 to S02-24)', () => {
      assert.equal(S02_SECURITY_MATRIX.length, 24);
      const ids = S02_SECURITY_MATRIX.map((m) => m.id);
      for (let i = 1; i <= 24; i++) {
        const id = `S02-${String(i).padStart(2, '0')}`;
        assert.ok(ids.includes(id as any));
      }
    });
  });

  describe('2. Token Attacks (S02-01 to S02-06)', () => {
    const validClaims: AccessTokenClaims = {
      sub: 'usr-123',
      email: 'alex@nebula.security',
      sessionId: 'sess-456',
      iss: 'nebula-auth',
      aud: 'nebula-app',
      typ: 'user-access',
      iat: Math.floor(Date.now() / 1000) - 60,
      exp: Math.floor(Date.now() / 1000) + 900,
    };

    it('allows valid access token', () => {
      const res = validateAccessToken(validClaims);
      assert.equal(res.valid, true);
      assert.equal(res.httpStatus, 200);
      assert.equal(res.errorCode, 'OK');
    });

    it('S02-01: rejects expired access token (401)', () => {
      const expired = { ...validClaims, exp: Math.floor(Date.now() / 1000) - 10 };
      const res = validateAccessToken(expired);
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 401);
      assert.equal(res.errorCode, 'EXPIRED_TOKEN');
    });

    it('S02-02: rejects missing or invalid token payload (401)', () => {
      const res = validateAccessToken(null);
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 401);
      assert.equal(res.errorCode, 'MISSING_TOKEN');
    });

    it('S02-03: rejects wrong issuer (nebula-admin-auth) (401)', () => {
      const wrongIss = { ...validClaims, iss: 'nebula-admin-auth' as any };
      const res = validateAccessToken(wrongIss);
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 401);
      assert.equal(res.errorCode, 'WRONG_ISSUER');
    });

    it('S02-04: rejects wrong audience (401)', () => {
      const wrongAud = { ...validClaims, aud: 'other-service' as any };
      const res = validateAccessToken(wrongAud);
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 401);
      assert.equal(res.errorCode, 'WRONG_AUDIENCE');
    });

    it('S02-05: rejects wrong token type (admin-access) (401)', () => {
      const wrongTyp = { ...validClaims, typ: 'admin-access' as any };
      const res = validateAccessToken(wrongTyp);
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 401);
      assert.equal(res.errorCode, 'WRONG_TOKEN_TYPE');
    });

    it('S02-06: rejects missing mandatory claim (401)', () => {
      const missingSub = { ...validClaims, sub: '' };
      const res = validateAccessToken(missingSub);
      assert.equal(res.valid, false);
      assert.equal(res.httpStatus, 401);
      assert.equal(res.errorCode, 'MISSING_CLAIMS');

      const missingEmail = { ...validClaims, email: '' };
      assert.equal(validateAccessToken(missingEmail).valid, false);

      const missingSession = { ...validClaims, sessionId: '' };
      assert.equal(validateAccessToken(missingSession).valid, false);
    });
  });

  describe('3. Refresh Attacks (S02-07 to S02-12)', () => {
    const activeRefresh: RefreshTokenRecord = {
      sessionId: 'sess-1',
      userId: 'usr-1',
      refreshTokenHash: 'hash-abc',
      familyId: 'fam-1',
      sequenceNumber: 1,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      revokedAt: null,
      isRotated: false,
    };

    it('valid refresh allows rotation and issues new token', () => {
      const res = evaluateRefreshTokenRotation('hash-abc', activeRefresh, 'ACTIVE', 'usr-1');
      assert.equal(res.success, true);
      assert.equal(res.httpStatus, 200);
      assert.equal(res.event, 'REFRESH_SUCCESS');
      assert.equal(res.action, 'ISSUE_NEW_TOKEN');
    });

    it('S02-07: rejects expired refresh token (401)', () => {
      const expired = { ...activeRefresh, expiresAt: Date.now() - 1000 };
      const res = evaluateRefreshTokenRotation('hash-abc', expired, 'ACTIVE', 'usr-1');
      assert.equal(res.success, false);
      assert.equal(res.httpStatus, 401);
      assert.equal(res.event, 'REFRESH_FAILURE');
      assert.equal(res.action, 'DENY');
    });

    it('S02-08: rejects revoked refresh token (401)', () => {
      const revoked = { ...activeRefresh, revokedAt: Date.now() - 5000 };
      const res = evaluateRefreshTokenRotation('hash-abc', revoked, 'ACTIVE', 'usr-1');
      assert.equal(res.success, false);
      assert.equal(res.httpStatus, 401);
      assert.equal(res.event, 'REFRESH_FAILURE');
      assert.equal(res.action, 'DENY');
    });

    it('S02-09: detects reused refresh token and revokes token family', () => {
      const rotated = { ...activeRefresh, isRotated: true };
      const res = evaluateRefreshTokenRotation('hash-abc', rotated, 'ACTIVE', 'usr-1');
      assert.equal(res.success, false);
      assert.equal(res.httpStatus, 401);
      assert.equal(res.event, 'REFRESH_REUSE_DETECTED');
      assert.equal(res.action, 'REVOKE_FAMILY');
    });

    it('S02-10: rejects foreign-user refresh exchange (401)', () => {
      const res = evaluateRefreshTokenRotation('hash-abc', activeRefresh, 'ACTIVE', 'other-user');
      assert.equal(res.success, false);
      assert.equal(res.httpStatus, 401);
      assert.equal(res.event, 'REFRESH_FAILURE');
      assert.equal(res.action, 'DENY');
    });

    it('S02-11: rejects malformed or empty refresh credentials (401)', () => {
      const res = evaluateRefreshTokenRotation('', activeRefresh, 'ACTIVE', 'usr-1');
      assert.equal(res.success, false);
      assert.equal(res.httpStatus, 401);
      assert.equal(res.event, 'REFRESH_FAILURE');
      assert.equal(res.action, 'DENY');
    });

    it('S02-12: specifies rate limited expected outcome for refresh flooding (429)', () => {
      const item = S02_SECURITY_MATRIX.find((m) => m.id === 'S02-12');
      assert.equal(item?.expectedStatus, 429);
      assert.equal(item?.expectedOutcome, 'RATE_LIMITED');
    });
  });

  describe('4. Session Attacks (S02-13 to S02-18)', () => {
    const baseSession: UserSessionRecord = {
      id: 'sess-1',
      userId: 'usr-1',
      userStatus: 'ACTIVE',
      createdAt: Date.now() - 3600000,
      lastActivityAt: Date.now() - 60000,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      revokedAt: null,
      tokenInvalidatedAt: null,
      deviceName: 'Chrome on macOS',
    };

    it('allows active valid session', () => {
      const res = evaluateSessionStatus(baseSession);
      assert.equal(res.active, true);
      assert.equal(res.httpStatus, 200);
    });

    it('S02-13: denies revoked session (401)', () => {
      const revoked = { ...baseSession, revokedAt: Date.now() - 5000 };
      const res = evaluateSessionStatus(revoked);
      assert.equal(res.active, false);
      assert.equal(res.httpStatus, 401);
      assert.ok(res.reason.includes('revoked'));
    });

    it('S02-14: denies expired session (401)', () => {
      const expired = { ...baseSession, expiresAt: Date.now() - 5000 };
      const res = evaluateSessionStatus(expired);
      assert.equal(res.active, false);
      assert.equal(res.httpStatus, 401);
      assert.ok(res.reason.includes('expired'));
    });

    it('S02-15: denies session when account is deactivated (401)', () => {
      const deactivated = { ...baseSession, userStatus: 'DEACTIVATED' as const };
      const res = evaluateSessionStatus(deactivated);
      assert.equal(res.active, false);
      assert.equal(res.httpStatus, 401);
      assert.ok(res.reason.includes('deactivated'));
    });

    it('S02-16: denies session fixation by requiring fresh post-auth session context', () => {
      const fixated = evaluateSessionFixation('session-fixed-id', 'session-fixed-id');
      assert.equal(fixated.isSecure, false);
      assert.ok(fixated.reason.includes('Session fixation detected'));

      const secure = evaluateSessionFixation('pre-auth-id', 'post-auth-fresh-id');
      assert.equal(secure.isSecure, true);
    });

    it('S02-17: prevents browser Back resurrection after logout', () => {
      const loggedOut = { ...baseSession, revokedAt: Date.now() - 30000 };
      const res = evaluateSessionStatus(loggedOut);
      assert.equal(res.active, false);
      assert.equal(res.httpStatus, 401);
    });

    it('S02-18: denies session created before global tokenInvalidatedAt (401)', () => {
      const globallyInvalidated = {
        ...baseSession,
        createdAt: Date.now() - 7200000,
        tokenInvalidatedAt: Date.now() - 3600000,
      };
      const res = evaluateSessionStatus(globallyInvalidated);
      assert.equal(res.active, false);
      assert.equal(res.httpStatus, 401);
      assert.ok(res.reason.includes('global security action'));
    });
  });

  describe('5. GX Boundary Attacks (S02-19 to S02-24)', () => {
    it('S02-19: denies implicit authentication from GX into WX (401)', () => {
      const res = evaluateGxBoundary({
        requestedPath: '/workspace',
        callerIdentityType: 'GUEST',
        presentedCredentialType: 'guest-token',
      });
      assert.equal(res.allowed, false);
      assert.equal(res.httpStatus, 401);
      assert.equal(res.effectivePlane, 'GX');
    });

    it('S02-20: denies guest ID to user session conversion without authentication (401)', () => {
      const res = evaluateGxBoundary({
        requestedPath: '/api/v1/workspace/overview',
        callerIdentityType: 'GUEST',
        presentedCredentialType: 'none',
      });
      assert.equal(res.allowed, false);
      assert.equal(res.httpStatus, 401);
    });

    it('S02-21: denies guest credential on /auth/refresh (401)', () => {
      const res = evaluateRefreshTokenRotation('guest-id-hash', null);
      assert.equal(res.success, false);
      assert.equal(res.httpStatus, 401);
      assert.equal(res.action, 'DENY');
    });

    it('S02-22: authenticated browser opening /guest remains in GX plane (200)', () => {
      const res = evaluateGxBoundary({
        requestedPath: '/guest',
        callerIdentityType: 'USER',
        presentedCredentialType: 'user-access',
      });
      assert.equal(res.allowed, true);
      assert.equal(res.effectivePlane, 'GX');
      assert.ok(res.reason.includes('remains strictly GX'));
    });

    it('S02-23: explicit authorized claim of guest session succeeds (200)', () => {
      const res = evaluateGxBoundary({
        requestedPath: '/api/v1/guest/claim',
        callerIdentityType: 'USER',
        presentedCredentialType: 'user-access',
        isClaimAction: true,
        guestSessionStatus: 'ACTIVE',
      });
      assert.equal(res.allowed, true);
      assert.equal(res.effectivePlane, 'WX');
      assert.equal(res.httpStatus, 200);
    });

    it('S02-24: denies replay of already converted/claimed guest session (403)', () => {
      const res = evaluateGxBoundary({
        requestedPath: '/api/v1/guest/claim',
        callerIdentityType: 'USER',
        presentedCredentialType: 'user-access',
        isClaimAction: true,
        isClaimReplayed: true,
        guestSessionStatus: 'CONVERTED',
      });
      assert.equal(res.allowed, false);
      assert.equal(res.httpStatus, 403);
      assert.ok(res.reason.includes('already claimed'));
    });
  });

  describe('6. Abuse Protection & Credential Redaction', () => {
    it('completely redacts passwords, refresh tokens, access tokens, and secrets from log payloads', () => {
      const rawLog = {
        userId: 'usr-123',
        email: 'user@example.com',
        password: 'SuperSecretPassword!123',
        confirmPassword: 'SuperSecretPassword!123',
        refreshToken: 'raw-refresh-hex-string',
        accessToken: 'bearer-jwt-token-content',
        authorization: 'Bearer jwt.raw.token',
        nested: {
          clientSecret: 'oauth-client-secret',
          safeField: 'infrastructure-domain.com',
          refreshTokenHash: 'hash-abc',
        },
      };

      const sanitized = sanitizeLogData(rawLog);
      assert.equal(sanitized.password, '[REDACTED]');
      assert.equal(sanitized.confirmPassword, '[REDACTED]');
      assert.equal(sanitized.refreshToken, '[REDACTED]');
      assert.equal(sanitized.accessToken, '[REDACTED]');
      assert.equal(sanitized.authorization, '[REDACTED]');
      assert.equal(sanitized.nested.clientSecret, '[REDACTED]');
      assert.equal(sanitized.nested.refreshTokenHash, '[REDACTED]');
      assert.equal(sanitized.nested.safeField, 'infrastructure-domain.com');
      assert.equal(sanitized.email, 'user@example.com');
    });
  });

  describe('7. Certification Gate', () => {
    it('verifies the exact S-02 Certification Gate statement passes', () => {
      const gate = verifyS02Certification(
        'Nebula User authentication and sessions are independently established, cryptographically validated, lifecycle-controlled, revocable, replay-resistant, and isolated from Guest and Admin security planes. No frontend state, GX session, stale credential, or implicit browser context can manufacture or inherit authenticated Workspace access.'
      );

      assert.equal(gate.passed, true);
      assert.ok(gate.similarityRatio >= 0.99);
      assert.equal(gate.canonicalStatement, S02_CERTIFICATION_STATEMENT);
    });
  });
});
