import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveMultiDomainBrief,
  formatBriefRelativeTime,
  MULTI_DOMAIN_BRIEF_CERTIFIED_INVARIANTS,
} from './contracts/multi-domain-brief.contract.ts';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { DomainDto, TimelineEventDto } from '../../types/api';

const mockDomains: DomainDto[] = [
  {
    id: 'dom-1',
    domainName: 'amazon.com',
    status: 'ACTIVE',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-26T09:00:00Z',
    lastUnderstoodAt: '2026-08-26T09:30:00Z',
    activeFindingCount: 0,
  },
  {
    id: 'dom-2',
    domainName: 'openai.com',
    status: 'ACTIVE',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-26T09:00:00Z',
    lastUnderstoodAt: '2026-08-26T09:20:00Z',
    activeFindingCount: 0,
  },
  {
    id: 'dom-3',
    domainName: 'example.com',
    status: 'ACTIVE',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-26T09:00:00Z',
    lastUnderstoodAt: '2026-08-26T09:10:00Z',
    activeFindingCount: 0,
  },
  {
    id: 'dom-4',
    domainName: 'api.example.com',
    status: 'ACTIVE',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-26T09:00:00Z',
    lastUnderstoodAt: '2026-08-26T08:50:00Z',
    activeFindingCount: 0,
  },
];

const mockTimelineChanges: TimelineEventDto[] = [
  {
    id: 'evt-1',
    domainId: 'dom-2',
    domainName: 'openai.com',
    changeType: 'IMPROVED',
    severity: 'LOW',
    title: 'Content-Security-Policy improved',
    summary: 'Protection improved',
    explanation: 'Defensive posture strengthened against client-side script injection.',
    impact: 'Strengthened browser-side defense.',
    detectedAt: '2026-08-26T09:20:00Z',
  },
  {
    id: 'evt-2',
    domainId: 'dom-3',
    domainName: 'example.com',
    changeType: 'CHANGED',
    severity: 'LOW',
    title: 'CDN technology changed',
    summary: 'Edge CDN routing updated',
    explanation: 'Infrastructure architecture changed from legacy origin to Cloudflare edge.',
    impact: 'Operational routing modification.',
    detectedAt: '2026-08-26T09:10:00Z',
  },
  {
    id: 'evt-3',
    domainId: 'dom-4',
    domainName: 'api.example.com',
    changeType: 'IMPROVED',
    severity: 'LOW',
    title: 'TLS Certificate renewed',
    summary: 'Certificate renewed successfully',
    explanation: 'Routine certificate renewal prevents encryption disruption.',
    impact: 'Encryption validity extended.',
    detectedAt: '2026-08-26T08:50:00Z',
  },
];

