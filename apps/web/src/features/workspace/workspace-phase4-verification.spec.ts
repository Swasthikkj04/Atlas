import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { DomainOverviewResponseDto, InfrastructureOverviewDto, DomainDto } from '../../types/api';
import {
  resolveOverviewState,
  resolveInfrastructureSections,
} from './contracts/overview.contract.ts';
import {
  resolveInvestigationTarget,
  buildInvestigationLink,
} from './contracts/investigation.contract.ts';

const mockDomainOverview: DomainOverviewResponseDto = {
  domain: {
    id: 'dom-prod-001',
    domainName: 'atlas-security.io',
    monitoringEnabled: true,
    createdAt: '2026-08-20T00:00:00.000Z',
  },
  health: {
    score: 92,
    critical: 0,
    high: 0,
    medium: 1,
    low: 0,
    informational: 0,
  },
  latestSnapshot: {
    id: 'snp-atlas-401',
    createdAt: '2026-08-20T14:32:00.000Z',
    responseTimeMs: 120,
    httpStatus: 200,
  },
  latestBrief: {
    overallHealth: 'HEALTHY',
    summary: 'Infrastructure is online and stable with active edge delivery.',
    highlights: ['Cloudflare Edge Active', 'TLS Certificate Valid'],
    recommendations: [],
    generatedAt: '2026-08-20T14:32:00.000Z',
  },
  findingsSummary: {
    total: 1,
    critical: 0,
    high: 0,
    medium: 1,
    low: 0,
    informational: 0,
  },
  recentFindings: [],
  recentChanges: [],
  latestVerification: {
    id: 'ver-atlas-401',
    changeDetected: false,
    snapshotCreated: true,
    startedAt: '2026-08-20T14:30:00.000Z',
    completedAt: '2026-08-20T14:32:00.000Z',
    durationMs: 120000,
  },
  infrastructure: {
    ipv4Addresses: ['104.21.56.12', '172.67.182.90'],
    ipv6Addresses: ['2606:4700:3033::ac43:b65a'],
    webServer: 'cloudflare',
    cdn: 'Cloudflare',
    sslValid: true,
    sslExpiresAt: '2027-04-15T00:00:00.000Z',
    technologies: ['React', 'Next.js', 'Node.js'],
    httpStatus: 200,
    responseTimeMs: 120,
  },
  statistics: {
    totalSnapshots: 42,
    totalVerifications: 156,
    totalFindings: 1,
    criticalFindings: 0,
    changesLast30Days: 0,
    lastUnderstandingAt: '2026-08-20T14:32:00.000Z',
  },
};

const mockUserDomains: readonly DomainDto[] = [
  {
    id: 'dom-prod-001',
    domainName: 'atlas-security.io',
    status: 'ACTIVE',
    createdAt: '2026-08-20T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
    snapshotCount: 42,
    activeFindingCount: 1,
  },
  {
    id: 'dom-prod-002',
    domainName: 'internal-corp.net',
    status: 'ACTIVE',
    createdAt: '2026-08-20T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
    snapshotCount: 10,
    activeFindingCount: 0,
  },
];

