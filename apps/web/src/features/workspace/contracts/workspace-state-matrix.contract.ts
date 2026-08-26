/**
 * Authoritative Workspace State Matrix Contract (WX-701).
 *
 * Establishes the canonical 7-tier semantic state vocabulary across all Workspace experiences.
 * INVARIANT: EMPTY ≠ ERROR, PARTIAL ≠ ERROR, UNAVAILABLE ≠ ERROR, QUIET ≠ EMPTY.
 */

export type WorkspaceSemanticState =
  | 'LOADING'
  | 'READY'
  | 'QUIET'
  | 'EMPTY'
  | 'PARTIAL'
  | 'UNAVAILABLE'
  | 'ERROR';

export type WorkspaceExperienceScope =
  | 'current'
  | 'overview'
  | 'investigation'
  | 'evidence'
  | 'memory'
  | 'search'
  | 'domain_switching';

/**
 * State applicability by Workspace experience.
 */
export const STATE_EXPERIENCE_APPLICABILITY: Record<
  WorkspaceExperienceScope,
  readonly WorkspaceSemanticState[]
> = {
  current: ['LOADING', 'READY', 'QUIET', 'EMPTY', 'PARTIAL', 'UNAVAILABLE', 'ERROR'],
  overview: ['LOADING', 'READY', 'QUIET', 'EMPTY', 'PARTIAL', 'UNAVAILABLE', 'ERROR'],
  investigation: ['LOADING', 'READY', 'QUIET', 'EMPTY', 'PARTIAL', 'UNAVAILABLE', 'ERROR'],
  evidence: ['LOADING', 'READY', 'EMPTY', 'PARTIAL', 'UNAVAILABLE', 'ERROR'],
  memory: ['LOADING', 'READY', 'QUIET', 'EMPTY', 'PARTIAL', 'UNAVAILABLE', 'ERROR'],
  search: ['LOADING', 'READY', 'EMPTY', 'PARTIAL', 'UNAVAILABLE', 'ERROR'],
  domain_switching: ['LOADING', 'READY', 'PARTIAL', 'UNAVAILABLE', 'ERROR'],
};

/**
 * Semantic descriptions defining the authoritative meaning of each state.
 */
export const WORKSPACE_STATE_DESCRIPTIONS: Record<
  WorkspaceSemanticState,
  { readonly meaning: string; readonly guidance: string }
> = {
  LOADING: {
    meaning: 'Authoritative data is currently being retrieved from backend telemetry.',
    guidance: 'Display calm, contextual loading indicator. Never render premature empty states while pending.',
  },
  READY: {
    meaning: 'Expected intelligence is fully available with complete signal coverage.',
    guidance: 'Present authoritative intelligence directly without synthetic confirmation noise.',
  },
  QUIET: {
    meaning: 'Infrastructure was observed and verified to have remained stable with no meaningful changes or active risks.',
    guidance: 'Affirm stability clearly. Distinct from EMPTY because observation took place.',
  },
  EMPTY: {
    meaning: 'No established infrastructure baseline or historical telemetry exists yet for this target.',
    guidance: 'Explain absence calmly. Expected for new registrations; must never look like a system failure.',
  },
  PARTIAL: {
    meaning: 'Some authoritative information exists, but coverage is incomplete across sub-systems.',
    guidance: 'Display verified facts prominently while calmly explaining unavailable sub-signals.',
  },
  UNAVAILABLE: {
    meaning: 'Information cannot legitimately be accessed or provided in the current tenant/domain context.',
    guidance: 'Render restrained security fallback. Never leak foreign resource existence or metadata.',
  },
  ERROR: {
    meaning: 'A network, server, or unexpected operational failure prevented retrieval from completing.',
    guidance: 'Present clean error message with deterministic retry action.',
  },
};

/**
 * Deterministic State Precedence Ranking.
 * 1 (Highest priority) -> 7 (Lowest priority)
 */
export const STATE_PRECEDENCE_ORDER: readonly WorkspaceSemanticState[] = [
  'UNAVAILABLE',
  'ERROR',
  'LOADING',
  'EMPTY',
  'PARTIAL',
  'QUIET',
  'READY',
] as const;

