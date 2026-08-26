import React from 'react';
import { History, Milestone, ShieldCheck, AlertCircle, ArrowUpRight } from 'lucide-react';
import {
  SectionTitle,
  Body,
  Eyebrow,
  TechnicalSmall,
} from '../../../../components/typography';
import { Stack, Cluster, ReadingSurface, Section } from '../../../../components/layout';
import { LoadingState, UnavailableState, ErrorState } from '../../../../components/states';
import { useTimeline } from '../../../../hooks/queries/useTimeline';
import { useSnapshots } from '../../../../hooks/queries/useSnapshots';
import {
  resolveMemoryState,
  resolveMemoryBaseline,
  MEMORY_BASELINE_COPY,
} from '../../contracts/memory.contract';
import {
  getSnapshotsArray,
  getTimelineEventsArray,
} from '../../contracts/changes.contract';
import { TimelineEventCard } from './TimelineEventCard';
import type { InfrastructureTimelineProps } from './InfrastructureTimeline.types';

/**
 * Authoritative Infrastructure Timeline Component (WX-502).
 *
 * Answers: "What changed over time?"
 * - Preserves backend-established chronological sequence (zero client-side sorting).
 * - Focuses strictly on meaningful infrastructure evolution, avoiding noisy activity logs.
 * - Honestly resolves all 7 historical memory states (LOADING, READY, EMPTY, PARTIAL, UNAVAILABLE, ERROR, QUIET).
 * - Integrates with Change Investigation (WX-303) and Snapshot Lineage (WX-305).
 */
