import React from 'react';
import type {
  GuestWorkspaceViewModel,
  GuestWorkspaceTabId,
} from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';
import { ArchitectureShell } from '../gx-a-01-architecture-topology/ArchitectureShell.tsx';

interface GuestArchitectureSurfaceProps {
  viewModel: GuestWorkspaceViewModel;
  onNavigateTab: (tabId: GuestWorkspaceTabId) => void;
}

/**
 * Authoritative Guest Architecture Surface (GX-A-01)
 *
 * Implements the verified public-perimeter architecture model:
 * 01 OBSERVED ARCHITECTURE (Hero ingress flow)
 *    -> Public Client -> Edge / Gateway -> Origin / Cloud -> Internal Boundary
 * 02 WHAT NEBULA UNDERSTANDS (Meaning layer)
 * 03 ARCHITECTURE COMPONENTS (Restrained categorized list)
 * 04 UNOBSERVABLE DIMENSIONS (Epistemic limits)
 * 05 EVIDENCE INSPECTION (Signal deep links)
 */
export const GuestArchitectureSurface: React.FC<GuestArchitectureSurfaceProps> = ({
  viewModel,
  onNavigateTab,
}) => {
  return (
    <ArchitectureShell
      viewModel={viewModel}
      onNavigateTab={onNavigateTab}
    />
  );
};

export default GuestArchitectureSurface;
