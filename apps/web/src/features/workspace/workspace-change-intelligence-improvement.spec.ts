import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeChangeType,
  resolveAuthoritativeImpact,
  resolveMeaningfulChangeStory,
  deriveAuthoritativePolicySummary,
  CHANGES_CERTIFIED_INVARIANTS,
} from './contracts/changes.contract.ts';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import { resolveChangeMeaningHierarchy } from './contracts/investigation-hierarchy.contract.ts';
import type { TimelineEventDto } from '../../types/api';

const mockDomainId = 'dom-prod-001';
const mockDomainName = 'nebula-guard.io';

const mockCspImprovedEvent: TimelineEventDto = {
  id: 'evt-csp-improved-1024',
  domainId: mockDomainId,
  domainName: mockDomainName,
  snapshotId: 'snp-curr-200',
  currentSnapshotId: 'snp-curr-200',
  previousSnapshotId: 'snp-prev-199',
  changeType: 'IMPROVED',
  category: 'security_headers',
  severity: 'LOW',
  title: 'Content-Security-Policy improved',
  summary: 'Protection improved',
  explanation:
    "Content-Security-Policy provides an additional browser-side defense against certain content-injection scenarios. Its addition strengthens the domain's defensive posture compared with the previous verified state.",
  impact: 'Low Impact: Operational change recorded for security_headers. Security baseline maintained.',
  subject: 'Content-Security-Policy',
  whatThisEstablishes:
    'Nebula verified that the current authoritative response contains a Content-Security-Policy that differs from the previous verified response.',
  whatThisDoesNotEstablish:
    'This change does not guarantee that all content-injection or XSS scenarios are prevented.',
  derivedSummary: {
    previousLabel: 'No effective CSP',
    currentLabel: 'CSP present',
    postureChange: 'Protection improved',
    directives: { previous: 0, current: 3 },
    allowedSources: 'Configured',
    browserRestrictions: 'Stronger',
    overallPosture: 'Improved',
  },
  previousValue: 'Not configured',
  currentValue: "default-src 'self'; script-src 'self' https:; object-src 'none'",
  detectedAt: '2026-08-25T19:04:00Z',
  evidenceCount: 3,
};

const mockCspDegradedEvent: TimelineEventDto = {
  id: 'evt-csp-degraded-1024',
  domainId: mockDomainId,
  domainName: mockDomainName,
  snapshotId: 'snp-curr-201',
  currentSnapshotId: 'snp-curr-201',
  previousSnapshotId: 'snp-prev-200',
  changeType: 'DEGRADED',
  category: 'security_headers',
  severity: 'HIGH',
  title: 'Content-Security-Policy degraded',
  summary: 'Protection degraded',
  explanation:
    'Removal or loosening of Content-Security-Policy leaves the application vulnerable to client-side code injection.',
  impact: 'HIGH Risk: Security header removal degrades defensive posture.',
  subject: 'Content-Security-Policy',
  whatThisEstablishes:
    'Nebula verified that the previous Content-Security-Policy header is absent in the current response.',
  whatThisDoesNotEstablish:
    'This change does not prove an active exploit has occurred on the endpoint.',
  derivedSummary: {
    previousLabel: 'CSP present',
    currentLabel: 'No effective CSP',
    postureChange: 'Protection degraded',
    directives: { previous: 3, current: 0 },
    allowedSources: 'Removed',
    browserRestrictions: 'Weakened',
    overallPosture: 'Degraded',
  },
  previousValue: "default-src 'self'; script-src 'self' https:; object-src 'none'",
  currentValue: 'absent',
  detectedAt: '2026-08-25T20:15:00Z',
  evidenceCount: 2,
};

const mockNeutralDnsEvent: TimelineEventDto = {
  id: 'evt-dns-neutral-1024',
  domainId: mockDomainId,
  domainName: mockDomainName,
  snapshotId: 'snp-curr-202',
  currentSnapshotId: 'snp-curr-202',
  previousSnapshotId: 'snp-prev-201',
  changeType: 'CHANGED',
  category: 'dns',
  severity: 'LOW',
  title: 'DNS Configuration Changed',
  summary: 'DNS A record modified',
  explanation:
    'DNS record modifications affect routing topology and domain resolution availability.',
  impact: 'Low Impact: Operational change recorded for DNS.',
  subject: 'DNS Configuration',
  previousValue: '198.51.100.1',
  currentValue: '198.51.100.2',
  detectedAt: '2026-08-25T21:00:00Z',
  evidenceCount: 1,
};

