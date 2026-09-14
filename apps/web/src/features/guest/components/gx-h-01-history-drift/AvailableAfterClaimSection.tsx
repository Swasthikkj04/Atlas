import React from 'react';
import { GitBranch, Radio, History, ShieldAlert, Zap } from 'lucide-react';
import type { AvailableAfterClaimCapability } from '../../contracts/gx-h-01-history-drift.contract.ts';

interface AvailableAfterClaimSectionProps {
  capabilities: readonly AvailableAfterClaimCapability[];
}

function getCapabilityIcon(type: AvailableAfterClaimCapability['iconType']) {
  switch (type) {
    case 'DRIFT':
      return GitBranch;
    case 'ALERTS':
      return Radio;
    case 'MEMORY':
      return History;
    case 'LINEAGE':
      return Zap;
    default:
      return History;
  }
}

export const AvailableAfterClaimSection: React.FC<AvailableAfterClaimSectionProps> = ({
  capabilities,
}) => {
  return (
    <section
      aria-label="Available After Claim Capabilities"
      className="bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(16,24,20,0.035)]"
    >
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EEEEEB] dark:border-border-divider">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.24em] text-[#3568C8] dark:text-primary font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>03 &bull; Available After Claim</span>
          </div>
          <h3 className="text-lg sm:text-xl font-display font-semibold text-foreground mt-1">
            Continuous Infrastructure Memory Capabilities
          </h3>
          <p className="text-xs sm:text-sm text-[#5F625F] dark:text-muted-foreground font-sans mt-0.5">
            These capabilities activate automatically when this domain is claimed into a Workspace.
          </p>
        </div>

        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium self-start sm:self-auto">
          Workspace Memory
        </span>
      </div>

      {/* 2. Three Calm Capability Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {capabilities.map((cap) => {
          const IconComponent = getCapabilityIcon(cap.iconType);
          return (
            <div
              key={cap.id}
              className="p-5 rounded-xl bg-[#F8F9FA] dark:bg-muted/20 border border-[#E5E7EB] dark:border-border flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {cap.temporalScope}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-foreground font-display">
                  {cap.title}
                </h4>

                <p className="text-xs text-[#5F625F] dark:text-muted-foreground font-sans leading-relaxed">
                  {cap.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Epistemic Clarification */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-foreground/90 leading-relaxed font-sans">
          <strong className="font-semibold text-foreground">Architectural boundary:</strong> GX gives you complete analytical depth for the current point in time. Authenticated Workspace provides continuous memory and drift detection across time.
        </div>
      </div>
    </section>
  );
};
