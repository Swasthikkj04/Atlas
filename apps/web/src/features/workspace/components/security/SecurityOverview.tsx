import React, { useState } from 'react';
import { useWorkspaceSecurity } from '../../../../hooks/queries/useSecurity';
import { LoadingState, ErrorState, UnavailableState } from '../../../../components/states';
import { SecurityBrief } from './SecurityBrief';
import { SecurityPillarsMatrix } from './SecurityPillarsMatrix';
import { SecurityFindingsList } from './SecurityFindingsList';
import type { SecurityPillarCode } from '../../contracts/security-experience.contract';

export interface SecurityOverviewProps {
  domainId?: string | null;
  onSelectFinding?: (findingId: string) => void;
  className?: string;
}

export const SecurityOverview: React.FC<SecurityOverviewProps> = ({
  domainId,
  onSelectFinding,
  className = '',
}) => {
  const [selectedPillarCode, setSelectedPillarCode] = useState<SecurityPillarCode | null>(null);

  const { data, isLoading, error, refetch } = useWorkspaceSecurity(domainId);

  if (!domainId) {
    return (
      <div className={`w-full py-12 flex justify-center ${className}`}>
        <div className="w-full max-w-2xl">
          <UnavailableState
            title="No Domain Selected"
            description="Select an active domain from the sidebar to inspect its defense posture and security pillars."
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`w-full py-16 flex items-center justify-center ${className}`}>
        <LoadingState
          label="Synthesizing security posture and pillars..."
          description="Aggregating transport encryption, perimeter exposure, DNS hygiene, and session invariants"
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`w-full py-8 flex justify-center ${className}`}>
        <div className="w-full max-w-2xl">
          <ErrorState
            error={error || new Error('Failed to load security intelligence')}
            title="Failed to Load Security Overview"
            description="Could not retrieve the authoritative security brief and pillar synthesis for this domain."
            retryLabel="Retry"
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  const handleSelectHighlight = (highlightId: string) => {
    // If the highlight matches an active finding ID, open investigation drawer
    const matchingFinding = data.securityFindings.find((f) => f.id === highlightId);
    if (matchingFinding && onSelectFinding) {
      onSelectFinding(matchingFinding.id);
    }
  };

  return (
    <div
      data-testid="security-overview-tab"
      className={`flex flex-col gap-8 pb-12 ${className}`}
    >
      {/* 1. Security Executive Brief Card */}
      <SecurityBrief
        brief={data.securityBrief}
        onSelectHighlight={handleSelectHighlight}
      />

      {/* 2. Interactive 7 Security Pillars Matrix (S1 - S7) */}
      <SecurityPillarsMatrix
        pillars={data.securityPillars}
        selectedPillarCode={selectedPillarCode}
        onSelectPillar={setSelectedPillarCode}
      />

      {/* 3. Active Security Findings List with 1-Click Investigation Drawer */}
      <SecurityFindingsList
        findings={data.securityFindings}
        selectedPillarCode={selectedPillarCode}
        onSelectFinding={(id) => onSelectFinding?.(id)}
      />
    </div>
  );
};
