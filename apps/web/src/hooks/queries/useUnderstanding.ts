import { useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { understandingService } from '../../services/understanding.service.ts';
import { queryKeys } from './query-keys.ts';
import type {
  UnderstandingJobDto,
  TriggerUnderstandingJobResponseDto,
} from '../../types/api';

/**
 * Authoritatively refetches and reconciles all Workspace intelligence surfaces
 * once an understanding job has reached COMPLETED state on the backend (WX-906 / WX-912 / WX-1015).
 *
 * Workspace Reconciler Architecture:
 *                    UNDERSTANDING
 *                          │
 *                          ▼
 *                 VERIFIED SNAPSHOT
 *                          │
 *                          ▼
 *             ┌────────────────────────┐
 *             │  WORKSPACE RECONCILER  │
 *             └────────────────────────┘
 *                          │
 *        ┌─────────────────┼─────────────────┐
 *        ▼                 ▼                 ▼
 *     Current           Historical       Derived
 *      State             Memory        Intelligence
 *        │                 │                 │
 *        ▼                 ▼                 ▼
 *    Overview           Memory            Changes
 *    Findings                         Infrastructure
 *                                         Brief
 *                                        Evidence
 *
 * Guaranteed convergence across all Workspace surfaces:
 * 1. Overview (Executive Brief, Posture, Primary/Secondary Stories, Confidence, Last Understood)
 * 2. Findings (Active findings list & infrastructure findings section)
 * 3. Changes (Chronological timeline of events & diffs)
 * 4. Infrastructure (Authoritative 8-category inventory & deep component model)
 * 5. Memory (Historical snapshot chain & infrastructure lineage)
 * 6. Historical Comparison (Cross-snapshot diff availability)
 */
export function reconcileWorkspaceUnderstanding(
  queryClient: QueryClient,
  domainId: string
): void {
  // Domain identity & metadata & infrastructure overview
  queryClient.invalidateQueries({
    queryKey: queryKeys.domains.all(),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.domains.detail(domainId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.domains.overview(domainId),
  });

  // Overview surface intelligence
  queryClient.invalidateQueries({
    queryKey: queryKeys.workspace.overview(domainId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.briefs.byDomain(domainId),
  });
  queryClient.invalidateQueries({
    queryKey: ['briefs'],
  });

  // Findings surface & Infrastructure findings
  queryClient.invalidateQueries({
    queryKey: queryKeys.findings.byDomain(domainId),
  });
  queryClient.invalidateQueries({
    queryKey: ['findings'],
  });

  // Changes surface (Timeline events)
  queryClient.invalidateQueries({
    queryKey: queryKeys.timeline.byDomain(domainId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.timeline.list(),
  });
  queryClient.invalidateQueries({
    queryKey: ['timeline'],
  });

  // Infrastructure & Memory surfaces (Snapshots and memory lineage)
  queryClient.invalidateQueries({
    queryKey: queryKeys.snapshots.byDomain(domainId),
  });
  queryClient.invalidateQueries({
    queryKey: ['snapshots'],
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.memory.byDomain(domainId),
  });
  queryClient.invalidateQueries({
    queryKey: ['memory'],
  });

  // Domain understanding jobs
  queryClient.invalidateQueries({
    queryKey: queryKeys.understanding.domainJobs(domainId),
  });
  queryClient.invalidateQueries({
    queryKey: ['understanding'],
  });
}

/**
 * Observes a specific understanding job by ID with bounded polling while active.
 */
export function useUnderstandingJob(jobId: string | null | undefined) {
  return useQuery<UnderstandingJobDto>({
    queryKey: queryKeys.understanding.job(jobId || ''),
    queryFn: ({ signal }) => understandingService.getJobStatus(jobId!, signal),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'RUNNING' || status === 'PENDING') {
        return 2500; // Poll every 2.5s while active
      }
      return false;
    },
  });
}

/**
 * Retrieves historical and active understanding jobs for a domain.
 * Automatically polls while any job remains RUNNING or PENDING.
 */
export function useDomainUnderstandingJobs(domainId: string | null | undefined) {
  return useQuery<readonly UnderstandingJobDto[]>({
    queryKey: queryKeys.understanding.domainJobs(domainId || ''),
    queryFn: ({ signal }) => understandingService.getJobsForDomain(domainId!, signal),
    enabled: Boolean(domainId),
    refetchInterval: (query) => {
      const jobs = query.state.data;
      const hasActive = jobs?.some(
        (j) => j.status === 'RUNNING' || j.status === 'PENDING'
      );
      if (hasActive) {
        return 1500; // Poll every 1.5s while an active job exists
      }
      return 6000; // Poll every 6s otherwise so background worker completions are picked up
    },
  });
}

/**
 * Triggers asynchronous manual understanding analysis on the backend (202 Accepted).
 */
export function useTriggerUnderstanding() {
  const queryClient = useQueryClient();

  return useMutation<TriggerUnderstandingJobResponseDto, Error, string>({
    mutationFn: (domainId) => understandingService.triggerUnderstandingJob(domainId),
    onSuccess: (data, domainId) => {
      const targetDomainId = data.domainId || domainId;
      queryClient.invalidateQueries({
        queryKey: queryKeys.understanding.domainJobs(targetDomainId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.understanding.domainJobs(domainId),
      });
      queryClient.invalidateQueries({
        queryKey: ['understanding'],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.domains.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.domains.detail(domainId),
      });
    },
  });
}

export interface UseWorkspaceUnderstandingConvergenceOptions {
  readonly domainId: string | null | undefined;
  readonly onConverged?: (job: UnderstandingJobDto) => void;
}

/**
 * Unified Workspace Understanding Synchronization & Truth Convergence Coordinator (WX-912).
 *
 * Implements the single canonical synchronization mechanism for the entire Workspace:
 * - Scoped strictly to the active domain context (domainId).
 * - Unifies manual and automatic understanding convergence into one coherent pathway.
 * - Automatically detects job completion and invalidates all 5 Workspace surfaces.
 * - Restores state across browser reloads, background tab updates, and navigation.
 * - Preserves zero-scanning theater and honest temporal lineage.
 */
export function useWorkspaceUnderstandingConvergence({
  domainId,
  onConverged,
}: UseWorkspaceUnderstandingConvergenceOptions) {
  const queryClient = useQueryClient();
  const domainJobsQuery = useDomainUnderstandingJobs(domainId);

  const prevDomainIdRef = useRef(domainId);
  const lastReconciledJobIdRef = useRef<string | null>(null);
  const prevRunningJobIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!domainId) return;

    // Reset tracking state on domain context switch to prevent cross-domain leak
    if (prevDomainIdRef.current !== domainId) {
      prevDomainIdRef.current = domainId;
      lastReconciledJobIdRef.current = null;
      prevRunningJobIdRef.current = null;
    }

    const jobs = domainJobsQuery.data;
    if (!jobs || jobs.length === 0) return;

    const currentlyActiveJob = jobs.find(
      (j) => j.status === 'RUNNING' || j.status === 'PENDING'
    );
    const sortedJobs = [...jobs].sort(
      (a, b) =>
        new Date(b.completedAt || b.startedAt || 0).getTime() -
        new Date(a.completedAt || a.startedAt || 0).getTime()
    );
    const latestJob = sortedJobs[0];

    if (currentlyActiveJob) {
      prevRunningJobIdRef.current = currentlyActiveJob.id;
    } else if (prevRunningJobIdRef.current) {
      // Transition from running -> completed / failed
      if (latestJob && latestJob.status === 'COMPLETED') {
        if (latestJob.id !== lastReconciledJobIdRef.current) {
          lastReconciledJobIdRef.current = latestJob.id;
          prevRunningJobIdRef.current = null;
          reconcileWorkspaceUnderstanding(queryClient, domainId);
          onConverged?.(latestJob);
        }
      } else {
        prevRunningJobIdRef.current = null;
      }
    } else if (latestJob && latestJob.status === 'COMPLETED') {
      // Automatic background understanding detection (new completed job arrived)
      if (
        lastReconciledJobIdRef.current !== null &&
        latestJob.id !== lastReconciledJobIdRef.current
      ) {
        lastReconciledJobIdRef.current = latestJob.id;
        reconcileWorkspaceUnderstanding(queryClient, domainId);
        onConverged?.(latestJob);
      } else if (lastReconciledJobIdRef.current === null) {
        // Initial baseline mount
        lastReconciledJobIdRef.current = latestJob.id;
      }
    }
  }, [domainId, domainJobsQuery.data, queryClient, onConverged]);

  const activeJob = domainJobsQuery.data?.find(
    (j) => j.status === 'RUNNING' || j.status === 'PENDING'
  ) || null;

  return {
    activeJob,
    isUnderstandingActive: Boolean(activeJob),
    domainJobs: domainJobsQuery.data ?? [],
    reconcile: () => domainId && reconcileWorkspaceUnderstanding(queryClient, domainId),
  };
}

/**
 * Authoritative WX-1015 Workspace Reconciler boundary.
 */
export const reconcileWorkspaceAfterUnderstanding = reconcileWorkspaceUnderstanding;
