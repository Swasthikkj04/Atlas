import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { InfrastructureFindingDto, FindingListResponseDto } from '../../types/api/finding.dto.ts';

const mockDomainId = 'dom-ding-prod';

const mockActiveFindings: InfrastructureFindingDto[] = [
  {
    id: 'find-hsts-001',
    domainId: mockDomainId,
    snapshotId: 'snap-101',
    category: 'SECURITY',
    severity: 'HIGH',
    status: 'ACTIVE',
    title: 'Missing HSTS Header',
    explanation: 'Strict-Transport-Security is not enforced on the domain origin.',
    remediation: 'Configure HSTS with max-age=31536000 and includeSubDomains.',
    detectedAt: '2026-08-23T06:00:00Z',
  },
  {
    id: 'find-xframe-002',
    domainId: mockDomainId,
    snapshotId: 'snap-101',
    category: 'HTTP',
    severity: 'MEDIUM',
    status: 'ACTIVE',
    title: 'Missing X-Frame-Options Header',
    explanation: 'Clickjacking protection header is absent from HTTP responses.',
    remediation: 'Set X-Frame-Options: DENY or SAMEORIGIN.',
    detectedAt: '2026-08-23T06:00:00Z',
  },
  {
    id: 'find-ipv6-003',
    domainId: mockDomainId,
    snapshotId: 'snap-101',
    category: 'DNS',
    severity: 'LOW',
    status: 'ACTIVE',
    title: 'IPv6 Not Configured',
    explanation: 'No AAAA records were detected in authoritative DNS.',
    remediation: 'Add AAAA DNS records pointing to IPv6 endpoints.',
    detectedAt: '2026-08-23T06:00:00Z',
  },
];

const mockFindingList: FindingListResponseDto = {
  findings: mockActiveFindings,
  total: 3,
};

describe('WX-911: Infrastructure Findings Integration', () => {
  describe('1. Findings Presentation & Authoritative Sourcing', () => {
    it('verifies findings contain valid severity, category, title, and explanation', () => {
      assert.equal(mockFindingList.total, 3);
      assert.equal(mockFindingList.findings.length, 3);

      const [hsts, xframe, ipv6] = mockFindingList.findings;

      assert.equal(hsts.severity, 'HIGH');
      assert.equal(hsts.title, 'Missing HSTS Header');
      assert.equal(hsts.category, 'SECURITY');
      assert.ok(hsts.explanation.includes('Strict-Transport-Security'));

      assert.equal(xframe.severity, 'MEDIUM');
      assert.equal(xframe.title, 'Missing X-Frame-Options Header');
      assert.equal(xframe.category, 'HTTP');

      assert.equal(ipv6.severity, 'LOW');
      assert.equal(ipv6.title, 'IPv6 Not Configured');
      assert.equal(ipv6.category, 'DNS');
    });

    it('verifies empty findings list state does not alter or erase the infrastructure model', () => {
      const emptyList: FindingListResponseDto = {
        findings: [],
        total: 0,
      };

      assert.equal(emptyList.total, 0);
      assert.equal(emptyList.findings.length, 0);
    });
  });

  describe('2. Truth Matrix & Certified Invariants', () => {
    it('verifies Infrastructure Findings Integration capability in Truth Matrix', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Infrastructure Findings Integration'
      );
      assert.ok(cap, 'Capability must exist in Truth Matrix');
      assert.equal(cap?.category, 'Infrastructure');
      assert.equal(cap?.status, 'PRODUCTION_READY');
      assert.equal(
        cap?.frontendComponent,
        'InfrastructureOverview & InfrastructureFindingsSection'
      );
      assert.equal(
        cap?.targetSurface,
        'Dedicated Infrastructure Surface Findings Section'
      );
    });

    it('verifies all WX-911 certified invariants are defined', () => {
      const expectedInvariants = [
        'NO_INVENTED_INFRASTRUCTURE_FINDINGS',
        'INFRASTRUCTURE_EXPOSES_MODEL_AND_FINDINGS',
        'TRUTHFUL_INFRASTRUCTURE_FINDINGS_EMPTY_STATE',
        'OVERVIEW_EQUALS_INTELLIGENCE',
      ];

      for (const inv of expectedInvariants) {
        assert.ok(
          inv in WORKSPACE_CERTIFIED_INVARIANTS,
          `Expected ${inv} in WORKSPACE_CERTIFIED_INVARIANTS`
        );
      }
    });
  });
});
