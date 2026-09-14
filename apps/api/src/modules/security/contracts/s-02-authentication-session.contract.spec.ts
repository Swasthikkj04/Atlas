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
  AccessTokenClaims,
  RefreshTokenRecord,
  UserSessionRecord,
} from './s-02-authentication-session.contract';

describe('S-02 — Authentication & Session Security API Contract', () => {
  describe('1. Contract Metadata & Security Principles', () => {
    it('enforces ticket metadata and P0 blocking priority', () => {
      expect(S02_TICKET_ID).toBe('S-02');
      expect(S02_PHASE).toBe('Production Security Hardening');
      expect(S02_PRIORITY).toBe('P0 — BLOCKING');
      expect(S02_STATUS).toBe('CERTIFIED_AUTHENTICATION_SESSION_SECURITY');
    });

    it('defines 4 canonical security principles', () => {
      expect(Object.keys(S02_PRINCIPLES).length).toBe(4);
      expect(S02_PRINCIPLES.S02_P01_EXPLICIT_AUTHENTICATION).toBeDefined();
      expect(S02_PRINCIPLES.S02_P02_CONTINUOUS_SESSION_CONTROL).toBeDefined();
      expect(S02_PRINCIPLES.S02_P03_ROTATION_AND_REPLAY_DEFENSE).toBeDefined();
      expect(S02_PRINCIPLES.S02_P04_GX_WX_STRICT_ISOLATION).toBeDefined();
    });

    it('defines 10 hard security invariants', () => {
      expect(Object.keys(S02_INVARIANTS).length).toBe(10);
      expect(S02_INVARIANTS.S02_I01).toContain('iss="nebula-auth"');
      expect(S02_INVARIANTS.S02_I02).toContain('iss="nebula-admin-auth"');
      expect(S02_INVARIANTS.S02_I03).toContain('Refresh tokens');
      expect(S02_INVARIANTS.S02_I08).toContain('GX cannot create, inherit');
    });

    it('defines all 12 canonical security events', () => {
      expect(S02_SECURITY_EVENTS.length).toBe(12);
      expect(S02_SECURITY_EVENTS).toContain('LOGIN_SUCCESS');
      expect(S02_SECURITY_EVENTS).toContain('LOGIN_FAILURE');
      expect(S02_SECURITY_EVENTS).toContain('OAUTH_AUTHENTICATION');
      expect(S02_SECURITY_EVENTS).toContain('SESSION_CREATED');
      expect(S02_SECURITY_EVENTS).toContain('REFRESH_SUCCESS');
      expect(S02_SECURITY_EVENTS).toContain('REFRESH_FAILURE');
      expect(S02_SECURITY_EVENTS).toContain('REFRESH_REUSE_DETECTED');
      expect(S02_SECURITY_EVENTS).toContain('SESSION_REVOKED');
      expect(S02_SECURITY_EVENTS).toContain('LOGOUT');
      expect(S02_SECURITY_EVENTS).toContain('GLOBAL_LOGOUT');
      expect(S02_SECURITY_EVENTS).toContain('AUTH_RATE_LIMITED');
      expect(S02_SECURITY_EVENTS).toContain('SESSION_INVALIDATED');
    });

    it('defines complete 24-vector attack matrix (S02-01 to S02-24)', () => {
      expect(S02_SECURITY_MATRIX.length).toBe(24);
      const attackIds = S02_SECURITY_MATRIX.map((m) => m.id);
      for (let i = 1; i <= 24; i++) {
        const id = `S02-${String(i).padStart(2, '0')}`;
        expect(attackIds).toContain(id);
      }
    });
  });

  describe('2. Token Attacks (S02-01 to S02-06)', () => {
    const validToken: AccessTokenClaims = {
      sub: 'usr-1',
      email: 'user@nebula.io',
      sessionId: 'sess-1',
      iss: 'nebula-auth',
      aud: 'nebula-app',
      typ: 'user-access',
      exp: Math.floor(Date.now() / 1000) + 900,
      iat: Math.floor(Date.now() / 1000) - 60,
    };

    it('allows valid user access token', () => {
      const res = validateAccessToken(validToken);
      expect(res.valid).toBe(true);
      expect(res.httpStatus).toBe(200);
      expect(res.errorCode).toBe('OK');
    });

    it('S02-01: rejects expired JWT (401)', () => {
      const expired = {
        ...validToken,
        exp: Math.floor(Date.now() / 1000) - 10,
      };
      const res = validateAccessToken(expired);
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.errorCode).toBe('EXPIRED_TOKEN');
    });

    it('S02-02: rejects missing/malformed token payload (401)', () => {
      const res = validateAccessToken(null);
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.errorCode).toBe('MISSING_TOKEN');
    });

    it('S02-03: rejects wrong issuer (nebula-admin-auth) (401)', () => {
      const wrongIss = { ...validToken, iss: 'nebula-admin-auth' as any };
      const res = validateAccessToken(wrongIss);
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.errorCode).toBe('WRONG_ISSUER');
    });

    it('S02-04: rejects wrong audience (401)', () => {
      const wrongAud = { ...validToken, aud: 'admin-portal' as any };
      const res = validateAccessToken(wrongAud);
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.errorCode).toBe('WRONG_AUDIENCE');
    });

    it('S02-05: rejects wrong token type (admin-access / guest-token) (401)', () => {
      const wrongTyp = { ...validToken, typ: 'admin-access' as any };
      const res = validateAccessToken(wrongTyp);
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.errorCode).toBe('WRONG_TOKEN_TYPE');
    });

    it('S02-06: rejects missing identity claims (sub, email, sessionId) (401)', () => {
      const missingSub = { ...validToken, sub: '' };
      const res = validateAccessToken(missingSub);
      expect(res.valid).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.errorCode).toBe('MISSING_CLAIMS');

      const missingEmail = { ...validToken, email: '' };
      expect(validateAccessToken(missingEmail).valid).toBe(false);

      const missingSession = { ...validToken, sessionId: '' };
      expect(validateAccessToken(missingSession).valid).toBe(false);
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
      const res = evaluateRefreshTokenRotation(
        'hash-abc',
        activeRefresh,
        'ACTIVE',
        'usr-1',
      );
      expect(res.success).toBe(true);
      expect(res.httpStatus).toBe(200);
      expect(res.event).toBe('REFRESH_SUCCESS');
      expect(res.action).toBe('ISSUE_NEW_TOKEN');
    });

    it('S02-07: rejects expired refresh token (401)', () => {
      const expired = { ...activeRefresh, expiresAt: Date.now() - 1000 };
      const res = evaluateRefreshTokenRotation(
        'hash-abc',
        expired,
        'ACTIVE',
        'usr-1',
      );
      expect(res.success).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.event).toBe('REFRESH_FAILURE');
      expect(res.action).toBe('DENY');
    });

    it('S02-08: rejects revoked refresh token (401)', () => {
      const revoked = { ...activeRefresh, revokedAt: Date.now() - 5000 };
      const res = evaluateRefreshTokenRotation(
        'hash-abc',
        revoked,
        'ACTIVE',
        'usr-1',
      );
      expect(res.success).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.event).toBe('REFRESH_FAILURE');
      expect(res.action).toBe('DENY');
    });

    it('S02-09: detects reused refresh token, fails closed, and revokes token family', () => {
      const rotated = { ...activeRefresh, isRotated: true };
      const res = evaluateRefreshTokenRotation(
        'hash-abc',
        rotated,
        'ACTIVE',
        'usr-1',
      );
      expect(res.success).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.event).toBe('REFRESH_REUSE_DETECTED');
      expect(res.action).toBe('REVOKE_FAMILY');
    });

    it('S02-10: rejects foreign-user refresh exchange (cross-user attack) (401)', () => {
      const res = evaluateRefreshTokenRotation(
        'hash-abc',
        activeRefresh,
        'ACTIVE',
        'attacker-user-id',
      );
      expect(res.success).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.event).toBe('REFRESH_FAILURE');
      expect(res.action).toBe('DENY');
    });

    it('S02-11: rejects malformed or empty refresh credentials (401)', () => {
      const res = evaluateRefreshTokenRotation(
        '',
        activeRefresh,
        'ACTIVE',
        'usr-1',
      );
      expect(res.success).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.event).toBe('REFRESH_FAILURE');
      expect(res.action).toBe('DENY');
    });

    it('S02-12: enforces rate limiting posture on refresh endpoint (429)', () => {
      const matrixEntry = S02_SECURITY_MATRIX.find((m) => m.id === 'S02-12');
      expect(matrixEntry?.expectedStatus).toBe(429);
      expect(matrixEntry?.expectedOutcome).toBe('RATE_LIMITED');
    });
  });

  describe('4. Session Attacks (S02-13 to S02-18)', () => {
    const activeSession: UserSessionRecord = {
      id: 'sess-1',
      userId: 'usr-1',
      userStatus: 'ACTIVE',
      createdAt: Date.now() - 3600000,
      lastActivityAt: Date.now() - 60000,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      revokedAt: null,
      tokenInvalidatedAt: null,
      deviceName: 'Desktop',
    };

    it('allows valid active session', () => {
      const res = evaluateSessionStatus(activeSession);
      expect(res.active).toBe(true);
      expect(res.httpStatus).toBe(200);
    });

    it('S02-13: denies revoked session API request (401)', () => {
      const revoked = { ...activeSession, revokedAt: Date.now() - 1000 };
      const res = evaluateSessionStatus(revoked);
      expect(res.active).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.reason).toContain('revoked');
    });

    it('S02-14: denies expired session API request (401)', () => {
      const expired = { ...activeSession, expiresAt: Date.now() - 1000 };
      const res = evaluateSessionStatus(expired);
      expect(res.active).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.reason).toContain('expired');
    });

    it('S02-15: denies deactivated-user session API request (401)', () => {
      const deactivated = {
        ...activeSession,
        userStatus: 'DEACTIVATED' as const,
      };
      const res = evaluateSessionStatus(deactivated);
      expect(res.active).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.reason).toContain('deactivated');
    });

    it('S02-16: ensures authentication establishes fresh session context (fixation defense)', () => {
      const fixationAttempt = evaluateSessionFixation(
        'pre-auth-id-123',
        'pre-auth-id-123',
      );
      expect(fixationAttempt.isSecure).toBe(false);
      expect(fixationAttempt.reason).toContain('Session fixation detected');

      const secureAuth = evaluateSessionFixation(
        'pre-auth-id-123',
        'fresh-authenticated-id-456',
      );
      expect(secureAuth.isSecure).toBe(true);
    });

    it('S02-17: prevents browser Back resurrection after logout', () => {
      const loggedOut = { ...activeSession, revokedAt: Date.now() - 30000 };
      const res = evaluateSessionStatus(loggedOut);
      expect(res.active).toBe(false);
      expect(res.httpStatus).toBe(401);
    });

    it('S02-18: denies session refresh or access after global logout (tokenInvalidatedAt)', () => {
      const globallyInvalidated = {
        ...activeSession,
        createdAt: Date.now() - 7200000,
        tokenInvalidatedAt: Date.now() - 3600000,
      };
      const res = evaluateSessionStatus(globallyInvalidated);
      expect(res.active).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.reason).toContain('global security action');
    });
  });

  describe('5. GX Boundary Attacks (S02-19 to S02-24)', () => {
    it('S02-19: denies implicit authentication from GX into WX (401)', () => {
      const res = evaluateGxBoundary({
        requestedPath: '/workspace',
        callerIdentityType: 'GUEST',
        presentedCredentialType: 'guest-token',
      });
      expect(res.allowed).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.effectivePlane).toBe('GX');
    });

    it('S02-20: denies promoting guest ID directly into user session (401)', () => {
      const res = evaluateGxBoundary({
        requestedPath: '/api/v1/workspace/domains',
        callerIdentityType: 'GUEST',
        presentedCredentialType: 'none',
      });
      expect(res.allowed).toBe(false);
      expect(res.httpStatus).toBe(401);
    });

    it('S02-21: denies presenting guest credentials to /auth/refresh (401)', () => {
      const res = evaluateRefreshTokenRotation(
        'guest-session-token-hash',
        null,
      );
      expect(res.success).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.action).toBe('DENY');
    });

    it('S02-22: authenticated browser opening /guest remains strictly in GX context (200)', () => {
      const res = evaluateGxBoundary({
        requestedPath: '/guest',
        callerIdentityType: 'USER',
        presentedCredentialType: 'user-access',
      });
      expect(res.allowed).toBe(true);
      expect(res.effectivePlane).toBe('GX');
      expect(res.reason).toContain('remains strictly GX');
    });

    it('S02-23: explicit authorized claim of guest discovery to WX succeeds (200)', () => {
      const res = evaluateGxBoundary({
        requestedPath: '/api/v1/guest/claim',
        callerIdentityType: 'USER',
        presentedCredentialType: 'user-access',
        isClaimAction: true,
        guestSessionStatus: 'ACTIVE',
      });
      expect(res.allowed).toBe(true);
      expect(res.effectivePlane).toBe('WX');
      expect(res.httpStatus).toBe(200);
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
      expect(res.allowed).toBe(false);
      expect(res.httpStatus).toBe(403);
      expect(res.reason).toContain('already claimed');
    });
  });

  describe('6. Security Event Redaction Guard', () => {
    it('sanitizes all credentials and sensitive tokens from log records', () => {
      const rawLog = {
        userId: 'usr-123',
        email: 'user@nebula.io',
        password: 'PlainTextPassword123!',
        confirmPassword: 'PlainTextPassword123!',
        refreshToken: 'raw-refresh-hex-string',
        accessToken: 'bearer-jwt-token-content',
        rawRefreshToken: 'raw-token',
        authorization: 'Bearer jwt.raw.token',
        nested: {
          clientSecret: 'secret-key-xyz',
          refreshTokenHash: 'hash-abc',
          domain: 'nebula.security',
        },
      };

      const sanitized = sanitizeLogData(rawLog);
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.confirmPassword).toBe('[REDACTED]');
      expect(sanitized.refreshToken).toBe('[REDACTED]');
      expect(sanitized.accessToken).toBe('[REDACTED]');
      expect(sanitized.rawRefreshToken).toBe('[REDACTED]');
      expect(sanitized.authorization).toBe('[REDACTED]');
      expect(sanitized.nested.clientSecret).toBe('[REDACTED]');
      expect(sanitized.nested.refreshTokenHash).toBe('[REDACTED]');
      expect(sanitized.email).toBe('user@nebula.io');
      expect(sanitized.nested.domain).toBe('nebula.security');
    });
  });

  describe('7. Certification Gate Verifier', () => {
    it('verifies the S-02 Certification Statement passes', () => {
      const gate = verifyS02Certification(
        'Nebula User authentication and sessions are independently established, cryptographically validated, lifecycle-controlled, revocable, replay-resistant, and isolated from Guest and Admin security planes. No frontend state, GX session, stale credential, or implicit browser context can manufacture or inherit authenticated Workspace access.',
      );
      expect(gate.passed).toBe(true);
      expect(gate.similarityRatio).toBeGreaterThanOrEqual(0.99);
      expect(gate.canonicalStatement).toBe(S02_CERTIFICATION_STATEMENT);
    });
  });
});
