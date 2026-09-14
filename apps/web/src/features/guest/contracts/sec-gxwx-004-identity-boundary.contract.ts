/**
 * SEC-GXWX-004 — Guest / Registered Identity Boundary Contract
 *
 * Phase: Production Security Hardening / Identity Isolation / Session / GX-WX Boundary
 * Ticket: SEC-GXWX-004
 * Priority: P0 — BLOCKING
 * Type: Security / Identity Isolation / Authentication / Session / GX-WX Boundary
 * Status: 🔒 CERTIFIED_IDENTITY_ISOLATION
 * Depends on: SEC-GXWX-001 🔒, SEC-GXWX-002 🔒, SEC-GXWX-003 🔒
 * Blocks: GX progression, conversion-flow changes, Production Release
 *
 * Audit Objective:
 * "Determine why an apparently guest interaction is automatically detecting an existing
 * registered-user account/session and attempting to authenticate or route through it.
 * Verify that a Guest Experience session can exist completely independently when the
 * browser already contains a valid registered-user authentication context."
 *
 * Primary Demonstrated Truth:
 * "A registered account existing in the browser must not automatically convert, authenticate,
 * inherit, or otherwise alter the identity of a new GX session. Authentication state and
 * Guest Experience state are strictly orthogonal."
 *
 * Core Invariant:
 * 🔒 SEC-GXWX-004-I01:
 * "Authentication state and Guest Experience state must be orthogonal. Meaning:
 * isAuthenticated === true must never imply GX is authenticated, and GuestSession exists
 * must never imply UserSession exists."
 */

export const SEC_GXWX_004_TICKET_ID = 'SEC-GXWX-004' as const;
export const SEC_GXWX_004_PHASE =
  'Production Security Hardening / Identity Isolation / GX-WX Boundary' as const;
export const SEC_GXWX_004_PRIORITY = 'P0 — BLOCKING' as const;
export const SEC_GXWX_004_STATUS = 'CERTIFIED_IDENTITY_ISOLATION' as const;

export const SEC_GXWX_004_DEMONSTRATED_TRUTH =
  'A registered account existing in the browser must not automatically convert, authenticate, inherit, or otherwise alter the identity of a new GX session. Authentication state and Guest Experience state are strictly orthogonal.' as const;

export const SEC_GXWX_004_FROZEN_INVARIANT_I01 =
  'Authentication state and Guest Experience state must be orthogonal. Meaning: isAuthenticated === true must never imply GX is authenticated, and GuestSession exists must never imply UserSession exists.' as const;

export const SEC_GXWX_004_CORE_PRINCIPLES: readonly string[] = [
  'Authentication state and Guest Experience state are orthogonal: ambient tokens never authenticate GX.',
  'Ambient browser credentials (cookies) are inert on guest endpoints: guest understanding runs under system guest identity.',
  'Zero implicit conversion: transitioning from GX to WX requires explicit, conscious user intent.',
  'Authoritative quota enforcement: GX claims are subject to domain limits before transaction commitment.',
  'Complete multi-tab isolation: concurrent guest sessions in different tabs maintain separate state.',
  'Replay and double-claim resistance: converted guest sessions cannot be hijacked by other accounts.',
] as const;

/**
 * 10 Canonical Security Invariants (SEC-GXWX-004-I01 .. I10)
 */
export interface IdentitySecurityInvariant {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly enforcementLayer: 'BROWSER' | 'ROUTING' | 'AUTH_CONTEXT' | 'API' | 'DATABASE' | 'TRANSACTION';
  readonly status: 'FROZEN_AND_CERTIFIED';
}

