import React from 'react';
import { ArrowUpRight, GitCommit, ArrowRight } from 'lucide-react';
import {
  SectionTitle,
  Body,
  Eyebrow,
  TechnicalSmall,
} from '../../../../components/typography';
import { Cluster, Stack } from '../../../../components/layout';
import type { TimelineEventCardProps } from './InfrastructureTimeline.types';

const severityColorMap: Record<string, { text: string; bg: string; border: string }> = {
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
};

function formatEventTimestamp(timestampStr?: string | Date | null) {
  if (!timestampStr) {
    return { dateLabel: 'Recent', relativeLabel: '', fullIso: '' };
  }

  const date = typeof timestampStr === 'string' ? new Date(timestampStr) : timestampStr;
  if (isNaN(date.getTime())) {
    return { dateLabel: String(timestampStr), relativeLabel: '', fullIso: String(timestampStr) };
  }

  const dateLabel = date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const fullIso = date.toISOString();

  // Relative calculation for display hint only (chronology remains backend authoritative)
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  let relativeLabel: string;
  if (diffDays <= 0) {
    relativeLabel = 'Today';
  } else if (diffDays === 1) {
    relativeLabel = 'Yesterday';
  } else if (diffDays < 7) {
    relativeLabel = `${diffDays}d ago`;
  } else if (diffDays < 30) {
    relativeLabel = `${Math.floor(diffDays / 7)}w ago`;
  } else {
    relativeLabel = `${Math.floor(diffDays / 30)}mo ago`;
  }

  return { dateLabel, relativeLabel, fullIso };
}

export const TimelineEventCard: React.FC<TimelineEventCardProps> = ({
  event,
  onInvestigate,
  onViewSnapshot,
}) => {
  const sevKey = (event.severity || 'INFORMATIONAL').toUpperCase();
  const sevStyle = severityColorMap[sevKey] || severityColorMap.INFORMATIONAL;
  const timeInfo = formatEventTimestamp(event.detectedAt || event.timestamp);

  const narrative = event.explanation || event.description || event.summary;
  const currentSnapshotId = event.currentSnapshotId || event.snapshotId;
  const previousSnapshotId = event.previousSnapshotId;

  return (
    <li
      className="relative pl-6 pb-8 border-l border-[#EEEEEB] dark:border-border-divider last:pb-0 group"
      data-testid="timeline-event-item"
    >
      {/* Timeline Node Marker */}
      <div className="absolute -left-2.5 top-0.5 w-5 h-5 rounded-full bg-[#FAFAF8] dark:bg-surface-secondary border border-[#DCDCD7] dark:border-border-strong flex items-center justify-center text-[#5F625F] dark:text-muted-foreground group-hover:border-foreground transition-colors">
        <GitCommit className="w-3 h-3" />
      </div>

      <div className="bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-xl p-4 shadow-[0_1px_2px_rgba(16,24,20,0.035)] transition-all duration-150 hover:bg-[#FCFCFA] dark:hover:bg-surface-elevated hover:border-[#DADAD5] dark:hover:border-border-strong">
        <Stack gap="md">
          {/* Header Metadata: Date, Relative Tag, Severity Badge */}
          <Cluster justify="between" align="center" className="flex-wrap gap-2">
            <Cluster align="center" gap="sm">
              <time
                dateTime={timeInfo.fullIso}
                title={timeInfo.fullIso}
                className="text-xs font-semibold text-foreground uppercase tracking-wider"
              >
                {timeInfo.dateLabel}
              </time>
              {timeInfo.relativeLabel && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata text-[#5F625F] dark:text-muted-foreground font-mono">
                  {timeInfo.relativeLabel}
                </span>
              )}
            </Cluster>

            <Cluster align="center" gap="2xs">
              {event.category && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border">
                  {event.category}
                </span>
              )}
              {event.changeType && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border">
                  {event.changeType}
                </span>
              )}
              <span
                className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border ${sevStyle.text} ${sevStyle.bg} ${sevStyle.border}`}
              >
                {sevKey}
              </span>
            </Cluster>
          </Cluster>

          {/* Event Title */}
          <div>
            <SectionTitle className="text-base font-medium text-foreground">
              {event.title}
            </SectionTitle>
            {narrative && (
              <Body className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {narrative}
              </Body>
            )}
          </div>

          {/* Snapshot Lineage Context (WX-501 & WX-305 & WX-1017) */}
          {(currentSnapshotId || previousSnapshotId) && (
            <div className="pt-2 border-t border-[#EEEEEB] dark:border-border-divider">
              <Cluster justify="between" align="center" className="flex-wrap gap-2 text-xs">
                <Cluster align="center" gap="sm">
                  <Eyebrow className="text-[10px] text-[#5F625F] dark:text-muted-foreground">Lineage:</Eyebrow>
                  {previousSnapshotId ? (
                    <Cluster align="center" gap="2xs" className="font-mono text-[11px] text-[#5F625F] dark:text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => onViewSnapshot(previousSnapshotId)}
                        className="hover:text-foreground underline decoration-dotted transition-colors"
                        title={`View previous snapshot ${previousSnapshotId}`}
                      >
                        {previousSnapshotId.slice(0, 8)}
                      </button>
                      <ArrowRight className="w-3 h-3 text-[#5F625F] dark:text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => currentSnapshotId && onViewSnapshot(currentSnapshotId)}
                        className="text-foreground hover:underline font-semibold"
                        title={`View current snapshot ${currentSnapshotId}`}
                      >
                        {currentSnapshotId?.slice(0, 8) || 'Current'}
                      </button>
                    </Cluster>
                  ) : (
                    <TechnicalSmall className="text-[#5F625F] dark:text-muted-foreground text-[11px]">
                      Baseline: {currentSnapshotId?.slice(0, 8)}
                    </TechnicalSmall>
                  )}
                </Cluster>

                {/* Direct Action: Investigate Change (WX-303) */}
                <button
                  type="button"
                  onClick={() => onInvestigate(event.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3568C8] hover:underline px-2.5 py-1 rounded bg-[#F4F4F1] dark:bg-surface-metadata hover:bg-[#FAFAF8] dark:hover:bg-surface-secondary border border-[#E2E2DD] dark:border-border transition-all duration-150"
                  aria-label={`Investigate change: ${event.title}`}
                >
                  <span>Investigate</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </Cluster>
            </div>
          )}
        </Stack>
      </div>
    </li>
  );
};
