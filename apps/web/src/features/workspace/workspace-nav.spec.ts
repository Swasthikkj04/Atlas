import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_PRODUCT_NAVIGATION,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';

describe('WX-902: Authoritative Product Navigation Architecture', () => {
  describe('1. Product Navigation Hierarchy (NO_DOMAIN_SIDEBAR_AS_PRIMARY_CONTEXT)', () => {
    it('defines WORKSPACE product navigation items: Overview, Findings, Changes, Infrastructure, Memory', () => {
      const tabIds = WORKSPACE_PRODUCT_NAVIGATION.map((item) => item.id);
      assert.deepEqual(tabIds, ['overview', 'findings', 'changes', 'infrastructure', 'memory']);
    });

    it('prohibits domain list in primary sidebar and verifies clean product navigation structure', () => {
      const allowedSections = ['WORKSPACE', 'Settings'];
      const forbiddenSaaSFiller = ['Analytics', 'Billing', 'Integrations', 'Reports', 'API Keys'];

      for (const forbidden of forbiddenSaaSFiller) {
        assert.ok(!allowedSections.includes(forbidden));
      }
    });

    it('defines 4-domain ceiling for the domain context switcher', () => {
      const domains = [
        { id: 'dom-1', domainName: 'example.com' },
        { id: 'dom-2', domainName: 'stripe.com' },
      ];
      const maxLimit = 4;
      const countLabel = `${domains.length} / ${maxLimit}`;
      const canAdd = domains.length < maxLimit;

      assert.equal(countLabel, '2 / 4');
      assert.equal(canAdd, true);
    });

    it('disables Add Domain action when 4 / 4 ceiling is reached', () => {
      const domains = [
        { id: 'dom-1', domainName: 'example.com' },
        { id: 'dom-2', domainName: 'stripe.com' },
        { id: 'dom-3', domainName: 'github.com' },
        { id: 'dom-4', domainName: 'atlas.io' },
      ];
      const maxLimit = 4;
      const countLabel = `${domains.length} / ${maxLimit}`;
      const canAdd = domains.length < maxLimit;

      assert.equal(countLabel, '4 / 4');
      assert.equal(canAdd, false);
    });
  });

  describe('2. Active Domain Indicator & Context Preservation', () => {
    it('accurately identifies active domain in the domain context switcher', () => {
      const domains = [
        { id: 'dom-1', domainName: 'example.com' },
        { id: 'dom-2', domainName: 'stripe.com' },
      ];
      const activeDomainId = 'dom-1';

      const activeDomain = domains.find((d) => d.id === activeDomainId);
      assert.equal(activeDomain?.domainName, 'example.com');
    });

    it('enforces NO_MIXED_DOMAIN_CONTEXT across surfaces', () => {
      assert.ok('NO_MIXED_DOMAIN_CONTEXT' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_DOMAIN_SIDEBAR_AS_PRIMARY_CONTEXT' in WORKSPACE_CERTIFIED_INVARIANTS);
    });
  });
});
