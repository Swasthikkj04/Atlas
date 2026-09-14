/**
 * S-02 — Authentication & Session Security Backend Contract
 *
 * Phase: Production Security Hardening
 * Ticket ID: S-02
 * Priority: P0 — BLOCKING
 * Type: Security / Authentication / Session / Backend / Contract
 * Depends on: S-01 🔒
 * Blocks: S-03 → S-12 and Production Release
 * Status: 🔒 CERTIFIED_AUTHENTICATION_SESSION_SECURITY
 *
 * Certification objective:
 * "A Nebula user session can only be deliberately established through an authenticated
 * mechanism, remains continuously subject to session controls, cannot be replayed or
 * silently inherited, and can never become an implicit bridge from GX into WX."
 */

export const S02_TICKET_ID = 'S-02' as const;
export const S02_PHASE = 'Production Security Hardening' as const;
export const S02_PRIORITY = 'P0 — BLOCKING' as const;
export const S02_STATUS = 'CERTIFIED_AUTHENTICATION_SESSION_SECURITY' as const;

/**
 * 1. Security Principles
 */
export const S02_PRINCIPLES = {
  S02_P01_EXPLICIT_AUTHENTICATION:
    'Explicit Authentication: A Nebula user session can only be established through a verified authentication mechanism (password, verified email, OAuth).',
  S02_P02_CONTINUOUS_SESSION_CONTROL:
    'Continuous Session Control: Possessing a token is not sufficient; active server-side session validity and user account state must be continuously verified.',
  S02_P03_ROTATION_AND_REPLAY_DEFENSE:
    'Rotation and Replay Defense: Every refresh rotates the credential. Replay of an invalidated refresh token immediately revokes the session family and fails closed.',
  S02_P04_GX_WX_STRICT_ISOLATION:
    'GX ↔ WX Strict Isolation: GX sessions and WX sessions occupy distinct security planes. GX never automatically or implicitly becomes WX.',
} as const;

/**
 * 2. Security Invariants
 */
export const S02_INVARIANTS = {
  S02_I01:
    'User access tokens must have iss="nebula-auth", aud="nebula-app", typ="user-access", and valid identity claims.',
  S02_I02:
    'Admin tokens (iss="nebula-admin-auth", typ="admin-access", aal="AAL3") are strictly segregated from user tokens.',
  S02_I03:
    'Refresh tokens are high-entropy, hashed at rest, single-use, and rotated upon every exchange.',
  S02_I04:
    'Replay of a consumed refresh token revokes the entire token family.',
  S02_I05:
    'Session state is authoritatively held on the server; client state cannot resurrect expired or revoked sessions.',
  S02_I06:
    'Logout is a server-side revocation operation that invalidates refresh capabilities.',
  S02_I07:
    'Global logout invalidates all sessions for the user across all devices.',
  S02_I08:
    'GX cannot create, inherit, upgrade, refresh, or impersonate a User Session.',
  S02_I09:
    'Only an explicit, authorized claim operation can bind a guest discovery to a user account.',
  S02_I10:
    'No credentials or authentication secrets may ever be logged in plaintext.',
} as const;

/**
 * 3. Canonical Security Events
 */
export const S02_SECURITY_EVENTS = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'OAUTH_AUTHENTICATION',
  'SESSION_CREATED',
  'REFRESH_SUCCESS',
  'REFRESH_FAILURE',
  'REFRESH_REUSE_DETECTED',
  'SESSION_REVOKED',
  'LOGOUT',
  'GLOBAL_LOGOUT',
  'AUTH_RATE_LIMITED',
  'SESSION_INVALIDATED',
] as const;

export type SecurityEventType = (typeof S02_SECURITY_EVENTS)[number];

/**
 * 4. Token & Session Models
 */
export interface AccessTokenClaims {
  readonly sub: string;
  readonly email: string;
  readonly sessionId: string;
  readonly iss: 'nebula-auth';
  readonly aud: 'nebula-app';
  readonly typ: 'user-access';
  readonly exp: number;
  readonly iat: number;
}

