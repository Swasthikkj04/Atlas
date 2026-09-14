import React from 'react';
import { ArrowUpRight, ArrowRight, ShieldCheck } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { Eyebrow } from '../../../../components/typography';
import { Stack, Cluster } from '../../../../components/layout';
import { DomainFavicon } from '../identity';
import type { CrossDomainWhatChangedProps } from './WorkspaceIntelligenceLanding.types';

/**
 * Authoritative Cross-Domain Change Intelligence Surface (WX-O-01 / WX-1025).
 *
 * Implements the dominant return briefing surface:
 * - Answers: "What changed across my monitored domains since I was last here?"
 * - Presents domain-scoped change stories with verified consequences and timestamps
 * - Provides immediate 1-click drilldown into domain-specific changes
 * - Honors quiet state when no drift exists
 */
export const CrossDomainWhatChanged: React.FC<CrossDomainWhatChangedProps> = ({
  brief,
  onInvestigateChange,
  onViewDomainChanges,
  className = '',
}) => {
  const hasChanges = brief.crossDomainChanges.length > 0;

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
          {hasChanges
            ? `${brief.crossDomainChanges.length} ${brief.crossDomainChanges.length === 1 ? 'change' : 'changes'} recorded`
            : 'Stable baseline'}
        </span>
      </Cluster>

      {/* When Changes Exist: Structured Cross-Domain Change Cards */}
      {hasChanges ? (
        <div
          className="rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] divide-y divide-[#EEEEEB] dark:divide-border-divider overflow-hidden"
          data-testid="cross-domain-changes-list"
        >
          {brief.crossDomainChanges.map((change) => (
            <div
              key={change.changeId}
              className="p-4 sm:p-5 space-y-2.5 hover:bg-[#FCFCFA] dark:hover:bg-surface-elevated transition-colors duration-150"
              data-testid={`cross-domain-change-row-${change.changeId}`}
            >
              {/* Top Row: Domain Context + Timestamp */}
              <Cluster justify="between" align="center" className="w-full">
                <div className="flex items-center gap-2">
                  <DomainFavicon domain={change.domainName} size="compact" />
                  <span className="text-xs font-mono font-medium text-foreground">
                    {change.domainName}
                  </span>
                </div>

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

              {/* Action Affordances */}
              <div className="pt-2 flex items-center justify-between text-xs font-mono">
                {onViewDomainChanges && (
                  <button
                    type="button"
                    onClick={() => onViewDomainChanges(change.domainId)}
                    className="inline-flex items-center gap-1 text-[#5F625F] dark:text-muted-foreground hover:text-foreground hover:underline cursor-pointer transition-colors font-medium"
                    data-testid={`view-domain-changes-${change.domainId}`}
                  >
                    <span>View domain changes</span>
                    <Icon icon={ArrowRight} size="small" />
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
      ) : (
        /* Quiet Baseline State */
        <div
          className="p-5 sm:p-6 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-2 text-left"
          data-testid="cross-domain-quiet-card"
        >
          <div className="flex items-center gap-2 text-[#178A68]">
            <Icon icon={ShieldCheck} size="small" />
            <span className="text-xs font-mono font-medium uppercase tracking-wider">
              No Infrastructure Drift Recorded
            </span>
          </div>
          <p className="text-xs sm:text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed">
            All monitored domains remain in active conformance with their baseline snapshots since your last visit.
          </p>
        </div>
      )}
    </Stack>
  );
};

CrossDomainWhatChanged.displayName = 'CrossDomainWhatChanged';
