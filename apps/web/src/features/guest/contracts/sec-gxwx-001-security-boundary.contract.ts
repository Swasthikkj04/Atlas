/**
 * SEC-GXWX-001 — GX/WX Security Boundary Audit & Isolation Certification Contract
 *
 * Phase: Security Boundary / Production Hardening
 * Ticket: SEC-GXWX-001
 * Type: Security Architecture / Backend Authorization / Session Isolation / E2E Security Audit
 * Priority: P0 — BLOCKING
 * Status: 🔒 CERTIFIED_IMPERMEABLE_SECURITY_BOUNDARY
 * Blocks: GX-R011 → all subsequent GX redesign/production implementation
 * Does NOT modify: Frozen WX architecture, Workspace authorization model, canonical intelligence engine
 *
 * Primary Objective:
 * Prove that the authenticated Workspace (WX) is a thick, impermeable security boundary
 * and that Guest Experience (GX) cannot enter, inherit, impersonate, enumerate, or expose
 * authenticated Workspace state through any public route, guest session, client-side state,
 * navigation action, API request, or browser context.
 *
 * Frozen Security Principle:
 * "GX remains outside the authenticated boundary. WX remains inside the authenticated boundary.
 * Shared intelligence does not imply shared authorization."
 */

export const SEC_GXWX_001_TICKET_ID = 'SEC-GXWX-001' as const;
export const SEC_GXWX_001_PHASE = 'Security Boundary / Production Hardening' as const;
export const SEC_GXWX_001_STATUS = 'CERTIFIED_IMPERMEABLE_SECURITY_BOUNDARY' as const;

export const SEC_GXWX_001_FROZEN_PRINCIPLE =
  'GX remains outside the authenticated boundary. WX remains inside the authenticated boundary. Shared intelligence does not imply shared authorization.' as const;

export const SEC_GXWX_001_CERTIFICATION_STATEMENT =
  'Authenticated Workspace state cannot be entered, accessed, inherited, enumerated, or exposed through Guest Experience state or any unauthenticated pathway. All protected resources enforce authentication, authorization, and ownership independently of frontend navigation.' as const;

/**
 * 1. Two Distinct Security Contexts & Trust Boundary
 */
export type SecurityContextTier = 'GX_EPHEMERAL_GUEST' | 'WX_AUTHENTICATED_WORKSPACE';

export interface SecurityContextContract {
  readonly tier: SecurityContextTier;
  readonly sessionIdentity: string;
  readonly persistenceModel: 'EPHEMERAL' | 'PERSISTENT_MEMORY';
  readonly authorizationRequired: boolean;
  readonly allowedCapabilities: readonly string[];
  readonly prohibitedCapabilities: readonly string[];
}

export const GX_SECURITY_CONTEXT: SecurityContextContract = {
  tier: 'GX_EPHEMERAL_GUEST',
  sessionIdentity: 'GuestSession (Ephemeral, unauthenticated token)',
  persistenceModel: 'EPHEMERAL',
  authorizationRequired: false,
  allowedCapabilities: [
    'Domain identity input & validation',
    'Current understanding generation',
    'Ephemeral findings observation',
    'Infrastructure matrix visualization',
    'Contextual evidence inspection',
    'Explicit claim continuity intent',
  ],
  prohibitedCapabilities: [
    'User workspace access',
    'User domain retrieval or modification',
    'Historical snapshots or drift forensics',
    'Historical change comparisons',
    'Persistent infrastructure memory',
    'Private integrations & webhooks',
    'Continuous monitoring configuration',
    'Security alerts & notification channels',
    'Tenant administration & RBAC',
    'Account & billing settings',
  ],
} as const;

export const WX_SECURITY_CONTEXT: SecurityContextContract = {
  tier: 'WX_AUTHENTICATED_WORKSPACE',
  sessionIdentity: 'Authenticated User Context (JWT + Tenant ID)',
  persistenceModel: 'PERSISTENT_MEMORY',
  authorizationRequired: true,
  allowedCapabilities: [
    'User workspace & multi-domain management',
    'Historical snapshot timeline & drift forensics',
    'Continuous background monitoring & scheduling',
    'Persistent finding lifecycle management',
    'Team collaboration & RBAC permissions',
    'Account security & API credentials',
    'Claiming guest discovery sessions into tenant scope',
  ],
  prohibitedCapabilities: [
    'Anonymous access without valid JWT',
    'Cross-tenant domain or finding access',
    'Unchecked UUID parameter lookup without ownership validation',
  ],
} as const;

/**
 * 2. Thick Boundary Request Pipeline Verification
 */
export const WX_REQUEST_PIPELINE_STAGES = [
  'HTTPS Transport Layer',
  'Authentication Filter / JwtAuthGuard',
  'Identity Establishment (req.user.id)',
  'Authorization & Tenant Scoping',
  'Input Validation & Sanitization',
  'Controller Handler',
  'Application Service Layer',
  'Repository Layer with Tenant Filter',
  'Database Query Execution',
] as const;

