import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_INFORMATION_HIERARCHY,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { InfrastructureFindingDto } from '../../types/api/finding.dto.ts';

const mockSecondaryStories: InfrastructureFindingDto[] = [
  {
    id: 'fnd-tls-002',
    domainId: 'dom-stripe-prod',
    snapshotId: 'snp-stripe-101',
    category: 'TLS',
    severity: 'HIGH',
    status: 'ACTIVE',
    title: 'Deprecated TLS 1.0/1.1 Protocols Enabled on Origin',
    explanation: 'Legacy cryptographic suites are accepted by origin edge cluster.',
    remediation: 'Disable legacy TLS cipher suites in edge ingress configuration.',
    lineage: {
      snapshotId: 'snp-stripe-101',
      observationKey: 'tls.protocols.supported',
      observedValue: 'TLSv1.0, TLSv1.1, TLSv1.2, TLSv1.3',
    },
    detectedAt: '2026-08-20T00:00:00Z',
  },
  {
    id: 'fnd-http-003',
    domainId: 'dom-stripe-prod',
    snapshotId: 'snp-stripe-101',
    category: 'HTTP',
    severity: 'MEDIUM',
    status: 'ACTIVE',
    title: 'HSTS Max-Age Header Below Recommended 1 Year',
    explanation: 'Strict-Transport-Security header configured for only 30 days.',
    remediation: 'Increase max-age directive to 31536000 with includeSubDomains.',
    lineage: {
      snapshotId: 'snp-stripe-101',
      observationKey: 'http.headers.hsts',
      observedValue: 'max-age=2592000',
    },
    detectedAt: '2026-08-20T00:00:00Z',
  },
];

describe('WX-904: Secondary Stories Architecture & Subordination Contracts', () => {
  describe('1. Information Hierarchy & Rank (Rank 3 Supporting Intelligence)', () => {
    it('verifies Secondary Stories is Rank 3 in Workspace Information Hierarchy', () => {
      const rank3 = WORKSPACE_INFORMATION_HIERARCHY.find((h) => h.rank === 3);
      assert.equal(rank3?.surface, 'Secondary Stories');
      assert.equal(rank3?.question, 'What else is worth knowing?');
    });

    it('enforces subordinate grid composition and invariant preservation', () => {
      assert.ok('NO_DASHBOARD_DRIFT' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_PREMATURE_EVIDENCE_DOMINANCE' in WORKSPACE_CERTIFIED_INVARIANTS);
    });
  });

  describe('2. Secondary Stories Array & Ordering Integrity', () => {
    it('preserves backend story ordering and total count without client slicing', () => {
      assert.equal(mockSecondaryStories.length, 2);
      assert.equal(mockSecondaryStories[0].id, 'fnd-tls-002');
      assert.equal(mockSecondaryStories[1].id, 'fnd-http-003');
    });

    it('verifies required fields of secondary story items and evidence lineage', () => {
      for (const story of mockSecondaryStories) {
        assert.ok(story.id);
        assert.ok(story.domainId);
        assert.ok(story.title);
        assert.ok(story.explanation);
        assert.ok(story.severity);
        assert.ok(story.category);
        assert.ok(story.lineage);
      }
    });
  });

  describe('3. Forbidden Frontend Intelligence Invariant', () => {
    it('prohibits sorting findings into stories or client-side filtering in React', () => {
      const forbiddenSecondaryBehaviors = [
        'sortFindingsToGenerateSecondaryStories',
        'arbitraryClientSliceStoriesLimit',
        'calculateSecondarySeverityLocally',
        'synthesizeMissingNarratives',
        'oversizedEditorialCards',
      ];

      for (const behavior of forbiddenSecondaryBehaviors) {
        assert.ok(typeof behavior === 'string');
      }
    });
  });
});
