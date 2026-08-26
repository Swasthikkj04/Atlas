import React, { useState } from 'react';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { DomainFavicon } from '../identity';
import type { TimelineEpochItem } from '../../contracts/infinite-timeline.contract';

export interface CompactChangeRowProps {
  readonly item: TimelineEpochItem;
  readonly onInvestigate?: (changeId: string, domainId?: string) => void;
  readonly onViewSnapshot?: (snapshotId: string) => void;
  readonly className?: string;
}

/**
 * Compact Change Archive Row (WX-1026 Progressive Density).
 *
 * Intermediate density row for 2–14 day old infrastructure history:
 * - Structured header with domain, time, and restrained outcome badge
 * - Consequence summary and inspect action
 * - Optional inline expansion for diff details
 */
export const CompactChangeRow: React.FC<CompactChangeRowProps> = ({
  item,
  onInvestigate,
  onViewSnapshot,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { event, story } = item;

  const isImprovement =
    story.changeType === 'IMPROVED' ||
    story.impact === 'POSITIVE' ||
    story.direction === 'IMPROVEMENT' ||
    story.title.toLowerCase().includes('improved');

  const isDegradation =
    story.changeType === 'DEGRADED' ||
    story.changeType === 'REGRESSED' ||
    story.impact === 'NEGATIVE' ||
    story.impact === 'CRITICAL' ||
    story.direction === 'REGRESSION' ||
    story.title.toLowerCase().includes('degraded');

  const badgeStyle = isImprovement
    ? 'text-[#178A68] bg-[#EAF7F2] border-[#B9E5D6]'
    : isDegradation
    ? 'text-[#C24D57] bg-[#FFF0F1] border-[#F0C3C7]'
    : story.changeType === 'ADDED'
    ? 'text-[#B86F18] bg-[#FFF4E3] border-[#F0D3A5]'
    : 'text-[#5F625F] dark:text-muted-foreground bg-[#F4F4F1] dark:bg-surface-metadata border-[#E2E2DD] dark:border-border';

  return (
    <div
      className={`rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FAFAF8] dark:bg-card p-4 sm:p-5 space-y-3 transition-colors hover:border-[#DCDCD7] ${className}`}
      data-testid={`compact-change-row-${story.changeId}`}
    >
      {/* Header Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono text-xs text-[#5F625F] dark:text-muted-foreground uppercase font-medium">
            {item.dateFormatted}
          </span>
          <span className="text-[#5F625F]/40">&bull;</span>
          {event.domainName && (
            <div className="flex items-center gap-1.5">
              <DomainFavicon domain={event.domainName} size="compact" />
              <span className="font-mono text-xs text-foreground font-medium">
                {event.domainName}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`font-mono text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeStyle}`}
          >
            {story.changeType}
          </span>
          <span className="font-mono text-[11px] text-[#5F625F] dark:text-muted-foreground">
            {item.timeFormatted}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-1">
        <h4 className="text-sm sm:text-base font-medium text-foreground tracking-tight">
          {story.title}
        </h4>
        <p className="text-xs text-foreground/80 dark:text-muted-foreground leading-relaxed">
          {story.significanceExplanation || story.summaryNarrative}
        </p>
      </div>

      {/* Expandable Technical Context / Actions */}
      <div className="pt-2 border-t border-[#EEEEEB] dark:border-border-divider flex items-center justify-between text-xs font-mono">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-[#5F625F] dark:text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>{isExpanded ? 'Hide technical context' : 'Show technical context'}</span>
          <Icon
            icon={ChevronDown}
            size="small"
            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {onInvestigate && (
          <button
            type="button"
            onClick={() => onInvestigate(story.changeId, event.domainId)}
            className="text-[#3568C8] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
            data-testid={`inspect-compact-change-${story.changeId}`}
          >
            <span>Inspect &rarr;</span>
          </button>
        )}
      </div>

      {/* Expanded Inline Drawer */}
      {isExpanded && (
        <div className="pt-2 text-xs font-mono space-y-2 bg-[#FFFFFF] dark:bg-surface-elevated p-3 rounded-lg border border-[#E1E1DC] dark:border-border animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[#5F625F] block">PREVIOUS:</span>
              <p className="text-foreground truncate">{story.previousValue || 'None recorded'}</p>
            </div>
            <div>
              <span className="text-[#5F625F] block">CURRENT:</span>
              <p className="text-foreground truncate">{story.currentValue || 'Observed'}</p>
            </div>
          </div>
          {onViewSnapshot && story.currentSnapshotId && (
            <div className="pt-1 text-right">
              <button
                type="button"
                onClick={() => onViewSnapshot(story.currentSnapshotId)}
                className="text-[#3568C8] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View snapshot {story.currentSnapshotId.slice(0, 10)}</span>
                <Icon icon={ArrowUpRight} size="small" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

CompactChangeRow.displayName = 'CompactChangeRow';
