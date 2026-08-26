import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Layers, Filter } from 'lucide-react';
import { Eyebrow, Display, BodySmall } from '../../../../components/typography';
import { Stack, Cluster, ReadingSurface, Section } from '../../../../components/layout';
import { LoadingState, UnavailableState, ErrorState } from '../../../../components/states';
import { useInfiniteTimeline } from '../../../../hooks/queries/useTimeline';
import { useSnapshots } from '../../../../hooks/queries/useSnapshots';
import { useDomainUnderstandingJobs } from '../../../../hooks/queries/useUnderstanding';
import { findActiveJob } from '../../contracts/understanding-convergence.contract';
import { integrateAuthoritativeChanges } from '../../contracts/snapshot-comparison.contract';
import {
  getSnapshotsArray,
  getTimelineEventsArray,
} from '../../contracts/changes.contract';
import {
  partitionInfiniteTimeline,
} from '../../contracts/infinite-timeline.contract';
import { ChangeStoryCard } from './ChangeStoryCard';
import { CompactChangeRow } from './CompactChangeRow';
import { DenseChangeRow } from './DenseChangeRow';
import { StickyEpochSpine } from './StickyEpochSpine';
import { InfrastructureOriginSeal } from './InfrastructureOriginSeal';
import { ReturnToPresentButton } from './ReturnToPresentButton';
import { TimelineSkeletonLoader } from './TimelineSkeletonLoader';
import { TimelineFailureBanner } from './TimelineFailureBanner';
import { UnderstandNowButton } from '../understanding';
import type { ChangesTimelineProps } from './ChangesTimeline.types';

/**
 * Authoritative Changes Timeline Experience (WX-1026 / WX-1024 / WX-1003).
 *
 * Implements the continuous chronological infrastructure memory:
 * - Answers: "What changed across {domainName}?" through time
 * - Cursor-based infinite scrolling with 400px prefetching buffer
 * - Sticky Chronological Epoch Spine (TODAY, YESTERDAY, EARLIER THIS WEEK, etc.)
 * - Progressive Density: Rich story (≤2d) -> Compact row (2-14d) -> Ultra-dense ledger (>14d)
 * - Infrastructure Origin Seal when timeline genesis is reached
 * - Floating "Return to present" telemetry control
 * - Zero spinner-driven jitter, calm skeleton loader with 520ms pulse
 */
