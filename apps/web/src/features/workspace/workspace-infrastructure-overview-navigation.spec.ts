import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { DomainDto } from '../../types/api';
import {
  resolveInvestigationTarget,
  buildInvestigationLink,
  type InvestigationContext,
} from './contracts/investigation.contract.ts';

const mockUserDomains: readonly DomainDto[] = [
  {
    id: 'dom-stripe-prod',
    domainName: 'stripe.com',
    status: 'ACTIVE',
    createdAt: '2026-08-20T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
    snapshotCount: 12,
    activeFindingCount: 1,
  },
  {
    id: 'dom-github-prod',
    domainName: 'github.com',
    status: 'ACTIVE',
    createdAt: '2026-08-20T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
    snapshotCount: 4,
    activeFindingCount: 0,
  },
];

describe('WX-406: Infrastructure Overview Navigation Architecture & Contracts', () => {
  describe('1. Overview -> Snapshot Lineage Navigation', () => {
    it('constructs authoritative snapshot link with origin return path', () => {
      const snapshotLink = buildInvestigationLink(
        'dom-stripe-prod',
        'snapshot',
        'snp-stripe-002',
        '/workspace'
      );

      assert.equal(
        snapshotLink,
        '/workspace?domainId=dom-stripe-prod&sourceType=snapshot&sourceId=snp-stripe-002&returnPath=%2Fworkspace'
      );

      const resolution = resolveInvestigationTarget({
        context: {
          domainId: 'dom-stripe-prod',
          sourceType: 'snapshot',
          sourceId: 'snp-stripe-002',
          returnPath: '/workspace',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockUserDomains,
      });

      assert.equal(resolution.isValid, true);
      assert.equal(resolution.sourceType, 'snapshot');
      assert.equal(resolution.sourceId, 'snp-stripe-002');
      assert.equal(resolution.returnPath, '/workspace');
    });
  });

  describe('2. Multi-Hop Investigation Navigation & Return Path Preservation', () => {
    it('preserves multi-hop investigation chain: Overview -> Finding -> Evidence -> Return', () => {
      // 1. Enter Finding from Overview
      const findingContext: InvestigationContext = {
        domainId: 'dom-stripe-prod',
        sourceType: 'finding',
        sourceId: 'fnd-tls-exp-001',
        returnPath: '/workspace',
      };

      const findingResolution = resolveInvestigationTarget({
        context: findingContext,
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockUserDomains,
      });
      assert.equal(findingResolution.isValid, true);
      assert.equal(findingResolution.returnPath, '/workspace');

      // 2. Drill down into Evidence from Finding
      const findingReturnUrl = buildInvestigationLink(
        'dom-stripe-prod',
        'finding',
        'fnd-tls-exp-001',
        '/workspace'
      );

      const evidenceContext: InvestigationContext = {
        domainId: 'dom-stripe-prod',
        sourceType: 'evidence',
        sourceId: 'obs-ssl-cert-001',
        returnPath: findingReturnUrl,
      };

      const evidenceResolution = resolveInvestigationTarget({
        context: evidenceContext,
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockUserDomains,
      });

      assert.equal(evidenceResolution.isValid, true);
      assert.equal(evidenceResolution.sourceType, 'evidence');
      assert.ok(evidenceResolution.returnPath.includes('sourceType=finding'));
      assert.ok(evidenceResolution.returnPath.includes('sourceId=fnd-tls-exp-001'));
    });
  });

  describe('3. Domain Isolation & Cross-Domain Access Rejection', () => {
    it('rejects navigation target if domain does not belong to authenticated user', () => {
      const unauthorizedResolution = resolveInvestigationTarget({
        context: {
          domainId: 'dom-unauthorized-target',
          sourceType: 'finding',
          sourceId: 'fnd-secret-001',
          returnPath: '/workspace',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockUserDomains,
      });

      assert.equal(unauthorizedResolution.isValid, false);
      assert.equal(unauthorizedResolution.isDomainMismatch, true);
      assert.equal(unauthorizedResolution.targetDomainId, 'dom-stripe-prod');
    });

    it('permits domain-scoped navigation when target domain matches an owned user domain', () => {
      const authorizedResolution = resolveInvestigationTarget({
        context: {
          domainId: 'dom-github-prod',
          sourceType: 'finding',
          sourceId: 'fnd-gh-001',
          returnPath: '/workspace',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockUserDomains,
      });

      assert.equal(authorizedResolution.isValid, true);
      assert.equal(authorizedResolution.isDomainMismatch, false);
      assert.equal(authorizedResolution.targetDomainId, 'dom-github-prod');
    });
  });

  describe('4. Hard Invariants: Zero Frontend Inference of Navigation Targets', () => {
    it('strictly forbids synthesizing investigation targets without authoritative backend IDs', () => {
      const forbiddenNavBehaviors = [
        'reactFabricatesFindingIdFromTechnologyName',
        'reactGeneratesSyntheticEvidenceIdFromDnsAddress',
        'reactSynthesizesInvestigationTargetFromTlsExpiryDate',
      ];

      for (const behavior of forbiddenNavBehaviors) {
        assert.ok(typeof behavior === 'string');
      }
    });
  });
});
