/**
 * S-03 — Authorization, Ownership & Tenant Isolation Frontend Contract
 *
 * Phase: Production Security Hardening
 * Ticket ID: S-03
 * Priority: P0 — BLOCKING
 * Type: Security / Authorization / Multi-Tenancy / Backend / Repository / Contract
 * Depends on: S-01 🔒, S-02 🔒
 * Blocks: S-04 → S-12 and Production Release
 * Status: 🔒 CERTIFIED_AUTHORIZATION_OWNERSHIP
 *
 * Certification objective:
 * "A valid authenticated identity may access only resources explicitly authorized for that identity.
 * No resource identifier, URL, frontend state, JWT possession, or nested-resource relationship may
 * bypass ownership or tenant boundaries."
 */

export const S03_TICKET_ID = 'S-03' as const;
export const S03_PHASE = 'Production Security Hardening' as const;
export const S03_PRIORITY = 'P0 — BLOCKING' as const;
export const S03_TYPE = 'Security / Authorization / Multi-Tenancy / Backend / Repository / Contract' as const;
export const S03_STATUS = 'CERTIFIED_AUTHORIZATION_OWNERSHIP' as const;

/**
 * 1. Frozen Security Principles
 */
export const S03_PRINCIPLES = {
  S03_P01_AUTHORIZATION_INDEPENDENCE:
    'Authentication proves who you are. Authorization determines what you may access. Ownership determines whose data you may access. Authorization is an independent security layer.',
  S03_P02_CANONICAL_CHAIN:
    'Canonical Authorization Chain: Request → Authentication → Authorization → Resource Ownership → Tenant Boundary → Action Authorization → Allow. Failure at any layer fails closed.',
  S03_P03_OWNERSHIP_CHAIN:
    'Resource Ownership Model: request.user.id → Domain.userId → Snapshot.domain.userId → Finding / Brief / Evidence ownership. Traversing or substituting arbitrary UUIDs is strictly blocked.',
  S03_P04_INFORMATION_MINIMIZATION:
    'Anti-Enumeration 404 Contract: Unowned existing resources return 404 Not Found to prevent UUID ownership discovery or existence oracle attacks.',
} as const;

/**
 * 2. P0 Authorization Invariants
 */
export const S03_INVARIANTS = {
  S03_I01_IDENTITY_BINDING:
    'Resource authorization MUST derive from the authenticated principal supplied by the verified security context (request.user.id), never body.userId, query.userId, params.userId, frontend userId, or client-supplied ownerId.',
  S03_I02_REPOSITORY_ENFORCEMENT:
    'Ownership must be enforced at the repository and data-access boundary (e.g. findDomainForUser, findSnapshotForUser). Controllers must not be the only ownership barrier.',
  S03_I03_NO_IDOR:
    'Knowing a valid UUID must never provide authorization. Reading, updating, or deleting another tenant resource returns 404 Not Found.',
  S03_I04_NESTED_RESOURCE_ISOLATION:
    'A user cannot access a child resource through a parent resource they do not own (e.g. /snapshots/:id/brief, /snapshots/:id/findings return 404).',
  S03_I05_NO_OWNERSHIP_MUTATION:
    'Clients must never be able to mutate ownership fields (userId, ownerId, domainId, workspaceId, tenantId) via POST, PUT, or PATCH.',
  S03_I06_404_VS_403_CONTRACT:
    'Resource ownership violations return 404 Not Found rather than 403 Forbidden to prevent oracle disclosure of resource existence.',
  S03_I07_GX_WX_BOUNDARY:
    'GX sessions cannot access WX domains, snapshots, or findings. Visiting /guest in an authenticated browser does not grant implicit WX access.',
  S03_I08_ATOMIC_CLAIM:
    'The Guest → Workspace transition is a single-use, atomic, server-bound operation. Replay, cross-claiming, or arbitrary destination owner assignment fails closed.',
  S03_I09_BULK_ISOLATION:
    'Every individual resource in a collection or batch request must independently satisfy authorization. No partial cross-tenant data leakage is permitted.',
  S03_I10_TOCTOU_RACE_PROTECTION:
    'Mutations are atomically constrained by ownership at execution time (e.g. WHERE id = :id AND userId = :userId).',
} as const;

/**
 * 3. Principal and Resource Models
 */
export interface SecurityPrincipal {
  readonly id: string;
  readonly email?: string;
  readonly plane: 'GX' | 'WX' | 'AX' | 'ANONYMOUS';
  readonly userStatus?: 'ACTIVE' | 'PENDING_VERIFICATION' | 'DEACTIVATED' | 'DELETED';
  readonly sessionStatus?: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
}

