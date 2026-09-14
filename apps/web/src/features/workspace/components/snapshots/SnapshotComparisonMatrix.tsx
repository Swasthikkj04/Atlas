import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  GitCompare,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import type { InfrastructureSnapshotDto } from '../../../../types/api';
import { useSnapshotDiff } from '../../../../hooks/queries/useSnapshotDiff';
import { SnapshotDriftForensicsView } from './SnapshotDriftForensicsView';

export interface SnapshotComparisonMatrixProps {
  readonly domainId: string;
  readonly domainName?: string;
  readonly snapshots: readonly InfrastructureSnapshotDto[];
  readonly defaultTargetId?: string;
  readonly defaultBaseId?: string;
  readonly className?: string;
}

export const SnapshotComparisonMatrix: React.FC<SnapshotComparisonMatrixProps> = ({
  domainId,
  snapshots,
  defaultTargetId,
  defaultBaseId,
  className = '',
}) => {
  // Sort snapshots newest first
  const sortedSnapshots = useMemo(() => {
    return [...snapshots].sort((a, b) => {
      const timeA = new Date(a.capturedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.capturedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [snapshots]);

  const [targetId, setTargetId] = useState<string>(
    defaultTargetId || sortedSnapshots[0]?.id || ''
  );
  const [baseId, setBaseId] = useState<string>(
    defaultBaseId || sortedSnapshots[1]?.id || ''
  );

  const { data: diffData, isLoading, error } = useSnapshotDiff(
    domainId,
    targetId,
    baseId || undefined
  );

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return 'Unknown date';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  if (sortedSnapshots.length < 2) {
    return (
      <div className="p-8 text-center rounded-lg border border-neutral-800 bg-neutral-900/30">
        <GitCompare className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
        <h4 className="text-sm font-medium text-neutral-200">
          Insufficient Historical Snapshots
        </h4>
        <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
          At least 2 snapshots are required to perform deep forensic drift analysis and visual change detection.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} data-testid="snapshot-comparison-matrix">
      {/* Comparison Selector Controls */}
      <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Baseline (Left) */}
        <div className="w-full md:w-5/12 space-y-1">
          <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider block">
            Baseline Snapshot (A)
          </label>
          <div className="relative">
            <select
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
              className="w-full appearance-none bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-blue-500"
              data-testid="base-snapshot-select"
            >
              {sortedSnapshots.map((snap) => (
                <option key={snap.id} value={snap.id} disabled={snap.id === targetId}>
                  {snap.id.slice(0, 10)} — {formatTimestamp(snap.capturedAt || snap.createdAt)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Direction Indicator */}
        <div className="shrink-0 flex items-center justify-center p-2 rounded-full bg-neutral-800 text-neutral-400">
          <ArrowRight className="w-4 h-4" />
        </div>

        {/* Target (Right) */}
        <div className="w-full md:w-5/12 space-y-1">
          <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider block">
            Target Comparison Snapshot (B)
          </label>
          <div className="relative">
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full appearance-none bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-blue-500"
              data-testid="target-snapshot-select"
            >
              {sortedSnapshots.map((snap) => (
                <option key={snap.id} value={snap.id} disabled={snap.id === baseId}>
                  {snap.id.slice(0, 10)} — {formatTimestamp(snap.capturedAt || snap.createdAt)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Loading & Content View */}
      {isLoading && (
        <div className="p-12 text-center border border-neutral-800 rounded-lg bg-neutral-900/20">
          <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto mb-2" />
          <p className="text-xs font-mono text-neutral-400">
            Synthesizing deep forensic snapshot diff...
          </p>
        </div>
      )}

      {error && !isLoading && (
        <div className="p-6 text-center border border-rose-900/50 rounded-lg bg-rose-950/20 text-rose-300">
          <p className="text-xs font-mono">
            Failed to compute snapshot drift forensics: {(error as Error).message}
          </p>
        </div>
      )}

      {diffData && !isLoading && (
        <SnapshotDriftForensicsView driftData={diffData} />
      )}
    </div>
  );
};
