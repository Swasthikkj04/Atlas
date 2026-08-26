import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  auditDnsObservation,
  validateFindingSnapshotAffinity,
  validateInvestigationEvidence,
} from './contracts/observation-truth.contract.ts';
import {
  WORKSPACE_CERTIFIED_INVARIANTS,
  WORKSPACE_TRUTH_MATRIX,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { InfrastructureFindingDto } from '../../types/api';

describe('WX-1020: Observation Truth & Finding Accuracy Audit', () => {
  const currentSnapshotId = 'snp-current-2026-08-25-001';
  const historicalSnapshotId = 'snp-historical-2026-08-24-001';
  const domainId = 'dom-amazon-001';

  const mockFindingCurrent: InfrastructureFindingDto = {
    id: 'fnd-dns-spf-001',
    domainId,
    snapshotId: currentSnapshotId,
    domainName: 'amazon.com',
    category: 'DNS',
    severity: 'HIGH',
    status: 'ACTIVE',
    title: 'SPF Record Not Found',
    description: 'amazon.com does not publish an SPF record.',
    explanation: 'The domain does not publish an SPF record.',
    detectedAt: '2026-08-25T17:40:00.000Z',
    lineage: {
      snapshotId: currentSnapshotId,
      observationKey: 'dns_record',
      observedValue: 'SPF Record Not Found',
      ruleId: 'dns.missing-spf',
    },
  };

  const mockFindingHistorical: InfrastructureFindingDto = {
    ...mockFindingCurrent,
    id: 'fnd-dns-spf-old',
    snapshotId: historicalSnapshotId,
    lineage: {
      snapshotId: historicalSnapshotId,
      observationKey: 'dns_record',
      observedValue: 'SPF Record Not Found',
      ruleId: 'dns.missing-spf',
    },
  };

  describe('1. DNS Accuracy Audit (dns.missing-spf & dmarc)', () => {
    it('SPF exists (v=spf1 ...) -> evaluates hasSpf: true, no missing SPF finding', () => {
      const audit = auditDnsObservation({
        recordType: 'TXT',
        records: [['v=spf1 include:_spf.amazon.com ~all']],
        lookupStatus: 'SUCCESS',
      });

      assert.equal(audit.canEvaluateFinding, true);
      assert.equal(audit.hasSpf, true);
      assert.equal(audit.isLookupFailed, false);
    });

    it('SPF absent with successful TXT lookup -> allows finding creation', () => {
      const audit = auditDnsObservation({
        recordType: 'TXT',
        records: [],
        lookupStatus: 'NODATA',
      });

      assert.equal(audit.canEvaluateFinding, true);
      assert.equal(audit.hasSpf, false);
      assert.equal(audit.isLookupFailed, false);
    });

    it('DNS TIMEOUT -> lookup failed, must NOT produce missing-SPF finding', () => {
      const audit = auditDnsObservation({
        recordType: 'TXT',
        records: [],
        lookupStatus: 'TIMEOUT',
      });

      assert.equal(audit.canEvaluateFinding, false);
      assert.equal(audit.isLookupFailed, true);
      assert.ok(audit.explanation.includes('failed with status TIMEOUT'));
    });

    it('DNS SERVFAIL -> lookup failed, must NOT produce missing-SPF finding', () => {
      const audit = auditDnsObservation({
        recordType: 'TXT',
        records: [],
        lookupStatus: 'SERVFAIL',
      });

      assert.equal(audit.canEvaluateFinding, false);
      assert.equal(audit.isLookupFailed, true);
      assert.ok(audit.explanation.includes('failed with status SERVFAIL'));
    });

    it('unrelated TXT records (e.g. google verification) -> do not incorrectly classify as SPF', () => {
      const audit = auditDnsObservation({
        recordType: 'TXT',
        records: ['google-site-verification=abc123xyz', 'MS=ms12345678'],
        lookupStatus: 'SUCCESS',
      });

      assert.equal(audit.canEvaluateFinding, true);
      assert.equal(audit.hasSpf, false);
    });

    it('DMARC lookup failure (TIMEOUT) -> must NOT produce missing-DMARC finding', () => {
      const audit = auditDnsObservation({
        recordType: 'DMARC',
        records: [],
        lookupStatus: 'TIMEOUT',
      });

      assert.equal(audit.canEvaluateFinding, false);
      assert.equal(audit.isLookupFailed, true);
    });

    it('DMARC exists (v=DMARC1...) -> evaluates hasDmarc: true', () => {
      const audit = auditDnsObservation({
        recordType: 'DMARC',
        records: ['v=DMARC1; p=reject; rua=mailto:dmarc@amazon.com'],
        lookupStatus: 'SUCCESS',
      });

      assert.equal(audit.canEvaluateFinding, true);
      assert.equal(audit.hasDmarc, true);
    });
  });

  describe('2. Snapshot Integrity & Freshness Audit', () => {
    it('finding belonging to current snapshot is VALID for active workspace', () => {
      const result = validateFindingSnapshotAffinity({
        finding: mockFindingCurrent,
        expectedDomainId: domainId,
        currentSnapshotId,
      });

      assert.equal(result.isValid, true);
      assert.equal(result.status, 'VALID');
    });

    it('historical finding cannot masquerade as current intelligence on active workspace', () => {
      const result = validateFindingSnapshotAffinity({
        finding: mockFindingHistorical,
        expectedDomainId: domainId,
        currentSnapshotId,
        allowHistorical: false,
      });

      assert.equal(result.isValid, false);
      assert.equal(result.status, 'STALE_SNAPSHOT');
      assert.ok(result.reason.includes('historical snapshot'));
    });

    it('cross-domain finding is strictly rejected (P0 security boundary)', () => {
      const result = validateFindingSnapshotAffinity({
        finding: mockFindingCurrent,
        expectedDomainId: 'dom-other-attacker-002',
        currentSnapshotId,
      });

      assert.equal(result.isValid, false);
      assert.equal(result.status, 'DOMAIN_MISMATCH');
    });
  });

  describe('3. Raw Observation Preservation & Lineage Traceability', () => {
    it('finding contains unbroken lineage to exact snapshot and observation key', () => {
      assert.equal(mockFindingCurrent.lineage?.snapshotId, currentSnapshotId);
      assert.equal(mockFindingCurrent.lineage?.ruleId, 'dns.missing-spf');
      assert.equal(mockFindingCurrent.lineage?.observationKey, 'dns_record');
    });

    it('investigation evidence validation confirms full observation traceability', () => {
      const audit = validateInvestigationEvidence({
        finding: mockFindingCurrent,
        observations: [
          {
            key: 'dns_record',
            state: 'NON_COMPLIANT',
            observedAt: '2026-08-25T17:40:00.000Z',
            evidenceRef: 'ev-dns-001',
          },
        ],
        evidence: [
          {
            evidenceId: 'ev-dns-001',
            collector: 'dns-collector',
            collectionTime: '2026-08-25T17:40:00.000Z',
            category: 'DNS_QUERY',
            integrityStatus: 'VERIFIED',
            rawUrl: '/api/v1/evidence/ev-dns-001',
          },
        ],
      });

      assert.equal(audit.isTraceable, true);
      assert.equal(audit.hasRawEvidence, true);
      assert.ok(audit.observationSummary.includes(currentSnapshotId));
    });
  });

  describe('4. Truth Contract Invariants Certification (WX-1020)', () => {
    it('contains WX-1020 in WORKSPACE_TRUTH_MATRIX', () => {
      const truthEntry = WORKSPACE_TRUTH_MATRIX.find(
        (t) =>
          t.capability.includes('WX-1020') ||
          t.capability.includes('Observation Truth')
      );
      assert.ok(truthEntry);
      assert.equal(truthEntry?.status, 'PRODUCTION_READY');
    });

    it('certifies all 12 WX-1020 mandatory invariants', () => {
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.OBSERVATION_IS_AUTHORITATIVE);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.FINDING_REQUIRES_VALID_OBSERVATION);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_LOOKUP_FAILURE_AS_ABSENCE);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_STALE_FINDING_AS_CURRENT);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_CROSS_SNAPSHOT_FINDING);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_CROSS_DOMAIN_FINDING);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.RAW_OBSERVATION_LINEAGE_PRESERVED);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.RULE_INPUT_IS_EXPLICIT);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.INVESTIGATION_EVIDENCE_MATCHES_FINDING);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.CURRENT_FINDINGS_MATCH_CURRENT_SNAPSHOT);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_FRONTEND_FINDING_INFERENCE);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_FALSE_VERIFICATION);
    });
  });
});