export const ChangesTimeline: React.FC<ChangesTimelineProps> = ({
  domainId,
  domainName,
  domains = [],
  onSelectDomain,
  onInvestigateChange,
  onViewSnapshot,
  onViewEvidence,
  onViewInfrastructure,
  onCompareSnapshots,
  initialEvents,
  initialSnapshots,
  className = '',
}) => {
  const [selectedFilterDomainId, setSelectedFilterDomainId] = useState<string | null>(domainId || null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Synchronize filter when parent domainId changes
  useEffect(() => {
    if (domainId) {
      setSelectedFilterDomainId(domainId);
    }
  }, [domainId]);

  const activeQueryDomainId = selectedFilterDomainId || undefined;

  const infiniteTimelineQuery = useInfiniteTimeline(
    initialEvents
      ? undefined
      : {
          domainId: activeQueryDomainId,
          limit: 20,
        }
  );

  const snapshotsQuery = useSnapshots(initialSnapshots ? undefined : (activeQueryDomainId || domainId));
  const domainJobsQuery = useDomainUnderstandingJobs(initialSnapshots ? null : (activeQueryDomainId || domainId));

  // Flatten cursor pages into an unbroken stream
  const rawEvents = initialEvents
    ? getTimelineEventsArray(initialEvents)
    : infiniteTimelineQuery.data?.pages?.flatMap((page) => getTimelineEventsArray(page.data || page.events || [])) || [];

  const rawSnapshots = getSnapshotsArray(initialSnapshots || snapshotsQuery.data);

  const activeJob = findActiveJob(domainJobsQuery.data);
  const isUnderstanding = Boolean(activeJob);

  const isLoading =
    (!initialEvents && infiniteTimelineQuery.isLoading) ||
    (!initialSnapshots && snapshotsQuery.isLoading);
  const isError =
    (!initialEvents && Boolean(infiniteTimelineQuery.error)) ||
    (!initialSnapshots && Boolean(snapshotsQuery.error));
  const error = infiniteTimelineQuery.error || snapshotsQuery.error;

  const integration = integrateAuthoritativeChanges({
    domainId: activeQueryDomainId || domainId,
    domainName,
    snapshots: rawSnapshots,
    timelineEvents: rawEvents,
    isLoading,
    isError,
    isUnderstanding,
  });

  const { state, snapshotPair } = integration;

  // Partition events into sticky epochs with progressive density
  const partitionResult = partitionInfiniteTimeline({
    events: rawEvents,
    domainName,
    baselineSnapshot: rawSnapshots[rawSnapshots.length - 1] || null,
    hasNextPage: Boolean(infiniteTimelineQuery.hasNextPage),
  });

  const { epochs, originDetails, isOriginReached, hasEvents } = partitionResult;

  // Infinite Scroll Intersection Observer with 400px prefetch margin
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (
        target.isIntersecting &&
        infiniteTimelineQuery.hasNextPage &&
        !infiniteTimelineQuery.isFetchingNextPage &&
        !initialEvents
      ) {
        infiniteTimelineQuery.fetchNextPage();
      }
    },
    [
      infiniteTimelineQuery.hasNextPage,
      infiniteTimelineQuery.isFetchingNextPage,
      infiniteTimelineQuery.fetchNextPage,
      initialEvents,
    ]
  );

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '400px',
      threshold: 0.1,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  // 1. Loading State
  if (state === 'LOADING') {
    return (
      <Section className={`w-full py-6 ${className}`} aria-label="Infrastructure Changes">
        <ReadingSurface>
          <div className="py-8 flex justify-center">
            <LoadingState
              label="Loading infrastructure changes..."
              description={`Retrieving verified changes and comparative snapshots for ${domainName}`}
            />
          </div>
        </ReadingSurface>
      </Section>
    );
  }

  // 2. Error State
  if (state === 'ERROR') {
    return (
      <Section className={`w-full py-6 ${className}`} aria-label="Infrastructure Changes">
        <ReadingSurface>
          <ErrorState
            error={error}
            title="Failed to Load Infrastructure Changes"
            description={`Could not retrieve comparative snapshot changes for ${domainName}.`}
            retryLabel="Retry"
            onRetry={() => {
              infiniteTimelineQuery.refetch();
              snapshotsQuery.refetch();
            }}
          />
        </ReadingSurface>
      </Section>
    );
  }

  // 3. Unavailable State
  if (state === 'UNAVAILABLE') {
    return (
      <Section className={`w-full py-6 ${className}`} aria-label="Infrastructure Changes">
        <ReadingSurface>
          <UnavailableState
            title="Infrastructure Changes Unavailable"
            description="Changes cannot be accessed due to tenant boundaries or unavailable telemetry."
          />
        </ReadingSurface>
      </Section>
    );
  }

  const formatFullDate = (isoDate?: string | null): string => {
    if (!isoDate) return 'Timestamp unavailable';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return 'Timestamp unavailable';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTimeShort = (isoDate?: string | null): string => {
    if (!isoDate) return 'Unavailable';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return 'Unavailable';
    const monthDay = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${monthDay} · ${time}`;
  };

  return (
    <Section className={`w-full py-6 ${className}`} aria-label="Infrastructure Changes">
      <ReadingSurface>
        <Stack gap="xl">
          {/* Multi-Domain Filter Controls (When multiple domains exist) */}
          {domains.length > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EEEEEB] dark:border-border-divider">
              <div className="flex items-center gap-2 text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
                <Filter className="w-3.5 h-3.5 text-[#5F625F]" />
                <span className="uppercase font-semibold tracking-wider">TIMELINE SCOPE:</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFilterDomainId(null);
                    onSelectDomain?.('');
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                    !selectedFilterDomainId
                      ? 'bg-[#EAF7F2] text-[#178A68] border border-[#B9E5D6] font-semibold'
                      : 'bg-[#F4F4F1] dark:bg-surface-metadata text-[#5F625F] dark:text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                  data-testid="filter-all-domains"
                >
                  All Domains ({domains.length})
                </button>

                {domains.map((d) => {
                  const isSelected = selectedFilterDomainId === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setSelectedFilterDomainId(d.id);
                        onSelectDomain?.(d.id);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#EEF4FF] text-[#3568C8] border border-[#C8D8F6] font-semibold'
                          : 'bg-[#F4F4F1] dark:bg-surface-metadata text-[#5F625F] dark:text-muted-foreground hover:text-foreground border border-transparent'
                      }`}
                      data-testid={`filter-domain-${d.id}`}
                    >
                      {d.domainName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Understanding In-Progress Banner */}
          {isUnderstanding && (
            <div
              className="p-3 bg-[#EEF4FF] dark:bg-blue-950/20 border border-[#C8D8F6] rounded-lg flex items-center gap-2.5 text-xs text-[#3568C8] dark:text-blue-400 font-mono"
              data-testid="changes-understanding-in-progress-banner"
            >
              <Activity className="w-4 h-4 animate-pulse shrink-0" />
              <span>Understanding in progress — analyzing observations against baseline for {domainName}.</span>
            </div>
          )}

          {/* 4. Single-Snapshot Initial Baseline State (FIRST_UNDERSTANDING) */}
          {state === 'FIRST_UNDERSTANDING' && (
            <div
              className="w-full bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-xl p-6 sm:p-7 space-y-6 shadow-[0_1px_2px_rgba(16,24,20,0.03)]"
              data-testid="first-understanding-card"
            >
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#EEEEEB] dark:border-border-divider">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#178A68] shrink-0" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#178A68] font-semibold">
                    INITIAL BASELINE ESTABLISHED
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#178A68] bg-[#EAF7F2] border border-[#B9E5D6] px-2.5 py-0.5 rounded font-semibold">
                  GENESIS
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-medium text-foreground tracking-tight">
                  Infrastructure understood
                </h3>
                <p className="text-xs sm:text-sm text-[#5F625F] dark:text-muted-foreground leading-relaxed max-w-2xl">
                  Nebula established the first verified understanding of {domainName}. This initial baseline represents the beginning of recorded infrastructure memory.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 pb-2 border-t border-b border-[#EEEEEB] dark:border-border-divider">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
                    BASELINE
                  </span>
                  <p className="font-mono text-xs text-foreground font-medium">
                    Verified · {formatFullDate(snapshotPair.currentSnapshot?.capturedAt || snapshotPair.currentSnapshot?.createdAt)}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
                    SNAPSHOT
                  </span>
                  <p className="font-mono text-xs text-foreground font-medium truncate" title={snapshotPair.currentSnapshot?.id}>
                    {snapshotPair.currentSnapshot?.id ? snapshotPair.currentSnapshot.id.slice(0, 12) : 'Genesis snapshot'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
                    COMPARISON
                  </span>
                  <p className="font-mono text-xs text-[#5F625F] dark:text-muted-foreground">
                    Initial baseline established
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
                    VERIFIED KNOWLEDGE
                  </span>
                  <p className="text-xs text-[#5F625F] dark:text-muted-foreground">
                    Infrastructure snapshot · Domain context · Initial observation baseline
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0 font-mono">
                  {onViewInfrastructure && (
                    <button
                      type="button"
                      onClick={onViewInfrastructure}
                      className="font-medium text-[#3568C8] hover:underline cursor-pointer"
                      data-testid="view-infrastructure-link"
                    >
                      <span>View infrastructure &rarr;</span>
                    </button>
                  )}
                  {onViewSnapshot && snapshotPair.currentSnapshot && (
                    <button
                      type="button"
                      onClick={() => onViewSnapshot(snapshotPair.currentSnapshot!.id)}
                      className="font-medium text-[#5F625F] hover:text-foreground cursor-pointer"
                      data-testid="view-baseline-snapshot"
                    >
                      <span>View snapshot &rarr;</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. Quiet / Stable State with No Changes Recorded */}
          {state === 'QUIET' && !hasEvents && (
            <div
              className="w-full bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-xl p-6 sm:p-7 space-y-6 shadow-[0_1px_2px_rgba(16,24,20,0.03)]"
              data-testid="quiet-changes-card"
            >
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#EEEEEB] dark:border-border-divider">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#178A68] shrink-0" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#178A68] font-semibold">
                    VERIFIED UNDERSTANDING
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#178A68] bg-[#EAF7F2] border border-[#B9E5D6] px-2.5 py-0.5 rounded font-semibold">
                  STABLE
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-medium text-foreground tracking-tight">
                  No infrastructure changes detected
                </h3>
                <p className="text-xs sm:text-sm text-[#5F625F] dark:text-muted-foreground leading-relaxed max-w-2xl">
                  Nebula compared current verified understandings with previous infrastructure states and found no meaningful differences.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 pb-2 border-t border-b border-[#EEEEEB] dark:border-border-divider">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
                    CURRENT UNDERSTANDING
                  </span>
                  <p className="font-mono text-xs text-foreground font-medium">
                    {formatDateTimeShort(snapshotPair.currentSnapshot?.capturedAt || snapshotPair.currentSnapshot?.createdAt)}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
                    PREVIOUS STATE
                  </span>
                  <p className="font-mono text-xs text-foreground font-medium">
                    {formatDateTimeShort(snapshotPair.previousSnapshot?.capturedAt || snapshotPair.previousSnapshot?.createdAt)}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
                    CHANGE RESULT
                  </span>
                  <p className="font-mono text-xs text-[#178A68] font-medium">
                    No meaningful changes
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <span className="text-xs text-[#5F625F] dark:text-muted-foreground font-mono">
                  {snapshotPair.totalVerifiedSnapshots} verified snapshots recorded in memory
                </span>

                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                  {onCompareSnapshots && snapshotPair.hasComparisonPair && snapshotPair.currentSnapshot && snapshotPair.previousSnapshot && (
                    <button
                      type="button"
                      onClick={() =>
                        onCompareSnapshots(
                          snapshotPair.previousSnapshot!.id,
                          snapshotPair.currentSnapshot!.id
                        )
                      }
                      className="font-medium text-[#3568C8] hover:underline cursor-pointer"
                      data-testid="compare-snapshots-button"
                    >
                      <span>Compare understandings &rarr;</span>
                    </button>
                  )}
                  {onViewSnapshot && snapshotPair.currentSnapshot && (
                    <button
                      type="button"
                      onClick={() => onViewSnapshot(snapshotPair.currentSnapshot!.id)}
                      className="font-medium text-[#5F625F] hover:text-foreground cursor-pointer"
                      data-testid="view-current-snapshot"
                    >
                      <span>View snapshot &rarr;</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 6. Empty State (EMPTY) */}
          {state === 'EMPTY' && (
            <div
              className="bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-xl p-8 text-center space-y-4"
              data-testid="empty-changes-card"
            >
              <Cluster gap="xs" align="center" justify="center">
                <Layers className="w-4 h-4 text-[#5F625F]" />
                <Eyebrow variant="muted" className="text-xs font-mono uppercase">
                  CHANGES
                </Eyebrow>
              </Cluster>

              <div className="space-y-1.5 max-w-lg mx-auto">
                <Display className="text-xl font-medium text-foreground">
                  No infrastructure changes recorded.
                </Display>
                <BodySmall variant="muted" className="leading-relaxed">
                  Run understanding to establish a baseline observation state for {domainName}.
                </BodySmall>
              </div>

              <div className="pt-2 flex justify-center">
                <UnderstandNowButton
                  domainId={domainId}
                  domainName={domainName}
                />
              </div>
            </div>
          )}

          {/* 7. Continuous Chronological Infinite Timeline with Progressive Density */}
          {hasEvents && (
            <Stack gap="2xl" className="w-full relative" data-testid="infinite-changes-timeline">
              {/* Compare understandings button (if pair exists) */}
              {onCompareSnapshots && snapshotPair.hasComparisonPair && snapshotPair.currentSnapshot && snapshotPair.previousSnapshot && (
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      onCompareSnapshots(
                        snapshotPair.previousSnapshot!.id,
                        snapshotPair.currentSnapshot!.id
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs font-mono text-[#5F625F] hover:text-foreground hover:underline transition-colors cursor-pointer"
                    data-testid="compare-snapshots-button"
                  >
                    <span>Compare understandings &rarr;</span>
                  </button>
                </div>
              )}

              {/* Epoch Groups */}
              {epochs.map((epoch) => (
                <div
                  key={epoch.epochKey}
                  className="space-y-4 relative"
                  data-testid={`epoch-group-${epoch.epochKey}`}
                >
                  {/* Sticky Epoch Spine Header */}
                  <StickyEpochSpine epochLabel={epoch.epochLabel} />

                  {/* Items in Epoch rendered according to Progressive Density */}
                  <div className="space-y-3 pl-2 sm:pl-4 border-l border-[#DCDCD7] dark:border-border ml-3 sm:ml-4">
                    {epoch.items.map((item) => {
                      if (item.densityTier === 'RICH') {
                        return (
                          <ChangeStoryCard
                            key={item.story.changeId}
                            change={item.story}
                            onInvestigate={onInvestigateChange}
                            onViewEvidence={onViewEvidence}
                            onViewSnapshot={onViewSnapshot}
                            onViewPreviousSnapshot={onViewSnapshot}
                          />
                        );
                      }

                      if (item.densityTier === 'COMPACT') {
                        return (
                          <CompactChangeRow
                            key={item.story.changeId}
                            item={item}
                            onInvestigate={onInvestigateChange}
                            onViewSnapshot={onViewSnapshot}
                          />
                        );
                      }

                      return (
                        <DenseChangeRow
                          key={item.story.changeId}
                          item={item}
                          onInvestigate={onInvestigateChange}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Prefetch Sentinel Element (400px before bottom) */}
              <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />

              {/* Skeleton Loader during active subsequent page fetch */}
              {infiniteTimelineQuery.isFetchingNextPage && (
                <TimelineSkeletonLoader />
              )}

              {/* Failure Banner on Next Page Fetch Error */}
              {infiniteTimelineQuery.isFetchNextPageError && (
                <TimelineFailureBanner
                  onRetry={() => infiniteTimelineQuery.fetchNextPage()}
                  isRetrying={infiniteTimelineQuery.isFetchingNextPage}
                />
              )}

              {/* Infrastructure Origin Seal (When timeline genesis is reached) */}
              {isOriginReached && (
                <InfrastructureOriginSeal originDetails={originDetails} />
              )}

              {/* Return to Present Telemetry Button */}
              <ReturnToPresentButton />
            </Stack>
          )}
        </Stack>
      </ReadingSurface>
    </Section>
  );
};

ChangesTimeline.displayName = 'ChangesTimeline';
export default ChangesTimeline;