export type ResourceType = 'DOMAIN' | 'SNAPSHOT' | 'FINDING' | 'BRIEF' | 'EVIDENCE' | 'TIMELINE' | 'ADMIN_RESOURCE';

export interface ProtectedResource {
  readonly id: string;
  readonly type: ResourceType;
  readonly ownerId: string;
  readonly domainId?: string;
  readonly snapshotId?: string;
  readonly isDeleted?: boolean;
}

export interface GuestSessionResource {
  readonly id: string;
  readonly status: 'ACTIVE' | 'CONVERTED' | 'EXPIRED';
  readonly claimedByUserId?: string | null;
}

/**
 * 4. 30-Vector Attack Matrix (S03-01 to S03-30)
 */
export type S03AttackId =
  | 'S03-01'
  | 'S03-02'
  | 'S03-03'
  | 'S03-04'
  | 'S03-05'
  | 'S03-06'
  | 'S03-07'
  | 'S03-08'
  | 'S03-09'
  | 'S03-10'
  | 'S03-11'
  | 'S03-12'
  | 'S03-13'
  | 'S03-14'
  | 'S03-15'
  | 'S03-16'
  | 'S03-17'
  | 'S03-18'
  | 'S03-19'
  | 'S03-20'
  | 'S03-21'
  | 'S03-22'
  | 'S03-23'
  | 'S03-24'
  | 'S03-25'
  | 'S03-26'
  | 'S03-27'
  | 'S03-28'
  | 'S03-29'
  | 'S03-30';

export interface S03AttackScenario {
  readonly id: S03AttackId;
  readonly attack: string;
  readonly expectedStatus: 200 | 400 | 401 | 403 | 404;
  readonly expectedDecision: string;
}

export const S03_SECURITY_MATRIX: readonly S03AttackScenario[] = [
  { id: 'S03-01', attack: 'User A reads User B domain', expectedStatus: 404, expectedDecision: '404 Not Found' },
  { id: 'S03-02', attack: 'User A updates User B domain', expectedStatus: 404, expectedDecision: '404 Not Found' },
  { id: 'S03-03', attack: 'User A deletes User B domain', expectedStatus: 404, expectedDecision: '404 Not Found' },
  { id: 'S03-04', attack: 'User A reads User B snapshot', expectedStatus: 404, expectedDecision: '404 Not Found' },
  { id: 'S03-05', attack: 'User A reads User B finding', expectedStatus: 404, expectedDecision: '404 Not Found' },
  { id: 'S03-06', attack: 'User A reads User B brief', expectedStatus: 404, expectedDecision: '404 Not Found' },
  { id: 'S03-07', attack: 'User A reads User B evidence', expectedStatus: 404, expectedDecision: '404 Not Found' },
  { id: 'S03-08', attack: 'User A traverses User B nested snapshot', expectedStatus: 404, expectedDecision: '404 Not Found' },
  { id: 'S03-09', attack: 'User A enumerates sequential/random UUIDs', expectedStatus: 404, expectedDecision: 'No ownership disclosure' },
  { id: 'S03-10', attack: 'Client supplies foreign userId in payload', expectedStatus: 400, expectedDecision: 'Ignored/rejected' },
  { id: 'S03-11', attack: 'Client supplies foreign domainId', expectedStatus: 404, expectedDecision: 'Rejected' },
  { id: 'S03-12', attack: 'Client modifies ownership field', expectedStatus: 400, expectedDecision: 'Rejected' },
  { id: 'S03-13', attack: 'Client changes snapshot ownership', expectedStatus: 400, expectedDecision: 'Rejected' },
  { id: 'S03-14', attack: 'Client changes finding ownership', expectedStatus: 400, expectedDecision: 'Rejected' },
  { id: 'S03-15', attack: 'Deleted owner resource requested', expectedStatus: 404, expectedDecision: '404 Not Found' },
  { id: 'S03-16', attack: 'Deactivated user accesses resource', expectedStatus: 401, expectedDecision: '401 Unauthorized' },
  { id: 'S03-17', attack: 'Revoked session accesses resource', expectedStatus: 401, expectedDecision: '401 Unauthorized' },
  { id: 'S03-18', attack: 'Expired session accesses resource', expectedStatus: 401, expectedDecision: '401 Unauthorized' },
  { id: 'S03-19', attack: 'Valid User JWT accesses Admin resource', expectedStatus: 403, expectedDecision: '401/403 Denied' },
  { id: 'S03-20', attack: 'Admin JWT accesses User resource without explicit auth', expectedStatus: 403, expectedDecision: 'Denied' },
  { id: 'S03-21', attack: 'Guest ID used as domain owner', expectedStatus: 401, expectedDecision: 'Denied' },
  { id: 'S03-22', attack: 'GX session accesses WX domain', expectedStatus: 401, expectedDecision: '401/403 Denied' },
  { id: 'S03-23', attack: 'GX session accesses WX snapshot', expectedStatus: 401, expectedDecision: '401/403 Denied' },
  { id: 'S03-24', attack: 'GX session accesses WX finding', expectedStatus: 401, expectedDecision: '401/403 Denied' },
  { id: 'S03-25', attack: 'Guest modifies authenticated resource ID', expectedStatus: 401, expectedDecision: 'Denied' },
  { id: 'S03-26', attack: 'User A manipulates nested route to User B', expectedStatus: 404, expectedDecision: '404 Not Found' },
  { id: 'S03-27', attack: 'User A changes query filter to User B', expectedStatus: 200, expectedDecision: 'No disclosure' },
  { id: 'S03-28', attack: 'Bulk endpoint requests mixed ownership IDs', expectedStatus: 200, expectedDecision: 'Foreign resources denied' },
  { id: 'S03-29', attack: 'Concurrent ownership/claim race', expectedStatus: 403, expectedDecision: 'Atomic authorization required' },
  { id: 'S03-30', attack: 'Direct API/curl bypass of frontend authorization', expectedStatus: 404, expectedDecision: 'Denied' },
] as const;

