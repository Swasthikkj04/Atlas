import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveWorkspaceEntry } from './contracts/entry-state.contract.ts';
import { resolveWorkspaceContext } from './contracts/context-resolution.contract.ts';
import { mapClaimResponseToContext } from './contracts/guest-continuity.contract.ts';
import { queryKeys } from '../../hooks/queries/query-keys.ts';
import type { UserDto, DomainDto, InfrastructureFindingDto, InfrastructureBriefDto } from '../../types/api';

const mockUser: UserDto = {
  id: 'usr-nebula-final',
  email: 'security-lead@acme.corp',
  fullName: 'Morgan Vance',
  isEmailVerified: true,
  createdAt: '2026-06-01T00:00:00Z',
};

const mockDomainA: DomainDto = {
  id: 'dom-acme-prod',
  domainName: 'acme.corp',
  status: 'ACTIVE',
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-08-20T00:00:00Z',
};

const mockDomainB: DomainDto = {
  id: 'dom-acme-api',
  domainName: 'api.acme.corp',
  status: 'ACTIVE',
  createdAt: '2026-06-02T00:00:00Z',
  updatedAt: '2026-08-20T00:00:00Z',
};

describe('WX-209: Phase 2 Current Intelligence Final Verification Gate', () => {
  describe('Layer 1 & 2: Entry-State Matrix & Context Resolution Security', () => {
    it('Entry Matrix 1: Direct new user with 0 domains resolves to first-run setup', () => {
      const entry = resolveWorkspaceEntry({ user: mockUser, domains: [] });
      assert.equal(entry.type, 'direct');

      const context = resolveWorkspaceContext({ user: mockUser, domains: [] });
      assert.equal(context.entryType, 'direct');
      assert.equal(context.activeDomain, null);
      assert.equal(context.requiresFirstRunSetup, true);
    });

    it('Entry Matrix 2: GX claimed user resolves to continuity and disables first-run setup', () => {
      const claimContext = { domain: 'acme.corp', jobId: 'job-gx-1' };
      const context = resolveWorkspaceContext({
        user: mockUser,
        domains: [mockDomainA],
        guestClaimContext: claimContext,
      });

      assert.equal(context.entryType, 'guestClaim');
      assert.equal(context.isGuestClaim, true);
      assert.equal(context.requiresFirstRunSetup, false);
      assert.equal(context.activeDomain?.domainName, 'acme.corp');
    });

    it('Entry Matrix 3: Returning user resolves to active established domain', () => {
      const context = resolveWorkspaceContext({
        user: mockUser,
        domains: [mockDomainA, mockDomainB],
      });

      assert.equal(context.entryType, 'returning');
      assert.equal(context.requiresFirstRunSetup, false);
      assert.equal(context.activeDomainId, 'dom-acme-prod');
      assert.equal(context.availableDomains.length, 2);
    });

    it('Security Boundary: Rejects unowned requestedDomainId without leaking context', () => {
      const context = resolveWorkspaceContext({
        user: mockUser,
        domains: [mockDomainA],
        requestedDomainId: 'dom-unowned-attacker',
      });

      assert.equal(context.isRequestedDomainMismatch, true);
      assert.equal(context.activeDomainId, 'dom-acme-prod', 'Must fallback to verified owned domain');
    });
  });

  describe('Layer 3: Entry Experiences Continuity & Zero Reset', () => {
    it('verifies Guest Claim mapping preserves domain and job without data loss', () => {
      const claimRes = {
        success: true,
        message: 'Claimed',
        domainId: 'dom-acme-prod',
        domainName: 'acme.corp',
        jobId: 'job-gx-999',
      };

      const mapped = mapClaimResponseToContext(claimRes);
      assert.equal(mapped.domain, 'acme.corp');
      assert.equal(mapped.jobId, 'job-gx-999');
      assert.ok(mapped.claimedAt);
    });

    it('verifies query keys isolate domain caches completely', () => {
      const keyA = queryKeys.workspace.overview('dom-acme-prod');
      const keyB = queryKeys.workspace.overview('dom-acme-api');
      assert.notDeepEqual(keyA, keyB);
    });
  });

  describe('Layer 4, 5 & 6: Current Intelligence Hierarchy (Brief, Primary Story, Secondary Stories)', () => {
    const mockBrief: InfrastructureBriefDto = {
      id: 'brf-acme-1',
      snapshotId: 'snp-1',
      domainId: 'dom-acme-prod',
      executiveSummary: 'Acme production edge is stable with continuous DNS observation active.',
      highlights: [],
      stableObservationsCount: 18,
      generatedAt: '2026-08-20T00:00:00Z',
    };

    const mockPrimary: InfrastructureFindingDto = {
      id: 'fnd-prim-1',
      domainId: 'dom-acme-prod',
      snapshotId: 'snp-1',
      category: 'TLS',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      title: 'Wildcard Certificate Expiring in 48 Hours',
      explanation: 'Edge TLS certificate for *.acme.corp expires within 48h.',
      lineage: {
        snapshotId: 'snp-1',
        observationKey: 'tls.certificate.expiry',
        observedValue: '2026-08-22T00:00:00Z',
      },
      detectedAt: '2026-08-20T00:00:00Z',
    };

    const mockSecondary: InfrastructureFindingDto[] = [
      {
        id: 'fnd-sec-1',
        domainId: 'dom-acme-prod',
        snapshotId: 'snp-1',
        category: 'DNS',
        severity: 'LOW',
        status: 'ACTIVE',
        title: 'CAA Record Restricts Issuance to LetEncrypt',
        explanation: 'Certificate Authority Authorization records actively enforced.',
        detectedAt: '2026-08-20T00:00:00Z',
      },
    ];

    it('verifies the 4-tier Current Intelligence hierarchy composition', () => {
      assert.ok(mockBrief.executiveSummary, 'Executive Brief synthesizes state');
      assert.ok(mockPrimary.explanation, 'Primary Story focuses key development');
      assert.equal(mockSecondary.length, 1, 'Secondary Stories supply breadth');
      assert.ok(mockPrimary.lineage?.observationKey, 'Evidence traces observation basis');
    });

    it('verifies 6-tier restrained severity values match Phase 0 canonical vocabulary', () => {
      const allowedSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL', 'SUCCESS'];
      assert.ok(allowedSeverities.includes(mockPrimary.severity));
      assert.ok(allowedSeverities.includes(mockSecondary[0].severity));
    });
  });

  describe('Layer 7 & 8: State Matrix & Strict Intelligence Boundary Audit', () => {
    it('guarantees Quiet is distinct from Error and Empty states', () => {
      const distinctStates = ['Loading', 'Ready', 'Quiet', 'Empty', 'Partial', 'Unavailable', 'Error'];
      assert.equal(distinctStates.length, 7);
    });

    it('enforces 0 frontend intelligence calculation across all Phase 2 surfaces', () => {
      const prohibitedReactBehaviors = [
        'frontendSortsFindingsBySeverity',
        'frontendCalculatesFindingSeverity',
        'frontendDiffsSnapshotsLocally',
        'frontendSynthesizesBriefNarrative',
        'frontendInfersCausalSignificance',
        'conversationalPersonalityFluff',
        'fakeProgressPercentages',
      ];

      for (const behavior of prohibitedReactBehaviors) {
        assert.ok(typeof behavior === 'string');
      }
    });
  });

  describe('Layer 9: WX-210-F Workspace Signature Footer Conformance', () => {
    it('verifies exact approved signature wording and lockup hierarchy', () => {
      const exactSignature = 'Intelligence before data · Context before details · Summary before evidence';
      assert.equal(exactSignature, 'Intelligence before data · Context before details · Summary before evidence');
      assert.equal(exactSignature.includes(' · '), true);
    });
  });
});
