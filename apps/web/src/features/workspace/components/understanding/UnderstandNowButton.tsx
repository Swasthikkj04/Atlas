import React, { useState, useCallback, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Icon } from '../../../../components/icons';
import {
  useTriggerUnderstanding,
  useDomainUnderstandingJobs,
  useUnderstandingJob,
  reconcileWorkspaceUnderstanding,
} from '../../../../hooks/queries/useUnderstanding';
import {
  resolveUnderstandingLifecycle,
  findActiveJob,
} from '../../contracts/understanding-convergence.contract';
import type { UnderstandNowButtonProps } from './UnderstandNowButton.types';

/**
 * Authoritative Manual Understanding Control & Convergence (WX-905 & WX-906).
 *
 * Implements the first-class "Understand now" action and asynchronous convergence:
 * - Operates strictly on server-authoritative domainId and job lifecycle status.
 * - HTTP 202 Accepted triggers server job observation without premature refetches.
 * - Polls active job until COMPLETED or FAILED, then reconverges all Workspace intelligence.
 * - Restores running state across page reloads and domain context switches.
 * - Distinguishes request rejection from background worker failure.
 * - No fake progress percentages, no scanner theater, accessible polite announcements.
 */
export const UnderstandNowButton: React.FC<UnderstandNowButtonProps> = ({
  domainId,
  domainName,
  onCompleted,
  className = '',
  ...rest
}) => {
  const queryClient = useQueryClient();
  const triggerMutation = useTriggerUnderstanding();
  const domainJobsQuery = useDomainUnderstandingJobs(domainId);

  const [prevDomainId, setPrevDomainId] = useState(domainId);
  const [localJobId, setLocalJobId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');

  // Reset local state when active domain changes to prevent cross-domain state leak
  if (prevDomainId !== domainId) {
    setPrevDomainId(domainId);
    setLocalJobId(null);
    setAnnouncement('');
  }

  // Authoritatively discover active job from backend list or local trigger
  const activeDomainJob = findActiveJob(domainJobsQuery.data);
  const activeJobId = localJobId || activeDomainJob?.id || null;

  // Observe active job state if active ID is present
  const jobQuery = useUnderstandingJob(activeJobId);
  const effectiveJob = jobQuery.data || activeDomainJob || null;

  // Evaluate authoritative lifecycle phase
  const lifecycle = resolveUnderstandingLifecycle({
    isTriggerPending: triggerMutation.isPending,
    triggerError: triggerMutation.error,
    activeJob: effectiveJob,
    domainName,
  });

  const completedJobId =
    effectiveJob && effectiveJob.status === 'COMPLETED' ? effectiveJob.id : null;

  // Reconverge Workspace intelligence surfaces upon verified job completion
  useEffect(() => {
    if (completedJobId) {
      reconcileWorkspaceUnderstanding(queryClient, domainId);
      onCompleted?.();
    }
  }, [completedJobId, domainId, queryClient, onCompleted]);

  const handleTrigger = useCallback(() => {
    if (!domainId || !lifecycle.canTrigger) return;

    triggerMutation.reset();
    setAnnouncement(`Understanding started for ${domainName}.`);

    triggerMutation.mutate(domainId, {
      onSuccess: (data) => {
        const jobId = data.jobId || data.id;
        if (jobId) {
          setLocalJobId(jobId);
        }
      },
      onError: (err) => {
        const message = err.message || "Understanding request couldn't be initiated.";
        setAnnouncement(`Understanding request failed for ${domainName}. Try again.`);
        console.error('Understanding trigger error:', message);
      },
    });
  }, [domainId, domainName, lifecycle.canTrigger, triggerMutation]);

  // Failure State (Preserves last trusted state while providing retry affordance - WX-1018)
  if (lifecycle.phase === 'FAILED' || lifecycle.phase === 'REQUEST_ERROR') {
    return (
      <div className={`inline-flex flex-wrap items-center gap-2.5 ${className}`} {...rest}>
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E9B3B9] bg-[#FDEBEC] text-[#A93442] text-xs font-mono">
          <Icon icon={AlertCircle} size="small" />
          <span className="truncate max-w-[220px] sm:max-w-none">Previous state retained</span>
        </div>

        <button
          type="button"
          onClick={handleTrigger}
          disabled={!lifecycle.canTrigger}
          aria-label={`Retry infrastructure understanding for ${domainName}`}
          className="inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2.5 rounded-xl bg-[#171816] text-[#FFFFFF] border border-[#171816] hover:bg-[#252724] hover:border-[#252724] active:bg-[#0F100F] active:border-[#0F100F] text-sm font-medium transition-all duration-150 ease-out cursor-pointer focus-ring select-none shadow-[0_2px_5px_rgba(16,24,20,0.10)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon={RefreshCw} size="small" className={lifecycle.isProcessing ? 'animate-spin' : ''} />
          <span>Try again</span>
        </button>

        {/* Screen Reader Live Region */}
        <span className="sr-only" aria-live="polite">
          {announcement || lifecycle.announcement}
        </span>
      </div>
    );
  }

  // Idle & Processing (Accepted / Running) States
  return (
    <div className={`inline-flex items-center ${className}`} {...rest}>
      <button
        type="button"
        onClick={handleTrigger}
        disabled={!lifecycle.canTrigger}
        aria-busy={lifecycle.isProcessing}
        aria-label={
          lifecycle.isProcessing
            ? `Understanding infrastructure for ${domainName} in progress`
            : `Understand now for ${domainName}`
        }
        className={`inline-flex items-center justify-center gap-2.5 min-h-[42px] px-5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 ease-out select-none focus-ring ${
          lifecycle.isProcessing
            ? 'bg-[#FAFAF8] dark:bg-surface-secondary text-[#5F625F] dark:text-muted-foreground border-[#E7E7E3] dark:border-border cursor-not-allowed opacity-80'
            : 'bg-[#171816] text-[#FFFFFF] border border-[#171816] hover:bg-[#252724] hover:border-[#252724] active:bg-[#0F100F] active:border-[#0F100F] cursor-pointer shadow-[0_2px_5px_rgba(16,24,20,0.10)]'
        }`}
      >
        <Icon
          icon={lifecycle.isProcessing ? RefreshCw : Sparkles}
          size="small"
          className={`flex-shrink-0 transition-transform ${
            lifecycle.isProcessing
              ? 'animate-spin text-[#5F625F] dark:text-muted-foreground'
              : 'text-[#FFFFFF] group-hover:scale-105'
          }`}
        />
        <span>{lifecycle.buttonLabel}</span>
      </button>

      {/* Screen Reader Live Region */}
      <span className="sr-only" aria-live="polite">
        {announcement || lifecycle.announcement}
      </span>
    </div>
  );
};

UnderstandNowButton.displayName = 'UnderstandNowButton';
