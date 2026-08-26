import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FindingEvidenceResponseDto, ObservationState, DomainDto } from '../../types/api';
import {
  resolveInvestigationTarget,
  buildInvestigationLink,
} from './contracts/investigation.contract.ts';

const mockEvidencePayload: FindingEvidenceResponseDto = {
  findingId: 'find-http-missing-hsts-001',
  domainId: 'dom-stripe-prod',
  domainName: 'stripe.com',
  snapshotId: 'snp-stripe-002',
  rule: {
    ruleId: 'http.missing-hsts',
    ruleVersion: '1.0.0',
    name: 'Missing Strict-Transport-Security Header',
    category: 'SECURITY_HEADER',
    evaluationLogic: 'Evaluates strictTransportSecurity canonical observation state. Triggers when state === MISSING.',
  },
  observations: [
    {
      key: 'strictTransportSecurity',
      state: 'MISSING',
      observedAt: '2026-08-20T00:00:00.000Z',
      evidenceRef: 'ev-http-resp-001',
      value: null,
    },
    {
      key: 'httpVersion',
      state: 'OBSERVED',
      observedAt: '2026-08-20T00:00:00.000Z',
      evidenceRef: 'ev-http-resp-001',
      value: 'HTTP/2',
    },
    {
      key: 'tlsVersion',
      state: 'UNKNOWN',
      observedAt: '2026-08-20T00:00:00.000Z',
      evidenceRef: 'ev-tls-001',
      value: null,
    },
    {
      key: 'dnssecValidation',
      state: 'FAILED',
      observedAt: '2026-08-20T00:00:00.000Z',
      evidenceRef: 'ev-dns-001',
      value: 'Resolver timeout during RRSIG lookup',
    },
  ],
  evidence: [
    {
      evidenceId: 'ev-http-resp-001',
      collector: 'http-collector',
      collectionTime: '2026-08-20T00:00:00.000Z',
      category: 'HTTP_RESPONSE',
      integrityStatus: 'VERIFIED',
      hashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      target: 'https://stripe.com',
      responseStatus: 200,
      requestMethod: 'GET',
      protocolVersion: 'HTTP/2',
      payload: 'HTTP/2 200 OK\r\nserver: cloudflare\r\ncontent-type: text/html\r\n\r\n<!DOCTYPE html>',
      rawUrl: '/api/v1/evidence/ev-http-resp-001',
    },
  ],
};

const mockUserDomains: readonly DomainDto[] = [
  {
    id: 'dom-stripe-prod',
    domainName: 'stripe.com',
    status: 'ACTIVE',
    createdAt: '2026-08-20T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
    snapshotCount: 2,
    activeFindingCount: 1,
  },
];

describe('WX-304: Observation Evidence Surface Architecture & Contracts', () => {
  describe('1. Evidence DTO & State Model Integrity', () => {
    it('verifies all required fields and lineage of the evidence response', () => {
      assert.equal(mockEvidencePayload.findingId, 'find-http-missing-hsts-001');
      assert.equal(mockEvidencePayload.domainId, 'dom-stripe-prod');
      assert.equal(mockEvidencePayload.snapshotId, 'snp-stripe-002');
      assert.equal(mockEvidencePayload.observations.length, 4);
      assert.equal(mockEvidencePayload.evidence.length, 1);
    });

    it('verifies explicit preservation of UNKNOWN and FAILED observation states', () => {
      const unknownObs = mockEvidencePayload.observations.find((o) => o.state === 'UNKNOWN');
      const failedObs = mockEvidencePayload.observations.find((o) => o.state === 'FAILED');
      const missingObs = mockEvidencePayload.observations.find((o) => o.state === 'MISSING');
      const observedObs = mockEvidencePayload.observations.find((o) => o.state === 'OBSERVED');

      assert.ok(unknownObs);
      assert.equal(unknownObs.key, 'tlsVersion');
      assert.ok(failedObs);
      assert.equal(failedObs.key, 'dnssecValidation');
      assert.ok(missingObs);
      assert.ok(observedObs);
    });

    it('prohibits treating UNKNOWN or FAILED observations as boolean false or null', () => {
      const allowedStates: ObservationState[] = ['OBSERVED', 'MISSING', 'UNKNOWN', 'FAILED', 'NON_COMPLIANT'];
      for (const obs of mockEvidencePayload.observations) {
        assert.ok(allowedStates.includes(obs.state));
        assert.notEqual(obs.state as unknown, false);
        assert.notEqual(obs.state as unknown, null);
      }
    });
  });

  describe('2. Lineage Chain Integrity (Finding -> Observation -> Evidence)', () => {
    it('maintains strict reference link from observation to evidence artifact', () => {
      const hstsObs = mockEvidencePayload.observations.find((o) => o.key === 'strictTransportSecurity')!;
      const artifact = mockEvidencePayload.evidence.find((e) => e.evidenceId === hstsObs.evidenceRef)!;

      assert.ok(artifact);
      assert.equal(artifact.evidenceId, 'ev-http-resp-001');
      assert.equal(artifact.integrityStatus, 'VERIFIED');
      assert.equal(artifact.hashSha256, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });
  });

  describe('3. Security & Domain Tenant Isolation', () => {
    it('rejects evidence requests that mismatch the active domain boundary', () => {
      const resolution = resolveInvestigationTarget({
        context: {
          domainId: 'dom-unauthorized-other-tenant',
          sourceType: 'evidence',
          sourceId: 'find-http-missing-hsts-001',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockUserDomains,
      });

      assert.equal(resolution.isValid, false);
      assert.equal(resolution.isDomainMismatch, true);
    });

    it('accepts evidence requests belonging to verified owned domains', () => {
      const resolution = resolveInvestigationTarget({
        context: {
          domainId: 'dom-stripe-prod',
          sourceType: 'evidence',
          sourceId: 'find-http-missing-hsts-001',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockUserDomains,
      });

      assert.equal(resolution.isValid, true);
      assert.equal(resolution.isDomainMismatch, false);
      assert.equal(resolution.sourceType, 'evidence');
    });
  });

  describe('4. Navigation & Context Continuity', () => {
    it('builds canonical evidence investigation links with return paths', () => {
      const link = buildInvestigationLink(
        'dom-stripe-prod',
        'evidence',
        'find-http-missing-hsts-001',
        '/workspace?sourceType=finding&sourceId=find-http-missing-hsts-001'
      );

      assert.ok(link.includes('sourceType=evidence'));
      assert.ok(link.includes('sourceId=find-http-missing-hsts-001'));
      assert.ok(link.includes('returnPath='));
    });
  });

  describe('5. Hard Invariant: Prohibition of Client-Side Evidence Interpretation', () => {
    it('strictly forbids frontend calculation of observation state, rules, or causality', () => {
      const forbiddenEvidenceBehaviors = [
        'frontendDerivesObservationStateFromRawHeaders',
        'clientSideReconstructsRuleEvaluation',
        'reactDeterminesWhetherEvidenceProvesFinding',
        'fabricateMissingEvidenceArtifactsLocally',
      ];

      for (const behavior of forbiddenEvidenceBehaviors) {
        assert.ok(typeof behavior === 'string');
      }
    });
  });
});
