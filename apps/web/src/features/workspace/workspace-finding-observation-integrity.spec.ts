import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateFindingSnapshotAffinity,
  validateInvestigationEvidence,
} from './contracts/observation-truth.contract.ts';
import {
  resolveFindingMeaningHierarchy,
  resolveChangeMeaningHierarchy,
} from './contracts/investigation-hierarchy.contract.ts';
import type { InfrastructureFindingDto, TimelineEventDto } from '../../types/api';

describe('WX-1020: Workspace Finding & Observation Integrity Integration Audit', () => {
  const domainId = 'dom-amazon-001';
  const domainName = 'amazon.com';

  const snapshotA = 'snp-alpha-001';
  const snapshotB = 'snp-bravo-002';

  const findingsSnapshotA: readonly InfrastructureFindingDto[] = [
    {
      id: 'fnd-spf-snap-a',
      domainId,
      snapshotId: snapshotA,
      domainName,
      category: 'DNS',
      severity: 'HIGH',
      status: 'ACTIVE',
      title: 'SPF Record Not Found',
      description: 'amazon.com does not publish an SPF record.',
      explanation: 'No SPF record was observed in snapshot A.',
      detectedAt: '2026-08-25T16:00:00.000Z',
      lineage: {
        snapshotId: snapshotA,
        observationKey: 'dns_record',
        observedValue: 'SPF Record Not Found',
        ruleId: 'dns.missing-spf',
      },
    },
  ];

  const findingsSnapshotB: readonly InfrastructureFindingDto[] = [
    {
      id: 'fnd-hsts-snap-b',
      domainId,
      snapshotId: snapshotB,
      domainName,
      category: 'HTTP',
      severity: 'HIGH',
      status: 'ACTIVE',
      title: 'Missing HSTS Header',
      description: 'Strict-Transport-Security header is absent.',
      explanation: 'HTTPS response did not include HSTS header.',
      detectedAt: '2026-08-25T17:45:00.000Z',
      lineage: {
        snapshotId: snapshotB,
        observationKey: 'strict-transport-security',
        observedValue: 'Missing',
        ruleId: 'http.missing-hsts',
      },
    },
  ];

  describe('1. Global Snapshot Convergence (Snapshot A -> Snapshot B)', () => {
    it('accurately attaches Snapshot A findings when Snapshot A is current', () => {
      const auditA = validateFindingSnapshotAffinity({
        finding: findingsSnapshotA[0],
        expectedDomainId: domainId,
        currentSnapshotId: snapshotA,
      });

      assert.equal(auditA.isValid, true);
      assert.equal(auditA.snapshotId, snapshotA);
    });

    it('rejects Snapshot A findings as current once Snapshot B is committed', () => {
      const auditAonB = validateFindingSnapshotAffinity({
        finding: findingsSnapshotA[0],
        expectedDomainId: domainId,
        currentSnapshotId: snapshotB,
        allowHistorical: false,
      });

      assert.equal(auditAonB.isValid, false);
      assert.equal(auditAonB.status, 'STALE_SNAPSHOT');
    });

    it('accepts Snapshot B findings as current on Workspace transition', () => {
      const auditB = validateFindingSnapshotAffinity({
        finding: findingsSnapshotB[0],
        expectedDomainId: domainId,
        currentSnapshotId: snapshotB,
      });

      assert.equal(auditB.isValid, true);
      assert.equal(auditB.snapshotId, snapshotB);
    });

    it('allows historical findings strictly when explicitly permitted for Memory surface', () => {
      const memoryAudit = validateFindingSnapshotAffinity({
        finding: findingsSnapshotA[0],
        expectedDomainId: domainId,
        currentSnapshotId: snapshotB,
        allowHistorical: true,
      });

      assert.equal(memoryAudit.isValid, true);
      assert.equal(memoryAudit.snapshotId, snapshotA);
    });
  });

  describe('2. Investigation Lineage Preservation on Converged State', () => {
    it('finding investigation resolves meaning hierarchy matching exact current snapshot', () => {
      const hierarchy = resolveFindingMeaningHierarchy({
        finding: findingsSnapshotB[0],
        domainName,
      });

      assert.equal(hierarchy.hero.title, 'Missing HSTS Header');
      assert.equal(hierarchy.verifiedContext.snapshotId, snapshotB);
      assert.equal(hierarchy.observedEvidence.observationKey, 'strict-transport-security');
      assert.equal(hierarchy.observedEvidence.ruleId, 'http.missing-hsts');
    });

    it('change investigation reflects verified transition between snapshot A and B', () => {
      const changeEvent: TimelineEventDto = {
        id: 'chg-spf-resolved-01',
        domainId,
        snapshotId: snapshotB,
        previousSnapshotId: snapshotA,
        changeType: 'DNS_RECORD_ADDED',
        severity: 'INFORMATIONAL',
        title: 'SPF Record Configured',
        description: 'An authoritative SPF record was added.',
        previousValue: null,
        currentValue: 'v=spf1 include:_spf.amazon.com ~all',
        detectedAt: '2026-08-25T17:45:00.000Z',
      };

      const changeHierarchy = resolveChangeMeaningHierarchy({
        change: changeEvent,
        domainName,
      });

      assert.equal(changeHierarchy.hero.title, 'SPF Record Configured');
      assert.equal(changeHierarchy.observedEvidence.previousSnapshotId, snapshotA);
      assert.equal(changeHierarchy.observedEvidence.currentSnapshotId, snapshotB);
      assert.equal(
        changeHierarchy.observedEvidence.currentValue,
        'v=spf1 include:_spf.amazon.com ~all'
      );
    });
  });

  describe('3. Investigation Proof & Fabrication Defense', () => {
    it('validates that investigation evidence links directly to verified snapshot', () => {
      const traceability = validateInvestigationEvidence({
        finding: findingsSnapshotB[0],
        observations: [
          {
            key: 'strict-transport-security',
            state: 'MISSING',
            observedAt: '2026-08-25T17:45:00.000Z',
            evidenceRef: 'ev-hsts-001',
          },
        ],
        evidence: [
          {
            evidenceId: 'ev-hsts-001',
            collector: 'http-collector',
            collectionTime: '2026-08-25T17:45:00.000Z',
            category: 'HTTP_RESPONSE',
            integrityStatus: 'VERIFIED',
            rawUrl: '/api/v1/evidence/ev-hsts-001',
          },
        ],
      });

      assert.equal(traceability.isTraceable, true);
      assert.equal(traceability.hasRawEvidence, true);
    });
  });
});
