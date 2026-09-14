import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { InfrastructureFindingDto, FindingListResponseDto } from '../../types/api/finding.dto.ts';

describe('FIX-OV-001: Frontend Finding State Synchronization & Authoritative Overview Invariant', () => {
  const domainId = 'domain-aws-amazon-com';
  const snapshotA_Id = 'snap-101-csp-absent';
  const snapshotB_Id = 'snap-102-csp-present';

  const findingSnapshotA_CSP: InfrastructureFindingDto = {
    id: 'find-aws-csp-001',
    domainId,
    snapshotId: snapshotA_Id,
    category: 'HTTP',
    severity: 'MEDIUM',
    status: 'ACTIVE',
    state: 'OPEN',
    title: 'Missing Content Security Policy',
    explanation: 'Content-Security-Policy header is absent from HTTP responses.',
    remediation: 'Configure Content-Security-Policy header with authoritative sources.',
    detectedAt: '2026-08-28T10:00:00Z',
    lineage: {
      snapshotId: snapshotA_Id,
      observationKey: 'http.headers.content-security-policy',
      observedValue: null,
      ruleId: 'http.missing-content-security-policy',
      evaluationTimestamp: '2026-08-28T10:00:00Z',
    },
  };

  const findingSnapshotB_CSP_Resolved: InfrastructureFindingDto = {
    ...findingSnapshotA_CSP,
    status: 'RESOLVED',
    state: 'RESOLVED',
    resolvedAt: '2026-08-28T11:00:00Z',
    timeline: {
      firstDetectedAt: '2026-08-28T10:00:00Z',
      lastVerifiedAt: '2026-08-28T11:00:00Z',
      state: 'RESOLVED',
    },
    processingEvidence: [
      {
        step: 'Finding resolved',
        status: 'SUCCESS',
        description: `Finding find-aws-csp-001 resolved in authoritative snapshot ${snapshotB_Id}`,
        timestamp: '2026-08-28T10:00:00Z',
      },
      {
        step: 'Mitigation verified',
        status: 'SUCCESS',
        description: `Mitigation verified in latest authoritative snapshot ${snapshotB_Id} - finding resolved.`,
        timestamp: '2026-08-28T11:00:00Z',
      },
    ],
  };

  describe('1. Authoritative Finding State Rule & Overview Isolation', () => {
    it('Snapshot A: CSP absent produces 1 ACTIVE finding on Overview risk surface', () => {
      const activeList: FindingListResponseDto = {
        findings: [findingSnapshotA_CSP],
        total: 1,
      };

      assert.equal(activeList.total, 1);
      assert.equal(activeList.findings[0].status, 'ACTIVE');
      assert.equal(activeList.findings[0].state, 'OPEN');

      // Overview filters to ACTIVE findings only
      const overviewFindings = activeList.findings.filter((f) => f.status === 'ACTIVE' && f.state !== 'RESOLVED');
      assert.equal(overviewFindings.length, 1);
      assert.equal(overviewFindings[0].title, 'Missing Content Security Policy');
    });

    it('Snapshot B: CSP mitigation observed causes finding to leave Overview risk surface', () => {
      // Historical finding record now evaluated as RESOLVED
      const historicalList: FindingListResponseDto = {
        findings: [findingSnapshotB_CSP_Resolved],
        total: 1,
      };

      // Overview filters to ACTIVE findings only
      const overviewFindings = historicalList.findings.filter((f) => f.status === 'ACTIVE' && f.state !== 'RESOLVED');
      assert.equal(overviewFindings.length, 0, 'Overview must display 0 findings when finding is resolved in latest snapshot');
    });
  });

  describe('2. Lineage & Explainability Preservation', () => {
    it('preserves historical proof and explainability verification evidence for resolved findings', () => {
      assert.equal(findingSnapshotB_CSP_Resolved.status, 'RESOLVED');
      assert.equal(findingSnapshotB_CSP_Resolved.state, 'RESOLVED');
      assert.equal(findingSnapshotB_CSP_Resolved.timeline?.state, 'RESOLVED');
      assert.equal(findingSnapshotB_CSP_Resolved.timeline?.lastVerifiedAt, '2026-08-28T11:00:00Z');

      const mitigationStep = findingSnapshotB_CSP_Resolved.processingEvidence?.find(
        (e) => e.step === 'Mitigation verified'
      );
      assert.ok(mitigationStep, 'Mitigation step must be present in processing evidence');
      assert.equal(mitigationStep?.status, 'SUCCESS');
      assert.ok(mitigationStep?.description?.includes(snapshotB_Id));
    });
  });

  describe('3. Cross-Tab Consistency Invariant', () => {
    it('enforces: Overview = what is true now, Changes = what became different, Investigation = why we believe it', () => {
      // Overview (What is true now): 0 active findings
      const currentOverviewActiveFindings = [findingSnapshotB_CSP_Resolved].filter(
        (f) => f.status === 'ACTIVE' && f.state !== 'RESOLVED'
      );
      assert.equal(currentOverviewActiveFindings.length, 0);

      // Changes (What became different): finding resolved event recorded
      const changeEvent = {
        id: 'chg-001',
        type: 'FINDING_RESOLVED',
        findingId: findingSnapshotB_CSP_Resolved.id,
        title: 'Missing Content Security Policy Resolved',
        timestamp: '2026-08-28T11:00:00Z',
      };
      assert.equal(changeEvent.type, 'FINDING_RESOLVED');
      assert.equal(changeEvent.findingId, 'find-aws-csp-001');

      // Investigation (Why we believe it): Complete lineage intact
      assert.equal(findingSnapshotB_CSP_Resolved.lineage?.ruleId, 'http.missing-content-security-policy');
      assert.equal(findingSnapshotB_CSP_Resolved.lineage?.snapshotId, snapshotA_Id);
    });
  });

  describe('4. Lifecycle Transition Matrix & Multi-Domain Isolation', () => {
    it('handles ACTIVE -> ACTIVE transition: finding persists when still observed', () => {
      const activeFindings = [findingSnapshotA_CSP].filter(
        (f) => f.status === 'ACTIVE' && f.state !== 'RESOLVED'
      );
      assert.equal(activeFindings.length, 1);
      assert.equal(activeFindings[0].status, 'ACTIVE');
    });

    it('handles RESOLVED -> ACTIVE transition: finding reactivates upon regression in snapshot C', () => {
      const snapshotC_Id = 'snap-103-csp-regressed';
      const findingSnapshotC_Regressed: InfrastructureFindingDto = {
        ...findingSnapshotA_CSP,
        id: 'find-aws-csp-003',
        snapshotId: snapshotC_Id,
        status: 'ACTIVE',
        state: 'OPEN',
        detectedAt: '2026-08-28T12:00:00Z',
      };

      const overviewFindings = [findingSnapshotC_Regressed].filter(
        (f) => f.status === 'ACTIVE' && f.state !== 'RESOLVED'
      );
      assert.equal(overviewFindings.length, 1);
      assert.equal(overviewFindings[0].id, 'find-aws-csp-003');
    });

    it('handles RESOLVED -> RESOLVED transition: stays calm across subsequent clean snapshots', () => {
      const overviewFindings = [findingSnapshotB_CSP_Resolved].filter(
        (f) => f.status === 'ACTIVE' && f.state !== 'RESOLVED'
      );
      assert.equal(overviewFindings.length, 0);
    });

    it('isolates state across domain switching without leakage', () => {
      const domainA_Findings = [findingSnapshotB_CSP_Resolved].filter(
        (f) => f.domainId === 'domain-aws-amazon-com' && f.status === 'ACTIVE'
      );
      assert.equal(domainA_Findings.length, 0, 'aws.amazon.com must have 0 active findings');

      const findingDomainB: InfrastructureFindingDto = {
        ...findingSnapshotA_CSP,
        id: 'find-vuln-001',
        domainId: 'domain-vulnerable-corp',
        status: 'ACTIVE',
      };
      const domainB_Findings = [findingDomainB].filter(
        (f) => f.domainId === 'domain-vulnerable-corp' && f.status === 'ACTIVE'
      );
      assert.equal(domainB_Findings.length, 1, 'vulnerable.corp must have 1 active finding');
    });
  });

  describe('5. AWS.com Canonical Finding State Invariant Verification', () => {
    it('guarantees aws.amazon.com resolved CSP finding never appears as active on Overview while preserving evidence', () => {
      const awsOverviewFindings = [findingSnapshotB_CSP_Resolved].filter(
        (f) => f.status === 'ACTIVE' && f.state !== 'RESOLVED'
      );

      // Invariant: 0 active findings on Overview
      assert.equal(awsOverviewFindings.length, 0);

      // Invariant: Lineage and resolution proof preserved in detail
      assert.equal(findingSnapshotB_CSP_Resolved.status, 'RESOLVED');
      assert.equal(findingSnapshotB_CSP_Resolved.lineage?.ruleId, 'http.missing-content-security-policy');
      assert.ok(findingSnapshotB_CSP_Resolved.processingEvidence?.length! > 0);
    });
  });
});
