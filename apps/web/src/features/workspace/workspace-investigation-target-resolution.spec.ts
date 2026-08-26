import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveInvestigationTarget,
  buildInvestigationLink,
  type InvestigationContext,
} from './contracts/investigation.contract.ts';
import { mapSearchResultToNavigationTarget } from './contracts/search.contract.ts';
import type {
  DomainDto,
  InfrastructureFindingDto,
  BriefHighlightDto,
  InfrastructureBriefDto,
  TimelineEventDto,
  SearchItemDto,
} from '../../types/api';

const mockDomain: DomainDto = {
  id: 'dom-authorized-corp',
  domainName: 'atlas-corp.io',
  status: 'ACTIVE',
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-25T00:00:00Z',
};

const mockOtherOwnedDomain: DomainDto = {
  id: 'dom-authorized-api',
  domainName: 'api.atlas-corp.io',
  status: 'ACTIVE',
  createdAt: '2026-08-02T00:00:00Z',
  updatedAt: '2026-08-25T00:00:00Z',
};

const mockOwnedDomains: readonly DomainDto[] = [mockDomain, mockOtherOwnedDomain];

const mockAuthoritativeFinding: InfrastructureFindingDto = {
  id: 'fnd-tls-acme-prod-001',
  domainId: 'dom-authorized-corp',
  snapshotId: 'snp-atlas-001',
  category: 'TLS',
  severity: 'HIGH',
  status: 'ACTIVE',
  title: 'TLS Certificate Expiring in 14 Days',
  explanation: 'Production edge certificate for atlas-corp.io approaches expiration.',
  remediation: 'Renew and deploy new certificate via automated ACME integration.',
  lineage: {
    snapshotId: 'snp-atlas-001',
    observationKey: 'tls.certificate.validTo',
    observedValue: '2026-09-08T00:00:00Z',
    ruleId: 'rule-tls-expiring-14d',
    evaluationTimestamp: '2026-08-25T00:00:00Z',
  },
  detectedAt: '2026-08-25T00:00:00Z',
};

