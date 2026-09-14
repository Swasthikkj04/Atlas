/**
 * SEC-GXWX-002 — Guest / Workspace Context Separation Contract
 *
 * Phase: Production Security Hardening / GX-WX Boundary
 * Ticket: SEC-GXWX-002
 * Type: Security Architecture / Context Separation / Session Isolation / Navigation Model
 * Priority: P0 — BLOCKING
 * Depends on: SEC-GXWX-001 🔒, S-01 🔒, S-02 🔒, S-03 🔒
 * Blocks: GX-R012 continuation and subsequent GX implementation
 * Status: 🔒 CERTIFIED_CONTEXT_SEPARATION
 *
 * 1. Certification Objective:
 * Demonstrated Truth:
 * "Opening the Guest Experience never changes the security or product plane merely because
 * an authenticated browser session exists, and entering Workspace is always an explicit,
 * protected context transition."
 *
 * Frozen Principles:
 * 1. "Authentication may permit Workspace access. Authentication must never redefine Guest Experience."
 * 2. "Workspace is an exit from GX, never a destination inside GX."
 * 3. "Security first. Context second. Conversion last."
 * 4. "Workspace continuity is earned and contextual, appearing only after intelligence has been demonstrated."
 *
 * Architecture Context Model:
 * GX CONTEXT
 *     │
 *     ├── Understanding
 *     ├── Findings
 *     ├── Infrastructure
 *     └── Evidence
 *             │
 *             ▼
 *       earned continuity ("Keep this understanding →")
 *             │
 *             ▼
 *       explicit decision
 *             │
 *             ▼
 *            WX
 */

export const SEC_GXWX_002_TICKET_ID = 'SEC-GXWX-002' as const;
export const SEC_GXWX_002_PHASE = 'Production Security Hardening / GX-WX Boundary' as const;
export const SEC_GXWX_002_PRIORITY = 'P0 — BLOCKING' as const;
export const SEC_GXWX_002_STATUS = 'CERTIFIED_CONTEXT_SEPARATION' as const;

export const SEC_GXWX_002_DEMONSTRATED_TRUTH =
  'Opening the Guest Experience never changes the security or product plane merely because an authenticated browser session exists, and entering Workspace is always an explicit, protected context transition.' as const;

export const SEC_GXWX_002_FROZEN_PRINCIPLE =
  'Authentication may permit Workspace access. Authentication must never redefine Guest Experience.' as const;

export const SEC_GXWX_002_CORE_PRINCIPLES = [
  'Authentication may permit Workspace access. Authentication must never redefine Guest Experience.',
  'Workspace is an exit from GX, never a destination inside GX.',
  'Security first. Context second. Conversion last.',
  'Workspace continuity is earned and contextual, appearing only after intelligence has been demonstrated.',
] as const;

/**
 * 2. Canonical Security Invariants (SEC-GXWX-002-I01 .. I10)
 */
export interface SecurityInvariantDefinition {
  readonly id: string;
  readonly name: string;
  readonly statement: string;
  readonly enforcementPlane: 'FRONTEND' | 'BACKEND' | 'BOTH';
}

export const SEC_GXWX_002_INVARIANTS: readonly SecurityInvariantDefinition[] = [
  {
    id: 'SEC-GXWX-002-I01',
    name: 'Plane Persistence',
    statement: '/guest always strictly remains GX regardless of existing JWT, refresh credentials, browser history, tabs, or local client state.',
    enforcementPlane: 'BOTH',
  },
  {
    id: 'SEC-GXWX-002-I02',
    name: 'No Authentication Promotion',
    statement: 'Authentication presence cannot promote GX into WX or alter the GX intelligence model.',
    enforcementPlane: 'FRONTEND',
  },
  {
    id: 'SEC-GXWX-002-I03',
    name: 'No Persistent Workspace Navigation in GX',
    statement: 'GX header remains clean and unpolluted: no persistent Workspace CTA and no user identity exposure in GX.',
    enforcementPlane: 'FRONTEND',
  },
  {
    id: 'SEC-GXWX-002-I04',
    name: 'Protected WX Entry',
    statement: 'WX remains strictly behind its existing authentication and authorization boundary.',
    enforcementPlane: 'BOTH',
  },
  {
    id: 'SEC-GXWX-002-I05',
    name: 'No Private State Mount',
    statement: 'GX must not load, query, or mount private Workspace resources or state.',
    enforcementPlane: 'FRONTEND',
  },
  {
    id: 'SEC-GXWX-002-I06',
    name: 'Multi-Tab Isolation',
    statement: 'GX and WX coexist independently across browser tabs without cross-tab context pollution or promotion.',
    enforcementPlane: 'BOTH',
  },
  {
    id: 'SEC-GXWX-002-I07',
    name: 'Refresh Stability',
    statement: 'Refreshing /guest produces /guest → GX, never promoting the user into Workspace.',
    enforcementPlane: 'FRONTEND',
  },
  {
    id: 'SEC-GXWX-002-I08',
    name: 'History Stability',
    statement: 'Browser navigation (back/forward) cannot silently convert GX state into WX state without route navigation and independent authorization.',
    enforcementPlane: 'BOTH',
  },
  {
    id: 'SEC-GXWX-002-I09',
    name: 'Earned Continuity & Claim Separation',
    statement: 'Workspace continuity is earned and contextual (post-intelligence); claim workflow does not silently navigate to WX.',
    enforcementPlane: 'BOTH',
  },
  {
    id: 'SEC-GXWX-002-I10',
    name: 'Backend Authority',
    statement: 'No frontend route or client state establishes Workspace authorization; backend strictly validates token and tenant ownership.',
    enforcementPlane: 'BACKEND',
  },
] as const;

