import type { TimelineEventDto, InfrastructureSnapshotDto } from '../../../types/api';
import {
  resolveMeaningfulChangeStory,
  type MeaningfulChangeStory,
} from './changes.contract.ts';

export type TimelineDensityTier = 'RICH' | 'COMPACT' | 'DENSE';

export interface TimelineEpochGroup {
  readonly epochKey: string;
  readonly epochLabel: string;
  readonly epochSubLabel?: string;
  readonly items: readonly TimelineEpochItem[];
}

export interface TimelineEpochItem {
  readonly event: TimelineEventDto;
  readonly story: MeaningfulChangeStory;
  readonly densityTier: TimelineDensityTier;
  readonly timeFormatted: string;
  readonly dateFormatted: string;
  readonly ageInDays: number;
}

export interface InfrastructureOriginDetails {
  readonly originDateFormatted: string;
  readonly originSnapshotId?: string | null;
  readonly originLabel: string;
  readonly totalSnapshotsRecorded?: number;
}

export interface InfiniteTimelinePartitionParams {
  readonly events: readonly TimelineEventDto[];
  readonly domainName?: string;
  readonly baselineSnapshot?: InfrastructureSnapshotDto | null;
  readonly hasNextPage?: boolean;
}

export interface InfiniteTimelinePartitionResult {
  readonly epochs: readonly TimelineEpochGroup[];
  readonly totalEvents: number;
  readonly originDetails: InfrastructureOriginDetails | null;
  readonly isOriginReached: boolean;
  readonly hasEvents: boolean;
}

/**
 * Calculates calendar age in days relative to current time.
 */
export function getCalendarDaysAgo(date: Date, now: Date = new Date()): number {
  const startOfDayNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDayTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffMs = startOfDayNow - startOfDayTarget;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Derives the progressive density tier strictly based on temporal age.
 * - 0–1 days (Today / Yesterday): RICH (Full intelligence story)
 * - 2–14 days: COMPACT (Structured row with outcome and significance)
 * - >14 days: DENSE (Ultra-dense single-line ledger)
 */
export function resolveTimelineDensityTier(daysAgo: number): TimelineDensityTier {
  if (daysAgo <= 1) return 'RICH';
  if (daysAgo <= 14) return 'COMPACT';
  return 'DENSE';
}

/**
 * Formats epoch display label from date.
 */
export function resolveEpochLabel(date: Date, daysAgo: number): { label: string; key: string } {
  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
  ];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  if (daysAgo === 0) {
    return {
      key: `today-${year}-${date.getMonth()}-${day}`,
      label: `TODAY · ${month} ${day}, ${year}`,
    };
  }

  if (daysAgo === 1) {
    return {
      key: `yesterday-${year}-${date.getMonth()}-${day}`,
      label: `YESTERDAY · ${month} ${day}, ${year}`,
    };
  }

  if (daysAgo <= 7) {
    return {
      key: `this-week-${year}-${date.getMonth()}`,
      label: 'EARLIER THIS WEEK',
    };
  }

  if (daysAgo <= 30) {
    return {
      key: `this-month-${year}-${date.getMonth()}`,
      label: `EARLIER THIS MONTH · ${month} ${year}`,
    };
  }

  return {
    key: `month-${year}-${date.getMonth()}`,
    label: `${month} ${year}`,
  };
}

/**
 * Deduplicates and sorts timeline events strictly in descending chronological order.
 */
export function deduplicateAndSortTimelineEvents(
  events: readonly TimelineEventDto[]
): TimelineEventDto[] {
  const seenIds = new Set<string>();
  const unique: TimelineEventDto[] = [];

  for (const evt of events) {
    if (!evt || !evt.id) continue;
    if (seenIds.has(evt.id)) continue;
    seenIds.add(evt.id);
    unique.push(evt);
  }

  return unique.sort((a, b) => {
    const timeA = new Date(a.detectedAt || (typeof a.timestamp === 'string' ? a.timestamp : 0)).getTime() || 0;
    const timeB = new Date(b.detectedAt || (typeof b.timestamp === 'string' ? b.timestamp : 0)).getTime() || 0;
    return timeB - timeA;
  });
}

/**
 * Pure function partitioning timeline events into sticky chronological epochs with progressive density (WX-1026).
 */
