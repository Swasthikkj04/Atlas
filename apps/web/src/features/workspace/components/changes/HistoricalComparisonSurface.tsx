import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Eyebrow, TechnicalSmall } from '../../../../components/typography';
import { Stack, Cluster, ReadingSurface } from '../../../../components/layout';
import { LoadingState, UnavailableState } from '../../../../components/states';
import { useSnapshots } from '../../../../hooks/queries/useSnapshots';
import { useTimeline } from '../../../../hooks/queries/useTimeline';
import { resolveHistoricalSnapshotComparison } from '../../contracts/snapshot-comparison.contract';
import { getSnapshotsArray, getTimelineEventsArray } from '../../contracts/changes.contract';
import { ChangeStoryCard } from './ChangeStoryCard';
import { InfrastructureDriftForensicsVisualizer } from './InfrastructureDriftForensicsVisualizer';
import { DomainFavicon } from '../identity';
import type { HistoricalComparisonSurfaceProps } from './HistoricalComparisonSurface.types';

/**
 * Authoritative Historical Snapshot Comparison Surface (WX-1008).
 *
 * Explains: "What was different between these two verified understandings?"
 *
 * Invariants:
 * - Compares strictly immutable, verified snapshots for the active domain.
 * - Shows authoritative differences (ChangeStoryCards) and verified unchanged components.
 * - Strictly prohibits client-side JSON/heuristic diffing.
 * - Handles honest "No changes detected" states.
 */
