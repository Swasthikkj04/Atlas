import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveAuthoritativeImpact,
  resolveMeaningfulChangeStory,
  CHANGES_CERTIFIED_INVARIANTS,
} from './contracts/changes.contract.ts';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { TimelineEventDto } from '../../types/api';

const mockDomainId = 'dom-ding-001';
const mockDomainName = 'ding.com';

const mockPositiveCertRenewalEvent: TimelineEventDto = {
  id: 'evt-tls-renew-001',
  domainId: mockDomainId,
  domainName: mockDomainName,
  snapshotId: 'snp-102',
  currentSnapshotId: 'snp-102',
  previousSnapshotId: 'snp-101',
  changeType: 'TLS_CERT_RENEWED',
  category: 'tls_ssl',
  severity: 'INFORMATIONAL',
  title: 'TLS certificate renewed',
  summary: 'Certificate validity window has been extended.',
  explanation: 'The current certificate remains valid for continued encrypted communication.',
  impact: 'Low Impact: Operational change recorded for TLS. Security baseline maintained.',
  previousValue: 'Expires Oct 12, 2026',
  currentValue: 'Expires Dec 22, 2026',
  detectedAt: '2026-08-23T12:00:10Z',
  evidenceCount: 2,
};

const mockCriticalVulnEvent: TimelineEventDto = {
  id: 'evt-crit-002',
  domainId: mockDomainId,
  domainName: mockDomainName,
  snapshotId: 'snp-102',
  currentSnapshotId: 'snp-102',
  previousSnapshotId: 'snp-101',
  changeType: 'REGRESSED',
  category: 'security_headers',
  severity: 'CRITICAL',
  title: 'HSTS & CSP headers removed',
  summary: 'Core transport security headers were dropped.',
  explanation: 'Absence of HSTS allows protocol downgrade attacks against encrypted sessions.',
  impact: 'CRITICAL Risk: Security headers change (regressed) severely impacts security posture.',
  previousValue: 'max-age=31536000; includeSubDomains',
  currentValue: 'absent',
  detectedAt: '2026-08-23T12:30:00Z',
  evidenceCount: 4,
};

const mockFactualNeutralEvent: TimelineEventDto = {
  id: 'evt-dns-neutral-003',
  domainId: mockDomainId,
  domainName: mockDomainName,
  snapshotId: 'snp-102',
  currentSnapshotId: 'snp-102',
  previousSnapshotId: 'snp-101',
  changeType: 'MODIFIED',
  category: 'dns',
  severity: 'LOW',
  title: 'DNS TTL modified',
  previousValue: '300',
  currentValue: '3600',
  detectedAt: '2026-08-23T12:45:00Z',
  evidenceCount: 1,
};