export const SEC_GXWX_004_INVARIANTS: readonly IdentitySecurityInvariant[] = [
  {
    id: 'SEC-GXWX-004-I01',
    name: 'Orthogonal Identity State',
    description:
      'isAuthenticated === true must never imply GX is authenticated, and GuestSession exists must never imply UserSession exists.',
    enforcementLayer: 'AUTH_CONTEXT',
    status: 'FROZEN_AND_CERTIFIED',
  },
  {
    id: 'SEC-GXWX-004-I02',
    name: 'Ambient Credential Inertia',
    description:
      'Presence of nebula_access_token or nebula_refresh_token in browser cookies does not alter the execution or identity of guest discovery endpoints.',
    enforcementLayer: 'API',
    status: 'FROZEN_AND_CERTIFIED',
  },
  {
    id: 'SEC-GXWX-004-I03',
    name: 'Ephemeral Session Isolation',
    description:
      'GuestSession records in backend are provisioned under the system guest identity (guest@system.atlas) and cannot inherit userId, tenantId, or private state.',
    enforcementLayer: 'DATABASE',
    status: 'FROZEN_AND_CERTIFIED',
  },
  {
    id: 'SEC-GXWX-004-I04',
    name: 'Zero Implicit Routing',
    description:
      'Accessing /guest or refreshing /guest never executes an automatic redirect to /workspace, regardless of whether a valid JWT is present.',
    enforcementLayer: 'ROUTING',
    status: 'FROZEN_AND_CERTIFIED',
  },
  {
    id: 'SEC-GXWX-004-I05',
    name: 'Explicit Conversion Boundary',
    description:
      'The only valid transition path from GX to WX is: GX -> explicit user choice -> AUTHENTICATION -> successful auth -> AUTHORIZED CLAIM -> WX.',
    enforcementLayer: 'BROWSER',
    status: 'FROZEN_AND_CERTIFIED',
  },
  {
    id: 'SEC-GXWX-004-I06',
    name: 'Multi-Tab Concurrency Isolation',
    description:
      'Opening multiple guest tabs or a guest tab alongside an active workspace tab maintains independent in-memory state with zero cross-tab pollution.',
    enforcementLayer: 'BROWSER',
    status: 'FROZEN_AND_CERTIFIED',
  },
  {
    id: 'SEC-GXWX-004-I07',
    name: 'Authoritative Quota Enclosure',
    description:
      'Claiming a guest session into a registered account strictly enforces DomainQuotaPolicy. If account already has 4 domains, claim is rejected with 403 Forbidden.',
    enforcementLayer: 'TRANSACTION',
    status: 'FROZEN_AND_CERTIFIED',
  },
  {
    id: 'SEC-GXWX-004-I08',
    name: 'Unauthenticated Claim Protection',
    description:
      '/api/v1/guest/claim strictly requires JwtAuthGuard; unauthenticated claim attempts fail closed with 401 Unauthorized.',
    enforcementLayer: 'API',
    status: 'FROZEN_AND_CERTIFIED',
  },
  {
    id: 'SEC-GXWX-004-I09',
    name: 'Replay & Double-Claim Resistance',
    description:
      'A guest session marked CONVERTED cannot be claimed by another user account; cross-user claim replay returns 403 Forbidden.',
    enforcementLayer: 'DATABASE',
    status: 'FROZEN_AND_CERTIFIED',
  },
  {
    id: 'SEC-GXWX-004-I10',
    name: 'Post-Logout Availability',
    description:
      'Terminating a registered workspace session via logout leaves the Guest Experience fully functional and available without residual state coupling.',
    enforcementLayer: 'ROUTING',
    status: 'FROZEN_AND_CERTIFIED',
  },
] as const;

/**
 * 16 Critical Attack & Regression Scenarios (GXWX-01 .. GXWX-16)
 */
export interface IdentityScenarioDefinition {
  readonly id: string;
  readonly name: string;
  readonly scenario: string;
  readonly initialBrowserState: {
    readonly hasAuthToken: boolean;
    readonly currentRoute: string;
    readonly activeGuestSession: boolean;
    readonly userDomainCount?: number;
  };
  readonly action: string;
  readonly expectedResultPlane: 'GX' | 'WX' | 'LOGIN' | 'CREATE_WORKSPACE' | 'REJECTED';
  readonly expectedIdentityBehavior: string;
  readonly testedInvariant: string;
}

