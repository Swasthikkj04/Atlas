import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  History,
  Layers,
  Clock,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Milestone,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import {
  Display,
  SectionTitle,
  Eyebrow,
  Technical,
  TechnicalSmall,
} from '../../../../components/typography';
import { Stack, Cluster, ReadingSurface, Section } from '../../../../components/layout';
import {
  LoadingState,
  UnavailableState,
  ErrorState,
  EmptyState,
} from '../../../../components/states';
import { useSnapshots, useSnapshot } from '../../../../hooks/queries/useSnapshots';
import {
  resolveSnapshotHistoryState,
  resolveSelectedSnapshot,
  extractSnapshotInfrastructureState,
  getSnapshotsArray,
  SNAPSHOT_HISTORY_COPY,
} from '../../contracts/snapshot-history.contract';
import type { SnapshotHistoryProps } from './SnapshotHistory.types';

/**
 * Authoritative Snapshot History Experience (WX-504).
 *
 * Answers: "What did my infrastructure look like at that point in time?"
 * - Consumes authoritative immutable snapshot APIs directly
 * - Strictly avoids client-side diffing, synthetic chronology sorting, or health scores
 * - Features progressive disclosure: Summary → Infrastructure State → Lineage → Evidence → Raw JSON
 * - Handles single-snapshot baseline and zero-snapshot domains truthfully
 * - Enforces P0 tenant/domain isolation boundary
 */
