import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveVerifiedSnapshotPair,
  integrateAuthoritativeChanges,
  verifySnapshotLineageIntegrity,
  SNAPSHOT_COMPARISON_INVARIANTS,
} from './contracts/snapshot-comparison.contract.ts';
import { resolveMeaningfulChangeStory } from './contracts/changes.contract.ts';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { InfrastructureSnapshotDto, TimelineEventDto } from '../../types/api';

const domainAId = 'dom-ding-001';
const domainAName = 'ding.com';
const domainBId = 'dom-other-002';
const domainBName = 'otherdomain.org';

const mockSnapshotA1: InfrastructureSnapshotDto = {
  id: 'snp-ding-101',
  domainId: domainAId,
  capturedAt: '2026-08-16T12:00:00Z',
  createdAt: '2026-08-16T12:00:00Z',
  httpStatus: 200,
  responseTimeMs: 82,
};

const mockSnapshotA2: InfrastructureSnapshotDto = {
  id: 'snp-ding-102',
  domainId: domainAId,
  capturedAt: '2026-08-23T12:00:00Z',
  createdAt: '2026-08-23T12:00:00Z',
  httpStatus: 200,
  responseTimeMs: 84,
};

const mockSnapshotB1: InfrastructureSnapshotDto = {
  id: 'snp-other-201',
  domainId: domainBId,
  capturedAt: '2026-08-23T13:00:00Z',
  createdAt: '2026-08-23T13:00:00Z',
  httpStatus: 200,
  responseTimeMs: 120,
};

const mockTlsChangeEvent: TimelineEventDto = {
  id: 'evt-tls-101',
  domainId: domainAId,
  domainName: domainAName,
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
  id: 'evt-dns-102',
  domainId: domainAId,
  domainName: domainAName,
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
  detectedAt: '2026-08-23T12:00:15Z',
  evidenceCount: 3,
};

const mockForeignDomainChangeEvent: TimelineEventDto = {
  id: 'evt-foreign-999',
  domainId: domainBId,
  domainName: domainBName,
  snapshotId: 'snp-other-201',
  currentSnapshotId: 'snp-other-201',
  previousSnapshotId: null,
  changeType: 'HTTP_HEADER_MODIFIED',
  category: 'security_headers',
  severity: 'HIGH',
  title: 'HSTS Header removed',
  description: 'Strict-Transport-Security header was removed on otherdomain.org',
  detectedAt: '2026-08-23T13:00:10Z',
};

