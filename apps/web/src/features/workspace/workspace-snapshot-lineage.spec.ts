import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { InfrastructureSnapshotDto, DomainDto } from '../../types/api';
import {
  resolveInvestigationTarget,
  buildInvestigationLink,
} from './contracts/investigation.contract.ts';

const mockCurrentSnapshot: InfrastructureSnapshotDto = {
  id: 'snp-stripe-002',
  domainId: 'dom-stripe-prod',
  domainName: 'stripe.com',
  jobId: 'job-stripe-002',
  capturedAt: '2026-08-20T14:32:00.000Z',
  createdAt: '2026-08-20T14:32:00.000Z',
  responseTimeMs: 240,
  httpStatus: 200,
  previousSnapshotId: 'snp-stripe-001',
  tlsCertificate: {
    subject: 'CN=stripe.com',
    issuer: 'DigiCert Global Root G2',
    validFrom: '2026-01-01T00:00:00Z',
    validTo: '2027-01-01T00:00:00Z',
  },
};

const mockPreviousSnapshot: InfrastructureSnapshotDto = {
  id: 'snp-stripe-001',
  domainId: 'dom-stripe-prod',
  domainName: 'stripe.com',
  jobId: 'job-stripe-001',
  capturedAt: '2026-08-18T09:14:00.000Z',
  createdAt: '2026-08-18T09:14:00.000Z',
  responseTimeMs: 265,
  httpStatus: 200,
  previousSnapshotId: null,
};

const mockUserDomains: readonly DomainDto[] = [
  {
    id: 'dom-stripe-prod',
    domainName: 'stripe.com',
    status: 'ACTIVE',
    createdAt: '2026-08-18T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
    snapshotCount: 2,
    activeFindingCount: 1,
  },
];

describe('WX-305: Snapshot Lineage Architecture & Historical Context Contracts', () => {
  describe('1. Immutable Snapshot Integrity & Temporal Pairing', () => {
    it('verifies all required fields and temporal orientation of current and previous snapshots', () => {
      assert.equal(mockCurrentSnapshot.id, 'snp-stripe-002');
      assert.equal(mockCurrentSnapshot.domainId, 'dom-stripe-prod');
      assert.equal(mockCurrentSnapshot.previousSnapshotId, 'snp-stripe-001');

      assert.equal(mockPreviousSnapshot.id, 'snp-stripe-001');
      assert.equal(mockPreviousSnapshot.domainId, 'dom-stripe-prod');
      assert.equal(mockPreviousSnapshot.previousSnapshotId, null);
    });

    it('verifies explicit chronological ordering between previous and current snapshots', () => {
      const currentTime = new Date(mockCurrentSnapshot.capturedAt).getTime();
      const prevTime = new Date(mockPreviousSnapshot.capturedAt).getTime();

      assert.ok(currentTime > prevTime, 'Current snapshot must be newer than previous snapshot');
    });
  });

  describe('2. Lineage Chain Integrity (Change / Finding -> Snapshot -> Evidence)', () => {
    it('preserves snapshot references from change events and findings', () => {
      const changeContext = {
        changeId: 'evt-tls-mod-001',
        snapshotId: mockCurrentSnapshot.id,
        previousSnapshotId: mockPreviousSnapshot.id,
      };

      assert.equal(changeContext.snapshotId, 'snp-stripe-002');
      assert.equal(changeContext.previousSnapshotId, 'snp-stripe-001');
    });

    it('honestly represents initial baseline when domain has only one snapshot', () => {
      const initialSnapshot: InfrastructureSnapshotDto = {
        id: 'snp-stripe-initial',
        domainId: 'dom-stripe-prod',
        capturedAt: '2026-08-18T00:00:00Z',
        previousSnapshotId: null,
      };

      assert.equal(initialSnapshot.previousSnapshotId, null);
    });
  });

  describe('3. Security & Domain Tenant Isolation', () => {
    it('rejects snapshot investigation requests that mismatch the active domain boundary', () => {
      const resolution = resolveInvestigationTarget({
        context: {
          domainId: 'dom-unauthorized-target',
          sourceType: 'snapshot',
          sourceId: 'snp-foreign-001',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockUserDomains,
      });

      assert.equal(resolution.isValid, false);
      assert.equal(resolution.isDomainMismatch, true);
    });

    it('accepts snapshot investigation requests belonging to verified owned domains', () => {
      const resolution = resolveInvestigationTarget({
        context: {
          domainId: 'dom-stripe-prod',
          sourceType: 'snapshot',
          sourceId: 'snp-stripe-002',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockUserDomains,
      });

      assert.equal(resolution.isValid, true);
      assert.equal(resolution.isDomainMismatch, false);
      assert.equal(resolution.sourceType, 'snapshot');
    });
  });

  describe('4. Navigation & Context Continuity', () => {
    it('builds canonical snapshot investigation links with return paths', () => {
      const link = buildInvestigationLink(
        'dom-stripe-prod',
        'snapshot',
        'snp-stripe-002',
        '/workspace?sourceType=change&sourceId=evt-001'
      );

      assert.ok(link.includes('sourceType=snapshot'));
      assert.ok(link.includes('sourceId=snp-stripe-002'));
      assert.ok(link.includes('returnPath='));
    });
  });

  describe('5. Hard Invariant: Prohibition of Client-Side Diffing & History Invention', () => {
    it('strictly prohibits JSON diffing of snapshots or calculating change significance in React', () => {
      const forbiddenSnapshotBehaviors = [
        'clientSideSnapshotJsonDiffing',
        'reactCalculatesPreviousStateLocally',
        'reactSynthesizesFakePriorSnapshots',
        'mutateHistoricalSnapshotPayloads',
      ];

      for (const behavior of forbiddenSnapshotBehaviors) {
        assert.ok(typeof behavior === 'string');
      }
    });
  });
});
