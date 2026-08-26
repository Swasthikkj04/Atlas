import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveChangesState,
  resolveMeaningfulChangeStory,
  getSnapshotsArray,
  getTimelineEventsArray,
  CHANGES_COPY,
  CHANGES_CERTIFIED_INVARIANTS,
} from './contracts/changes.contract.ts';
import {
  integrateAuthoritativeChanges,
  resolveHistoricalSnapshotComparison,
} from './contracts/snapshot-comparison.contract.ts';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import type {
  InfrastructureSnapshotDto,
  TimelineEventDto,
  SnapshotListResponseDto,
  TimelineResponseDto,
} from '../../types/api';

const mockDomainA = 'dom-ding-001';
const mockDomainB = 'dom-other-002';
const mockDomainAName = 'ding.com';

const mockSnapshot1: InfrastructureSnapshotDto = {
  id: 'snp-res-001',
  domainId: mockDomainA,
  capturedAt: '2026-08-20T10:00:00Z',
  createdAt: '2026-08-20T10:00:00Z',
};

const mockSnapshot2: InfrastructureSnapshotDto = {
  id: 'snp-res-002',
  domainId: mockDomainA,
  capturedAt: '2026-08-23T12:00:00Z',
  createdAt: '2026-08-23T12:00:00Z',
};

const mockChangeEvent: TimelineEventDto = {
  id: 'evt-res-001',
  domainId: mockDomainA,
  domainName: mockDomainAName,
  snapshotId: 'snp-res-002',
  currentSnapshotId: 'snp-res-002',
  previousSnapshotId: 'snp-res-001',
  changeType: 'MODIFIED',
  category: 'tls_ssl',
  severity: 'MEDIUM',
  title: 'TLS Certificate renewed',
  previousValue: 'Expires Sep 1',
  currentValue: 'Expires Dec 1',
  detectedAt: '2026-08-23T12:00:05Z',
  evidenceCount: 0, // Honest 0 evidence
};

