import React, { useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import {
  useDomainUnderstandingJobs,
  useUnderstandingJob,
  useTriggerUnderstanding,
} from '../../../../hooks/queries/useUnderstanding';
import { findActiveJob } from '../../contracts/understanding-convergence.contract';
import { UnderstandingProgressStepper } from './UnderstandingProgressStepper';
import type { ActiveUnderstandingBannerProps } from './ActiveUnderstandingBanner.types';

/**
 * Authoritative Active Understanding Experience Banner (WX-907).
 *
 * Provides clear cognitive feedback when Nebula is actively understanding the selected domain:
 * - Structural Treatment: Spacious, restrained state indicator above Current Intelligence.
 * - Temporal Distinction: Honestly indicates that previous understanding remains available while running.
 * - Truthful State: Driven directly by server job status without scanning theater or fake progress bars.
 * - Error Recovery: Exposes truthful worker failures with direct retry action.
 */
export const ActiveUnderstandingBanner: React.FC<ActiveUnderstandingBannerProps> = ({
  domainId,
  domainName,
  onRetry,
  className = '',
  ...rest
}) => {
  const domainJobsQuery = useDomainUnderstandingJobs(domainId);
  const triggerMutation = useTriggerUnderstanding();

  // Find authoritative active or latest job
  const activeJob = findActiveJob(domainJobsQuery.data);
  const latestJob = domainJobsQuery.data && domainJobsQuery.data.length > 0
    ? domainJobsQuery.data[0]
    : null;

  const observedJobId = activeJob?.id || (latestJob?.status === 'FAILED' ? latestJob.id : null);
  const jobQuery = useUnderstandingJob(observedJobId);
  const effectiveJob = jobQuery.data || activeJob || latestJob;

  const isRunning =
    triggerMutation.isPending ||
    effectiveJob?.status === 'RUNNING' ||
    effectiveJob?.status === 'PENDING';

  const isFailed =
    effectiveJob?.status === 'FAILED' && !triggerMutation.isPending;

  const handleRetry = useCallback(() => {
    if (!domainId || isRunning) return;
    triggerMutation.mutate(domainId, {
      onSuccess: () => {
        onRetry?.();
      },
    });
  }, [domainId, isRunning, triggerMutation, onRetry]);

  // When Idle or Successfully Completed: Do not show the banner
  if (!isRunning && !isFailed) {
    return null;
  }

  // Active Understanding State (Truthful Cognitive Feedback)
  if (isRunning) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={`Nebula is understanding ${domainName}`}
        className={`w-full rounded-2xl border border-primary/20 bg-primary/[0.03] dark:bg-primary/[0.05] p-5 sm:p-7 space-y-4 shadow-2xs backdrop-blur-xs transition-all ${className}`}
        data-testid="active-understanding-banner"
        {...rest}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[11px] font-semibold tracking-[0.24em] uppercase text-primary">
            UNDERSTANDING
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-primary/10 text-primary border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span>Understanding in progress</span>
          </span>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-normal text-foreground font-display tracking-tight">
            Nebula is understanding {domainName}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Discovering and validating current infrastructure signals across authoritative pipeline stages.
          </p>
        </div>

        {/* Authoritative Discovery Stepper */}
        <UnderstandingProgressStepper job={effectiveJob} />

        <div className="pt-2 border-t border-border-hairline/60 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
          <span>The previous understanding remains available until the new understanding is complete.</span>
          <span className="inline-flex items-center gap-1.5 text-foreground/70">
            <Icon icon={RefreshCw} size="small" className="animate-spin text-primary" />
            <span>Observing backend worker</span>
          </span>
        </div>
      </div>
    );
  }

  // Failed Understanding State (Truthful Error Recovery)
  if (isFailed) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`w-full rounded-2xl border border-severity-critical/20 bg-severity-critical/[0.04] p-5 sm:p-7 space-y-4 shadow-2xs transition-all ${className}`}
        data-testid="failed-understanding-banner"
        {...rest}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[11px] font-semibold tracking-[0.24em] uppercase text-severity-critical">
            UNDERSTANDING ERROR
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-severity-critical/10 text-severity-critical border border-severity-critical/20">
            <Icon icon={AlertCircle} size="small" />
            <span>Worker failure</span>
          </span>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-normal text-foreground font-display tracking-tight">
            Understanding couldn't be completed.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {effectiveJob?.error || 'Nebula encountered an error during infrastructure verification.'} Your previous understanding remains available.
          </p>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleRetry}
            disabled={triggerMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-subtle border border-border-hairline hover:border-border-strong text-xs font-medium text-foreground transition-all cursor-pointer focus-ring select-none shadow-2xs"
          >
            <Icon icon={RefreshCw} size="small" className={triggerMutation.isPending ? 'animate-spin' : ''} />
            <span>Try again</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};

ActiveUnderstandingBanner.displayName = 'ActiveUnderstandingBanner';
