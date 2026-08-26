import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMeaningfulChangeStory } from './contracts/changes.contract.ts';
import { integrateAuthoritativeChanges } from './contracts/snapshot-comparison.contract.ts';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { InfrastructureSnapshotDto, TimelineEventDto } from '../../types/api';

const mockDomainId = 'dom-ding-001';
const mockDomainName = 'ding.com';
const mockForeignDomainId = 'dom-other-999';

const mockSnapshotA1: InfrastructureSnapshotDto = {
  id: 'snp-ding-101',
  domainId: mockDomainId,
  capturedAt: '2026-08-16T12:00:00Z',
  createdAt: '2026-08-16T12:00:00Z',
  httpStatus: 200,
  responseTimeMs: 82,
};

const mockSnapshotA2: InfrastructureSnapshotDto = {
  id: 'snp-ding-102',
  domainId: mockDomainId,
  capturedAt: '2026-08-23T12:00:00Z',
  createdAt: '2026-08-23T12:00:00Z',
  httpStatus: 200,
  responseTimeMs: 84,
};

const mockRecentTlsChangeEvent: TimelineEventDto = {
  id: 'evt-tls-101',
  domainId: mockDomainId,
  domainName: mockDomainName,
  snapshotId: 'snp-ding-102',
  currentSnapshotId: 'snp-ding-102',
  previousSnapshotId: 'snp-ding-101',
  changeType: 'TLS_CERT_RENEWED',
  category: 'tls_ssl',
  severity: 'MEDIUM',
  title: 'TLS Certificate renewed',
  description: 'Certificate renewed with validity extending to Dec 22, 2026.',
  explanation: 'Certificate renewal maintains transport security and prevents browser connection warnings.',
  previousValue: 'Expires Oct 12, 2026 (Let\'s Encrypt)',
  currentValue: 'Expires Dec 22, 2026 (Let\'s Encrypt)',
  detectedAt: '2026-08-23T12:00:10Z',
  evidenceCount: 2,
};

const mockEarlierDnsChangeEvent: TimelineEventDto = {
  id: 'evt-dns-102',
  domainId: mockDomainId,
  domainName: mockDomainName,
  snapshotId: 'snp-ding-102',
  currentSnapshotId: 'snp-ding-102',
  previousSnapshotId: 'snp-ding-101',
  changeType: 'DNS_RECORD_MODIFIED',
  category: 'dns',
  severity: 'INFORMATIONAL',
  title: 'Nameserver configuration modified',
  description: 'Nameserver records switched to Cloudflare edge DNS.',
  explanation: 'Zone delegation switched to high-availability anycast resolvers.',
  previousValue: 'ns1.oldhost.com, ns2.oldhost.com',
  currentValue: 'ns1.cloudflare.com, ns2.cloudflare.com',
  detectedAt: '2026-08-10T08:00:00Z', // > 7 days earlier
  evidenceCount: 3,
};

const mockForeignEvent: TimelineEventDto = {
  id: 'evt-foreign-001',
  domainId: mockForeignDomainId,
  domainName: 'otherdomain.org',
  snapshotId: 'snp-other-001',
  currentSnapshotId: 'snp-other-001',
  previousSnapshotId: null,
  changeType: 'HTTP_HEADER_MODIFIED',
  category: 'security_headers',
  severity: 'HIGH',
  title: 'HSTS header dropped',
  detectedAt: '2026-08-23T14:00:00Z',
};

