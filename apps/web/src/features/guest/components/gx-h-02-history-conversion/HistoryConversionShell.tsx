import React from 'react';
import type { GuestWorkspaceViewModel } from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';
import {
  deriveDemonstratedIntelligenceSummary,
  getCanonicalConversionPanelContent,
} from '../../contracts/gx-h-02-history-conversion.contract.ts';
import { DemonstratedIntelligencePanel } from './DemonstratedIntelligencePanel';
import { RememberThisConversionPanel } from './RememberThisConversionPanel';

interface HistoryConversionShellProps {
  viewModel: GuestWorkspaceViewModel;
  onClaim: () => void;
}

export const HistoryConversionShell: React.FC<HistoryConversionShellProps> = ({
  viewModel,
  onClaim,
}) => {
  const summary = deriveDemonstratedIntelligenceSummary(viewModel);
  const conversionContent = getCanonicalConversionPanelContent();

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start animate-in fade-in duration-300"
      aria-label="History & Drift Premium Conversion Surface"
    >
      {/* 1. Left Side — Demonstrated Intelligence */}
      <div className="lg:col-span-7">
        <DemonstratedIntelligencePanel summary={summary} />
      </div>

      {/* 2. Right Side — Conversion Surface (Sticky / Adjacent) */}
      <div className="lg:col-span-5 lg:sticky lg:top-6">
        <RememberThisConversionPanel content={conversionContent} onClaim={onClaim} />
      </div>
    </div>
  );
};
