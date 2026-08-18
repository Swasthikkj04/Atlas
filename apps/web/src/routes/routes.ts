/**
 * Canonical Application Route Definitions and Route Resolution Engine.
 *
 * Implements deterministic priority matching where specific sub-routes (e.g. /workspace/create)
 * are evaluated before broader prefix captures (e.g. /workspace).
 */

export const ROUTES = {
  HOME: '/',
  GUEST: '/guest',
  AUTH: {
    LOGIN: '/auth/login',
    LOGIN_ALIAS: '/login',
    REGISTER: '/auth/register',
    REGISTER_ALIAS: '/register',
    CALLBACK: '/auth/callback',
    VERIFY_EMAIL: '/auth/verify-email',
    VERIFY_EMAIL_ALIAS: '/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    FORGOT_PASSWORD_ALIAS: '/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    RESET_PASSWORD_ALIAS: '/reset-password',
  },
  WORKSPACE: {
    ROOT: '/workspace',
    DASHBOARD_ALIAS: '/dashboard',
    CREATE: '/workspace/create',
    CREATE_ALIAS: '/create-workspace',
  },
} as const;

export type AppRouteType =
  | 'AUTH_CALLBACK'
  | 'CREATE_WORKSPACE'
  | 'LOGIN'
  | 'VERIFY_EMAIL'
  | 'FORGOT_PASSWORD'
  | 'RESET_PASSWORD'
  | 'GUEST'
  | 'WORKSPACE'
  | 'LANDING';

/**
 * Resolves a URL pathname string to the corresponding canonical application view.
 *
 * Evaluation Order:
 * 1. /auth/callback (OAuth redirect hydration)
 * 2. Specific Create Workspace routes (/workspace/create, /create-workspace, /auth/register, /register)
 * 3. Forgot / Reset Password routes (/auth/forgot-password, /forgot-password, /auth/reset-password, /reset-password)
 * 4. Login routes (/auth/login, /login)
 * 5. Verify Email routes (/auth/verify-email, /verify-email)
 * 6. Guest Experience (/guest)
 * 7. Authenticated Workspace (/workspace, /dashboard)
 * 8. Public Landing fallback (/)
 */
export function resolveAppRoute(rawPathname: string): AppRouteType {
  if (!rawPathname) return 'LANDING';

  // Normalize path (strip trailing slashes, except root '/')
  const pathname =
    rawPathname.length > 1 && rawPathname.endsWith('/')
      ? rawPathname.slice(0, -1)
      : rawPathname;

  // 1. Auth Callback
  if (pathname === ROUTES.AUTH.CALLBACK || pathname.startsWith(`${ROUTES.AUTH.CALLBACK}/`)) {
    return 'AUTH_CALLBACK';
  }

  // 2. Specific Create Workspace Routes (MUST be evaluated BEFORE broader /workspace)
  if (
    pathname === ROUTES.WORKSPACE.CREATE ||
    pathname.startsWith(`${ROUTES.WORKSPACE.CREATE}/`) ||
    pathname === ROUTES.WORKSPACE.CREATE_ALIAS ||
    pathname.startsWith(`${ROUTES.WORKSPACE.CREATE_ALIAS}/`) ||
    pathname === ROUTES.AUTH.REGISTER ||
    pathname === ROUTES.AUTH.REGISTER_ALIAS
  ) {
    return 'CREATE_WORKSPACE';
  }

  // 3. Authentication: Forgot Password
  if (
    pathname === ROUTES.AUTH.FORGOT_PASSWORD ||
    pathname.startsWith(`${ROUTES.AUTH.FORGOT_PASSWORD}/`) ||
    pathname === ROUTES.AUTH.FORGOT_PASSWORD_ALIAS ||
    pathname.startsWith(`${ROUTES.AUTH.FORGOT_PASSWORD_ALIAS}/`)
  ) {
    return 'FORGOT_PASSWORD';
  }

  // 4. Authentication: Reset Password
  if (
    pathname === ROUTES.AUTH.RESET_PASSWORD ||
    pathname.startsWith(`${ROUTES.AUTH.RESET_PASSWORD}/`) ||
    pathname === ROUTES.AUTH.RESET_PASSWORD_ALIAS ||
    pathname.startsWith(`${ROUTES.AUTH.RESET_PASSWORD_ALIAS}/`)
  ) {
    return 'RESET_PASSWORD';
  }

  // 5. Authentication: Login
  if (
    pathname === ROUTES.AUTH.LOGIN ||
    pathname === ROUTES.AUTH.LOGIN_ALIAS
  ) {
    return 'LOGIN';
  }

  // 6. Authentication: Verify Email
  if (
    pathname === ROUTES.AUTH.VERIFY_EMAIL ||
    pathname.startsWith(`${ROUTES.AUTH.VERIFY_EMAIL}/`) ||
    pathname === ROUTES.AUTH.VERIFY_EMAIL_ALIAS ||
    pathname.startsWith(`${ROUTES.AUTH.VERIFY_EMAIL_ALIAS}/`)
  ) {
    return 'VERIFY_EMAIL';
  }

  // 5. Guest Experience
  if (
    pathname === ROUTES.GUEST ||
    pathname.startsWith(`${ROUTES.GUEST}/`)
  ) {
    return 'GUEST';
  }

  // 6. Authenticated Workspace (Evaluated AFTER specific /workspace/create)
  if (
    pathname === ROUTES.WORKSPACE.ROOT ||
    pathname.startsWith(`${ROUTES.WORKSPACE.ROOT}/`) ||
    pathname === ROUTES.WORKSPACE.DASHBOARD_ALIAS ||
    pathname.startsWith(`${ROUTES.WORKSPACE.DASHBOARD_ALIAS}/`)
  ) {
    return 'WORKSPACE';
  }

  // 7. Public Landing Page Fallback
  return 'LANDING';
}