describe('WX-1005: Change Significance & Impact', () => {
  describe('1. Authoritative Impact & Direction Semantics', () => {
    it('maps positive cert renewals to POSITIVE impact and IMPROVEMENT direction', () => {
      const res = resolveAuthoritativeImpact('INFORMATIONAL', 'TLS_CERT_RENEWED');
      assert.equal(res.impact, 'POSITIVE');
      assert.equal(res.direction, 'IMPROVEMENT');
      assert.equal(res.impactLabel, 'Improvement');
      assert.equal(res.badgeVariant, 'positive');
    });

    it('maps critical security regressions to CRITICAL impact and REGRESSION direction', () => {
      const res = resolveAuthoritativeImpact('CRITICAL', 'REGRESSED');
      assert.equal(res.impact, 'CRITICAL');
      assert.equal(res.direction, 'REGRESSION');
      assert.equal(res.impactLabel, 'Critical');
      assert.equal(res.badgeVariant, 'critical');
    });

    it('maps medium severity modifications to ATTENTION impact', () => {
      const res = resolveAuthoritativeImpact('MEDIUM', 'MODIFIED');
      assert.equal(res.impact, 'ATTENTION');
      assert.equal(res.impactLabel, 'Attention');
      assert.equal(res.badgeVariant, 'attention');
    });

    it('maps factual operational modifications to NEUTRAL impact', () => {
      const res = resolveAuthoritativeImpact('LOW', 'MODIFIED');
      assert.equal(res.impact, 'NEUTRAL');
      assert.equal(res.direction, 'NEUTRAL');
      assert.equal(res.impactLabel, 'Low Impact');
      assert.equal(res.badgeVariant, 'neutral');
    });
  });

  describe('2. Progressive Disclosure & Meaningful Story Generation', () => {
    it('produces authoritative 5-part change story with impact, summary, and significance', () => {
      const story = resolveMeaningfulChangeStory(mockPositiveCertRenewalEvent, mockDomainName);

      // 1. What changed (Category + Impact + Title + Summary)
      assert.equal(story.category, 'tls_ssl');
      assert.equal(story.impact, 'POSITIVE');
      assert.equal(story.direction, 'IMPROVEMENT');
      assert.equal(story.title, 'TLS certificate renewed');
      assert.equal(story.summaryNarrative, 'Certificate validity window has been extended.');

      // 2. Why does it matter (Authoritative explanation)
      assert.equal(story.hasAuthoritativeSignificance, true);
      assert.equal(
        story.significanceExplanation,
        'The current certificate remains valid for continued encrypted communication.'
      );

      // 3. What was different (Previous -> Current)
      assert.equal(story.previousValue, 'Expires Oct 12, 2026');
      assert.equal(story.currentValue, 'Expires Dec 22, 2026');

      // 4. Evidence lineage
      assert.equal(story.currentSnapshotId, 'snp-102');
      assert.equal(story.previousSnapshotId, 'snp-101');
      assert.equal(story.evidenceCount, 2);
    });

    it('produces authoritative critical regression change story with impact assessment', () => {
      const story = resolveMeaningfulChangeStory(mockCriticalVulnEvent, mockDomainName);

      assert.equal(story.category, 'security_headers');
      assert.equal(story.impact, 'CRITICAL');
      assert.equal(story.direction, 'REGRESSION');
      assert.equal(story.title, 'HSTS & CSP headers removed');
      assert.equal(story.summaryNarrative, 'Core transport security headers were dropped.');
      assert.equal(story.hasAuthoritativeSignificance, true);
      assert.equal(
        story.significanceExplanation,
        'Absence of HSTS allows protocol downgrade attacks against encrypted sessions.'
      );
      assert.equal(story.impactNarrative, 'CRITICAL Risk: Security headers change (regressed) severely impacts security posture.');
      assert.equal(story.previousValue, 'max-age=31536000; includeSubDomains');
      assert.equal(story.currentValue, 'absent');
      assert.equal(story.evidenceCount, 4);
    });

    it('handles factual events without backend significance honestly without client-side fabrication', () => {
      const story = resolveMeaningfulChangeStory(mockFactualNeutralEvent, mockDomainName);

      assert.equal(story.title, 'DNS TTL modified');
      assert.equal(story.impact, 'NEUTRAL');
      assert.equal(story.hasAuthoritativeSignificance, false);
      assert.equal(story.significanceExplanation, '');
      assert.equal(story.previousValue, '300');
      assert.equal(story.currentValue, '3600');
    });
  });

  describe('3. Truth Matrix & Certified Invariants Audit', () => {
    it('verifies WX-1005 capability is registered in Truth Matrix with PRODUCTION_READY status', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Change Significance & Impact'
      );
      assert.ok(cap, 'Change Significance & Impact must exist in Truth Matrix');
      assert.equal(cap?.category, 'Changes');
      assert.equal(cap?.status, 'PRODUCTION_READY');
    });

    it('verifies all 4 WX-1005 invariants are certified in truth contracts', () => {
      const requiredInvariants = [
        'AUTHORITATIVE_IMPACT_SEMANTICS',
        'PROGRESSIVE_CHANGE_DISCLOSURE',
        'CHANGE_DIRECTION_INTEGRITY',
        'NO_SPECULATIVE_CAUSALITY_FALLBACK',
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