export const InfrastructureTimeline: React.FC<InfrastructureTimelineProps> = ({
  domainId,
  domainName,
  onInvestigateChange,
  onViewSnapshot,
  onViewHistoricalContext,
  initialEvents,
  initialSnapshots,
  className = '',
}) => {
  const timelineQuery = useTimeline(initialEvents ? undefined : { domainId });
  const snapshotsQuery = useSnapshots(initialSnapshots ? undefined : domainId);

  const rawEvents = getTimelineEventsArray(initialEvents || timelineQuery.data);
  const rawSnapshots = getSnapshotsArray(initialSnapshots || snapshotsQuery.data);

  const isLoading = (!initialEvents && timelineQuery.isLoading) || (!initialSnapshots && snapshotsQuery.isLoading);
  const isError = (!initialEvents && Boolean(timelineQuery.error)) || (!initialSnapshots && Boolean(snapshotsQuery.error));
  const error = timelineQuery.error || snapshotsQuery.error;

  const memoryState = resolveMemoryState({
    snapshots: rawSnapshots,
    timelineEvents: rawEvents,
    isLoading,
    isError,
  });

  const baseline = resolveMemoryBaseline({
    snapshots: rawSnapshots,
    timelineEvents: rawEvents,
  });

  // 1. Loading State
  if (memoryState === 'LOADING') {
    return (
      <Section className={`w-full py-6 ${className}`} aria-label="Infrastructure Memory">
        <ReadingSurface>
          <div className="py-8 flex justify-center">
            <LoadingState
              label="Loading infrastructure memory..."
              description={`Retrieving chronological history and verifications for ${domainName}`}
            />
          </div>
        </ReadingSurface>
      </Section>
    );
  }

  // 2. Error State
  if (memoryState === 'ERROR') {
    return (
      <Section className={`w-full py-6 ${className}`} aria-label="Infrastructure Memory">
        <ReadingSurface>
          <ErrorState
            error={error}
            title="Failed to Load Infrastructure Memory"
            description={`Could not retrieve historical snapshots or timeline events for ${domainName}.`}
            retryLabel="Retry"
            onRetry={() => {
              timelineQuery.refetch();
              snapshotsQuery.refetch();
            }}
          />
        </ReadingSurface>
      </Section>
    );
  }

  // 3. Unavailable State
  if (memoryState === 'UNAVAILABLE') {
    return (
      <Section className={`w-full py-6 ${className}`} aria-label="Infrastructure Memory">
        <ReadingSurface>
          <UnavailableState
            title="Historical Context Unavailable"
            description="Historical memory cannot be accessed due to tenant boundaries or unavailable telemetry."
          />
        </ReadingSurface>
      </Section>
    );
  }

  return (
    <Section className={`w-full py-6 ${className}`} aria-label="Infrastructure Memory">
      <ReadingSurface>
        <Stack gap="xl">
          {/* Section Header */}
          <header className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Eyebrow className="text-text-muted mb-1 flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase">
                <History className="w-3.5 h-3.5 text-text-secondary" />
                <span>Chronological Evolution</span>
              </Eyebrow>
              <SectionTitle className="text-xl font-semibold text-text-primary">
                Infrastructure Memory
              </SectionTitle>
              <Body className="text-xs text-text-muted mt-1">
                How has this infrastructure evolved over time?
              </Body>
            </div>

            {onViewHistoricalContext && (
              <button
                type="button"
                onClick={onViewHistoricalContext}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
                data-testid="timeline-view-historical-context"
              >
                <span>View Historical Context</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </header>

          {/* 4. Single-Snapshot Initial Baseline State (EMPTY comparisons) */}
          {baseline.isInitialBaseline && (
            <div
              className="bg-surface-elevated border border-border-hairline rounded-lg p-5"
              data-testid="initial-baseline-card"
            >
              <Stack gap="md">
                <Cluster align="center" gap="sm">
                  <div className="w-8 h-8 rounded bg-surface-subtle border border-border-hairline flex items-center justify-center text-text-secondary">
                    <Milestone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">
                      {MEMORY_BASELINE_COPY.INITIAL_BASELINE_HEADLINE}
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {MEMORY_BASELINE_COPY.INITIAL_BASELINE_EXPLANATION}
                    </p>
                  </div>
                </Cluster>

                {baseline.currentSnapshotId && (
                  <Cluster justify="between" align="center" className="pt-3 border-t border-border-hairline text-xs">
                    <TechnicalSmall className="text-text-muted font-mono text-[11px]">
                      Baseline Snapshot: {baseline.currentSnapshotId}
                    </TechnicalSmall>
                    <button
                      type="button"
                      onClick={() => onViewSnapshot(baseline.currentSnapshotId!)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-text-primary hover:text-white underline decoration-dotted"
                    >
                      <span>View Snapshot Lineage</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </Cluster>
                )}
              </Stack>
            </div>
          )}

          {/* 5. Zero Snapshots State */}
          {!baseline.isInitialBaseline && memoryState === 'EMPTY' && (
            <div
              className="bg-surface-elevated border border-border-hairline rounded-lg p-5 text-center"
              data-testid="empty-memory-card"
            >
              <h4 className="text-sm font-semibold text-text-primary">
                {MEMORY_BASELINE_COPY.EMPTY_HEADLINE}
              </h4>
              <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
                {MEMORY_BASELINE_COPY.EMPTY_EXPLANATION}
              </p>
            </div>
          )}

          {/* 6. Multi-Snapshot Quiet State (Zero changes across verifications) */}
          {memoryState === 'QUIET' && (
            <div
              className="bg-surface-elevated border border-border-hairline rounded-lg p-5"
              data-testid="quiet-memory-card"
            >
              <Stack gap="md">
                <Cluster align="center" gap="sm">
                  <div className="w-8 h-8 rounded bg-surface-subtle border border-border-hairline flex items-center justify-center text-text-secondary">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">
                      {MEMORY_BASELINE_COPY.QUIET_HEADLINE}
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {MEMORY_BASELINE_COPY.QUIET_EXPLANATION}
                    </p>
                  </div>
                </Cluster>

                <Cluster justify="between" align="center" className="pt-3 border-t border-border-hairline text-xs">
                  <TechnicalSmall className="text-text-muted font-mono text-[11px]">
                    Verified across {baseline.totalSnapshots} snapshots
                  </TechnicalSmall>
                  {baseline.currentSnapshotId && (
                    <button
                      type="button"
                      onClick={() => onViewSnapshot(baseline.currentSnapshotId!)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-text-primary hover:text-white underline decoration-dotted"
                    >
                      <span>View Current Snapshot</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </Cluster>
              </Stack>
            </div>
          )}

          {/* 7. Partial History Banner */}
          {memoryState === 'PARTIAL' && (
            <div className="p-3 bg-surface-subtle border border-border-hairline rounded flex items-center gap-2 text-xs text-text-secondary">
              <AlertCircle className="w-4 h-4 text-severity-medium" />
              <span>Displaying available historical records. Some historical intervals may be limited.</span>
            </div>
          )}

          {/* 8. Ready / Meaningful Historical Events Sequence */}
          {(memoryState === 'READY' || (memoryState === 'PARTIAL' && rawEvents.length > 0)) && (
            <div className="pt-2">
              <ol
                role="list"
                aria-label="Chronological infrastructure changes"
                className="space-y-0"
              >
                {rawEvents.map((event, idx) => (
                  <TimelineEventCard
                    key={event.id || `event-${idx}`}
                    event={event}
                    onInvestigate={onInvestigateChange}
                    onViewSnapshot={onViewSnapshot}
                    isFirst={idx === 0}
                    isLast={idx === rawEvents.length - 1}
                  />
                ))}
              </ol>
            </div>
          )}
        </Stack>
      </ReadingSurface>
    </Section>
  );
};

InfrastructureTimeline.displayName = 'InfrastructureTimeline';