describe('WX-1003: Changes Timeline Foundation', () => {
  describe('1. Structure & 5-Part Change Story Rendering', () => {
    it('structures change cards with the five-part WX-1001 story', () => {
      const story = resolveMeaningfulChangeStory(mockRecentTlsChangeEvent, mockDomainName);

      // 1. What changed?
      assert.equal(story.category, 'tls_ssl');
      assert.equal(story.categoryLabel, 'TLS / SSL');
      assert.equal(story.title, 'TLS Certificate renewed');

      // 2. When?
      assert.equal(story.detectedAt, '2026-08-23T12:00:10Z');
      assert.ok(story.detectedFormatted.length > 0);

      // 3. What was different?
      assert.equal(story.previousValue, 'Expires Oct 12, 2026 (Let\'s Encrypt)');
      assert.equal(story.currentValue, 'Expires Dec 22, 2026 (Let\'s Encrypt)');

      // 4. Why does it matter?
      assert.equal(
        story.significanceExplanation,
        'Certificate renewal maintains transport security and prevents browser connection warnings.'
      );

      // 5. How do we know?
      assert.equal(story.currentSnapshotId, 'snp-ding-102');
      assert.equal(story.previousSnapshotId, 'snp-ding-101');
      assert.equal(story.evidenceCount, 2);
    });

    it('groups changes into RECENT (<= 7 days) and EARLIER temporal groups', () => {
      const fixedNow = new Date('2026-08-23T18:00:00Z');
      const integration = integrateAuthoritativeChanges({
        domainId: mockDomainId,
        domainName: mockDomainName,
        snapshots: [mockSnapshotA2, mockSnapshotA1],
        timelineEvents: [mockRecentTlsChangeEvent, mockEarlierDnsChangeEvent],
        isLoading: false,
        isError: false,
        referenceTime: fixedNow,
      });

      assert.equal(integration.state, 'READY');
      assert.equal(integration.groups.recent.length, 1);
      assert.equal(integration.groups.recent[0].changeId, 'evt-tls-101');

      assert.equal(integration.groups.earlier.length, 1);
      assert.equal(integration.groups.earlier[0].changeId, 'evt-dns-102');
    });
  });

  describe('2. State Model Verification', () => {
    it('renders FIRST_UNDERSTANDING ("No changes yet.") without claiming "Everything is unchanged"', () => {
      const integration = integrateAuthoritativeChanges({
        domainId: mockDomainId,
        domainName: mockDomainName,
        snapshots: [mockSnapshotA1],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(integration.state, 'FIRST_UNDERSTANDING');
      assert.equal(integration.headline, 'No changes yet.');
      assert.equal(
        integration.explanation,
        'This is the baseline understanding for ding.com.'
      );
      assert.notEqual(integration.headline, 'Everything is unchanged.');
    });

    it('renders QUIET ("No meaningful changes detected.") when multiple snapshots have 0 diffs', () => {
      const integration = integrateAuthoritativeChanges({
        domainId: mockDomainId,
        domainName: mockDomainName,
        snapshots: [mockSnapshotA2, mockSnapshotA1],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(integration.state, 'QUIET');
      assert.equal(integration.headline, 'No meaningful changes detected.');
      assert.equal(
        integration.explanation,
        'Nebula\'s recent understandings remain consistent across observed infrastructure components.'
      );
    });

    it('retains trusted change state during UNDERSTANDING_IN_PROGRESS without partial diff corruption', () => {
      const fixedNow = new Date('2026-08-23T18:00:00Z');
      const integration = integrateAuthoritativeChanges({
        domainId: mockDomainId,
        domainName: mockDomainName,
        snapshots: [mockSnapshotA2, mockSnapshotA1],
        timelineEvents: [mockRecentTlsChangeEvent],
        isLoading: false,
        isError: false,
        isUnderstanding: true,
        referenceTime: fixedNow,
      });

      // Still retains the trusted changes list
      assert.equal(integration.changes.length, 1);
      assert.equal(integration.groups.recent.length, 1);
      assert.equal(integration.changes[0].changeId, 'evt-tls-101');
    });

    it('renders EMPTY state when domain has zero snapshots', () => {
      const integration = integrateAuthoritativeChanges({
        domainId: mockDomainId,
        domainName: mockDomainName,
        snapshots: [],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(integration.state, 'EMPTY');
      assert.equal(integration.headline, 'No infrastructure changes recorded.');
    });
  });

  describe('3. Domain Isolation & URL Context Preservation', () => {
    it('strictly isolates changes by active domain and excludes foreign events', () => {
      const integration = integrateAuthoritativeChanges({
        domainId: mockDomainId,
        domainName: mockDomainName,
        snapshots: [mockSnapshotA2, mockSnapshotA1],
        timelineEvents: [mockRecentTlsChangeEvent, mockForeignEvent],
        isLoading: false,
        isError: false,
      });

      assert.equal(integration.changes.length, 1);
      assert.equal(integration.changes[0].domainId, mockDomainId);
      assert.equal(integration.changes[0].changeId, 'evt-tls-101');
    });
  });

  describe('4. Truth Matrix & Certified Invariants Audit', () => {
    it('verifies WX-1003 capability is registered in Truth Matrix with PRODUCTION_READY status', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Changes Timeline Foundation'
      );
      assert.ok(cap, 'Changes Timeline Foundation must exist in Truth Matrix');
      assert.equal(cap?.category, 'Changes');
      assert.equal(cap?.status, 'PRODUCTION_READY');
    });

    it('verifies certified invariants for changes experience', () => {
      assert.ok('NO_INVENTED_CHANGES' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_FRONTEND_CHANGE_DETECTION' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_MEMORY_AS_CHANGES' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_ACTIVITY_FEED' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_FALSE_COMPARISON' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('STRICT_DOMAIN_ISOLATION' in WORKSPACE_CERTIFIED_INVARIANTS);
    });
  });
});