export const HistoricalComparisonSurface: React.FC<HistoricalComparisonSurfaceProps> = ({
  domainId,
  domainName,
  baseSnapshotId: initialBaseSnapshotId,
  targetSnapshotId: initialTargetSnapshotId,
  onReturn,
  onInvestigateChange,
  onViewEvidence,
  onSelectSnapshots,
  className = '',
}) => {
  const snapshotsQuery = useSnapshots(domainId);
  const timelineQuery = useTimeline({ domainId });

  const snapshots = getSnapshotsArray(snapshotsQuery.data);
  const timelineEvents = getTimelineEventsArray(timelineQuery.data);

  // Default to latest snapshot as target and preceding as base if not explicitly provided
  const validSnapshots = snapshots.filter(
    (s) => Boolean(s.id) && Boolean(s.capturedAt || s.createdAt)
  );

  const defaultTargetId = validSnapshots[0]?.id || null;
  const defaultBaseId = validSnapshots[1]?.id || defaultTargetId;

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(
    initialTargetSnapshotId || defaultTargetId
  );
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(
    initialBaseSnapshotId || defaultBaseId
  );

  const targetId = selectedTargetId || defaultTargetId;
  const baseId = selectedBaseId || defaultBaseId;

  const isLoading = snapshotsQuery.isLoading || timelineQuery.isLoading;

  if (isLoading) {
    return (
      <div className={`w-full py-16 flex items-center justify-center ${className}`} data-testid="historical-comparison-loading">
        <LoadingState
          label="Loading historical snapshots..."
          description="Retrieving verified snapshot records and comparison intelligence"
        />
      </div>
    );
  }

  const comparisonResult = resolveHistoricalSnapshotComparison({
    domainId,
    domainName,
    baseSnapshotId: baseId,
    targetSnapshotId: targetId,
    snapshots: validSnapshots,
    timelineEvents,
  });

  const handleBaseChange = (newBaseId: string) => {
    setSelectedBaseId(newBaseId);
    if (targetId && onSelectSnapshots) {
      onSelectSnapshots(newBaseId, targetId);
    }
  };

  const handleTargetChange = (newTargetId: string) => {
    setSelectedTargetId(newTargetId);
    if (baseId && onSelectSnapshots) {
      onSelectSnapshots(baseId, newTargetId);
    }
  };

  return (
    <Stack gap="xl" className={`relative z-10 w-full ${className}`} data-testid="historical-comparison-surface">
      {/* 1. Return Navigation Action & Surface Title */}
      <Cluster justify="between" align="center" gap="md" className="w-full">
        {onReturn && (
          <button
            type="button"
            onClick={onReturn}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Changes</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <DomainFavicon domain={domainName} size="compact" />
          <TechnicalSmall variant="muted" className="text-xs font-mono">
            {domainName} · Historical Comparison
          </TechnicalSmall>
        </div>
      </Cluster>

      {/* 2. Headline & Snapshot Comparison Controller */}
      <ReadingSurface>
        <div className="bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-xl p-6 space-y-6 shadow-[0_1px_2px_rgba(16,24,20,0.035)]">
          <Cluster justify="between" align="center" gap="sm">
            <Eyebrow variant="muted" className="font-mono text-xs uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
              Historical Comparison
            </Eyebrow>
            <div className="flex items-center gap-2">
              <DomainFavicon domain={domainName} size="compact" />
              <span className="font-mono text-xs text-[#5F625F] dark:text-muted-foreground">
                {domainName}
              </span>
            </div>
          </Cluster>

          {/* Interactive Snapshot Pair Selection Controls */}
          {validSnapshots.length >= 2 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Target (Current) Snapshot */}
              <div className="bg-[#FAFAF8] dark:bg-surface-secondary p-4 rounded-lg border border-[#E7E7E3] dark:border-border space-y-2">
                <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
                  Target understanding
                </span>
                <select
                  value={targetId || ''}
                  onChange={(e) => handleTargetChange(e.target.value)}
                  className="w-full bg-[#FFFFFF] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border text-foreground text-xs font-mono rounded px-2.5 py-1.5"
                  data-testid="target-snapshot-select"
                >
                  {validSnapshots.map((s) => {
                    const dateStr = new Date(s.capturedAt || s.createdAt || '').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    return (
                      <option key={s.id} value={s.id}>
                        {dateStr} · Snapshot {s.id.slice(0, 8)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Base (Previous) Snapshot */}
              <div className="bg-[#FAFAF8] dark:bg-surface-secondary p-4 rounded-lg border border-[#E7E7E3] dark:border-border space-y-2">
                <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
                  Compared against
                </span>
                <select
                  value={baseId || ''}
                  onChange={(e) => handleBaseChange(e.target.value)}
                  className="w-full bg-[#FFFFFF] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border text-foreground text-xs font-mono rounded px-2.5 py-1.5"
                  data-testid="base-snapshot-select"
                >
                  {validSnapshots.map((s) => {
                    const dateStr = new Date(s.capturedAt || s.createdAt || '').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    return (
                      <option key={s.id} value={s.id}>
                        {dateStr} · Snapshot {s.id.slice(0, 8)}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#5F625F] dark:text-muted-foreground">
              {comparisonResult.description}
            </p>
          )}
        </div>
      </ReadingSurface>

      {/* 3. Comparison Results Display */}
      {comparisonResult.status === 'READY' ? (
        <Stack gap="xl" className="w-full">
          {/* Real-Time Infrastructure Drift & Change Forensics Visualizer (Move 3) */}
          <InfrastructureDriftForensicsVisualizer
            comparisonResult={comparisonResult}
            onInvestigateChange={onInvestigateChange}
            onViewEvidence={onViewEvidence}
          />

          {/* Section A: Changes Detected */}
          {comparisonResult.changes.length > 0 ? (
            <Stack gap="md" className="w-full">
              <Cluster justify="between" align="center" className="w-full pb-2 border-b border-[#EEEEEB] dark:border-border-divider">
                <span className="text-xs font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground font-semibold">
                  Changes Detected ({comparisonResult.changes.length})
                </span>
                <span className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
                  Verified Differences
                </span>
              </Cluster>

              <div className="grid grid-cols-1 gap-4">
                {comparisonResult.changes.map((change) => (
                  <ChangeStoryCard
                    key={change.changeId}
                    change={change}
                    onInvestigate={onInvestigateChange}
                    onViewEvidence={onViewEvidence}
                  />
                ))}
              </div>
            </Stack>
          ) : (
            <div className="p-8 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card text-center space-y-2 shadow-[0_1px_2px_rgba(16,24,20,0.035)]">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
                No Meaningful Changes Detected
              </span>
              <p className="text-xs text-[#5F625F] dark:text-muted-foreground max-w-md mx-auto">
                No differences observed between the verified understanding from{' '}
                {new Date(comparisonResult.targetSnapshot?.capturedAt || '').toLocaleDateString()} and{' '}
                {new Date(comparisonResult.baseSnapshot?.capturedAt || '').toLocaleDateString()}.
              </p>
            </div>
          )}

          {/* Section B: Unchanged Components */}
          {comparisonResult.unchangedComponents.length > 0 && (
            <Stack gap="md" className="w-full">
              <Cluster justify="between" align="center" className="w-full pb-2 border-b border-[#EEEEEB] dark:border-border-divider">
                <span className="text-xs font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground font-semibold">
                  Unchanged Components ({comparisonResult.unchangedComponents.length})
                </span>
                <span className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
                  Verified Consistent State
                </span>
              </Cluster>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {comparisonResult.unchangedComponents.map((comp, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#FAFAF8] dark:bg-surface-secondary border border-[#E7E7E3] dark:border-border rounded-lg flex items-center gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#178A68] shrink-0" />
                    <span className="font-mono text-xs text-foreground truncate">
                      {comp}
                    </span>
                  </div>
                ))}
              </div>
            </Stack>
          )}
        </Stack>
      ) : (
        <UnavailableState
          title={comparisonResult.headline}
          description={comparisonResult.description}
        />
      )}
    </Stack>
  );
};

HistoricalComparisonSurface.displayName = 'HistoricalComparisonSurface';
