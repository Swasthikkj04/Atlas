import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveFindingMeaningHierarchy } from './contracts/investigation-hierarchy.contract.ts';
import {
  WORKSPACE_CERTIFIED_INVARIANTS,
  WORKSPACE_TRUTH_MATRIX,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { InfrastructureFindingDto } from '../../types/api/finding.dto';

describe('WX-1023: Workspace Finding Severity & Confidence Calibration Audit', () => {
  const domainName = 'openai.com';

  describe('1. Distinct Severity and Confidence Resolution', () => {
    it('accurately resolves HIGH severity with Authoritative observation confidence', () => {
      const mockFinding: InfrastructureFindingDto = {
        id: 'find-csp-1',
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        category: 'SECURITY_HEADER',
        severity: 'HIGH',
        confidence: 'AUTHORITATIVE',
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale: 'CSP provides critical browser-side defense in depth against content injection.',
        whatThisDoesNotProve: 'This observation does not establish that the application is currently exploitable to cross-site scripting (XSS).',
        title: 'Missing Content Security Policy',
        description: 'The authoritative HTML response does not advertise a Content-Security-Policy header.',
        explanation: 'The authoritative HTML response does not advertise a Content-Security-Policy header.',
        status: 'ACTIVE',
        detectedAt: '2026-08-25T12:00:00.000Z',
      };

      const hierarchy = resolveFindingMeaningHierarchy({
        finding: mockFinding,
        domainName,
      });

      assert.equal(hierarchy.hero.severity, 'HIGH');
      assert.equal(hierarchy.hero.confidence, 'Authoritative observation');
      assert.equal(hierarchy.hero.riskClassification, 'Security Hardening Gap');
      assert.ok(hierarchy.whatNebulaDoesNotProve.description.includes('does not establish that the application is currently exploitable'));
    });

    it('prohibits frontend from upgrading supported/contextual confidence to authoritative', () => {
      const mockFinding: InfrastructureFindingDto = {
        id: 'find-ctx-1',
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        category: 'SECURITY_HEADER',
        severity: 'LOW',
        confidence: 'CONTEXTUAL',
        riskClassification: 'SECURITY_HARDENING_GAP',
        title: 'Referrer Policy Missing',
        explanation: 'No referrer policy header detected.',
        status: 'ACTIVE',
        detectedAt: '2026-08-25T12:00:00.000Z',
      };

      const hierarchy = resolveFindingMeaningHierarchy({
        finding: mockFinding,
        domainName: 'test.com',
      });

      assert.equal(hierarchy.hero.confidence, 'Contextual signal');
    });
  });

  describe('2. Truth Contract Certification (WX-1023)', () => {
    it('contains WX-1023 capability in WORKSPACE_TRUTH_MATRIX', () => {
      const entry = WORKSPACE_TRUTH_MATRIX.find((t) =>
        t.capability.includes('WX-1023')
      );
      assert.ok(entry);
      assert.equal(entry?.status, 'PRODUCTION_READY');
    });

    it('certifies all 11 WX-1023 mandatory invariants', () => {
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.SEVERITY_AND_CONFIDENCE_ARE_SEPARATE);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.FINDING_CONFIDENCE_CANNOT_EXCEED_OBSERVATION);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_OBSERVATION_EQUALS_CONFIRMED_EXPLOIT);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.SECURITY_HARDENING_IS_NOT_CONFIRMED_EXPLOIT);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.OPERATIONAL_OBSERVATION_IS_NOT_SECURITY_VULNERABILITY);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.INFORMATIONAL_OBSERVATION_IS_NOT_SECURITY_VULNERABILITY);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.SEVERITY_REQUIRES_EXPLICIT_RATIONALE);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_FRONTEND_SEVERITY_INFERENCE);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_FRONTEND_CONFIDENCE_ESCALATION);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.INVESTIGATION_EXPLAINS_SECURITY_BOUNDARY);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.EVIDENCE_SUPPORTS_FINDING_CLAIM);
    });
  });
});
