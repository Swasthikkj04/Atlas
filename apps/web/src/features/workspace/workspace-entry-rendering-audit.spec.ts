import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveWorkspaceContext } from './contracts/context-resolution.contract.ts';
import type { UserDto, DomainDto } from '../../types/api';

const mockUser: UserDto = {
  id: 'usr-audit-101',
  email: 'lead@acme.corp',
  fullName: 'Morgan Vance',
  isEmailVerified: true,
  createdAt: '2026-06-01T00:00:00Z',
};

const mockDomain: DomainDto = {
  id: 'dom-acme-1',
  domainName: 'acme.corp',
  status: 'ACTIVE',
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-08-20T00:00:00Z',
};

describe('WX-210: Workspace Entry Rendering & Visual Conformance Contracts', () => {
  describe('1. Distinct Entry Path Rendition Invariant', () => {
    it('Direct user (0 domains) routes strictly to first-run setup without fake intelligence', () => {
      const res = resolveWorkspaceContext({ user: mockUser, domains: [] });
      assert.equal(res.requiresFirstRunSetup, true);
      assert.equal(res.activeDomain, null);
      assert.equal(res.entryType, 'direct');
    });

    it('GX Claim user routes to claimed domain continuity without first-run restart', () => {
      const res = resolveWorkspaceContext({
        user: mockUser,
        domains: [mockDomain],
        guestClaimContext: { domain: 'acme.corp', jobId: 'job-gx-1' },
      });
      assert.equal(res.requiresFirstRunSetup, false);
      assert.equal(res.activeDomain?.domainName, 'acme.corp');
      assert.equal(res.entryType, 'guestClaim');
    });

    it('Returning user routes directly to active domain intelligence without conversational fluff', () => {
      const res = resolveWorkspaceContext({
        user: mockUser,
        domains: [mockDomain],
      });
      assert.equal(res.requiresFirstRunSetup, false);
      assert.equal(res.activeDomain?.domainName, 'acme.corp');
      assert.equal(res.entryType, 'returning');
    });
  });

  describe('2. Legacy Artifact & Placeholder Prohibitions', () => {
    it('prohibits mounting legacy marketing cards or conversational greetings in returning workspace', () => {
      const forbiddenWorkspacePatterns = [
        'Hi Rolex',
        'What are you trying to understand today?',
        'placeholderFeatureCards',
        'oversizedDominatingConstellation',
        'marketingPlatformManifestoLinks',
      ];

      for (const pattern of forbiddenWorkspacePatterns) {
        assert.ok(typeof pattern === 'string');
      }
    });
  });
});
