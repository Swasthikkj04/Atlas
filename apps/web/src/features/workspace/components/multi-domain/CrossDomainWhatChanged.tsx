import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { Eyebrow } from '../../../../components/typography';
import { Stack, Cluster } from '../../../../components/layout';
import { DomainFavicon } from '../identity';
import type { CrossDomainWhatChangedProps } from './WorkspaceIntelligenceLanding.types';

/**
 * Cross-Domain Change Intelligence Section (WX-1025 / WX-1024).
 *
 * Implements the cross-domain "What changed" overview:
 * - Aggregates meaningful changes across all monitored infrastructure
 * - Summarizes changes with outcome headlines and defensive consequence explanations
 * - 1-click links to deep domain change investigations
 */
export const CrossDomainWhatChanged: React.FC<CrossDomainWhatChangedProps> = ({
  brief,
  onInvestigateChange,
  onViewDomainChanges,
  className = '',
}) => {
  if (brief.crossDomainChanges.length === 0) {
    return null;
  }

  return (
    <Stack gap="md" className={`w-full ${className}`} data-testid="cross-domain-changes-section">
      {/* Section Header */}
      <Cluster justify="between" align="center" className="pb-1">
        <Cluster gap="xs" align="center">
          <Eyebrow
            variant="muted"
            className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#5F625F] dark:text-muted-foreground font-semibold"
          >
            WHAT CHANGED ACROSS DOMAINS
          </Eyebrow>
        </Cluster>

        <span className="font-mono text-xs text-[#5F625F] dark:text-muted-foreground">
          {brief.crossDomainChanges.length} {brief.crossDomainChanges.length === 1 ? 'change' : 'changes'} recorded
        </span>
      </Cluster>

      {/* Structured Cross-Domain Change Cards */}
      <div
        className="rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] divide-y divide-[#EEEEEB] dark:divide-border-divider overflow-hidden"
        data-testid="cross-domain-changes-list"
      >
        {brief.crossDomainChanges.map((change) => (
          <div
            key={change.changeId}
            className="p-4 sm:p-5 space-y-2 hover:bg-[#FCFCFA] dark:hover:bg-surface-elevated transition-colors duration-150"
            data-testid={`cross-domain-change-row-${change.changeId}`}
          >
            <Cluster justify="between" align="center" className="w-full">
              {/* Domain Pill */}
              <div className="flex items-center gap-2">
                <DomainFavicon domain={change.domainName} size="compact" />
                <span className="text-xs font-mono font-medium text-foreground">
                  {change.domainName}
                </span>
              </div>

              {/* Observed Timestamp */}
              <span className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground">
                {change.detectedFormatted}
              </span>
            </Cluster>

            {/* Change Headline Title */}
            <h4 className="text-sm sm:text-base font-medium text-foreground leading-snug">
              {change.title}
            </h4>

            {/* Consequence / Significance Summary */}
            <p className="text-xs text-foreground/80 dark:text-muted-foreground leading-relaxed">
              {change.significance || change.summary}
            </p>

            {/* Navigation Affordances */}
            <div className="pt-2 flex items-center justify-between text-xs font-mono">
              {onViewDomainChanges && (
                <button
                  type="button"
                  onClick={() => onViewDomainChanges(change.domainId)}
                  className="text-[#5F625F] dark:text-muted-foreground hover:text-foreground hover:underline cursor-pointer transition-colors"
                >
                  View domain changes &rarr;
                </button>
              )}

              {onInvestigateChange && (
                <button
                  type="button"
                  onClick={() => onInvestigateChange(change.domainId, change.changeId)}
                  className="inline-flex items-center gap-1 text-[#3568C8] hover:underline font-medium cursor-pointer transition-colors ml-auto"
                  data-testid={`inspect-change-${change.changeId}`}
                >
                  <span>Inspect details</span>
                  <Icon icon={ArrowUpRight} size="small" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Stack>
  );
};

CrossDomainWhatChanged.displayName = 'CrossDomainWhatChanged';