export const SEC_GXWX_004_SCENARIOS: readonly IdentityScenarioDefinition[] = [
  {
    id: 'GXWX-01',
    name: 'Logged-out user opens GX',
    scenario: 'Anonymous user navigates to /guest with no credentials in browser.',
    initialBrowserState: {
      hasAuthToken: false,
      currentRoute: '/guest',
      activeGuestSession: false,
    },
    action: 'NAVIGATE_TO_GUEST',
    expectedResultPlane: 'GX',
    expectedIdentityBehavior: 'Renders guest shell with anonymous ephemeral session and Sign In link.',
    testedInvariant: 'SEC-GXWX-004-I01',
  },
  {
    id: 'GXWX-02',
    name: 'Logged-in user opens GX',
    scenario: 'Authenticated user with active JWT cookie navigates to /guest.',
    initialBrowserState: {
      hasAuthToken: true,
      currentRoute: '/guest',
      activeGuestSession: false,
    },
    action: 'NAVIGATE_TO_GUEST',
    expectedResultPlane: 'GX',
    expectedIdentityBehavior: 'Remains in guest shell; no automatic redirect to /workspace; guest discovery remains isolated.',
    testedInvariant: 'SEC-GXWX-004-I01',
  },
  {
    id: 'GXWX-03',
    name: 'Logged-in user refreshes GX',
    scenario: 'Authenticated user refreshes browser on /guest.',
    initialBrowserState: {
      hasAuthToken: true,
      currentRoute: '/guest',
      activeGuestSession: true,
    },
    action: 'BROWSER_REFRESH',
    expectedResultPlane: 'GX',
    expectedIdentityBehavior: 'Page reloads strictly in GX plane without route promotion or workspace navigation.',
    testedInvariant: 'SEC-GXWX-004-I04',
  },
  {
    id: 'GXWX-04',
    name: 'Logged-in user opens GX in new tab',
    scenario: 'Authenticated user opens /guest in a new browser tab.',
    initialBrowserState: {
      hasAuthToken: true,
      currentRoute: '/guest',
      activeGuestSession: false,
    },
    action: 'OPEN_NEW_TAB',
    expectedResultPlane: 'GX',
    expectedIdentityBehavior: 'New tab initializes in GX plane independently without auto-redirecting.',
    testedInvariant: 'SEC-GXWX-004-I04',
  },
  {
    id: 'GXWX-05',
    name: 'Existing WX tab + new GX tab',
    scenario: 'User has Tab 1 on /workspace and opens Tab 2 on /guest.',
    initialBrowserState: {
      hasAuthToken: true,
      currentRoute: '/guest',
      activeGuestSession: false,
    },
    action: 'OPEN_CONCURRENT_GX_TAB',
    expectedResultPlane: 'GX',
    expectedIdentityBehavior: 'Tab 1 remains WX; Tab 2 remains GX; zero state or event cross-contamination.',
    testedInvariant: 'SEC-GXWX-004-I06',
  },
  {
    id: 'GXWX-06',
    name: 'GX calls /auth/me',
    scenario: 'Top-level AuthProvider calls GET /api/v1/auth/me while on /guest.',
    initialBrowserState: {
      hasAuthToken: true,
      currentRoute: '/guest',
      activeGuestSession: true,
    },
    action: 'EXECUTE_INIT_AUTH',
    expectedResultPlane: 'GX',
    expectedIdentityBehavior: 'AuthContext hydrates user profile in memory, but GX plane and components remain unmutated.',
    testedInvariant: 'SEC-GXWX-004-I01',
  },
  {
    id: 'GXWX-07',
    name: 'Existing access cookie present',
    scenario: 'Valid nebula_access_token cookie is attached to guest API request.',
    initialBrowserState: {
      hasAuthToken: true,
      currentRoute: '/guest',
      activeGuestSession: true,
    },
    action: 'CALL_GUEST_UNDERSTAND_API',
    expectedResultPlane: 'GX',
    expectedIdentityBehavior: 'Backend processes request under system guest identity (guest@system.atlas), ignoring cookie.',
    testedInvariant: 'SEC-GXWX-004-I02',
  },
  {
    id: 'GXWX-08',
    name: 'Existing refresh cookie present',
    scenario: 'Browser contains nebula_refresh_token while user explores guest findings.',
    initialBrowserState: {
      hasAuthToken: true,
      currentRoute: '/guest',
      activeGuestSession: true,
    },
    action: 'POLL_GUEST_JOB_STATUS',
    expectedResultPlane: 'GX',
    expectedIdentityBehavior: 'Job polling remains ephemeral and scoped to guest session ID without invoking refresh.',
    testedInvariant: 'SEC-GXWX-004-I02',
  },
  {
    id: 'GXWX-09',
    name: 'GX clicks Workspace',
    scenario: 'User on /guest clicks explicit workspace transition action.',
    initialBrowserState: {
      hasAuthToken: true,
      currentRoute: '/guest',
      activeGuestSession: true,
    },
    action: 'CLICK_WORKSPACE_NAVIGATION',
    expectedResultPlane: 'WX',
    expectedIdentityBehavior: 'Navigates explicitly to /workspace; requires deliberate user click.',
    testedInvariant: 'SEC-GXWX-004-I05',
  },
  {
    id: 'GXWX-10',
    name: 'GX clicks Claim',
    scenario: 'User on /guest clicks Claim Infrastructure button.',
    initialBrowserState: {
      hasAuthToken: true,
      currentRoute: '/guest',
      activeGuestSession: true,
    },
    action: 'CLICK_CLAIM_INFRASTRUCTURE',
    expectedResultPlane: 'GX',
    expectedIdentityBehavior: 'Opens CreateWorkspaceSurface modal in authenticated mode; does not auto-claim until user confirms.',
    testedInvariant: 'SEC-GXWX-004-I05',
  },
  {
    id: 'GXWX-11',
    name: 'GX session has guest ID + browser has user ID',
    scenario: 'Active guest session exists alongside hydrated AuthContext user.',
    initialBrowserState: {
      hasAuthToken: true,
      currentRoute: '/guest',
      activeGuestSession: true,
    },
    action: 'INSPECT_IDENTITY_STATE',
    expectedResultPlane: 'GX',
    expectedIdentityBehavior: 'Guest state is keyed strictly by sessionToken; user state by userId; no implicit merge.',
    testedInvariant: 'SEC-GXWX-004-I03',
  },
  {
    id: 'GXWX-12',
    name: 'Logout then GX',
    scenario: 'User logs out of workspace (clearing JWT cookies) and immediately visits /guest.',
    initialBrowserState: {
      hasAuthToken: false,
      currentRoute: '/guest',
      activeGuestSession: false,
    },
    action: 'START_GUEST_DISCOVERY',
    expectedResultPlane: 'GX',
    expectedIdentityBehavior: 'Guest understanding executes normally with full ephemeral capabilities.',
    testedInvariant: 'SEC-GXWX-004-I10',
  },
  {
    id: 'GXWX-13',
    name: 'OAuth callback during GX',
    scenario: 'User completes OAuth flow during guest claim and lands on /auth/callback.',
    initialBrowserState: {
      hasAuthToken: true,
      currentRoute: '/auth/callback',
      activeGuestSession: true,
    },
    action: 'PROCESS_OAUTH_CALLBACK',
    expectedResultPlane: 'WX',
    expectedIdentityBehavior: 'Reads sessionStorage claim token, executes explicit claim, then redirects to /workspace.',
    testedInvariant: 'SEC-GXWX-004-I05',
  },
  {
    id: 'GXWX-14',
    name: 'Multiple GX tabs',
    scenario: 'User analyzes domain A in Tab 1 and domain B in Tab 2 simultaneously.',
    initialBrowserState: {
      hasAuthToken: false,
      currentRoute: '/guest',
      activeGuestSession: true,
    },
    action: 'CONCURRENT_GUEST_ANALYSIS',
    expectedResultPlane: 'GX',
    expectedIdentityBehavior: 'Each tab maintains separate React state and unique backend sessionId/jobId.',
    testedInvariant: 'SEC-GXWX-004-I06',
  },
  {
    id: 'GXWX-15',
    name: 'Existing user has 4 domains',
    scenario: 'Authenticated user at 4-domain quota limit attempts to claim guest session.',
    initialBrowserState: {
      hasAuthToken: true,
      currentRoute: '/guest',
      activeGuestSession: true,
      userDomainCount: 4,
    },
    action: 'ATTEMPT_CLAIM_AT_QUOTA',
    expectedResultPlane: 'REJECTED',
    expectedIdentityBehavior: 'Backend rejects claim with 403 DOMAIN_QUOTA_EXCEEDED; UI shows domain limit error; 0 domains added.',
    testedInvariant: 'SEC-GXWX-004-I07',
  },
  {
    id: 'GXWX-16',
    name: 'Direct API attempt to exploit conversion',
    scenario: 'Attacker sends direct POST /api/v1/guest/claim without JWT or with already-claimed session.',
    initialBrowserState: {
      hasAuthToken: false,
      currentRoute: '/api/v1/guest/claim',
      activeGuestSession: false,
    },
    action: 'EXPLOIT_DIRECT_CLAIM_API',
    expectedResultPlane: 'REJECTED',
    expectedIdentityBehavior: 'Server returns 401 Unauthorized (if unauthenticated) or 403 Forbidden (if replay).',
    testedInvariant: 'SEC-GXWX-004-I08',
  },
] as const;

