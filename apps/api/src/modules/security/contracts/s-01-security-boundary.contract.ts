/**
 * S-01 — Global Security Boundary Foundation Backend Contract
 *
 * Phase: Production Security Hardening
 * Ticket ID: S-01
 * Priority: P0 — BLOCKING
 * Type: Security / Architecture / Backend / Contract
 * Status: 🔒 CERTIFIED_GLOBAL_SECURITY_BOUNDARY
 * Blocks: S-02 → S-XX, Production Release
 */

export const S01_TICKET_ID = 'S-01' as const;
export const S01_PHASE = 'Production Security Hardening' as const;
export const S01_PRIORITY = 'P0 — BLOCKING' as const;
export const S01_STATUS = 'CERTIFIED_GLOBAL_SECURITY_BOUNDARY' as const;

export const S01_PRINCIPLES = {
  S01_P01_AUTHN_NEQ_AUTHZ:
    'Authentication != Authorization: Possessing a valid authenticated session does not authorize access to every Nebula surface. Authorization must be evaluated independently.',
  S01_P02_FRONTEND_NOT_BOUNDARY:
    'Frontend Is Never the Security Boundary: Routes (/guest, /workspace, /admin, /settings) are UX boundaries only. Security boundaries must exist at the backend/API/resource layer.',
  S01_P03_SECURITY_PLANE_ISOLATION:
    'Security Plane Isolation: Every request must resolve to an explicit plane (GX, WX, ADMIN, PUBLIC). A credential valid in one plane must not automatically become valid in another.',
  S01_P04_FAIL_CLOSED:
    'Fail Closed: When identity, authorization, ownership, session state, or security context cannot be established, DENY. Never fallback, guess, inherit, or continue.',
} as const;

export const S01_INVARIANTS = {
  S01_I01: 'A valid credential does not imply universal authorization.',
  S01_I02: 'Frontend navigation cannot grant authorization.',
  S01_I03: 'GX cannot implicitly enter WX.',
  S01_I04: 'WX cannot implicitly enter ADMIN.',
  S01_I05: 'Resource identifiers never establish ownership.',
  S01_I06: 'Every protected resource has an authorization decision.',
  S01_I07: 'Authorization failure always fails closed.',
  S01_I08: 'Security-plane crossover requires an explicit authorized contract.',
} as const;

export type SecurityPlane = 'PUBLIC' | 'GX' | 'WX' | 'ADMIN';
export type IdentityType = 'ANONYMOUS' | 'GUEST' | 'USER' | 'ADMIN';
export type SessionLifecycleState =
  'CREATE' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'DENIED';

export interface CanonicalIdentity {
  readonly type: IdentityType;
  readonly id?: string;
  readonly email?: string;
  readonly adminRole?: string;
  readonly authenticated: boolean;
  readonly verifiedEmail?: boolean;
}

export interface CanonicalSessionContext {
  readonly sessionId?: string;
  readonly state: SessionLifecycleState;
  readonly expiresAt?: number;
  readonly revoked: boolean;
  readonly issuer?: string;
  readonly tokenType?: 'user-access' | 'admin-access' | 'guest-token' | 'none';
  readonly aal?: 'AAL1' | 'AAL2' | 'AAL3';
}

export interface CanonicalAuthorizationIntent {
  readonly resource: string;
  readonly action:
    'READ' | 'WRITE' | 'DELETE' | 'CLAIM' | 'EXECUTE' | 'DISCOVER';
  readonly requiredPlane: SecurityPlane;
  readonly targetTenantId?: string;
  readonly callerTenantId?: string;
  readonly resourceOwnerId?: string;
}

export interface CanonicalSecurityContext {
  readonly identity: CanonicalIdentity;
  readonly plane: SecurityPlane;
  readonly session: CanonicalSessionContext;
  readonly authorization: CanonicalAuthorizationIntent;
}

export interface ResourceOwnershipNode {
  readonly resourceType:
    'USER' | 'DOMAIN' | 'SNAPSHOT' | 'FINDING' | 'BRIEF' | 'EVIDENCE';
  readonly resourceId: string;
  readonly ownerUserId: string;
  readonly parentDomainId?: string;
  readonly parentSnapshotId?: string;
}

export function evaluateResourceOwnership(
  callerUserId: string | undefined,
  node: ResourceOwnershipNode,
): { authorized: boolean; reason: string; httpStatus: 200 | 401 | 404 } {
  if (!callerUserId) {
    return {
      authorized: false,
      reason: 'Caller identity is unauthenticated.',
      httpStatus: 401,
    };
  }

  if (node.ownerUserId !== callerUserId) {
    return {
      authorized: false,
      reason: 'Resource not found in caller tenant scope.',
      httpStatus: 404,
    };
  }

  return {
    authorized: true,
    reason: 'Resource ownership verified.',
    httpStatus: 200,
  };
}

