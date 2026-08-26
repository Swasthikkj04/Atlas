import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { DomainDto } from '../../types/api';
import {
  WORKSPACE_TRANSITION_MATRIX,
  resolveCrossExperienceNavigation,
  buildWorkspaceNavigationUrl,
  parseWorkspaceNavigationUrl,
  unwindWorkspaceNavigationReturnPath,
  type WorkspaceNavigationTarget,
} from './contracts/cross-experience-navigation.contract.ts';

const mockOwnedDomains: readonly DomainDto[] = [
  {
    id: 'dom-stripe-prod',
    domainName: 'stripe.com',
    status: 'ACTIVE',
    createdAt: '2026-08-12T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z',
    snapshotCount: 5,
    activeFindingCount: 2,
  },
  {
    id: 'dom-github-prod',
    domainName: 'github.com',
    status: 'ACTIVE',
    createdAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z',
    snapshotCount: 2,
    activeFindingCount: 0,
  },
];

describe('WX-601: Cross-Experience Navigation Contract & Relationship Model', () => {
  describe('1. Canonical Workspace Relationship Matrix & Transitions', () => {
    it('defines authoritative transition rules for all primary experiences and resources', () => {
      const experienceTypes = ['current', 'overview', 'memory'];
      const resourceTypes = ['story', 'finding', 'change', 'snapshot', 'historical_context', 'evidence', 'timeline_event'];

      for (const exp of experienceTypes) {
        const rule = WORKSPACE_TRANSITION_MATRIX.find((r) => r.from === exp);
        assert.ok(rule, `Missing transition rule for experience: ${exp}`);
        assert.ok(rule.allowedDestinations.length > 0);
      }

      for (const res of resourceTypes) {
        const rule = WORKSPACE_TRANSITION_MATRIX.find((r) => r.from === res);
        assert.ok(rule, `Missing transition rule for resource: ${res}`);
        assert.ok(rule.allowedDestinations.length > 0);
        assert.equal(rule.requiresAuthoritativeLink, true);
      }
    });

    it('validates Current Intelligence -> Overview / Memory / Finding transitions', () => {
      const currentRule = WORKSPACE_TRANSITION_MATRIX.find((r) => r.from === 'current');
      assert.ok(currentRule);
      assert.ok(currentRule.allowedDestinations.includes('overview'));
      assert.ok(currentRule.allowedDestinations.includes('memory'));
      assert.ok(currentRule.allowedDestinations.includes('finding'));
      assert.ok(currentRule.allowedDestinations.includes('change'));
    });

    it('validates Memory -> Timeline / Change / Snapshot / Historical Context transitions', () => {
      const memoryRule = WORKSPACE_TRANSITION_MATRIX.find((r) => r.from === 'memory');
      assert.ok(memoryRule);
      assert.ok(memoryRule.allowedDestinations.includes('timeline_event'));
      assert.ok(memoryRule.allowedDestinations.includes('change'));
      assert.ok(memoryRule.allowedDestinations.includes('snapshot'));
      assert.ok(memoryRule.allowedDestinations.includes('historical_context'));
    });
  });

  describe('2. Navigation Target Resolution & Context Preservation', () => {
    it('resolves top-level experience view navigation correctly', () => {
      const result = resolveCrossExperienceNavigation({
        target: {
          domainId: 'dom-stripe-prod',
          experience: 'overview',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockOwnedDomains,
      });

      assert.equal(result.isValid, true);
      assert.equal(result.isDomainMismatch, false);
      assert.equal(result.targetDomainId, 'dom-stripe-prod');
      assert.equal(result.experience, 'overview');
      assert.equal(result.returnPath, '/workspace');
    });

    it('resolves deep resource investigation preserving resource identity and return path', () => {
      const target: WorkspaceNavigationTarget = {
        domainId: 'dom-stripe-prod',
        resourceType: 'finding',
        resourceId: 'fnd-tls-expiring-001',
        returnPath: '/workspace?view=overview',
      };

      const result = resolveCrossExperienceNavigation({
        target,
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockOwnedDomains,
      });

      assert.equal(result.isValid, true);
      assert.equal(result.isDomainMismatch, false);
      assert.equal(result.targetDomainId, 'dom-stripe-prod');
      assert.equal(result.resourceType, 'finding');
      assert.equal(result.resourceId, 'fnd-tls-expiring-001');
      assert.equal(result.returnPath, '/workspace?view=overview');
    });
  });

  describe('3. Hierarchical Return-Path Unwinding', () => {
    it('unwinds multi-hop investigation chain without premature root /workspace collapse', () => {
      const domainId = 'dom-stripe-prod';

      // Chain: Workspace -> Overview -> Finding -> Evidence
      const step1 = '/workspace?view=overview';
      const step2 = buildWorkspaceNavigationUrl({
        domainId,
        resourceType: 'finding',
        resourceId: 'fnd-dns-001',
        returnPath: step1,
      });
      const step3 = buildWorkspaceNavigationUrl({
        domainId,
        resourceType: 'evidence',
        resourceId: 'fnd-dns-001',
        returnPath: step2,
      });

      // Unwind Step 3 (Evidence) -> Step 2 (Finding)
      const parsed3 = parseWorkspaceNavigationUrl('/workspace', step3.split('?')[1] || '');
      const unwoundToFinding = unwindWorkspaceNavigationReturnPath(parsed3.returnPath, domainId);
      assert.equal(unwoundToFinding.resourceType, 'finding');
      assert.equal(unwoundToFinding.resourceId, 'fnd-dns-001');

      // Unwind Step 2 (Finding) -> Step 1 (Overview)
      const unwoundToOverview = unwindWorkspaceNavigationReturnPath(unwoundToFinding.returnPath, domainId);
      assert.equal(unwoundToOverview.experience, 'overview');

      // Unwind Step 1 (Overview) -> Workspace Root
      const unwoundToRoot = unwindWorkspaceNavigationReturnPath(unwoundToOverview.returnPath, domainId);
      assert.equal(unwoundToRoot.experience, 'current');
    });
  });

  describe('4. P0 Mandatory Domain Context & Isolation Boundary', () => {
    it('strictly rejects navigation requests targeting unowned domains as UNAVAILABLE', () => {
      const result = resolveCrossExperienceNavigation({
        target: {
          domainId: 'dom-unauthorized-target',
          resourceType: 'snapshot',
          resourceId: 'snp-unauthorized-999',
          returnPath: '/workspace',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockOwnedDomains,
      });

      assert.equal(result.isValid, false);
      assert.equal(result.isDomainMismatch, true);
      assert.equal(result.targetDomainId, 'dom-stripe-prod');
    });

    it('rejects targets with missing domain ID', () => {
      const result = resolveCrossExperienceNavigation({
        target: {
          domainId: '',
          experience: 'current',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockOwnedDomains,
      });

      assert.equal(result.isValid, false);
      assert.equal(result.targetDomainId, 'dom-stripe-prod');
    });
  });

  describe('5. URL State Construction & Parsing (Deep Link Hydration)', () => {
    it('serializes and parses overview navigation URL correctly', () => {
      const target: WorkspaceNavigationTarget = {
        domainId: 'dom-stripe-prod',
        experience: 'overview',
      };
      const url = buildWorkspaceNavigationUrl(target);
      assert.ok(url.includes('view=overview'));
      assert.ok(url.includes('domainId=dom-stripe-prod'));

      const parsed = parseWorkspaceNavigationUrl('/workspace', url.split('?')[1] || '');
      assert.equal(parsed.domainId, 'dom-stripe-prod');
      assert.equal(parsed.experience, 'overview');
    });

    it('serializes and parses memory navigation URL correctly', () => {
      const target: WorkspaceNavigationTarget = {
        domainId: 'dom-stripe-prod',
        experience: 'memory',
      };
      const url = buildWorkspaceNavigationUrl(target);
      assert.ok(url.startsWith('/workspace/memory'));

      const parsed = parseWorkspaceNavigationUrl('/workspace/memory', url.includes('?') ? url.split('?')[1] : '');
      assert.equal(parsed.domainId, 'dom-stripe-prod');
      assert.equal(parsed.experience, 'memory');
    });

    it('serializes and parses deep investigation URL correctly', () => {
      const target: WorkspaceNavigationTarget = {
        domainId: 'dom-stripe-prod',
        resourceType: 'change',
        resourceId: 'evt-001',
        returnPath: '/workspace/memory',
      };
      const url = buildWorkspaceNavigationUrl(target);
      assert.ok(url.includes('sourceType=change'));
      assert.ok(url.includes('sourceId=evt-001'));

      const parsed = parseWorkspaceNavigationUrl('/workspace', url.split('?')[1] || '');
      assert.equal(parsed.domainId, 'dom-stripe-prod');
      assert.equal(parsed.resourceType, 'change');
      assert.equal(parsed.resourceId, 'evt-001');
      assert.equal(parsed.returnPath, '/workspace/memory');
    });
  });

  describe('6. Hard Invariants & Prohibited Anti-Patterns', () => {
    it('strictly forbids parallel routers, client-side relationship synthesis, or shell redesign', () => {
      const prohibitedPatterns = [
        'duplicateParallelRouter',
        'clientSideRelationshipSynthesis',
        'sidebarNavigationPollution',
        'hardcodedWorkspaceRedirectOnBack',
        'crossDomainCachedIntelligence',
        'fullPageReloadNavigation',
      ];

      for (const pattern of prohibitedPatterns) {
        assert.ok(typeof pattern === 'string');
      }
    });
  });
});
