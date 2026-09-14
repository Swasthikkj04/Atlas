import React from 'react';
import type { GuestWorkspaceViewModel } from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';
import {
  deriveGenesisBaselineArtifact,
  buildMeaningfulHistoryTimeline,
  getAvailableAfterClaimCapabilities,
} from '../../contracts/gx-h-01-history-drift.contract.ts';
import { GenesisBaselineCard } from './GenesisBaselineCard';
import { MeaningfulTimeline } from './MeaningfulTimeline';
import { AvailableAfterClaimSection } from './AvailableAfterClaimSection';
import { ClaimMemoryBridgeAction } from './ClaimMemoryBridgeAction';
import { DomainFavicon } from '../../../workspace/components/identity/DomainFavicon';
import { Clock, History } from 'lucide-react';

interface HistoryDriftShellProps {
  viewModel: GuestWorkspaceViewModel;
  onClaim: () => void;
}

export const HistoryDriftShell: React.FC<HistoryDriftShellProps> = ({
  viewModel,
  onClaim,
}) => {
  const artifact = deriveGenesisBaselineArtifact(viewModel);
  const timelineNodes = buildMeaningfulHistoryTimeline(viewModel);
  const capabilities = getAvailableAfterClaimCapabilities();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Surface Context */}
      <section
        aria-label="History & Drift Intelligence Header"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border shadow-[0_1px_3px_rgba(16,24,20,0.035)]"
      >
        <div className="flex items-center gap-3.5">
          <DomainFavicon domain={artifact.domain} size="primary" />
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.24em] text-[#3568C8] dark:text-primary font-semibold">
              <History className="w-3.5 h-3.5" />
              <span>History &bull; Temporal Drift Intelligence</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              Observation Baseline &amp; Temporal Continuity
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#5F625F] dark:text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-xl border border-border/70 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>Single-Point Observation Mode</span>
        </div>
      </section>

      {/* 2. Canonical Section 01: Genesis Baseline (Dominant Artifact) */}
      <GenesisBaselineCard artifact={artifact} />

      {/* 3. Canonical Section 02: Meaningful Temporal Timeline */}
      <MeaningfulTimeline nodes={timelineNodes} />

      {/* 4. Canonical Section 03: Available After Claim Capabilities */}
      <AvailableAfterClaimSection capabilities={capabilities} />

      {/* 5. Canonical Section 04: Claim Bridge Action */}
      <ClaimMemoryBridgeAction artifact={artifact} onClaim={onClaim} />
    </div>
  );
};