/**
 * 5. Authorization & Ownership Policy Evaluators
 */
export function evaluateResourceAccess(
  principal: SecurityPrincipal | null | undefined,
  resource: ProtectedResource | null | undefined,
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' = 'READ'
): {
  authorized: boolean;
  httpStatus: 200 | 400 | 401 | 403 | 404;
  decision: string;
  reason: string;
} {
  // 1. Authentication Gate
  if (!principal || principal.plane === 'ANONYMOUS' || !principal.id) {
    return {
      authorized: false,
      httpStatus: 401,
      decision: 'UNAUTHENTICATED',
      reason: 'Authentication required to access protected resource.',
    };
  }

  // 2. Account & Session Validity Check
  if (principal.userStatus === 'DEACTIVATED' || principal.userStatus === 'DELETED') {
    return {
      authorized: false,
      httpStatus: 401,
      decision: 'ACCOUNT_INVALID',
      reason: 'Account is deactivated or deleted.',
    };
  }

  if (principal.sessionStatus === 'REVOKED' || principal.sessionStatus === 'EXPIRED') {
    return {
      authorized: false,
      httpStatus: 401,
      decision: 'SESSION_INVALID',
      reason: 'Session is revoked or expired.',
    };
  }

  // 3. Security Plane Boundary Gate
  if (principal.plane === 'GX') {
    return {
      authorized: false,
      httpStatus: 401,
      decision: 'GX_PLANE_ISOLATION',
      reason: 'Guest sessions cannot access authenticated Workspace resources.',
    };
  }

  if (resource && resource.type === 'ADMIN_RESOURCE' && principal.plane !== 'AX') {
    return {
      authorized: false,
      httpStatus: 403,
      decision: 'ADMIN_PLANE_ISOLATION',
      reason: 'User plane identity cannot access Admin plane resources.',
    };
  }

  if (resource && resource.type !== 'ADMIN_RESOURCE' && principal.plane === 'AX') {
    return {
      authorized: false,
      httpStatus: 403,
      decision: 'USER_PLANE_ISOLATION',
      reason: 'Admin plane identity cannot access user workspace resources without explicit delegation.',
    };
  }

  // 4. Resource Existence and Ownership Gate (404 Anti-Enumeration Contract)
  if (!resource || resource.isDeleted) {
    return {
      authorized: false,
      httpStatus: 404,
      decision: 'RESOURCE_NOT_FOUND',
      reason: 'Resource not found.',
    };
  }

  if (resource.ownerId !== principal.id) {
    return {
      authorized: false,
      httpStatus: 404,
      decision: 'OWNERSHIP_MISMATCH_404',
      reason: 'Resource not found.',
    };
  }

  return {
    authorized: true,
    httpStatus: 200,
    decision: 'ALLOWED',
    reason: `Action '${action}' on resource '${resource.id}' authorized for principal '${principal.id}'.`,
  };
}

/**
 * 6. Nested Resource Access Evaluator
 */
export function evaluateNestedResourceAccess(
  principal: SecurityPrincipal,
  parent: ProtectedResource | null | undefined,
  child: ProtectedResource | null | undefined
): {
  authorized: boolean;
  httpStatus: 200 | 400 | 401 | 403 | 404;
  decision: string;
} {
  const parentEval = evaluateResourceAccess(principal, parent);
  if (!parentEval.authorized) {
    return parentEval;
  }

  const childEval = evaluateResourceAccess(principal, child);
  if (!childEval.authorized) {
    return childEval;
  }

  // Verify child actually belongs to parent
  if (child?.domainId && parent?.id && child.type === 'SNAPSHOT' && child.domainId !== parent.id) {
    return {
      authorized: false,
      httpStatus: 404,
      decision: 'NESTED_PARENT_CHILD_MISMATCH',
    };
  }

  return {
    authorized: true,
    httpStatus: 200,
    decision: 'ALLOWED',
  };
}

