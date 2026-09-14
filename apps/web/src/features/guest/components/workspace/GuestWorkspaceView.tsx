import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  type GuestWorkspaceTabId,
  adaptAssessmentDataToGuestWorkspace,
} from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';
import type { AssessmentData } from '../../types/index.ts';

import { GuestWorkspaceHeader } from './GuestWorkspaceHeader.tsx';
import { GuestWorkspaceNav } from './GuestWorkspaceNav.tsx';
import { GuestOverviewSurface } from './GuestOverviewSurface.tsx';
import { GuestArchitectureSurface } from './GuestArchitectureSurface.tsx';
import { GuestInfrastructureSurface } from './GuestInfrastructureSurface.tsx';
import { GuestFindingsSurface } from './GuestFindingsSurface.tsx';
import { GuestEvidenceSurface } from './GuestEvidenceSurface.tsx';
import { GuestHistoryLockedPreview } from './GuestHistoryLockedPreview.tsx';
import { GuestFooterSignature } from '../gx-f-01-footer-signature';

interface GuestWorkspaceViewProps {
  domain: string;
  assessmentData: AssessmentData | null;
  sessionId?: string;
  jobId?: string;
  onReset: () => void;
  onClaim: () => void;
  mode?: import('../../../../hooks/useTheme').ThemeMode;
  setMode?: (m: import('../../../../hooks/useTheme').ThemeMode) => void;
  className?: string;
}

export const GuestWorkspaceView: React.FC<GuestWorkspaceViewProps> = ({
  domain,
  assessmentData,
  sessionId,
  jobId,
  onReset,
  onClaim,
  mode,
  setMode,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<GuestWorkspaceTabId>('overview');

  const viewModel = useMemo(() => {
    return adaptAssessmentDataToGuestWorkspace(domain, assessmentData, sessionId, jobId);
  }, [domain, assessmentData, sessionId, jobId]);

  return (
    <div
      className={`min-h-screen bg-background text-foreground flex flex-col transition-colors selection:bg-primary/20 ${className}`}
      data-testid="guest-workspace-root"
    >
      {/* 1. Sticky Header with Domain Context & Action Bridge */}
      <GuestWorkspaceHeader
        domain={domain}
        onReset={onReset}
        onClaim={onClaim}
      />

      {/* 2. Interactive Navigation Bar */}
      <GuestWorkspaceNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        findingsCount={viewModel.findings.length}
        evidenceCount={viewModel.rawEvidenceRecords.length}
      />

      {/* 3. Primary Analytical Workspace Surface */}
      <main
        role="main"
        aria-label="Guest Workspace Surface"
        className="flex-1 max-w-[1560px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="w-full"
          >
            {activeTab === 'overview' && (
              <GuestOverviewSurface
                viewModel={viewModel}
                onNavigateTab={setActiveTab}
                onClaim={onClaim}
              />
            )}

            {activeTab === 'architecture' && (
              <GuestArchitectureSurface
                viewModel={viewModel}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'infrastructure' && (
              <GuestInfrastructureSurface
                domain={domain}
                viewModel={viewModel}
                onNavigateTab={setActiveTab}
                onClaim={onClaim}
              />
            )}

            {activeTab === 'findings' && (
              <GuestFindingsSurface
                viewModel={viewModel}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'evidence' && (
              <GuestEvidenceSurface
                viewModel={viewModel}
              />
            )}

            {activeTab === 'history' && (
              <GuestHistoryLockedPreview
                viewModel={viewModel}
                onClaim={onClaim}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 4. Calm Premium Product Signature Footer (GX-F-01) */}
      <GuestFooterSignature mode={mode} setMode={setMode} />
    </div>
  );
};
