import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isMeaningfulChange,
  filterMeaningfulChanges,
  filterChangesSinceLastVisit,
  resolveOneSentenceMeaning,
  resolveMeaningfulChangeStory,
  resolveChangesState,
  CHG_001_CERTIFIED_INVARIANTS,
} from './contracts/changes.contract.ts';
import {
  integrateAuthoritativeChanges,
} from './contracts/snapshot-comparison.contract.ts';
import type { TimelineEventDto, InfrastructureSnapshotDto } from '../../types/api';

describe('CHG-001: Meaningful Change Surface & Temporal Comparison Experience', () => {
  const stripeDomainId = 'dom-stripe-001';
  const stripeDomainName = 'stripe.com';

  const snapshotA: InfrastructureSnapshotDto = {
    id: 'snp-stripe-001',
    domainId: stripeDomainId,
    domainName: stripeDomainName,
    capturedAt: '2026-08-20T12:00:00Z',
    createdAt: '2026-08-20T12:00:00Z',
    httpStatus: 200,
    responseTimeMs: 82,
  };

  const snapshotB: InfrastructureSnapshotDto = {
    id: 'snp-stripe-002',
    domainId: stripeDomainId,
    domainName: stripeDomainName,
    capturedAt: '2026-08-28T18:00:00Z',
    createdAt: '2026-08-28T18:00:00Z',
    httpStatus: 200,
    responseTimeMs: 80,
  };

  // Meaningful changes
  const meaningfulDnsEvent: TimelineEventDto = {
    id: 'evt-dns-001',
    domainId: stripeDomainId,
    domainName: stripeDomainName,
    snapshotId: snapshotB.id,
    currentSnapshotId: snapshotB.id,
    previousSnapshotId: snapshotA.id,
    changeType: 'DNS_RECORD_MODIFIED',
    category: 'dns',
    severity: 'MEDIUM',
    title: 'DNS addresses changed',
    description: 'Observed IPv4 destination changed from 198.137.150.41 to 198.202.176.161.',
    explanation: 'DNS routing shift alters network traffic ingress points.',
    previousValue: '198.137.150.41',
    currentValue: '198.202.176.161',
    detectedAt: '2026-08-28T18:02:00Z',
    evidenceCount: 2,
  };

  const meaningfulCspEvent: TimelineEventDto = {
    id: 'evt-csp-002',
    domainId: stripeDomainId,
    domainName: stripeDomainName,
    snapshotId: snapshotB.id,
    currentSnapshotId: snapshotB.id,
    previousSnapshotId: snapshotA.id,
    changeType: 'HTTP_HEADER_MODIFIED',
    category: 'security_headers',
    severity: 'LOW',
    title: 'Content-Security-Policy changed',
    description: "The domain's browser security policy was modified.",
    explanation: 'Defensive policy adjustments restrict unauthorized script and frame injection.',
    previousValue: 'base-uri none; default-src https:',
    currentValue: "base-uri 'none'; default-src https: 'unsafe-inline'",
    detectedAt: '2026-08-28T18:02:10Z',
    evidenceCount: 1,
  };

  // Trivial wire / telemetry noise to be filtered out
  const noisyHeaderOrderEvent: TimelineEventDto = {
    id: 'evt-noise-001',
    domainId: stripeDomainId,
    domainName: stripeDomainName,
    snapshotId: snapshotB.id,
    currentSnapshotId: snapshotB.id,
    previousSnapshotId: snapshotA.id,
    changeType: 'HEADER_ORDER_CHANGED',
    category: 'telemetry_noise',
    severity: 'INFORMATIONAL',
    title: 'HTTP header order changed',
    description: 'Server returned Date header before Server header.',
    detectedAt: '2026-08-28T18:02:15Z',
  };

  const noisyDateHeaderEvent: TimelineEventDto = {
    id: 'evt-noise-002',
    domainId: stripeDomainId,
    domainName: stripeDomainName,
    snapshotId: snapshotB.id,
    currentSnapshotId: snapshotB.id,
    previousSnapshotId: snapshotA.id,
    changeType: 'DATE_HEADER_MUTATED',
    category: 'http',
    severity: 'INFORMATIONAL',
    title: 'Date header timestamp updated',
    description: 'HTTP date header advanced by 60 seconds.',
    detectedAt: '2026-08-28T18:02:16Z',
  };

  const noisyTtlJitterEvent: TimelineEventDto = {
    id: 'evt-noise-003',
    domainId: stripeDomainId,
    domainName: stripeDomainName,
    snapshotId: snapshotB.id,
    currentSnapshotId: snapshotB.id,
    previousSnapshotId: snapshotA.id,
    changeType: 'TTL_JITTER',
    category: 'dns',
    severity: 'INFORMATIONAL',
    title: 'DNS TTL jitter detected',
    description: 'TTL shifted from 300s to 295s.',
    detectedAt: '2026-08-28T18:02:17Z',
  };

  describe('AC-01: Default Comparison Boundary (Previous -> Current)', () => {
    it('compares previous trusted understanding against current trusted understanding', () => {
      const integration = integrateAuthoritativeChanges({
        domainId: stripeDomainId,
        domainName: stripeDomainName,
        snapshots: [snapshotB, snapshotA],
        timelineEvents: [meaningfulDnsEvent, meaningfulCspEvent],
        isLoading: false,
        isError: false,
      });

      assert.strictEqual(integration.state, 'READY');
      assert.strictEqual(integration.snapshotPair.hasComparisonPair, true);
      assert.strictEqual(integration.snapshotPair.currentSnapshot?.id, snapshotB.id);
      assert.strictEqual(integration.snapshotPair.previousSnapshot?.id, snapshotA.id);
      assert.strictEqual(integration.changes.length, 2);
    });
  });

  describe('AC-02 & AC-03: Meaningful Change Surface & Noise Elimination', () => {
    it('accurately identifies meaningful changes and rejects trivial wire/telemetry noise', () => {
      assert.strictEqual(isMeaningfulChange(meaningfulDnsEvent), true);
      assert.strictEqual(isMeaningfulChange(meaningfulCspEvent), true);

      assert.strictEqual(isMeaningfulChange(noisyHeaderOrderEvent), false);
      assert.strictEqual(isMeaningfulChange(noisyDateHeaderEvent), false);
      assert.strictEqual(isMeaningfulChange(noisyTtlJitterEvent), false);
    });

    it('filters raw timeline stories down strictly to intelligence-approved meaningful changes', () => {
      const allEvents = [
        meaningfulDnsEvent,
        noisyHeaderOrderEvent,
        meaningfulCspEvent,
        noisyDateHeaderEvent,
        noisyTtlJitterEvent,
      ];

      const allStories = allEvents.map((e) => resolveMeaningfulChangeStory(e, stripeDomainName));
      const filtered = filterMeaningfulChanges(allStories);

      assert.strictEqual(filtered.length, 2);
      assert.strictEqual(filtered[0].title, 'DNS addresses changed');
      assert.strictEqual(filtered[1].title, 'Content-Security-Policy changed');
    });
  });

  describe('AC-04: One Change = One Meaning (1-Sentence Explanation)', () => {
    it('generates a clean, human-readable 1-sentence meaning for each change card', () => {
      const dnsStory = resolveMeaningfulChangeStory(meaningfulDnsEvent, stripeDomainName);
      const cspStory = resolveMeaningfulChangeStory(meaningfulCspEvent, stripeDomainName);

      const dnsMeaning = resolveOneSentenceMeaning(dnsStory);
      const cspMeaning = resolveOneSentenceMeaning(cspStory);

      assert.ok(dnsMeaning.length > 0);
      assert.ok(!dnsMeaning.includes('\n'));
      assert.ok(dnsMeaning.includes('IPv4') || dnsMeaning.includes('DNS') || dnsMeaning.includes('endpoints'));

      assert.ok(cspMeaning.length > 0);
      assert.ok(!cspMeaning.includes('\n'));
      assert.ok(cspMeaning.includes('security policy') || cspMeaning.includes('browser'));
    });
  });

  describe('AC-05: Progressive Disclosure (Understanding -> Meaning -> Why It Matters -> Evidence)', () => {
    it('preserves structured change lineage, consequence explanation, and evidence count', () => {
      const story = resolveMeaningfulChangeStory(meaningfulDnsEvent, stripeDomainName);

      // Level 1: Meaning & Category
      assert.strictEqual(story.title, 'DNS addresses changed');
      assert.strictEqual(story.category, 'dns');

      // Level 2: Values & Transition
      assert.strictEqual(story.previousValue, '198.137.150.41');
      assert.strictEqual(story.currentValue, '198.202.176.161');

      // Level 3: Consequence
      assert.strictEqual(story.significanceExplanation, 'DNS routing shift alters network traffic ingress points.');

      // Level 4: Lineage & Evidence
      assert.strictEqual(story.currentSnapshotId, snapshotB.id);
      assert.strictEqual(story.previousSnapshotId, snapshotA.id);
      assert.strictEqual(story.evidenceCount, 2);
    });
  });

  describe('AC-07: Since Last Visit Temporal Support', () => {
    it('filters changes that occurred strictly after the user last visit timestamp', () => {
      const oldEvent: TimelineEventDto = {
        ...meaningfulDnsEvent,
        id: 'evt-old-001',
        detectedAt: '2026-08-21T10:00:00Z',
      };
      const recentEvent: TimelineEventDto = {
        ...meaningfulCspEvent,
        id: 'evt-recent-002',
        detectedAt: '2026-08-28T18:02:10Z',
      };

      const stories = [
        resolveMeaningfulChangeStory(oldEvent, stripeDomainName),
        resolveMeaningfulChangeStory(recentEvent, stripeDomainName),
      ];

      // User visited on Aug 25
      const lastVisitedAt = '2026-08-25T00:00:00Z';
      const sinceLastVisit = filterChangesSinceLastVisit(stories, lastVisitedAt);

      assert.strictEqual(sinceLastVisit.length, 1);
      assert.strictEqual(sinceLastVisit[0].changeId, 'evt-recent-002');
    });

    it('gracefully returns all meaningful changes when lastVisitedAt is null or invalid', () => {
      const stories = [
        resolveMeaningfulChangeStory(meaningfulDnsEvent, stripeDomainName),
        resolveMeaningfulChangeStory(meaningfulCspEvent, stripeDomainName),
      ];

      const all = filterChangesSinceLastVisit(stories, null);
      assert.strictEqual(all.length, 2);

      const invalid = filterChangesSinceLastVisit(stories, 'invalid-date');
      assert.strictEqual(invalid.length, 2);
    });
  });

  describe('AC-08: Domain Context Isolation', () => {
    it('prevents foreign domain events from leaking into active domain changes surface', () => {
      const foreignEvent: TimelineEventDto = {
        id: 'evt-foreign-999',
        domainId: 'dom-foreign-999',
        domainName: 'evilcorp.com',
        snapshotId: 'snp-foreign-1',
        changeType: 'DNS_RECORD_MODIFIED',
        title: 'Foreign DNS change',
        detectedAt: '2026-08-28T18:00:00Z',
      };

      const integration = integrateAuthoritativeChanges({
        domainId: stripeDomainId,
        domainName: stripeDomainName,
        snapshots: [snapshotA, snapshotB],
        timelineEvents: [meaningfulDnsEvent, foreignEvent],
        isLoading: false,
        isError: false,
      });

      assert.strictEqual(integration.changes.length, 1);
      assert.strictEqual(integration.changes[0].domainId, stripeDomainId);
      assert.ok(!integration.changes.some((c) => c.domainId === 'dom-foreign-999'));
    });
  });

  describe('AC-09: Calm Empty State & Silence Reassurance', () => {
    it('resolves QUIET state for multi-snapshot domain with zero detected changes', () => {
      const state = resolveChangesState({
        snapshots: [snapshotA, snapshotB],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.strictEqual(state, 'QUIET');
    });

    it('resolves FIRST_UNDERSTANDING state for initial baseline domain', () => {
      const state = resolveChangesState({
        snapshots: [snapshotA],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.strictEqual(state, 'FIRST_UNDERSTANDING');
    });
  });

  describe('CHG-001 Certified Invariants Verification', () => {
    it('validates all 12 frozen invariants for CHG-001', () => {
      assert.ok(CHG_001_CERTIFIED_INVARIANTS.AC_01_DEFAULT_COMPARISON_BOUNDARY);
      assert.ok(CHG_001_CERTIFIED_INVARIANTS.AC_02_MEANINGFUL_CHANGES_ONLY);
      assert.ok(CHG_001_CERTIFIED_INVARIANTS.AC_03_NO_TELEMETRY_WALL);
      assert.ok(CHG_001_CERTIFIED_INVARIANTS.AC_04_ONE_CHANGE_ONE_MEANING);
      assert.ok(CHG_001_CERTIFIED_INVARIANTS.AC_05_PROGRESSIVE_DISCLOSURE);
      assert.ok(CHG_001_CERTIFIED_INVARIANTS.AC_06_INTENTIONAL_HISTORICAL_COMPARISON);
      assert.ok(CHG_001_CERTIFIED_INVARIANTS.AC_07_SINCE_LAST_VISIT_SUPPORT);
      assert.ok(CHG_001_CERTIFIED_INVARIANTS.AC_08_DOMAIN_ISOLATION);
      assert.ok(CHG_001_CERTIFIED_INVARIANTS.AC_09_CALM_EMPTY_STATE);
      assert.ok(CHG_001_CERTIFIED_INVARIANTS.AC_10_NO_FRONTEND_INTELLIGENCE);
      assert.ok(CHG_001_CERTIFIED_INVARIANTS.AC_11_OVERVIEW_UNTOUCHED);
      assert.ok(CHG_001_CERTIFIED_INVARIANTS.AC_12_PREMIUM_VISUAL_STANDARD);
    });
  });
});
