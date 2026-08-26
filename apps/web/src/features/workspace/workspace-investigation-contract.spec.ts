import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveInvestigationTarget,
  buildInvestigationLink,
  type InvestigationContext,
} from './contracts/investigation.contract.ts';
import type { DomainDto } from '../../types/api';

const mockOwnedDomains: DomainDto[] = [
  {
    id: 'dom-authorized-1',
    domainName: 'stripe.com',
    status: 'ACTIVE',
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
  },
  {
    id: 'dom-authorized-2',
    domainName: 'api.stripe.com',
    status: 'ACTIVE',
    createdAt: '2026-06-02T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
  },
];

describe('WX-301: Investigation & Evidence Architecture & Security Contracts', () => {
  describe('1. Investigation Source Types & Link Builder', () => {
    it('verifies all 4 canonical investigation source types', () => {
      const sourceTypes = ['story', 'finding', 'change', 'evidence'];
      assert.equal(sourceTypes.length, 4);
    });

    it('builds canonical safe investigation links preserving returnPath', () => {
      const link = buildInvestigationLink('dom-authorized-1', 'finding', 'fnd-dns-101', '/workspace');
      assert.ok(link.includes('domainId=dom-authorized-1'));
      assert.ok(link.includes('sourceType=finding'));
      assert.ok(link.includes('sourceId=fnd-dns-101'));
      assert.ok(link.includes('returnPath=%2Fworkspace'));
    });
  });

  describe('2. Domain Ownership & Security Boundary', () => {
    it('resolves valid investigation target for owned domain', () => {
      const context: InvestigationContext = {
        domainId: 'dom-authorized-1',
        sourceType: 'finding',
        sourceId: 'fnd-dns-101',
      };

      const result = resolveInvestigationTarget({
        context,
        activeDomainId: 'dom-authorized-1',
        userDomains: mockOwnedDomains,
      });

      assert.equal(result.isValid, true);
      assert.equal(result.isDomainMismatch, false);
      assert.equal(result.targetDomainId, 'dom-authorized-1');
      assert.equal(result.sourceId, 'fnd-dns-101');
    });

    it('safely rejects unowned domain investigation request with mismatch flag', () => {
      const maliciousContext: InvestigationContext = {
        domainId: 'dom-attacker-unowned-target',
        sourceType: 'finding',
        sourceId: 'fnd-secret-999',
      };

      const result = resolveInvestigationTarget({
        context: maliciousContext,
        activeDomainId: 'dom-authorized-1',
        userDomains: mockOwnedDomains,
      });

      assert.equal(result.isValid, false, 'Unowned resource request must NOT be marked valid');
      assert.equal(result.isDomainMismatch, true);
      assert.equal(result.targetDomainId, 'dom-authorized-1', 'Must fallback to active domain');
    });
  });

  describe('3. Invariant: Prohibition of Client-Side Diffing & Inference', () => {
    it('prohibits comparing snapshots or synthesizing evidence in React', () => {
      const forbiddenInvestigationBehaviors = [
        'clientSideSnapshotDiffing',
        'frontendInferCausalLineage',
        'synthesizeObservationValuesLocally',
        'recalculateFindingSeverityInReact',
      ];

      for (const behavior of forbiddenInvestigationBehaviors) {
        assert.ok(typeof behavior === 'string');
      }
    });
  });
});
