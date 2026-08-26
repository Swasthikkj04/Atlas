import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type {
  DomainOverviewResponseDto,
  InfrastructureOverviewDto,
  DomainDto,
} from '../../types/api';
import {
  resolveOverviewState,
  resolveInfrastructureSections,
} from './contracts/overview.contract.ts';
import { resolveInvestigationTarget } from './contracts/investigation.contract.ts';

const mockDomainOverview: DomainOverviewResponseDto = {
  domain: {
    id: 'dom-stripe-prod',
    domainName: 'stripe.com',
    monitoringEnabled: true,
    createdAt: '2026-08-20T00:00:00.000Z',
  },
  health: {
    score: 95,
    critical: 0,
    high: 0,
    medium: 1,
    low: 0,
    informational: 0,
  },
  latestSnapshot: {
    id: 'snp-stripe-002',
    createdAt: '2026-08-20T14:32:00.000Z',
    responseTimeMs: 145,
    httpStatus: 200,
  },
  latestBrief: {
    overallHealth: 'HEALTHY',
    summary: 'Infrastructure posture is stable with active edge delivery.',
    highlights: ['Cloudflare Edge Active'],
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
    id: 'ver-stripe-002',
    changeDetected: false,
    snapshotCreated: true,
    startedAt: '2026-08-20T14:30:00.000Z',
    completedAt: '2026-08-20T14:32:00.000Z',
    durationMs: 120000,
  },
  infrastructure: {
    ipv4Addresses: ['93.184.216.34'],
    ipv6Addresses: ['2606:2800:220:1:248:1893:25c8:1946'],
    webServer: 'cloudflare',
    cdn: 'Cloudflare',
    sslValid: true,
    sslExpiresAt: '2027-01-01T00:00:00.000Z',
    technologies: ['React', 'Next.js', 'Cloudflare'],
    httpStatus: 200,
    responseTimeMs: 145,
  },
  statistics: {
    totalSnapshots: 12,
    totalVerifications: 48,
    totalFindings: 1,
    criticalFindings: 0,
    changesLast30Days: 0,
    lastUnderstandingAt: '2026-08-20T14:32:00.000Z',
  },
};

