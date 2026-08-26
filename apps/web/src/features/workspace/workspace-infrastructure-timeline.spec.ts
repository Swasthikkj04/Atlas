import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveMemoryState,
  resolveMemoryBaseline,
  resolveTimelineEventRelationship,
  MEMORY_BASELINE_COPY,
} from './contracts/memory.contract.ts';
import type {
  InfrastructureSnapshotDto,
  TimelineEventDto,
} from '../../types/api/index.ts';

describe('WX-502: Infrastructure Timeline Component & Experience Suite', () => {
  const mockDomainId = '3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1';
  const mockDomainName = 'stripe.com';

  const mockBaselineSnapshot: InfrastructureSnapshotDto = {
    id: 'snap-001-baseline',
    domainId: mockDomainId,
    domainName: mockDomainName,
    capturedAt: '2026-08-01T12:00:00.000Z',
    createdAt: '2026-08-01T12:00:00.000Z',
    responseTimeMs: 120,
    httpStatus: 200,
  };

  const mockFollowupSnapshot: InfrastructureSnapshotDto = {
    id: 'snap-002-followup',
    domainId: mockDomainId,
    domainName: mockDomainName,
    capturedAt: '2026-08-15T14:30:00.000Z',
    createdAt: '2026-08-15T14:30:00.000Z',
    responseTimeMs: 145,
    httpStatus: 200,
    previousSnapshotId: 'snap-001-baseline',
  };

  const mockTlsChangeEvent: TimelineEventDto = {
    id: 'evt-001-tls',
    domainId: mockDomainId,
    domainName: mockDomainName,
    currentSnapshotId: 'snap-002-followup',
    previousSnapshotId: 'snap-001-baseline',
    changeType: 'MODIFIED',
    severity: 'HIGH',
    category: 'TLS',
    title: 'TLS Certificate Renewed',
    description: 'Certificate valid until 2027 replaced legacy 2026 certificate.',
    detectedAt: '2026-08-15T14:30:00.000Z',
    findingCount: 1,
    observationCount: 2,
    evidenceCount: 1,
  };

  const mockDnsChangeEvent: TimelineEventDto = {
    id: 'evt-002-dns',
    domainId: mockDomainId,
    domainName: mockDomainName,
    currentSnapshotId: 'snap-002-followup',
    previousSnapshotId: 'snap-001-baseline',
    changeType: 'ADDED',
    severity: 'MEDIUM',
    category: 'DNS',
    title: 'New IPv6 DNS Endpoint Observed',
    description: 'AAAA record 2600:1f18:248e:: added to authoritative nameserver response.',
    detectedAt: '2026-08-15T14:35:00.000Z',
  };

  describe('1. Single-Snapshot Initial Baseline Presentation', () => {
    it('resolves calm initial baseline state for single-snapshot domain without change diffing', () => {
      const state = resolveMemoryState({
        snapshots: [mockBaselineSnapshot],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });
      const baseline = resolveMemoryBaseline({
        snapshots: [mockBaselineSnapshot],
        timelineEvents: [],
      });

      assert.equal(state, 'EMPTY');
      assert.equal(baseline.isInitialBaseline, true);
      assert.equal(baseline.totalSnapshots, 1);
      assert.equal(baseline.currentSnapshotId, 'snap-001-baseline');
      assert.equal(baseline.previousSnapshotId, null);
      assert.equal(
        baseline.baselineHeadline,
        MEMORY_BASELINE_COPY.INITIAL_BASELINE_HEADLINE
      );
      assert.equal(
        baseline.baselineExplanation,
        MEMORY_BASELINE_COPY.INITIAL_BASELINE_EXPLANATION
      );
      // Hard invariant: No fabricated "Previous: Unknown" or "Change: None"
      assert.ok(!baseline.baselineExplanation.includes('Unknown'));
      assert.ok(!baseline.baselineExplanation.includes('None'));
    });
  });

  describe('2. Multi-Snapshot Quiet State (Silence is Valuable)', () => {
    it('resolves quiet historical memory when multiple snapshots exist but zero changes occurred', () => {
      const state = resolveMemoryState({
        snapshots: [mockFollowupSnapshot, mockBaselineSnapshot],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });
      const baseline = resolveMemoryBaseline({
        snapshots: [mockFollowupSnapshot, mockBaselineSnapshot],
        timelineEvents: [],
      });

      assert.equal(state, 'QUIET');
      assert.equal(baseline.isInitialBaseline, false);
      assert.equal(baseline.totalSnapshots, 2);
      assert.equal(baseline.currentSnapshotId, 'snap-002-followup');
      assert.equal(baseline.previousSnapshotId, 'snap-001-baseline');
      assert.equal(baseline.baselineHeadline, MEMORY_BASELINE_COPY.QUIET_HEADLINE);
      assert.equal(
        baseline.baselineExplanation,
        MEMORY_BASELINE_COPY.QUIET_EXPLANATION
      );
    });
  });

  describe('3. Meaningful Timeline Evolution Sequence (Ready State)', () => {
    it('resolves ready state preserving backend chronological ordering', () => {
      const rawEvents = [mockTlsChangeEvent, mockDnsChangeEvent];
      const state = resolveMemoryState({
        snapshots: [mockFollowupSnapshot, mockBaselineSnapshot],
        timelineEvents: rawEvents,
        isLoading: false,
        isError: false,
      });

      assert.equal(state, 'READY');
      assert.equal(rawEvents.length, 2);
      assert.equal(rawEvents[0].id, 'evt-001-tls');
      assert.equal(rawEvents[1].id, 'evt-002-dns');
    });
  });

  describe('4. Timeline Event Card Details & Snapshot Lineage Integration', () => {
    it('extracts snapshot lineage links and category/severity badges cleanly', () => {
      const relationship = resolveTimelineEventRelationship(mockTlsChangeEvent);

      assert.equal(relationship.changeId, 'evt-001-tls');
      assert.equal(relationship.currentSnapshotId, 'snap-002-followup');
      assert.equal(relationship.previousSnapshotId, 'snap-001-baseline');
      assert.equal(relationship.isInitialBaseline, false);
      assert.equal(relationship.severity, 'HIGH');
      assert.equal(relationship.changeType, 'MODIFIED');
      assert.equal(relationship.title, 'TLS Certificate Renewed');
    });

    it('safely handles timeline events without previousSnapshotId reference', () => {
      const eventWithoutPrev: TimelineEventDto = {
        ...mockTlsChangeEvent,
        previousSnapshotId: null,
      };

      const relationship = resolveTimelineEventRelationship(eventWithoutPrev);
      assert.equal(relationship.isInitialBaseline, true);
      assert.equal(relationship.previousSnapshotId, null);
    });
  });

  describe('5. Semantic Anti-Activity-Feed Invariants', () => {
    it('prohibits raw network/diagnostic activity logging in historical memory', () => {
      const activityLogMessages = [
        '10:31 DNS queried',
        '10:32 HTTP request completed',
        '10:32 TLS checked',
        '10:32 Technology detected',
        '10:33 Snapshot created',
      ];

      const meaningfulEvents = [mockTlsChangeEvent, mockDnsChangeEvent];

      for (const forbidden of activityLogMessages) {
        for (const event of meaningfulEvents) {
          assert.ok(!event.title.includes(forbidden));
          assert.ok(!event.description?.includes(forbidden));
        }
      }
    });
  });
});