/**
 * 3. Canonical Product Planes & Context Models
 */
export type ProductPlane = 'GX' | 'WX' | 'REGISTRATION' | 'LOGIN' | 'LANDING' | 'AUTH_REDIRECT';

export interface ContextResolutionInput {
  readonly pathname: string;
  readonly hasAuthSession: boolean;
  readonly isUserInitiatedTransition?: boolean;
}

export interface ContextResolutionResult {
  readonly resolvedPlane: ProductPlane;
  readonly isEphemeral: boolean;
  readonly requiresAuth: boolean;
  readonly allowsPrivateWorkspaceState: boolean;
  readonly headerMode: 'CANONICAL_GX' | 'AUTHENTICATED_WX' | 'STANDARD_AUTH';
}

/**
 * Resolves the canonical product plane with strict fail-safe context separation.
 */
export function resolveProductPlane(input: ContextResolutionInput): ContextResolutionResult {
  const { pathname } = input;
  const normalized = (pathname || '/').replace(/\/+$/, '') || '/';

  // 1. Guest Experience Plane: /guest always strictly resolves to GX with Canonical GX Header
  if (normalized === '/guest' || normalized.startsWith('/guest/')) {
    return {
      resolvedPlane: 'GX',
      isEphemeral: true,
      requiresAuth: false,
      allowsPrivateWorkspaceState: false,
      headerMode: 'CANONICAL_GX',
    };
  }

  // 2. Registration / Create Workspace Routes
  if (
    normalized === '/workspace/create' ||
    normalized.startsWith('/workspace/create/') ||
    normalized === '/create-workspace' ||
    normalized === '/register' ||
    normalized === '/auth/register'
  ) {
    return {
      resolvedPlane: 'REGISTRATION',
      isEphemeral: false,
      requiresAuth: false,
      allowsPrivateWorkspaceState: false,
      headerMode: 'STANDARD_AUTH',
    };
  }

  // 3. Login Routes
  if (normalized === '/login' || normalized === '/auth/login') {
    return {
      resolvedPlane: 'LOGIN',
      isEphemeral: false,
      requiresAuth: false,
      allowsPrivateWorkspaceState: false,
      headerMode: 'STANDARD_AUTH',
    };
  }

  // 4. Authenticated Workspace Plane: /workspace, /dashboard
  if (
    normalized === '/workspace' ||
    normalized.startsWith('/workspace/') ||
    normalized === '/dashboard' ||
    normalized.startsWith('/dashboard/')
  ) {
    if (!input.hasAuthSession) {
      return {
        resolvedPlane: 'AUTH_REDIRECT',
        isEphemeral: false,
        requiresAuth: true,
        allowsPrivateWorkspaceState: false,
        headerMode: 'STANDARD_AUTH',
      };
    }

    return {
      resolvedPlane: 'WX',
      isEphemeral: false,
      requiresAuth: true,
      allowsPrivateWorkspaceState: true,
      headerMode: 'AUTHENTICATED_WX',
    };
  }

  // 5. Public Landing Page Fallback
  return {
    resolvedPlane: 'LANDING',
    isEphemeral: false,
    requiresAuth: false,
    allowsPrivateWorkspaceState: false,
    headerMode: 'STANDARD_AUTH',
  };
}

/**
 * 4. Explicit Context Transition Engine
 */
