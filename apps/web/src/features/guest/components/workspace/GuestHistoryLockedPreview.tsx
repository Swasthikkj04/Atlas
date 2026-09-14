import React from 'react';
import type { GuestWorkspaceViewModel } from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';
import { HistoryConversionShell } from '../gx-h-02-history-conversion';

interface GuestHistoryLockedPreviewProps {
  viewModel: GuestWorkspaceViewModel;
  onClaim: () => void;
}

export const GuestHistoryLockedPreview: React.FC<GuestHistoryLockedPreviewProps> = ({
  viewModel,
  onClaim,
}) => {
  return <HistoryConversionShell viewModel={viewModel} onClaim={onClaim} />;
};
