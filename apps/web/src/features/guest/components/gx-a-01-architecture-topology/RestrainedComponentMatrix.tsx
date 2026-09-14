import React from 'react';
import {
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import type { GroupedArchitectureCategory } from '../../contracts/gx-a-01-architecture-topology.contract.ts';
import type { GuestWorkspaceTabId } from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';

interface RestrainedComponentMatrixProps {
  categories: GroupedArchitectureCategory[];
  totalCount: number;
  onNavigateTab: (tabId: GuestWorkspaceTabId) => void;
}

export const RestrainedComponentMatrix: React.FC<RestrainedComponentMatrixProps> = ({
  categories,
  totalCount,
  onNavigateTab,
}) => {
  return (
    <section
      aria-label="Architecture components"
      className="bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(16,24,20,0.035)]"
    >
      {/* 1. Header with Total Observed Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EEEEEB] dark:border-border-divider">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.24em] text-[#3568C8] dark:text-primary font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>03 &bull; Architecture Components</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-foreground mt-1">
            Observed Perimeter Stack
          </h2>
        </div>

        <span className="text-xs font-mono font-medium text-[#5F625F] dark:text-muted-foreground bg-[#F4F4F1] dark:bg-muted px-3 py-1 rounded-lg border border-[#E2E2DD] dark:border-border self-start sm:self-auto">
          {totalCount} observed
        </span>
      </div>

      {/* 2. Restrained Categorized List */}
      <div className="space-y-6">
        {categories.map((group) => (
          <div key={group.categoryKey} className="space-y-2">
            {/* Category Header */}
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground px-1">
              {group.title}
            </h3>

            {/* Restrained Item Rows */}
            <div className="divide-y divide-[#EEEEEB] dark:divide-border/60 border border-[#E8E8E4] dark:border-border rounded-xl overflow-hidden bg-[#FAFAFA] dark:bg-muted/10">
              {group.components.map((comp) => (
                <div
                  key={comp.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F3F3F0] dark:hover:bg-muted/20 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground font-sans truncate">
                        {comp.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[#178A68] bg-[#EAF7F2] border border-[#B9E5D6] dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/60 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        &bull; {comp.confidence} confidence
                      </span>
                    </div>

                    <p className="text-xs text-[#5F625F] dark:text-muted-foreground font-sans">
                      {comp.role}
                      {comp.wireSignal && (
                        <span className="font-mono text-[11px] text-[#3568C8] dark:text-primary ml-2">
                          [{comp.wireSignal}]
                        </span>
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateTab('evidence')}
                    className="inline-flex items-center gap-1 text-xs font-mono font-medium text-primary hover:text-primary/80 transition-colors self-start sm:self-auto shrink-0"
                  >
                    <span>Evidence</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