export type TransitionEvaluationResult =
  | 'PERMITTED_WX_ENTRY'
  | 'LOGIN_REQUIRED'
  | 'PROHIBITED_IMPLICIT_PROMOTION'
  | 'REMAINS_IN_GX'
  | 'STANDARD_NAVIGATION';

export function evaluateContextTransition(
  sourcePlane: ProductPlane,
  targetPathname: string,
  isAuthenticated: boolean,
  isExplicitUserAction: boolean
): TransitionEvaluationResult {
  const targetNormalized = (targetPathname || '/').replace(/\/+$/, '') || '/';
  const isTargetWX =
    targetNormalized === '/workspace' ||
    targetNormalized.startsWith('/workspace/') ||
    targetNormalized === '/dashboard';

  // Prohibit implicit context promotion from GX to WX
  if (sourcePlane === 'GX' && isTargetWX) {
    if (!isExplicitUserAction) {
      return 'PROHIBITED_IMPLICIT_PROMOTION';
    }
    if (isAuthenticated) {
      return 'PERMITTED_WX_ENTRY';
    }
    return 'LOGIN_REQUIRED';
  }

  if (sourcePlane === 'GX' && targetNormalized.startsWith('/guest')) {
    return 'REMAINS_IN_GX';
  }

  return 'STANDARD_NAVIGATION';
}

/**
 * 5. Private State Mounting Gatekeeper
 */
export type StateMountEvaluationResult = 'ALLOWED_IN_CONTEXT' | 'PROHIBITED_PRIVATE_STATE_LEAK';

const PRIVATE_WX_HOOKS_AND_QUERIES = new Set([
  'useDomains',
  'useDomain',
  'useCreateDomain',
  'useDeleteDomain',
  'useDomainOverview',
  'useWorkspaceOverview',
  'useDomainFindings',
  'useSnapshots',
  'useTimeline',
  'useWorkspaceUnderstandingConvergence',
  'useDomainUnderstandingJobs',
]);

export function evaluateStateMounting(
  activePlane: ProductPlane,
  queryOrHookName: string
): StateMountEvaluationResult {
  if (activePlane === 'GX' && PRIVATE_WX_HOOKS_AND_QUERIES.has(queryOrHookName)) {
    return 'PROHIBITED_PRIVATE_STATE_LEAK';
  }
  return 'ALLOWED_IN_CONTEXT';
}

/**
 * 6. Attack / Regression Test Matrix (SEC-GXWX-002-01 to SEC-GXWX-002-20)
 */
export interface SecurityRegressionVector {
  readonly id: string;
  readonly scenario: string;
  readonly hasAuthSession: boolean;
  readonly initialRoute: string;
  readonly navigationAction?: string;
  readonly expectedPlane: ProductPlane;
  readonly expectedDecision: string;
}