/**
 * Pure Boundary Evaluator: Determines product plane and identity isolation state.
 */
export interface BoundaryEvaluationInput {
  readonly pathname: string;
  readonly hasAuthCookie: boolean;
  readonly hasHydratedUser: boolean;
  readonly isGuestSessionActive: boolean;
  readonly isExplicitAction: boolean;
}

export interface BoundaryEvaluationResult {
  readonly effectivePlane: 'GX' | 'WX' | 'LOGIN' | 'CREATE_WORKSPACE';
  readonly isGuestIdentityIsolated: boolean;
  readonly isAutoRedirectTriggered: boolean;
  readonly allowsImplicitConversion: boolean;
}

export function evaluateIdentityBoundary(
  input: BoundaryEvaluationInput
): BoundaryEvaluationResult {
  const normalizedPath = input.pathname.toLowerCase().split('?')[0];

  // Rule 1: /guest is always GX plane, never auto-redirects regardless of auth
  if (normalizedPath === '/guest' || normalizedPath.startsWith('/guest/')) {
    return {
      effectivePlane: 'GX',
      isGuestIdentityIsolated: true,
      isAutoRedirectTriggered: false,
      allowsImplicitConversion: false,
    };
  }

  // Rule 2: /workspace requires authenticated session
  if (normalizedPath === '/workspace' || normalizedPath.startsWith('/workspace/')) {
    if (input.hasHydratedUser || input.hasAuthCookie) {
      return {
        effectivePlane: 'WX',
        isGuestIdentityIsolated: true,
        isAutoRedirectTriggered: false,
        allowsImplicitConversion: false,
      };
    }
    return {
      effectivePlane: 'LOGIN',
      isGuestIdentityIsolated: true,
      isAutoRedirectTriggered: true,
      allowsImplicitConversion: false,
    };
  }

  // Rule 3: Registration / Workspace Creation
  if (
    normalizedPath === '/create-workspace' ||
    normalizedPath === '/auth/register' ||
    normalizedPath === '/register'
  ) {
    return {
      effectivePlane: 'CREATE_WORKSPACE',
      isGuestIdentityIsolated: true,
      isAutoRedirectTriggered: false,
      allowsImplicitConversion: false,
    };
  }

  // Fallback
  return {
    effectivePlane: 'GX',
    isGuestIdentityIsolated: true,
    isAutoRedirectTriggered: false,
    allowsImplicitConversion: false,
  };
}