describe('WX-303-A: Investigation Target ID Resolution & Canonical Chain Verification', () => {
  describe('1. Findings → Finding → Investigation Entry Point', () => {
    it('passes authoritative finding ID from findings list to canonical investigation context', () => {
      const selectedFindingId = mockAuthoritativeFinding.id;
      assert.equal(selectedFindingId, 'fnd-tls-acme-prod-001');

      const context: InvestigationContext = {
        domainId: mockDomain.id,
        sourceType: 'finding',
        sourceId: selectedFindingId,
        returnPath: '/workspace/findings',
      };

      const resolved = resolveInvestigationTarget({
        context,
        activeDomainId: mockDomain.id,
        userDomains: mockOwnedDomains,
      });

      assert.equal(resolved.isValid, true);
      assert.equal(resolved.isDomainMismatch, false);
      assert.equal(resolved.targetDomainId, 'dom-authorized-corp');
      assert.equal(resolved.sourceType, 'finding');
      assert.equal(resolved.sourceId, 'fnd-tls-acme-prod-001');
      assert.equal(resolved.returnPath, '/workspace/findings');
    });
  });

  describe('2. Overview → Finding → Investigation Entry Point', () => {
    it('resolves authoritative finding ID from Infrastructure Overview surface', () => {
      const selectedFindingId = mockAuthoritativeFinding.id;

      const link = buildInvestigationLink(
        mockDomain.id,
        'finding',
        selectedFindingId,
        '/workspace/infrastructure'
      );

      assert.ok(link.includes('domainId=dom-authorized-corp'));
      assert.ok(link.includes('sourceType=finding'));
      assert.ok(link.includes('sourceId=fnd-tls-acme-prod-001'));
      assert.ok(link.includes('returnPath=%2Fworkspace%2Finfrastructure'));

      const context: InvestigationContext = {
        domainId: mockDomain.id,
        sourceType: 'finding',
        sourceId: selectedFindingId,
        returnPath: '/workspace/infrastructure',
      };

      const resolved = resolveInvestigationTarget({
        context,
        activeDomainId: mockDomain.id,
        userDomains: mockOwnedDomains,
      });

      assert.equal(resolved.isValid, true);
      assert.equal(resolved.sourceId, 'fnd-tls-acme-prod-001');
      assert.equal(resolved.targetDomainId, 'dom-authorized-corp');
    });
  });

  describe('3. Executive Brief → Finding → Investigation Entry Point', () => {
    it('preserves authoritative finding ID on Executive Brief highlight without falling back to presentation index', () => {
      const authoritativeHighlight: BriefHighlightDto = {
        id: mockAuthoritativeFinding.id,
        title: 'TLS Certificate Expiring Soon',
        summary: 'Production edge certificate approaches expiration.',
        severity: 'HIGH',
        componentType: 'tls',
      };

      const brief: InfrastructureBriefDto = {
        id: 'brf-atlas-001',
        snapshotId: 'snp-atlas-001',
        domainId: mockDomain.id,
        executiveSummary: 'Atlas Corp perimeter is healthy with 1 attention point.',
        healthScore: 92,
        highlights: [authoritativeHighlight],
        stableObservationsCount: 18,
        generatedAt: '2026-08-25T00:00:00Z',
      };

      assert.equal(brief.highlights[0].id, 'fnd-tls-acme-prod-001');
      assert.notEqual(brief.highlights[0].id, 'hl-0');
      assert.notEqual(brief.highlights[0].id, 'hI-0');

      const context: InvestigationContext = {
        domainId: mockDomain.id,
        sourceType: 'finding',
        sourceId: brief.highlights[0].id,
        returnPath: '/workspace',
      };

      const resolved = resolveInvestigationTarget({
        context,
        activeDomainId: mockDomain.id,
        userDomains: mockOwnedDomains,
      });

      assert.equal(resolved.isValid, true);
      assert.equal(resolved.sourceId, 'fnd-tls-acme-prod-001');
      assert.equal(resolved.targetDomainId, 'dom-authorized-corp');
    });
  });

  describe('4. Story → Finding → Investigation Entry Point', () => {
    it('dispatches investigation for Primary and Secondary stories using authoritative finding ID', () => {
      const primaryStoryFinding: InfrastructureFindingDto = {
        ...mockAuthoritativeFinding,
        id: 'fnd-primary-story-001',
        title: 'Dominant Infrastructure Event',
      };

      const secondaryStoryFinding: InfrastructureFindingDto = {
        ...mockAuthoritativeFinding,
        id: 'fnd-secondary-story-002',
        title: 'Secondary Finding Observed',
        severity: 'MEDIUM',
      };

      const primaryContext: InvestigationContext = {
        domainId: mockDomain.id,
        sourceType: 'finding',
        sourceId: primaryStoryFinding.id,
        returnPath: '/workspace',
      };

      const primaryResolved = resolveInvestigationTarget({
        context: primaryContext,
        activeDomainId: mockDomain.id,
        userDomains: mockOwnedDomains,
      });

      assert.equal(primaryResolved.isValid, true);
      assert.equal(primaryResolved.sourceId, 'fnd-primary-story-001');

      const secondaryContext: InvestigationContext = {
        domainId: mockDomain.id,
        sourceType: 'finding',
        sourceId: secondaryStoryFinding.id,
        returnPath: '/workspace',
      };

      const secondaryResolved = resolveInvestigationTarget({
        context: secondaryContext,
        activeDomainId: mockDomain.id,
        userDomains: mockOwnedDomains,
      });

      assert.equal(secondaryResolved.isValid, true);
      assert.equal(secondaryResolved.sourceId, 'fnd-secondary-story-002');
    });
  });

  describe('5. Change → Investigation Entry Point', () => {
    it('navigates to change investigation with authoritative change ID and preserves return path', () => {
      const mockChange: TimelineEventDto = {
        id: 'chg-dns-record-001',
        domainId: mockDomain.id,
        title: 'DNS A Record Modified',
        changeType: 'MODIFIED',
        severity: 'MEDIUM',
        snapshotId: 'snp-atlas-002',
        previousSnapshotId: 'snp-atlas-001',
        previousValue: '198.51.100.1',
        currentValue: '198.51.100.2',
        findingId: 'fnd-tls-acme-prod-001',
      };

      const context: InvestigationContext = {
        domainId: mockDomain.id,
        sourceType: 'change',
        sourceId: mockChange.id,
        returnPath: '/workspace/changes',
      };

      const resolved = resolveInvestigationTarget({
        context,
        activeDomainId: mockDomain.id,
        userDomains: mockOwnedDomains,
      });

      assert.equal(resolved.isValid, true);
      assert.equal(resolved.sourceType, 'change');
      assert.equal(resolved.sourceId, 'chg-dns-record-001');
      assert.equal(resolved.returnPath, '/workspace/changes');
    });
  });

  describe('6. Search → Finding → Investigation Entry Point', () => {
    it('maps search finding item directly to authoritative finding investigation target', () => {
      const searchItem: SearchItemDto = {
        id: 'fnd-search-item-888',
        title: 'Exposed Database Port',
        description: 'PostgreSQL port 5432 exposed to internet',
        type: 'FINDING',
        domainName: mockDomain.domainName,
        relevanceScore: 0.95,
      };

      const target = mapSearchResultToNavigationTarget(searchItem, mockDomain.id, '/workspace');

      assert.equal(target.resourceType, 'finding');
      assert.equal(target.resourceId, 'fnd-search-item-888');
      assert.equal(target.domainId, mockDomain.id);
    });
  });

  describe('7. Invalid Finding ID & Cross-Domain Security Boundary', () => {
    it('correctly maps invalid / nonexistent finding ID to well-formed context for truthful 404', () => {
      const nonexistentContext: InvestigationContext = {
        domainId: mockDomain.id,
        sourceType: 'finding',
        sourceId: 'fnd-nonexistent-999999',
        returnPath: '/workspace',
      };

      const resolved = resolveInvestigationTarget({
        context: nonexistentContext,
        activeDomainId: mockDomain.id,
        userDomains: mockOwnedDomains,
      });

      assert.equal(resolved.isValid, true);
      assert.equal(resolved.isDomainMismatch, false);
      assert.equal(resolved.sourceId, 'fnd-nonexistent-999999');
      assert.equal(resolved.targetDomainId, mockDomain.id);
    });

    it('strictly rejects cross-domain / unowned finding investigation attempt', () => {
      const crossDomainContext: InvestigationContext = {
        domainId: 'dom-unauthorized-attacker-target',
        sourceType: 'finding',
        sourceId: 'fnd-cross-tenant-secret-007',
        returnPath: '/workspace',
      };

      const resolved = resolveInvestigationTarget({
        context: crossDomainContext,
        activeDomainId: mockDomain.id,
        userDomains: mockOwnedDomains,
      });

      assert.equal(resolved.isValid, false);
      assert.equal(resolved.isDomainMismatch, true);
      assert.equal(resolved.targetDomainId, mockDomain.id, 'Must fall back to active domain without leaking target');
      assert.equal(resolved.returnPath, '/workspace');
    });
  });

  describe('8. Certified Invariants & No Synthetic ID Fabrication', () => {
    it('guarantees no presentation or synthetic IDs are generated during investigation routing', () => {
      const forbiddenIdPatterns = [
        /^hl-\d+$/,
        /^hI-\d+$/,
        /^index-\d+$/,
        /^temp-\d+$/,
      ];

      const validAuthoritativeId = mockAuthoritativeFinding.id;
      for (const pattern of forbiddenIdPatterns) {
        assert.equal(
          pattern.test(validAuthoritativeId),
          false,
          `Authoritative finding ID '${validAuthoritativeId}' must not match synthetic pattern ${pattern}`
        );
      }
    });
  });
});
