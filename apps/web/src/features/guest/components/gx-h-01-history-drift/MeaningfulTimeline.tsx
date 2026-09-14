import React from 'react';
import { History, ArrowDown } from 'lucide-react';
import type { HistoryTimelineNode } from '../../contracts/gx-h-01-history-drift.contract.ts';

interface MeaningfulTimelineProps {
  nodes: readonly HistoryTimelineNode[];
}

export const MeaningfulTimeline: React.FC<MeaningfulTimelineProps> = ({ nodes }) => {
  return (
    <section
      aria-label="Temporal Continuity Timeline"
      className="bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(16,24,20,0.035)]"
    >
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EEEEEB] dark:border-border-divider">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.24em] text-[#3568C8] dark:text-primary font-semibold">
            <History className="w-3.5 h-3.5" />
            <span>02 &bull; Temporal Continuity</span>
          </div>
          <h3 className="text-lg sm:text-xl font-display font-semibold text-foreground mt-1">
            How observation transitions to memory
          </h3>
        </div>

        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/70 self-start sm:self-auto font-medium">
          Temporal Progression
        </span>
      </div>

      {/* 2. Vertical Temporal Flow */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-primary/50 before:to-muted-foreground/30">
        {nodes.map((node) => (
          <div key={node.id} className="relative group">
            {/* Timeline Node Bullet */}
            <div
              className={`absolute -left-[29px] sm:-left-[33px] top-1.5 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                node.isActive
                  ? 'bg-emerald-500 border-white dark:border-card ring-4 ring-emerald-500/20'
                  : 'bg-card border-[#9CA3AF] dark:border-muted-foreground'
              }`}
            >
              {node.isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>

            {/* Node Card */}
            <div
              className={`p-4 sm:p-5 rounded-xl border transition-colors ${
                node.isActive
                  ? 'bg-[#FAFAF8] dark:bg-muted/20 border-[#E5E7EB] dark:border-border'
                  : 'bg-[#F8F9FA]/60 dark:bg-muted/10 border-dashed border-[#E5E7EB] dark:border-border/70 opacity-80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                    {node.temporalPhase}
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-foreground font-display">
                    {node.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground">
                    {node.subtitle}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                      node.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-primary/10 text-primary border border-primary/20'
                    }`}
                  >
                    {node.statusBadge}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#5F625F] dark:text-muted-foreground font-sans leading-relaxed">
                {node.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Temporal Note */}
      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 flex items-center justify-between text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
        <span>GX maintains single-point observation</span>
        <span className="flex items-center gap-1 font-medium text-foreground">
          <span>Continuous lineage unlocks in Workspace</span>
          <ArrowDown className="w-3.5 h-3.5" />
        </span>
      </div>
    </section>
  );
};
