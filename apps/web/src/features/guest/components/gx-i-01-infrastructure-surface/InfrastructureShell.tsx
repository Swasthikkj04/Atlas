import React, { useMemo } from 'react';
import { ArrowRight, Terminal } from 'lucide-react';
import type {
  GuestWorkspaceViewModel,
  GuestWorkspaceTabId,
} from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';
import {
  resolveCanonicalInfrastructureRows,
  synthesizeInfrastructureSummaryInterpretation,
  getCanonicalObservationBoundaryDimensions,
} from '../../contracts/gx-i-01-infrastructure-surface.contract.ts';
import { InfrastructureSummarySection } from './InfrastructureSummarySection.tsx';
import { WhatThisTellsUsSection } from './WhatThisTellsUsSection.tsx';
import { ObservationBoundarySection } from './ObservationBoundarySection.tsx';

interface InfrastructureShellProps {
  domain: string;
  viewModel?: GuestWorkspaceViewModel | null;
  technologies?: any[];
  evidenceList?: any[];
  observations?: any[];
  infrastructure?: any;
  onNavigateTab: (tabId: GuestWorkspaceTabId) => void;
  className?: string;
}

export const InfrastructureShell: React.FC<InfrastructureShellProps> = ({
  domain,
  viewModel,
  technologies,
  evidenceList,
  observations,
  infrastructure,
  onNavigateTab,
  className = '',
}) => {
  const effectiveDomain = domain || viewModel?.domain || 'Target Domain';

  // 1. Resolve canonical infrastructure rows with progressive disclosure
  const canonicalRows = useMemo(() => {
    return resolveCanonicalInfrastructureRows(
      effectiveDomain,
      viewModel,
      technologies,
      evidenceList,
      observations,
      infrastructure
    );
  }, [effectiveDomain, viewModel, technologies, evidenceList, observations, infrastructure]);

  // 2. Synthesize architectural interpretation
  const interpretation = useMemo(() => {
    return synthesizeInfrastructureSummaryInterpretation(effectiveDomain, canonicalRows);
  }, [effectiveDomain, canonicalRows]);

  // 3. Epistemic limits & observation boundaries
  const boundaryDimensions = useMemo(() => {
    return getCanonicalObservationBoundaryDimensions();
  }, []);

  return (
    <div className={`space-y-8 animate-in fade-in duration-300 ${className}`} data-testid="guest-infrastructure-surface">
      {/* Top Session Context Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
          <span className="font-semibold text-foreground">{effectiveDomain}</span>
          <span>&bull;</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Ephemeral Session</span>
          </span>
        </div>

        <div className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
          Public perimeter understanding &bull; No account required
        </div>
      </div>

      {/* 01: Infrastructure Summary (Canonical List & Progressive Disclosure) */}
      <InfrastructureSummarySection
        domain={effectiveDomain}
        rows={canonicalRows}
        onNavigateTab={onNavigateTab}
      />

      {/* 02: What This Tells Us (Synthesized Interpretation) */}
      <WhatThisTellsUsSection
        domain={effectiveDomain}
        headline={interpretation.headline}
        narrative={interpretation.narrative}
      />

      {/* 03: Observation Boundary (Epistemic Limits) */}
      <ObservationBoundarySection dimensions={boundaryDimensions} />

      {/* 04: Bottom Evidence Jump Bar */}
      <div className="p-6 rounded-2xl bg-[#F8F9FA] dark:bg-muted/20 border border-[#E5E7EB] dark:border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-foreground font-semibold">
            <Terminal className="w-4 h-4 text-primary" />
            <span>04 &bull; Inspect Verified Signals</span>
          </div>
          <p className="text-xs text-[#5F625F] dark:text-muted-foreground font-sans">
            Inspect raw cryptographic certificates, DNS records, and HTTP header evidence.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('evidence')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-medium text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm shrink-0"
        >
          <span>Inspect verified signals</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
