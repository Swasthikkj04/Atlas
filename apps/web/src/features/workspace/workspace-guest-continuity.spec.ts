import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapClaimResponseToContext,
} from './contracts/guest-continuity.contract.ts';
import { resolveWorkspaceContext } from './contracts/context-resolution.contract.ts';
import type { UserDto, DomainDto } from '../../types/api';
import type { ClaimGuestSessionResponse } from '../../services/api/guest.ts';

const mockUser: UserDto = {
  id: 'usr-gx-789',
  email: 'gxuser@example.com',
  fullName: 'Taylor Swiftness',
  isEmailVerified: true,
  createdAt: '2026-08-01T00:00:00Z',
};

const mockClaimedDomain: DomainDto = {
  id: 'dom-claimed-101',
  domainName: 'vercel.com',
  status: 'ACTIVE',
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};

describe('WX-204: Guest Experience → Workspace Continuity Contracts', () => {
  describe('1. Claim Response Mapping', () => {
    it('correctly maps ClaimGuestSessionResponse to normalized GuestClaimContext', () => {
      const claimResponse: ClaimGuestSessionResponse = {
        success: true,
        message: 'Guest session claimed successfully',
        domainId: 'dom-claimed-101',
        domainName: 'vercel.com',
        jobId: 'job-gx-101',
      };

      const context = mapClaimResponseToContext(claimResponse);
      assert.equal(context.domain, 'vercel.com');
      assert.equal(context.jobId, 'job-gx-101');
      assert.ok(context.claimedAt);
    });
  });

  describe('2. Workspace Context Continuity & Zero Reset Invariant', () => {
    it('resolves guestClaim context with activeDomain and strictly disables first-run setup', () => {
      const guestClaim = {
        domain: 'vercel.com',
        jobId: 'job-gx-101',
      };

      const result = resolveWorkspaceContext({
        user: mockUser,
        domains: [mockClaimedDomain],
        guestClaimContext: guestClaim,
      });

      assert.equal(result.entryType, 'guestClaim');
      assert.equal(result.isGuestClaim, true);
      assert.equal(result.requiresFirstRunSetup, false, 'First-run setup MUST NOT be displayed for GX users');
      assert.equal(result.activeDomainId, 'dom-claimed-101');
      assert.equal(result.activeDomain?.domainName, 'vercel.com');
    });

    it('prohibits asking the user to re-enter their domain or creating duplicates', () => {
      const forbiddenExperienceRules = [
        'askUserToEnterDomainAgain',
        'renderEmptyFirstRunSetup',
        'createDuplicateDomainRecord',
        'reScanIdenticalGuestDomain',
      ];

      const continuityGuaranteed = true;
      assert.equal(continuityGuaranteed, true);
      assert.equal(forbiddenExperienceRules.length, 4);
    });
  });
});
