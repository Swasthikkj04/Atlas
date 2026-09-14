import React from 'react';
import type {
  GuestWorkspaceViewModel,
  GuestWorkspaceTabId,
} from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';
import { OverviewShell } from '../gx-o-01-overview-composition/OverviewShell.tsx';

interface GuestOverviewSurfaceProps {
  viewModel: GuestWorkspaceViewModel;
  onNavigateTab: (tabId: GuestWorkspaceTabId) => void;
  onClaim: () => void;
}

/**
 * GX-O-01: Guest Overview Surface
 *
 * Implements canonical progressive disclosure intelligence hierarchy:
 * 1. Executive Understanding (Synthesized Perimeter Intelligence + Restrained Strip)
 * 2. What Matters Now (Primary Attention / Stable Baseline)
 * 3. Infrastructure Understanding (Canonical 10-Category Matrix)
 * 4. Observed Architecture (Telemetry-backed Ingress Pipeline)
 * 5. Positive Observations (Confirmed Hygiene)
 * 6. Unobservable Boundary (Epistemic Honesty)
 */
export const GuestOverviewSurface: React.FC<GuestOverviewSurfaceProps> = ({
  viewModel,
  onNavigateTab,
  onClaim,
}) => {
  return (
    <OverviewShell
      viewModel={viewModel}
      onNavigateTab={onNavigateTab}
      onClaim={onClaim}
    />
  );
};

export default GuestOverviewSurface;
