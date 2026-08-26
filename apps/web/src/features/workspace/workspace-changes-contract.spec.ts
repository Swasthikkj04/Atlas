import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveChangesState,
  resolveMeaningfulChangeStory,
  groupChangesChronologically,
  validateChangeLineage,
  normalizeChangeCategory,
  AUTHORITATIVE_CHANGE_CATEGORIES,
  CHANGE_CATEGORY_LABELS,
  CHANGES_COPY,
  CHANGES_CERTIFIED_INVARIANTS,
} from './contracts/changes.contract.ts';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { TimelineEventDto, InfrastructureSnapshotDto } from '../../types/api';

const mockDomainId = 'dom-ding-001';
const mockDomainName = 'ding.com';

const mockSnapshotA: InfrastructureSnapshotDto = {
  id: 'snp-ding-101',
  domainId: mockDomainId,
  capturedAt: '2026-08-16T12:00:00Z',
  createdAt: '2026-08-16T12:00:00Z',
  httpStatus: 200,
  responseTimeMs: 82,
};

const mockSnapshotB: InfrastructureSnapshotDto = {
  id: 'snp-ding-102',
  domainId: mockDomainId,
  capturedAt: '2026-08-23T12:00:00Z',
  createdAt: '2026-08-23T12:00:00Z',
  httpStatus: 200,
  responseTimeMs: 84,
};

const mockTlsChangeEvent: TimelineEventDto = {
  id: 'evt-tls-901',
  domainId: mockDomainId,
  domainName: mockDomainName,
  snapshotId: 'snp-ding-102',
  currentSnapshotId: 'snp-ding-102',
  previousSnapshotId: 'snp-ding-101',
  changeType: 'TLS_CERT_RENEWED',
  category: 'tls_ssl',
  severity: 'INFORMATIONAL',
  title: 'TLS Certificate renewed',
  description: 'Certificate renewed by Let\'s Encrypt with validity extending to Dec 22, 2026.',
  explanation: 'Routine certificate renewal prevents encryption disruption and browser security warnings.',
  previousValue: 'Expires Oct 12, 2026 (Let\'s Encrypt)',
  currentValue: 'Expires Dec 22, 2026 (Let\'s Encrypt)',
  detectedAt: '2026-08-23T12:00:10Z',
  evidenceCount: 2,
};

const mockDnsChangeEvent: TimelineEventDto = {
  id: 'evt-dns-902',
  domainId: mockDomainId,
  domainName: mockDomainName,
  snapshotId: 'snp-ding-102',
  currentSnapshotId: 'snp-ding-102',
  previousSnapshotId: 'snp-ding-101',
  changeType: 'DNS_RECORD_MODIFIED',
  category: 'dns',
  severity: 'MEDIUM',
  title: 'Nameserver configuration modified',
  description: 'Primary nameserver records shifted to Cloudflare edge infrastructure.',
  explanation: 'Nameserver delegation shift affects global DNS resolution latency and zone authority.',
  previousValue: 'ns1.oldhost.com, ns2.oldhost.com',
  currentValue: 'ns1.cloudflare.com, ns2.cloudflare.com',
  detectedAt: '2026-08-10T09:30:00Z',
  evidenceCount: 4,
};