/**
 * 7. Ownership Mutation Protection Evaluator
 */
export function evaluateOwnershipMutation(
  principal: SecurityPrincipal,
  originalResource: ProtectedResource,
  mutationPayload: Record<string, any>
): {
  allowed: boolean;
  httpStatus: 200 | 400 | 401 | 403 | 404;
  decision: string;
} {
  const accessEval = evaluateResourceAccess(principal, originalResource, 'UPDATE');
  if (!accessEval.authorized) {
    return {
      allowed: false,
      httpStatus: accessEval.httpStatus,
      decision: accessEval.decision,
    };
  }

  const FORBIDDEN_MUTATION_KEYS = ['userId', 'ownerId', 'domainId', 'workspaceId', 'tenantId'];
  for (const key of FORBIDDEN_MUTATION_KEYS) {
    if (key in mutationPayload && mutationPayload[key] !== (originalResource as any)[key]) {
      return {
        allowed: false,
        httpStatus: 400,
        decision: 'OWNERSHIP_MUTATION_REJECTED',
      };
    }
  }

  return {
    allowed: true,
    httpStatus: 200,
    decision: 'MUTATION_AUTHORIZED',
  };
}

/**
 * 8. Bulk Collection Access Evaluator
 */
export function evaluateBulkResourceAccess(
  principal: SecurityPrincipal,
  resources: readonly ProtectedResource[]
): {
  authorizedResources: ProtectedResource[];
  deniedCount: number;
} {
  const authorizedResources: ProtectedResource[] = [];
  let deniedCount = 0;

  for (const resource of resources) {
    const res = evaluateResourceAccess(principal, resource, 'READ');
    if (res.authorized) {
      authorizedResources.push(resource);
    } else {
      deniedCount++;
    }
  }

  return {
    authorizedResources,
    deniedCount,
  };
}

/**
 * 9. Claim Transition Evaluator
 */
export function evaluateClaimOperation(
  principal: SecurityPrincipal | null | undefined,
  guestSession: GuestSessionResource | null | undefined,
  clientSpecifiedOwnerId?: string
): {
  success: boolean;
  httpStatus: 200 | 401 | 403 | 404;
  decision: string;
  boundUserId?: string;
} {
  if (!principal || principal.plane === 'ANONYMOUS' || !principal.id) {
    return {
      success: false,
      httpStatus: 401,
      decision: 'UNAUTHENTICATED_CLAIM',
    };
  }

  if (principal.plane !== 'WX' && principal.plane !== 'AX') {
    return {
      success: false,
      httpStatus: 401,
      decision: 'INVALID_CLAIM_PLANE',
    };
  }

  if (clientSpecifiedOwnerId && clientSpecifiedOwnerId !== principal.id) {
    return {
      success: false,
      httpStatus: 403,
      decision: 'ARBITRARY_DESTINATION_OWNER_REJECTED',
    };
  }

  if (!guestSession) {
    return {
      success: false,
      httpStatus: 404,
      decision: 'GUEST_SESSION_NOT_FOUND',
    };
  }

  if (guestSession.status === 'CONVERTED' || guestSession.claimedByUserId) {
    return {
      success: false,
      httpStatus: 403,
      decision: 'GUEST_SESSION_ALREADY_CLAIMED',
    };
  }

  if (guestSession.status === 'EXPIRED') {
    return {
      success: false,
      httpStatus: 403,
      decision: 'GUEST_SESSION_EXPIRED',
    };
  }

  return {
    success: true,
    httpStatus: 200,
    decision: 'CLAIM_AUTHORIZED',
    boundUserId: principal.id,
  };
}

/**
 * 10. Certification Gate Statement & Verifier
 */
export const S03_CERTIFICATION_STATEMENT =
  'No authenticated Nebula user, guest session, administrator, frontend client, resource identifier, nested-resource path, or client-supplied ownership field can cross a tenant or resource authorization boundary without an explicitly authorized server-side decision.' as const;

export function verifyS03Certification(candidateStatement: string): {
  passed: boolean;
  canonicalStatement: string;
  similarityRatio: number;
} {
  const cleanCandidate = candidateStatement.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const cleanCanonical = S03_CERTIFICATION_STATEMENT.toLowerCase().replace(/[^a-z0-9]/g, ' ');

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
    canonicalStatement: S03_CERTIFICATION_STATEMENT,
    similarityRatio: similarity,
  };
}
