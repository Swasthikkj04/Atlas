import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  partitionInfiniteTimeline,
  resolveTimelineDensityTier,
  getCalendarDaysAgo,
  deduplicateAndSortTimelineEvents,
  INFINITE_TIMELINE_CERTIFIED_INVARIANTS,
} from './contracts/infinite-timeline.contract.ts';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { TimelineEventDto, InfrastructureSnapshotDto } from '../../types/api';

const mockTimelineEvents: TimelineEventDto[] = [
  // Today
  {
    id: 'evt-today-1',
    domainId: 'dom-1',
    domainName: 'openai.com',
    changeType: 'IMPROVED',
    severity: 'LOW',
    title: 'Content-Security-Policy improved',
    summary: 'Protection improved',
    explanation: 'Defensive posture strengthened.',
    detectedAt: '2026-08-26T09:20:00Z',
  },
  // Yesterday (1 day ago)
  {
    id: 'evt-yesterday-1',
    domainId: 'dom-2',
    domainName: 'example.com',
    changeType: 'CHANGED',
    severity: 'LOW',
    title: 'CDN routing updated',
    summary: 'Edge proxy configuration changed',
    explanation: 'Infrastructure architecture changed.',
    detectedAt: '2026-08-25T14:30:00Z',
  },
  // 5 days ago (Compact density)
  {
    id: 'evt-week-1',
    domainId: 'dom-1',
    domainName: 'openai.com',
    changeType: 'IMPROVED',
    severity: 'LOW',
    title: 'TLS Certificate renewed',
    summary: 'Routine renewal completed',
    explanation: 'Encryption continuity guaranteed.',
    detectedAt: '2026-08-21T10:00:00Z',
  },
  // 20 days ago (Dense ledger density)
  {
    id: 'evt-old-1',
    domainId: 'dom-3',
    domainName: 'amazon.com',
    changeType: 'ADDED',
    severity: 'INFORMATIONAL',
    title: 'DNS TXT Record Added',
    summary: 'SPF verification record added',
    explanation: 'Email authentication configured.',
    detectedAt: '2026-08-06T08:00:00Z',
  },
];

const mockBaselineSnapshot: InfrastructureSnapshotDto = {
  id: 'snp-genesis-001',
  domainId: 'dom-1',
  capturedAt: '2026-08-01T00:00:00Z',
  createdAt: '2026-08-01T00:00:00Z',
  responseTimeMs: 120,
};

