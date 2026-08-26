import React from 'react';
import { ArrowRight, ArrowUpRight, ShieldAlert, Cpu } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { LoadingState, ErrorState } from '../../../../components/states';
import { useWorkspaceOverview } from '../../../../hooks/queries/useWorkspace';
import type { PrimaryStoryProps } from './PrimaryStory.types';
import type { FindingSeverity } from '../../../../types/api';

const severityColorMap: Record<FindingSeverity, { text: string; bg: string; border: string }> = {
  CRITICAL: {
    text: 'text-[#A93442]',
    bg: 'bg-[#FDEBEC]',
    border: 'border-[#E9B3B9]',
  },
  HIGH: {
    text: 'text-[#C24D57]',
    bg: 'bg-[#FFF0F1]',
    border: 'border-[#F0C3C7]',
  },
  MEDIUM: {
    text: 'text-[#B86F18]',
    bg: 'bg-[#FFF4E3]',
    border: 'border-[#F0D3A5]',
  },
  LOW: {
    text: 'text-[#3568C8]',
    bg: 'bg-[#EEF4FF]',
    border: 'border-[#C8D8F6]',
  },
  INFORMATIONAL: {
    text: 'text-[#3568C8]',
    bg: 'bg-[#EEF4FF]',
    border: 'border-[#C8D8F6]',
  },
  SUCCESS: {
    text: 'text-[#178A68]',
    bg: 'bg-[#EAF7F2]',
    border: 'border-[#B9E5D6]',
  },
};

function formatRelativeTime(dateString: string): string {
  try {
    const timestamp = new Date(dateString).getTime();
    if (isNaN(timestamp)) return 'recently';
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;
    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return 'recently';
  }
}

/**
 * Authoritative Primary Story Experience (WX-904 / WX-1017).
 *
 * Implements the refined Primary Story surface:
 * - Neutral premium card surface (#FFFFFF / #E1E1DC / shadow-premium-xs)
 * - Semantic authority concentrated strictly in badges and indicators
 * - Technical metadata rendered in calm neutral metadata tokens
 * - Zero frontend story synthesis or importance sorting.
 */
export const PrimaryStory: React.FC<PrimaryStoryProps> = ({
  domainId,
  domainName,
  story: storyProp,
  onInvestigate,
  onViewEvidence,
  className = '',
  ...rest
}) => {
  const overviewQuery = useWorkspaceOverview(storyProp ? null : domainId);

  const story = storyProp ?? overviewQuery.data?.primaryStory;
  const isLoading = !storyProp && overviewQuery.isLoading;
  const error = overviewQuery.error;

  // 1. Loading State
  if (isLoading) {
    return (
      <div className={`w-full py-6 flex items-center justify-center ${className}`} {...rest}>
        <LoadingState
          label={`Resolving primary development for ${domainName}...`}
          description="Evaluating causal lineage and evidence baseline"
        />
      </div>
    );
  }

  // 2. Error State
  if (error && !story) {
    return (
      <div className={`w-full py-4 flex justify-center ${className}`} {...rest}>
        <div className="w-full max-w-2xl">
          <ErrorState
            error={error}
            title="Failed to Load Primary Story"
            description={`Could not retrieve the primary development for ${domainName}.`}
            retryLabel="Retry"
            onRetry={() => overviewQuery.refetch()}
          />
        </div>
      </div>
    );
  }

  // 3. Quiet State / No Primary Story (Silence is valuable)
  if (!story) {
    return null;
  }

  const sevTokens = severityColorMap[story.severity] || severityColorMap.INFORMATIONAL;

  return (
    <div
      className={`w-full bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-2xl p-6 sm:p-7 space-y-4.5 shadow-[0_1px_2px_rgba(16,24,20,0.035)] transition-all ${className}`}
      data-testid="primary-story-surface"
      {...rest}
    >
      {/* Header Context: Category & Severity */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#EEEEEB] dark:border-border-divider">
        <div className="flex items-center gap-2">
          <Icon icon={ShieldAlert} size="small" className={sevTokens.text} />
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border px-2 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata">
            {story.category}
          </span>
        </div>

        <span
          className={`font-mono text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border ${sevTokens.text} ${sevTokens.bg} ${sevTokens.border}`}
        >
          {story.severity}
        </span>
      </div>

      {/* Controlled Title Scale */}
      <h3 className="text-lg sm:text-xl font-medium text-foreground leading-snug font-sans tracking-tight">
        {story.title}
      </h3>

      {/* Narrative Section: What Happened */}
      <div className="space-y-1">
        <span className="text-[10px] font-mono font-semibold tracking-wider uppercase text-[#5F625F] dark:text-muted-foreground">
          What Happened
        </span>
        {story.explanation ? (
          <p className="text-sm sm:text-[15px] leading-relaxed text-foreground/90 font-normal">
            {story.explanation}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Detailed observation narrative pending baseline synthesis.
          </p>
        )}
      </div>

      {/* Significance & Why It Matters */}
      {story.remediation && (
        <div className="pt-3 border-t border-[#EEEEEB] dark:border-border-divider space-y-1">
          <span className="text-[10px] font-mono font-semibold tracking-wider uppercase text-[#5F625F] dark:text-muted-foreground">
            Significance &bull; Why It Matters
          </span>
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {story.remediation}
          </p>
        </div>
      )}

      {/* Traceability & Supporting Evidence Lineage */}
      {story.lineage && (
        <div className="pt-3 border-t border-[#EEEEEB] dark:border-border-divider space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon icon={Cpu} size="small" className="text-[#5F625F] dark:text-muted-foreground shrink-0" />
              <span className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground truncate">
                Evidence Lineage: {story.lineage.observationKey}
              </span>
            </div>

            {onViewEvidence && (
              <button
                type="button"
                onClick={() => onViewEvidence(story.lineage!)}
                className="flex items-center gap-1 text-[11px] text-[#3568C8] hover:underline font-mono font-medium shrink-0 cursor-pointer focus-ring transition-colors duration-150"
              >
                <span>View Evidence</span>
                <Icon icon={ArrowUpRight} size="small" />
              </button>
            )}
          </div>

          {story.lineage.observedValue && (
            <div className="bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border rounded-xl p-3 overflow-x-auto max-h-24">
              <pre className="font-mono text-[11px] text-[#5F625F] dark:text-muted-foreground whitespace-pre-wrap break-all leading-tight m-0">
                {story.lineage.observedValue}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Metadata & Investigation Action */}
      <div className="pt-3 border-t border-[#EEEEEB] dark:border-border-divider flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#5F625F] dark:text-muted-foreground font-mono">
        <div className="flex items-center gap-2">
          <span>Detected {formatRelativeTime(story.detectedAt)}</span>
          <span>&bull;</span>
          <span className="truncate max-w-[140px] sm:max-w-[200px]">ID: {story.id}</span>
        </div>

        {onInvestigate && (
          <button
            type="button"
            onClick={() => onInvestigate(story.id)}
            className="inline-flex items-center gap-1.5 text-xs text-[#3568C8] hover:underline font-mono font-medium cursor-pointer focus-ring transition-colors duration-150"
          >
            <span>Investigate finding</span>
            <Icon icon={ArrowRight} size="small" />
          </button>
        )}
      </div>
    </div>
  );
};

PrimaryStory.displayName = 'PrimaryStory';
