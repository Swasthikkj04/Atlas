import React from 'react';
import { Layers } from 'lucide-react';
import type { CanonicalInfrastructureRowItem } from '../../contracts/gx-i-01-infrastructure-surface.contract.ts';
import type { GuestWorkspaceTabId } from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';
import { InfrastructureRowItem } from './InfrastructureRowItem.tsx';

interface InfrastructureSummarySectionProps {
  domain: string;
  rows: readonly CanonicalInfrastructureRowItem[];
  onNavigateTab: (tabId: GuestWorkspaceTabId) => void;
}

export const InfrastructureSummarySection: React.FC<InfrastructureSummarySectionProps> = ({
  domain,
  rows,
  onNavigateTab,
}) => {
  return (
    <section
      aria-label="Infrastructure Summary"
      className="bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(16,24,20,0.035)]"
    >
      {/* 1. Header Bar */}
      <div className="p-6 sm:p-7 border-b border-[#EEEEEB] dark:border-border-divider bg-[#FAFAF8] dark:bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.24em] text-[#3568C8] dark:text-primary font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>01 &bull; Infrastructure Summary</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-foreground mt-1">
            What Nebula can establish about the public perimeter
          </h2>
          <p className="text-xs sm:text-sm text-[#5F625F] dark:text-muted-foreground mt-1 font-sans">
            Observed components and transport mechanisms active at{' '}
            <span className="font-mono text-foreground font-semibold">{domain}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium text-primary bg-primary/10 border border-primary/20">
            <span>{rows.length} components observed</span>
          </span>
        </div>
      </div>

      {/* 2. Canonical Rows */}
      {rows.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-xs text-[#5F625F] dark:text-muted-foreground font-mono">
            Observing perimeter telemetry for {domain}…
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#EEEEEB] dark:divide-border-divider">
          {rows.map((row, idx) => (
            <InfrastructureRowItem
              key={row.id}
              item={row}
              defaultExpanded={idx === 0}
              onNavigateTab={onNavigateTab}
            />
          ))}
        </div>
      )}

      {/* 3. Section Footnote */}
      <div className="px-6 py-3 bg-[#F8F9FA] dark:bg-muted/5 border-t border-[#EEEEEB] dark:border-border-divider flex items-center justify-between text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground">
        <span>Click any row for verified signal fingerprints and evidence links</span>
        <span className="hidden sm:inline">Evidence-backed understanding</span>
      </div>
    </section>
  );
};
