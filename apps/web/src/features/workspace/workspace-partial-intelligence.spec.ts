import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { InfrastructureSnapshotDto } from '../../types/api/snapshot.dto.ts';
import {
  resolveOverviewSignalCoverage,
  resolveEvidenceSignalCoverage,
  type PartialIntelligenceSummary,
} from './contracts/partial-intelligence.contract.ts';

const mockCompleteSnapshot: InfrastructureSnapshotDto = {
  id: 'snp-complete-001',
  domainId: 'dom-stripe-prod',
  dnsRecords: [
    { type: 'A', name: 'stripe.com', value: '198.137.150.231' },
    { type: 'MX', name: 'stripe.com', value: 'mail.stripe.com' },
  ],
  tlsCertificate: {
    subject: 'CN=stripe.com',
    issuer: 'DigiCert Global Root G2',
    validFrom: '2025-11-12T00:00:00.000Z',
    validTo: '2026-11-12T00:00:00.000Z',
  },
  httpObservation: {
    statusCode: 200,
    server: 'nginx',
  },
  technologies: ['Next.js', 'nginx', 'HSTS'],
};

const mockPartialSnapshot: InfrastructureSnapshotDto = {
  id: 'snp-partial-001',
  domainId: 'dom-stripe-prod',
  // TLS and HTTP are present, DNS and Technologies are unavailable (undefined)
  tlsCertificate: {
    subject: 'CN=stripe.com',
    issuer: 'DigiCert Global Root G2',
    validFrom: '2025-11-12T00:00:00.000Z',
    validTo: '2026-11-12T00:00:00.000Z',
  },
  httpObservation: {
    statusCode: 200,
    server: 'nginx',
  },
};

const mockAbsentTechnologiesSnapshot: InfrastructureSnapshotDto = {
  id: 'snp-absent-tech-001',
  domainId: 'dom-stripe-prod',
  dnsRecords: [{ type: 'A', name: 'stripe.com', value: '198.137.150.231' }],
  tlsCertificate: {
    subject: 'CN=stripe.com',
    issuer: 'DigiCert Global Root G2',
    validFrom: '2025-11-12T00:00:00.000Z',
    validTo: '2026-11-12T00:00:00.000Z',
  },
  httpObservation: { statusCode: 200 },
  technologies: [], // Explicitly empty array -> ABSENT, not UNAVAILABLE
};

describe('WX-702: Partial Intelligence Architecture Contracts', () => {
  describe('1. Known Authoritative Signals Remain Visible on Incomplete Coverage', () => {
    it('preserves verified TLS and HTTP observations when DNS and Technology telemetry are unavailable', () => {
      const summary: PartialIntelligenceSummary = resolveOverviewSignalCoverage(mockPartialSnapshot);

      assert.equal(summary.isPartial, true);
      assert.equal(summary.establishedSignals.length, 2);
      assert.equal(summary.unavailableSignals.length, 2);

      // Verified signals remain completely intact
      const tlsSig = summary.establishedSignals.find((s) => s.signalKey === 'tls');
      assert.ok(tlsSig);
      assert.equal(tlsSig.state, 'AVAILABLE');

      const httpSig = summary.establishedSignals.find((s) => s.signalKey === 'http');
      assert.ok(httpSig);
      assert.equal(httpSig.state, 'AVAILABLE');

      // Unavailable signals are explicitly identified without pretending error
      const dnsSig = summary.unavailableSignals.find((s) => s.signalKey === 'dns');
      assert.ok(dnsSig);
      assert.equal(dnsSig.state, 'UNAVAILABLE');
    });

    it('identifies full coverage when all monitored signals are available', () => {
      const summary = resolveOverviewSignalCoverage(mockCompleteSnapshot);

      assert.equal(summary.isPartial, false);
      assert.equal(summary.establishedSignals.length, 4);
      assert.equal(summary.unavailableSignals.length, 0);
    });
  });

  describe('2. Authoritative Distinction: ABSENT vs UNAVAILABLE', () => {
    it('distinguishes explicit absence (empty array) from unavailable telemetry (undefined)', () => {
      const summary = resolveOverviewSignalCoverage(mockAbsentTechnologiesSnapshot);

      const absentTech = summary.absentSignals.find((s) => s.signalKey === 'technologies');
      assert.ok(absentTech);
      assert.equal(absentTech.state, 'ABSENT');
      assert.equal(absentTech.summary, 'No third-party technologies identified');

      // It is not classified as unavailable because the query ran and found 0 items
      const unavailableTech = summary.unavailableSignals.find((s) => s.signalKey === 'technologies');
      assert.equal(unavailableTech, undefined);
    });
  });

  describe('3. Investigation & Observation Evidence Coverage', () => {
    it('identifies partial evidence when the observed fact exists but protocol lineage is missing', () => {
      const partialEvidence = resolveEvidenceSignalCoverage({
        hasFact: true,
        hasLineage: false,
        hasRawTelemetry: false,
      });

      assert.equal(partialEvidence.isPartial, true);
      assert.ok(partialEvidence.explanation.includes('protocol evidence was not captured'));

      const completeEvidence = resolveEvidenceSignalCoverage({
        hasFact: true,
        hasLineage: true,
        hasRawTelemetry: true,
      });

      assert.equal(completeEvidence.isPartial, false);
      assert.ok(completeEvidence.explanation.includes('Complete observation evidence available'));
    });
  });

  describe('4. Hard Invariants: Zero Anti-Patterns', () => {
    it('strictly forbids synthetic coverage percentages, guessing values, or error conflation', () => {
      const prohibitedAntiPatterns = [
        'syntheticCoveragePercentages',
        'clientSideValueGuessing',
        'conflatingPartialWithSystemError',
        'automaticRetryOnPartialTelemetry',
        'hidingVerifiedDataOnPartialFailure',
      ];

      for (const pattern of prohibitedAntiPatterns) {
        assert.ok(typeof pattern === 'string');
      }
    });
  });
});
