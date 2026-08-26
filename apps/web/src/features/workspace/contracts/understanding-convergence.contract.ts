import type { JobStatus, UnderstandingJobDto } from '../../../types/api/understanding.dto';

/**
 * WX-906: Authoritative Understanding Job State & Workspace Convergence Contract.
 *
 * Establishes canonical lifecycle state transitions, polling rules, error boundaries,
 * and workspace cache reconciliation invariants without premature refetches.
 */

export type UnderstandingLifecyclePhase =
  | 'IDLE'
  | 'ACCEPTED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REQUEST_ERROR';

export interface UnderstandingConvergenceState {
  readonly phase: UnderstandingLifecyclePhase;
  readonly activeJobId: string | null;
  readonly isProcessing: boolean;
  readonly canTrigger: boolean;
  readonly buttonLabel: string;
  readonly errorMessage: string | null;
  readonly errorType: 'REQUEST_ERROR' | 'WORKER_ERROR' | null;
  readonly announcement: string | null;
}

export interface ResolveLifecycleParams {
  readonly isTriggerPending: boolean;
  readonly triggerError?: Error | null;
  readonly activeJob?: UnderstandingJobDto | null;
  readonly domainName: string;
}

/**
 * Pure resolver determining the authoritative understanding lifecycle phase and UI presentation.
 */
export function resolveUnderstandingLifecycle(
  params: ResolveLifecycleParams
): UnderstandingConvergenceState {
  const { isTriggerPending, triggerError, activeJob, domainName } = params;

  // 1. Initial trigger request failure (Network, 4xx, 5xx on POST /understand)
  if (triggerError) {
    return {
      phase: 'REQUEST_ERROR',
      activeJobId: null,
      isProcessing: false,
      canTrigger: true,
      buttonLabel: 'Try again',
      errorMessage: triggerError.message || "Understanding request couldn't be initiated.",
      errorType: 'REQUEST_ERROR',
      announcement: `Understanding request failed for ${domainName}. Try again.`,
    };
  }

  // 2. Trigger in-flight (HTTP POST pending before 202 Accepted response)
  if (isTriggerPending) {
    return {
      phase: 'ACCEPTED',
      activeJobId: null,
      isProcessing: true,
      canTrigger: false,
      buttonLabel: 'Understanding…',
      errorMessage: null,
      errorType: null,
      announcement: `Understanding started for ${domainName}.`,
    };
  }

  // 3. Worker Execution: RUNNING or PENDING
  if (activeJob && (activeJob.status === 'RUNNING' || activeJob.status === 'PENDING')) {
    return {
      phase: 'RUNNING',
      activeJobId: activeJob.id,
      isProcessing: true,
      canTrigger: false,
      buttonLabel: 'Understanding…',
      errorMessage: null,
      errorType: null,
      announcement: null, // Do not repeat announcements on active polling ticks
    };
  }

  // 4. Worker Execution: FAILED
  if (activeJob && activeJob.status === 'FAILED') {
    return {
      phase: 'FAILED',
      activeJobId: activeJob.id,
      isProcessing: false,
      canTrigger: true,
      buttonLabel: 'Try again',
      errorMessage: activeJob.error || "Understanding couldn't be completed.",
      errorType: 'WORKER_ERROR',
      announcement: `Understanding failed for ${domainName}. Try again.`,
    };
  }

  // 5. Worker Execution: COMPLETED
  if (activeJob && activeJob.status === 'COMPLETED') {
    return {
      phase: 'COMPLETED',
      activeJobId: null,
      isProcessing: false,
      canTrigger: true,
      buttonLabel: 'Understand now',
      errorMessage: null,
      errorType: null,
      announcement: `Understanding completed. Workspace updated for ${domainName}.`,
    };
  }

  // 6. Default IDLE State
  return {
    phase: 'IDLE',
    activeJobId: null,
    isProcessing: false,
    canTrigger: true,
    buttonLabel: 'Understand now',
    errorMessage: null,
    errorType: null,
    announcement: null,
  };
}

/**
 * Determines whether active job polling should be enabled.
 */
export function shouldPollJob(status?: JobStatus | null): boolean {
  return status === 'PENDING' || status === 'RUNNING';
}

/**
 * Extracts the latest active job from a list of domain jobs.
 */
export function findActiveJob(
  jobs?: readonly UnderstandingJobDto[] | null
): UnderstandingJobDto | null {
  if (!jobs || jobs.length === 0) return null;
  return (
    jobs.find((j) => j.status === 'RUNNING' || j.status === 'PENDING') || null
  );
}

export interface EvaluateConvergenceParams {
  readonly domainId: string;
  readonly lastReconciledJobId: string | null;
  readonly prevRunningJobId: string | null;
  readonly jobs?: readonly UnderstandingJobDto[] | null;
}

export interface ConvergenceDecision {
  readonly shouldReconcile: boolean;
  readonly newReconciledJobId: string | null;
  readonly reason: 'MANUAL_COMPLETED' | 'AUTOMATIC_COMPLETED' | 'NO_CHANGE';
}

/**
 * Pure resolver evaluating whether a domain's Workspace intelligence should reconverge (WX-912).
 * Handles both manual and automatic worker completion events uniformly.
 */
