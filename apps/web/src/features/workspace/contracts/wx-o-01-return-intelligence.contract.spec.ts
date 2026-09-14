import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveReturnIntelligenceBrief,
  formatReturnEventDate,
  formatReturnRelativeTime,
  RETURN_INTELLIGENCE_INVARIANTS,
} from './wx-o-01-return-intelligence.contract.ts';
import type { DomainDto, TimelineEventDto } from '../../../types/api';

const mockDomains: DomainDto[] = [
  {
    id: 'dom-sringeri',
    domainName: 'sringeri.net',
    status: 'ACTIVE',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-09-05T09:00:00Z',
    lastUnderstoodAt: '2026-09-05T09:30:00Z',
    activeFindingCount: 0,
  },
  {
    id: 'dom-stripe',
    domainName: 'stripe.com',
    status: 'ACTIVE',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-09-05T09:00:00Z',
    lastUnderstoodAt: '2026-09-05T09:20:00Z',
    activeFindingCount: 1,
  },
  {
    id: 'dom-openai',
    domainName: 'openai.com',
    status: 'ACTIVE',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-09-05T09:00:00Z',
    lastUnderstoodAt: '2026-09-05T09:10:00Z',
    activeFindingCount: 0,
  },
];

const mockTimelineChanges: TimelineEventDto[] = [
  {
    id: 'evt-sringeri-1',
    domainId: 'dom-sringeri',
    domainName: 'sringeri.net',
    changeType: 'IMPROVED',
    severity: 'LOW',
    title: 'Referrer-Policy header added',
    summary: 'Referrer-Policy header active',
    explanation: 'Added Referrer-Policy header restricts referrer leakage across cross-origin requests.',
    impact: 'Browser privacy strengthened.',
    detectedAt: '2026-09-05T09:30:00Z',
  },
  {
    id: 'evt-stripe-1',
    domainId: 'dom-stripe',
    domainName: 'stripe.com',
    changeType: 'CHANGED',
    severity: 'MEDIUM',
    title: 'TLS configuration changed',
    summary: 'TLS cipher suite updated',
    explanation: 'Cipher suite was upgraded to modern TLS 1.3 standard.',
    impact: 'Transport security refreshed.',
    detectedAt: '2026-09-05T09:20:00Z',
  },
];