describe('WX-1009: Changes State Resolution & Snapshot Visibility Correction', () => {
  describe('1. Response Shape Extraction Normalization (Backend API Integration)', () => {
    it('correctly extracts snapshots from paginated backend response { data: [...] }', () => {
      const paginatedResponse: SnapshotListResponseDto = {
        data: [mockSnapshot2, mockSnapshot1],
        pagination: { page: 1, limit: 20, total: 2, pages: 1 },
      };

      const extracted = getSnapshotsArray(paginatedResponse);
      assert.equal(extracted.length, 2);
      assert.equal(extracted[0].id, 'snp-res-002');
      assert.equal(extracted[1].id, 'snp-res-001');
    });

    it('correctly extracts snapshots from legacy/alternate shape { snapshots: [...] } and raw arrays', () => {
      const legacyResponse = { snapshots: [mockSnapshot1] };
      const rawArray = [mockSnapshot2];

      assert.equal(getSnapshotsArray(legacyResponse).length, 1);
      assert.equal(getSnapshotsArray(rawArray).length, 1);
      assert.equal(getSnapshotsArray(null).length, 0);
    });

    it('correctly extracts timeline events from { data: [...] }, { events: [...] }, and raw arrays', () => {
      const dataResponse: TimelineResponseDto = { data: [mockChangeEvent] };
      const eventsResponse = { events: [mockChangeEvent] };
      const rawArray = [mockChangeEvent];

      assert.equal(getTimelineEventsArray(dataResponse).length, 1);
      assert.equal(getTimelineEventsArray(eventsResponse).length, 1);
      assert.equal(getTimelineEventsArray(rawArray).length, 1);
      assert.equal(getTimelineEventsArray(null).length, 0);
    });
  });

  describe('2. Authoritative State Resolution Matrix (Zero -> Single -> Multi)', () => {
    it('resolves EMPTY ("No infrastructure changes recorded.") when 0 snapshots and 0 events exist', () => {
      const state = resolveChangesState({
        snapshots: [],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(state, 'EMPTY');
      assert.equal(CHANGES_COPY.EMPTY_HEADLINE, 'No infrastructure changes recorded.');
    });

    it('resolves FIRST_UNDERSTANDING ("No changes yet.") when exactly 1 snapshot exists with 0 events', () => {
      const state = resolveChangesState({
        snapshots: [mockSnapshot1],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(state, 'FIRST_UNDERSTANDING');
      assert.equal(CHANGES_COPY.FIRST_UNDERSTANDING_HEADLINE, 'No changes yet.');
    });

    it('resolves QUIET ("No meaningful changes detected.") when 2+ snapshots exist with 0 events', () => {
      const state = resolveChangesState({
        snapshots: [mockSnapshot2, mockSnapshot1],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(state, 'QUIET');
      assert.equal(CHANGES_COPY.QUIET_HEADLINE, 'No meaningful changes detected.');
    });

    it('resolves READY (Authoritative stories) when 2+ snapshots exist with >0 events', () => {
      const integration = integrateAuthoritativeChanges({
        domainId: mockDomainA,
        domainName: mockDomainAName,
        snapshots: [mockSnapshot2, mockSnapshot1],
        timelineEvents: [mockChangeEvent],
        isLoading: false,
        isError: false,
      });

      assert.equal(integration.state, 'READY');
      assert.equal(integration.changes.length, 1);
      assert.equal(integration.groups.recent.length, 1);
    });

    it('resolves UNAVAILABLE when domain boundary mismatch occurs', () => {
      const state = resolveChangesState({
        snapshots: [mockSnapshot1],
        timelineEvents: [],
        isLoading: false,
        isError: false,
        isDomainMismatch: true,
      });

      assert.equal(state, 'UNAVAILABLE');
    });

    it('resolves ERROR when data retrieval fails', () => {
      const state = resolveChangesState({
        snapshots: null,
        timelineEvents: null,
        isLoading: false,
        isError: true,
      });

      assert.equal(state, 'ERROR');
    });
  });

  describe('3. Active Understanding In-Progress & Stale Baseline Preservation', () => {
    it('preserves trusted historical state and groups while background understanding executes', () => {
      const integration = integrateAuthoritativeChanges({
        domainId: mockDomainA,
        domainName: mockDomainAName,
        snapshots: [mockSnapshot2, mockSnapshot1],
        timelineEvents: [mockChangeEvent],
        isLoading: false,
        isError: false,
        isUnderstanding: true, // Active understanding executing
      });

      // State remains READY with verified changes visible
      assert.equal(integration.state, 'READY');
      assert.equal(integration.changes.length, 1);
      assert.equal(integration.groups.recent.length, 1);
    });
  });

  describe('4. Honest Zero-Evidence Handling (Zero Fabrication)', () => {
    it('honestly preserves 0 evidenceCount without manufacturing fake artifacts', () => {
      const story = resolveMeaningfulChangeStory(mockChangeEvent, mockDomainAName);

      assert.equal(story.evidenceCount, 0);
      assert.equal(story.currentSnapshotId, 'snp-res-002');
      assert.equal(story.previousSnapshotId, 'snp-res-001');
    });
  });

  describe('5. Domain Isolation & Cross-Domain Bleed Prevention', () => {
    it('filters foreign domain events and snapshots deterministically', () => {
      const foreignEvent: TimelineEventDto = {
        id: 'evt-foreign-999',
        domainId: mockDomainB,
        domainName: 'other.com',
        snapshotId: 'snp-other-999',
        currentSnapshotId: 'snp-other-999',
        changeType: 'ADDED',
        category: 'dns',
        severity: 'INFORMATIONAL',
        title: 'Foreign DNS Record Added',
        detectedAt: '2026-08-23T14:00:00Z',
      };

      const integration = integrateAuthoritativeChanges({
        domainId: mockDomainA,
        domainName: mockDomainAName,
        snapshots: [mockSnapshot2, mockSnapshot1],
        timelineEvents: [mockChangeEvent, foreignEvent],
        isLoading: false,
        isError: false,
      });

      // Foreign event is excluded
      assert.equal(integration.changes.length, 1);
      assert.equal(integration.changes[0].changeId, 'evt-res-001');
    });
  });

  describe('6. Historical Comparison Resilience (Graceful Missing / Invalid References)', () => {
    it('handles missing or deleted snapshots gracefully without throwing errors', () => {
      const result = resolveHistoricalSnapshotComparison({
        domainId: mockDomainA,
        domainName: mockDomainAName,
        baseSnapshotId: 'deleted-snapshot-id',
        targetSnapshotId: 'snp-res-002',
        snapshots: [mockSnapshot2],
        timelineEvents: [],
      });

      assert.equal(result.status, 'INVALID_PAIR');
      assert.equal(result.headline, 'Historical comparison unavailable');
    });
  });

  describe('7. Truth Matrix & Certified Invariants Audit', () => {
    it('verifies Changes Resilience & State Experience capability in Truth Matrix', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Changes Resilience & State Experience'
      );
      assert.ok(cap, 'Changes Resilience & State Experience must exist in Truth Matrix');
      assert.equal(cap?.category, 'Changes');
      assert.equal(cap?.status, 'PRODUCTION_READY');
    });

    it('verifies all certified WX-1009 invariants are registered in truth contracts', () => {
      const requiredInvariants = [
        'NO_FAKE_CHANGE_STATE',
        'NO_FALSE_UNCHANGED_CLAIM',
        'NO_PARTIAL_CHANGE_RENDERING',
        'LAST_TRUSTED_STATE_PRESERVED',
        'NO_CROSS_DOMAIN_STATE_LEAK',
        'NO_FAKE_EVIDENCE',
        'NO_BROKEN_COMPARISON_LINK',
        'RETRY_PRESERVES_DOMAIN_CONTEXT',
        'UNDERSTANDING_STATE_CONVERGENCE',
        'HISTORICAL_STATE_INTEGRITY',
        'NO_FALSE_EMPTY_CHANGES_STATE',
        'ONE_SNAPSHOT_IS_NOT_EMPTY',
        'MULTIPLE_SNAPSHOTS_REQUIRE_COMPARISON',
        'NO_CROSS_DOMAIN_CHANGE_DATA',
        'NO_STALE_CHANGES_CACHE',
        'MANUAL_AUTOMATIC_CHANGE_CONVERGENCE',
      ];

      for (const inv of requiredInvariants) {
        assert.ok(
          inv in CHANGES_CERTIFIED_INVARIANTS,
          `Missing in CHANGES_CERTIFIED_INVARIANTS: ${inv}`
        );
        assert.ok(
          inv in WORKSPACE_CERTIFIED_INVARIANTS,
          `Missing in WORKSPACE_CERTIFIED_INVARIANTS: ${inv}`
        );
      }
    });
  });

  describe('8. Canonical State Transition Lifecycle (WX-1009)', () => {
    it('Scenario 1: First understanding produces baseline state with domain explanation', () => {
      const integration = integrateAuthoritativeChanges({
        domainId: mockDomainA,
        domainName: mockDomainAName,
        snapshots: [mockSnapshot1],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(integration.state, 'FIRST_UNDERSTANDING');
      assert.equal(integration.headline, 'No changes yet.');
      assert.equal(
        integration.explanation,
        'This is the baseline understanding for ding.com.'
      );
      assert.equal(integration.snapshotPair.currentSnapshot?.id, 'snp-res-001');
      assert.equal(integration.snapshotPair.previousSnapshot, null);
      assert.equal(integration.snapshotPair.totalVerifiedSnapshots, 1);
    });

    it('Scenario 2: Second understanding with differences produces authoritative change stories', () => {
      const xFrameChangeEvent: TimelineEventDto = {
        id: 'evt-xframe-001',
        domainId: mockDomainA,
        domainName: mockDomainAName,
        snapshotId: 'snp-res-002',
        currentSnapshotId: 'snp-res-002',
        previousSnapshotId: 'snp-res-001',
        changeType: 'MODIFIED',
        category: 'security_headers',
        severity: 'MEDIUM',
        title: 'X-Frame-Options changed',
        description: "X-Frame-Options response header changed from 'DENY' to 'SAMEORIGIN'.",
        explanation: 'X-Frame-Options controls whether browsers can render this domain in frames, protecting against clickjacking attacks.',
        previousValue: 'DENY',
        currentValue: 'SAMEORIGIN',
        detectedAt: '2026-08-23T12:00:10Z',
        evidenceCount: 1,
      };

      const integration = integrateAuthoritativeChanges({
        domainId: mockDomainA,
        domainName: mockDomainAName,
        snapshots: [mockSnapshot2, mockSnapshot1],
        timelineEvents: [xFrameChangeEvent],
        isLoading: false,
        isError: false,
      });

      assert.equal(integration.state, 'READY');
      assert.equal(integration.changes.length, 1);

      const story = integration.changes[0];
      assert.equal(story.title, 'X-Frame-Options changed');
      assert.equal(story.previousValue, 'DENY');
      assert.equal(story.currentValue, 'SAMEORIGIN');
      assert.equal(
        story.significanceExplanation,
        'X-Frame-Options controls whether browsers can render this domain in frames, protecting against clickjacking attacks.'
      );
      assert.equal(story.currentSnapshotId, 'snp-res-002');
      assert.equal(story.previousSnapshotId, 'snp-res-001');
      assert.equal(story.evidenceCount, 1);
    });

    it('Scenario 3: Second understanding with no differences produces quiet observed stability', () => {
      const integration = integrateAuthoritativeChanges({
        domainId: mockDomainA,
        domainName: mockDomainAName,
        snapshots: [mockSnapshot2, mockSnapshot1],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(integration.state, 'QUIET');
      assert.equal(integration.headline, 'No meaningful changes detected.');
      assert.equal(
        integration.explanation,
        "Nebula's recent understandings remain consistent across observed infrastructure components."
      );
      assert.equal(integration.snapshotPair.totalVerifiedSnapshots, 2);
      assert.equal(integration.changes.length, 0);
    });
  });
});
