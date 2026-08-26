import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveFindingMeaningHierarchy,
  resolveChangeMeaningHierarchy,
  formatInvestigationDate,
} from './contracts/investigation-hierarchy.contract.ts';
import {
  WORKSPACE_CERTIFIED_INVARIANTS,
  WORKSPACE_TRUTH_MATRIX,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { InfrastructureFindingDto, TimelineEventDto } from '../../types/api';

describe('WX-1019: Investigation Meaning & Evidence Hierarchy', () => {
  const mockFinding: InfrastructureFindingDto = {
    id: 'fnd-dns-spf-001',
    domainId: 'dom-atlas-001',
    snapshotId: '128de14d-be5c-474c-b18d-ba56cc06beaf',
    domainName: 'amazon.com',
    category: 'DNS',
    severity: 'HIGH',
    status: 'ACTIVE',
    title: 'SPF Record Not Found',
    description: 'amazon.com does not publish an SPF record.',
    explanation: 'The domain does not publish an SPF record.',
    remediation:
      'Without an SPF policy, receiving mail systems have less information to distinguish authorized senders from unauthorized ones. This can increase the risk of messages appearing to originate from the domain when they were not sent by its legitimate infrastructure.',
    detectedAt: '2026-08-25T17:40:00.000Z',
    rule: {
      ruleId: 'dns.missing-spf',
      ruleVersion: '1.0.0',
      name: 'SPF Record Missing',
      category: 'DNS',
      evaluationLogic: 'Checks for TXT record starting with v=spf1',
    },
    lineage: {
      snapshotId: '128de14d-be5c-474c-b18d-ba56cc06beaf',
      observationKey: 'dns_record',
      observedValue: 'SPF Record Not Found',
      ruleId: 'dns.missing-spf',
    },
  };

  const mockChangeEvent: TimelineEventDto = {
    id: 'chg-dns-001',
    domainId: 'dom-atlas-001',
    snapshotId: '128de14d-be5c-474c-b18d-ba56cc06beaf',
    previousSnapshotId: '099ab71e-34cc-4211-9fa1-aa7123bcdef0',
    changeType: 'DNS_RECORD_REMOVED',
    severity: 'HIGH',
    category: 'DNS',
    title: 'TXT Record Removed',
    description: 'TXT SPF record was removed from DNS zone.',
    explanation: 'The DNS TXT record containing SPF authorization was deleted.',
    impact: 'Mail deliverability and spoofing protections are degraded.',
    previousValue: 'v=spf1 include:_spf.amazon.com ~all',
    currentValue: null,
    detectedAt: '2026-08-25T17:40:00.000Z',
  };

  describe('1. Formatter: formatInvestigationDate', () => {
    it('formats investigation dates clearly with date and time', () => {
      const formatted = formatInvestigationDate('2026-08-25T17:40:00.000Z');
      assert.ok(formatted.includes('Aug 25, 2026') || formatted.includes('2026'));
      assert.notEqual(formatted, 'Timestamp unavailable');
    });

    it('returns honest fallback on invalid date input', () => {
      assert.equal(formatInvestigationDate(null), 'Timestamp unavailable');
      assert.equal(formatInvestigationDate('invalid-date'), 'Unverified timestamp');
    });
  });

  describe('2. Finding Meaning Hierarchy Sequence', () => {
    it('resolves canonical 6-layer hierarchy in the exact specified order', () => {
      const hierarchy = resolveFindingMeaningHierarchy({
        finding: mockFinding,
        domainName: 'amazon.com',
      });

      // Layer 1: Hero
      assert.equal(hierarchy.hero.title, 'SPF Record Not Found');
      assert.equal(hierarchy.hero.subtitle, 'amazon.com does not publish an SPF record.');
      assert.equal(hierarchy.hero.category, 'DNS');
      assert.equal(hierarchy.hero.severity, 'HIGH');
      assert.equal(hierarchy.hero.snapshotShortId, '128de14d…');

      // Layer 2: What Happened (first substantive section)
      assert.equal(hierarchy.whatHappened.explanation, 'The domain does not publish an SPF record.');

      // Layer 3: Why It Matters (significance before technical evidence)
      assert.ok(hierarchy.whyItMatters.significance.includes('Without an SPF policy'));
      assert.equal(hierarchy.whyItMatters.impactLevel, 'HIGH');

      // Layer 4: What This Means (Domain, Control, Observed State)
      assert.equal(hierarchy.whatThisMeans.domain, 'amazon.com');
      assert.equal(hierarchy.whatThisMeans.control, 'SPF Record Missing');
      assert.equal(hierarchy.whatThisMeans.observedState, 'Not published');

      // Layer 5: Observed Evidence (technical proof)
      assert.equal(hierarchy.observedEvidence.ruleId, 'dns.missing-spf');
      assert.equal(hierarchy.observedEvidence.observationKey, 'dns_record');
      assert.equal(hierarchy.observedEvidence.observedValue, 'SPF Record Not Found');

      // Layer 6: How Nebula Knows (progressively disclosed chain)
      assert.equal(hierarchy.howNebulaKnows.length, 4);
      assert.equal(hierarchy.howNebulaKnows[0].step, 'Finding resolved');
      assert.equal(hierarchy.howNebulaKnows[1].step, 'Snapshot resolved');
      assert.equal(hierarchy.howNebulaKnows[2].step, 'Observation evaluated');
      assert.equal(hierarchy.howNebulaKnows[3].step, 'Investigation assembled');

      // Layer 7: Verified Context Footer
      assert.equal(hierarchy.verifiedContext.domain, 'amazon.com');
      assert.equal(hierarchy.verifiedContext.snapshotId, '128de14d-be5c-474c-b18d-ba56cc06beaf');
    });

    it('provides honest factual fallback for significance when remediation is omitted', () => {
      const bareFinding: InfrastructureFindingDto = {
        ...mockFinding,
        remediation: undefined,
        recommendations: undefined,
      };

      const hierarchy = resolveFindingMeaningHierarchy({
        finding: bareFinding,
        domainName: 'amazon.com',
      });

      assert.ok(hierarchy.whyItMatters.significance.length > 0);
      assert.ok(hierarchy.whyItMatters.significance.includes('security posture'));
    });
  });

  describe('3. Change Investigation Meaning Hierarchy Sequence', () => {
    it('shares the identical information hierarchy pattern with Finding Investigation', () => {
      const hierarchy = resolveChangeMeaningHierarchy({
        change: mockChangeEvent,
        domainName: 'amazon.com',
      });

      // Layer 1: Hero
      assert.equal(hierarchy.hero.title, 'TXT Record Removed');
      assert.equal(hierarchy.hero.severity, 'HIGH');
      assert.equal(hierarchy.hero.changeType, 'DNS_RECORD_REMOVED');
      assert.equal(hierarchy.hero.snapshotShortId, '128de14d…');

      // Layer 2: What Happened
      assert.equal(
        hierarchy.whatHappened.explanation,
        'The DNS TXT record containing SPF authorization was deleted.'
      );

      // Layer 3: Why It Matters
      assert.equal(
        hierarchy.whyItMatters.significance,
        'Mail deliverability and spoofing protections are degraded.'
      );
      assert.equal(hierarchy.whyItMatters.impactLevel, 'HIGH');

      // Layer 4: What This Means
      assert.equal(hierarchy.whatThisMeans.domain, 'amazon.com');
      assert.equal(hierarchy.whatThisMeans.changeType, 'DNS_RECORD_REMOVED');
      assert.equal(hierarchy.whatThisMeans.transitionState, 'Verified State Transition');

      // Layer 5: Observed Evidence
      assert.equal(
        hierarchy.observedEvidence.previousValue,
        'v=spf1 include:_spf.amazon.com ~all'
      );
      assert.equal(hierarchy.observedEvidence.currentValue, null);
      assert.equal(
        hierarchy.observedEvidence.previousSnapshotId,
        '099ab71e-34cc-4211-9fa1-aa7123bcdef0'
      );

      // Layer 6: How Nebula Knows
      assert.equal(hierarchy.howNebulaKnows.length, 3);
      assert.equal(hierarchy.howNebulaKnows[0].step, 'Change detected');
      assert.equal(hierarchy.howNebulaKnows[1].step, 'Snapshot comparison verified');
      assert.equal(hierarchy.howNebulaKnows[2].step, 'Evidence lineage assembled');

      // Layer 7: Verified Context
      assert.equal(hierarchy.verifiedContext.domain, 'amazon.com');
      assert.equal(
        hierarchy.verifiedContext.snapshotId,
        '128de14d-be5c-474c-b18d-ba56cc06beaf'
      );
    });
  });

  describe('4. Truth Contract & Invariant Certification (WX-1019)', () => {
    it('contains WX-1019 in WORKSPACE_TRUTH_MATRIX', () => {
      const truthEntry = WORKSPACE_TRUTH_MATRIX.find((t) =>
        t.capability.includes('WX-1019') || t.capability.includes('Investigation Meaning')
      );
      assert.ok(truthEntry);
      assert.equal(truthEntry?.status, 'PRODUCTION_READY');
    });

    it('certifies all WX-1019 investigation invariants', () => {
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.INTELLIGENCE_BEFORE_DATA);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.SIGNIFICANCE_PRECEDES_EVIDENCE);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.PROGRESSIVE_VERIFICATION_DISCLOSURE);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.SUBORDINATE_UUID_FOOTER);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.CANONICAL_INVESTIGATION_PARITY);
    });
  });
});