export function evaluateConvergenceDecision(
  params: EvaluateConvergenceParams
): ConvergenceDecision {
  const { lastReconciledJobId, prevRunningJobId, jobs } = params;

  if (!jobs || jobs.length === 0) {
    return { shouldReconcile: false, newReconciledJobId: lastReconciledJobId, reason: 'NO_CHANGE' };
  }

  const currentlyActive = findActiveJob(jobs);
  const latestJob = jobs[0];

  // Case 1: Job was previously running, now finished with COMPLETED status
  if (prevRunningJobId && !currentlyActive) {
    if (latestJob && latestJob.status === 'COMPLETED' && latestJob.id !== lastReconciledJobId) {
      return {
        shouldReconcile: true,
        newReconciledJobId: latestJob.id,
        reason: 'MANUAL_COMPLETED',
      };
    }
  }

  // Case 2: Automatic background understanding completed
  if (latestJob && latestJob.status === 'COMPLETED') {
    if (lastReconciledJobId !== null && latestJob.id !== lastReconciledJobId) {
      return {
        shouldReconcile: true,
        newReconciledJobId: latestJob.id,
        reason: 'AUTOMATIC_COMPLETED',
      };
    }
  }

  return {
    shouldReconcile: false,
    newReconciledJobId: lastReconciledJobId || (latestJob?.status === 'COMPLETED' ? latestJob.id : null),
    reason: 'NO_CHANGE',
  };
}

export const WORKSPACE_SYNCHRONIZATION_INVARIANTS = {
  ONE_DOMAIN_ONE_AUTHORITATIVE_TRUTH:
    'One domain + one completed understanding = one authoritative Workspace state across Overview, Findings, Changes, Infrastructure, and Memory.',
  UNIFIED_MANUAL_AND_AUTOMATIC_CONVERGENCE:
    'Manual and automatic understanding share the exact same convergence path and authoritative state invalidation.',
  DOMAIN_ISOLATED_SYNCHRONIZATION:
    'Understanding synchronization is strictly scoped by domainId; background completions on other domains never contaminate the active domain view.',
  NO_INDEPENDENT_PAGE_REGISTRY:
    'No individual Workspace page maintains an independent understanding registry; all derive from backend-authoritative snapshot state.',
} as const;

/**
 * Authoritative 4-Phase Understanding State Model (WX-915).
 * Distinguishes: NO_UNDERSTANDING -> UNDERSTANDING -> UNDERSTOOD -> FAILED.
 */
export type AuthoritativeUnderstandingState =
  | 'NO_UNDERSTANDING'
  | 'UNDERSTANDING'
  | 'UNDERSTOOD'
  | 'FAILED';

export interface ResolveAuthoritativeUnderstandingStateParams {
  readonly isTriggerPending?: boolean;
  readonly triggerError?: Error | null;
  readonly activeJob?: UnderstandingJobDto | null;
  readonly latestJob?: UnderstandingJobDto | null;
  readonly latestSnapshot?: unknown | null;
  readonly totalSnapshots?: number;
  readonly hasInfrastructure?: boolean;
}

/**
 * Authoritatively resolves the domain understanding state across all Workspace surfaces (WX-915).
 */
export function resolveAuthoritativeUnderstandingState(
  params: ResolveAuthoritativeUnderstandingStateParams
): AuthoritativeUnderstandingState {
  const {
    isTriggerPending,
    triggerError,
    activeJob,
    latestJob,
    latestSnapshot,
    totalSnapshots = 0,
    hasInfrastructure = false,
  } = params;

  // 1. In-flight trigger mutation or executing worker job -> UNDERSTANDING
  if (
    isTriggerPending ||
    (activeJob && (activeJob.status === 'RUNNING' || activeJob.status === 'PENDING'))
  ) {
    return 'UNDERSTANDING';
  }

  // 2. Trigger error -> FAILED
  if (triggerError) {
    return 'FAILED';
  }

  // 3. Worker execution failure without existing snapshot/infrastructure -> FAILED
  if (
    latestJob &&
    latestJob.status === 'FAILED' &&
    !latestSnapshot &&
    totalSnapshots === 0 &&
    !hasInfrastructure
  ) {
    return 'FAILED';
  }

  // 4. Completed snapshot or completed job or verified infrastructure -> UNDERSTOOD
  if (
    Boolean(latestSnapshot) ||
    totalSnapshots > 0 ||
    hasInfrastructure ||
    (latestJob && latestJob.status === 'COMPLETED')
  ) {
    return 'UNDERSTOOD';
  }

  // 5. Default -> NO_UNDERSTANDING
  return 'NO_UNDERSTANDING';
}

export const WORKSPACE_CONVERGENCE_HARD_INVARIANTS = {
  ONE_DOMAIN_ONE_CURRENT_UNDERSTANDING:
    'A single domain understanding operation must produce one authoritative understanding state across the entire Workspace.',
  NO_FRONTEND_ONLY_UNDERSTOOD_FLAGS:
    'No frontend-only understood flags or client-simulated completion status.',
  NO_INDEPENDENT_PER_PAGE_UNDERSTANDING_STATE:
    'No independent per-page understanding state; all surfaces converge on the single authoritative domain understanding.',
  NO_STALE_INFRASTRUCTURE_CACHE:
    'No stale infrastructure cache survives a completed understanding.',
  NO_PAGE_SPECIFIC_JOB_INTERPRETATION:
    'No page-specific interpretation of job completion; unified convergence path across all surfaces.',
  NO_MIXED_SNAPSHOTS:
    'Workspace surfaces never mix snapshots from different understanding runs.',
  NO_INFRASTRUCTURE_NOT_UNDERSTOOD_AFTER_SUCCESS:
    'Infrastructure not understood state is prohibited after a successful understanding completion.',
} as const;

