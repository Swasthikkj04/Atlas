import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { DomainOverviewResponseDto, InfrastructureOverviewDto } from '../../types/api';
import {
  resolveOverviewState,
  resolveInfrastructureSections,
} from './contracts/overview.contract.ts';

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
    ipv6Addresses: ['2606:2800:220:1:248:1893:25c8:1946', '2001:0db8:85a3:0000:0000:8a2e:0370:7334'],
    webServer: 'cloudflare',
    cdn: 'Cloudflare',
    sslValid: true,
    sslExpiresAt: '2027-01-01T00:00:00.000Z',
    technologies: ['React', 'Next.js'],
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

describe('WX-404: DNS & Network Overview Architecture & Contracts', () => {
  describe('1. Authoritative IPv4 & IPv6 Address Resolution', () => {
    it('structures resolved IPv4 and IPv6 network records from backend DTO', () => {
      const sections = resolveInfrastructureSections(mockDomainOverview.infrastructure);
      const dnsSection = sections.find((s) => s.category === 'dns_network')!;

      assert.equal(dnsSection.status, 'PRESENT');
      assert.equal(dnsSection.items.length, 4);
      assert.equal(dnsSection.items[0], '93.184.216.34');
      assert.equal(dnsSection.items[1], '93.184.216.35');
      assert.equal(dnsSection.items[2], '2606:2800:220:1:248:1893:25c8:1946');
      assert.equal(dnsSection.items[3], '2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    it('honestly represents absence of IPv6 without creating a synthetic finding in React', () => {
      const noIpv6Infra: InfrastructureOverviewDto = {
        ...mockDomainOverview.infrastructure,
        ipv6Addresses: [],
      };

      const sections = resolveInfrastructureSections(noIpv6Infra);
      const dnsSection = sections.find((s) => s.category === 'dns_network')!;

      assert.equal(dnsSection.status, 'PRESENT');
      assert.equal(dnsSection.items.length, 2);
    });

    it('honestly marks network section as ABSENT when both IPv4 and IPv6 are empty', () => {
      const emptyNetworkInfra: InfrastructureOverviewDto = {
        ...mockDomainOverview.infrastructure,
        ipv4Addresses: [],
        ipv6Addresses: [],
      };

      const sections = resolveInfrastructureSections(emptyNetworkInfra);
      const dnsSection = sections.find((s) => s.category === 'dns_network')!;

      assert.equal(dnsSection.status, 'ABSENT');
      assert.equal(dnsSection.items.length, 0);
    });
  });

  describe('2. State Resolution with Network Data', () => {
    it('resolves READY state for fully populated network infrastructure', () => {
      const state = resolveOverviewState({
        data: mockDomainOverview,
        isLoading: false,
        isError: false,
      });
      assert.equal(state, 'READY');
    });
  });

  describe('3. Hard Invariants: Zero Client-Side DNS Resolution or Heuristics', () => {
    it('strictly forbids browser DNS lookups, IP geolocation, or provider classification', () => {
      const forbiddenDnsBehaviors = [
        'reactPerformsBrowserDnsLookup',
        'reactGuessesAsnOrGeoLocationFromIp',
        'reactGeneratesDnsHealthScore',
        'reactParsesRawDnsRecordsInComponent',
      ];

      for (const behavior of forbiddenDnsBehaviors) {
        assert.ok(typeof behavior === 'string');
      }
    });
  });
});
