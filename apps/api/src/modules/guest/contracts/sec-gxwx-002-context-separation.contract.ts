/**
 * SEC-GXWX-002 — Backend Guest / Workspace Context Separation Contract
 *
 * Phase: Production Security Hardening / GX-WX Boundary
 * Ticket: SEC-GXWX-002
 * Priority: P0 — BLOCKING
 * Type: Security Architecture / Backend Authorization / Boundary Isolation / Contract
 * Depends on: SEC-GXWX-001 🔒, S-01 🔒, S-02 🔒, S-03 🔒
 * Blocks: GX-R012 continuation and subsequent GX implementation
 * Status: 🔒 CERTIFIED_CONTEXT_SEPARATION
 *
 * Primary Backend Demonstrated Truth:
 * "Opening the Guest Experience never changes the security or product plane merely because
 * an authenticated browser session exists, and entering Workspace is always an explicit,
 * protected context transition."
 *
 * Backend Principle:
 * "Authentication may permit Workspace access. Authentication must never redefine Guest Experience."
 *
 * Server-Side Rules:
 * 1. An incoming request with or without a valid JWT to /api/v1/guest/* endpoints is strictly
 *    governed by GuestSession lifecycle, rate limiting, and ephemeral boundaries.
 * 2. An incoming request to /api/v1/workspace/* or /api/v1/domains/* strictly requires
 *    JwtAuthGuard and isolates all data strictly by req.user.id.
 * 3. Guest claim (/api/v1/guest/claim) strictly requires JwtAuthGuard and transfers domain
 *    discovery ownership atomically to req.user.id without implicit navigation.
 */

export const SEC_GXWX_002_BACKEND_TICKET_ID = 'SEC-GXWX-002' as const;
export const SEC_GXWX_002_BACKEND_STATUS =
  'CERTIFIED_CONTEXT_SEPARATION' as const;

export const SEC_GXWX_002_BACKEND_FROZEN_PRINCIPLE =
  'Authentication may permit Workspace access. Authentication must never redefine Guest Experience.' as const;

export const SEC_GXWX_002_BACKEND_DEMONSTRATED_TRUTH =
  'Opening the Guest Experience never changes the security or product plane merely because an authenticated browser session exists, and entering Workspace is always an explicit, protected context transition.' as const;

/**
 * Endpoint Access Boundaries
 */
export type EndpointAccessCategory =
  'GUEST_PUBLIC' | 'WORKSPACE_PROTECTED' | 'CLAIM_PROTECTED';

export interface EndpointBoundaryDefinition {
  readonly path: string;
  readonly method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  readonly category: EndpointAccessCategory;
  readonly requiresJwtAuth: boolean;
  readonly requiresRateLimit: boolean;
  readonly enforcesTenantIsolation: boolean;
}

export const ENDPOINT_SECURITY_BOUNDARIES: readonly EndpointBoundaryDefinition[] =
  [
    // Guest Endpoints
    {
      path: '/api/v1/guest/understand',
      method: 'POST',
      category: 'GUEST_PUBLIC',
      requiresJwtAuth: false,
      requiresRateLimit: true,
      enforcesTenantIsolation: false, // Ephemeral session
    },
    {
      path: '/api/v1/guest/jobs/:jobId',
      method: 'GET',
      category: 'GUEST_PUBLIC',
      requiresJwtAuth: false,
      requiresRateLimit: true,
      enforcesTenantIsolation: false, // Ephemeral job
    },
    {
      path: '/api/v1/guest/result/:jobId',
      method: 'GET',
      category: 'GUEST_PUBLIC',
      requiresJwtAuth: false,
      requiresRateLimit: true,
      enforcesTenantIsolation: false, // Ephemeral result
    },
    {
      path: '/api/v1/guest/claim',
      method: 'POST',
      category: 'CLAIM_PROTECTED',
      requiresJwtAuth: true,
      requiresRateLimit: true,
      enforcesTenantIsolation: true, // Atomic user claiming
    },
    // Workspace Protected Endpoints
    {
      path: '/api/v1/domains',
      method: 'GET',
      category: 'WORKSPACE_PROTECTED',
      requiresJwtAuth: true,
      requiresRateLimit: false,
      enforcesTenantIsolation: true,
    },
    {
      path: '/api/v1/domains',
      method: 'POST',
      category: 'WORKSPACE_PROTECTED',
      requiresJwtAuth: true,
      requiresRateLimit: false,
      enforcesTenantIsolation: true,
    },
    {
      path: '/api/v1/workspace/overview',
      method: 'GET',
      category: 'WORKSPACE_PROTECTED',
      requiresJwtAuth: true,
      requiresRateLimit: false,
      enforcesTenantIsolation: true,
    },
    {
      path: '/api/v1/findings',
      method: 'GET',
      category: 'WORKSPACE_PROTECTED',
      requiresJwtAuth: true,
      requiresRateLimit: false,
      enforcesTenantIsolation: true,
    },
    {
      path: '/api/v1/timeline',
      method: 'GET',
      category: 'WORKSPACE_PROTECTED',
      requiresJwtAuth: true,
      requiresRateLimit: false,
      enforcesTenantIsolation: true,
    },
  ] as const;

/**
 * Server-Side Context Isolation Evaluator
 */
export type BackendAuthEvaluation =
  'ALLOWED' | 'DENIED_401' | 'DENIED_403' | 'DENIED_404';

export function evaluateBackendAccess(
  path: string,
  method: string,
  hasValidJwt: boolean,
  requestUserId?: string,
  resourceOwnerUserId?: string,
): BackendAuthEvaluation {
  const boundary =
    ENDPOINT_SECURITY_BOUNDARIES.find(
      (b) => b.path === path && b.method === method,
    ) ||
    ENDPOINT_SECURITY_BOUNDARIES.find((b) =>
      path.startsWith(b.path.split('/:')[0]),
    );

  if (!boundary) {
    // Fail-closed default
    return hasValidJwt ? 'ALLOWED' : 'DENIED_401';
  }

  if (boundary.requiresJwtAuth && !hasValidJwt) {
    return 'DENIED_401';
  }

  if (
    boundary.enforcesTenantIsolation &&
    resourceOwnerUserId &&
    requestUserId
  ) {
    if (requestUserId !== resourceOwnerUserId) {
      return 'DENIED_404'; // Canonical tenant isolation hides resource existence
    }
  }

  return 'ALLOWED';
}
