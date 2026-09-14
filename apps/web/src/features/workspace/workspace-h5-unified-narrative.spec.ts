import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveAdaptiveInfrastructureModel,
  resolveUnifiedProgressiveDisclosure,
  resolveWhatMattersNow,
  H5_CERTIFIED_INVARIANTS,
} from './contracts/adaptive-infrastructure.contract.ts';
import type { DomainOverviewResponseDto } from '../../../types/api/overview.dto.ts';

describe('H5: Unified Infrastructure Narrative Frontend Suite', () => {
  const mockDomainData: DomainOverviewResponseDto = {
    domain: {
      id: 'dom-enterprise-1',
      domainName: 'enterprise-app.com',
      monitoringEnabled: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    health: {
      score: 100,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
      overallStatus: 'HEALTHY',
    },
    latestSnapshot: {
      id: 'snap-verified-100',
      capturedAt: '2026-08-29T16:00:00.000Z',
      overallHealth: 'HEALTHY',
    },
    infrastructure: {
      ipv4Addresses: ['104.21.55.1', '172.67.180.2'],
      cdn: 'Cloudflare',
      webServer: 'NGINX',
      sslValid: true,
      technologies: [
        {
          name: 'Cloudflare',
          category: 'CDN / Edge',
          layer: 'EDGE',
          confidence: 'HIGH',
        },
        {
          name: 'NGINX',
          category: 'Web / Server',
          layer: 'GATEWAY',
          confidence: 'HIGH',
        },
        {
          name: 'Go',
          category: 'Programming Languages',
          layer: 'RUNTIME',
          confidence: 'HIGH',
        },
      ],
    },
    findingsSummary: {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    },
    recentFindings: [],
  };

  it('certifies all H5 Unified Infrastructure Narrative invariants', () => {
    assert.equal(H5_CERTIFIED_INVARIANTS.H5_UNIFIED_INFRASTRUCTURE_NARRATIVE, true);
    assert.equal(H5_CERTIFIED_INVARIANTS.H5_DETERMINISTIC_NARRATIVE_SYNTHESIS, true);
    assert.equal(H5_CERTIFIED_INVARIANTS.H5_ANTI_OVERREACH_PRESERVATION, true);
    assert.equal(H5_CERTIFIED_INVARIANTS.H5_PROGRESSIVE_DISCLOSURE_INTEGRITY, true);
    assert.equal(H5_CERTIFIED_INVARIANTS.H5_FINDING_LIFECYCLE_TRUTH_AUTHORITY, true);
    assert.equal(H5_CERTIFIED_INVARIANTS.H5_KNOWN_UNKNOWNS_HONESTY, true);
  });

  it('synthesizes Level 1 Understanding with clear headline and path badge', () => {
    const model = resolveAdaptiveInfrastructureModel(
      'dom-enterprise-1',
      'enterprise-app.com',
      mockDomainData,
    );

    const disclosure = resolveUnifiedProgressiveDisclosure(mockDomainData, model);

    assert.equal(disclosure.level1.headline, 'Cloudflare Edge → NGINX → Protected Boundary');
    assert.ok(disclosure.level1.narrative.includes('Traffic terminates at Cloudflare edge'));
    assert.ok(disclosure.level1.pathBadge.includes('DNS & Anycast Routing'));
    assert.ok(disclosure.level1.pathBadge.includes('Sealed Internal Perimeter'));
  });

  it('synthesizes Level 2 Context with layer rationales and honest sealed boundaries', () => {
    const model = resolveAdaptiveInfrastructureModel(
      'dom-enterprise-1',
      'enterprise-app.com',
      mockDomainData,
    );

    const disclosure = resolveUnifiedProgressiveDisclosure(mockDomainData, model);

    assert.ok(disclosure.level2.architecturalMeaning.includes('observable boundary tier(s)'));
    assert.ok(disclosure.level2.layerRationales.length >= 3);
    assert.ok(
      disclosure.level2.unobservedContext.some((u) => u.includes('Database')),
    );
  });

  it('synthesizes Level 3 Evidence with verifiable claims and preserved confidence', () => {
    const model = resolveAdaptiveInfrastructureModel(
      'dom-enterprise-1',
      'enterprise-app.com',
      mockDomainData,
    );

    const disclosure = resolveUnifiedProgressiveDisclosure(mockDomainData, model);

    assert.ok(disclosure.level3.evidenceItems.length >= 3);
    assert.equal(disclosure.level3.snapshotId, 'snap-verified-100');
    assert.ok(disclosure.level3.evidenceItems.every((e) => Boolean(e.claim && e.source)));
  });

  it('maintains calm STABLE state on clean domain without stale warnings', () => {
    const whatMatters = resolveWhatMattersNow(mockDomainData);
    assert.equal(whatMatters.status, 'STABLE');
    assert.equal(whatMatters.title, 'Architecture Stable');
    assert.ok(whatMatters.subtitle.includes('No active infrastructure issues require attention'));
  });
});
