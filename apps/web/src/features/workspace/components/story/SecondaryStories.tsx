import React from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { LoadingState, ErrorState } from '../../../../components/states';
import { useWorkspaceOverview } from '../../../../hooks/queries/useWorkspace';
import type { SecondaryStoriesProps } from './SecondaryStories.types';
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
 * Authoritative Secondary Stories Experience (WX-904 / WX-1017).
 *
 * Implements the refined Secondary Stories surface:
 * - Subordinate, compact, and dense infrastructure intelligence beneath Primary Story.
 * - Neutral elevated surface (#FFFFFF / #E1E1DC / shadow-premium-xs)
 * - Restrained hover states (#FCFCFA / #DADAD5)
 * - Semantic authority concentrated strictly in badges and indicators.
 */
export const SecondaryStories: React.FC<SecondaryStoriesProps> = ({
  domainId,
  domainName,
  stories: storiesProp,
  onInvestigate,
  onViewEvidence,
  className = '',
  ...rest
}) => {
  const overviewQuery = useWorkspaceOverview(storiesProp ? null : domainId);

  const rawStories = storiesProp ?? overviewQuery.data?.secondaryStories;
  const stories = React.useMemo(() => {
    if (!rawStories) return undefined;
    const seen = new Set<string>();
    const result = [];
    for (const story of rawStories) {
      if (!story || !story.id) continue;
      const key = `FINDING:${story.id}`;
      const ruleKey = (story as any).ruleId
        ? `FINDING:rule:${(story as any).ruleId}`
        : null;
      const canonicalKey =
        story.category && story.title
          ? `FINDING:${story.category}:${story.title.trim().toLowerCase()}`
          : null;

      if (seen.has(key)) continue;
      if (ruleKey && seen.has(ruleKey)) continue;
      if (canonicalKey && seen.has(canonicalKey)) continue;

      seen.add(key);
      if (ruleKey) seen.add(ruleKey);
      if (canonicalKey) seen.add(canonicalKey);
      result.push(story);
    }
    return result;
  }, [rawStories]);

  const isLoading = !storiesProp && overviewQuery.isLoading;
  const error = overviewQuery.error;

  // 1. Loading State
  if (isLoading) {
    return (
      <div className={`w-full py-6 flex items-center justify-center ${className}`} {...rest}>
        <LoadingState
          label={`Loading secondary developments for ${domainName}...`}
          description="Evaluating supplementary infrastructure observations"
        />
      </div>
    );
  }

  // 2. Error State
  if (error && (!stories || stories.length === 0)) {
    return (
      <div className={`w-full py-4 flex justify-center ${className}`} {...rest}>
        <div className="w-full max-w-2xl">
          <ErrorState
            error={error}
            title="Failed to Load Secondary Stories"
            description={`Could not retrieve secondary developments for ${domainName}.`}
            retryLabel="Retry"
            onRetry={() => overviewQuery.refetch()}
          />
        </div>
      </div>
    );
  }

  // 3. Quiet State / No Secondary Stories (Silence is valuable)
  if (!stories || stories.length === 0) {
    return null;
  }

  return (
    <div
      className={`w-full grid grid-cols-1 md:grid-cols-2 gap-3.5 ${className}`}
      data-testid="secondary-stories-grid"
      {...rest}
    >
      {stories.map((story) => {
        const sevTokens = severityColorMap[story.severity] || severityColorMap.INFORMATIONAL;

        return (
          <div
            key={story.id}
            className="p-4.5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card hover:bg-[#FCFCFA] dark:hover:bg-surface-elevated hover:border-[#DADAD5] dark:hover:border-border-strong transition-all duration-150 ease-out flex flex-col justify-between gap-3 group shadow-[0_1px_2px_rgba(16,24,20,0.035)]"
          >
            <div className="space-y-2.5">
              {/* Category & Severity Header */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border px-2 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata">
                  {story.category}
                </span>

                <span
                  className={`font-mono text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${sevTokens.text} ${sevTokens.bg} ${sevTokens.border}`}
                >
                  {story.severity}
                </span>
              </div>

              {/* Title & Narrative */}
              <h4
                role={onInvestigate ? 'button' : undefined}
                tabIndex={onInvestigate ? 0 : undefined}
                onClick={() => onInvestigate?.(story.id)}
                onKeyDown={(e) => {
                  if (onInvestigate && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onInvestigate(story.id);
                  }
                }}
                className={`text-xs sm:text-sm font-semibold text-foreground leading-snug tracking-tight ${
                  onInvestigate ? 'cursor-pointer group-hover:text-[#3568C8] transition-colors duration-150 focus-ring' : ''
                }`}
              >
                {story.title}
              </h4>

              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {story.explanation}
              </p>

              {/* Significance / Why It Matters Note */}
              {story.remediation && (
                <div className="pt-1.5 border-t border-[#EEEEEB] dark:border-border-divider">
                  <p className="text-[11px] text-muted-foreground/90 line-clamp-1 leading-normal">
                    <strong className="text-muted-foreground font-medium">Impact: </strong>
                    {story.remediation}
                  </p>
                </div>
              )}
            </div>

            {/* Evidence & Action Footer */}
            <div className="pt-2 border-t border-[#EEEEEB] dark:border-border-divider flex items-center justify-between gap-2 text-[10px] font-mono text-[#5F625F] dark:text-muted-foreground">
              <div className="flex items-center gap-1.5 min-w-0">
                {story.lineage ? (
                  <span className="truncate max-w-[130px] sm:max-w-[160px]">
                    {story.lineage.observationKey}
                  </span>
                ) : (
                  <span>{formatRelativeTime(story.detectedAt)}</span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onViewEvidence && story.lineage && (
                  <button
                    type="button"
                    onClick={() => onViewEvidence(story.lineage!)}
                    className="flex items-center gap-0.5 text-[#5F625F] dark:text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer focus-ring"
                  >
                    <span>Evidence</span>
                    <Icon icon={ArrowUpRight} size="small" />
                  </button>
                )}

                {onInvestigate && (
                  <button
                    type="button"
                    onClick={() => onInvestigate(story.id)}
                    className="flex items-center gap-0.5 text-[#3568C8] hover:underline font-medium cursor-pointer focus-ring transition-colors duration-150"
                  >
                    <span>Investigate</span>
                    <Icon icon={ArrowRight} size="small" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

SecondaryStories.displayName = 'SecondaryStories';
