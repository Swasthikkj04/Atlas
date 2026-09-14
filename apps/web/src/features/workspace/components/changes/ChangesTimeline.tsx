import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Eyebrow, Display, BodySmall } from '../../../../components/typography';
import { Cluster } from '../../../../components/layout';
import { LoadingState, UnavailableState, ErrorState } from '../../../../components/states';
import { useTimeline } from '../../../../hooks/queries/useTimeline';
import { useSnapshots } from '../../../../hooks/queries/useSnapshots';
import { useDomainUnderstandingJobs } from '../../../../hooks/queries/useUnderstanding';
import { findActiveJob } from '../../contracts/understanding-convergence.contract';
import {
  integrateAuthoritativeChanges,
} from '../../contracts/snapshot-comparison.contract';
import {
  getSnapshotsArray,
  getTimelineEventsArray,
  resolveMeaningfulChangeStory,
  filterMeaningfulChanges,
  filterChangesSinceLastVisit,
  AUTHORITATIVE_CHANGE_CATEGORIES,
  CHANGE_CATEGORY_LABELS,
  type MeaningfulChangeStory,
} from '../../contracts/changes.contract';
import { ChangeStoryCard } from './ChangeStoryCard';
import { UnderstandNowButton } from '../understanding';
import type { ChangesTimelineProps } from './ChangesTimeline.types';

function formatDateTimeShort(iso?: string | null): string {
  if (!iso) return 'Recently';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Recently';
  }
}

/**
 * CHG-001: Premium Meaningful Changes Surface (/workspace/changes).
 *
 * Answers exactly one core question:
 * "What changed since my last trusted understanding?"
 *
 * Core Architecture & Acceptance Criteria:
 * - AC-01: Default comparison: Previous trusted understanding -> Current trusted understanding.
 * - AC-02: Meaningful only: Filters trivial wire/telemetry noise (header ordering, timestamps, TTL jitter).
 * - AC-03: No telemetry wall: No permanent state transition counters, cycle counters, or active drift banners.
 * - AC-04: One change = one meaning: Clean headline + 1-sentence human-readable explanation.
 * - AC-05: Progressive disclosure: Understanding -> Meaning -> Why it matters -> Evidence.
 * - AC-06: Intentional historical comparison: Accessible on-demand via "Compare understandings ->".
 * - AC-07: Since last visit support: Toggle between "Since last understanding" and "Since last visit".
 * - AC-08: Domain isolation: Bound exclusively to the active domain context.
 * - AC-09: Calm empty state: Comfortable with silence ("Nothing else requires attention.").
 * - AC-10: Backend truth authority: No client-side diff invention or speculative conclusions.
 * - AC-11: Overview untouched.
 * - AC-12: Premium visual standard: Quiet, editorial, spacious, and authoritative.
 */
