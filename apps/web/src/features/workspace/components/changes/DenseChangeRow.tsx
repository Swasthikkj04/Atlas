import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { DomainFavicon } from '../identity';
import type { TimelineEpochItem } from '../../contracts/infinite-timeline.contract';

export interface DenseChangeRowProps {
  readonly item: TimelineEpochItem;
  readonly onInvestigate?: (changeId: string, domainId?: string) => void;
  readonly className?: string;
}

/**
 * Ultra-Dense Change Archive Row (WX-1026 Progressive Density).
 *
 * High-density single-line ledger strip for older infrastructure history (>14 days):
 * - Maximizes information density while retaining full meaning and inspectability
 * - Clean hairline row with date pill, domain favicon, and outcome headline
 */
export const DenseChangeRow: React.FC<DenseChangeRowProps> = ({
  item,
  onInvestigate,
  className = '',
}) => {
  const { event, story } = item;

  return (
    <div
      className={`group rounded-lg border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs font-mono transition-colors hover:bg-[#FAFAF8] dark:hover:bg-surface-elevated ${className}`}
      data-testid={`dense-change-row-${story.changeId}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className="font-semibold text-[#5F625F] dark:text-muted-foreground uppercase text-[11px] shrink-0">
          {item.dateFormatted}
        </span>

        <span className="text-[#5F625F]/40 shrink-0">&bull;</span>

        {event.domainName && (
          <div className="flex items-center gap-1.5 shrink-0">
            <DomainFavicon domain={event.domainName} size="compact" />
            <span className="text-foreground font-medium truncate max-w-[120px] sm:max-w-[160px]">
              {event.domainName}
            </span>
          </div>
        )}

        <span className="text-[#5F625F]/40 hidden sm:inline shrink-0">&bull;</span>

        <p className="text-foreground font-normal font-sans truncate min-w-0 flex-1">
          {story.title}
        </p>
      </div>

      {onInvestigate && (
        <button
          type="button"
          onClick={() => onInvestigate(story.changeId, event.domainId)}
          className="text-[#3568C8] hover:underline font-medium inline-flex items-center gap-1 shrink-0 cursor-pointer"
          data-testid={`inspect-dense-change-${story.changeId}`}
        >
          <span className="hidden sm:inline">Inspect</span>
          <Icon icon={ArrowRight} size="small" />
        </button>
      )}
    </div>
  );
};

DenseChangeRow.displayName = 'DenseChangeRow';