describe('WX-1025: Workspace Intelligence Landing & Multi-Domain Brief', () => {
  describe('1. New Workspace Entry Model & Quiet State', () => {
    it('resolves quiet state when monitored domains have 0 urgent changes or warnings', () => {
      const brief = resolveMultiDomainBrief({
        domains: mockDomains,
        timelineEvents: [],
      });

      assert.equal(brief.state, 'QUIET');
      assert.equal(brief.isQuiet, true);
      assert.equal(brief.totalDomains, 4);
      assert.equal(brief.verifiedUnderstandingsCount, 4);
      assert.equal(brief.verifyingCount, 0);
      assert.equal(brief.headline, 'No significant changes detected.');
      assert.ok(brief.explanation.includes('no changes requiring your attention'));
      assert.equal(brief.domains.length, 4);
      assert.equal(brief.domains[0].status, 'STABLE');
      assert.equal(brief.domains[0].summaryNote, 'No significant changes');
    });

    it('formats relative timestamp accurately without inventing dates', () => {
      assert.equal(formatBriefRelativeTime(null), 'Pending understanding');
      assert.equal(formatBriefRelativeTime('invalid-date'), 'Recently verified');
      const nowIso = new Date().toISOString();
      assert.equal(formatBriefRelativeTime(nowIso), 'Just now');
    });
  });

  describe('2. Four Canonical Workspace Landing States', () => {
    it('A. Zero-Domain State: resolves NO_DOMAINS with call to add first domain', () => {
      const brief = resolveMultiDomainBrief({
        domains: [],
        timelineEvents: [],
      });

      assert.equal(brief.state, 'NO_DOMAINS');
      assert.equal(brief.totalDomains, 0);
      assert.equal(brief.headline, 'Your infrastructure, understood.');
      assert.equal(brief.explanation, 'Add a domain to begin building your infrastructure memory.');
      assert.equal(brief.domains.length, 0);
    });

    it('B. Significant Changes State: aggregates changes across domains with outcome explanations', () => {
      const brief = resolveMultiDomainBrief({
        domains: mockDomains,
        timelineEvents: mockTimelineChanges,
      });

      assert.equal(brief.state, 'CHANGES_DETECTED');
      assert.equal(brief.hasChanges, true);
      assert.equal(brief.totalChangesCount, 3);
      assert.equal(brief.domainsWithChangesCount, 3);
      assert.equal(brief.headline, '3 significant changes detected.');
      assert.ok(brief.explanation.includes('across 3 of your domains'));
      assert.equal(brief.crossDomainChanges.length, 3);
      assert.equal(brief.crossDomainChanges[0].title, 'Content-Security-Policy improved');
      assert.equal(brief.crossDomainChanges[0].domainName, 'openai.com');
    });

    it('C. Attention Required State: prioritizes domains with active findings or degradations', () => {
      const degradedDomains: DomainDto[] = [
        {
          ...mockDomains[0],
          activeFindingCount: 2,
        },
        mockDomains[1],
      ];

      const brief = resolveMultiDomainBrief({
        domains: degradedDomains,
        timelineEvents: [],
      });

      assert.equal(brief.state, 'ATTENTION_REQUIRED');
      assert.equal(brief.hasAttentionRequired, true);
      assert.equal(brief.domainsWithAttentionCount, 1);
      assert.equal(brief.headline, '1 domain may require attention.');
      assert.equal(brief.domains[0].status, 'ATTENTION');
      assert.equal(brief.domains[0].summaryNote, '2 conditions worth reviewing');
    });

    it('D. Understanding In Progress State: transparently reflects actively verifying domains', () => {
      const runningDomains: DomainDto[] = [
        {
          ...mockDomains[0],
          understandingStatus: 'RUNNING',
        },
        {
          ...mockDomains[1],
          understandingStatus: 'PENDING',
        },
        mockDomains[2],
        mockDomains[3],
      ];

      const brief = resolveMultiDomainBrief({
        domains: runningDomains,
        timelineEvents: [],
      });

      assert.equal(brief.state, 'UNDERSTANDING_IN_PROGRESS');
      assert.equal(brief.isVerifying, true);
      assert.equal(brief.verifyingCount, 2);
      assert.equal(brief.verifiedUnderstandingsCount, 2);
      assert.equal(brief.headline, 'Nebula is updating your understanding.');
      assert.equal(brief.explanation, '2 of 4 domains are being verified.');
      assert.equal(brief.domains[0].status, 'VERIFYING');
    });
  });

  describe('3. Non-Chatbot Expert Tone & Anti-Theater Invariants', () => {
    it('guarantees direct expert tone without chatbot greetings or manufactured activity', () => {
      const brief = resolveMultiDomainBrief({
        domains: mockDomains,
        timelineEvents: mockTimelineChanges,
      });

      assert.ok(!brief.headline.toLowerCase().includes('hi '));
      assert.ok(!brief.headline.toLowerCase().includes('welcome back'));
      assert.ok(!brief.explanation.toLowerCase().includes('chat'));
      assert.ok(!brief.explanation.toLowerCase().includes('assistant'));
    });
  });

  describe('4. Cross-Domain Integrity & Isolation', () => {
    it('preserves domain isolation without leaking data across tenants or sibling domains', () => {
      const brief = resolveMultiDomainBrief({
        domains: mockDomains,
        timelineEvents: mockTimelineChanges,
      });

      const openaiChanges = brief.crossDomainChanges.filter((c) => c.domainName === 'openai.com');
      assert.equal(openaiChanges.length, 1);
      assert.equal(openaiChanges[0].title, 'Content-Security-Policy improved');

      const amazonChanges = brief.crossDomainChanges.filter((c) => c.domainName === 'amazon.com');
      assert.equal(amazonChanges.length, 0);
    });
  });

  describe('5. Certified Truth Matrix & Certified Invariants', () => {
    it('verifies WX-1025 registration in Truth Matrix', () => {
      const matrixEntry = WORKSPACE_TRUTH_MATRIX.find(
        (e) => e.capability === 'Workspace Intelligence Landing & Multi-Domain Brief (WX-1025)'
      );
      assert.ok(matrixEntry, 'WX-1025 must be present in WORKSPACE_TRUTH_MATRIX');
      assert.equal(matrixEntry.status, 'PRODUCTION_READY');
      assert.equal(matrixEntry.category, 'Cross-Domain Intelligence');
    });

    it('verifies all 10 certified invariants for WX-1025', () => {
      const invariants = [
        'NO_AUTOMATIC_DOMAIN_CAPTURE',
        'CROSS_DOMAIN_INTELLIGENCE_SURFACE',
        'AUTHORITATIVE_SNAPSHOT_AGGREGATION',
        'QUIET_STATE_IS_PREMIER_FEATURE',
        'ONE_CLICK_DOMAIN_NAVIGATION',
        'NO_CROSS_DOMAIN_DATA_CONTAMINATION',
        'NO_GREETING_CHATBOT_THEATER',
        'EXPLICIT_VERIFICATION_TRANSPARENCY',
        'RESTRAINED_SURFACE_HIERARCHY',
        'CANONICAL_WORKSPACE_CONVERGENCE',
      ] as const;

      for (const inv of invariants) {
        assert.ok(inv in MULTI_DOMAIN_BRIEF_CERTIFIED_INVARIANTS);
        assert.ok(inv in WORKSPACE_CERTIFIED_INVARIANTS);
        assert.ok(
          WORKSPACE_CERTIFIED_INVARIANTS[inv].length > 0,
          `Invariant ${inv} must have descriptive text`
        );
      }
    });
  });
});