export const ChangesTimeline: React.FC<ChangesTimelineProps> = ({
  domainId,
  domainName,
  onInvestigateChange,
  onViewSnapshot,
  onViewEvidence,
  onViewInfrastructure,
  onCompareSnapshots,
  initialEvents,
  initialSnapshots,
  className = '',
}) => {
  // Mode selection: 'last_understanding' (default) | 'last_visit'
  const [comparisonMode, setComparisonMode] = useState<'last_understanding' | 'last_visit'>('last_understanding');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Retrieve / track last visit timestamp in local storage
  const [lastVisitedAt, setLastVisitedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storageKey = `atlas_last_visit_${domainId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setLastVisitedAt(stored);
      }
      // Record current visit timestamp for subsequent sessions
      localStorage.setItem(storageKey, new Date().toISOString());
    } catch {
      // Graceful fallback if localStorage is disabled
    }
  }, [domainId]);

  const timelineQuery = useTimeline(
    initialEvents
      ? undefined
      : {
          domainId,
          limit: 50,
        }
  );

  const snapshotsQuery = useSnapshots(initialSnapshots ? undefined : domainId);
  const domainJobsQuery = useDomainUnderstandingJobs(initialSnapshots ? null : domainId);

  const rawEvents = initialEvents
    ? getTimelineEventsArray(initialEvents)
    : getTimelineEventsArray(timelineQuery.data);

  const rawSnapshots = getSnapshotsArray(initialSnapshots || snapshotsQuery.data);

  const activeJob = findActiveJob(domainJobsQuery.data);
  const isUnderstanding = Boolean(activeJob);

  const isLoading =
    (!initialEvents && timelineQuery.isLoading) ||
    (!initialSnapshots && snapshotsQuery.isLoading);
  const isError =
    (!initialEvents && Boolean(timelineQuery.error)) ||
    (!initialSnapshots && Boolean(snapshotsQuery.error));
  const error = timelineQuery.error || snapshotsQuery.error;

  // Filter valid snapshots strictly for active domain context (AC-08)
  const validSnapshots = useMemo(() => {
    return rawSnapshots.filter(
      (s) => Boolean(s.id) && Boolean(s.capturedAt || s.createdAt) && (!s.domainId || s.domainId === domainId)
    );
  }, [rawSnapshots, domainId]);

  // Integration decision
  const integration = integrateAuthoritativeChanges({
    domainId,
    domainName,
    snapshots: validSnapshots,
    timelineEvents: rawEvents,
    isLoading,
    isError,
    isUnderstanding,
  });

  const { state, snapshotPair } = integration;

  // Transform raw events to change stories bound to active domain
  const allDomainStories = useMemo<readonly MeaningfulChangeStory[]>(() => {
    const scopedEvents = rawEvents.filter((e) => !e.domainId || e.domainId === domainId);
    return scopedEvents.map((e) => resolveMeaningfulChangeStory(e, domainName));
  }, [rawEvents, domainId, domainName]);

  // Filter strictly to meaningful changes (AC-02 & AC-03: strips raw wire noise)
  const meaningfulStories = useMemo<readonly MeaningfulChangeStory[]>(() => {
    return filterMeaningfulChanges(allDomainStories);
  }, [allDomainStories]);

  // Scope to the Primary Comparison Boundary (AC-01): Previous Understanding -> Current Understanding
  const primaryPairStories = useMemo<readonly MeaningfulChangeStory[]>(() => {
    if (!snapshotPair.currentSnapshot) {
      return meaningfulStories;
    }

    const currId = snapshotPair.currentSnapshot.id;
    const prevId = snapshotPair.previousSnapshot?.id;

    // Filter changes associated with this latest comparison pair
    const pairFiltered = meaningfulStories.filter((s) => {
      if (s.currentSnapshotId === currId) return true;
      if (prevId && s.previousSnapshotId === prevId) return true;
      // Fallback: if story has no explicit currentSnapshotId, include it if it's recent
      if (!s.currentSnapshotId) return true;
      return false;
    });

    return pairFiltered.length > 0 ? pairFiltered : meaningfulStories;
  }, [meaningfulStories, snapshotPair]);

  // Apply "Since last visit" filtering if selected (AC-07)
  const activeStories = useMemo<readonly MeaningfulChangeStory[]>(() => {
    if (comparisonMode === 'last_visit') {
      return filterChangesSinceLastVisit(primaryPairStories, lastVisitedAt);
    }
    return primaryPairStories;
  }, [primaryPairStories, comparisonMode, lastVisitedAt]);

  // Category filtering
  const filteredStories = useMemo<readonly MeaningfulChangeStory[]>(() => {
    if (selectedCategory === 'ALL') return activeStories;
    return activeStories.filter((s) => s.category === selectedCategory);
  }, [activeStories, selectedCategory]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: activeStories.length };
    for (const story of activeStories) {
      counts[story.category] = (counts[story.category] || 0) + 1;
    }
    return counts;
  }, [activeStories]);

  const hasMeaningfulChanges = activeStories.length > 0;
  const latestCaptureFormatted = formatDateTimeShort(
    snapshotPair.currentSnapshot?.capturedAt || snapshotPair.currentSnapshot?.createdAt
  );

  // 1. Loading State
  if (state === 'LOADING') {
    return (
      <div className={`w-full py-16 flex justify-center ${className}`} aria-label="Infrastructure Changes">
        <LoadingState
          label="Reviewing changes..."
          description={`Analyzing differences between verified understandings for ${domainName}`}
        />
      </div>
    );
  }

  // 2. Error State
  if (state === 'ERROR') {
    return (
      <div className={`w-full py-16 flex justify-center ${className}`} aria-label="Infrastructure Changes">
        <ErrorState
          error={error}
          title="Failed to Load Changes"
          description={`Could not retrieve snapshot changes for ${domainName}.`}
          retryLabel="Retry"
          onRetry={() => {
            timelineQuery.refetch();
            snapshotsQuery.refetch();
          }}
        />
      </div>
    );
  }

  // 3. Unavailable State
  if (state === 'UNAVAILABLE') {
    return (
      <div className={`w-full py-16 flex justify-center ${className}`} aria-label="Infrastructure Changes">
        <UnavailableState
          title="Changes Unavailable"
          description="Changes cannot be accessed due to tenant boundaries or unavailable telemetry."
        />
      </div>
    );
  }

  // 4. Empty State (0 understandings recorded)
  if (state === 'EMPTY') {
    return (
      <div
        className="w-full max-w-2xl mx-auto py-12 px-6 text-center space-y-4"
        data-testid="empty-changes-card"
      >
        <Cluster gap="xs" align="center" justify="center">
          <Layers className="w-4 h-4 text-[#5F625F] dark:text-muted-foreground" />
          <Eyebrow variant="muted" className="text-[11px] font-mono uppercase tracking-wider">
            CHANGES
          </Eyebrow>
        </Cluster>

        <div className="space-y-1.5">
          <Display className="text-xl font-medium text-foreground tracking-tight">
            No understandings recorded
          </Display>
          <BodySmall variant="muted" className="text-xs text-[#5F625F] dark:text-muted-foreground max-w-md mx-auto leading-relaxed">
            Run an understanding cycle for {domainName} to establish the initial baseline and track infrastructure evolution.
          </BodySmall>
        </div>

        <div className="pt-2 flex justify-center">
          <UnderstandNowButton domainId={domainId} domainName={domainName} />
        </div>
      </div>
    );
  }

  // 5. Genesis Baseline (First Understanding)
  if (state === 'FIRST_UNDERSTANDING') {
    return (
      <div className="w-full max-w-3xl mx-auto py-8 px-4 space-y-6" data-testid="first-understanding-root">
        <div
          className="w-full bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-xl p-6 sm:p-8 space-y-4 shadow-[0_1px_2px_rgba(16,24,20,0.02)]"
          data-testid="first-understanding-card"
        >
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#EEEEEB] dark:border-border-divider font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#178A68]" />
              <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                Genesis Baseline Active
              </span>
            </div>

            {onViewInfrastructure && (
              <button
                type="button"
                onClick={onViewInfrastructure}
                className="text-[#3568C8] dark:text-primary hover:underline cursor-pointer text-xs"
                data-testid="view-infrastructure-link"
              >
                <span>View architecture &rarr;</span>
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-medium text-foreground tracking-tight">
              Initial baseline established for {domainName}
            </h3>
            <p className="text-xs sm:text-sm text-[#5F625F] dark:text-muted-foreground leading-relaxed">
              Nebula established the initial verified understanding. Subsequent cycles will detect meaningful changes, DNS shifts, and defensive posture drift against this genesis state.
            </p>
          </div>

          <div className="pt-3 border-t border-[#EEEEEB] dark:border-border-divider font-mono text-xs text-[#5F625F] dark:text-muted-foreground flex items-center justify-between">
            <span>Last understood · {latestCaptureFormatted}</span>
            <span className="text-foreground font-medium">Nothing else requires attention.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-8 py-2 ${className}`} data-testid="changes-timeline-surface">
      {/* Understanding In-Progress Banner */}
      {isUnderstanding && (
        <div
          className="p-3 bg-[#EEF4FF] dark:bg-blue-950/20 border border-[#C8D8F6] dark:border-blue-900/30 rounded-xl flex items-center justify-between gap-3 text-xs text-[#3568C8] dark:text-blue-400 font-mono"
          data-testid="changes-understanding-in-progress-banner"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 animate-pulse shrink-0" />
            <span>Understanding in progress — analyzing observations against baseline for {domainName}.</span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider">Analyzing</span>
        </div>
      )}

      {/* Surface Header & Hero Question (Section 3 & 11) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <Eyebrow variant="muted" className="text-[11px] font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
              CHANGES
            </Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-foreground tracking-tight">
              {domainName}
            </h2>
          </div>

          {/* Temporal Comparison Mode Switcher (AC-01 & AC-07) */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border text-xs font-mono self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setComparisonMode('last_understanding')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] font-medium ${
                comparisonMode === 'last_understanding'
                  ? 'bg-[#FFFFFF] dark:bg-card text-foreground shadow-xs font-semibold'
                  : 'text-[#5F625F] dark:text-muted-foreground hover:text-foreground'
              }`}
            >
              Since last understanding
            </button>
            <button
              type="button"
              onClick={() => setComparisonMode('last_visit')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] font-medium ${
                comparisonMode === 'last_visit'
                  ? 'bg-[#FFFFFF] dark:bg-card text-foreground shadow-xs font-semibold'
                  : 'text-[#5F625F] dark:text-muted-foreground hover:text-foreground'
              }`}
            >
              Since last visit
            </button>
          </div>
        </div>

        {/* Hero Meaning Headline */}
        <div className="pb-2 border-b border-[#EEEEEB] dark:border-border-divider">
          <p className="text-sm sm:text-base text-foreground font-medium">
            {hasMeaningfulChanges ? (
              <span>
                <strong>{activeStories.length}</strong> meaningful {activeStories.length === 1 ? 'change' : 'changes'}{' '}
                {comparisonMode === 'last_visit' ? 'since your last visit' : 'since your last understanding'}
              </span>
            ) : (
              <span>
                No meaningful changes{' '}
                {comparisonMode === 'last_visit' ? 'since your last visit' : 'since your last understanding'}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Category Filter Pills (if multiple categories present) */}
      {hasMeaningfulChanges && Object.keys(categoryCounts).length > 2 && (
        <div className="flex items-center gap-1.5 flex-wrap font-mono text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#18181B] dark:bg-primary text-white dark:text-primary-foreground'
                : 'bg-[#F4F4F1] dark:bg-surface-metadata text-[#5F625F] dark:text-muted-foreground hover:bg-[#EBEBE6]'
            }`}
          >
            All ({categoryCounts.ALL || 0})
          </button>

          {AUTHORITATIVE_CHANGE_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] || 0;
            if (count === 0) return null;
            const isSelected = selectedCategory === cat;
            const label = CHANGE_CATEGORY_LABELS[cat] || cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#18181B] dark:bg-primary text-white dark:text-primary-foreground'
                    : 'bg-[#F4F4F1] dark:bg-surface-metadata text-[#5F625F] dark:text-muted-foreground hover:bg-[#EBEBE6]'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Calm Empty / Quiet State (AC-09 & Section 10) */}
      {!hasMeaningfulChanges && (
        <div
          className="w-full bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-xl p-6 sm:p-8 space-y-4 shadow-[0_1px_2px_rgba(16,24,20,0.02)]"
          data-testid="quiet-changes-card"
        >
          <div className="flex items-center gap-2 font-mono text-xs">
            <CheckCircle2 className="w-4 h-4 text-[#178A68]" />
            <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
              No Meaningful Changes
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-medium text-foreground tracking-tight">
              Your infrastructure remains consistent with the previous trusted understanding.
            </h3>
            <p className="text-xs sm:text-sm text-[#5F625F] dark:text-muted-foreground leading-relaxed">
              Nebula evaluated current observations against prior baseline snapshots and found no modifications to DNS routing, security policies, certificates, or technology stacks.
            </p>
          </div>

          <div className="pt-3 border-t border-[#EEEEEB] dark:border-border-divider font-mono text-xs text-[#5F625F] dark:text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Last understood &bull; {latestCaptureFormatted}</span>
            <span className="text-foreground font-medium">Nothing else requires attention.</span>
          </div>
        </div>
      )}

      {/* Meaningful Changes List (Section 3 & 11) */}
      {hasMeaningfulChanges && (
        <div className="space-y-4" data-testid="scoped-changes-matrix">
          <div className="flex items-center justify-between font-mono text-xs text-[#5F625F] dark:text-muted-foreground">
            <span className="uppercase tracking-wider font-semibold text-[11px]">
              WHAT CHANGED
            </span>
            <span className="text-[11px]">
              {filteredStories.length} {filteredStories.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="space-y-3">
            {filteredStories.map((story) => (
              <ChangeStoryCard
                key={story.changeId}
                change={story}
                onInvestigate={onInvestigateChange}
                onViewEvidence={onViewEvidence}
                onViewSnapshot={onViewSnapshot}
                onViewPreviousSnapshot={onViewSnapshot}
              />
            ))}
          </div>

          {/* Reassurance Closing Note (AC-09 & Section 3) */}
          <div className="pt-4 text-center">
            <p className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
              Nothing else requires attention.
            </p>
          </div>
        </div>
      )}

      {/* Intentional Historical Comparison Affordance (AC-06 & Section 7) */}
      <div
        className="pt-6 border-t border-[#EEEEEB] dark:border-border-divider flex items-center justify-between gap-4 font-mono text-xs"
        data-testid="changes-history-footer"
      >
        {onCompareSnapshots && snapshotPair.hasComparisonPair && snapshotPair.currentSnapshot && snapshotPair.previousSnapshot ? (
          <button
            type="button"
            onClick={() =>
              onCompareSnapshots(
                snapshotPair.previousSnapshot!.id,
                snapshotPair.currentSnapshot!.id
              )
            }
            className="text-[#3568C8] dark:text-primary hover:underline cursor-pointer inline-flex items-center gap-1.5 font-medium"
            data-testid="compare-snapshots-button"
          >
            <span>Compare understandings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-[#5F625F] dark:text-muted-foreground text-[11px]">
            Historical memory preserved
          </span>
        )}

        <div className="flex items-center gap-3">
          {onViewInfrastructure && (
            <button
              type="button"
              onClick={onViewInfrastructure}
              className="text-[#5F625F] dark:text-muted-foreground hover:text-foreground cursor-pointer text-[11px]"
            >
              <span>View Active Architecture &rarr;</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

ChangesTimeline.displayName = 'ChangesTimeline';
export default ChangesTimeline;
