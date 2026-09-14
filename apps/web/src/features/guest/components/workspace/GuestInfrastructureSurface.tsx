import React from 'react';
import type {
  GuestWorkspaceViewModel,
  GuestWorkspaceTabId,
} from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';
import { InfrastructureShell } from '../gx-i-01-infrastructure-surface/InfrastructureShell.tsx';

interface GuestInfrastructureSurfaceProps {
  domain: string;
  viewModel: GuestWorkspaceViewModel;
  technologies?: any[];
  evidenceList?: any[];
  observations?: any[];
  infrastructure?: any;
  onNavigateTab: (tabId: GuestWorkspaceTabId) => void;
  onClaim?: () => void;
  className?: string;
}

/**
 * Authoritative Guest Infrastructure Surface (GX-I-01)
 *
 * Implements the verified public-perimeter infrastructure intelligence model:
 * 01 INFRASTRUCTURE SUMMARY (Canonical categories & progressive disclosure)
 *    -> Edge & CDN · Web Server · DNS · TLS / SSL · IP & Endpoints · Public Ports
 * 02 WHAT THIS TELLS US (Synthesized perimeter interpretation)
 * 03 OBSERVATION BOUNDARY (Epistemic limits on unobservable private systems)
 * 04 EVIDENCE DEEP LINKING (Inspect verified signals)
 */
export const GuestInfrastructureSurface: React.FC<GuestInfrastructureSurfaceProps> = ({
  domain,
  viewModel,
  technologies,
  evidenceList,
  observations,
  infrastructure,
  onNavigateTab,
  className = '',
}) => {
  return (
    <InfrastructureShell
      domain={domain}
      viewModel={viewModel}
      technologies={technologies}
      evidenceList={evidenceList}
      observations={observations}
      infrastructure={infrastructure || viewModel?.infrastructure}
      onNavigateTab={onNavigateTab}
      className={className}
    />
  );
};

export default GuestInfrastructureSurface;
