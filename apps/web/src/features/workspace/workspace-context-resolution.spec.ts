import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveWorkspaceContext,
  type WorkspaceContextResolutionParams,
} from './contracts/context-resolution.contract.ts';
import type { UserDto, DomainDto } from '../../types/api';

const mockUser: UserDto = {
  id: 'usr-456',
  email: 'security@example.com',
  fullName: 'Morgan Hayes',
  isEmailVerified: true,
  createdAt: '2026-08-01T00:00:00Z',
};

const mockUserDomains: DomainDto[] = [
  {
    id: 'dom-auth-1',
    domainName: 'atlas.org',
    status: 'ACTIVE',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'dom-auth-2',
    domainName: 'nebula.internal',
    status: 'PENDING',
    createdAt: '2026-08-02T00:00:00Z',
    updatedAt: '2026-08-02T00:00:00Z',
  },
];

describe('WX-202: Workspace Context Resolution & Security Contracts', () => {
  describe('1. Direct & Zero-Domain State Resolution', () => {
    it('resolves null active context and requires first-run setup when 0 domains exist', () => {
      const params: WorkspaceContextResolutionParams = {
        user: mockUser,
        domains: [],
      };

      const result = resolveWorkspaceContext(params);
      assert.equal(result.entryType, 'direct');
      assert.equal(result.activeDomain, null);
      assert.equal(result.activeDomainId, null);
      assert.equal(result.requiresFirstRunSetup, true);
      assert.equal(result.isGuestClaim, false);
      assert.equal(result.isRequestedDomainMismatch, false);
    });
  });

  describe('2. Guest Claim Continuity Context', () => {
    it('preserves claimed domain context as authoritative', () => {
      const params: WorkspaceContextResolutionParams = {
        user: mockUser,
        domains: mockUserDomains,
        guestClaimContext: {
          domain: 'atlas.org',
        },
      };

      const result = resolveWorkspaceContext(params);
      assert.equal(result.entryType, 'guestClaim');
      assert.equal(result.activeDomainId, 'dom-auth-1');
      assert.equal(result.isGuestClaim, true);
      assert.equal(result.requiresFirstRunSetup, false);
    });
  });

  describe('3. Domain Ownership & Security Boundary', () => {
    it('rejects unauthorized requestedDomainId and marks mismatch without activating unowned context', () => {
      const params: WorkspaceContextResolutionParams = {
        user: mockUser,
        domains: mockUserDomains,
        requestedDomainId: 'dom-unauthorized-999', // Belongs to another tenant
      };

      const result = resolveWorkspaceContext(params);
      assert.equal(result.isRequestedDomainMismatch, true);
      assert.notEqual(result.activeDomainId, 'dom-unauthorized-999');
      assert.equal(result.activeDomainId, 'dom-auth-1'); // Safely defaulted to owned active domain
    });

    it('activates requested domain when verified to belong to authenticated user', () => {
      const params: WorkspaceContextResolutionParams = {
        user: mockUser,
        domains: mockUserDomains,
        requestedDomainId: 'dom-auth-2',
      };

      const result = resolveWorkspaceContext(params);
      assert.equal(result.isRequestedDomainMismatch, false);
      assert.equal(result.activeDomainId, 'dom-auth-2');
      assert.equal(result.activeDomain?.domainName, 'nebula.internal');
    });
  });
});
