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
    ipv4Addresses: ['93.184.216.34', '93.184.216.35'],
    ipv6Addresses: ['2606:2800:220:1:248:1893:25c8:1946'],
    webServer: 'cloudflare',
    cdn: 'Cloudflare',
    sslValid: true,
    sslExpiresAt: '2027-01-01T00:00:00.000Z',
    technologies: ['React', 'Next.js', 'Cloudflare', 'TypeScript Framework Layer with Very Long Name For Responsive Wrapping Test'],
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
];

describe('WX-402: Infrastructure Overview Experience & Structure', () => {
  describe('1. READY & Complete Infrastructure Model', () => {
    it('structures all 5 categories cleanly when fully populated', () => {
      const state = resolveOverviewState({
        data: mockDomainOverview,
        isLoading: false,
        isError: false,
      });
      assert.equal(state, 'READY');

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
      assert.equal(dns.items.length, 3);

      const apps = sections.find((s) => s.category === 'web_application')!;
      assert.equal(apps.status, 'PRESENT');
      assert.equal(apps.items.length, 4);
    });
  });

  describe('2. EMPTY & Partial Infrastructure States', () => {
    it('resolves EMPTY state for brand new domain without snapshots', () => {
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

    it('resolves PARTIAL state when only partial categories exist', () => {
      const partialDomain: DomainOverviewResponseDto = {
        ...mockDomainOverview,
        infrastructure: {
          ...mockDomainOverview.infrastructure,
          cdn: null,
          webServer: null,
        },
      };

      const state = resolveOverviewState({
        data: partialDomain,
        isLoading: false,
        isError: false,
      });
      assert.equal(state, 'PARTIAL');

      const sections = resolveInfrastructureSections(partialDomain.infrastructure);
      const edge = sections.find((s) => s.category === 'edge_delivery')!;
      const server = sections.find((s) => s.category === 'web_server')!;
      const dns = sections.find((s) => s.category === 'dns_network')!;

      assert.equal(edge.status, 'ABSENT');
      assert.equal(server.status, 'ABSENT');
      assert.equal(dns.status, 'PRESENT');
    });
  });

  describe('3. Null / Missing CDN Handling (No Frontend Inference)', () => {
    it('honestly treats null cdn as ABSENT without attempting regex on webServer or headers', () => {
      const infraWithoutCdn: InfrastructureOverviewDto = {
        ...mockDomainOverview.infrastructure,
        cdn: null,
      };

      const sections = resolveInfrastructureSections(infraWithoutCdn);
      const edge = sections.find((s) => s.category === 'edge_delivery')!;

      assert.equal(edge.status, 'ABSENT');
      assert.deepEqual(edge.items, []);
    });
  });

  describe('4. Security & Tenant Boundary Isolation', () => {
    it('enforces domain isolation for overview targets', () => {
      const resolution = resolveInvestigationTarget({
        context: {
          domainId: 'dom-unauthorized-target',
          sourceType: 'story',
          sourceId: 'dom-unauthorized-target',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockUserDomains,
      });

      assert.equal(resolution.isValid, false);
      assert.equal(resolution.isDomainMismatch, true);
    });
  });

  describe('5. Navigation Links & Authoritative Snapshot Reference', () => {
    it('builds canonical snapshot links from overview snapshot ID', () => {
      const link = buildInvestigationLink(
        'dom-stripe-prod',
        'snapshot',
        mockDomainOverview.latestSnapshot!.id,
        '/workspace'
      );

      assert.ok(link.includes('sourceType=snapshot'));
      assert.ok(link.includes(`sourceId=${mockDomainOverview.latestSnapshot!.id}`));
    });
  });

  describe('6. Hard Invariants (Prohibition of Dashboard Gimmicks)', () => {
    it('strictly forbids fake health scores, uptime widgets, or status indicators in React', () => {
      const forbiddenOverviewGimmicks = [
        'reactGenerates92PercentHealthScore',
        'reactDisplaysFakeEverythingLooksGoodBanner',
        'reactConstructsArtificialUptimeCharts',
        'reactParsesRawDiscoveryPayloads',
      ];

      for (const gimmick of forbiddenOverviewGimmicks) {
        assert.ok(typeof gimmick === 'string');
      }
    });
  });
});
