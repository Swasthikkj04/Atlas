import React from 'react';
import {
  PageTitle,
  Eyebrow,
} from '../../../../components/typography';
import { Stack } from '../../../../components/layout';
import { UnderstandNowButton, ActiveUnderstandingBanner } from '../understanding';
import {
  useDomainUnderstandingJobs,
} from '../../../../hooks/queries/useUnderstanding';
import { useSnapshots } from '../../../../hooks/queries/useSnapshots';
import { useTimeline } from '../../../../hooks/queries/useTimeline';
import { findActiveJob } from '../../contracts/understanding-convergence.contract';
import { resolveUnderstandingLifecycleState } from '../../contracts/understanding-lifecycle.contract';
import { DomainFavicon } from '../identity';
import type { ReturningWorkspaceEntryProps } from './ReturningWorkspaceEntry.types';

/**
 * Authoritative Returning Workspace Entry (WX-500-SHELL-04 / WX-905 / WX-907 / WX-908 / WX-1012 / WX-1018).
 *
 * Dedicated entry surface for the primary authenticated Workspace:
 * - Eyebrow: CURRENT INFRASTRUCTURE INTELLIGENCE
 * - Deliberate Header Action Zone:
 *     - Left: Domain Title ({domainName}) + Semantic-First Understanding State & Temporal Recency (WX-1018)
 *     - Right: Primary Manual Action ([ ✦ Understand now ])
 * - Active Understanding Experience Banner: Truthful real-time state indicator (WX-907)
 * - Slot for Current Intelligence (Executive Brief, Stories, Quiet State)
 */
export const ReturningWorkspaceEntry: React.FC<ReturningWorkspaceEntryProps> = ({
  activeDomain,
  children,
  className = '',
  ...rest
}) => {
  const domainJobsQuery = useDomainUnderstandingJobs(activeDomain.id);
  const snapshotsQuery = useSnapshots(activeDomain.id);
  const timelineQuery = useTimeline({ domainId: activeDomain.id });

  const jobsList = domainJobsQuery.data || [];
  const activeJob = findActiveJob(jobsList);
  const sortedJobs = [...jobsList].sort((a, b) => {
    const timeA = new Date(a.completedAt || a.startedAt || 0).getTime();
    const timeB = new Date(b.completedAt || b.startedAt || 0).getTime();
    return timeB - timeA;
  });
  const latestJob = sortedJobs.length > 0 ? sortedJobs[0] : null;

  const rawSnapshots =
    snapshotsQuery.data?.snapshots ||
    snapshotsQuery.data?.data ||
    (Array.isArray(snapshotsQuery.data) ? snapshotsQuery.data : []);
  const sortedSnapshots = [...rawSnapshots].sort((a, b) => {
    const timeA = new Date(a.capturedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.capturedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });
  const latestSnapshot = sortedSnapshots.length > 0 ? sortedSnapshots[0] : null;
  const previousSnapshot = sortedSnapshots.length > 1 ? sortedSnapshots[1] : null;

  const timelineEvents = timelineQuery.data?.events || timelineQuery.data?.data || (Array.isArray(timelineQuery.data) ? timelineQuery.data : []);
  const meaningfulChangesCount = timelineEvents.length;

  const lifecycle = resolveUnderstandingLifecycleState({
    activeJob,
    latestJob,
    latestSnapshot,
    previousSnapshot,
    totalSnapshots: sortedSnapshots.length,
    meaningfulChangesCount,
    lastScanAt:
      activeDomain.lastUnderstoodAt ||
      activeDomain.lastScanAt ||
      activeDomain.updatedAt,
  });

  return (
    <Stack gap="xl" className={`relative z-10 w-full ${className}`} {...rest}>
      {/* 1. Context Orientation & Domain Header Action Zone (WX-908 / WX-1012 / WX-1017 / WX-1018) */}
      <div className="pb-5 border-b border-[#EEEEEB] dark:border-border-divider space-y-3" data-testid="workspace-header-action-zone">
        <Eyebrow variant="muted" className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.24em] text-[#5F625F] dark:text-muted-foreground">
          CURRENT INFRASTRUCTURE INTELLIGENCE
        </Eyebrow>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6 pt-1">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <DomainFavicon
                domain={activeDomain.domainName}
                size="primary"
              />
              <PageTitle className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-foreground leading-[1.12] font-display">
                {activeDomain.domainName}
              </PageTitle>
            </div>

            {/* Semantic-First Understanding State & Temporal Recency (WX-1018) */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs font-mono text-[#5F625F] dark:text-muted-foreground" data-testid="understanding-freshness-metadata">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${lifecycle.badge.bg} ${lifecycle.badge.text} ${lifecycle.badge.border}`}
                data-testid="understanding-status-badge"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${lifecycle.badge.dotColor} ${
                    lifecycle.badge.isPulsing ? 'animate-pulse' : ''
                  }`}
                />
                {lifecycle.badge.label}
              </span>

              <span className="opacity-40">&bull;</span>
              <span className="text-foreground/90 font-medium" data-testid="understanding-freshness-headline">
                {lifecycle.semanticHeadline}
              </span>

              <span className="opacity-40">&bull;</span>
              <span className="text-foreground/80" data-testid="understanding-temporal-subtitle">
                {lifecycle.temporalSubtitle}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center pt-1 md:pt-0">
            <UnderstandNowButton
              domainId={activeDomain.id}
              domainName={activeDomain.domainName}
            />
          </div>
        </div>
      </div>

      {/* Active Understanding Experience Banner (WX-907) */}
      <ActiveUnderstandingBanner
        domainId={activeDomain.id}
        domainName={activeDomain.domainName}
      />

      {/* 2. Primary Intelligence Canvas Slot */}
      {children && <div className="w-full space-y-8 sm:space-y-10">{children}</div>}
    </Stack>
  );
};

ReturningWorkspaceEntry.displayName = 'ReturningWorkspaceEntry';