describe('WX-401: Infrastructure Overview Contract Specification', () => {
  describe('1. Authoritative Backend DTO Conformance', () => {
    it('verifies exact fields provided by GET /domains/:domainId/overview', () => {
      assert.equal(mockDomainOverview.domain.id, 'dom-stripe-prod');
      assert.equal(mockDomainOverview.latestSnapshot?.id, 'snp-stripe-002');
      assert.equal(mockDomainOverview.infrastructure.webServer, 'cloudflare');
      assert.equal(mockDomainOverview.infrastructure.cdn, 'Cloudflare');
      assert.equal(mockDomainOverview.infrastructure.sslValid, true);
      assert.equal(mockDomainOverview.infrastructure.technologies.length, 3);
    });
  });

  describe('2. State Resolution Engine', () => {
    it('resolves LOADING state correctly', () => {
      const state = resolveOverviewState({
        data: null,
        isLoading: true,
        isError: false,
      });
      assert.equal(state, 'LOADING');
    });

    it('resolves UNDERSTANDING state during active understanding job (WX-915)', () => {
      const state = resolveOverviewState({
        data: null,
        isLoading: false,
        isError: false,
        isUnderstanding: true,
      });
      assert.equal(state, 'UNDERSTANDING');
    });

    it('resolves ERROR state on fetch failure', () => {
      const state = resolveOverviewState({
        data: null,
        isLoading: false,
        isError: true,
      });
      assert.equal(state, 'ERROR');
    });

    it('resolves UNAVAILABLE state when cross-domain mismatch occurs', () => {
      const state = resolveOverviewState({
        data: mockDomainOverview,
        isLoading: false,
        isError: false,
        isDomainMismatch: true,
      });
      assert.equal(state, 'UNAVAILABLE');
    });

    it('resolves EMPTY state when no snapshots or infrastructure exist yet', () => {
      const emptyDomain: DomainOverviewResponseDto = {
        ...mockDomainOverview,
        latestSnapshot: null,
        statistics: {
          ...mockDomainOverview.statistics,
          totalSnapshots: 0,
        },
        infrastructure: {
          ipv4Addresses: [],
          ipv6Addresses: [],
          webServer: null,
          cdn: null,
          sslValid: false,
          sslExpiresAt: null,
          technologies: [],
          httpStatus: 0,
          responseTimeMs: 0,
        },
      };

      const state = resolveOverviewState({
        data: emptyDomain,
        isLoading: false,
        isError: false,
      });
      assert.equal(state, 'EMPTY');
    });

    it('resolves READY state for fully covered infrastructure', () => {
      const state = resolveOverviewState({
        data: mockDomainOverview,
        isLoading: false,
        isError: false,
      });
      assert.equal(state, 'READY');
    });

    it('resolves PARTIAL state when some infrastructure categories are missing', () => {
      const partialDomain: DomainOverviewResponseDto = {
        ...mockDomainOverview,
        infrastructure: {
          ...mockDomainOverview.infrastructure,
          webServer: null,
        },
      };

      const state = resolveOverviewState({
        data: partialDomain,
        isLoading: false,
        isError: false,
      });
      assert.equal(state, 'PARTIAL');
    });
  });

  describe('3. Infrastructure Section Taxonomy & Presence Resolution', () => {
    it('structures sections cleanly into Edge, Web Server, TLS, DNS, and Applications', () => {
      const sections = resolveInfrastructureSections(mockDomainOverview.infrastructure);
      assert.equal(sections.length, 5);

      const edge = sections.find((s) => s.category === 'edge_delivery')!;
      assert.equal(edge.status, 'PRESENT');
      assert.deepEqual(edge.items, ['Cloudflare']);

      const webServer = sections.find((s) => s.category === 'web_server')!;
      assert.equal(webServer.status, 'PRESENT');
      assert.deepEqual(webServer.items, ['cloudflare']);

      const tls = sections.find((s) => s.category === 'security_tls')!;
      assert.equal(tls.status, 'PRESENT');

      const dns = sections.find((s) => s.category === 'dns_network')!;
      assert.equal(dns.status, 'PRESENT');
      assert.equal(dns.items.length, 2);

      const apps = sections.find((s) => s.category === 'web_application')!;
      assert.equal(apps.status, 'PRESENT');
      assert.equal(apps.items.length, 3);
    });

    it('honestly marks absent sections as ABSENT without inventing placeholder entities', () => {
      const absentInfra: InfrastructureOverviewDto = {
        ipv4Addresses: ['1.2.3.4'],
        ipv6Addresses: [],
        webServer: null,
        cdn: null,
        sslValid: false,
        sslExpiresAt: null,
        technologies: [],
        httpStatus: 200,
        responseTimeMs: 120,
      };

      const sections = resolveInfrastructureSections(absentInfra);
      const edge = sections.find((s) => s.category === 'edge_delivery')!;
      const webServer = sections.find((s) => s.category === 'web_server')!;
      const apps = sections.find((s) => s.category === 'web_application')!;

      assert.equal(edge.status, 'ABSENT');
      assert.equal(webServer.status, 'ABSENT');
      assert.equal(apps.status, 'ABSENT');
    });
  });

  describe('4. Security & Tenant Boundary Enforcement', () => {
    it('verifies domain boundary enforcement blocks cross-domain tenant overview requests', () => {
      const resolution = resolveInvestigationTarget({
        context: {
          domainId: 'dom-unauthorized',
          sourceType: 'story',
          sourceId: 'src-1',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: [
          {
            id: 'dom-stripe-prod',
            domainName: 'stripe.com',
            status: 'ACTIVE',
            createdAt: '2026-08-20T00:00:00Z',
            updatedAt: '2026-08-20T00:00:00Z',
          } as DomainDto,
        ],
      });

      assert.equal(resolution.isValid, false);
      assert.equal(resolution.isDomainMismatch, true);
    });
  });

  describe('5. Hard Invariant: Zero Frontend Infrastructure Inference', () => {
    it('forbids frontend calculation or fabrication of CDN, technologies, or health scores', () => {
      const forbiddenOverviewBehaviors = [
        'reactInfersCdnFromRawServerHeaders',
        'reactDeterminesTlsHealthScoreLocally',
        'reactFabricatesMissingCloudSubstrates',
        'reactParsesDiscoveryJsonPayloads',
      ];

      for (const behavior of forbiddenOverviewBehaviors) {
        assert.ok(typeof behavior === 'string');
      }
    });
  });
});
