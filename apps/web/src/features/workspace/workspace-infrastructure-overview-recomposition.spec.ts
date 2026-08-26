import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_TRUTH_MATRIX,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import {
  resolveCompactInfrastructure,
} from './contracts/compact-infrastructure.contract.ts';
import type { DomainOverviewResponseDto, InfrastructureOverviewDto } from '../../types/api/overview.dto.ts';

const mockDomainId = 'dom-ding-prod';
const mockDomainName = 'ding.com';

const mockFullInfra: InfrastructureOverviewDto = {
  ipv4Addresses: ['104.26.10.23', '104.26.11.23'],
  ipv6Addresses: ['2606:4700:20::681a:a17'],
  webServer: 'Nginx 1.24.0',
  cdn: 'Cloudflare',
  sslValid: true,
  sslExpiresAt: '2027-01-01T00:00:00Z',
  technologies: ['Next.js 14.2.1', 'React 18'],
  httpStatus: 200,
  responseTimeMs: 84,
  hostingProvider: 'Vercel',
  hostingDecision: 'CONFIRMED',
  hostingConfidence: 'HIGH',
  dnsProvider: 'Cloudflare',
  dnsConfidence: 'HIGH',
};

const mockDomainOverview: DomainOverviewResponseDto = {
  domain: {
    id: mockDomainId,
    domainName: mockDomainName,
    monitoringEnabled: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  health: {
    score: 95,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
  },
  latestSnapshot: {
    id: 'snap-1',
    createdAt: '2026-08-23T06:00:00Z',
    responseTimeMs: 84,
    httpStatus: 200,
  },
  latestBrief: null,
  findingsSummary: {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
  },
  recentFindings: [],
  recentChanges: [],
  latestVerification: null,
  infrastructure: mockFullInfra,
  statistics: {
    totalSnapshots: 1,
    totalVerifications: 1,
    totalFindings: 0,
    criticalFindings: 0,
    changesLast30Days: 0,
    lastUnderstandingAt: '2026-08-23T06:00:00Z',
  },
};

describe('WX-909: Infrastructure Overview Surface Recomposition', () => {
  describe('1. Eight Canonical Infrastructure Categories Resolution', () => {
    it('resolves all 8 authoritative rows from backend DTO', () => {
      const result = resolveCompactInfrastructure(
        mockDomainId,
        mockDomainName,
        mockDomainOverview
      );

      assert.equal(result.items.length, 8);
      assert.equal(result.hasAnyDetected, true);

      const itemsById = Object.fromEntries(result.items.map((i) => [i.id, i]));

      assert.equal(itemsById.edge.value, 'Cloudflare');
      assert.equal(itemsById.web_server.value, 'Nginx 1.24.0');
      assert.equal(itemsById.application.value, 'Next.js 14.2.1');
      assert.equal(itemsById.hosting.value, 'Vercel');
      assert.equal(itemsById.dns.value, 'Cloudflare');
      assert.equal(itemsById.tls.value, 'TLS 1.3');
      assert.equal(itemsById.ip_address.value, '104.26.10.23');
      assert.equal(itemsById.open_ports.value, '80, 443');
    });

    it('handles empty or missing infrastructure honestly without fabricating data', () => {
      const emptyResult = resolveCompactInfrastructure(
        mockDomainId,
        mockDomainName,
        null
      );

      assert.equal(emptyResult.items.length, 8);
      assert.equal(emptyResult.hasAnyDetected, false);

      for (const item of emptyResult.items) {
        assert.ok(item.value === 'Not detected' || item.value === 'Not established');
        assert.equal(item.isDetected, false);
      }
    });
  });

  describe('2. Truth Matrix & Architecture Invariants', () => {
    it('verifies Compact Infrastructure Overview capability in Truth Matrix', () => {
      const cap = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Compact Infrastructure Overview Surface'
      );
      assert.ok(cap, 'Capability must exist in Truth Matrix');
      assert.equal(cap?.category, 'Infrastructure');
      assert.equal(cap?.status, 'PRODUCTION_READY');
      assert.equal(
        cap?.frontendComponent,
        'InfrastructureOverview & CompactInfrastructureOverview'
      );
      assert.equal(
        cap?.targetSurface,
        'Dedicated Infrastructure Experience (/workspace/infrastructure)'
      );
    });

    it('verifies all WX-909 certified invariants are defined', () => {
      const expectedInvariants = [
        'NO_EDITORIAL_OVERVIEW_DOMINANCE',
        'NO_FABRICATED_INFRASTRUCTURE_CATEGORIES',
        'NO_UNOBSERVED_VALUE_FABRICATION',
        'FULL_INFRASTRUCTURE_PRESERVATION',
        'QUIET_AUTHORITATIVE_INVENTORY',
      ];

      for (const inv of expectedInvariants) {
        assert.ok(
          inv in WORKSPACE_CERTIFIED_INVARIANTS,
          `Expected ${inv} in WORKSPACE_CERTIFIED_INVARIANTS`
        );
      }
    });
  });
});