export interface StateResolutionParams<T = unknown> {
  readonly scope: WorkspaceExperienceScope;
  readonly isLoading?: boolean;
  readonly isError?: boolean;
  readonly error?: unknown;
  readonly data?: T | null;
  readonly isDomainMismatch?: boolean;
  readonly hasPartialCoverage?: boolean;
  readonly isQuiet?: boolean;
  readonly isEmpty?: boolean;
}

/**
 * Pure, deterministic semantic state resolver.
 */
export function resolveWorkspaceSemanticState<T = unknown>(
  params: StateResolutionParams<T>
): WorkspaceSemanticState {
  const {
    isLoading = false,
    isError = false,
    isDomainMismatch = false,
    hasPartialCoverage = false,
    isQuiet = false,
    isEmpty = false,
    data = null,
  } = params;

  // 1. Unauthorized / Domain Mismatch -> UNAVAILABLE (P0 Security Boundary)
  if (isDomainMismatch) {
    return 'UNAVAILABLE';
  }

  // 2. Request Failure -> ERROR
  if (isError) {
    return 'ERROR';
  }

  // 3. Request In-Flight -> LOADING
  if (isLoading) {
    return 'LOADING';
  }

  // 4. Explicit Empty Request -> EMPTY
  if (isEmpty) {
    return 'EMPTY';
  }

  // 5. Incomplete Sub-Signal Coverage -> PARTIAL
  if (hasPartialCoverage) {
    return 'PARTIAL';
  }

  // 6. Verified Stable with Zero Changes / Zero Active Risks -> QUIET
  if (isQuiet) {
    return 'QUIET';
  }

  // 7. Absence of data -> EMPTY
  if (data === null || data === undefined) {
    return 'EMPTY';
  }

  if (Array.isArray(data) && data.length === 0) {
    return 'EMPTY';
  }

  // 8. Complete Intelligence -> READY
  return 'READY';
}

/**
 * Resolves semantic state for Current Intelligence experience.
 */
export function resolveCurrentIntelligenceSemanticState(params: {
  isLoading: boolean;
  isError: boolean;
  hasFindings: boolean;
  isDomainMismatch?: boolean;
}): WorkspaceSemanticState {
  return resolveWorkspaceSemanticState({
    scope: 'current',
    isLoading: params.isLoading,
    isError: params.isError,
    isDomainMismatch: params.isDomainMismatch,
    data: params.hasFindings ? true : null,
    isQuiet: !params.hasFindings && !params.isLoading && !params.isError,
  });
}

/**
 * Resolves semantic state for Infrastructure Overview experience.
 */
export function resolveOverviewSemanticState(params: {
  isLoading: boolean;
  isError: boolean;
  hasDns: boolean;
  hasTls: boolean;
  hasTech: boolean;
  isDomainMismatch?: boolean;
}): WorkspaceSemanticState {
  const signalCount = [params.hasDns, params.hasTls, params.hasTech].filter(Boolean).length;
  const isPartial = signalCount > 0 && signalCount < 3;
  const isEmpty = signalCount === 0;

  return resolveWorkspaceSemanticState({
    scope: 'overview',
    isLoading: params.isLoading,
    isError: params.isError,
    isDomainMismatch: params.isDomainMismatch,
    hasPartialCoverage: isPartial,
    isEmpty,
    data: isEmpty ? null : true,
  });
}

/**
 * Resolves semantic state for Investigation experience.
 */
export function resolveInvestigationSemanticState(params: {
  isLoading: boolean;
  isError: boolean;
  resourceFound: boolean;
  isDomainMismatch?: boolean;
}): WorkspaceSemanticState {
  return resolveWorkspaceSemanticState({
    scope: 'investigation',
    isLoading: params.isLoading,
    isError: params.isError,
    isDomainMismatch: params.isDomainMismatch,
    data: params.resourceFound ? true : null,
    isEmpty: !params.resourceFound,
  });
}

/**
 * Resolves semantic state for Infrastructure Memory experience.
 */
export function resolveMemorySemanticState(params: {
  isLoading: boolean;
  isError: boolean;
  eventCount: number;
  isDomainMismatch?: boolean;
}): WorkspaceSemanticState {
  const isQuiet = params.eventCount === 0;

  return resolveWorkspaceSemanticState({
    scope: 'memory',
    isLoading: params.isLoading,
    isError: params.isError,
    isDomainMismatch: params.isDomainMismatch,
    isQuiet,
    data: params.eventCount > 0 ? true : 'quiet',
  });
}
