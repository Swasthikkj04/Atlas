import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeChangeCategory,
  normalizeChangeType,
  resolveMeaningfulChangeStory,
  groupChangesByCategory,
  AUTHORITATIVE_CHANGE_CATEGORIES,
  AUTHORITATIVE_CHANGE_TYPES,
  CHANGE_CATEGORY_LABELS,
  CHANGE_TYPE_LABELS,
  CHANGES_CERTIFIED_INVARIANTS,
} from './contracts/changes.contract.ts';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { TimelineEventDto } from '../../types/api';

const mockDomainId = 'dom-ding-001';
const mockDomainName = 'ding.com';

const mockTlsWithSignificance: TimelineEventDto = {
  id: 'evt-tls-001',
  domainId: mockDomainId,
  domainName: mockDomainName,
  snapshotId: 'snp-102',
  currentSnapshotId: 'snp-102',
  previousSnapshotId: 'snp-101',
  changeType: 'TLS_CERT_RENEWED',
  category: 'tls_ssl',
  severity: 'INFORMATIONAL',
  title: 'TLS Certificate renewed',
  description: 'Certificate renewed with validity extending to Dec 22, 2026.',
  explanation: 'Routine certificate renewal prevents encryption disruption and browser connection warnings.',
  previousValue: 'Expires Oct 12, 2026 (Let\'s Encrypt)',
  currentValue: 'Expires Dec 22, 2026 (Let\'s Encrypt)',
  detectedAt: '2026-08-23T12:00:10Z',
  evidenceCount: 2,
};

const mockHeaderWithoutSignificance: TimelineEventDto = {
  id: 'evt-hdr-002',
  domainId: mockDomainId,
  domainName: mockDomainName,
  snapshotId: 'snp-102',
  currentSnapshotId: 'snp-102',
  previousSnapshotId: 'snp-101',
  changeType: 'MODIFIED',
  category: 'security_headers',
  severity: 'MEDIUM',
  title: 'X-Frame-Options was enabled',
  description: 'Header configuration changed.',
  previousValue: 'absent',
  currentValue: 'SAMEORIGIN',
  detectedAt: '2026-08-23T12:41:00Z',
  evidenceCount: 1,
};

describe('WX-1004: Change Classification & Meaning', () => {
  describe('1. Canonical Categories & Classification', () => {
    it('verifies all 9 authoritative categories have canonical labels', () => {
      assert.equal(AUTHORITATIVE_CHANGE_CATEGORIES.length, 9);
      for (const cat of AUTHORITATIVE_CHANGE_CATEGORIES) {
        assert.ok(cat in CHANGE_CATEGORY_LABELS, `Missing label for category: ${cat}`);
        assert.ok(CHANGE_CATEGORY_LABELS[cat].length > 0);
      }
    });

    it('normalizes category strings deterministically', () => {
      assert.equal(normalizeChangeCategory('dns_records'), 'dns');
      assert.equal(normalizeChangeCategory('tls_certificate'), 'tls_ssl');
      assert.equal(normalizeChangeCategory('http_status'), 'http');
      assert.equal(normalizeChangeCategory('security_headers'), 'security_headers');
      assert.equal(normalizeChangeCategory('tech_stack'), 'technology');
      assert.equal(normalizeChangeCategory('cloud_hosting'), 'hosting');
      assert.equal(normalizeChangeCategory('cdn_edge'), 'edge_cdn');
      assert.equal(normalizeChangeCategory('ip_network'), 'network');
      assert.equal(normalizeChangeCategory('latency_performance'), 'performance');
      assert.equal(normalizeChangeCategory(null), 'technology');
    });

    it('normalizes change types to authoritative 5-tier classification', () => {
      assert.ok(AUTHORITATIVE_CHANGE_TYPES.length >= 5);
      for (const type of AUTHORITATIVE_CHANGE_TYPES) {
        assert.ok(type in CHANGE_TYPE_LABELS, `Missing label for change type: ${type}`);
        assert.ok(CHANGE_TYPE_LABELS[type].length > 0);
      }

      assert.equal(normalizeChangeType('COMPONENT_DISCOVERED'), 'ADDED');
      assert.equal(normalizeChangeType('DNS_RECORD_ADDED'), 'ADDED');
      assert.equal(normalizeChangeType('DNS_RECORD_REMOVED'), 'REMOVED');
      assert.equal(normalizeChangeType('TLS_CERT_RENEWED'), 'IMPROVED');
      assert.equal(normalizeChangeType('TLS_EXPIRATION_WARNING'), 'REGRESSED');
      assert.equal(normalizeChangeType('HTTP_HEADER_MODIFIED'), 'CHANGED');
      assert.equal(normalizeChangeType(null), 'CHANGED');
    });
  });

  describe('2. Change Meaning & Explanation Over Visual Diff', () => {
    it('prioritizes human-readable meaning and preserves authoritative significance when provided', () => {
      const story = resolveMeaningfulChangeStory(mockTlsWithSignificance, mockDomainName);

      assert.equal(story.title, 'TLS Certificate renewed');
      assert.equal(story.changeType, 'IMPROVED');
      assert.equal(story.hasAuthoritativeSignificance, true);
      assert.equal(
        story.significanceExplanation,
        'Routine certificate renewal prevents encryption disruption and browser connection warnings.'
      );
      assert.equal(story.previousValue, 'Expires Oct 12, 2026 (Let\'s Encrypt)');
      assert.equal(story.currentValue, 'Expires Dec 22, 2026 (Let\'s Encrypt)');
    });

    it('honestly handles missing significance without fabricating client-side causal claims', () => {
      const story = resolveMeaningfulChangeStory(mockHeaderWithoutSignificance, mockDomainName);

      assert.equal(story.title, 'X-Frame-Options was enabled');
      assert.equal(story.changeType, 'CHANGED');
      assert.equal(story.hasAuthoritativeSignificance, false);
      assert.equal(story.significanceExplanation, '');
      assert.equal(story.previousValue, 'absent');
      assert.equal(story.currentValue, 'SAMEORIGIN');
    });
  });

  describe('3. Category Grouping of Related Changes', () => {
    it('groups changes by category deterministically without speculative clustering', () => {
      const story1 = resolveMeaningfulChangeStory(mockTlsWithSignificance, mockDomainName);
      const story2 = resolveMeaningfulChangeStory(mockHeaderWithoutSignificance, mockDomainName);

      const groups = groupChangesByCategory([story1, story2]);

      assert.equal(groups.tls_ssl.length, 1);
      assert.equal(groups.tls_ssl[0].changeId, 'evt-tls-001');

      assert.equal(groups.security_headers.length, 1);
      assert.equal(groups.security_headers[0].changeId, 'evt-hdr-002');

      assert.equal(groups.dns.length, 0);
      assert.equal(groups.hosting.length, 0);
    });
  });

  describe('4. Truth Matrix & Certified Invariants Audit', () => {
    it('verifies WX-1004 capability is registered in Truth Matrix with PRODUCTION_READY status', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Change Classification & Meaning'
      );
      assert.ok(cap, 'Change Classification & Meaning must exist in Truth Matrix');
      assert.equal(cap?.category, 'Changes');
      assert.equal(cap?.status, 'PRODUCTION_READY');
    });

    it('verifies all 4 WX-1004 invariants are recorded in truth contracts', () => {
      const requiredInvariants = [
        'EXPLANATION_OVER_RAW_DIFF',
        'NO_INVENTED_SIGNIFICANCE',
        'CANONICAL_CHANGE_CLASSIFICATION',
        'HONEST_SIGNIFICANCE_FALLBACK',
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
