/**
 * Authoritative Final Production Verification & Release Gate Contract (WX-809).
 *
 * Establishes the 13 canonical P0 production certification gates required to
 * certify a specific release candidate build for production deployment.
 */

export type ProductionGateId =
  | 'SECURITY_HARDENING'
  | 'API_CORRECTNESS'
  | 'DATA_INTEGRITY'
  | 'OBSERVABILITY_TELEMETRY'
  | 'PERFORMANCE_BUDGETS'
  | 'RELIABILITY_FAULT_TOLERANCE'
  | 'DEPLOYABILITY_STARTUP_SAFETY'
  | 'RUNTIME_UX_CONTINUITY'
  | 'TENANT_ISOLATION'
  | 'HISTORICAL_TRUTH_PRESERVATION'
  | 'FAILURE_RECOVERY'
  | 'PRODUCTION_SMOKE_TEST'
  | 'ROLLBACK_SAFETY';

export interface ProductionGateDefinition {
  readonly id: ProductionGateId;
  readonly title: string;
  readonly domain: string;
  readonly severity: 'P0_RELEASE_BLOCKER';
  readonly description: string;
}

export const FINAL_RELEASE_GATES: readonly ProductionGateDefinition[] = [
  {
    id: 'SECURITY_HARDENING',
    title: 'Tenant Security Hardening',
    domain: 'SECURITY',
    severity: 'P0_RELEASE_BLOCKER',
    description: 'Zero cross-tenant data leakage, IDOR prevention, and secret masking.',
  },
  {
    id: 'API_CORRECTNESS',
    title: 'API Correctness & Route Parity',
    domain: 'API_CORRECTNESS',
    severity: 'P0_RELEASE_BLOCKER',
    description: 'All 15 production endpoints have verified backend contracts and status codes.',
  },
  {
    id: 'DATA_INTEGRITY',
    title: 'Data Integrity & Referential Lineage',
    domain: 'DATA_INTEGRITY',
    severity: 'P0_RELEASE_BLOCKER',
    description: 'Immutable historical snapshots and domain-isolated change histories.',
  },
  {
    id: 'OBSERVABILITY_TELEMETRY',
    title: 'Observability & Correlation Tracing',
    domain: 'OBSERVABILITY',
    severity: 'P0_RELEASE_BLOCKER',
    description: 'End-to-end correlation ID propagation and sanitized structured logging.',
  },
  {
    id: 'PERFORMANCE_BUDGETS',
    title: 'Performance & SLA Latency Budgets',
    domain: 'PERFORMANCE',
    severity: 'P0_RELEASE_BLOCKER',
    description: 'Application latency budgets met and bounded historical query pagination.',
  },
  {
    id: 'RELIABILITY_FAULT_TOLERANCE',
    title: 'Reliability & Fault Tolerance',
    domain: 'RELIABILITY',
    severity: 'P0_RELEASE_BLOCKER',
    description: 'Graceful dependency degradation and honest Phase 7 semantic state mapping.',
  },
  {
    id: 'DEPLOYABILITY_STARTUP_SAFETY',
    title: 'Deployability & Startup Safety',
    domain: 'DEPLOYABILITY',
    severity: 'P0_RELEASE_BLOCKER',
    description: 'Strict environment validation, Kubernetes readiness probes, and migration safety.',
  },
  {
    id: 'RUNTIME_UX_CONTINUITY',
    title: 'Runtime UX & Browser Continuity',
    domain: 'RUNTIME_EXPERIENCE',
    severity: 'P0_RELEASE_BLOCKER',
    description: 'Domain context switching isolation, back/forward continuity, and race-condition safety.',
  },
  {
    id: 'TENANT_ISOLATION',
    title: 'Cross-Tenant Isolation Invariant',
    domain: 'SECURITY',
    severity: 'P0_RELEASE_BLOCKER',
    description: 'User A cannot access or infer User B domains, findings, snapshots, or changes.',
  },
  {
    id: 'HISTORICAL_TRUTH_PRESERVATION',
    title: 'Historical Truth & Immutability',
    domain: 'DATA_INTEGRITY',
    severity: 'P0_RELEASE_BLOCKER',
    description: 'Historical observations are never rewritten or mutated for UI convenience.',
  },
  {
    id: 'FAILURE_RECOVERY',
    title: 'Failure Recovery & Baseline Protection',
    domain: 'RELIABILITY',
    severity: 'P0_RELEASE_BLOCKER',
    description: 'Failed understanding jobs preserve prior trusted baseline snapshot.',
  },
  {
    id: 'PRODUCTION_SMOKE_TEST',
    title: 'Production Smoke Verification',
    domain: 'DEPLOYABILITY',
    severity: 'P0_RELEASE_BLOCKER',
    description: 'Live container startup, database reachability, and critical user journeys pass.',
  },
  {
    id: 'ROLLBACK_SAFETY',
    title: 'Safe Rollback & Schema Backward Compatibility',
    domain: 'DEPLOYABILITY',
    severity: 'P0_RELEASE_BLOCKER',
    description: 'Rollback between versions preserves long-lived historical infrastructure data.',
  },
];

export interface FinalReleaseEvaluation {
  readonly isApprovedForRelease: boolean;
  readonly totalGates: number;
  readonly passedGates: number;
  readonly blockedGates: readonly ProductionGateId[];
  readonly decisionBanner: string;
}

/**
 * Evaluates the 13 canonical production gates for the release candidate build.
 *
 * Invariant: A single failed P0 gate strictly blocks production release.
 */
export function evaluateFinalReleaseGate(
  evaluations: Readonly<Record<ProductionGateId, boolean>>
): FinalReleaseEvaluation {
  const blockedGates: ProductionGateId[] = [];

  for (const gate of FINAL_RELEASE_GATES) {
    if (!evaluations[gate.id]) {
      blockedGates.push(gate.id);
    }
  }

  const isApproved = blockedGates.length === 0;

  return {
    isApprovedForRelease: isApproved,
    totalGates: FINAL_RELEASE_GATES.length,
    passedGates: FINAL_RELEASE_GATES.length - blockedGates.length,
    blockedGates,
    decisionBanner: isApproved
      ? 'NEBULA PRODUCTION CERTIFIED — RELEASE APPROVED'
      : 'RELEASE BLOCKED — UNRESOLVED P0 PRODUCTION GATES',
  };
}

/**
 * Ten Certified P0 Release Gate Invariants (WX-809).
 */
export const FINAL_PRODUCTION_HARD_INVARIANTS = [
  'NO_UNRESOLVED_P0_RELEASE_DEFECTS',
  'NO_UNVERIFIED_BUILD_DEPLOYMENT',
  'NO_MOCK_ONLY_RELEASE_CERTIFICATION',
  'NO_CROSS_TENANT_DATA_EXPOSURE',
  'NO_HISTORICAL_TRUTH_MUTATION',
  'NO_SILENT_OPERATIONAL_FAILURE',
  'NO_UNBOUNDED_LATENCY_REGRESSION',
  'NO_UNSAFE_STARTUP_ENVIRONMENT',
  'NO_FALSE_READINESS_REPORTING',
  'NO_BROKEN_USER_JOURNEY_CONTINUITY',
] as const;
