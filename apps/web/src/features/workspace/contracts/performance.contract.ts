/**
 * Authoritative Performance & Latency Budget Contract (WX-806).
 *
 * Establishes SLA latency budgets, pagination boundaries, request deduplication,
 * and mixed read/write workload scalability standards.
 */

export interface LatencyBudgetDescriptor {
  readonly operation: string;
  readonly budgetMs: number;
  readonly category: 'READ_PATH' | 'WRITE_SUBMISSION' | 'SEARCH';
}

/**
 * Authoritative P0 Application Latency Budgets (WX-806).
 */
export const PERFORMANCE_LATENCY_BUDGETS: readonly LatencyBudgetDescriptor[] = [
  { operation: 'LIGHTWEIGHT_API', budgetMs: 300, category: 'READ_PATH' },
  { operation: 'WORKSPACE_OVERVIEW', budgetMs: 750, category: 'READ_PATH' },
  { operation: 'TIMELINE_FIRST_PAGE', budgetMs: 750, category: 'READ_PATH' },
  { operation: 'SNAPSHOT_LIST', budgetMs: 500, category: 'READ_PATH' },
  { operation: 'SNAPSHOT_DETAIL', budgetMs: 500, category: 'READ_PATH' },
  { operation: 'FINDINGS_LIST', budgetMs: 500, category: 'READ_PATH' },
  { operation: 'GLOBAL_SEARCH', budgetMs: 750, category: 'SEARCH' },
  { operation: 'DOMAIN_CREATION', budgetMs: 500, category: 'WRITE_SUBMISSION' },
  { operation: 'UNDERSTANDING_SUBMISSION', budgetMs: 500, category: 'WRITE_SUBMISSION' },
];

/**
 * Validates whether a measured latency adheres to the authoritative budget.
 */
export function validateLatencyBudget(
  operation: string,
  measuredMs: number
): {
  readonly isWithinBudget: boolean;
  readonly budgetMs: number;
  readonly overageMs?: number;
} {
  const budget = PERFORMANCE_LATENCY_BUDGETS.find((b) => b.operation === operation);
  const targetBudgetMs = budget ? budget.budgetMs : 500;

  const isWithinBudget = measuredMs <= targetBudgetMs;

  return {
    isWithinBudget,
    budgetMs: targetBudgetMs,
    overageMs: isWithinBudget ? undefined : measuredMs - targetBudgetMs,
  };
}

/**
 * Enforces bounded pagination limits on historical collection queries.
 *
 * Hard invariant: Prevents unbounded scans that load entire datasets into memory.
 */
export function validatePaginationBounds(params: {
  readonly requestedLimit?: number;
  readonly defaultLimit?: number;
  readonly maxAllowedLimit?: number;
}): {
  readonly effectiveLimit: number;
  readonly isBounded: boolean;
} {
  const defaultLimit = params.defaultLimit ?? 20;
  const maxAllowedLimit = params.maxAllowedLimit ?? 100;
  const requested = params.requestedLimit ?? defaultLimit;

  if (requested <= 0) {
    return {
      effectiveLimit: defaultLimit,
      isBounded: true,
    };
  }

  const effectiveLimit = Math.min(requested, maxAllowedLimit);

  return {
    effectiveLimit,
    isBounded: effectiveLimit <= maxAllowedLimit,
  };
}

/**
 * Ten Certified P0 Performance Invariants (WX-806).
 */
export const PERFORMANCE_HARD_INVARIANTS = [
  'NO_UNBOUNDED_HISTORICAL_QUERY',
  'NO_UNBOUNDED_API_PAYLOAD',
  'NO_N_PLUS_ONE_CRITICAL_QUERY',
  'NO_DATABASE_POOL_EXHAUSTION_UNDER_TARGET_LOAD',
  'NO_DUPLICATE_CRITICAL_REQUESTS',
  'NO_SYNCHRONOUS_LONG_RUNNING_DISCOVERY',
  'NO_WORKER_STARVATION',
  'NO_HISTORICAL_DATA_LOSS_FOR_PERFORMANCE',
  'NO_CROSS_TENANT_CACHE_POLLUTION',
  'NO_CRITICAL_LATENCY_BUDGET_REGRESSION',
] as const;