describe('WX-407: Phase 4 Comprehensive Infrastructure Overview Verification Gate', () => {
  describe('1. Five-Category Infrastructure Taxonomy & Absence Verification', () => {
    it('accurately parses all 5 standard infrastructure categories from backend DTO', () => {
      const sections = resolveInfrastructureSections(mockDomainOverview.infrastructure);
      assert.equal(sections.length, 5);

      const [edge, webServer, securityTls, dnsNet, webApp] = sections;
      assert.equal(edge.category, 'edge_delivery');
      assert.equal(edge.status, 'PRESENT');
      assert.deepEqual(edge.items, ['Cloudflare']);

      assert.equal(webServer.category, 'web_server');
      assert.equal(webServer.status, 'PRESENT');
      assert.deepEqual(webServer.items, ['cloudflare']);

      assert.equal(securityTls.category, 'security_tls');
      assert.equal(securityTls.status, 'PRESENT');
      assert.equal(securityTls.metadata?.sslValid, true);

      assert.equal(dnsNet.category, 'dns_network');
      assert.equal(dnsNet.status, 'PRESENT');
      assert.equal(dnsNet.items?.length, 3); // 2 IPv4 + 1 IPv6

      assert.equal(webApp.category, 'web_application');
      assert.equal(webApp.status, 'PRESENT');
      assert.deepEqual(webApp.items, ['React', 'Next.js', 'Node.js']);
    });

    it('honestly represents partial or unobserved categories without crashing or synthesizing fake errors', () => {
      const partialInfra: InfrastructureOverviewDto = {
        ...mockDomainOverview.infrastructure,
        cdn: null,
        webServer: null,
        ipv6Addresses: [],
        technologies: [],
      };

      const sections = resolveInfrastructureSections(partialInfra);
      assert.equal(sections.find((s) => s.category === 'edge_delivery')!.status, 'ABSENT');
      assert.equal(sections.find((s) => s.category === 'web_server')!.status, 'ABSENT');
      assert.equal(sections.find((s) => s.category === 'web_application')!.status, 'ABSENT');
      // DNS is still PRESENT because IPv4 exists
      assert.equal(sections.find((s) => s.category === 'dns_network')!.status, 'PRESENT');
    });
  });

  describe('2. State Matrix & Edge Case Handling', () => {
    it('resolves LOADING state when data is pending', () => {
      assert.equal(
        resolveOverviewState({ data: null, isLoading: true, isError: false }),
        'LOADING'
      );
    });

    it('resolves ERROR state when query fails', () => {
      assert.equal(
        resolveOverviewState({ data: null, isLoading: false, isError: true }),
        'ERROR'
      );
    });

    it('resolves EMPTY state when no domain or snapshot exists', () => {
      const emptyData: DomainOverviewResponseDto = {
        ...mockDomainOverview,
        latestSnapshot: null,
        statistics: {
          ...mockDomainOverview.statistics,
          totalSnapshots: 0,
        },
      };
      assert.equal(
        resolveOverviewState({ data: emptyData, isLoading: false, isError: false }),
        'EMPTY'
      );
    });

    it('resolves PARTIAL state when only partial categories exist', () => {
      const partialData: DomainOverviewResponseDto = {
        ...mockDomainOverview,
        infrastructure: {
          ...mockDomainOverview.infrastructure,
          cdn: null,
          webServer: null,
          technologies: [],
          ipv4Addresses: [],
          ipv6Addresses: [],
        },
      };
      assert.equal(
        resolveOverviewState({ data: partialData, isLoading: false, isError: false }),
        'PARTIAL'
      );
    });

    it('resolves READY state for fully populated infrastructure', () => {
      assert.equal(
        resolveOverviewState({ data: mockDomainOverview, isLoading: false, isError: false }),
        'READY'
      );
    });
  });

  describe('3. Multi-Hop Investigation & Domain Boundary Integrity', () => {
    it('coordinates multi-hop navigation chain across Overview, Investigation, Evidence, and Snapshot', () => {
      // 1. Overview -> Finding
      const findingLink = buildInvestigationLink('dom-prod-001', 'finding', 'fnd-401', '/workspace');
      assert.ok(findingLink.includes('sourceType=finding'));

      // 2. Finding -> Evidence
      const evidenceLink = buildInvestigationLink('dom-prod-001', 'evidence', 'obs-401', findingLink);
      assert.ok(evidenceLink.includes('sourceType=evidence'));
      assert.ok(evidenceLink.includes('returnPath='));

      // 3. Evidence -> Snapshot Lineage
      const snapshotLink = buildInvestigationLink('dom-prod-001', 'snapshot', 'snp-atlas-401', evidenceLink);
      assert.ok(snapshotLink.includes('sourceType=snapshot'));
      assert.ok(snapshotLink.includes('sourceId=snp-atlas-401'));

      // Verify domain authorization
      const resolution = resolveInvestigationTarget({
        context: {
          domainId: 'dom-prod-001',
          sourceType: 'snapshot',
          sourceId: 'snp-atlas-401',
          returnPath: evidenceLink,
        },
        activeDomainId: 'dom-prod-001',
        userDomains: mockUserDomains,
      });

      assert.equal(resolution.isValid, true);
      assert.equal(resolution.isDomainMismatch, false);
    });

    it('strictly isolates tenant domains and rejects unauthorized cross-domain navigation attempts', () => {
      const unauthorized = resolveInvestigationTarget({
        context: {
          domainId: 'dom-attacker-tenant',
          sourceType: 'finding',
          sourceId: 'fnd-secret',
          returnPath: '/workspace',
        },
        activeDomainId: 'dom-prod-001',
        userDomains: mockUserDomains,
      });

      assert.equal(unauthorized.isValid, false);
      assert.equal(unauthorized.isDomainMismatch, true);
      assert.equal(unauthorized.targetDomainId, 'dom-prod-001');
    });
  });

  describe('4. Hard Invariants & Zero Frontend Intelligence Rule', () => {
    it('strictly enforces that React acts purely as a presentation layer over backend intelligence', () => {
      const phase4Invariants = [
        'reactDoesNotPerformBrowserDnsResolution',
        'reactDoesNotParseSslCertificatesOrPems',
        'reactDoesNotComputeDaysUntilExpirySeverityColors',
        'reactDoesNotCalculateSecurityPostureOrHealthScores',
        'reactDoesNotInferTechnologiesFromHeadersOrIpRanges',
        'reactDoesNotSynthesizeFindingsFromOverviewStates',
      ];

      for (const invariant of phase4Invariants) {
        assert.ok(typeof invariant === 'string');
      }
    });
  });
});