/**
 * Pure Quota & Conversion Evaluator
 */
export interface ConversionEvaluationInput {
  readonly isAuthenticated: boolean;
  readonly isExplicitUserAction: boolean;
  readonly sessionToken: string | null;
  readonly sessionStatus: 'ACTIVE' | 'CONVERTED' | 'EXPIRED' | null;
  readonly userDomainCount: number;
  readonly maxAllowedDomains?: number;
}

export type ConversionOutcome =
  | 'CONVERSION_SUCCESS'
  | 'REJECTED_UNAUTHENTICATED_401'
  | 'REJECTED_QUOTA_EXCEEDED_403'
  | 'REJECTED_SESSION_CONVERTED_403'
  | 'REJECTED_SESSION_EXPIRED_400'
  | 'REJECTED_MISSING_EXPLICIT_ACTION'
  | 'REJECTED_INVALID_TOKEN_404';

export function evaluateConversionTransition(
  input: ConversionEvaluationInput
): ConversionOutcome {
  const maxDomains = input.maxAllowedDomains ?? 4;

  if (!input.isExplicitUserAction) {
    return 'REJECTED_MISSING_EXPLICIT_ACTION';
  }

  if (!input.isAuthenticated) {
    return 'REJECTED_UNAUTHENTICATED_401';
  }

  if (!input.sessionToken || !input.sessionStatus) {
    return 'REJECTED_INVALID_TOKEN_404';
  }

  if (input.sessionStatus === 'EXPIRED') {
    return 'REJECTED_SESSION_EXPIRED_400';
  }

  if (input.sessionStatus === 'CONVERTED') {
    return 'REJECTED_SESSION_CONVERTED_403';
  }

  if (input.userDomainCount >= maxDomains) {
    return 'REJECTED_QUOTA_EXCEEDED_403';
  }

  return 'CONVERSION_SUCCESS';
}
