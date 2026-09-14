import React from 'react';
import { Sparkles, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import type { GenesisBaselineArtifact } from '../../contracts/gx-h-01-history-drift.contract.ts';

interface ClaimMemoryBridgeActionProps {
  artifact: GenesisBaselineArtifact;
  onClaim: () => void;
}

export const ClaimMemoryBridgeAction: React.FC<ClaimMemoryBridgeActionProps> = ({
  artifact,
  onClaim,
}) => {
  return (
    <section
      aria-label="Claim Domain and Activate Memory"
      className="bg-gradient-to-br from-[#F8F9FA] to-[#EEF4FF] dark:from-card dark:to-muted/30 border-2 border-primary/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_2px_8px_rgba(16,24,20,0.04)]"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.24em] text-primary font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>04 &bull; Claim &bull; Activate Institutional Memory</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground">
            Registration is Nebula beginning to remember
          </h3>

          <p className="text-sm text-[#5F625F] dark:text-muted-foreground font-sans leading-relaxed">
            Claim <span className="font-mono text-foreground font-semibold">{artifact.domain}</span> to transition Snapshot #0 into continuous institutional memory and activate automated drift detection.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#5F625F] dark:text-muted-foreground font-sans">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Preserves current snapshot baseline</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Zero-friction session handover</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Automated 24h drift comparisons</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClaim}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-sans font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] shadow-md shadow-primary/20 transition-all cursor-pointer focus-ring"
          >
            <Sparkles className="w-4 h-4" />
            <span>Transition to Workspace Memory</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground">
            Instant workspace activation &bull; Zero data loss
          </span>
        </div>
      </div>
    </section>
  );
};
