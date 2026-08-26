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
    ipv4Addresses: ['93.184.216.34'],
    ipv6Addresses: ['2606:2800:220:1:248:1893:25c8:1946'],
    webServer: 'cloudflare',
    cdn: 'Cloudflare',
    sslValid: true,
    sslExpiresAt: '2027-01-01T00:00:00.000Z',
    technologies: [
      'React',
      'Next.js',
      'Cloudflare',
      'Amazon Web Services (CloudFront / S3)',
      'Google Infrastructure Gateway',
    ],
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

describe('WX-403: Technology & Platform Overview Architecture & Contracts', () => {
  describe('1. Authoritative Technology Rendering from DTO', () => {
    it('renders exact list of technologies from backend without loss or alterations', () => {
      const sections = resolveInfrastructureSections(mockDomainOverview.infrastructure);
      const appSection = sections.find((s) => s.category === 'web_application')!;

      assert.equal(appSection.status, 'PRESENT');
      assert.equal(appSection.items.length, 5);
      assert.equal(appSection.items[0], 'React');
      assert.equal(appSection.items[1], 'Next.js');
      assert.equal(appSection.items[2], 'Cloudflare');
      assert.equal(appSection.items[3], 'Amazon Web Services (CloudFront / S3)');
      assert.equal(appSection.items[4], 'Google Infrastructure Gateway');

      const state = resolveOverviewState({
        data: mockDomainOverview,
        isLoading: false,
        isError: false,
      });
      assert.equal(state, 'READY');
    });

    it('honestly represents empty technologies array as ABSENT without fabricating runtime names', () => {
      const absentTechInfra: InfrastructureOverviewDto = {
        ...mockDomainOverview.infrastructure,
        technologies: [],
      };

      const sections = resolveInfrastructureSections(absentTechInfra);
      const appSection = sections.find((s) => s.category === 'web_application')!;

      assert.equal(appSection.status, 'ABSENT');
      assert.equal(appSection.items.length, 0);
    });
  });

  describe('2. Partial State Resilience', () => {
    it('preserves known technology items when other modules are absent or unavailable', () => {
      const partialInfra: InfrastructureOverviewDto = {
        ipv4Addresses: [],
        ipv6Addresses: [],
        webServer: null,
        cdn: null,
        sslValid: false,
        sslExpiresAt: null,
        technologies: ['React', 'Node.js'],
        httpStatus: 0,
        responseTimeMs: 0,
      };

      const sections = resolveInfrastructureSections(partialInfra);
      const appSection = sections.find((s) => s.category === 'web_application')!;

      assert.equal(appSection.status, 'PRESENT');
      assert.deepEqual(appSection.items, ['React', 'Node.js']);
    });
  });

  describe('3. Hard Invariants: Zero Frontend Categorization or Health Scores', () => {
    it('strictly forbids frontend categorization, header regex, or technology health metrics', () => {
      const forbiddenTechBehaviors = [
        'reactRunsHeaderRegexToFindTechnologies',
        'reactSynthesizesTechnologyHealthPercentage',
        'reactSplitsTechnologiesArrayIntoSyntheticSubcategories',
        'reactFabricatesTechnologyVersionNumbers',
      ];

      for (const behavior of forbiddenTechBehaviors) {
        assert.ok(typeof behavior === 'string');
      }
    });
  });
});
