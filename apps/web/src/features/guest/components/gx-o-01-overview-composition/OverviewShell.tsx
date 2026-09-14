import React from 'react';
import type {
  GuestWorkspaceViewModel,
  GuestWorkspaceTabId,
} from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';
import { ExecutiveUnderstanding } from './ExecutiveUnderstanding.tsx';
import { WhatMattersNow } from './WhatMattersNow.tsx';
import { InfrastructureSummary } from './InfrastructureSummary.tsx';
import { ArchitectureSurface } from './ArchitectureSurface.tsx';
import { PositiveObservations } from './PositiveObservations.tsx';
import { UnobservableBoundary } from './UnobservableBoundary.tsx';

interface OverviewShellProps {
  viewModel: GuestWorkspaceViewModel;
  onNavigateTab: (tabId: GuestWorkspaceTabId) => void;
  onClaim?: () => void;
  className?: string;
}

export const OverviewShell: React.FC<OverviewShellProps> = ({
  viewModel,
  onNavigateTab,
  className = '',
}) => {
  return (
    <div
      data-testid="gx-overview-shell"
      className={`space-y-8 animate-in fade-in duration-300 ${className}`}
    >
      {/* 1. Primary Anchor: Executive Understanding with Compact Strip */}
      <ExecutiveUnderstanding
        viewModel={viewModel}
        onInspectWire={() => onNavigateTab('evidence')}
      />

      {/* 2. Second Anchor: What Matters Now */}
      <WhatMattersNow
        findings={viewModel.findings}
        onInspectFinding={() => onNavigateTab('findings')}
        onViewAllFindings={() => onNavigateTab('findings')}
      />

      {/* 3. Canonical Matrix: Infrastructure Summary */}
      <InfrastructureSummary
        viewModel={viewModel}
        onViewFullInfrastructure={() => onNavigateTab('infrastructure')}
      />

      {/* 4. Multi-Hop Pipeline: Observed Architecture */}
      <ArchitectureSurface
        ingressHops={viewModel.ingressHops}
        onInspectHopEvidence={() => onNavigateTab('evidence')}
      />

      {/* 5. Positive Hygiene: Confirmed Controls */}
      <PositiveObservations viewModel={viewModel} />

      {/* 6. Epistemic Credibility: Unobservable Boundary */}
      <UnobservableBoundary />
    </div>
  );
};

export default OverviewShell;
