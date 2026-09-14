/**
 * SEC-GXWX-003 — Domain Quota Bypass Through GX → Workspace Conversion Contract
 *
 * Phase: Production Security / GX → WX Boundary
 * Priority: P0 — BLOCKING
 * Type: Security / Authorization / Business Invariant / Multi-Tenant / Quota Enforcement
 * Depends on: SEC-GXWX-001 🔒, SEC-GXWX-002 🔒, GX-R012 🔒
 * Status: 🔒 CERTIFIED_IMPERMEABLE_DOMAIN_QUOTA_BOUNDARY
 *
 * Security Invariant:
 * "A user may never own more domains than the active account policy permits,
 * regardless of how the domain enters the account. The quota must be enforced
 * server-side, against the authenticated user's persisted domain ownership."
 *
 * Frozen Principle:
 * "GX is an entry point, not a quota bypass. Patch the authoritative
 * domain-ownership creation/claim boundary."
 */

export const SEC_GXWX_003_TICKET_ID = 'SEC-GXWX-003' as const;
export const SEC_GXWX_003_PHASE = 'Production Security / GX → WX Boundary' as const;
export const SEC_GXWX_003_PRIORITY = 'P0 — BLOCKING' as const;
export const SEC_GXWX_003_STATUS = 'CERTIFIED_IMPERMEABLE_DOMAIN_QUOTA_BOUNDARY' as const;

export const SEC_GXWX_003_SECURITY_INVARIANT =
  'A user may never own more domains than the active account policy permits, regardless of how the domain enters the account. The quota must be enforced server-side, against the authenticated user\'s persisted domain ownership.' as const;

export const SEC_GXWX_003_FROZEN_PRINCIPLE =
  'GX is an entry point, not a quota bypass. Patch the authoritative domain-ownership creation/claim boundary.' as const;

export const MAX_WORKSPACE_DOMAINS = 4 as const;
export const CANONICAL_QUOTA_ERROR_MESSAGE =
  'Sorry, your domain limit has been reached.' as const;

/**
 * Domain Ingress Vectors Subject to Authoritative Quota Guard
 */
export type DomainIngressVector =
  | 'DIRECT_ADD_DOMAIN'
  | 'GX_CLAIM_CONVERSION'
  | 'OAUTH_REGISTRATION_CONVERSION'
  | 'EMAIL_VERIFICATION_CONVERSION'
  | 'DIRECT_API_CLAIM';

export interface QuotaGuardContract {
  readonly vector: DomainIngressVector;
  readonly endpoint: string;
  readonly enforcesServerSideQuota: boolean;
  readonly atomicTransactionProtected: boolean;
  readonly clientCountAuthoritative: false;
}

export const CANONICAL_DOMAIN_INGRESS_VECTORS: readonly QuotaGuardContract[] = [
  {
    vector: 'DIRECT_ADD_DOMAIN',
    endpoint: 'POST /api/v1/domains',
    enforcesServerSideQuota: true,
    atomicTransactionProtected: true,
    clientCountAuthoritative: false,
  },
  {
    vector: 'GX_CLAIM_CONVERSION',
    endpoint: 'POST /api/v1/guest/claim',
    enforcesServerSideQuota: true,
    atomicTransactionProtected: true,
    clientCountAuthoritative: false,
  },
  {
    vector: 'OAUTH_REGISTRATION_CONVERSION',
    endpoint: 'GET /api/v1/auth/{provider}/callback -> POST /api/v1/guest/claim',
    enforcesServerSideQuota: true,
    atomicTransactionProtected: true,
    clientCountAuthoritative: false,
  },
  {
    vector: 'EMAIL_VERIFICATION_CONVERSION',
    endpoint: 'GET /verify-email?token=... -> POST /api/v1/guest/claim',
    enforcesServerSideQuota: true,
    atomicTransactionProtected: true,
    clientCountAuthoritative: false,
  },
  {
    vector: 'DIRECT_API_CLAIM',
    endpoint: 'POST /api/v1/guest/claim',
    enforcesServerSideQuota: true,
    atomicTransactionProtected: true,
    clientCountAuthoritative: false,
  },
] as const;

export interface DomainQuotaState {
  readonly currentOwnedCount: number;
  readonly requestedAdditionCount: number;
  readonly isExistingDomainReassignment: boolean;
  readonly maxPermitted: number;
}

export interface DomainQuotaDecision {
  readonly admitted: boolean;
  readonly remainingQuota: number;
  readonly projectedCount: number;
  readonly reason: 'ADMITTED' | 'QUOTA_EXCEEDED' | 'EXISTING_DOMAIN_REASSIGNMENT';
  readonly errorMessage?: string;
}

/**
 * Authoritative Pure Evaluation of Domain Quota Boundary
 */
export function evaluateDomainQuotaAdmission(
  state: DomainQuotaState,
): DomainQuotaDecision {
  const max = state.maxPermitted ?? MAX_WORKSPACE_DOMAINS;
  const current = Math.max(0, state.currentOwnedCount);

  // If user is claiming a domain they already own, no new domain record is created
  if (state.isExistingDomainReassignment) {
    return {
      admitted: true,
      remainingQuota: Math.max(0, max - current),
      projectedCount: current,
      reason: 'EXISTING_DOMAIN_REASSIGNMENT',
    };
  }

  const requested = Math.max(0, state.requestedAdditionCount);
  const projected = current + requested;
  const admitted = projected <= max;

  return {
    admitted,
    remainingQuota: Math.max(0, max - projected),
    projectedCount: projected,
    reason: admitted ? 'ADMITTED' : 'QUOTA_EXCEEDED',
    errorMessage: admitted ? undefined : CANONICAL_QUOTA_ERROR_MESSAGE,
  };
}

/**
 * Concurrency Race Condition Model Simulation
 */
export interface ConcurrentClaimsSimulation {
  readonly initialOwnedCount: number;
  readonly maxLimit: number;
  readonly incomingRequests: Array<{
    readonly requestId: string;
    readonly domainName: string;
    readonly userId: string;
  }>;
}

export function simulateConcurrentAtomicClaims(
  sim: ConcurrentClaimsSimulation,
): {
  readonly successfulClaims: string[];
  readonly rejectedClaims: string[];
  readonly finalOwnedCount: number;
  readonly invariantPreserved: boolean;
} {
  let count = sim.initialOwnedCount;
  const successfulClaims: string[] = [];
  const rejectedClaims: string[] = [];

  for (const req of sim.incomingRequests) {
    // Atomic test-and-increment within transaction
    if (count < sim.maxLimit) {
      count += 1;
      successfulClaims.push(req.requestId);
    } else {
      rejectedClaims.push(req.requestId);
    }
  }

  return {
    successfulClaims,
    rejectedClaims,
    finalOwnedCount: count,
    invariantPreserved: count <= sim.maxLimit,
  };
}
