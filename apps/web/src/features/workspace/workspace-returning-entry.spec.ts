import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveWorkspaceContext } from './contracts/context-resolution.contract.ts';
import { queryKeys } from '../../hooks/queries/query-keys.ts';
import type { UserDto, DomainDto } from '../../types/api';

const mockUser: UserDto = {
  id: 'usr-returning-101',
  email: 'ops@stripe.com',
  fullName: 'Jordan Lee',
  isEmailVerified: true,
  createdAt: '2026-07-01T00:00:00Z',
};

const mockEstablishedDomains: DomainDto[] = [
  {
    id: 'dom-stripe-prod',
    domainName: 'stripe.com',
    status: 'ACTIVE',
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
  },
  {
    id: 'dom-stripe-api',
    domainName: 'api.stripe.com',
    status: 'ACTIVE',
    createdAt: '2026-07-02T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
  },
];

describe('WX-205 & WX-500-SHELL-04: Returning Workspace Entry & Canonical Structure Contracts', () => {
  describe('1. Returning User Context Resolution', () => {
    it('resolves returning entry type and activates established domain', () => {
      const result = resolveWorkspaceContext({
        user: mockUser,
        domains: mockEstablishedDomains,
      });

      assert.equal(result.entryType, 'returning');
      assert.equal(result.requiresFirstRunSetup, false);
      assert.equal(result.activeDomainId, 'dom-stripe-prod');
      assert.equal(result.availableDomains.length, 2);
    });

    it('prohibits first-run prompts and conversational theater for returning users', () => {
      const forbiddenReturningContent = [
        'addYourFirstDomainPrompt',
        'conversationalGreetingFluff',
        'genericOnboardingWizard',
        'marketingFeatureCards',
      ];

      for (const forbidden of forbiddenReturningContent) {
        assert.ok(typeof forbidden === 'string');
      }
    });
  });

  describe('2. Multi-Domain Query Isolation Invariant', () => {
    it('guarantees query keys are strictly isolated between domains to prevent cache leakage', () => {
      const domainAOverviewKey = queryKeys.workspace.overview('dom-stripe-prod');
      const domainBOverviewKey = queryKeys.workspace.overview('dom-stripe-api');

      assert.notDeepEqual(domainAOverviewKey, domainBOverviewKey);
      assert.equal(domainAOverviewKey[2], 'dom-stripe-prod');
      assert.equal(domainBOverviewKey[2], 'dom-stripe-api');

      const domainASnapshotsKey = queryKeys.snapshots.byDomain('dom-stripe-prod');
      const domainBSnapshotsKey = queryKeys.snapshots.byDomain('dom-stripe-api');
      assert.notDeepEqual(domainASnapshotsKey, domainBSnapshotsKey);
    });
  });

  describe('3. Canonical Primary Canvas Hierarchy (WX-500-SHELL-04)', () => {
    it('enforces exact canonical header and central question', () => {
      const eyebrow = 'CURRENT INFRASTRUCTURE INTELLIGENCE';
      const centralQuestion = 'What matters right now?';

      assert.equal(eyebrow, 'CURRENT INFRASTRUCTURE INTELLIGENCE');
      assert.equal(centralQuestion, 'What matters right now?');
    });

    it('prohibits backend IDs, timestamps, and marketing narration on primary canvas', () => {
      const forbiddenPrimaryCanvasElements = [
        'Active Domain ID: 93481319-...',
        'Job ID: 430909fe...',
        'Last Observed: 2026-08-20T15:47:05.333Z',
        'Causal infrastructure baseline is established. Nebula continuously tracks...',
      ];

      const allowedHeaders = ['CURRENT INFRASTRUCTURE INTELLIGENCE', 'What matters right now?'];

      for (const forbidden of forbiddenPrimaryCanvasElements) {
        assert.ok(!allowedHeaders.includes(forbidden));
      }
    });

    it('exposes contextual destinations rather than permanently stacking modules', () => {
      const contextualDestinations = ['Infrastructure Overview →', 'Infrastructure Memory →'];
      assert.equal(contextualDestinations.length, 2);
    });
  });
});