export const SEC_GXWX_002_REGRESSION_MATRIX: readonly SecurityRegressionVector[] = [
  {
    id: 'SEC-GXWX-002-01',
    scenario: 'Authenticated user opens /guest',
    hasAuthSession: true,
    initialRoute: '/guest',
    expectedPlane: 'GX',
    expectedDecision: 'GX_CONTEXT_ACTIVE_NO_PROMOTION',
  },
  {
    id: 'SEC-GXWX-002-02',
    scenario: 'Authenticated user refreshes /guest',
    hasAuthSession: true,
    initialRoute: '/guest',
    expectedPlane: 'GX',
    expectedDecision: 'GX_REFRESH_STABILITY_PRESERVED',
  },
  {
    id: 'SEC-GXWX-002-03',
    scenario: 'Authenticated user visits /guest?domain=x',
    hasAuthSession: true,
    initialRoute: '/guest?domain=example.com',
    expectedPlane: 'GX',
    expectedDecision: 'GX_PARAMETER_QUERY_BOUNDED',
  },
  {
    id: 'SEC-GXWX-002-04',
    scenario: 'Existing JWT present on GX entry',
    hasAuthSession: true,
    initialRoute: '/guest',
    expectedPlane: 'GX',
    expectedDecision: 'NO_WX_PROMOTION_FROM_JWT',
  },
  {
    id: 'SEC-GXWX-002-05',
    scenario: 'GX renders navigation header',
    hasAuthSession: true,
    initialRoute: '/guest',
    expectedPlane: 'GX',
    expectedDecision: 'CANONICAL_GX_HEADER_NO_PERSISTENT_WX_CTA',
  },
  {
    id: 'SEC-GXWX-002-06',
    scenario: 'Explicit Workspace transition by authenticated user (via earned continuity)',
    hasAuthSession: true,
    initialRoute: '/guest',
    navigationAction: 'CLICK_EARNED_CONTINUITY_WORKSPACE',
    expectedPlane: 'WX',
    expectedDecision: 'PERMITTED_EXPLICIT_WX_TRANSITION',
  },
  {
    id: 'SEC-GXWX-002-07',
    scenario: 'Anonymous Workspace transition attempt',
    hasAuthSession: false,
    initialRoute: '/workspace',
    expectedPlane: 'AUTH_REDIRECT',
    expectedDecision: 'PROTECTED_ROUTE_REDIRECT_LOGIN',
  },
  {
    id: 'SEC-GXWX-002-08',
    scenario: 'Authenticated Workspace transition',
    hasAuthSession: true,
    initialRoute: '/workspace',
    expectedPlane: 'WX',
    expectedDecision: 'PROTECTED_ROUTE_AUTHORIZED',
  },
  {
    id: 'SEC-GXWX-002-09',
    scenario: 'GX attempts direct WX API call without bearer',
    hasAuthSession: false,
    initialRoute: '/guest',
    expectedPlane: 'GX',
    expectedDecision: 'BACKEND_401_UNAUTHORIZED',
  },
  {
    id: 'SEC-GXWX-002-10',
    scenario: 'GX loads private domain data',
    hasAuthSession: false,
    initialRoute: '/guest',
    expectedPlane: 'GX',
    expectedDecision: 'PROHIBITED_STATE_LEAK_ZERO_DATA',
  },
  {
    id: 'SEC-GXWX-002-11',
    scenario: 'GX loads private findings',
    hasAuthSession: false,
    initialRoute: '/guest',
    expectedPlane: 'GX',
    expectedDecision: 'PROHIBITED_STATE_LEAK_ZERO_FINDINGS',
  },
  {
    id: 'SEC-GXWX-002-12',
    scenario: 'GX loads private snapshots',
    hasAuthSession: false,
    initialRoute: '/guest',
    expectedPlane: 'GX',
    expectedDecision: 'PROHIBITED_STATE_LEAK_ZERO_SNAPSHOTS',
  },
  {
    id: 'SEC-GXWX-002-13',
    scenario: 'GX + WX simultaneously in separate tabs',
    hasAuthSession: true,
    initialRoute: '/guest',
    expectedPlane: 'GX',
    expectedDecision: 'MULTI_TAB_INDEPENDENT_ISOLATION',
  },
  {
    id: 'SEC-GXWX-002-14',
    scenario: 'User logs out, then visits GX',
    hasAuthSession: false,
    initialRoute: '/guest',
    expectedPlane: 'GX',
    expectedDecision: 'GX_EPHEMERAL_FUNCTIONAL',
  },
  {
    id: 'SEC-GXWX-002-15',
    scenario: 'Browser Back after navigating to WX',
    hasAuthSession: true,
    initialRoute: '/guest',
    expectedPlane: 'GX',
    expectedDecision: 'HISTORY_ROUTE_INDEPENDENTLY_EVALUATED',
  },
  {
    id: 'SEC-GXWX-002-16',
    scenario: 'Browser Forward into WX',
    hasAuthSession: true,
    initialRoute: '/workspace',
    expectedPlane: 'WX',
    expectedDecision: 'FORWARD_ROUTE_INDEPENDENTLY_AUTHORIZED',
  },
  {
    id: 'SEC-GXWX-002-17',
    scenario: 'Guest claim without valid authentication session',
    hasAuthSession: false,
    initialRoute: '/guest',
    expectedPlane: 'GX',
    expectedDecision: 'BACKEND_CLAIM_REQUIRES_AUTH_401',
  },
  {
    id: 'SEC-GXWX-002-18',
    scenario: 'Claim then implicit WX navigation',
    hasAuthSession: true,
    initialRoute: '/guest',
    expectedPlane: 'GX',
    expectedDecision: 'CLAIM_SEPARATION_EXPLICIT_TRANSITION_REQUIRED',
  },
  {
    id: 'SEC-GXWX-002-19',
    scenario: 'WX state present in React Query client cache',
    hasAuthSession: true,
    initialRoute: '/guest',
    expectedPlane: 'GX',
    expectedDecision: 'CACHE_ISOLATION_UNRENDERED_IN_GX',
  },
  {
    id: 'SEC-GXWX-002-20',
    scenario: 'Direct /workspace request without session',
    hasAuthSession: false,
    initialRoute: '/workspace',
    expectedPlane: 'AUTH_REDIRECT',
    expectedDecision: 'FAIL_CLOSED_AUTH_REDIRECT',
  },
] as const;
