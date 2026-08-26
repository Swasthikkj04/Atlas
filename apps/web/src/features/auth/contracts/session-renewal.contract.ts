/**
 * WX-1013: Persistent Authenticated Session & Silent Session Renewal Contract.
 *
 * Establishes canonical truth, state machine, and invariants for:
 * 1. Short-lived Access Tokens paired with Long-lived, Revocable Refresh Sessions.
 * 2. Silent Session Renewal on 401 without user disruption or visible logout.
 * 3. Single-Flight Refresh Coordinator protecting against concurrent renewal storm.
 * 4. Preservation of active Workspace state (active domain, route, query params, investigation context).
 * 5. Multi-device session isolation and explicit revocation.
 */

export const SESSION_RENEWAL_INVARIANTS = {
  ACTIVE_SESSION_PERSISTS:
    'An active authenticated session persists across normal Workspace usage and navigation without premature automatic logout.',
  NO_ACCESS_TOKEN_EXPIRY_LOGOUT:
    'The expiration of a short-lived access token never forces a visible logout if the underlying refresh session remains valid.',
  SILENT_SESSION_RENEWAL:
    'Expired access tokens silently and automatically renew via the session rotation endpoint, seamlessly retrying the original request.',
  SINGLE_FLIGHT_REFRESH:
    'Concurrent expired API requests are batched to await a single shared refresh operation, preventing refresh token race conditions.',
  SINGLE_FLIGHT_RUNTIME_REFRESH:
    'Guarantees exactly one refresh operation per expiration event in the browser runtime without duplicate executions.',
  ONE_REFRESH_PER_EXPIRATION_EVENT:
    'Multiple simultaneous 401 errors trigger exactly one refresh operation, never a storm of refresh calls.',
  NO_REFRESH_STORM:
    'Rapid concurrent requests awaiting token renewal coalesce into a single flight rather than dispatching parallel refresh requests.',
  NO_REFRESH_RECURSION:
    'The /auth/refresh endpoint itself and public auth endpoints are exempt from 401 interception to prevent recursive renewal loops.',
  TRANSPARENT_REQUEST_RETRY:
    'Following successful silent renewal, original API requests retry once with identical payload, method, and parameters.',
  NO_UNEXPECTED_WORKSPACE_LOGOUT:
    'Access token expiration does not trigger application resets or unexpected login redirects while working in Workspace.',
  REFRESH_CONTRACT_MATCHES_COOKIE_AUTHORITY:
    'The refresh endpoint accepts HTTP-Only cookie credentials without requiring a non-empty request body.',
  VALID_REFRESH_COOKIE_REACHES_SESSION_SERVICE:
    'A valid HTTP-Only refresh cookie bypasses DTO body requirements and directly executes session rotation.',
  NO_VALID_REFRESH_REQUEST_REJECTED_BY_DTO:
    'NestJS ValidationPipe accepts empty or optional body on /auth/refresh when HTTP-Only cookies are present.',
  NO_REFRESH_SECRET_EXPOSURE:
    'Refresh credentials are cryptographically protected, never exposed in UI or console logs, and never stored in ordinary application state.',
  SESSION_REVOCATION_IS_AUTHORITATIVE:
    'Revoking a session immediately prevents future silent renewal and forces explicit re-authentication upon access token expiry.',
  DEVICE_SESSION_ISOLATION:
    'Each device/browser maintains an independent session; revoking or expiring one device session does not terminate active sessions on other devices.',
  EXPLICIT_LOGOUT_IS_IMMEDIATE:
    'User-initiated logout immediately destroys the current server-side session and clears local credentials.',
  WORKSPACE_CONTEXT_PRESERVED:
    'Silent session renewal strictly preserves active domain, route, query parameters, and in-memory Workspace investigation context.',
  AUTH_FAILURE_IS_EXPLICIT:
    'When silent renewal legitimately fails (revoked/expired session), present a calm authentication prompt that preserves the intended return destination.',
  SESSION_FAILURE_IS_EXPLICIT:
    'Genuine session expiration is treated as an explicit authentication boundary rather than a generic application crash.',
  REFRESH_ROTATION_REMAINS_AUTHORITATIVE:
    'Every successful session refresh rotates the refresh token hash and extends the session TTL authoritatively on the backend.',
  NO_INFINITE_SESSION:
    'Session persistence is strictly bounded by backend security policy and maximum TTL, never an infinite frontend loop.',
} as const;

