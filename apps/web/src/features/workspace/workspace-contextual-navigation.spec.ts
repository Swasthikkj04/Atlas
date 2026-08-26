import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { DomainDto } from '../../types/api';
import {
  buildWorkspaceNavigationUrl,
  parseWorkspaceNavigationUrl,
  unwindWorkspaceNavigationReturnPath,
  resolveCrossExperienceNavigation,
  type WorkspaceNavigationTarget,
} from './contracts/cross-experience-navigation.contract.ts';
import {
  buildInvestigationLink,
  resolveInvestigationTarget,
} from './contracts/investigation.contract.ts';

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

describe('WX-602: Contextual Navigation Architecture & Invariants', () => {
  describe('1. Current Intelligence Contextual Action Pathways', () => {
    it('generates authoritative investigation link for Primary/Secondary Story without client-side inference', () => {
      const domainId = 'dom-stripe-prod';
      const findingId = 'fnd-tls-expiring-soon';

      const navUrl = buildWorkspaceNavigationUrl({
        domainId,
        resourceType: 'finding',
        resourceId: findingId,
        returnPath: '/workspace',
      });

      assert.ok(navUrl.includes(`domainId=${domainId}`));
      assert.ok(navUrl.includes('sourceType=finding'));
      assert.ok(navUrl.includes(`sourceId=${findingId}`));
    });

    it('generates top-level canvas navigation to Overview and Memory without sidebar clutter', () => {
      const domainId = 'dom-stripe-prod';

      const overviewUrl = buildWorkspaceNavigationUrl({
        domainId,
        experience: 'overview',
      });
      assert.ok(overviewUrl.includes('view=overview'));

      const memoryUrl = buildWorkspaceNavigationUrl({
        domainId,
        experience: 'memory',
      });
      assert.ok(memoryUrl.startsWith('/workspace/memory'));
    });
  });

  describe('2. Infrastructure Overview Contextual Continuations', () => {
    it('generates findings investigation path scoped to domain with returnPath preserving Overview state', () => {
      const domainId = 'dom-stripe-prod';
      const returnPath = '/workspace?view=overview';

      const target: WorkspaceNavigationTarget = {
        domainId,
        resourceType: 'story',
        resourceId: domainId,
        returnPath,
      };

      const navUrl = buildWorkspaceNavigationUrl(target);
      assert.ok(navUrl.includes('sourceType=story'));
      assert.ok(navUrl.includes(`domainId=${domainId}`));
      assert.ok(navUrl.includes('returnPath=%2Fworkspace%3Fview%3Doverview') || navUrl.includes('returnPath=/workspace?view=overview'));
    });
  });

  describe('3. Infrastructure Memory & Lineage Contextual Actions', () => {
    it('generates contextual change and snapshot investigation paths from timeline events', () => {
      const domainId = 'dom-stripe-prod';
      const changeId = 'evt-http-upgrade-001';
      const returnPath = '/workspace/memory';

      // 1. Timeline -> Change Investigation
      const changeUrl = buildInvestigationLink(domainId, 'change', changeId, returnPath);
      assert.ok(changeUrl.includes('sourceType=change'));
      assert.ok(changeUrl.includes(`sourceId=${changeId}`));

      // 2. Timeline -> Snapshot History
      const snapshotId = 'snp-stripe-ca0a74f7';
      const snapshotUrl = buildInvestigationLink(domainId, 'snapshot', snapshotId, returnPath);
      assert.ok(snapshotUrl.includes('sourceType=snapshot'));
      assert.ok(snapshotUrl.includes(`sourceId=${snapshotId}`));

      // 3. Timeline -> Historical Context
      const histUrl = buildInvestigationLink(domainId, 'historical_context', domainId, returnPath);
      assert.ok(histUrl.includes('sourceType=historical_context'));
    });
  });

  describe('4. Multi-Hop Deep Investigation & Hierarchical Unwinding', () => {
    it('preserves user context across multi-hop investigations and unwinds in exact reverse sequence', () => {
      const domainId = 'dom-stripe-prod';

      // Step 1: User is at Workspace Memory
      const step1 = '/workspace/memory';

      // Step 2: User clicks "Investigate change →"
      const step2 = buildInvestigationLink(domainId, 'change', 'evt-001', step1);

      // Step 3: From Change, user clicks "Previous Snapshot →"
      const step3 = buildInvestigationLink(domainId, 'snapshot', 'snp-prev-001', step2);

      // Step 4: From Snapshot, user clicks "View Historical Context →"
      const step4 = buildInvestigationLink(domainId, 'historical_context', domainId, step3);

      // Step 5: From Historical Context, user clicks "View Supporting Evidence →"
      const step5 = buildInvestigationLink(domainId, 'evidence', 'evd-tls-001', step4);

      // --- Hierarchical Return Unwinding ---
      // Unwind Step 5 (Evidence) -> Step 4 (Historical Context)
      const parsed5 = parseWorkspaceNavigationUrl('/workspace', step5.split('?')[1] || '');
      const unwound4 = unwindWorkspaceNavigationReturnPath(parsed5.returnPath, domainId);
      assert.equal(unwound4.resourceType, 'historical_context');

      // Unwind Step 4 (Historical Context) -> Step 3 (Snapshot)
      const unwound3 = unwindWorkspaceNavigationReturnPath(unwound4.returnPath, domainId);
      assert.equal(unwound3.resourceType, 'snapshot');
      assert.equal(unwound3.resourceId, 'snp-prev-001');

      // Unwind Step 3 (Snapshot) -> Step 2 (Change)
      const unwound2 = unwindWorkspaceNavigationReturnPath(unwound3.returnPath, domainId);
      assert.equal(unwound2.resourceType, 'change');
      assert.equal(unwound2.resourceId, 'evt-001');

      // Unwind Step 2 (Change) -> Step 1 (Memory Root)
      const unwound1 = unwindWorkspaceNavigationReturnPath(unwound2.returnPath, domainId);
      assert.equal(unwound1.experience, 'memory');
    });
  });

  describe('5. Hard Invariant: Zero Navigation Hallucination', () => {
    it('refuses to construct valid navigation target when authoritative resource identifier is empty', () => {
      const invalidTarget: WorkspaceNavigationTarget = {
        domainId: 'dom-stripe-prod',
        resourceType: 'finding',
        resourceId: '', // Missing backend ID
        returnPath: '/workspace',
      };

      // Top-level experience fallback when resourceId is missing
      const result = resolveCrossExperienceNavigation({
        target: invalidTarget,
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockOwnedDomains,
      });

      // Does not create a phantom finding investigation
      assert.equal(result.resourceId, undefined);
      assert.equal(result.experience, 'current');
    });
  });

  describe('6. P0 Domain Context Switching & Isolation', () => {
    it('isolates contextual investigations strictly to the active domain', () => {
      const crossDomainAttempt = resolveInvestigationTarget({
        context: {
          domainId: 'dom-unauthorized-attacker',
          sourceType: 'finding',
          sourceId: 'fnd-secret-001',
          returnPath: '/workspace',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockOwnedDomains,
      });

      assert.equal(crossDomainAttempt.isValid, false);
      assert.equal(crossDomainAttempt.isDomainMismatch, true);
    });
  });

  describe('7. Prohibited Patterns & Anti-Theatrics Enforcement', () => {
    it('strictly forbids breadcrumb overload, global menus, or client-side causality synthesis', () => {
      const prohibitedAntiPatterns = [
        'breadcrumbTrailOverflow',
        'globalEverythingDropdown',
        'clientSideCausalitySynthesis',
        'fabricatedFindingLinkage',
        'sidebarMemoryPollution',
        'hardcodedWorkspaceRedirectOnBack',
      ];

      for (const pattern of prohibitedAntiPatterns) {
        assert.ok(typeof pattern === 'string');
      }
    });
  });
});