describe('WX-1026: Changes Timeline Infinite Historical Intelligence', () => {
  describe('1. Sticky Chronological Epoch Partitioning', () => {
    it('partitions timeline into chronological epochs newest to oldest', () => {
      const result = partitionInfiniteTimeline({
        events: mockTimelineEvents,
        domainName: 'openai.com',
        baselineSnapshot: mockBaselineSnapshot,
        hasNextPage: false,
      });

      assert.equal(result.hasEvents, true);
      assert.equal(result.totalEvents, 4);
      assert.ok(result.epochs.length >= 3);

      // Verify first epoch is Today
      assert.ok(result.epochs[0].epochLabel.includes('TODAY'));
      assert.equal(result.epochs[0].items[0].event.id, 'evt-today-1');

      // Verify second epoch is Yesterday
      assert.ok(result.epochs[1].epochLabel.includes('YESTERDAY'));
      assert.equal(result.epochs[1].items[0].event.id, 'evt-yesterday-1');
    });

    it('deduplicates events across cursor page boundaries deterministically', () => {
      const duplicatedEvents = [
        ...mockTimelineEvents,
        mockTimelineEvents[0], // Duplicate
        mockTimelineEvents[1], // Duplicate
      ];

      const deduplicated = deduplicateAndSortTimelineEvents(duplicatedEvents);
      assert.equal(deduplicated.length, 4);
      assert.equal(deduplicated[0].id, 'evt-today-1');
    });
  });

  describe('2. Progressive Density Architecture', () => {
    it('calculates calendar days accurately', () => {
      const targetDate = new Date('2026-08-20T10:00:00Z');
      const referenceNow = new Date('2026-08-26T12:00:00Z');
      assert.equal(getCalendarDaysAgo(targetDate, referenceNow), 6);
    });

    it('assigns RICH density for recent events (≤ 1 day)', () => {
      assert.equal(resolveTimelineDensityTier(0), 'RICH');
      assert.equal(resolveTimelineDensityTier(1), 'RICH');
    });

    it('assigns COMPACT density for 2–14 day old history', () => {
      assert.equal(resolveTimelineDensityTier(2), 'COMPACT');
      assert.equal(resolveTimelineDensityTier(7), 'COMPACT');
      assert.equal(resolveTimelineDensityTier(14), 'COMPACT');
    });

    it('assigns DENSE ledger density for older history (> 14 days)', () => {
      assert.equal(resolveTimelineDensityTier(15), 'DENSE');
      assert.equal(resolveTimelineDensityTier(60), 'DENSE');
    });

    it('partitions items with matching density tiers', () => {
      const result = partitionInfiniteTimeline({
        events: mockTimelineEvents,
        domainName: 'openai.com',
      });

      const todayItem = result.epochs[0].items[0];
      assert.equal(todayItem.densityTier, 'RICH');

      const weekEpoch = result.epochs.find((e) => e.items.some((i) => i.event.id === 'evt-week-1'));
      const weekItem = weekEpoch?.items.find((i) => i.event.id === 'evt-week-1');
      assert.equal(weekItem?.densityTier, 'COMPACT');

      const oldEpoch = result.epochs.find((e) => e.items.some((i) => i.event.id === 'evt-old-1'));
      const oldItem = oldEpoch?.items.find((i) => i.event.id === 'evt-old-1');
      assert.equal(oldItem?.densityTier, 'DENSE');
    });
  });

  describe('3. Infrastructure Origin Seal', () => {
    it('renders origin seal only when hasNextPage is false', () => {
      const activePagingResult = partitionInfiniteTimeline({
        events: mockTimelineEvents,
        hasNextPage: true,
      });
      assert.equal(activePagingResult.isOriginReached, false);
      assert.equal(activePagingResult.originDetails, null);

      const completedPagingResult = partitionInfiniteTimeline({
        events: mockTimelineEvents,
        baselineSnapshot: mockBaselineSnapshot,
        hasNextPage: false,
      });
      assert.equal(completedPagingResult.isOriginReached, true);
      assert.ok(completedPagingResult.originDetails);
      assert.ok(completedPagingResult.originDetails.originDateFormatted.includes('August 1, 2026'));
      assert.equal(completedPagingResult.originDetails.originSnapshotId, 'snp-genesis-001');
    });
  });

  describe('4. Certified Truth Matrix & Invariants', () => {
    it('verifies WX-1026 registration in Truth Matrix', () => {
      const matrixEntry = WORKSPACE_TRUTH_MATRIX.find(
        (e) => e.capability === 'Changes Timeline: Infinite Historical Intelligence (WX-1026)'
      );
      assert.ok(matrixEntry, 'WX-1026 must be present in WORKSPACE_TRUTH_MATRIX');
      assert.equal(matrixEntry.status, 'PRODUCTION_READY');
      assert.equal(matrixEntry.category, 'Changes');
    });

    it('verifies all 11 certified invariants for WX-1026', () => {
      const invariants = [
        'TIMELINE_IS_CHRONOLOGICAL',
        'TIMELINE_USES_CURSOR_AUTHORITY',
        'NO_DUPLICATE_TIMELINE_ENTRIES',
        'NO_GAPS_WITHOUT_EXPLICIT_BACKEND_BOUNDARY',
        'ORIGIN_REPRESENTS_TRUE_FIRST_SNAPSHOT',
        'CURRENT_STATE_REMAINS_DISTINCT_FROM_HISTORY',
        'CHANGE_TIMESTAMP_IS_AUTHORITATIVE',
        'DOMAIN_CONTEXT_IS_PRESERVED',
        'TIMELINE_FILTERS_DO_NOT_CREATE_NEW_TRUTH',
        'HISTORICAL_DENSITY_DOES_NOT_REMOVE_MEANING',
        'NO_SILENT_HISTORY_TRUNCATION',
      ] as const;

      for (const inv of invariants) {
        assert.ok(inv in INFINITE_TIMELINE_CERTIFIED_INVARIANTS);
        assert.ok(inv in WORKSPACE_CERTIFIED_INVARIANTS);
        assert.ok(
          WORKSPACE_CERTIFIED_INVARIANTS[inv].length > 0,
          `Invariant ${inv} must have descriptive text`
        );
      }
    });
  });
});