export function partitionInfiniteTimeline(
  params: InfiniteTimelinePartitionParams
): InfiniteTimelinePartitionResult {
  const { events = [], domainName, baselineSnapshot, hasNextPage = false } = params;
  const sortedEvents = deduplicateAndSortTimelineEvents(events);
  const now = new Date();

  const epochMap = new Map<string, { label: string; items: TimelineEpochItem[] }>();

  for (const event of sortedEvents) {
    const rawDate = event.detectedAt || (typeof event.timestamp === 'string' ? event.timestamp : '');
    const date = rawDate ? new Date(rawDate) : new Date();
    const validDate = isNaN(date.getTime()) ? new Date() : date;

    const daysAgo = getCalendarDaysAgo(validDate, now);
    const { key, label } = resolveEpochLabel(validDate, daysAgo);
    const densityTier = resolveTimelineDensityTier(daysAgo);

    const story = resolveMeaningfulChangeStory(event, domainName || event.domainName);

    const timeFormatted = validDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const dateFormatted = validDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const item: TimelineEpochItem = {
      event,
      story,
      densityTier,
      timeFormatted,
      dateFormatted,
      ageInDays: daysAgo,
    };

    const existing = epochMap.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      epochMap.set(key, { label, items: [item] });
    }
  }

  const epochs: TimelineEpochGroup[] = Array.from(epochMap.entries()).map(([epochKey, group]) => ({
    epochKey,
    epochLabel: group.label,
    items: group.items,
  }));

  // Derive Infrastructure Origin when no further pages exist
  let originDetails: InfrastructureOriginDetails | null = null;
  const isOriginReached = !hasNextPage && sortedEvents.length > 0;

  if (isOriginReached) {
    const earliestEvent = sortedEvents[sortedEvents.length - 1];
    const rawOriginDate =
      baselineSnapshot?.capturedAt ||
      baselineSnapshot?.createdAt ||
      earliestEvent?.detectedAt ||
      (typeof earliestEvent?.timestamp === 'string' ? earliestEvent.timestamp : null);

    const originDate = rawOriginDate ? new Date(rawOriginDate) : new Date();
    const originDateFormatted = isNaN(originDate.getTime())
      ? 'Initial Baseline'
      : originDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });

    originDetails = {
      originDateFormatted,
      originSnapshotId: baselineSnapshot?.id || earliestEvent?.previousSnapshotId || earliestEvent?.snapshotId || null,
      originLabel: 'Initial Baseline Established',
      totalSnapshotsRecorded: sortedEvents.length,
    };
  }

  return {
    epochs,
    totalEvents: sortedEvents.length,
    originDetails,
    isOriginReached,
    hasEvents: sortedEvents.length > 0,
  };
}

export const INFINITE_TIMELINE_CERTIFIED_INVARIANTS = {
  TIMELINE_IS_CHRONOLOGICAL:
    'Changes timeline is strictly ordered newest to oldest by authoritative event timestamps.',
  TIMELINE_USES_CURSOR_AUTHORITY:
    'Infinite scrolling uses cursor-based pagination from backend without client-side synthetic gaps.',
  NO_DUPLICATE_TIMELINE_ENTRIES:
    'Cursor transitions and infinite query pages must deduplicate timeline items deterministically.',
  NO_GAPS_WITHOUT_EXPLICIT_BACKEND_BOUNDARY:
    'No temporal gaps may exist in timeline presentation without explicit backend demarcation.',
  ORIGIN_REPRESENTS_TRUE_FIRST_SNAPSHOT:
    'Infrastructure Origin Seal is rendered strictly when backend confirms no earlier historical cursor exists.',
  CURRENT_STATE_REMAINS_DISTINCT_FROM_HISTORY:
    'Current active state is clearly delineated from historical change archive entries.',
  CHANGE_TIMESTAMP_IS_AUTHORITATIVE:
    'Timestamps and epochs reflect authoritative backend detection dates, never frontend render times.',
  DOMAIN_CONTEXT_IS_PRESERVED:
    'Multi-domain and single-domain filtering preserves isolated domain lineage and identifiers.',
  TIMELINE_FILTERS_DO_NOT_CREATE_NEW_TRUTH:
    'Filtering by domain or category queries the canonical timeline without synthesizing altered conclusions.',
  HISTORICAL_DENSITY_DOES_NOT_REMOVE_MEANING:
    'Progressive density increases compactness for older history while preserving full meaning and inspectability.',
  NO_SILENT_HISTORY_TRUNCATION:
    'If backend has more history, UI must never falsely imply currently loaded items represent complete archive.',
} as const;
