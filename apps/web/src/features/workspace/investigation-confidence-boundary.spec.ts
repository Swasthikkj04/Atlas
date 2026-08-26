import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveFindingMeaningHierarchy } from './contracts/investigation-hierarchy.contract.ts';
import type { InfrastructureFindingDto } from '../../types/api/finding.dto';

describe('WX-1023: Investigation Security Boundary and Anti-Overclaiming Audit', () => {
  const domainName = 'google.com';

  describe('1. 4-Layer Investigation Hierarchy Sequence', () => {
    it('answers the four essential questions in exact canonical sequence', () => {
      const mockFinding: InfrastructureFindingDto = {
        id: 'find-hsts-1',
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        category: 'SECURITY_HEADER',
        severity: 'HIGH',
        confidence: 'AUTHORITATIVE',
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale: 'HSTS ensures user agents only interact over authenticated TLS channels.',
        whatThisDoesNotProve: 'This observation does not establish that network traffic is currently being intercepted or downgraded.',
        title: 'Missing HSTS Header',
        description: 'The authoritative HTTPS endpoint does not send Strict-Transport-Security.',
        explanation: 'The authoritative HTTPS endpoint does not advertise the Strict-Transport-Security header.',
        remediation: 'Configure Strict-Transport-Security with max-age=31536000.',
        status: 'ACTIVE',
        detectedAt: '2026-08-25T12:00:00.000Z',
      };

      const hierarchy = resolveFindingMeaningHierarchy({
        finding: mockFinding,
        domainName,
      });

      // 1. What Happened?
      assert.ok(hierarchy.whatHappened.explanation);
      assert.equal(
        hierarchy.whatHappened.explanation,
        'The authoritative HTTPS endpoint does not advertise the Strict-Transport-Security header.'
      );

      // 2. Why Does It Matter?
      assert.ok(hierarchy.whyItMatters.significance);
      assert.equal(hierarchy.whyItMatters.impactLevel, 'HIGH');
      assert.ok(hierarchy.whyItMatters.severityRationale?.includes('HSTS ensures user agents only interact'));

      // 3. What Does Nebula Actually Know?
      assert.equal(hierarchy.whatThisMeans.domain, 'google.com');
      assert.equal(hierarchy.whatThisMeans.observedState, 'Not published');

      // 4. What Does Nebula NOT Prove / Anti-Overclaiming Boundary
      assert.equal(hierarchy.whatNebulaDoesNotProve.title, 'What this does not establish');
      assert.ok(
        hierarchy.whatNebulaDoesNotProve.description.includes(
          'does not establish that network traffic is currently being intercepted'
        )
      );
    });
  });

  describe('2. Operational vs Hardening Boundaries', () => {
    it('provides operational boundary for performance findings', () => {
      const mockFinding: InfrastructureFindingDto = {
        id: 'find-perf-1',
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        category: 'PERFORMANCE',
        severity: 'LOW',
        confidence: 'AUTHORITATIVE',
        riskClassification: 'OPERATIONAL_OBSERVATION',
        title: 'Slow HTTP Response',
        description: 'Endpoint took 2500ms to respond.',
        explanation: 'Endpoint took 2500ms to respond, exceeding benchmark threshold.',
        status: 'ACTIVE',
        detectedAt: '2026-08-25T12:00:00.000Z',
      };

      const hierarchy = resolveFindingMeaningHierarchy({
        finding: mockFinding,
        domainName,
      });

      assert.equal(hierarchy.hero.riskClassification, 'Operational Observation');
      assert.ok(
        hierarchy.whatNebulaDoesNotProve.description.includes(
          'does not represent a security vulnerability'
        )
      );
    });
  });
});
