import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveHistoricalSnapshotComparison,
  SNAPSHOT_COMPARISON_INVARIANTS,
} from './contracts/snapshot-comparison.contract.ts';
import {
  CHANGES_CERTIFIED_INVARIANTS,
} from './contracts/changes.contract.ts';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import {
  resolveInvestigationTarget,
  buildInvestigationLink,
} from './contracts/investigation.contract.ts';
import type {
  InfrastructureSnapshotDto,
  TimelineEventDto,
  DomainDto,
} from '../../types/api';

const mockDomainA = 'dom-ding-001';
const mockDomainB = 'dom-other-002';
const mockDomainAName = 'ding.com';

const mockSnapshotAug18: InfrastructureSnapshotDto = {
  id: 'snp-aug18',
  domainId: mockDomainA,
  capturedAt: '2026-08-18T10:00:00Z',
  createdAt: '2026-08-18T10:00:00Z',
  httpObservation: {
    statusCode: 200,
    server: 'cloudflare',
  },
  tlsCertificate: {
    subject: 'CN=ding.com',
    issuer: "Let's Encrypt",
    validFrom: '2026-06-01T00:00:00Z',
    validTo: '2026-09-01T00:00:00Z',
  },
};

const mockSnapshotAug23: InfrastructureSnapshotDto = {
  id: 'snp-aug23',
  domainId: mockDomainA,
  capturedAt: '2026-08-23T12:00:00Z',
  createdAt: '2026-08-23T12:00:00Z',
  httpObservation: {
    statusCode: 200,
    server: 'cloudflare', // Unchanged
  },
  tlsCertificate: {
    subject: 'CN=ding.com',
    issuer: "Let's Encrypt", // Unchanged
    validFrom: '2026-08-20T00:00:00Z',
    validTo: '2026-11-20T00:00:00Z',
  },
};

const mockChangeAug18to23: TimelineEventDto = {
  id: 'evt-tls-renewal-001',
  domainId: mockDomainA,
  domainName: mockDomainAName,
  snapshotId: 'snp-aug23',
  currentSnapshotId: 'snp-aug23',
  previousSnapshotId: 'snp-aug18',
  changeType: 'TLS_CERT_RENEWED',
  category: 'tls_ssl',
  severity: 'INFORMATIONAL',
  title: 'TLS Certificate renewed',
  description: 'Certificate renewed through November 2026.',
  previousValue: 'Expires Sep 1',
  currentValue: 'Expires Nov 20',
  detectedAt: '2026-08-23T12:00:05Z',
  evidenceCount: 2,
};