describe('WX-1002: Snapshot Comparison & Change Detection Integration', () => {
  describe('1. Snapshot Authority & Preceding Snapshot Selection', () => {
    it('correctly selects latest verified snapshot as Current and immediately preceding snapshot as Previous', () => {
      const pair = resolveVerifiedSnapshotPair([mockSnapshotA2, mockSnapshotA1], domainAId);

      assert.equal(pair.totalVerifiedSnapshots, 2);
      assert.equal(pair.currentSnapshot?.id, 'snp-ding-102');
      assert.equal(pair.previousSnapshot?.id, 'snp-ding-101');
      assert.equal(pair.isFirstUnderstanding, false);
      assert.equal(pair.hasComparisonPair, true);
    });

    it('identifies single-snapshot domain as first understanding with null previous snapshot', () => {
      const pair = resolveVerifiedSnapshotPair([mockSnapshotA1], domainAId);

      assert.equal(pair.totalVerifiedSnapshots, 1);
      assert.equal(pair.currentSnapshot?.id, 'snp-ding-101');
      assert.equal(pair.previousSnapshot, null);
      assert.equal(pair.isFirstUnderstanding, true);
      assert.equal(pair.hasComparisonPair, false);
    });

    it('handles zero-snapshot un-understood domain safely', () => {
      const pair = resolveVerifiedSnapshotPair([], domainAId);

      assert.equal(pair.totalVerifiedSnapshots, 0);
      assert.equal(pair.currentSnapshot, null);
      assert.equal(pair.previousSnapshot, null);
      assert.equal(pair.isFirstUnderstanding, false);
      assert.equal(pair.hasComparisonPair, false);
    });

    it('ignores invalid or uncaptured snapshots during pair selection', () => {
      const invalidSnapshot: InfrastructureSnapshotDto = {
        id: '',
        domainId: domainAId,
        capturedAt: '',
        createdAt: '',
      };

      const pair = resolveVerifiedSnapshotPair([mockSnapshotA2, invalidSnapshot, mockSnapshotA1], domainAId);
      assert.equal(pair.totalVerifiedSnapshots, 2);
      assert.equal(pair.currentSnapshot?.id, 'snp-ding-102');
      assert.equal(pair.previousSnapshot?.id, 'snp-ding-101');
    });
  });

  describe('2. Change Detection Integration & Value Transitions', () => {
    it('integrates backend detected changes preserving previousValue -> currentValue transitions', () => {
      const result = integrateAuthoritativeChanges({
        domainId: domainAId,
        domainName: domainAName,
        snapshots: [mockSnapshotA2, mockSnapshotA1],
        timelineEvents: [mockTlsChangeEvent, mockDnsChangeEvent],
        isLoading: false,
        isError: false,
      });

      assert.equal(result.state, 'READY');
      assert.equal(result.changes.length, 2);

      const tlsChange = result.changes.find((c) => c.category === 'tls_ssl');
      assert.ok(tlsChange);
      assert.equal(tlsChange?.previousValue, 'Expires Oct 12, 2026 (Let\'s Encrypt)');
      assert.equal(tlsChange?.currentValue, 'Expires Dec 22, 2026 (Let\'s Encrypt)');
      assert.equal(tlsChange?.currentSnapshotId, 'snp-ding-102');
      assert.equal(tlsChange?.previousSnapshotId, 'snp-ding-101');

      const dnsChange = result.changes.find((c) => c.category === 'dns');
      assert.ok(dnsChange);
      assert.equal(dnsChange?.previousValue, 'ns1.oldhost.com, ns2.oldhost.com');
      assert.equal(dnsChange?.currentValue, 'ns1.cloudflare.com, ns2.cloudflare.com');
    });

    it('resolves QUIET state when multi-snapshot comparison detects zero changes', () => {
      const result = integrateAuthoritativeChanges({
        domainId: domainAId,
        domainName: domainAName,
        snapshots: [mockSnapshotA2, mockSnapshotA1],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(result.state, 'QUIET');
      assert.equal(result.changes.length, 0);
      assert.equal(result.headline, 'No meaningful changes detected.');
    });

    it('resolves FIRST_UNDERSTANDING state when single snapshot exists without comparative events', () => {
      const result = integrateAuthoritativeChanges({
        domainId: domainAId,
        domainName: domainAName,
        snapshots: [mockSnapshotA1],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(result.state, 'FIRST_UNDERSTANDING');
      assert.equal(result.changes.length, 0);
      assert.equal(result.headline, 'No changes yet.');
    });
  });

  describe('3. Strict Domain Isolation', () => {
    it('strictly isolates changes by domain and excludes foreign domain events', () => {
      const result = integrateAuthoritativeChanges({
        domainId: domainAId,
        domainName: domainAName,
        snapshots: [mockSnapshotA2, mockSnapshotA1, mockSnapshotB1],
        timelineEvents: [mockTlsChangeEvent, mockForeignDomainChangeEvent],
        isLoading: false,
        isError: false,
      });

      assert.equal(result.changes.length, 1);
      assert.equal(result.changes[0].domainId, domainAId);
      assert.equal(result.changes[0].changeId, 'evt-tls-101');
      assert.equal(result.snapshotPair.totalVerifiedSnapshots, 2);
      assert.equal(result.snapshotPair.currentSnapshot?.id, 'snp-ding-102');
    });
  });

  describe('4. Lineage & Traceability Verification', () => {
    it('verifies snapshot lineage integrity for comparative change stories', () => {
      const result = integrateAuthoritativeChanges({
        domainId: domainAId,
        domainName: domainAName,
        snapshots: [mockSnapshotA2, mockSnapshotA1],
        timelineEvents: [mockTlsChangeEvent],
        isLoading: false,
        isError: false,
      });

      const story = result.changes[0];
      const lineage = verifySnapshotLineageIntegrity(story, [mockSnapshotA2, mockSnapshotA1]);

      assert.equal(lineage.currentSnapshotExists, true);
      assert.equal(lineage.previousSnapshotExists, true);
      assert.equal(lineage.isLineageConsistent, true);
    });

    it('detects missing snapshot references in inconsistent lineage records', () => {
      const brokenEvent: TimelineEventDto = {
        ...mockTlsChangeEvent,
        id: 'evt-broken-001',
        snapshotId: 'snp-nonexistent-999',
        currentSnapshotId: 'snp-nonexistent-999',
      };
      const story = resolveMeaningfulChangeStory(brokenEvent, domainAName);

      const lineage = verifySnapshotLineageIntegrity(story, [mockSnapshotA2, mockSnapshotA1]);
      assert.equal(lineage.currentSnapshotExists, false);
      assert.equal(lineage.isLineageConsistent, false);
    });
  });

  describe('5. Truth Matrix & Certified Invariants Audit', () => {
    it('verifies WX-1002 capability is registered in Truth Matrix with PRODUCTION_READY status', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Snapshot Comparison & Change Detection Integration'
      );
      assert.ok(cap, 'Snapshot Comparison Integration must exist in Truth Matrix');
      assert.equal(cap?.category, 'Changes');
      assert.equal(cap?.status, 'PRODUCTION_READY');
    });

    it('verifies all 5 snapshot comparison invariants are registered in truth contracts', () => {
      const requiredInvariants = [
        'PREVIOUS_SNAPSHOT_IS_IMMEDIATELY_PRECEDING',
        'CURRENT_SNAPSHOT_IS_LATEST_VERIFIED',
        'UNIFIED_CHANGE_CONVERGENCE',
        'STRICT_DOMAIN_ISOLATION',
        'NO_CLIENT_SIDE_DIFF_FABRICATION',
      ];

      for (const inv of requiredInvariants) {
        assert.ok(
          inv in SNAPSHOT_COMPARISON_INVARIANTS,
          `Missing in SNAPSHOT_COMPARISON_INVARIANTS: ${inv}`
        );
        assert.ok(
          inv in WORKSPACE_CERTIFIED_INVARIANTS,
          `Missing in WORKSPACE_CERTIFIED_INVARIANTS: ${inv}`
        );
      }
    });
  });
});