export type SessionState =
  | 'AUTHENTICATED'
  | 'RENEWING'
  | 'EXPIRED'
  | 'UNAUTHENTICATED';

export interface ResolveSessionRenewalParams {
  readonly isAuthenticated: boolean;
  readonly isRenewing?: boolean;
  readonly hasValidSession?: boolean;
  readonly sessionExpired?: boolean;
}

export interface SessionRenewalState {
  readonly state: SessionState;
  readonly canMakeAuthenticatedRequests: boolean;
  readonly requiresLogin: boolean;
  readonly headline: string;
  readonly description: string;
  readonly actionLabel: string;
}

/**
 * Pure resolver determining session state and presentation semantics.
 */
export function resolveSessionRenewalState(
  params: ResolveSessionRenewalParams
): SessionRenewalState {
  const {
    isAuthenticated,
    isRenewing = false,
    hasValidSession = true,
    sessionExpired = false,
  } = params;

  if (sessionExpired || (!hasValidSession && isAuthenticated)) {
    return {
      state: 'EXPIRED',
      canMakeAuthenticatedRequests: false,
      requiresLogin: true,
      headline: 'Your session has expired.',
      description: 'Sign in again to continue.',
      actionLabel: 'Continue to sign in →',
    };
  }

  if (isRenewing) {
    return {
      state: 'RENEWING',
      canMakeAuthenticatedRequests: true,
      requiresLogin: false,
      headline: 'Renewing session…',
      description: 'Verifying session credentials silently in the background.',
      actionLabel: 'Connecting…',
    };
  }

  if (isAuthenticated) {
    return {
      state: 'AUTHENTICATED',
      canMakeAuthenticatedRequests: true,
      requiresLogin: false,
      headline: 'Session active',
      description: 'Authenticated session is valid.',
      actionLabel: 'Active',
    };
  }

  return {
    state: 'UNAUTHENTICATED',
    canMakeAuthenticatedRequests: false,
    requiresLogin: true,
    headline: 'Authentication required',
    description: 'Please sign in to access Nebula Workspace.',
    actionLabel: 'Sign in →',
  };
}

/**
 * Checks whether an endpoint is exempt from automatic silent refresh interception
 * (e.g. login, register, logout, refresh itself).
 */
export function isAuthEndpointExempt(endpoint: string): boolean {
  if (!endpoint) return false;
  const clean = endpoint.toLowerCase();
  return (
    clean.includes('/auth/refresh') ||
    clean.includes('/auth/login') ||
    clean.includes('/auth/register') ||
    clean.includes('/auth/logout') ||
    clean.includes('/auth/forgot-password') ||
    clean.includes('/auth/reset-password') ||
    clean.includes('/auth/reactivate') ||
    clean.includes('/auth/verify-email') ||
    clean.includes('/auth/google') ||
    clean.includes('/auth/github')
  );
}

/**
 * Generates preserved login redirect URL with return path for seamless post-authentication continuity.
 */
export function createPreservedRedirectUrl(
  currentPath: string,
  fallbackLoginUrl = '/login'
): string {
  if (!currentPath || currentPath === '/' || currentPath === '/login' || currentPath === '/auth/login') {
    return fallbackLoginUrl;
  }
  return `${fallbackLoginUrl}?redirect=${encodeURIComponent(currentPath)}`;
}

/**
 * Single-Flight Refresh Coordinator (pure controller logic).
 * Batches multiple concurrent 401s into a single promise.
 */
export class SingleFlightCoordinator<T = boolean> {
  private activeFlight: Promise<T> | null = null;
  private flightCount = 0;

  get isFlightActive(): boolean {
    return this.activeFlight !== null;
  }

  get totalFlightsExecuted(): number {
    return this.flightCount;
  }

  async run(flightFn: () => Promise<T>): Promise<T> {
    if (this.activeFlight) {
      return this.activeFlight;
    }

    this.flightCount++;
    this.activeFlight = flightFn().finally(() => {
      this.activeFlight = null;
    });

    return this.activeFlight;
  }

  reset(): void {
    this.activeFlight = null;
  }
}
