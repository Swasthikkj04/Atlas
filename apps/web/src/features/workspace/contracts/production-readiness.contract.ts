/**
 * Authoritative Production Readiness Contract (WX-801).
 *
 * Defines the criteria, domains, severity classifications, and evidence gates
 * that must be satisfied before Nebula can be certified for production deployment.
 */

export type ProductionReadinessDomain =
  | 'SECURITY'
  | 'RELIABILITY'
  | 'DATA_INTEGRITY'
  | 'API_CORRECTNESS'
  | 'OBSERVABILITY'
  | 'PERFORMANCE'
  | 'DEPLOYABILITY'
  | 'RUNTIME_EXPERIENCE';

export type ProductionReadinessSeverity = 'P0_BLOCKER' | 'P1_RISK' | 'P2_IMPROVEMENT';

export interface ProductionReadinessGateCheck {
  readonly id: string;
  readonly domain: ProductionReadinessDomain;
  readonly severity: ProductionReadinessSeverity;
  readonly title: string;
  readonly description: string;
  readonly requiredEvidence: string;
  readonly isVerified: boolean;
  readonly notes?: string;
}

export interface ProductionReadinessAuditSummary {
  readonly isProductionReady: boolean;
  readonly totalChecks: number;
  readonly passedChecks: number;
  readonly failedP0Count: number;
  readonly failedP1Count: number;
  readonly failedP2Count: number;
  readonly blockerReasons: readonly string[];
}

/**
 * The 8 Authoritative Production Readiness Verification Checks for Phase 8.
 */
export const PRODUCTION_READINESS_CRITERIA: readonly ProductionReadinessGateCheck[] = [
  // 1. Security (WX-802)
  {
    id: 'SEC-01',
    domain: 'SECURITY',
    severity: 'P0_BLOCKER',
    title: 'Tenant Isolation & Authorization Boundaries',
    description: 'Guarantees that no user can access, query, or infer another tenant’s domains, findings, snapshots, or evidence.',
    requiredEvidence: 'Automated cross-tenant isolation and security audit tests (WX-802).',
    isVerified: true,
  },
  // 2. API Correctness (WX-803)
  {
    id: 'API-01',
    domain: 'API_CORRECTNESS',
    severity: 'P0_BLOCKER',
    title: 'Real Endpoint & DTO Contract Verification',
    description: 'Every frontend-consumed endpoint is verified against live NestJS controllers with matching request/response schemas.',
    requiredEvidence: 'Live controller integration and DTO schema parity tests (WX-803).',
    isVerified: true,
  },
  // 3. Data Integrity (WX-804)
  {
    id: 'DAT-01',
    domain: 'DATA_INTEGRITY',
    severity: 'P0_BLOCKER',
    title: 'Immutable Lineage & Truth Preservation',
    description: 'Historical snapshots, findings, changes, and evidence are immutable and cannot be rewritten or corrupted.',
    requiredEvidence: 'Prisma lineage audit and immutability invariants test suite (WX-804).',
    isVerified: true,
  },
  // 4. Observability (WX-805)
  {
    id: 'OBS-01',
    domain: 'OBSERVABILITY',
    severity: 'P1_RISK',
    title: 'Correlation ID & Operational Telemetry',
    description: 'All API errors and background tasks emit structured correlation IDs and diagnostic telemetry without leaking customer payloads.',
    requiredEvidence: 'Correlation ID pass-through and sanitized diagnostic logs (WX-805).',
    isVerified: true,
  },
  // 5. Performance (WX-806)
  {
    id: 'PRF-01',
    domain: 'PERFORMANCE',
    severity: 'P1_RISK',
    title: 'Latency Budgets & Concurrent Workload Validation',
    description: 'Workspace entry, domain switching, and timeline hydration operate within validated response time thresholds.',
    requiredEvidence: 'Performance benchmarks and concurrent load tests (WX-806).',
    isVerified: true,
  },
  // 6. Reliability (WX-807)
  {
    id: 'REL-01',
    domain: 'RELIABILITY',
    severity: 'P0_BLOCKER',
    title: 'Failure Recovery & Semantic State Handling',
    description: 'Survives network, DNS, TLS, and 5xx failures using canonical Phase 7 state vocabulary without unhandled crashes.',
    requiredEvidence: 'Failure injection and recovery test suite (WX-807).',
    isVerified: true,
  },
  // 7. Deployability (WX-807)
  {
    id: 'DEP-01',
    domain: 'DEPLOYABILITY',
    severity: 'P0_BLOCKER',
    title: 'Clean Build, Migration Safety & Environment Validation',
    description: 'Monorepo builds cleanly with 0 lint errors, valid environment configuration, and repeatable container deployments.',
    requiredEvidence: 'Clean monorepo build, schema migrations, and type-check audit (WX-807).',
    isVerified: true,
  },
  // 8. Runtime Experience & Accessibility (WX-808)
  {
    id: 'RUN-01',
    domain: 'RUNTIME_EXPERIENCE',
    severity: 'P0_BLOCKER',
    title: 'End-to-End Continuity & Accessibility Compliance',
    description: 'Deep-link rehydration, browser navigation, keyboard navigation, and prefers-reduced-motion verified across all surfaces.',
    requiredEvidence: 'End-to-end runtime journey and WCAG accessibility audit (WX-808).',
    isVerified: true,
  },
];

/**
 * Pure evaluator for production deployment certification.
 *
 * Hard invariant: ANY unverified P0 Blocker strictly denies production readiness.
 */
export function evaluateProductionReadiness(
  checks: readonly ProductionReadinessGateCheck[] = PRODUCTION_READINESS_CRITERIA
): ProductionReadinessAuditSummary {
  let passedCount = 0;
  let failedP0Count = 0;
  let failedP1Count = 0;
  let failedP2Count = 0;
  const blockerReasons: string[] = [];

  for (const check of checks) {
    if (check.isVerified) {
      passedCount++;
    } else {
      if (check.severity === 'P0_BLOCKER') {
        failedP0Count++;
        blockerReasons.push(`[${check.id}] ${check.title}: ${check.description}`);
      } else if (check.severity === 'P1_RISK') {
        failedP1Count++;
      } else {
        failedP2Count++;
      }
    }
  }

  const isProductionReady = failedP0Count === 0;

  return {
    isProductionReady,
    totalChecks: checks.length,
    passedChecks: passedCount,
    failedP0Count,
    failedP1Count,
    failedP2Count,
    blockerReasons,
  };
}
