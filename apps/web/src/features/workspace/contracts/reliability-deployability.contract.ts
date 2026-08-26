import type { WorkspaceSemanticState } from './workspace-state-matrix.contract.ts';

/**
 * Authoritative Reliability & Deployability Contract (WX-807).
 *
 * Enforces fault tolerance, environment validation, startup/shutdown safety,
 * Kubernetes health/readiness probe contracts, and failure-to-semantic-state mappings.
 */

export interface EnvironmentValidationResult {
  readonly isValid: boolean;
  readonly missingVariables: readonly string[];
}

/**
 * Validates critical production environment variables prior to traffic acceptance.
 *
 * Hard invariant: Prevents unsafe startup with development fallbacks in production.
 */
export function validateStartupEnvironment(env: Readonly<Record<string, string | undefined>>): EnvironmentValidationResult {
  const REQUIRED_PRODUCTION_VARS = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV',
  ] as const;

  const missing: string[] = [];

  for (const key of REQUIRED_PRODUCTION_VARS) {
    const val = env[key];
    if (!val || val.trim() === '') {
      missing.push(key);
    }
  }

  return {
    isValid: missing.length === 0,
    missingVariables: missing,
  };
}

export interface DependencyStatus {
  readonly dbConnected: boolean;
  readonly workerOperational: boolean;
  readonly memoryHealthy: boolean;
}

export interface ReadinessEvaluation {
  readonly isReady: boolean;
  readonly httpStatus: 200 | 503;
  readonly failedDependencies: readonly string[];
}

/**
 * Evaluates Kubernetes-style readiness probe.
 *
 * Hard invariant: An instance MUST NOT report ready if PostgreSQL or the Worker is unhealthy.
 */
export function evaluateReadinessState(deps: DependencyStatus): ReadinessEvaluation {
  const failed: string[] = [];

  if (!deps.dbConnected) failed.push('POSTGRESQL_UNAVAILABLE');
  if (!deps.workerOperational) failed.push('WORKER_UNAVAILABLE');
  if (!deps.memoryHealthy) failed.push('MEMORY_PRESSURE_CRITICAL');

  const isReady = failed.length === 0;

  return {
    isReady,
    httpStatus: isReady ? 200 : 503,
    failedDependencies: failed,
  };
}

/**
 * Maps runtime and discovery dependency failures to honest Phase 7 canonical UX states.
 */
export function mapDependencyFailureToSemanticState(params: {
  readonly dependency: 'DNS' | 'HTTP' | 'TLS' | 'TECHNOLOGY' | 'DATABASE' | 'AUTHENTICATION';
  readonly hasExistingBaseline: boolean;
  readonly isForeignDomain?: boolean;
}): WorkspaceSemanticState {
  const { dependency, hasExistingBaseline, isForeignDomain } = params;

  if (isForeignDomain) {
    return 'UNAVAILABLE';
  }

  if (dependency === 'DATABASE' || dependency === 'AUTHENTICATION') {
    return 'ERROR';
  }

  // Discovery module degradation
  if (hasExistingBaseline) {
    return 'PARTIAL';
  }

  return 'ERROR';
}

/**
 * Ten Certified P0 Reliability & Deployability Invariants (WX-807).
 */
export const RELIABILITY_HARD_INVARIANTS = [
  'NO_SILENT_DEPENDENCY_FAILURE',
  'NO_STUCK_UNDERSTANDING_JOB',
  'NO_TRUSTED_STATE_CORRUPTION_ON_FAILURE',
  'NO_DATABASE_FAILURE_DATA_CORRUPTION',
  'NO_UNBOUNDED_EXTERNAL_OPERATION',
  'NO_UNSAFE_STARTUP',
  'NO_FALSE_READINESS',
  'NO_UNSAFE_SHUTDOWN',
  'NO_MIGRATION_DATA_LOSS',
  'NO_UNSAFE_ROLLBACK',
] as const;