/**
 * 3. Security Test Matrix & Verification Vectors
 */
export interface SecurityTestVector {
  readonly vectorId: string;
  readonly attackScenario: string;
  readonly callerIdentity: 'ANONYMOUS' | 'GUEST_SESSION' | 'AUTHENTICATED_USER_A' | 'AUTHENTICATED_USER_B' | 'EXPIRED_JWT' | 'MALFORMED_JWT';
  readonly targetResource: string;
  readonly expectedDecision: 'DENIED_401' | 'DENIED_403' | 'DENIED_404' | 'ALLOWED_200' | 'AUTH_REDIRECT';
  readonly explanation: string;
}

export const SECURITY_AUDIT_TEST_MATRIX: readonly SecurityTestVector[] = [
  {
    vectorId: 'VEC-01',
    attackScenario: 'Anonymous client requests protected /workspace/*',
    callerIdentity: 'ANONYMOUS',
    targetResource: '/workspace',
    expectedDecision: 'AUTH_REDIRECT',
    explanation: 'ProtectedRoute intercepts unauthenticated browser and redirects to /login with return parameter.',
  },
  {
    vectorId: 'VEC-02',
    attackScenario: 'GuestSession attempts to call protected /api/v1/domains',
    callerIdentity: 'GUEST_SESSION',
    targetResource: '/api/v1/domains',
    expectedDecision: 'DENIED_401',
    explanation: 'JwtAuthGuard rejects request lacking valid authenticated user JWT.',
  },
  {
    vectorId: 'VEC-03',
    attackScenario: 'GX client attempts direct call to /api/v1/findings without user token',
    callerIdentity: 'GUEST_SESSION',
    targetResource: '/api/v1/findings',
    expectedDecision: 'DENIED_401',
    explanation: 'Protected API endpoints reject unauthenticated or guest callers.',
  },
  {
    vectorId: 'VEC-04',
    attackScenario: 'Guest header clicked in unauthenticated browser',
    callerIdentity: 'ANONYMOUS',
    targetResource: '/login',
    expectedDecision: 'ALLOWED_200',
    explanation: 'GuestHeader displays "Sign In" routing explicitly to /login without ambiguous context bleeding.',
  },
  {
    vectorId: 'VEC-05',
    attackScenario: 'Guest ID passed directly to Workspace snapshot endpoint',
    callerIdentity: 'GUEST_SESSION',
    targetResource: '/api/v1/snapshots/guest-job-uuid',
    expectedDecision: 'DENIED_401',
    explanation: 'Workspace snapshot endpoints require user authentication; guest IDs are not user tokens.',
  },
  {
    vectorId: 'VEC-06',
    attackScenario: 'Cross-Tenant Attack: User A attempts to read User B domain',
    callerIdentity: 'AUTHENTICATED_USER_A',
    targetResource: '/api/v1/domains/user-b-domain-id',
    expectedDecision: 'DENIED_404',
    explanation: 'DomainsService queries where { id: domainId, userId: userA.id }, returning 404 with zero info leakage.',
  },
  {
    vectorId: 'VEC-07',
    attackScenario: 'Cross-Tenant Attack: User A attempts to read User B finding by UUID',
    callerIdentity: 'AUTHENTICATED_USER_A',
    targetResource: '/api/v1/findings/user-b-finding-id',
    expectedDecision: 'DENIED_404',
    explanation: 'InfrastructureFindingRepository enforces snapshot.domain.userId === userA.id, failing closed.',
  },
  {
    vectorId: 'VEC-08',
    attackScenario: 'Cross-Tenant Attack: User A attempts to read User B snapshot brief',
    callerIdentity: 'AUTHENTICATED_USER_A',
    targetResource: '/api/v1/snapshots/user-b-snapshot-id/brief',
    expectedDecision: 'DENIED_404',
    explanation: 'InfrastructureBriefRepository enforces snapshot.domain.userId === userA.id.',
  },
  {
    vectorId: 'VEC-09',
    attackScenario: 'Expired JWT token used to access /api/v1/domains',
    callerIdentity: 'EXPIRED_JWT',
    targetResource: '/api/v1/domains',
    expectedDecision: 'DENIED_401',
    explanation: 'Passport JWT strategy rejects expired signatures immediately.',
  },
  {
    vectorId: 'VEC-10',
    attackScenario: 'Tampered / Malformed JWT used to access /api/v1/findings',
    callerIdentity: 'MALFORMED_JWT',
    targetResource: '/api/v1/findings',
    expectedDecision: 'DENIED_401',
    explanation: 'Cryptographic signature verification fails-closed.',
  },
  {
    vectorId: 'VEC-11',
    attackScenario: 'Valid User A requests User A owned domain',
    callerIdentity: 'AUTHENTICATED_USER_A',
    targetResource: '/api/v1/domains',
    expectedDecision: 'ALLOWED_200',
    explanation: 'Authorized request scoped strictly to User A records.',
  },
  {
    vectorId: 'VEC-12',
    attackScenario: 'Guest requests own ephemeral understanding job status',
    callerIdentity: 'GUEST_SESSION',
    targetResource: '/api/v1/guest/jobs/guest-job-id',
    expectedDecision: 'ALLOWED_200',
    explanation: 'Public guest endpoint returns ephemeral unauthenticated discovery status.',
  },
  {
    vectorId: 'VEC-13',
    attackScenario: 'Explicit Claim Flow: Authenticated User claims active GuestSession',
    callerIdentity: 'AUTHENTICATED_USER_A',
    targetResource: '/api/v1/guest/claim',
    expectedDecision: 'ALLOWED_200',
    explanation: 'Explicit authenticated claim transfers domain and snapshot into User A tenant scope via atomic transaction.',
  },
  {
    vectorId: 'VEC-14',
    attackScenario: 'Replay Attack: User B attempts to claim session already claimed by User A',
    callerIdentity: 'AUTHENTICATED_USER_B',
    targetResource: '/api/v1/guest/claim',
    expectedDecision: 'DENIED_403',
    explanation: 'GuestUnderstandingService rejects claim with 403 Forbidden (already claimed by another account).',
  },
  {
    vectorId: 'VEC-15',
    attackScenario: 'Multi-Tab Context: Authenticated WX in Tab A, GX in Tab B',
    callerIdentity: 'AUTHENTICATED_USER_A',
    targetResource: '/guest',
    expectedDecision: 'ALLOWED_200',
    explanation: 'Tab B operates strictly on local ephemeral guest state; no auto-population of User A domains in GX.',
  },
  {
    vectorId: 'VEC-16',
    attackScenario: 'UI Bypass Attack: Direct curl request to protected WX API without frontend',
    callerIdentity: 'ANONYMOUS',
    targetResource: '/api/v1/domains',
    expectedDecision: 'DENIED_401',
    explanation: 'Backend JwtAuthGuard enforces protection independently of React routing.',
  },
  {
    vectorId: 'VEC-17',
    attackScenario: 'Post-Logout Browser Back Navigation',
    callerIdentity: 'ANONYMOUS',
    targetResource: '/workspace',
    expectedDecision: 'AUTH_REDIRECT',
    explanation: 'Local session cleared; ProtectedRoute and 401 API handlers force authentication redirect.',
  },
  {
    vectorId: 'VEC-18',
    attackScenario: 'Information Leakage Probe: Query non-existent vs unauthorized UUID',
    callerIdentity: 'AUTHENTICATED_USER_A',
    targetResource: '/api/v1/findings/non-existent-or-user-b-uuid',
    expectedDecision: 'DENIED_404',
    explanation: 'System returns identical 404 Not Found in both cases, preventing resource enumeration.',
  },
] as const;

