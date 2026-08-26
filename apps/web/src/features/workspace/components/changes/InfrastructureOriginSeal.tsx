import React from 'react';
import type { InfrastructureOriginDetails } from '../../contracts/infinite-timeline.contract';

export interface InfrastructureOriginSealProps {
  readonly originDetails: InfrastructureOriginDetails | null;
  readonly className?: string;
}

/**
 * Infrastructure Origin Seal (WX-1026).
 *
 * Implements the authoritative terminal boundary when the timeline reaches
 * the very beginning of recorded infrastructure memory:
 * - Honest closure proving no earlier history exists
 * - Explicitly surfaces the initial baseline snapshot and date
 * - Calm, institutional typography
 */
export const InfrastructureOriginSeal: React.FC<InfrastructureOriginSealProps> = ({
  originDetails,
  className = '',
}) => {
  return (
    <div
      className={`w-full py-8 sm:py-12 flex flex-col items-center justify-center space-y-4 ${className}`}
      data-testid="infrastructure-origin-seal"
    >
      <div className="w-full flex items-center gap-4">
        <div className="h-px flex-1 bg-[#E1E1DC] dark:bg-border" />
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.03)]">
          <span className="w-2 h-2 rounded-full bg-[#178A68] shrink-0" />
          <span className="font-mono text-[10px] sm:text-xs font-semibold tracking-wider text-foreground uppercase">
            INFRASTRUCTURE ORIGIN
          </span>
        </div>
        <div className="h-px flex-1 bg-[#E1E1DC] dark:bg-border" />
      </div>

      <div className="text-center space-y-1 max-w-md px-4">
        <p className="text-xs text-[#5F625F] dark:text-muted-foreground font-mono uppercase tracking-wider">
          First verified understanding
        </p>
        <p className="text-sm font-medium text-foreground font-sans">
          {originDetails?.originDateFormatted || 'Initial baseline established'}
        </p>
        <p className="text-[11px] text-[#5F625F] dark:text-muted-foreground font-mono">
          {originDetails?.originSnapshotId
            ? `Snapshot ${originDetails.originSnapshotId.slice(0, 14)} · Initial Baseline`
            : 'Initial baseline · Timeline genesis'}
        </p>
      </div>
    </div>
  );
};

InfrastructureOriginSeal.displayName = 'InfrastructureOriginSeal';