describe('WX-1024: Change Intelligence & Improvement Experience', () => {
  describe('1. Change Headline & Canonical Outcome Classification', () => {
    it('distinguishes canonical change types (IMPROVED, DEGRADED, ADDED, REMOVED, CHANGED, STABLE)', () => {
      assert.equal(normalizeChangeType('IMPROVED'), 'IMPROVED');
      assert.equal(normalizeChangeType('DEGRADED'), 'DEGRADED');
      assert.equal(normalizeChangeType('ADDED'), 'ADDED');
      assert.equal(normalizeChangeType('REMOVED'), 'REMOVED');
      assert.equal(normalizeChangeType('CHANGED'), 'CHANGED');
      assert.equal(normalizeChangeType('MODIFIED'), 'CHANGED');
      assert.equal(normalizeChangeType('STABLE'), 'STABLE');
      assert.equal(normalizeChangeType('UNCHANGED'), 'STABLE');
    });

    it('preserves outcome headline expressing the result rather than raw before/after data', () => {
      const story = resolveMeaningfulChangeStory(mockCspImprovedEvent);
      assert.equal(story.title, 'Content-Security-Policy improved');
      assert.equal(story.changeType, 'IMPROVED');
      assert.equal(story.subject, 'Content-Security-Policy');
    });
  });

  describe('2. Restrained Semantic Badges (No Rainbow)', () => {
    it('resolves IMPROVED outcome to positive impact with restrained emerald semantics', () => {
      const impact = resolveAuthoritativeImpact('LOW', 'IMPROVED');
      assert.equal(impact.impact, 'POSITIVE');
      assert.equal(impact.direction, 'IMPROVEMENT');
      assert.equal(impact.badgeVariant, 'positive');
    });

    it('resolves DEGRADED outcome to negative impact with restrained crimson semantics', () => {
      const impact = resolveAuthoritativeImpact('HIGH', 'DEGRADED');
      assert.equal(impact.impact, 'NEGATIVE');
      assert.equal(impact.direction, 'REGRESSION');
      assert.equal(impact.badgeVariant, 'negative');
    });

    it('resolves neutral operational transitions to neutral semantics', () => {
      const impact = resolveAuthoritativeImpact('LOW', 'CHANGED');
      assert.equal(impact.impact, 'NEUTRAL');
      assert.equal(impact.direction, 'NEUTRAL');
      assert.equal(impact.badgeVariant, 'neutral');
    });
  });

  describe('3. Intelligent "What Changed" Interpretation', () => {
    it('provides an actual interpretation of what happened instead of raw diff', () => {
      const story = resolveMeaningfulChangeStory(mockCspImprovedEvent);
      assert.equal(story.summaryNarrative, 'Protection improved');
      assert.ok(story.summaryNarrative.length > 0);

      const degradedStory = resolveMeaningfulChangeStory(mockCspDegradedEvent);
      assert.equal(degradedStory.summaryNarrative, 'Protection degraded');
      assert.equal(degradedStory.changeType, 'DEGRADED');

      const neutralStory = resolveMeaningfulChangeStory(mockNeutralDnsEvent);
      assert.equal(neutralStory.changeType, 'CHANGED');
    });
  });

  describe('4. "Why It Matters" Consequence Explanation', () => {
    it('explains browser-side defense and defensive posture strengthening', () => {
      const story = resolveMeaningfulChangeStory(mockCspImprovedEvent);
      assert.ok(
        story.significanceExplanation.includes(
          'additional browser-side defense against certain content-injection scenarios'
        )
      );
      assert.ok(
        story.significanceExplanation.includes('strengthens the domain\'s defensive posture')
      );
    });
  });

  describe('5. Compact Change Summary & Derived Policy Summary', () => {
    it('structures previous vs current state before raw evidence', () => {
      const story = resolveMeaningfulChangeStory(mockCspImprovedEvent);
      assert.equal(story.previousValue, 'Not configured');
      assert.ok(story.currentValue?.includes("default-src 'self'"));
    });

    it('correctly provides derived comparison metrics for complex policy changes', () => {
      const story = resolveMeaningfulChangeStory(mockCspImprovedEvent);
      assert.ok(story.derivedSummary);
      assert.equal(story.derivedSummary?.previousLabel, 'No effective CSP');
      assert.equal(story.derivedSummary?.currentLabel, 'CSP present');
      assert.equal(story.derivedSummary?.postureChange, 'Protection improved');
      assert.deepEqual(story.derivedSummary?.directives, { previous: 0, current: 3 });
      assert.equal(story.derivedSummary?.allowedSources, 'Configured');
      assert.equal(story.derivedSummary?.browserRestrictions, 'Stronger');
      assert.equal(story.derivedSummary?.overallPosture, 'Improved');
    });

    it('derives policy summary automatically when raw values are supplied without explicit derivedSummary', () => {
      const eventWithoutDerived: TimelineEventDto = {
        id: 'evt-raw-csp-01',
        domainId: mockDomainId,
        changeType: 'ADDED',
        category: 'security_headers',
        severity: 'LOW',
        title: 'Content-Security-Policy added',
        previousValue: 'Not configured',
        currentValue: "default-src 'self'; script-src 'self'; style-src 'self'",
        detectedAt: '2026-08-25T19:04:00Z',
      };

      const derived = deriveAuthoritativePolicySummary(eventWithoutDerived);
      assert.ok(derived);
      assert.equal(derived?.previousLabel, 'No effective CSP');
      assert.equal(derived?.currentLabel, 'CSP present');
      assert.equal(derived?.postureChange, 'Protection improved');
      assert.deepEqual(derived?.directives, { previous: 0, current: 3 });
      assert.equal(derived?.overallPosture, 'Improved');
    });
  });

  describe('6. Evidence Lineage Strip & Snapshot Traceability', () => {
    it('preserves previous and current snapshot timestamps and identifiers for lineage', () => {
      const story = resolveMeaningfulChangeStory(mockCspImprovedEvent);
      assert.equal(story.previousSnapshotId, 'snp-prev-199');
      assert.equal(story.currentSnapshotId, 'snp-curr-200');
      assert.ok(story.currentSnapshotTimestamp);
      assert.ok(story.previousSnapshotTimestamp);
    });
  });

  describe('7. Anti-Overclaiming Boundaries (What is and is not established)', () => {
    it('explicitly defines what the change establishes vs what it does not establish', () => {
      const story = resolveMeaningfulChangeStory(mockCspImprovedEvent);
      assert.equal(
        story.whatThisEstablishes,
        'Nebula verified that the current authoritative response contains a Content-Security-Policy that differs from the previous verified response.'
      );
      assert.equal(
        story.whatThisDoesNotEstablish,
        'This change does not guarantee that all content-injection or XSS scenarios are prevented.'
      );
    });

    it('populates boundaries in Change Meaning Hierarchy for deep investigation', () => {
      const hierarchy = resolveChangeMeaningHierarchy({
        change: mockCspImprovedEvent,
        domainName: mockDomainName,
      });

      assert.ok(hierarchy.whatThisEstablishes);
      assert.equal(
        hierarchy.whatThisEstablishes?.description,
        'Nebula verified that the current authoritative response contains a Content-Security-Policy that differs from the previous verified response.'
      );

      assert.ok(hierarchy.whatNebulaDoesNotProve);
      assert.equal(
        hierarchy.whatNebulaDoesNotProve?.description,
        'This change does not guarantee that all content-injection or XSS scenarios are prevented.'
      );
    });
  });

  describe('8. Certified Invariants & Truth Matrix Compliance', () => {
    it('registers WX-1024 capability in WORKSPACE_TRUTH_MATRIX', () => {
      const wx1024Capability = WORKSPACE_TRUTH_MATRIX.find((c) =>
        c.capability.includes('WX-1024')
      );
      assert.ok(wx1024Capability, 'WX-1024 must exist in WORKSPACE_TRUTH_MATRIX');
      assert.equal(wx1024Capability?.status, 'PRODUCTION_READY');
      assert.equal(wx1024Capability?.category, 'Changes');
    });

    it('certifies all WX-1024 invariants in CHANGES_CERTIFIED_INVARIANTS and WORKSPACE_CERTIFIED_INVARIANTS', () => {
      const requiredInvariants = [
        'CHANGE_HEADLINE_OUTCOME_ORIENTED',
        'CANONICAL_CHANGE_OUTCOME_CLASSIFICATION',
        'RESTRAINED_SEMANTIC_CHANGE_BADGES',
        'INTELLIGENT_WHAT_CHANGED_INTERPRETATION',
        'EXPLAIN_CONSEQUENCE_OVER_MECHANICS',
        'COMPACT_SUMMARY_BEFORE_EVIDENCE',
        'COLLAPSIBLE_RAW_POLICY_EVIDENCE',
        'EVIDENCE_LINEAGE_STRIP_TRACEABILITY',
        'ANTI_OVERCLAIMING_SECURITY_BOUNDARY',
        'AUTHORITATIVE_BACKEND_CHANGE_CONTRACT',
      ] as const;

      for (const inv of requiredInvariants) {
        assert.ok(
          inv in CHANGES_CERTIFIED_INVARIANTS,
          `Invariant ${inv} must exist in CHANGES_CERTIFIED_INVARIANTS`
        );
        assert.ok(
          inv in WORKSPACE_CERTIFIED_INVARIANTS,
          `Invariant ${inv} must exist in WORKSPACE_CERTIFIED_INVARIANTS`
        );
      }
    });
  });
});
