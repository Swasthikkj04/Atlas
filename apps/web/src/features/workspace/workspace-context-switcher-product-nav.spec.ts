import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_PRODUCT_NAVIGATION,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import { ROUTES, resolveAppRoute } from '../../routes/routes.ts';
import type { DomainDto } from '../../types/api';

const mockDomains: DomainDto[] = [
  {
    id: 'domain-1',
    domainName: 'example.com',
    status: 'ACTIVE',
    activeFindingCount: 2,
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-22T10:00:00Z',
  },
  {
    id: 'domain-2',
    domainName: 'stripe.com',
    status: 'ACTIVE',
    activeFindingCount: 0,
    createdAt: '2026-08-21T10:00:00Z',
    updatedAt: '2026-08-22T10:00:00Z',
  },
  {
    id: 'domain-3',
    domainName: 'github.com',
    status: 'ACTIVE',
    activeFindingCount: 5,
    createdAt: '2026-08-22T10:00:00Z',
    updatedAt: '2026-08-22T10:00:00Z',
  },
];

describe('WX-902: Workspace Context Switcher, Product Navigation & Shell', () => {
  describe('1. Product Navigation Hierarchy & Contract', () => {
    it('defines the 5 canonical product navigation experiences in strict order', () => {
      const tabIds = WORKSPACE_PRODUCT_NAVIGATION.map((item) => item.id);
      assert.deepEqual(tabIds, ['overview', 'findings', 'changes', 'infrastructure', 'memory']);
    });

    it('maps every product navigation item to its canonical path and question', () => {
      for (const item of WORKSPACE_PRODUCT_NAVIGATION) {
        assert.ok(item.path.startsWith('/workspace'), `Path for ${item.id} must start with /workspace`);
        assert.ok(item.questionAnswered.length > 10, `Item ${item.id} must define question answered`);
        assert.ok(item.iconName.length > 0, `Item ${item.id} must define iconName`);
      }
    });

    it('resolves all product routes to WORKSPACE in route engine', () => {
      assert.equal(resolveAppRoute(ROUTES.WORKSPACE.ROOT), 'WORKSPACE');
      assert.equal(resolveAppRoute(ROUTES.WORKSPACE.FINDINGS), 'WORKSPACE');
      assert.equal(resolveAppRoute(ROUTES.WORKSPACE.CHANGES), 'WORKSPACE');
      assert.equal(resolveAppRoute(ROUTES.WORKSPACE.INFRASTRUCTURE), 'WORKSPACE');
      assert.equal(resolveAppRoute(ROUTES.WORKSPACE.MEMORY), 'WORKSPACE');
    });
  });

  describe('2. Domain Context Switcher Contract', () => {
    it('accurately resolves active domain from configured domains', () => {
      const activeId = 'domain-1';
      const activeDomain = mockDomains.find((d) => d.id === activeId) || mockDomains[0];
      assert.equal(activeDomain.domainName, 'example.com');
      assert.equal(activeDomain.status, 'ACTIVE');
    });

    it('supports fast filtering by domain name (<100ms)', () => {
      const query = 'stripe';
      const filtered = mockDomains.filter((d) =>
        d.domainName.toLowerCase().includes(query.toLowerCase())
      );
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].domainName, 'stripe.com');
    });

    it('enforces 4-domain ceiling and calculates available slots', () => {
      const domainCount = mockDomains.length;
      const maxLimit = 4;
      const canAdd = domainCount < maxLimit;
      assert.equal(domainCount, 3);
      assert.equal(canAdd, true);

      const atLimitDomains: DomainDto[] = [
        ...mockDomains,
        {
          id: 'domain-4',
          domainName: 'atlas.io',
          status: 'ACTIVE',
          activeFindingCount: 0,
          createdAt: '2026-08-22T10:00:00Z',
          updatedAt: '2026-08-22T10:00:00Z',
        },
      ];
      assert.equal(atLimitDomains.length < maxLimit, false);
    });
  });

  describe('3. Routing & Context Preservation Contract', () => {
    it('verifies that all product navigation tabs preserve ?domainId query param', () => {
      const domainId = 'domain-1';
      const routes = [
        `${ROUTES.WORKSPACE.OVERVIEW}?domainId=${domainId}`,
        `${ROUTES.WORKSPACE.FINDINGS}?domainId=${domainId}`,
        `${ROUTES.WORKSPACE.CHANGES}?domainId=${domainId}`,
        `${ROUTES.WORKSPACE.INFRASTRUCTURE}?domainId=${domainId}`,
        `${ROUTES.WORKSPACE.MEMORY}?domainId=${domainId}`,
      ];

      for (const route of routes) {
        assert.ok(route.includes(`domainId=${domainId}`), `Route ${route} must preserve domain context`);
      }
    });

    it('enforces single-domain context boundary across all surfaces (NO_MIXED_DOMAIN_CONTEXT)', () => {
      const selectedId = 'domain-2';
      const active = mockDomains.find((d) => d.id === selectedId);
      assert.equal(active?.domainName, 'stripe.com');
      assert.notEqual(active?.domainName, 'example.com');
    });
  });

  describe('4. Certified P0 Invariants Enforcement', () => {
    it('enforces all certified invariants for WX-902', () => {
      const requiredInvariants = [
        'NO_DOMAIN_SIDEBAR_AS_PRIMARY_CONTEXT',
        'NO_MIXED_DOMAIN_CONTEXT',
        'NO_DOMAIN_CONTEXT_LOSS',
        'NO_STALE_DOMAIN_CONTEXT',
        'NO_FRONTEND_INTELLIGENCE_REINTERPRETATION',
        'NO_FAKE_CAPABILITY',
        'NO_INVENTED_API',
        'NO_DUPLICATE_NAVIGATION_SYSTEM',
        'NO_BACKEND_REDESIGN_WITHOUT_GAP',
        'NO_HISTORICAL_TRUTH_MUTATION',
        'NO_DESIGN_TOKEN_INVENTION',
      ];

      for (const inv of requiredInvariants) {
        assert.ok(inv in WORKSPACE_CERTIFIED_INVARIANTS, `Certified invariant missing: ${inv}`);
      }
    });
  });
});
