import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveWorkspaceEntry,
  type WorkspaceEntryResolutionParams,
} from './contracts/entry-state.contract.ts';
import type { UserDto, DomainDto } from '../../types/api';

const mockUser: UserDto = {
  id: 'usr-123',
  email: 'user@example.com',
  fullName: 'Alex River',
  isEmailVerified: true,
  createdAt: '2026-08-01T00:00:00Z',
};

const mockDomains: DomainDto[] = [
  {
    id: 'dom-1',
    domainName: 'stripe.com',
    status: 'ACTIVE',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'dom-2',
    domainName: 'github.com',
    status: 'PENDING',
    createdAt: '2026-08-02T00:00:00Z',
    updatedAt: '2026-08-02T00:00:00Z',
  },
];

describe('WX-201: Workspace Entry-State Contract & Resolver', () => {
  describe('1. Direct New Registered User Resolution', () => {
    it('resolves direct entry when user has no domains and no guest claim', () => {
      const params: WorkspaceEntryResolutionParams = {
        user: mockUser,
        domains: [],
        guestClaimContext: null,
      };

      const result = resolveWorkspaceEntry(params);
      assert.equal(result.type, 'direct');
      assert.equal(result.requiresFirstRunSetup, true);
      assert.equal(result.hasEstablishedDomains, false);
      assert.equal(result.activeDomain, null);
      assert.equal(result.guestClaim, null);
    });

    it('safely handles null domains list as direct entry', () => {
      const params: WorkspaceEntryResolutionParams = {
        user: mockUser,
        domains: null,
      };

      const result = resolveWorkspaceEntry(params);
      assert.equal(result.type, 'direct');
      assert.equal(result.requiresFirstRunSetup, true);
    });
  });

  describe('2. GX → Registered User Continuity Resolution', () => {
    it('resolves guestClaim entry when guestClaimContext is provided', () => {
      const params: WorkspaceEntryResolutionParams = {
        user: mockUser,
        domains: [],
        guestClaimContext: {
          domain: 'stripe.com',
          jobId: 'job-999',
          snapshotId: 'snp-999',
        },
      };

      const result = resolveWorkspaceEntry(params);
      assert.equal(result.type, 'guestClaim');
      assert.equal(result.requiresFirstRunSetup, false);
      assert.ok(result.guestClaim);
      assert.equal(result.guestClaim.domain, 'stripe.com');
    });

    it('matches existing domain record when claimed domain is already provisioned', () => {
      const params: WorkspaceEntryResolutionParams = {
        user: mockUser,
        domains: mockDomains,
        guestClaimContext: {
          domain: 'stripe.com',
        },
      };

      const result = resolveWorkspaceEntry(params);
      assert.equal(result.type, 'guestClaim');
      assert.equal(result.activeDomain?.id, 'dom-1');
    });
  });

  describe('3. Returning Registered User Resolution', () => {
    it('resolves returning entry when user has established domains', () => {
      const params: WorkspaceEntryResolutionParams = {
        user: mockUser,
        domains: mockDomains,
      };

      const result = resolveWorkspaceEntry(params);
      assert.equal(result.type, 'returning');
      assert.equal(result.hasEstablishedDomains, true);
      assert.equal(result.requiresFirstRunSetup, false);
      assert.equal(result.activeDomain?.id, 'dom-1'); // Active domain preferred
    });

    it('resolves explicitly requested domain ID when valid', () => {
      const params: WorkspaceEntryResolutionParams = {
        user: mockUser,
        domains: mockDomains,
        requestedDomainId: 'dom-2',
      };

      const result = resolveWorkspaceEntry(params);
      assert.equal(result.type, 'returning');
      assert.equal(result.activeDomain?.id, 'dom-2');
    });
  });
});
