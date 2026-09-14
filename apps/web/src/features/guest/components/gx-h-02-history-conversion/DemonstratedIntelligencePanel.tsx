import React from 'react';
import type { DemonstratedIntelligenceSummary } from '../../contracts/gx-h-02-history-conversion.contract.ts';
import { DomainFavicon } from '../../../workspace/components/identity/DomainFavicon';

interface DemonstratedIntelligencePanelProps {
  summary: DemonstratedIntelligenceSummary;
}

export const DemonstratedIntelligencePanel: React.FC<DemonstratedIntelligencePanelProps> = ({
  summary,
}) => {
  return (
    <div className="space-y-6" aria-label="Demonstrated Intelligence Surface">
      {/* 1. Header & Domain Identity */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#5F625F] dark:text-muted-foreground font-semibold">
          <span>History &amp; Drift &bull; Current Observation</span>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <DomainFavicon domain={summary.domain} size="primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
              {summary.domain}
            </h1>
            <p className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground mt-0.5">
              Genesis Baseline &bull; {summary.formattedTimestamp}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Concise Summary Line */}
      <div className="inline-flex items-center gap-2 text-xs font-mono text-foreground/80 bg-muted/40 px-3 py-1.5 rounded-lg border border-border/60">
        <span>{summary.signalsCount} signals</span>
        <span className="text-[#5F625F] dark:text-muted-foreground">&bull;</span>
        <span>{summary.findingsCount} findings</span>
        <span className="text-[#5F625F] dark:text-muted-foreground">&bull;</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          {summary.capturedRelativeTime}
        </span>
      </div>

      {/* 3. Restrained Observation Baseline Card */}
      <div className="bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-2xl p-6 sm:p-7 space-y-5 shadow-[0_1px_3px_rgba(16,24,20,0.035)]">
        <div className="flex items-center justify-between pb-3 border-b border-[#EEEEEB] dark:border-border-divider">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
            <span className="text-sm font-display font-semibold text-foreground">
              Genesis Baseline
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground">
            Snapshot #0
          </span>
        </div>

        {/* Observed Wire Telemetry (Typography-driven) */}
        {summary.wireSummary.length > 0 && (
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground font-semibold">
              Observed Wire Context
            </span>
            <div className="space-y-2">
              {summary.wireSummary.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-[#FAFAF8] dark:bg-muted/20 border border-[#E5E7EB] dark:border-border/60 text-xs font-mono"
                >
                  <span className="text-[#5F625F] dark:text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-[300px]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Epistemic Honesty Note */}
        <p className="text-xs text-[#5F625F] dark:text-muted-foreground font-sans leading-relaxed pt-1">
          This observation captures the public state of{' '}
          <strong className="text-foreground font-medium">{summary.domain}</strong> at this
          single point in time. Historical lineage and continuous drift tracking activate in Workspace.
        </p>
      </div>
    </div>
  );
};