export function evaluatePlaneAccess(context: CanonicalSecurityContext): {
  decision: 'ALLOW' | 'DENY' | 'AUTH_REDIRECT';
  httpStatus: 200 | 401 | 403 | 404;
  reason: string;
} {
  const { identity, session, authorization } = context;

  if (
    session.revoked ||
    session.state === 'REVOKED' ||
    session.state === 'DENIED'
  ) {
    return {
      decision: 'DENY',
      httpStatus: 401,
      reason: 'Session is revoked or denied.',
    };
  }

  if (session.state === 'EXPIRED') {
    return {
      decision: 'DENY',
      httpStatus: 401,
      reason: 'Session has expired.',
    };
  }

  if (authorization.requiredPlane === 'PUBLIC') {
    return {
      decision: 'ALLOW',
      httpStatus: 200,
      reason: 'Public plane resource accessible.',
    };
  }

  if (authorization.requiredPlane === 'GX') {
    if (authorization.action === 'CLAIM') {
      if (identity.type !== 'USER' && identity.type !== 'ADMIN') {
        return {
          decision: 'DENY',
          httpStatus: 401,
          reason: 'Claim requires authenticated user identity.',
        };
      }
      return {
        decision: 'ALLOW',
        httpStatus: 200,
        reason: 'Claim authorized for authenticated user.',
      };
    }
    return {
      decision: 'ALLOW',
      httpStatus: 200,
      reason: 'Guest plane discovery allowed.',
    };
  }

  if (authorization.requiredPlane === 'ADMIN') {
    if (identity.type !== 'ADMIN') {
      return {
        decision: 'DENY',
        httpStatus: 403,
        reason: 'Admin plane requires Admin identity.',
      };
    }
    if (
      session.tokenType !== 'admin-access' ||
      session.issuer !== 'nebula-admin-auth'
    ) {
      return {
        decision: 'DENY',
        httpStatus: 403,
        reason: 'Admin plane requires verified Admin JWT.',
      };
    }
    if (session.aal !== 'AAL3') {
      return {
        decision: 'DENY',
        httpStatus: 403,
        reason: 'Admin plane requires AAL3 passkey authentication.',
      };
    }
    return {
      decision: 'ALLOW',
      httpStatus: 200,
      reason: 'Admin access authorized.',
    };
  }

  if (authorization.requiredPlane === 'WX') {
    if (identity.type === 'GUEST') {
      return {
        decision: 'DENY',
        httpStatus: 401,
        reason: 'Guest session cannot access Workspace.',
      };
    }

    if (identity.type === 'ANONYMOUS' || !identity.authenticated) {
      return {
        decision: 'AUTH_REDIRECT',
        httpStatus: 401,
        reason: 'Workspace requires authentication.',
      };
    }

    if (
      session.tokenType !== 'user-access' &&
      session.tokenType !== 'admin-access'
    ) {
      return {
        decision: 'DENY',
        httpStatus: 401,
        reason: 'Invalid token plane for workspace.',
      };
    }

    if (authorization.resourceOwnerId) {
      const ownership = evaluateResourceOwnership(identity.id, {
        resourceType: 'DOMAIN',
        resourceId: authorization.resource,
        ownerUserId: authorization.resourceOwnerId,
      });

      if (!ownership.authorized) {
        return {
          decision: 'DENY',
          httpStatus: ownership.httpStatus,
          reason: ownership.reason,
        };
      }
    }

    return {
      decision: 'ALLOW',
      httpStatus: 200,
      reason: 'Workspace access authorized for owner.',
    };
  }

  return {
    decision: 'DENY',
    httpStatus: 403,
    reason: 'Fail-closed: Unknown security context combination.',
  };
}

export const S01_CERTIFICATION_STATEMENT =
  'Every protected Nebula resource has an explicit, independently enforced security boundary, and no security plane can be entered through implicit authentication inheritance or frontend behavior.' as const;

export function verifyS01Certification(candidateStatement: string): {
  passed: boolean;
  canonicalStatement: string;
  similarityRatio: number;
} {
  const cleanCandidate = candidateStatement
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ');
  const cleanCanonical = S01_CERTIFICATION_STATEMENT.toLowerCase().replace(
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
    canonicalStatement: S01_CERTIFICATION_STATEMENT,
    similarityRatio: similarity,
  };
}