describe('WX-1001: Changes Truth Audit & Experience Contract', () => {
  describe('1. Meaningful Difference Definition & 5-Part Change Story', () => {
    it('answers the 5 canonical change questions progressively without client-side fabrication', () => {
      const story = resolveMeaningfulChangeStory(mockTlsChangeEvent, mockDomainName);

      // 1. What changed?
      assert.equal(story.category, 'tls_ssl');
      assert.equal(story.categoryLabel, 'TLS / SSL');
      assert.equal(story.title, 'TLS Certificate renewed');

      // 2. When did it change?
      assert.equal(story.detectedAt, '2026-08-23T12:00:10Z');
      assert.ok(story.detectedFormatted.includes('2026') || story.detectedFormatted.includes('Aug'));

      // 3. What was different?
      assert.equal(story.previousValue, 'Expires Oct 12, 2026 (Let\'s Encrypt)');
      assert.equal(story.currentValue, 'Expires Dec 22, 2026 (Let\'s Encrypt)');

      // 4. Why does it matter?
      assert.equal(
        story.significanceExplanation,
        'Routine certificate renewal prevents encryption disruption and browser security warnings.'
      );

      // 5. How do we know? (Evidence & Lineage)
      assert.equal(story.currentSnapshotId, 'snp-ding-102');
      assert.equal(story.previousSnapshotId, 'snp-ding-101');
      assert.equal(story.evidenceCount, 2);
      assert.equal(story.isInitialBaseline, false);
    });

    it('preserves initial baseline observation state when no previous snapshot exists', () => {
      const initialBaselineEvent: TimelineEventDto = {
        id: 'evt-init-001',
        domainId: mockDomainId,
        snapshotId: 'snp-ding-101',
        currentSnapshotId: 'snp-ding-101',
        previousSnapshotId: null,
        changeType: 'COMPONENT_DISCOVERED',
        category: 'technology',
        severity: 'INFORMATIONAL',
        title: 'Initial perimeter discovery',
        detectedAt: '2026-08-16T12:00:00Z',
      };

      const story = resolveMeaningfulChangeStory(initialBaselineEvent, mockDomainName);
      assert.equal(story.isInitialBaseline, true);
      assert.equal(story.previousSnapshotId, null);
      assert.equal(story.currentSnapshotId, 'snp-ding-101');
    });
  });

  describe('2. State Resolution Engine & Edge Behaviors', () => {
    it('resolves FIRST_UNDERSTANDING ("No changes yet") for single-snapshot domain with 0 comparative events', () => {
      const state = resolveChangesState({
        snapshots: [mockSnapshotA],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(state, 'FIRST_UNDERSTANDING');
      assert.equal(CHANGES_COPY.FIRST_UNDERSTANDING_HEADLINE, 'No changes yet.');
    });

    it('resolves QUIET ("No meaningful changes detected") for multi-snapshot domain with 0 changes', () => {
      const state = resolveChangesState({
        snapshots: [mockSnapshotB, mockSnapshotA],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(state, 'QUIET');
      assert.equal(CHANGES_COPY.QUIET_HEADLINE, 'No meaningful changes detected.');
    });

    it('resolves READY state when multi-snapshot domain contains verified change events', () => {
      const state = resolveChangesState({
        snapshots: [mockSnapshotB, mockSnapshotA],
        timelineEvents: [mockTlsChangeEvent],
        isLoading: false,
        isError: false,
      });

      assert.equal(state, 'READY');
    });

    it('resolves UNDERSTANDING_IN_PROGRESS when analysis is running without premature diffing', () => {
      const state = resolveChangesState({
        snapshots: [],
        timelineEvents: [],
        isLoading: false,
        isError: false,
        isUnderstanding: true,
      });

      assert.equal(state, 'UNDERSTANDING_IN_PROGRESS');
    });

    it('resolves EMPTY state when domain genuinely has 0 snapshots and 0 events', () => {
      const state = resolveChangesState({
        snapshots: [],
        timelineEvents: [],
        isLoading: false,
        isError: false,
        isUnderstanding: false,
      });

      assert.equal(state, 'EMPTY');
    });

    it('resolves UNAVAILABLE state when domain mismatch occurs', () => {
      const state = resolveChangesState({
        snapshots: [mockSnapshotA],
        timelineEvents: [mockTlsChangeEvent],
        isLoading: false,
        isError: false,
        isDomainMismatch: true,
      });

      assert.equal(state, 'UNAVAILABLE');
    });

    it('resolves ERROR state on backend failure', () => {
      const state = resolveChangesState({
        snapshots: null,
        timelineEvents: null,
        isLoading: false,
        isError: true,
      });

      assert.equal(state, 'ERROR');
    });
  });

  describe('3. Authoritative Change Categories Bounded by Backend', () => {
    it('supports exactly the 9 authoritative change categories with honest labels', () => {
      assert.equal(AUTHORITATIVE_CHANGE_CATEGORIES.length, 9);
      for (const cat of AUTHORITATIVE_CHANGE_CATEGORIES) {
        assert.ok(cat in CHANGE_CATEGORY_LABELS, `Missing label for category: ${cat}`);
      }
    });

    it('normalizes category strings deterministically', () => {
      assert.equal(normalizeChangeCategory('dns_record_modified'), 'dns');
      assert.equal(normalizeChangeCategory('tls_cert_renewed'), 'tls_ssl');
      assert.equal(normalizeChangeCategory('http_header_shift'), 'http');
      assert.equal(normalizeChangeCategory('security_headers'), 'security_headers');
      assert.equal(normalizeChangeCategory('cloud_hosting'), 'hosting');
      assert.equal(normalizeChangeCategory('edge_cdn_proxy'), 'edge_cdn');
      assert.equal(normalizeChangeCategory('network_asn_drift'), 'network');
      assert.equal(normalizeChangeCategory('performance_latency'), 'performance');
      assert.equal(normalizeChangeCategory('web_tech_upgrade'), 'technology');
    });
  });

  describe('4. Lineage & Traceability Validation', () => {
    it('validates snapshot lineage for comparative change events', () => {
      const story = resolveMeaningfulChangeStory(mockTlsChangeEvent, mockDomainName);
      const lineage = validateChangeLineage(story);

      assert.equal(lineage.hasValidCurrentSnapshot, true);
      assert.equal(lineage.hasValidComparisonLineage, true);
      assert.equal(lineage.isComparative, true);
    });

    it('validates snapshot lineage for initial baseline observation', () => {
      const initialBaselineEvent: TimelineEventDto = {
        id: 'evt-init-001',
        domainId: mockDomainId,
        snapshotId: 'snp-ding-101',
        currentSnapshotId: 'snp-ding-101',
        previousSnapshotId: null,
        changeType: 'COMPONENT_DISCOVERED',
        category: 'technology',
        severity: 'INFORMATIONAL',
        title: 'Initial perimeter discovery',
      };

      const story = resolveMeaningfulChangeStory(initialBaselineEvent, mockDomainName);
      const lineage = validateChangeLineage(story);

      assert.equal(lineage.hasValidCurrentSnapshot, true);
      assert.equal(lineage.hasValidComparisonLineage, true);
      assert.equal(lineage.isComparative, false);
    });
  });

  describe('5. Temporal Grouping (Recent vs Earlier)', () => {
    it('groups change stories chronologically into Recent (<= 7 days) and Earlier', () => {
      const fixedNow = new Date('2026-08-23T18:00:00Z');
      const recentStory = resolveMeaningfulChangeStory(mockTlsChangeEvent, mockDomainName); // Aug 23
      const earlierStory = resolveMeaningfulChangeStory(mockDnsChangeEvent, mockDomainName); // Aug 10

      const groups = groupChangesChronologically([recentStory, earlierStory], fixedNow);

      assert.equal(groups.recent.length, 1);
      assert.equal(groups.recent[0].changeId, 'evt-tls-901');

      assert.equal(groups.earlier.length, 1);
      assert.equal(groups.earlier[0].changeId, 'evt-dns-902');
    });
  });

  describe('6. Certified Invariants & Truth Matrix Audit', () => {
    it('verifies WX-1001 capability is registered in Truth Matrix with PRODUCTION_READY status', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Changes Truth Audit & Experience Contract'
      );
      assert.ok(cap, 'Changes Truth Audit capability must exist in Truth Matrix');
      assert.equal(cap?.category, 'Changes');
      assert.equal(cap?.status, 'PRODUCTION_READY');
    });

    it('verifies all 15 certified WX-1001 invariants are recorded in truth contracts', () => {
      const requiredInvariants = [
        'NO_INVENTED_CHANGES',
        'NO_FRONTEND_CHANGE_DETECTION',
        'NO_SNAPSHOT_MUTATION',
        'NO_ACTIVITY_FEED',
        'NO_FINDINGS_AS_CHANGES',
        'NO_MEMORY_AS_CHANGES',
        'NO_RAW_SNAPSHOT_COMPARISON_UI',
        'NO_UNSUPPORTED_CHANGE_CATEGORY',
        'NO_FALSE_COMPARISON',
        'NO_PARTIAL_UNDERSTANDING_AS_CHANGE',
        'NO_DOMAIN_CONTEXT_LOSS',
        'NO_STALE_CHANGE_STATE',
        'NO_UNSUPPORTED_CAUSALITY',
        'EVIDENCE_LINEAGE_PRESERVED',
        'PREVIOUS_AND_CURRENT_SNAPSHOT_LINEAGE_PRESERVED',
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
});
