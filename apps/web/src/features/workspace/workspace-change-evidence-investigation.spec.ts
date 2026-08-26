import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveMeaningfulChangeStory,
  resolveChangeEvidenceNavigation,
  CHANGES_CERTIFIED_INVARIANTS,
} from './contracts/changes.contract.ts';
import { buildInvestigationLink } from './contracts/investigation.contract.ts';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { TimelineEventDto } from '../../types/api';

const mockDomainId = 'dom-ding-001';
const mockDomainName = 'ding.com';

const mockChangeWithEvidence: TimelineEventDto = {
  id: 'evt-tls-evidence-001',
  domainId: mockDomainId,
  domainName: mockDomainName,
  snapshotId: 'snp-202',
  currentSnapshotId: 'snp-202',
  previousSnapshotId: 'snp-201',
  findingId: 'fnd-tls-009',
  changeType: 'TLS_CERT_RENEWED',
  category: 'tls_ssl',
  severity: 'INFORMATIONAL',
  title: 'TLS Certificate renewed',
  description: 'Certificate valid until Dec 2026.',
  explanation: 'Routine certificate renewal prevents browser warnings.',
  previousValue: 'Expires Oct 12',
  currentValue: 'Expires Dec 22',
  detectedAt: '2026-08-23T12:00:10Z',
  evidenceCount: 3,
};

const mockChangeWithoutEvidence: TimelineEventDto = {
  id: 'evt-dns-no-evidence-002',
  domainId: mockDomainId,
  domainName: mockDomainName,
  snapshotId: 'snp-202',
  currentSnapshotId: 'snp-202',
  previousSnapshotId: 'snp-201',
  changeType: 'MODIFIED',
  category: 'dns',
  severity: 'LOW',
  title: 'DNS Record TTL shifted',
  previousValue: '300',
  currentValue: '3600',
  detectedAt: '2026-08-23T12:30:00Z',
  evidenceCount: 0,
};

describe('WX-1006: Change Evidence & Investigation Integration', () => {
  describe('1. Canonical Evidence Lineage & Navigation Targets', () => {
    it('preserves authoritative evidence lineage and resolves evidence target for evidence-backed changes', () => {
      const story = resolveMeaningfulChangeStory(mockChangeWithEvidence, mockDomainName);

      assert.equal(story.evidenceCount, 3);
      assert.equal(story.currentSnapshotId, 'snp-202');
      assert.equal(story.previousSnapshotId, 'snp-201');
      assert.equal(story.findingId, 'fnd-tls-009');

      const navTarget = resolveChangeEvidenceNavigation(story);
      assert.equal(navTarget.canNavigateToEvidence, true);
      assert.equal(navTarget.targetSourceType, 'evidence');
      assert.equal(navTarget.targetSourceId, 'fnd-tls-009');
      assert.equal(navTarget.evidenceLabel, '3 evidence artifacts');
    });

    it('falls back to change ID for targetSourceId when no finding ID is linked', () => {
      const changeWithoutFinding = { ...mockChangeWithEvidence, findingId: undefined };
      const story = resolveMeaningfulChangeStory(changeWithoutFinding, mockDomainName);

      const navTarget = resolveChangeEvidenceNavigation(story);
      assert.equal(navTarget.canNavigateToEvidence, true);
      assert.equal(navTarget.targetSourceType, 'evidence');
      assert.equal(navTarget.targetSourceId, 'evt-tls-evidence-001');
    });
  });

  describe('2. Honest Evidence Absence (Zero Fabrication)', () => {
    it('honestly communicates evidence absence when evidenceCount is 0 without creating fake links', () => {
      const story = resolveMeaningfulChangeStory(mockChangeWithoutEvidence, mockDomainName);

      assert.equal(story.evidenceCount, 0);

      const navTarget = resolveChangeEvidenceNavigation(story);
      assert.equal(navTarget.canNavigateToEvidence, false);
      assert.equal(navTarget.targetSourceType, 'change');
      assert.equal(navTarget.targetSourceId, 'evt-dns-no-evidence-002');
      assert.equal(navTarget.evidenceLabel, 'No supporting evidence attached');
    });
  });

  describe('3. Domain Preserved Traversal & Investigation Context', () => {
    it('constructs investigation URLs preserving active domain ID and returnPath', () => {
      const investigationUrl = buildInvestigationLink(
        mockDomainId,
        'change',
        'evt-tls-evidence-001',
        '/workspace/changes'
      );

      assert.ok(investigationUrl.includes(`domainId=${encodeURIComponent(mockDomainId)}`));
      assert.ok(investigationUrl.includes('sourceType=change'));
      assert.ok(investigationUrl.includes('sourceId=evt-tls-evidence-001'));
      assert.ok(investigationUrl.includes(`returnPath=${encodeURIComponent('/workspace/changes')}`));
    });
  });

  describe('4. Truth Matrix & Certified Invariants Audit', () => {
    it('verifies WX-1006 capability is registered in Truth Matrix with PRODUCTION_READY status', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Change Evidence & Investigation Integration'
      );
      assert.ok(cap, 'Change Evidence & Investigation Integration must exist in Truth Matrix');
      assert.equal(cap?.category, 'Changes');
      assert.equal(cap?.status, 'PRODUCTION_READY');
    });

    it('verifies all 5 WX-1006 invariants are certified in truth contracts', () => {
      const requiredInvariants = [
        'CANONICAL_EVIDENCE_LINEAGE',
        'AUTHENTIC_EVIDENCE_NAVIGATION',
        'DOMAIN_PRESERVED_INVESTIGATION',
        'HONEST_EVIDENCE_ABSENCE',
        'EVIDENCE_FAILURE_RESILIENCE',
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