export const SnapshotHistory: React.FC<SnapshotHistoryProps> = ({
  domainId,
  domainName,
  snapshotId: requestedSnapshotId,
  initialSnapshots,
  initialSnapshotDetail,
  onReturn,
  onSelectSnapshot,
  onViewEvidence,
  onViewRelatedChange,
  onViewRelatedFinding,
  onViewHistoricalContext,
  className = '',
  ...rest
}) => {
  const [isRawJsonExpanded, setIsRawJsonExpanded] = useState(false);
  const [hasCopiedRaw, setHasCopiedRaw] = useState(false);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    requestedSnapshotId || null
  );

  const activeSnapshotId = requestedSnapshotId ?? internalSelectedId;

  // 1. Fetch domain snapshots list
  const snapshotsQuery = useSnapshots(
    initialSnapshots ? null : domainId,
    { limit: 50 }
  );

  // 2. Fetch active snapshot detail if not already loaded in list
  const snapshotDetailQuery = useSnapshot(
    initialSnapshotDetail ? null : activeSnapshotId
  );

  const rawSnapshots = getSnapshotsArray(
    initialSnapshots || snapshotsQuery.data
  );

  const detailData = initialSnapshotDetail || snapshotDetailQuery.data;

  // Resolve active snapshot selection from backend-ordered list
  const { selectedSnapshot, isCurrent, isInitialBaseline } = resolveSelectedSnapshot({
    snapshots: rawSnapshots,
    requestedSnapshotId: activeSnapshotId,
    snapshotDetail: detailData,
  });

  const isLoading =
    (!initialSnapshots && snapshotsQuery.isLoading) ||
    (!initialSnapshotDetail && Boolean(activeSnapshotId) && snapshotDetailQuery.isLoading);

  const isError =
    (!initialSnapshots && Boolean(snapshotsQuery.error)) ||
    (!initialSnapshotDetail && Boolean(snapshotDetailQuery.error));

  const error = snapshotsQuery.error || snapshotDetailQuery.error;

  // Domain Isolation Security Guard (P0)
  const isDomainMismatch = Boolean(
    selectedSnapshot &&
      selectedSnapshot.domainId &&
      selectedSnapshot.domainId !== domainId
  );

  const historyState = resolveSnapshotHistoryState({
    snapshots: rawSnapshots,
    selectedSnapshot,
    isLoading,
    isError,
    isDomainMismatch,
  });

  const handleSelect = (id: string) => {
    setInternalSelectedId(id);
    if (onSelectSnapshot) {
      onSelectSnapshot(id);
    }
  };

  const handleCopyRaw = async (jsonString: string) => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setHasCopiedRaw(true);
      setTimeout(() => setHasCopiedRaw(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
    }
  };

  // 1. Loading State
  if (historyState === 'LOADING') {
    return (
      <div className={`w-full py-12 flex items-center justify-center ${className}`} {...rest}>
        <LoadingState
          label="Resolving snapshot history..."
          description={`Retrieving authoritative historical infrastructure records for ${domainName}`}
        />
      </div>
    );
  }

  // 2. Domain Isolation / Unauthorized State (P0)
  if (historyState === 'UNAVAILABLE' || isDomainMismatch) {
    return (
      <div className={`w-full py-8 flex justify-center ${className}`} {...rest}>
        <ReadingSurface>
          <UnavailableState
            title="Unauthorized Resource Access"
            description="The requested snapshot does not belong to the active workspace domain."
            technicalNote="Cross-domain resource isolation enforced."
          />
        </ReadingSurface>
      </div>
    );
  }

  // 3. Error State
  if (historyState === 'ERROR' && !selectedSnapshot) {
    return (
      <div className={`w-full py-8 flex justify-center ${className}`} {...rest}>
        <ReadingSurface>
          <ErrorState
            error={error}
            title="Snapshot History Retrieval Failed"
            description={`Could not retrieve historical snapshots for ${domainName}.`}
            retryLabel="Retry"
            onRetry={() => {
              snapshotsQuery.refetch();
              if (activeSnapshotId) snapshotDetailQuery.refetch();
            }}
          />
        </ReadingSurface>
      </div>
    );
  }

  // 4. Zero Snapshots Empty State
  if (historyState === 'EMPTY' || !selectedSnapshot) {
    return (
      <Stack gap="xl" className={`relative z-10 w-full ${className}`} {...rest}>
        {onReturn && (
          <button
            type="button"
            onClick={onReturn}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer group"
          >
            <Icon icon={ArrowLeft} size="small" className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
        )}

        <ReadingSurface>
          <Stack gap="sm">
            <Cluster gap="xs" align="center">
              <Icon icon={History} size="small" className="text-primary" />
              <Eyebrow variant="muted" className="text-xs">
                Snapshot History &bull; Historical State
              </Eyebrow>
            </Cluster>
            <Display className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground leading-[1.2]">
              {domainName}
            </Display>
          </Stack>
        </ReadingSurface>

        <EmptyState
          title={SNAPSHOT_HISTORY_COPY.EMPTY_TITLE}
          description={SNAPSHOT_HISTORY_COPY.EMPTY_DESCRIPTION}
          icon={Layers}
        />
      </Stack>
    );
  }

  // Extract normalized state facts from authoritative DTO
  const stateFacts = extractSnapshotInfrastructureState(
    selectedSnapshot,
    isCurrent,
    isInitialBaseline
  );

  const rawJsonString = JSON.stringify(stateFacts.rawPayload, null, 2);

  return (
    <Stack gap="xl" className={`relative z-10 w-full ${className}`} {...rest} data-testid="snapshot-history-view">
      {/* 1. Return Navigation & Breadcrumb Identifier */}
      <Cluster justify="between" align="center" gap="md">
        {onReturn && (
          <button
            type="button"
            onClick={onReturn}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer group"
            data-testid="snapshot-return-button"
          >
            <Icon icon={ArrowLeft} size="small" className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Timeline</span>
          </button>
        )}

        <TechnicalSmall variant="muted" className="text-xs font-mono">
          Domain: {domainName} &bull; Snapshot: {stateFacts.snapshotId}
        </TechnicalSmall>
      </Cluster>

      {/* 2. Snapshot Header Context */}
      <ReadingSurface>
        <Stack gap="sm">
          <Cluster justify="between" align="center" gap="sm">
            <Cluster gap="xs" align="center">
              <Icon icon={History} size="small" className="text-primary" />
              <Eyebrow variant="muted" className="text-xs font-mono uppercase tracking-wider">
                Snapshot History
              </Eyebrow>
            </Cluster>

            <span
              className={`font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                stateFacts.isCurrent
                  ? 'text-[#178A68] bg-[#EAF7F2] border-[#B9E5D6]'
                  : 'text-[#5F625F] dark:text-muted-foreground bg-[#F4F4F1] dark:bg-surface-metadata border-[#E2E2DD] dark:border-border'
              }`}
              data-testid="snapshot-state-badge"
            >
              {stateFacts.isCurrent
                ? SNAPSHOT_HISTORY_COPY.CURRENT_STATE_BADGE
                : SNAPSHOT_HISTORY_COPY.HISTORICAL_STATE_BADGE}
            </span>
          </Cluster>

          <Display className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground leading-[1.2]">
            {domainName}
          </Display>

          <Cluster gap="md" align="center" className="text-xs text-[#5F625F] dark:text-muted-foreground pt-1 flex-wrap">
            <span className="font-medium text-foreground">
              {stateFacts.observedDateFormatted}
            </span>
            <span>&bull;</span>
            <Cluster gap="xs" align="center">
              <Icon icon={Clock} size="small" />
              <span>Observed at {stateFacts.observedTimeUtcFormatted}</span>
            </Cluster>
          </Cluster>
        </Stack>
      </ReadingSurface>

      {/* 3. Single-Snapshot Initial Baseline Notice */}
      {stateFacts.isInitialBaseline && (
        <ReadingSurface>
          <div
            className="p-5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-2"
            data-testid="snapshot-baseline-card"
          >
            <Cluster align="center" gap="sm">
              <div className="w-7 h-7 rounded bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border flex items-center justify-center text-[#5F625F] dark:text-muted-foreground">
                <Icon icon={Milestone} size="small" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  {SNAPSHOT_HISTORY_COPY.BASELINE_TITLE}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {SNAPSHOT_HISTORY_COPY.BASELINE_DESCRIPTION}
                </p>
              </div>
            </Cluster>

            <div className="pt-2 border-t border-[#EEEEEB] dark:border-border-divider flex items-center justify-between text-xs">
              <TechnicalSmall variant="muted" className="font-mono text-[11px] text-[#5F625F] dark:text-muted-foreground">
                Initial Snapshot: {stateFacts.snapshotId}
              </TechnicalSmall>
            </div>
          </div>
        </ReadingSurface>
      )}

      {/* 4. Multi-Snapshot Workspace Layout (Sidebar List + Detail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Snapshot List (when multiple snapshots exist) */}
        {rawSnapshots.length > 1 && (
          <aside className="lg:col-span-4 space-y-3" aria-label="Snapshot List">
            <div className="p-4 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FAFAF8] dark:bg-surface-secondary space-y-3">
              <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
                Snapshot History
              </SectionTitle>

              <ol className="space-y-2 m-0 p-0 list-none" role="list">
                {rawSnapshots.map((snap, idx) => {
                  const isSelected = snap.id === stateFacts.snapshotId;
                  const isFirst = idx === 0;
                  const snapDate = snap.capturedAt || snap.createdAt || '';
                  const snapDateFormatted = snapDate
                    ? new Date(snapDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        timeZone: 'UTC',
                      })
                    : 'Unknown date';

                  return (
                    <li key={snap.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(snap.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-150 cursor-pointer block ${
                          isSelected
                            ? 'border-[#171816] dark:border-foreground bg-[#FFFFFF] dark:bg-card text-foreground shadow-[0_1px_2px_rgba(16,24,20,0.035)]'
                            : 'border-[#E7E7E3] dark:border-border bg-[#FFFFFF] dark:bg-surface text-[#5F625F] dark:text-muted-foreground hover:bg-[#FCFCFA] hover:text-foreground hover:border-[#DADAD5]'
                        }`}
                        aria-selected={isSelected}
                        data-testid={`snapshot-item-${snap.id}`}
                      >
                        <Cluster justify="between" align="center" gap="xs">
                          <span className="text-xs font-medium text-foreground">
                            {snapDateFormatted}
                          </span>
                          {isFirst && (
                            <span className="font-mono text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border border-[#B9E5D6] text-[#178A68] bg-[#EAF7F2]">
                              Current
                            </span>
                          )}
                        </Cluster>

                        <TechnicalSmall
                          variant={isSelected ? 'default' : 'muted'}
                          className="font-mono text-[11px] block mt-1 truncate"
                        >
                          Snapshot {snap.id.substring(0, 10)}...
                        </TechnicalSmall>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </aside>
        )}

        {/* Right / Main Column: Historical Infrastructure State Detail */}
        <main
          className={`${
            rawSnapshots.length > 1 ? 'lg:col-span-8' : 'lg:col-span-12'
          } space-y-6`}
          aria-label="Snapshot Detail"
        >
          {/* A. Authoritative Infrastructure State Table */}
          <div
            className="p-6 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-5"
            data-testid="snapshot-infrastructure-state"
          >
            <Cluster justify="between" align="center" gap="sm">
              <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
                Infrastructure state
              </SectionTitle>
              <TechnicalSmall variant="muted" className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground">
                {stateFacts.isCurrent ? 'Current state' : 'Historical state'}
              </TechnicalSmall>
            </Cluster>

            <div className="divide-y divide-[#EEEEEB] dark:divide-border-divider text-xs">
              {/* HTTP Status */}
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-[#5F625F] dark:text-muted-foreground font-medium">HTTP</span>
                <span className="font-mono font-medium text-foreground">
                  {stateFacts.httpStatus !== null ? stateFacts.httpStatus : '—'}
                </span>
              </div>

              {/* Response Time */}
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-[#5F625F] dark:text-muted-foreground font-medium">Response</span>
                <span className="font-mono font-medium text-foreground">
                  {stateFacts.responseTimeFormatted ?? '—'}
                </span>
              </div>

              {/* Web Server */}
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-[#5F625F] dark:text-muted-foreground font-medium">Web server</span>
                <span className="font-mono font-medium text-foreground">
                  {stateFacts.server ?? '—'}
                </span>
              </div>

              {/* TLS Status */}
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-[#5F625F] dark:text-muted-foreground font-medium">TLS</span>
                <Cluster gap="xs" align="center">
                  {stateFacts.tls ? (
                    <>
                      <span
                        className={`font-mono font-medium ${
                          stateFacts.tls.status === 'Valid'
                            ? 'text-[#178A68]'
                            : stateFacts.tls.status === 'Expired' || stateFacts.tls.status === 'Unverified'
                            ? 'text-[#B86F18]'
                            : 'text-[#5F625F] dark:text-muted-foreground'
                        }`}
                      >
                        {stateFacts.tls.status}
                      </span>
                      {stateFacts.tls.issuer && (
                        <span className="text-[#5F625F] dark:text-muted-foreground font-mono text-[11px] truncate max-w-[200px]">
                          ({stateFacts.tls.issuer})
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="font-mono text-[#5F625F] dark:text-muted-foreground">—</span>
                  )}
                </Cluster>
              </div>

              {/* Technologies */}
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-[#5F625F] dark:text-muted-foreground font-medium">Technologies</span>
                <span className="font-mono font-medium text-foreground text-right">
                  {stateFacts.technologies.length > 0
                    ? stateFacts.technologies.join(' · ')
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* B. Observed DNS Records (if present in authoritative snapshot) */}
          {stateFacts.dnsRecords.length > 0 && (
            <div className="p-6 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-4">
              <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
                Observed DNS Records
              </SectionTitle>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#EEEEEB] dark:border-border-divider text-[#5F625F] dark:text-muted-foreground text-[10px] uppercase">
                      <th className="py-2 pr-4 font-semibold">Type</th>
                      <th className="py-2 pr-4 font-semibold">Host</th>
                      <th className="py-2 font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEEEB] dark:divide-border-divider">
                    {stateFacts.dnsRecords.map((rec, idx) => (
                      <tr key={`${rec.type}-${rec.value}-${idx}`} className="hover:bg-[#F7F8F6] dark:hover:bg-muted/20">
                        <td className="py-2 pr-4 font-semibold text-[#3568C8]">{rec.type}</td>
                        <td className="py-2 pr-4 text-[#5F625F] dark:text-muted-foreground">{rec.name || '@'}</td>
                        <td className="py-2 text-foreground truncate max-w-[320px]">{rec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* C. Snapshot Relationships & Investigative Pathways */}
          <div className="p-6 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-4">
            <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
              Snapshot
            </SectionTitle>

            <div className="space-y-2">
              <Technical className="font-mono text-xs text-foreground block font-medium">
                {stateFacts.snapshotId}
              </Technical>
            </div>

            <Cluster justify="between" align="center" gap="md" className="pt-2 border-t border-[#EEEEEB] dark:border-border-divider flex-wrap">
              <Cluster gap="md" align="center">
                {onViewRelatedChange && (
                  <button
                    type="button"
                    onClick={() => onViewRelatedChange(stateFacts.snapshotId)}
                    className="flex items-center gap-1.5 text-xs text-[#3568C8] hover:underline font-mono font-medium cursor-pointer transition-colors duration-150"
                  >
                    <span>Related changes &rarr;</span>
                  </button>
                )}

                {onViewRelatedFinding && (
                  <button
                    type="button"
                    onClick={() => onViewRelatedFinding(stateFacts.snapshotId)}
                    className="flex items-center gap-1.5 text-xs text-[#3568C8] hover:underline font-mono font-medium cursor-pointer transition-colors duration-150"
                  >
                    <span>Related findings &rarr;</span>
                  </button>
                )}

                {onViewHistoricalContext && (
                  <button
                    type="button"
                    onClick={onViewHistoricalContext}
                    className="flex items-center gap-1.5 text-xs text-[#3568C8] hover:underline font-mono font-medium cursor-pointer transition-colors duration-150"
                  >
                    <span>View Historical Context &rarr;</span>
                  </button>
                )}
              </Cluster>

              {onViewEvidence && (
                <button
                  type="button"
                  onClick={() => onViewEvidence(stateFacts.snapshotId)}
                  className="flex items-center gap-1.5 text-xs text-[#3568C8] hover:underline font-mono font-medium cursor-pointer transition-colors duration-150"
                  data-testid="snapshot-view-evidence-button"
                >
                  <span>View infrastructure evidence &rarr;</span>
                  <Icon icon={ArrowUpRight} size="small" />
                </button>
              )}
            </Cluster>
          </div>

          {/* D. Progressive Disclosure: Raw Technical Payload */}
          <div className="rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] overflow-hidden">
            <button
              type="button"
              onClick={() => setIsRawJsonExpanded(!isRawJsonExpanded)}
              className="w-full p-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-expanded={isRawJsonExpanded}
              data-testid="toggle-raw-json"
            >
              <Cluster gap="xs" align="center">
                <Icon
                  icon={isRawJsonExpanded ? ChevronDown : ChevronRight}
                  size="small"
                />
                <span>Raw Technical Payload</span>
              </Cluster>
              <span className="font-mono text-[10px] text-[#5F625F] dark:text-muted-foreground">
                {isRawJsonExpanded ? 'Hide JSON' : 'Inspect JSON'}
              </span>
            </button>

            {isRawJsonExpanded && (
              <div className="p-4 border-t border-[#EEEEEB] dark:border-border-divider bg-[#F4F4F1] dark:bg-surface-metadata space-y-3">
                <Cluster justify="between" align="center">
                  <span className="font-mono text-[10px] text-[#5F625F] dark:text-muted-foreground">
                    Authoritative snapshot payload
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyRaw(rawJsonString)}
                    className="inline-flex items-center gap-1 text-[11px] text-[#5F625F] dark:text-muted-foreground hover:text-foreground font-mono transition-colors cursor-pointer"
                  >
                    <Icon icon={hasCopiedRaw ? Check : Copy} size="small" />
                    <span>{hasCopiedRaw ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </Cluster>

                <pre
                  className="p-3 rounded-lg bg-[#FFFFFF] dark:bg-surface border border-[#E2E2DD] dark:border-border font-mono text-[11px] text-foreground/90 overflow-x-auto max-h-96 leading-relaxed m-0"
                  data-testid="raw-json-content"
                >
                  {rawJsonString}
                </pre>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 5. Snapshot Reference Footer */}
      <Section spacing="none" className="pt-2">
        <ReadingSurface>
          <Cluster justify="between" align="center" gap="md" className="text-xs text-muted-foreground">
            <Cluster gap="xs" align="center">
              <Icon icon={Layers} size="small" className="text-muted-foreground" />
              <TechnicalSmall variant="muted">
                Historical Snapshot: {stateFacts.snapshotId}
              </TechnicalSmall>
            </Cluster>
            <TechnicalSmall variant="muted">
              Domain: {domainName}
            </TechnicalSmall>
          </Cluster>
        </ReadingSurface>
      </Section>
    </Stack>
  );
};

SnapshotHistory.displayName = 'SnapshotHistory';
