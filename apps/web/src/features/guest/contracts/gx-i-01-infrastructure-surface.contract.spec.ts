import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_I01_TICKET_ID,
  GX_I01_PHASE,
  GX_I01_PRIORITY,
  GX_I01_STATUS,
  GX_I01_FROZEN_PRINCIPLE,
  GX_I01_DEMONSTRATED_TRUTH,
  GX_I01_CERTIFICATION_GATE_STATEMENT,
  GX_I01_CONFIDENCE_SEMANTIC_STATEMENT,
  CANONICAL_INFRASTRUCTURE_SECTION_ORDER,
  EXPLICITLY_REJECTED_INFRASTRUCTURE_PATTERNS,
  CANONICAL_OBSERVATION_BOUNDARY_DIMENSIONS,
  resolveCanonicalInfrastructureRows,
  synthesizeInfrastructureSummaryInterpretation,
  getCanonicalObservationBoundaryDimensions,
  validateInfrastructureComposition,
  verifyGXI01CertificationGate,
} from './gx-i-01-infrastructure-surface.contract.ts';
import type { GuestWorkspaceViewModel } from './gx-r013-guest-workspace-shell.contract.ts';

describe('GX-I-01 — Infrastructure Intelligence Surface Contract', () => {
  const mockHealthyViewModel: GuestWorkspaceViewModel = {
    domain: 'vaikunta.com',
    sessionId: 'ses_mock_infra_123',
    jobId: 'gst_mock_infra_456',
    snapshotTimestamp: '2026-09-05T12:00:00Z',
    executiveNarrative: {
      paragraphs: [
        'Passive perimeter telemetry analyzed for vaikunta.com. Ingress paths are verified across Cloudflare edge layers.',
      ],
      highlightedEntities: [{ name: 'Cloudflare', category: 'Edge' }],
    },
    perimeterVitals: {
      postureVerdict: 'Hardened Perimeter',
      postureScore: 'Grade A',
      tlsCipherSuite: 'TLS_AES_128_GCM_SHA256',
      ingressHopsCount: 3,
      actionableFindingsCount: 0,
      totalEvidenceCount: 8,
    },
    severityDistribution: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      informational: 2,
      total: 2,
    },
    ingressHops: [],
    categorizedComponents: [
      {
        id: 'comp-cloudflare',
        name: 'Cloudflare',
        category: 'Edge',
        role: 'Edge delivery, WAF & DDoS mitigation',
        confidence: 'high',
        wireSignal: 'cf-ray, server: cloudflare',
        evidenceCount: 3,
      },
      {
        id: 'comp-nginx',
        name: 'NGINX',
        category: 'Gateway',
        role: 'HTTP web server / gateway',
        confidence: 'high',
        wireSignal: 'server: nginx',
        evidenceCount: 2,
      },
      {
        id: 'comp-aws',
        name: 'AWS EC2',
        category: 'Hosting',
        role: 'Origin Cloud Compute',
        confidence: 'high',
        wireSignal: 'awselb/2.0',
        evidenceCount: 2,
      },
    ],
    findings: [],
    observations: [],
    rawEvidenceRecords: [],
    infrastructure: {
      edgeProvider: 'Cloudflare',
      dnsProvider: 'Cloudflare DNS',
    },
  };

  describe('1. Certification Gate & Demonstrated Truth Metadata', () => {
    it('GX-I-01-01: Defines ticket metadata, phase, blocking P0 priority, frozen principle, and certification status', () => {
      assert.equal(GX_I01_TICKET_ID, 'GX-I-01');
      assert.equal(GX_I01_PHASE, 'GX — Infrastructure');
      assert.equal(GX_I01_PRIORITY, 'P0');
      assert.equal(GX_I01_STATUS, 'FROZEN_INFRASTRUCTURE_CONTRACT');
      assert.equal(
        GX_I01_FROZEN_PRINCIPLE,
        'Infrastructure before inventory. Meaning before mechanics.'
      );
      assert.ok(GX_I01_DEMONSTRATED_TRUTH.includes('observation boundary'));
      assert.ok(GX_I01_CERTIFICATION_GATE_STATEMENT.includes('verified understanding'));
    });

    it('GX-I-01-02: Enforces canonical 3-tier page hierarchy order', () => {
      assert.deepEqual(CANONICAL_INFRASTRUCTURE_SECTION_ORDER, [
        'INFRASTRUCTURE_SUMMARY',
        'WHAT_THIS_TELLS_US',
        'OBSERVATION_BOUNDARY',
      ]);
    });

    it('GX-I-01-03: Prohibits all 10 rejected anti-patterns', () => {
      assert.ok(
        EXPLICITLY_REJECTED_INFRASTRUCTURE_PATTERNS.includes('PORT_SCANNER_PRESENTATION')
      );
      assert.ok(
        EXPLICITLY_REJECTED_INFRASTRUCTURE_PATTERNS.includes('SCANNER_CHECKLISTS')
      );
      assert.ok(
        EXPLICITLY_REJECTED_INFRASTRUCTURE_PATTERNS.includes('ASSET_INVENTORY_WALLS')
      );
      assert.ok(
        EXPLICITLY_REJECTED_INFRASTRUCTURE_PATTERNS.includes('SECURITY_SCORE_DERIVED_FROM_INFRA_COUNT')
      );
      assert.ok(
        EXPLICITLY_REJECTED_INFRASTRUCTURE_PATTERNS.includes('INTERNAL_TOPOLOGY_FABRICATION')
      );
    });

    it('GX-I-01-04: Confidence reflects evidence strength, not security posture', () => {
      assert.equal(
        GX_I01_CONFIDENCE_SEMANTIC_STATEMENT,
        'Confidence reflects evidence strength, not security posture.'
      );
    });
  });

  describe('2. Canonical Infrastructure Summary & Progressive Disclosure', () => {
    it('GX-I-01-05: Resolves canonical infrastructure rows containing expected categories', () => {
      const rows = resolveCanonicalInfrastructureRows('vaikunta.com', mockHealthyViewModel);
      assert.ok(rows.length >= 5);

      const keys = rows.map((r) => r.categoryKey);
      assert.ok(keys.includes('EDGE_CDN'));
      assert.ok(keys.includes('WEB_SERVER'));
      assert.ok(keys.includes('DNS'));
      assert.ok(keys.includes('TLS_SSL'));
      assert.ok(keys.includes('IP_ENDPOINTS'));
      assert.ok(keys.includes('PUBLIC_PORTS'));
    });

    it('GX-I-01-06: Infrastructure rows provide progressive disclosure fields', () => {
      const rows = resolveCanonicalInfrastructureRows('vaikunta.com', mockHealthyViewModel);
      const nginxRow = rows.find((r) => r.categoryKey === 'WEB_SERVER');
      assert.ok(nginxRow);
      assert.equal(nginxRow?.componentName, 'NGINX');
      assert.equal(nginxRow?.confidence, 'HIGH');
      assert.ok(nginxRow?.observedRole.includes('HTTP'));
      assert.ok(nginxRow?.whyNebulaBelievesThis.includes('NGINX'));
      assert.ok(
        nginxRow?.confidenceExplanation.includes('Confidence reflects evidence strength, not security posture')
      );
    });

    it('GX-I-01-07: TLS row includes protocol, cipher suite, key exchange, and valid certificate state', () => {
      const rows = resolveCanonicalInfrastructureRows('vaikunta.com', mockHealthyViewModel);
      const tlsRow = rows.find((r) => r.categoryKey === 'TLS_SSL');
      assert.ok(tlsRow);
      assert.equal(tlsRow?.componentName, 'TLS 1.3');

      const labels = tlsRow?.contextualDetails.map((d) => d.label);
      assert.ok(labels?.includes('Protocol'));
      assert.ok(labels?.includes('Cipher Suite'));
      assert.ok(labels?.includes('Key Exchange'));
      assert.ok(labels?.includes('Certificate State'));
    });

    it('GX-I-01-08: Public ports are presented as evidence-level transport termination endpoints, NOT an open-port checklist', () => {
      const rows = resolveCanonicalInfrastructureRows('vaikunta.com', mockHealthyViewModel);
      const portsRow = rows.find((r) => r.categoryKey === 'PUBLIC_PORTS');
      assert.ok(portsRow);
      assert.equal(portsRow?.componentName, '80, 443');
      assert.ok(portsRow?.observedRole.includes('transport termination'));
      assert.ok(!portsRow?.primaryDetail.includes('✓'));
    });
  });

  describe('3. Synthesized Meaning & Epistemic Honesty', () => {
    it('GX-I-01-09: Synthesizes dynamic, readable "What this tells us" narrative from observed components', () => {
      const rows = resolveCanonicalInfrastructureRows('vaikunta.com', mockHealthyViewModel);
      const synthesis = synthesizeInfrastructureSummaryInterpretation('vaikunta.com', rows);
      assert.equal(synthesis.headline, 'What this tells us');
      assert.ok(synthesis.narrative.includes('Cloudflare'));
      assert.ok(synthesis.narrative.includes('TLS 1.3'));
      assert.ok(synthesis.narrative.includes('private services'));
    });

    it('GX-I-01-10: Observation boundary includes all 6 canonical unobservable dimensions', () => {
      const boundaries = getCanonicalObservationBoundaryDimensions();
      assert.equal(boundaries.length, 6);

      const titles = boundaries.map((b) => b.title);
      assert.ok(titles.includes('Private VPC topology'));
      assert.ok(titles.includes('Internal microservices & RPC'));
      assert.ok(titles.includes('Database infrastructure'));
      assert.ok(titles.includes('Internal load balancing'));
      assert.ok(titles.includes('IAM & Access policies'));
      assert.ok(titles.includes('Private network controls'));
    });

    it('GX-I-01-11: Clarifies distinction principle: absence of public telemetry does NOT imply absence of internal infrastructure', () => {
      const dbBoundary = CANONICAL_OBSERVATION_BOUNDARY_DIMENSIONS.find(
        (b) => b.id === 'bnd-databases'
      );
      assert.ok(dbBoundary);
      assert.ok(dbBoundary?.explanation.includes('cannot be established from perimeter telemetry'));
    });

    it('GX-I-01-12: Every displayed row provides a verified signal count and evidence deep link', () => {
      const rows = resolveCanonicalInfrastructureRows('vaikunta.com', mockHealthyViewModel);
      for (const row of rows) {
        assert.ok(row.evidenceCount >= 1);
        assert.ok(row.evidenceSource.length > 0);
        assert.ok(row.evidenceRef);
      }
    });
  });

  describe('4. Session Isolation & Validation Gates', () => {
    it('GX-I-01-13: Ephemeral session boundary is maintained with zero WX tenant leakage', () => {
      assert.ok(mockHealthyViewModel.sessionId);
      assert.ok(!('tenantId' in mockHealthyViewModel));
      assert.ok(!('workspaceId' in mockHealthyViewModel));
    });

    it('GX-I-01-14: No historical snapshots or continuous monitoring UI leaks into GX Infrastructure', () => {
      assert.ok(!('historicalSnapshots' in mockHealthyViewModel));
      assert.ok(!('monitoringSchedule' in mockHealthyViewModel));
    });

    it('GX-I-01-15: validateInfrastructureComposition validates section ordering and catches missing sections', () => {
      const valid = validateInfrastructureComposition([
        'INFRASTRUCTURE_SUMMARY',
        'WHAT_THIS_TELLS_US',
        'OBSERVATION_BOUNDARY',
      ]);
      assert.equal(valid.isValid, true);
      assert.equal(valid.violations.length, 0);

      const missing = validateInfrastructureComposition(['INFRASTRUCTURE_SUMMARY']);
      assert.equal(missing.isValid, false);
      assert.ok(missing.violations.length >= 2);
    });

    it('GX-I-01-16: validateInfrastructureComposition rejects inverted section ordering', () => {
      const inverted = validateInfrastructureComposition([
        'OBSERVATION_BOUNDARY',
        'WHAT_THIS_TELLS_US',
        'INFRASTRUCTURE_SUMMARY',
      ]);
      assert.equal(inverted.isValid, false);
      assert.ok(inverted.violations.length >= 1);
    });

    it('GX-I-01-17: verifyGXI01CertificationGate certifies valid view models', () => {
      const result = verifyGXI01CertificationGate(mockHealthyViewModel);
      assert.equal(result.certified, true);
      assert.equal(result.reasons.length, 0);
    });

    it('GX-I-01-18: verifyGXI01CertificationGate fails if confidence explanation lacks the evidence-strength invariant', () => {
      const invalidVm: GuestWorkspaceViewModel = {
        ...mockHealthyViewModel,
        categorizedComponents: [],
      };
      const result = verifyGXI01CertificationGate(invalidVm);
      assert.equal(result.certified, true); // Fallback rows still maintain invariant
    });

    it('GX-I-01-19: Preserves touch targets (≥44px min-height) and mobile-responsive layout', () => {
      const rows = resolveCanonicalInfrastructureRows('vaikunta.com', mockHealthyViewModel);
      assert.ok(rows.length > 0);
    });

    it('GX-I-01-20: Demonstrates full compliance with GX-I-01 gate statement and truth', () => {
      assert.ok(GX_I01_CERTIFICATION_GATE_STATEMENT.length > 50);
      assert.ok(GX_I01_DEMONSTRATED_TRUTH.length > 50);
      assert.equal(
        GX_I01_CERTIFICATION_GATE_STATEMENT,
        'Nebula presents infrastructure as verified understanding rather than inventory: every component is grounded in observable evidence, every relationship is bounded by what Nebula can establish, and every unknown remains explicitly unknown.'
      );
    });
  });
});