describe('WX-1008: Historical Snapshot Comparison', () => {
  describe('1. Authoritative Snapshot Comparison & Change Rendering', () => {
    it('compares two distinct verified snapshots and lists detected changes and unchanged components', () => {
      const result = resolveHistoricalSnapshotComparison({
        domainId: mockDomainA,
        domainName: mockDomainAName,
        baseSnapshotId: 'snp-aug18',
        targetSnapshotId: 'snp-aug23',
        snapshots: [mockSnapshotAug23, mockSnapshotAug18],
        timelineEvents: [mockChangeAug18to23],
      });

      assert.equal(result.status, 'READY');
      assert.equal(result.changes.length, 1);
      assert.equal(result.changes[0].title, 'TLS Certificate renewed');
      assert.equal(result.changes[0].previousValue, 'Expires Sep 1');
      assert.equal(result.changes[0].currentValue, 'Expires Nov 20');

      // Verified unchanged components extracted honestly
      assert.ok(result.unchangedComponents.some((c) => c.includes('Web Server: cloudflare')));
      assert.ok(result.unchangedComponents.some((c) => c.includes("TLS Issuer: Let's Encrypt")));
    });

    it('honestly communicates when zero changes exist without falsely claiming everything is unchanged', () => {
      const result = resolveHistoricalSnapshotComparison({
        domainId: mockDomainA,
        domainName: mockDomainAName,
        baseSnapshotId: 'snp-aug18',
        targetSnapshotId: 'snp-aug23',
        snapshots: [mockSnapshotAug23, mockSnapshotAug18],
        timelineEvents: [], // Zero change events
      });

      assert.equal(result.status, 'READY');
      assert.equal(result.changes.length, 0);
      assert.equal(
        result.headline,
        'No meaningful changes detected between these understandings'
      );
    });
  });

  describe('2. Cross-Domain Comparison Prevention & Domain Isolation', () => {
    it('rejects comparison if a snapshot belongs to another domain', () => {
      const foreignSnapshot: InfrastructureSnapshotDto = {
        id: 'snp-foreign-999',
        domainId: mockDomainB,
        capturedAt: '2026-08-23T14:00:00Z',
        createdAt: '2026-08-23T14:00:00Z',
      };

      const result = resolveHistoricalSnapshotComparison({
        domainId: mockDomainA,
        domainName: mockDomainAName,
        baseSnapshotId: 'snp-aug18',
        targetSnapshotId: 'snp-foreign-999',
        snapshots: [mockSnapshotAug18, foreignSnapshot],
        timelineEvents: [],
      });

      assert.equal(result.status, 'INVALID_PAIR');
      assert.equal(result.changes.length, 0);
    });
  });

  describe('3. Edge Cases & Controlled Selection', () => {
    it('handles identical snapshot selection safely', () => {
      const result = resolveHistoricalSnapshotComparison({
        domainId: mockDomainA,
        domainName: mockDomainAName,
        baseSnapshotId: 'snp-aug23',
        targetSnapshotId: 'snp-aug23',
        snapshots: [mockSnapshotAug23],
        timelineEvents: [],
      });

      assert.equal(result.status, 'SAME_SNAPSHOT');
      assert.equal(result.headline, 'Identical snapshot comparison');
    });

    it('handles unavailable snapshots gracefully', () => {
      const result = resolveHistoricalSnapshotComparison({
        domainId: mockDomainA,
        domainName: mockDomainAName,
        baseSnapshotId: 'snp-nonexistent-1',
        targetSnapshotId: 'snp-nonexistent-2',
        snapshots: [mockSnapshotAug23],
        timelineEvents: [],
      });

      assert.equal(result.status, 'INVALID_PAIR');
      assert.equal(result.headline, 'Historical comparison unavailable');
    });
  });

  describe('4. Investigation Navigation & Context Preservation', () => {
    it('resolves historical_comparison investigation target and preserves domain identity', () => {
      const resolution = resolveInvestigationTarget({
        context: {
          domainId: mockDomainA,
          sourceType: 'historical_comparison',
          sourceId: 'snp-aug23',
          returnPath: '/workspace/changes',
        },
        activeDomainId: mockDomainA,
        userDomains: [{ id: mockDomainA, domainName: mockDomainAName } as unknown as DomainDto],
      });

      assert.equal(resolution.isValid, true);
      assert.equal(resolution.sourceType, 'historical_comparison');
      assert.equal(resolution.sourceId, 'snp-aug23');
      assert.equal(resolution.targetDomainId, mockDomainA);
      assert.equal(resolution.returnPath, '/workspace/changes');
    });

    it('builds canonical investigation URL preserving returnPath and parameters', () => {
      const link = buildInvestigationLink(
        mockDomainA,
        'historical_comparison',
        'snp-aug23',
        '/workspace/changes'
      );

      assert.ok(link.includes(`domainId=${encodeURIComponent(mockDomainA)}`));
      assert.ok(link.includes('sourceType=historical_comparison'));
      assert.ok(link.includes('sourceId=snp-aug23'));
      assert.ok(link.includes(`returnPath=${encodeURIComponent('/workspace/changes')}`));
    });
  });

  describe('5. Truth Matrix & Certified Invariants Audit', () => {
    it('verifies Historical Snapshot Comparison capability in Truth Matrix', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Historical Snapshot Comparison'
      );
      assert.ok(cap, 'Historical Snapshot Comparison must exist in Truth Matrix');
      assert.equal(cap?.category, 'Changes');
      assert.equal(cap?.status, 'PRODUCTION_READY');
    });

    it('verifies all 10 WX-1008 invariants are certified in truth contracts', () => {
      const requiredInvariants = [
        'NO_UNVERIFIED_SNAPSHOT_COMPARISON',
        'NO_CROSS_DOMAIN_COMPARISON',
        'IMMUTABLE_SNAPSHOT_PRESERVATION',
        'AUTHORITATIVE_COMPARISON_ONLY',
        'NO_FRONTEND_DIFF_INFERENCE',
        'NO_FALSE_UNCHANGED_CLAIM',
        'SNAPSHOT_LINEAGE_PRESERVED',
        'EVIDENCE_LINEAGE_PRESERVED',
        'DOMAIN_CONTEXT_PRESERVED',
        'NO_TIMELINE_REGRESSION',
      ];

      for (const inv of requiredInvariants) {
        assert.ok(
          inv in SNAPSHOT_COMPARISON_INVARIANTS,
          `Missing in SNAPSHOT_COMPARISON_INVARIANTS: ${inv}`
        );
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