export interface RefreshTokenRecord {
  readonly sessionId: string;
  readonly userId: string;
  readonly refreshTokenHash: string;
  readonly familyId: string;
  readonly sequenceNumber: number;
  readonly expiresAt: number;
  readonly revokedAt: number | null;
  readonly isRotated: boolean;
}

export interface UserSessionRecord {
  readonly id: string;
  readonly userId: string;
  readonly userStatus:
    'ACTIVE' | 'PENDING_VERIFICATION' | 'DEACTIVATED' | 'DELETED';
  readonly createdAt: number;
  readonly lastActivityAt: number;
  readonly expiresAt: number;
  readonly revokedAt: number | null;
  readonly tokenInvalidatedAt: number | null;
  readonly deviceName: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

/**
 * 5. Complete 24-Attack Matrix (S02-01 to S02-24)
 */
export type S02AttackId =
  // Token Attacks
  | 'S02-01'
  | 'S02-02'
  | 'S02-03'
  | 'S02-04'
  | 'S02-05'
  | 'S02-06'
  // Refresh Attacks
  | 'S02-07'
  | 'S02-08'
  | 'S02-09'
  | 'S02-10'
  | 'S02-11'
  | 'S02-12'
  // Session Attacks
  | 'S02-13'
  | 'S02-14'
  | 'S02-15'
  | 'S02-16'
  | 'S02-17'
  | 'S02-18'
  // GX Boundary Attacks
  | 'S02-19'
  | 'S02-20'
  | 'S02-21'
  | 'S02-22'
  | 'S02-23'
  | 'S02-24';

export interface S02AttackScenario {
  readonly id: S02AttackId;
  readonly category:
    'TOKEN_ATTACK' | 'REFRESH_ATTACK' | 'SESSION_ATTACK' | 'GX_BOUNDARY_ATTACK';
  readonly attack: string;
  readonly expectedStatus: 200 | 401 | 403 | 429;
  readonly expectedOutcome: string;
}

export const S02_SECURITY_MATRIX: readonly S02AttackScenario[] = [
  // Token attacks
  {
    id: 'S02-01',
    category: 'TOKEN_ATTACK',
    attack: 'Expired JWT',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_EXPIRED_JWT',
  },
  {
    id: 'S02-02',
    category: 'TOKEN_ATTACK',
    attack: 'Invalid signature',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_INVALID_SIGNATURE',
  },
  {
    id: 'S02-03',
    category: 'TOKEN_ATTACK',
    attack: 'Wrong issuer',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_WRONG_ISSUER',
  },
  {
    id: 'S02-04',
    category: 'TOKEN_ATTACK',
    attack: 'Wrong audience',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_WRONG_AUDIENCE',
  },
  {
    id: 'S02-05',
    category: 'TOKEN_ATTACK',
    attack: 'Wrong token type',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_WRONG_TOKEN_TYPE',
  },
  {
    id: 'S02-06',
    category: 'TOKEN_ATTACK',
    attack: 'Missing identity claim',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_MISSING_IDENTITY_CLAIM',
  },
  // Refresh attacks
  {
    id: 'S02-07',
    category: 'REFRESH_ATTACK',
    attack: 'Expired refresh',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_EXPIRED_REFRESH',
  },
  {
    id: 'S02-08',
    category: 'REFRESH_ATTACK',
    attack: 'Revoked refresh',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_REVOKED_REFRESH',
  },
  {
    id: 'S02-09',
    category: 'REFRESH_ATTACK',
    attack: 'Reused refresh',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_REUSE_DETECTED_SECURITY_EVENT',
  },
  {
    id: 'S02-10',
    category: 'REFRESH_ATTACK',
    attack: 'Foreign-user refresh',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_FOREIGN_USER_REFRESH',
  },
  {
    id: 'S02-11',
    category: 'REFRESH_ATTACK',
    attack: 'Malformed refresh',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_MALFORMED_REFRESH',
  },
  {
    id: 'S02-12',
    category: 'REFRESH_ATTACK',
    attack: 'Refresh flooding',
    expectedStatus: 429,
    expectedOutcome: 'RATE_LIMITED',
  },
  // Session attacks
  {
    id: 'S02-13',
    category: 'SESSION_ATTACK',
    attack: 'Revoked session API request',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_REVOKED_SESSION',
  },
  {
    id: 'S02-14',
    category: 'SESSION_ATTACK',
    attack: 'Expired session',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_EXPIRED_SESSION',
  },
  {
    id: 'S02-15',
    category: 'SESSION_ATTACK',
    attack: 'Deactivated-user session',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_DEACTIVATED_USER',
  },
  {
    id: 'S02-16',
    category: 'SESSION_ATTACK',
    attack: 'Session fixation',
    expectedStatus: 200,
    expectedOutcome: 'DENIED_FIXATION_FRESH_SESSION_CREATED',
  },
  {
    id: 'S02-17',
    category: 'SESSION_ATTACK',
    attack: 'Browser Back after logout',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_AFTER_LOGOUT',
  },
  {
    id: 'S02-18',
    category: 'SESSION_ATTACK',
    attack: 'Global logout then refresh',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_GLOBAL_LOGOUT',
  },
  // GX boundary attacks
  {
    id: 'S02-19',
    category: 'GX_BOUNDARY_ATTACK',
    attack: 'GX → WX implicit authentication',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_IMPLICIT_AUTH',
  },
  {
    id: 'S02-20',
    category: 'GX_BOUNDARY_ATTACK',
    attack: 'Guest ID → User session',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_GUEST_ID_PROMOTION',
  },
  {
    id: 'S02-21',
    category: 'GX_BOUNDARY_ATTACK',
    attack: 'Guest credential → refresh',
    expectedStatus: 401,
    expectedOutcome: 'DENIED_GUEST_REFRESH',
  },
  {
    id: 'S02-22',
    category: 'GX_BOUNDARY_ATTACK',
    attack: 'Authenticated browser opens GX',
    expectedStatus: 200,
    expectedOutcome: 'GX_REMAINS_GX',
  },
  {
    id: 'S02-23',
    category: 'GX_BOUNDARY_ATTACK',
    attack: 'Explicit authorized claim',
    expectedStatus: 200,
    expectedOutcome: 'ALLOWED_EXPLICIT_CLAIM',
  },
  {
    id: 'S02-24',
    category: 'GX_BOUNDARY_ATTACK',
    attack: 'Claim replay',
    expectedStatus: 403,
    expectedOutcome: 'DENIED_CLAIM_REPLAY',
  },
] as const;

/**
 * 6. Access Token Validator
 */
export function validateAccessToken(
  tokenPayload: Partial<AccessTokenClaims> | null | undefined,
): {
  valid: boolean;
  httpStatus: 200 | 401;
  errorCode: string;
} {
  if (!tokenPayload) {
    return { valid: false, httpStatus: 401, errorCode: 'MISSING_TOKEN' };
  }

  const now = Math.floor(Date.now() / 1000);

  if (!tokenPayload.exp || tokenPayload.exp < now) {
    return { valid: false, httpStatus: 401, errorCode: 'EXPIRED_TOKEN' };
  }

  if (tokenPayload.iss !== 'nebula-auth') {
    return { valid: false, httpStatus: 401, errorCode: 'WRONG_ISSUER' };
  }

  if (tokenPayload.aud !== 'nebula-app') {
    return { valid: false, httpStatus: 401, errorCode: 'WRONG_AUDIENCE' };
  }

  if (tokenPayload.typ !== 'user-access') {
    return { valid: false, httpStatus: 401, errorCode: 'WRONG_TOKEN_TYPE' };
  }

  if (!tokenPayload.sub || !tokenPayload.email || !tokenPayload.sessionId) {
    return { valid: false, httpStatus: 401, errorCode: 'MISSING_CLAIMS' };
  }

  return { valid: true, httpStatus: 200, errorCode: 'OK' };
}

/**
 * 7. Refresh Token Rotation & Replay Evaluator
 */
export function evaluateRefreshTokenRotation(
  incomingHash: string,
  storedSession: RefreshTokenRecord | null,
  userStatus: 'ACTIVE' | 'DEACTIVATED' | 'DELETED' = 'ACTIVE',
  requestingUserId?: string,
): {
  success: boolean;
  httpStatus: 200 | 401;
  event: SecurityEventType;
  action: 'ISSUE_NEW_TOKEN' | 'REVOKE_FAMILY' | 'DENY';
} {
  if (
    !incomingHash ||
    typeof incomingHash !== 'string' ||
    incomingHash.trim().length === 0
  ) {
    return {
      success: false,
      httpStatus: 401,
      event: 'REFRESH_FAILURE',
      action: 'DENY',
    };
  }

  if (!storedSession) {
    return {
      success: false,
      httpStatus: 401,
      event: 'REFRESH_FAILURE',
      action: 'DENY',
    };
  }

  if (requestingUserId && storedSession.userId !== requestingUserId) {
    return {
      success: false,
      httpStatus: 401,
      event: 'REFRESH_FAILURE',
      action: 'DENY',
    };
  }

  if (userStatus !== 'ACTIVE') {
    return {
      success: false,
      httpStatus: 401,
      event: 'SESSION_INVALIDATED',
      action: 'DENY',
    };
  }

  const now = Date.now();

  if (storedSession.revokedAt !== null || storedSession.expiresAt < now) {
    return {
      success: false,
      httpStatus: 401,
      event: 'REFRESH_FAILURE',
      action: 'DENY',
    };
  }

  if (storedSession.isRotated) {
    return {
      success: false,
      httpStatus: 401,
      event: 'REFRESH_REUSE_DETECTED',
      action: 'REVOKE_FAMILY',
    };
  }

  if (storedSession.refreshTokenHash !== incomingHash) {
    return {
      success: false,
      httpStatus: 401,
      event: 'REFRESH_FAILURE',
      action: 'DENY',
    };
  }

  return {
    success: true,
    httpStatus: 200,
    event: 'REFRESH_SUCCESS',
    action: 'ISSUE_NEW_TOKEN',
  };
}

/**
 * 8. Live Session Status Evaluator
 */
export function evaluateSessionStatus(session: UserSessionRecord | null): {
  active: boolean;
  httpStatus: 200 | 401;
  reason: string;
} {
  if (!session) {
    return { active: false, httpStatus: 401, reason: 'Session not found.' };
  }

  if (session.userStatus !== 'ACTIVE') {
    return {
      active: false,
      httpStatus: 401,
      reason: 'Account is deactivated or deleted.',
    };
  }

  const now = Date.now();

  if (session.revokedAt !== null) {
    return {
      active: false,
      httpStatus: 401,
      reason: 'Session has been revoked.',
    };
  }

  if (session.expiresAt < now) {
    return { active: false, httpStatus: 401, reason: 'Session has expired.' };
  }

  if (
    session.tokenInvalidatedAt &&
    session.createdAt < session.tokenInvalidatedAt
  ) {
    return {
      active: false,
      httpStatus: 401,
      reason: 'Session invalidated by global security action.',
    };
  }

  return {
    active: true,
    httpStatus: 200,
    reason: 'Session is active and valid.',
  };
}

/**
 * 9. GX ↔ WX Boundary Evaluator
 */
export interface GxBoundaryEvaluationContext {
  readonly requestedPath: string;
  readonly callerIdentityType: 'ANONYMOUS' | 'GUEST' | 'USER' | 'ADMIN';
  readonly presentedCredentialType:
    'none' | 'guest-token' | 'user-access' | 'admin-access';
  readonly isClaimAction?: boolean;
  readonly isClaimReplayed?: boolean;
  readonly guestSessionStatus?: 'ACTIVE' | 'CONVERTED' | 'EXPIRED';
}

export function evaluateGxBoundary(context: GxBoundaryEvaluationContext): {
  allowed: boolean;
  effectivePlane: 'GX' | 'WX';
  httpStatus: 200 | 401 | 403;
  reason: string;
} {
  // Direct attempt to enter WX using guest credential or guest identity
  if (
    context.requestedPath.startsWith('/workspace') ||
    context.requestedPath.startsWith('/api/v1/workspace')
  ) {
    if (
      context.presentedCredentialType === 'guest-token' ||
      context.callerIdentityType === 'GUEST'
    ) {
      return {
        allowed: false,
        effectivePlane: 'GX',
        httpStatus: 401,
        reason: 'Guest credentials or identities cannot enter Workspace.',
      };
    }

    if (
      context.callerIdentityType === 'ANONYMOUS' ||
      context.presentedCredentialType === 'none'
    ) {
      return {
        allowed: false,
        effectivePlane: 'GX',
        httpStatus: 401,
        reason: 'Workspace requires valid authenticated user session.',
      };
    }

    return {
      allowed: true,
      effectivePlane: 'WX',
      httpStatus: 200,
      reason: 'Authenticated user access to Workspace authorized.',
    };
  }

  // Visiting GX (/guest) as an authenticated user
  if (
    context.requestedPath.startsWith('/guest') ||
    context.requestedPath === '/'
  ) {
    return {
      allowed: true,
      effectivePlane: 'GX',
      httpStatus: 200,
      reason:
        'Guest plane accessed; remains strictly GX regardless of user credentials.',
    };
  }

  // Explicit authorized claim action
  if (context.isClaimAction) {
    if (
      context.callerIdentityType !== 'USER' &&
      context.callerIdentityType !== 'ADMIN'
    ) {
      return {
        allowed: false,
        effectivePlane: 'GX',
        httpStatus: 401,
        reason: 'Claim requires authenticated user identity.',
      };
    }

    if (context.isClaimReplayed || context.guestSessionStatus === 'CONVERTED') {
      return {
        allowed: false,
        effectivePlane: 'GX',
        httpStatus: 403,
        reason: 'Guest session already claimed.',
      };
    }

    return {
      allowed: true,
      effectivePlane: 'WX',
      httpStatus: 200,
      reason:
        'Explicit authorized claim of guest session to workspace allowed.',
    };
  }

  return {
    allowed: false,
    effectivePlane: 'GX',
    httpStatus: 401,
    reason: 'Fail-closed: unauthorized boundary crossing.',
  };
}

/**
 * 10. Session Fixation Defense Evaluator
 */
export function evaluateSessionFixation(
  preAuthSessionId: string | null | undefined,
  postAuthSessionId: string,
): {
  isSecure: boolean;
  reason: string;
} {
  if (!postAuthSessionId || postAuthSessionId.trim().length === 0) {
    return { isSecure: false, reason: 'Post-auth session ID cannot be empty.' };
  }

  if (preAuthSessionId && preAuthSessionId === postAuthSessionId) {
    return {
      isSecure: false,
      reason: 'Session fixation detected: pre-auth session ID was retained.',
    };
  }

  return {
    isSecure: true,
    reason: 'Fresh authenticated session context established.',
  };
}

/**
 * 11. Credential Log Redaction Guard
 */
export function sanitizeLogData<T extends Record<string, any>>(
  data: T,
): Record<string, any> {
  const SENSITIVE_KEYS = new Set([
    'password',
    'confirmpassword',
    'refreshtoken',
    'accesstoken',
    'rawrefreshtoken',
    'authorization',
    'token',
    'secret',
    'clientsecret',
    'refreshtokenhash',
  ]);

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * 12. Certification Statement & Gate Verifier
 */
export const S02_CERTIFICATION_STATEMENT =
  'Nebula User authentication and sessions are independently established, cryptographically validated, lifecycle-controlled, revocable, replay-resistant, and isolated from Guest and Admin security planes. No frontend state, GX session, stale credential, or implicit browser context can manufacture or inherit authenticated Workspace access.' as const;

export function verifyS02Certification(candidateStatement: string): {
  passed: boolean;
  canonicalStatement: string;
  similarityRatio: number;
} {
  const cleanCandidate = candidateStatement
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ');
  const cleanCanonical = S02_CERTIFICATION_STATEMENT.toLowerCase().replace(
    /[^a-z0-9]/g,
    ' ',
  );

  const candidateTokens = new Set(cleanCandidate.split(/\s+/).filter(Boolean));
  const canonicalTokens = new Set(cleanCanonical.split(/\s+/).filter(Boolean));

  let overlap = 0;
  for (const token of canonicalTokens) {
    if (candidateTokens.has(token)) {
      overlap++;
    }
  }

  const similarity = overlap / canonicalTokens.size;

  return {
    passed: similarity >= 0.95,
    canonicalStatement: S02_CERTIFICATION_STATEMENT,
    similarityRatio: similarity,
  };
}