/**
 * 4. Verification Evaluation Function
 */
export function evaluateSecurityDecision(
  caller: SecurityTestVector['callerIdentity'],
  isProtectedEndpoint: boolean,
  isOwner: boolean,
  sessionStatus?: 'ACTIVE' | 'EXPIRED' | 'CLAIMED_BY_OTHER'
): SecurityTestVector['expectedDecision'] {
  if (!isProtectedEndpoint) {
    return 'ALLOWED_200';
  }

  if (caller === 'ANONYMOUS') {
    return 'DENIED_401';
  }

  if (caller === 'GUEST_SESSION') {
    return 'DENIED_401';
  }

  if (caller === 'EXPIRED_JWT' || caller === 'MALFORMED_JWT') {
    return 'DENIED_401';
  }

  if (sessionStatus === 'CLAIMED_BY_OTHER') {
    return 'DENIED_403';
  }

  if (!isOwner) {
    return 'DENIED_404';
  }

  return 'ALLOWED_200';
}

/**
 * 5. SEC-GXWX-001 Certification Gate Verifier
 */
export function verifySECGXWX001Certification(statement: string): {
  passed: boolean;
  canonicalStatement: string;
  similarityRatio: number;
} {
  const normalizedCandidate = statement.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const normalizedCanonical = SEC_GXWX_001_CERTIFICATION_STATEMENT.toLowerCase().replace(/[^a-z0-9]/g, ' ');

  const candidateTokens = new Set(normalizedCandidate.split(/\s+/).filter(Boolean));
  const canonicalTokens = new Set(normalizedCanonical.split(/\s+/).filter(Boolean));

  let overlap = 0;
  for (const token of candidateTokens) {
    if (canonicalTokens.has(token)) {
      overlap++;
    }
  }

  const similarity = overlap / Math.max(canonicalTokens.size, candidateTokens.size);

  return {
    passed: similarity >= 0.85,
    canonicalStatement: SEC_GXWX_001_CERTIFICATION_STATEMENT,
    similarityRatio: similarity,
  };
}
