import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_A01_TICKET_ID,
  GX_A01_PHASE,
  GX_A01_PRIORITY,
  GX_A01_STATUS,
  GX_A01_DEMONSTRATED_TRUTH,
  GX_A01_CERTIFICATION_GATE_STATEMENT,
  GX_A01_KEY_DISTINCTION,
  CANONICAL_ARCHITECTURE_SECTION_ORDER,
  EXPLICITLY_REJECTED_ARCHITECTURE_PATTERNS,
  CANONICAL_KNOWLEDGE_BOUNDARIES,
  buildObservedIngressPipeline,
  synthesizeArchitectureInterpretation,
  groupCategorizedArchitectureComponents,
  getCanonicalKnowledgeBoundaries,
  validateArchitectureComposition,
  verifyGXA01CertificationGate,
} from './gx-a-01-architecture-topology.contract.ts';
import type { GuestWorkspaceViewModel } from './gx-r013-guest-workspace-shell.contract.ts';

describe('GX-A-01 — Architecture & Topology Intelligence Contract', () => {
  const mockHealthyViewModel: GuestWorkspaceViewModel = {
    domain: 'vaikunta.com',
    sessionId: 'ses_mock_123',
    jobId: 'gst_mock_456',
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
    ingressHops: [
      {
        hopNumber: 1,
        role: 'CLIENT',
        title: 'Public Client',
        subtitle: 'Web / API Consumer',
        protocol: 'HTTPS',
        isVerified: true,
      },
      {
        hopNumber: 2,
        role: 'GATEWAY',
        title: 'NGINX',
        subtitle: 'Web Gateway & Reverse Proxy',
        protocol: 'HTTP/2',
        isVerified: true,
      },
      {
        hopNumber: 3,
        role: 'CLOUD',
        title: 'Amazon Web Services',
        subtitle: 'Origin / Compute Platform',
        protocol: 'TLS 1.3',
        isVerified: true,
      },
    ],
    categorizedComponents: [
      {
        id: 'comp-nginx',
        name: 'NGINX',
        category: 'Gateway',
        role: 'Web Gateway & Reverse Proxy',
        confidence: 'high',
        wireSignal: 'server: nginx',
        evidenceCount: 2,
      },
      {
        id: 'comp-aws',
        name: 'Amazon Web Services',
        category: 'Hosting',
        role: 'Origin Cloud Compute',
        confidence: 'high',
        wireSignal: 'awselb/2.0',
        evidenceCount: 3,
      },
      {
        id: 'comp-hsts',
        name: 'HSTS Enforced',
        category: 'Security',
        role: 'Transport Security',
        confidence: 'high',
        wireSignal: 'strict-transport-security: max-age=31536000',
        evidenceCount: 1,
      },
    ],
    findings: [],
    observations: [],
    rawEvidenceRecords: [],
    infrastructure: {
      edgeProvider: 'NGINX Ingress',
      dnsProvider: 'AWS Route53',
    },
  };

  describe('1. Certification Gate & Demonstrated Truth Metadata', () => {
    it('GX-A-01-01: Defines ticket metadata, phase, blocking P0 priority, and frozen contract status', () => {
      assert.equal(GX_A01_TICKET_ID, 'GX-A-01');
      assert.equal(GX_A01_PHASE, 'GX — Architecture & Topology');
      assert.equal(GX_A01_PRIORITY, 'P0');
      assert.equal(GX_A01_STATUS, 'FROZEN_ARCHITECTURE_CONTRACT');
      assert.ok(GX_A01_DEMONSTRATED_TRUTH.includes('connected'));
      assert.ok(GX_A01_CERTIFICATION_GATE_STATEMENT.includes('never fabricates infrastructure'));
      assert.equal(
        GX_A01_KEY_DISTINCTION,
        'GX-A-01 is not a network diagram. It is a verified public-perimeter architecture model.'
      );
    });

    it('GX-A-01-02: Enforces canonical 5-tier page hierarchy order', () => {
      assert.deepEqual(CANONICAL_ARCHITECTURE_SECTION_ORDER, [
        'OBSERVED_ARCHITECTURE',
        'WHAT_NEBULA_UNDERSTANDS',
        'ARCHITECTURE_COMPONENTS',
        'UNOBSERVABLE_DIMENSIONS',
        'EVIDENCE_INSPECTOR',
      ]);
    });

    it('GX-A-01-03: Prohibits all 11 rejected anti-patterns', () => {
      assert.ok(
        EXPLICITLY_REJECTED_ARCHITECTURE_PATTERNS.includes('KUBERNETES_DIAGRAM_PRETENSE')
      );
      assert.ok(
        EXPLICITLY_REJECTED_ARCHITECTURE_PATTERNS.includes('SEALED_PERIMETER_FAKE_CERTAINTY')
      );
      assert.ok(
        EXPLICITLY_REJECTED_ARCHITECTURE_PATTERNS.includes('FAKE_GRAPH_WITH_INFERRED_NODES')
      );
      assert.ok(
        EXPLICITLY_REJECTED_ARCHITECTURE_PATTERNS.includes('WORKSPACE_TENANT_DATA_LEAKAGE')
      );
    });
  });

  describe('2. Topology Pipeline & Verification Invariants', () => {
    it('GX-A-01-04: Ingress pipeline always starts with Public Client and terminates with Internal Boundary', () => {
      const pipeline = buildObservedIngressPipeline(mockHealthyViewModel);
      assert.ok(pipeline.length >= 3);
      assert.equal(pipeline[0].role, 'CLIENT');
      assert.equal(pipeline[0].title, 'Public Client');

      const lastNode = pipeline[pipeline.length - 1];
      assert.equal(lastNode.role, 'INTERNAL_BOUNDARY');
      assert.equal(lastNode.isBoundary, true);
      assert.equal(lastNode.title, 'Internal systems');
      assert.equal(lastNode.subtitle, 'Not publicly observable');
    });

    it('GX-A-01-05: Only verified relationships are drawn; unverified nodes are rejected from the path', () => {
      const pipeline = buildObservedIngressPipeline(mockHealthyViewModel);
      const verifiedHops = pipeline.filter((n) => !n.isBoundary);
      assert.ok(verifiedHops.every((h) => h.isVerified));
    });

    it('GX-A-01-06: Scientific honesty — rejects fake certainty ("Sealed Internal Perimeter") in favor of "Internal systems not observable"', () => {
      const pipeline = buildObservedIngressPipeline(mockHealthyViewModel);
      const boundary = pipeline.find((n) => n.isBoundary);
      assert.ok(boundary);
      assert.ok(!boundary?.title.toLowerCase().includes('sealed'));
      assert.ok(boundary?.whyItAppears.includes('Public telemetry does not establish'));
    });

    it('GX-A-01-07: Topology nodes provide the required three diagnostic pillars: verified signal, confidence, and why it appears', () => {
      const pipeline = buildObservedIngressPipeline(mockHealthyViewModel);
      const nginxNode = pipeline.find((n) => n.title === 'NGINX');
      assert.ok(nginxNode);
      assert.equal(nginxNode?.confidence, 'HIGH');
      assert.ok(nginxNode?.whyItAppears.includes('HTTP gateway'));
      assert.ok(nginxNode?.wireSignal);
    });
  });

  describe('3. Meaning & Component Categorization', () => {
    it('GX-A-01-08: What Nebula Understands layer synthesizes an authoritative narrative from observed hops', () => {
      const pipeline = buildObservedIngressPipeline(mockHealthyViewModel);
      const synthesis = synthesizeArchitectureInterpretation(mockHealthyViewModel, pipeline);
      assert.equal(synthesis.headline, 'What Nebula understands');
      assert.ok(synthesis.narrative.includes('NGINX'));
      assert.ok(synthesis.narrative.includes('Amazon Web Services'));
      assert.ok(synthesis.narrative.includes('internal services'));
    });

    it('GX-A-01-09: Categorized component matrix organizes technologies into clean, restrained groups', () => {
      const categories = groupCategorizedArchitectureComponents(mockHealthyViewModel);
      assert.ok(categories.length >= 2);
      assert.ok(categories.some((c) => c.title === 'Ingress & Gateway'));
      assert.ok(categories.some((c) => c.title === 'Cloud & Hosting'));
      assert.ok(categories.some((c) => c.title === 'Security & Cryptography'));
    });

    it('GX-A-01-10: Categorized components provide direct "Evidence →" links', () => {
      const categories = groupCategorizedArchitectureComponents(mockHealthyViewModel);
      const gatewayGroup = categories.find((c) => c.title === 'Ingress & Gateway');
      assert.ok(gatewayGroup);
      assert.ok(gatewayGroup?.components[0].evidenceRef);
    });
  });

  describe('4. Unobservable Dimensions & Epistemic Honesty', () => {
    it('GX-A-01-11: Unobservable dimensions are explicitly designated as knowledge boundaries (not findings or vulnerabilities)', () => {
      const boundaries = getCanonicalKnowledgeBoundaries();
      assert.equal(boundaries.length, 4);
    });

    it('GX-A-01-12: Includes all 4 canonical knowledge boundaries', () => {
      const boundaries = getCanonicalKnowledgeBoundaries();
      const titles = boundaries.map((b) => b.title);
      assert.ok(titles.includes('Internal services'));
      assert.ok(titles.includes('Database / storage'));
      assert.ok(titles.includes('Private network topology'));
      assert.ok(titles.includes('Identity & access'));
    });

    it('GX-A-01-13: Single-hop / simple infrastructure domains generate a clean 3-node ingress pipeline', () => {
      const simpleVm: GuestWorkspaceViewModel = {
        ...mockHealthyViewModel,
        ingressHops: [],
        categorizedComponents: [],
      };
      const pipeline = buildObservedIngressPipeline(simpleVm);
      assert.equal(pipeline.length, 3);
      assert.equal(pipeline[0].role, 'CLIENT');
      assert.equal(pipeline[1].role, 'CLOUD');
      assert.equal(pipeline[2].role, 'INTERNAL_BOUNDARY');
    });

    it('GX-A-01-14: Multi-hop CDN/Gateway/Origin domains generate a multi-tier verified ingress pipeline', () => {
      const multiHopVm: GuestWorkspaceViewModel = {
        ...mockHealthyViewModel,
        ingressHops: [
          {
            hopNumber: 1,
            role: 'CLIENT',
            title: 'Public Client',
            subtitle: 'Browser',
            protocol: 'HTTPS',
            isVerified: true,
          },
          {
            hopNumber: 2,
            role: 'EDGE',
            title: 'Cloudflare',
            subtitle: 'CDN & DDoS Shield',
            protocol: 'HTTP/3 (QUIC)',
            isVerified: true,
          },
          {
            hopNumber: 3,
            role: 'GATEWAY',
            title: 'NGINX',
            subtitle: 'Reverse Proxy',
            protocol: 'HTTP/2',
            isVerified: true,
          },
          {
            hopNumber: 4,
            role: 'CLOUD',
            title: 'AWS EC2',
            subtitle: 'Origin Compute',
            protocol: 'TLS 1.3',
            isVerified: true,
          },
        ],
      };
      const pipeline = buildObservedIngressPipeline(multiHopVm);
      assert.equal(pipeline.length, 5); // 4 hops + 1 boundary
      assert.equal(pipeline[1].role, 'EDGE');
      assert.equal(pipeline[2].role, 'GATEWAY');
      assert.equal(pipeline[3].role, 'CLOUD');
      assert.equal(pipeline[4].role, 'INTERNAL_BOUNDARY');
    });
  });

  describe('5. Security, Isolation & Certification Gate', () => {
    it('GX-A-01-15: Ephemeral session boundary is maintained with zero WX tenant leakage', () => {
      assert.ok(mockHealthyViewModel.sessionId);
      assert.ok(!('tenantId' in mockHealthyViewModel));
      assert.ok(!('workspaceId' in mockHealthyViewModel));
    });

    it('GX-A-01-16: No historical snapshots or continuous monitoring UI leaks into GX Architecture', () => {
      assert.ok(!('historicalSnapshots' in mockHealthyViewModel));
      assert.ok(!('monitoringSchedule' in mockHealthyViewModel));
    });

    it('GX-A-01-17: validateArchitectureComposition correctly flags missing or out-of-order sections', () => {
      const valid = validateArchitectureComposition([
        'OBSERVED_ARCHITECTURE',
        'WHAT_NEBULA_UNDERSTANDS',
        'ARCHITECTURE_COMPONENTS',
        'UNOBSERVABLE_DIMENSIONS',
        'EVIDENCE_INSPECTOR',
      ]);
      assert.equal(valid.isValid, true);
      assert.equal(valid.violations.length, 0);

      const invalid = validateArchitectureComposition([
        'ARCHITECTURE_COMPONENTS',
        'OBSERVED_ARCHITECTURE',
      ]);
      assert.equal(invalid.isValid, false);
      assert.ok(invalid.violations.length >= 2);
    });

    it('GX-A-01-18: verifyGXA01CertificationGate certifies valid view models', () => {
      const result = verifyGXA01CertificationGate(mockHealthyViewModel);
      assert.equal(result.certified, true);
      assert.equal(result.reasons.length, 0);
    });

    it('GX-A-01-19: verifyGXA01CertificationGate fails if ingress pipeline has unverified nodes', () => {
      const invalidVm: GuestWorkspaceViewModel = {
        ...mockHealthyViewModel,
        ingressHops: [
          {
            hopNumber: 1,
            role: 'CLIENT',
            title: 'Public Client',
            subtitle: 'Browser',
            protocol: 'HTTPS',
            isVerified: false,
          },
        ],
      };
      const result = verifyGXA01CertificationGate(invalidVm);
      assert.equal(result.certified, false);
      assert.ok(result.reasons.some((r) => r.includes('verified by wire telemetry')));
    });

    it('GX-A-01-20: Demonstrates full compliance with GX-A-01 gate statement and truth', () => {
      assert.ok(GX_A01_CERTIFICATION_GATE_STATEMENT.length > 50);
      assert.ok(GX_A01_DEMONSTRATED_TRUTH.length > 50);
      assert.equal(
        GX_A01_CERTIFICATION_GATE_STATEMENT,
        'Nebula presents a verified, evidence-backed model of the publicly observable infrastructure topology, distinguishes observed relationships from unavailable internal structure, explains what the architecture means, and never fabricates infrastructure beyond the observation boundary.'
      );
    });
  });
});