describe('WX-O-01: Workspace Return Intelligence / Change Overview Contracts', () => {
  describe('1. Frozen Product Principle & Primary Return Question', () => {
    it('WX-O-01-01: encodes the frozen product principle (GX=Now, WX=What Changed)', () => {
      assert.equal(
        RETURN_INTELLIGENCE_INVARIANTS.FROZEN_PRODUCT_PRINCIPLE,
        'GX helps the user understand what exists now. WX helps the user understand what changed.'
      );
    });

    it('WX-O-01-02: answers the core return question: What changed across my monitored domains since I was last here?', () => {
      assert.equal(
        RETURN_INTELLIGENCE_INVARIANTS.PRIMARY_PURPOSE,
        'What changed across my monitored domains since I was last here?'
      );
    });

    it('WX-O-01-03: designates WHAT CHANGED ACROSS DOMAINS as the dominant intelligence surface', () => {
      assert.equal(
        RETURN_INTELLIGENCE_INVARIANTS.DOMINANT_SURFACE,
        'WHAT CHANGED ACROSS DOMAINS'
      );
    });
  });

  describe('2. Return Briefing State Resolutions', () => {
    it('WX-O-01-04: resolves CHANGES_DETECTED state with exact headline and change stories', () => {
      const brief = resolveReturnIntelligenceBrief({
        domains: [mockDomains[0], mockDomains[2]],
        timelineEvents: [mockTimelineChanges[0]],
      });

      assert.equal(brief.state, 'CHANGES_DETECTED');
      assert.equal(brief.hasChanges, true);
      assert.equal(brief.totalChangesCount, 1);
      assert.equal(brief.subtitle, 'Your infrastructure, since you last looked.');
      assert.equal(brief.changes.length, 1);
      assert.equal(brief.changes[0].domainName, 'sringeri.net');
      assert.equal(brief.changes[0].title, 'Referrer-Policy header added');
    });

    it('WX-O-01-05: resolves ATTENTION_REQUIRED when domain has active findings or degradation', () => {
      const brief = resolveReturnIntelligenceBrief({
        domains: mockDomains,
        timelineEvents: mockTimelineChanges,
      });

      assert.equal(brief.state, 'ATTENTION_REQUIRED');
      assert.equal(brief.hasAttentionRequired, true);
      assert.equal(brief.domainsWithAttentionCount, 1);
      assert.equal(brief.attentionItems.length, 1);
      assert.equal(brief.attentionItems[0].domainName, 'stripe.com');
      assert.ok(brief.headline.includes('1 domain may require attention'));
    });

    it('WX-O-01-06: resolves QUIET state when all monitored infrastructure is on verified stable baseline', () => {
      const quietDomains = [mockDomains[0], mockDomains[2]];
      const brief = resolveReturnIntelligenceBrief({
        domains: quietDomains,
        timelineEvents: [],
      });

      assert.equal(brief.state, 'QUIET');
      assert.equal(brief.isQuiet, true);
      assert.equal(brief.changes.length, 0);
      assert.equal(brief.domainsWithChangesCount, 0);
      assert.equal(brief.domainsWithAttentionCount, 0);
      assert.equal(brief.headline, 'No significant changes detected.');
      assert.equal(brief.subtitle, 'Your infrastructure, since you last looked.');
    });

    it('WX-O-01-07: resolves NO_DOMAINS state when 0 domains exist', () => {
      const brief = resolveReturnIntelligenceBrief({
        domains: [],
        timelineEvents: [],
      });

      assert.equal(brief.state, 'NO_DOMAINS');
      assert.equal(brief.totalDomains, 0);
      assert.equal(brief.changes.length, 0);
      assert.equal(brief.domains.length, 0);
      assert.ok(brief.explanation.includes('Add a domain'));
    });

    it('WX-O-01-08: resolves UNDERSTANDING_IN_PROGRESS when domain is actively executing understanding', () => {
      const brief = resolveReturnIntelligenceBrief({
        domains: mockDomains,
        timelineEvents: [],
        activeJobDomainIds: ['dom-sringeri'],
      });

      assert.equal(brief.state, 'UNDERSTANDING_IN_PROGRESS');
      assert.equal(brief.isVerifying, true);
      assert.equal(brief.verifyingCount, 1);
      assert.ok(brief.headline.includes('Nebula is updating your understanding'));
    });
  });

  describe('3. Change Intelligence Card Construction & Formatting', () => {
    it('WX-O-01-09: formats event dates as concise calendar stamps (e.g., Sep 5)', () => {
      const formatted = formatReturnEventDate('2026-09-05T12:00:00Z');
      assert.equal(formatted, 'Sep 5');
    });

    it('WX-O-01-10: handles invalid and missing event dates gracefully', () => {
      assert.equal(formatReturnEventDate(null), 'Recently observed');
      assert.equal(formatReturnEventDate('invalid-date'), 'Recently observed');
    });

    it('WX-O-01-11: formats relative time accurately for domain status lines', () => {
      const nowIso = new Date().toISOString();
      assert.equal(formatReturnRelativeTime(nowIso), 'Just now');
      assert.equal(formatReturnRelativeTime(null), 'Pending understanding');
    });

    it('WX-O-01-12: binds domain name, consequence explanation, and recency to each change card', () => {
      const brief = resolveReturnIntelligenceBrief({
        domains: mockDomains,
        timelineEvents: mockTimelineChanges,
      });

      const sringeriChange = brief.changes.find((c) => c.domainName === 'sringeri.net');
      assert.ok(sringeriChange);
      assert.equal(sringeriChange.title, 'Referrer-Policy header added');
      assert.equal(
        sringeriChange.significance,
        'Added Referrer-Policy header restricts referrer leakage across cross-origin requests.'
      );
      assert.equal(sringeriChange.detectedFormatted, 'Sep 5');
    });

    it('WX-O-01-13: extracts TLS configuration change correctly for stripe.com', () => {
      const brief = resolveReturnIntelligenceBrief({
        domains: mockDomains,
        timelineEvents: mockTimelineChanges,
      });

      const stripeChange = brief.changes.find((c) => c.domainName === 'stripe.com');
      assert.ok(stripeChange);
      assert.equal(stripeChange.title, 'TLS configuration changed');
      assert.equal(stripeChange.significance, 'Cipher suite was upgraded to modern TLS 1.3 standard.');
      assert.equal(stripeChange.detectedFormatted, 'Sep 5');
    });
  });

  describe('4. Domain Selection & Investigative Intent', () => {
    it('WX-O-01-14: frames domain selection as "I want to investigate this"', () => {
      assert.ok(
        RETURN_INTELLIGENCE_INVARIANTS.INVESTIGATION_INTENT.includes('investigation')
      );
    });

    it('WX-O-01-15: assigns proper status badges and summary notes to domain items', () => {
      const brief = resolveReturnIntelligenceBrief({
        domains: mockDomains,
        timelineEvents: mockTimelineChanges,
      });

      const stripeDomain = brief.domains.find((d) => d.domainId === 'dom-stripe');
      assert.ok(stripeDomain);
      assert.equal(stripeDomain.status, 'ATTENTION');
      assert.equal(stripeDomain.statusVariant, 'attention');
      assert.ok(stripeDomain.summaryNote.includes('1 condition worth reviewing'));

      const sringeriDomain = brief.domains.find((d) => d.domainId === 'dom-sringeri');
      assert.ok(sringeriDomain);
      assert.equal(sringeriDomain.status, 'CHANGED');
      assert.equal(sringeriDomain.statusVariant, 'positive');
    });

    it('WX-O-01-16: preserves persistent sidebar invariant without redesign', () => {
      assert.ok(
        RETURN_INTELLIGENCE_INVARIANTS.PERSISTENT_SIDEBAR_INTACT.includes('Overview, Findings, Changes')
      );
    });
  });

  describe('5. Epistemic Honesty & Prohibitions', () => {
    it('WX-O-01-17: never invents synthetic changes or fake findings', () => {
      const brief = resolveReturnIntelligenceBrief({
        domains: [mockDomains[0]],
        timelineEvents: [],
      });

      assert.equal(brief.changes.length, 0);
      assert.equal(brief.totalChangesCount, 0);
      assert.equal(brief.isQuiet, true);
    });

    it('WX-O-01-18: maintains consistent subtitle "Your infrastructure, since you last looked."', () => {
      const briefA = resolveReturnIntelligenceBrief({ domains: mockDomains, timelineEvents: mockTimelineChanges });
      const briefB = resolveReturnIntelligenceBrief({ domains: [mockDomains[0]], timelineEvents: [] });

      assert.equal(briefA.subtitle, 'Your infrastructure, since you last looked.');
      assert.equal(briefB.subtitle, 'Your infrastructure, since you last looked.');
    });

    it('WX-O-01-19: aggregates multiple changes per domain without duplication', () => {
      const multipleEvents: TimelineEventDto[] = [
        ...mockTimelineChanges,
        {
          id: 'evt-sringeri-2',
          domainId: 'dom-sringeri',
          domainName: 'sringeri.net',
          changeType: 'IMPROVED',
          severity: 'LOW',
          title: 'HSTS Max-Age increased',
          summary: 'HSTS header policy updated',
          explanation: 'HSTS max-age extended to 1 year for enhanced transport security.',
          impact: 'Transport security policy strengthened.',
          detectedAt: '2026-09-05T08:00:00Z',
        },
      ];

      const brief = resolveReturnIntelligenceBrief({
        domains: mockDomains,
        timelineEvents: multipleEvents,
      });

      assert.equal(brief.changes.length, 3);
      assert.equal(brief.totalChangesCount, 3);
      assert.equal(brief.domainsWithChangesCount, 2);
    });

    it('WX-O-01-20: verifies total domains count and verified understandings count arithmetic', () => {
      const brief = resolveReturnIntelligenceBrief({
        domains: mockDomains,
        timelineEvents: mockTimelineChanges,
        activeJobDomainIds: ['dom-sringeri'],
      });

      assert.equal(brief.totalDomains, 3);
      assert.equal(brief.verifyingCount, 1);
      assert.equal(brief.verifiedUnderstandingsCount, 2);
    });
  });
});
