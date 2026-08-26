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

const mockInfra: InfrastructureOverviewDto = {
  ipv4Addresses: ['185.43.194.2'],
  ipv6Addresses: [],
  webServer: 'cloudflare',
  cdn: 'Cloudflare',
  sslValid: true,
  sslExpiresAt: '2027-01-01T00:00:00Z',
  technologies: ['Cloudflare'],
  httpStatus: 200,
  responseTimeMs: 92,
  hostingProvider: 'Cloudflare Pages / Workers',
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
    responseTimeMs: 92,
    httpStatus: 200,
  },
  latestBrief: {
    overallHealth: 'HEALTHY',
    summary: 'Cloudflare edge and proxy active with valid TLS 1.3.',
    highlights: ['Cloudflare edge active', 'TLS 1.3 certificate valid'],
    recommendations: [],
    generatedAt: '2026-08-23T06:00:00Z',
  },
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
  infrastructure: mockInfra,
  statistics: {
    totalSnapshots: 1,
    totalVerifications: 1,
    totalFindings: 0,
    criticalFindings: 0,
    changesLast30Days: 0,
    lastUnderstandingAt: '2026-08-23T06:00:00Z',
  },
};

describe('WX-910: Restore Overview Intelligence & Move Infrastructure Inventory to Infrastructure Experience', () => {
  describe('1. Architectural Separation (Overview vs Infrastructure)', () => {
    it('enforces Overview = Intelligence and Infrastructure = Inventory + Model', () => {
      assert.equal(
        WORKSPACE_CERTIFIED_INVARIANTS.OVERVIEW_EQUALS_INTELLIGENCE,
        'Overview explains what is happening; Infrastructure exposes what exists.'
      );
      assert.equal(
        WORKSPACE_CERTIFIED_INVARIANTS.NO_OVERVIEW_INVENTORY_POLLUTION,
        'Workspace Overview focuses purely on synthesized intelligence (Executive Brief, Stories) and does not host infrastructure inventory cards.'
      );
      assert.equal(
        WORKSPACE_CERTIFIED_INVARIANTS.INFRASTRUCTURE_PAGE_IS_INVENTORY_HOME,
        'The dedicated Infrastructure experience (/workspace/infrastructure) is the sole authoritative home for the 8-category inventory and full infrastructure model.'
      );
    });

    it('confirms the 8-category compact inventory maps accurately for the dedicated Infrastructure page', () => {
      const inventory = resolveCompactInfrastructure(
        mockDomainId,
        mockDomainName,
        mockDomainOverview
      );

      assert.equal(inventory.items.length, 8);
      const itemsMap = Object.fromEntries(inventory.items.map((i) => [i.id, i.value]));

      assert.equal(itemsMap.edge, 'Cloudflare');
      assert.equal(itemsMap.web_server, 'cloudflare');
      assert.equal(itemsMap.application, 'Cloudflare');
      assert.equal(itemsMap.hosting, 'Cloudflare Pages / Workers');
      assert.equal(itemsMap.dns, 'Cloudflare');
      assert.equal(itemsMap.tls, 'TLS 1.3');
      assert.equal(itemsMap.ip_address, '185.43.194.2');
      assert.equal(itemsMap.open_ports, '80, 443');
    });
  });

  describe('2. Truth Matrix & Capability Certification', () => {
    it('verifies Compact Infrastructure Overview Surface is mapped to Dedicated Infrastructure Experience', () => {
      const entry = WORKSPACE_TRUTH_MATRIX.find(
        (c) => c.capability === 'Compact Infrastructure Overview Surface'
      );
      assert.ok(entry, 'Capability must be registered');
      assert.equal(entry?.category, 'Infrastructure');
      assert.equal(entry?.frontendComponent, 'InfrastructureOverview & CompactInfrastructureOverview');
      assert.equal(entry?.targetSurface, 'Dedicated Infrastructure Experience (/workspace/infrastructure)');
      assert.equal(entry?.status, 'PRODUCTION_READY');
    });
  });
});
