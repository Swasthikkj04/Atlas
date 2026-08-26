import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveMemoryState,
  resolveMemoryBaseline,
  resolveSnapshotIdentity,
  resolveTimelineEventRelationship,
  resolveMemoryNavigationContext,
  MEMORY_BASELINE_COPY,
} from './contracts/memory.contract.ts';
import type {
  InfrastructureSnapshotDto,
  TimelineEventDto,
  TimelineDetailDto,
} from '../../types/api/index.ts';
import { queryKeys } from '../../hooks/queries/query-keys.ts';

describe('WX-501: Infrastructure Memory Contract Suite', () => {
  const mockDomainId = '3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1';
  const mockDomainName = 'stripe.com';

  const mockSnapshot1: InfrastructureSnapshotDto = {
    id: 'snap-001-baseline',
    domainId: mockDomainId,
    domainName: mockDomainName,
    capturedAt: '2026-08-01T12:00:00.000Z',
    createdAt: '2026-08-01T12:00:00.000Z',
    responseTimeMs: 120,
    httpStatus: 200,
    jobId: 'job-001',
  };

  const mockSnapshot2: InfrastructureSnapshotDto = {
    id: 'snap-002-followup',
    domainId: mockDomainId,
    domainName: mockDomainName,
    capturedAt: '2026-08-15T14:30:00.000Z',
    createdAt: '2026-08-15T14:30:00.000Z',
    responseTimeMs: 145,
    httpStatus: 200,
    jobId: 'job-002',
    previousSnapshotId: 'snap-001-baseline',
  };

  const mockTimelineEvent1: TimelineEventDto = {
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

  describe('1. 7-Tier Historical Semantic State Matrix', () => {
    it('resolves LOADING when historical requests are in-flight', () => {
      const state = resolveMemoryState({
        isLoading: true,
        isError: false,
      });
      assert.equal(state, 'LOADING');
    });

    it('resolves ERROR when historical requests fail', () => {
      const state = resolveMemoryState({
        isLoading: false,
        isError: true,
      });
      assert.equal(state, 'ERROR');
    });

    it('resolves UNAVAILABLE when domain mismatch / tenant isolation is triggered', () => {
      const state = resolveMemoryState({
        isLoading: false,
        isError: false,
        isDomainMismatch: true,
        snapshots: [mockSnapshot1],
      });
      assert.equal(state, 'UNAVAILABLE');
    });

    it('resolves EMPTY when zero completed snapshots exist', () => {
      const state = resolveMemoryState({
        snapshots: [],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });
      assert.equal(state, 'EMPTY');
    });

    it('resolves EMPTY when only 1 snapshot exists (initial baseline, zero historical comparisons)', () => {
      const state = resolveMemoryState({
        snapshots: [mockSnapshot1],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });
      assert.equal(state, 'EMPTY');
    });

    it('resolves PARTIAL when backend flags degraded or partial history', () => {
      const state = resolveMemoryState({
        snapshots: [mockSnapshot2, mockSnapshot1],
        timelineEvents: [mockTimelineEvent1],
        isLoading: false,
        isError: false,
        isPartial: true,
      });
      assert.equal(state, 'PARTIAL');
    });

    it('resolves QUIET when multiple snapshots exist but zero changes were detected', () => {
      const state = resolveMemoryState({
        snapshots: [mockSnapshot2, mockSnapshot1],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });
      assert.equal(state, 'QUIET');
    });

    it('resolves READY when multiple snapshots exist with authoritative timeline events', () => {
      const state = resolveMemoryState({
        snapshots: [mockSnapshot2, mockSnapshot1],
        timelineEvents: [mockTimelineEvent1],
        isLoading: false,
        isError: false,
      });
      assert.equal(state, 'READY');
    });
  });

  describe('2. Initial Baseline & One-Snapshot Domain Semantics', () => {
    it('correctly handles initial baseline for newly understood single-snapshot domain', () => {
      const baseline = resolveMemoryBaseline({
        snapshots: [mockSnapshot1],
        timelineEvents: [],
      });

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
    });

    it('identifies non-baseline multi-snapshot domains with previous snapshot reference', () => {
      const baseline = resolveMemoryBaseline({
        snapshots: [mockSnapshot2, mockSnapshot1],
        timelineEvents: [mockTimelineEvent1],
      });

      assert.equal(baseline.isInitialBaseline, false);
      assert.equal(baseline.totalSnapshots, 2);
      assert.equal(baseline.currentSnapshotId, 'snap-002-followup');
      assert.equal(baseline.previousSnapshotId, 'snap-001-baseline');
    });
  });

  describe('3. Snapshot Identity & Historical Authority', () => {
    it('preserves authoritative backend snapshot identity without client synthesis', () => {
      const identity = resolveSnapshotIdentity(mockSnapshot1);

      assert.ok(identity !== null);
      assert.equal(identity.snapshotId, 'snap-001-baseline');
      assert.equal(identity.domainId, mockDomainId);
      assert.equal(identity.observedAt, '2026-08-01T12:00:00.000Z');
      assert.equal(identity.responseTimeMs, 120);
      assert.equal(identity.httpStatus, 200);
      assert.equal(identity.jobId, 'job-001');
    });

    it('rejects invalid or unobserved snapshots', () => {
      const invalidSnapshot: InfrastructureSnapshotDto = {
        id: '',
        domainId: mockDomainId,
        capturedAt: '',
      };
      const identity = resolveSnapshotIdentity(invalidSnapshot);
      assert.equal(identity, null);
    });
  });

  describe('4. Change Relationships & Snapshot Lineage', () => {
    it('preserves explicit currentSnapshotId and previousSnapshotId relationships', () => {
      const relationship = resolveTimelineEventRelationship(mockTimelineEvent1);

      assert.equal(relationship.changeId, 'evt-001-tls');
      assert.equal(relationship.domainId, mockDomainId);
      assert.equal(relationship.currentSnapshotId, 'snap-002-followup');
      assert.equal(relationship.previousSnapshotId, 'snap-001-baseline');
      assert.equal(relationship.isInitialBaseline, false);
      assert.equal(relationship.changeType, 'MODIFIED');
      assert.equal(relationship.severity, 'HIGH');
      assert.equal(relationship.title, 'TLS Certificate Renewed');
    });

    it('marks initial change observations where previousSnapshotId is null as initial baseline', () => {
      const baselineEvent: TimelineEventDto = {
        ...mockTimelineEvent1,
        id: 'evt-000-initial',
        previousSnapshotId: null,
      };

      const relationship = resolveTimelineEventRelationship(baselineEvent);
      assert.equal(relationship.isInitialBaseline, true);
      assert.equal(relationship.previousSnapshotId, null);
    });
  });

  describe('5. Temporal Ordering & Prohibited Client Inferencing', () => {
    it('consumes backend-provided chronological array order directly', () => {
      const backendOrderedSnapshots = [mockSnapshot2, mockSnapshot1];
      const baseline = resolveMemoryBaseline({
        snapshots: backendOrderedSnapshots,
      });

      // Latest must match index 0 from backend, prior matches index 1
      assert.equal(baseline.currentSnapshotId, backendOrderedSnapshots[0].id);
      assert.equal(baseline.previousSnapshotId, backendOrderedSnapshots[1].id);
    });

    it('prohibits client-side severity calculation or narrative synthesis', () => {
      const rawEvent: TimelineEventDto = {
        id: 'evt-raw',
        domainId: mockDomainId,
        changeType: 'DETECTED',
        severity: 'CRITICAL',
        title: 'Authoritative Backend Headline',
        explanation: 'Authoritative backend explanation text.',
      };

      const relationship = resolveTimelineEventRelationship(rawEvent);
      assert.equal(relationship.severity, 'CRITICAL');
      assert.equal(relationship.title, 'Authoritative Backend Headline');
      assert.equal(relationship.explanation, 'Authoritative backend explanation text.');
    });
  });

  describe('6. Domain Isolation & Query Architecture', () => {
    it('ensures query keys are domain-scoped and isolate memory cache per domain', () => {
      const domainA = '3d91d72d-0000-0000-0000-000000000001';
      const domainB = '3d91d72d-0000-0000-0000-000000000002';

      const keyMemoryA = queryKeys.memory.byDomain(domainA);
      const keyMemoryB = queryKeys.memory.byDomain(domainB);
      assert.notDeepEqual(keyMemoryA, keyMemoryB);
      assert.deepEqual(keyMemoryA, ['memory', 'byDomain', domainA]);

      const keySnapshotsA = queryKeys.snapshots.byDomain(domainA);
      const keySnapshotsB = queryKeys.snapshots.byDomain(domainB);
      assert.notDeepEqual(keySnapshotsA, keySnapshotsB);

      const keyTimelineA = queryKeys.timeline.byDomain(domainA);
      const keyTimelineB = queryKeys.timeline.byDomain(domainB);
      assert.notDeepEqual(keyTimelineA, keyTimelineB);
    });

    it('enforces domain isolation for deep-link navigation parameters', () => {
      const valid = resolveMemoryNavigationContext({
        domainId: mockDomainId,
        activeDomainId: mockDomainId,
        sourceType: 'snapshot',
        sourceId: 'snap-001',
        returnPath: '/workspace',
      });

      assert.equal(valid.isValid, true);
      assert.equal(valid.isDomainMismatch, false);
      assert.equal(valid.navigation?.domainId, mockDomainId);
      assert.equal(valid.navigation?.sourceType, 'snapshot');
      assert.equal(valid.navigation?.sourceId, 'snap-001');

      const crossDomainMismatch = resolveMemoryNavigationContext({
        domainId: 'other-domain-id',
        activeDomainId: mockDomainId,
        sourceType: 'snapshot',
        sourceId: 'snap-001',
      });

      assert.equal(crossDomainMismatch.isValid, false);
      assert.equal(crossDomainMismatch.isDomainMismatch, true);
      assert.equal(crossDomainMismatch.navigation, null);
    });
  });

  describe('7. Backend DTO Contract Alignment', () => {
    it('validates TimelineDetailDto shape matches backend controller output', () => {
      const detailDto: TimelineDetailDto = {
        event: mockTimelineEvent1,
        rule: {
          ruleId: 'rule.tls.cert-renewed',
          ruleVersion: '1.0.0',
          name: 'TLS Certificate Renewal',
          description: 'Tracks expiration and issuance of TLS certificates.',
        },
        observations: [],
        evidence: [],
        previousSnapshotId: 'snap-001-baseline',
        currentSnapshotId: 'snap-002-followup',
      };

      assert.equal(detailDto.event.id, 'evt-001-tls');
      assert.equal(detailDto.rule?.ruleId, 'rule.tls.cert-renewed');
      assert.equal(detailDto.previousSnapshotId, 'snap-001-baseline');
      assert.equal(detailDto.currentSnapshotId, 'snap-002-followup');
    });
  });
});
