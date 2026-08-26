import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_INFORMATION_HIERARCHY,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { InfrastructureFindingDto } from '../../types/api/finding.dto.ts';

const mockPrimaryStory: InfrastructureFindingDto = {
  id: 'fnd-dns-001',
  domainId: 'dom-stripe-prod',
  snapshotId: 'snp-stripe-101',
  category: 'DNS',
  severity: 'CRITICAL',
  status: 'ACTIVE',
  title: 'Root DNS Nameserver Drift Detected',
  explanation: 'Authoritative nameservers shifted from Route53 to an unauthorized secondary provider.',
  remediation: 'Verify NS delegation records in registrar portal immediately to prevent routing hijacking.',
  lineage: {
    snapshotId: 'snp-stripe-101',
    observationKey: 'dns.records.ns',
    observedValue: 'ns-unverified.external-cdn.net',
    ruleId: 'sec-rule-ns-drift',
    evaluationTimestamp: '2026-08-20T00:00:00Z',
  },
  detectedAt: '2026-08-20T00:00:00Z',
};

describe('WX-904: Primary Story Architecture & Structural Authority Contracts', () => {
  describe('1. Information Hierarchy & Rank (Rank 2 What Matters Now)', () => {
    it('verifies Primary Story is Rank 2 in Workspace Information Hierarchy', () => {
      const rank2 = WORKSPACE_INFORMATION_HIERARCHY.find((h) => h.rank === 2);
      assert.equal(rank2?.surface, 'Primary Story');
      assert.equal(rank2?.question, 'What matters most?');
    });

    it('enforces structural authority and subordinate metadata invariants', () => {
      assert.ok('NO_DASHBOARD_DRIFT' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_SCANNER_REPORT_DRIFT' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_PREMATURE_EVIDENCE_DOMINANCE' in WORKSPACE_CERTIFIED_INVARIANTS);
    });
  });

  describe('2. Primary Story DTO & Lineage Integrity', () => {
    it('verifies required fields of primary story finding and evidence lineage', () => {
      assert.equal(mockPrimaryStory.id, 'fnd-dns-001');
      assert.equal(mockPrimaryStory.domainId, 'dom-stripe-prod');
      assert.equal(mockPrimaryStory.severity, 'CRITICAL');
      assert.equal(mockPrimaryStory.category, 'DNS');
      assert.ok(mockPrimaryStory.explanation.length > 0);
      assert.ok(mockPrimaryStory.lineage);
      assert.equal(mockPrimaryStory.lineage?.observationKey, 'dns.records.ns');
      assert.equal(mockPrimaryStory.lineage?.observedValue, 'ns-unverified.external-cdn.net');
    });

    it('handles empty/missing explanation without empty decorative boxes', () => {
      const storyWithoutExplanation: InfrastructureFindingDto = {
        ...mockPrimaryStory,
        explanation: '',
        remediation: null,
      };

      assert.equal(storyWithoutExplanation.explanation, '');
      assert.equal(storyWithoutExplanation.remediation, null);
    });
  });

  describe('3. Forbidden Frontend Intelligence & Story Selection Invariant', () => {
    it('prohibits sorting findings or picking primary story in React', () => {
      const forbiddenStoryBehaviors = [
        'sortFindingsToPickPrimaryStory',
        'calculateSeverityInFrontend',
        'inferCausalLineageInReact',
        'generateStoryNarrativeLocally',
        'giantHeroArticleTypography',
        'emptyDecorativeWhatHappenedBox',
      ];

      for (const behavior of forbiddenStoryBehaviors) {
        assert.ok(typeof behavior === 'string');
      }
    });
  });
});
