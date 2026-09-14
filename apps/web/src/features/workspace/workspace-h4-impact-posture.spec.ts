import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveWhatMattersNow,
  resolveAdaptiveInfrastructureModel,
  synthesizeArchitecturalHeroSummary,
  resolveArchitecturalBoundaries,
} from './contracts/adaptive-infrastructure.contract.ts';
import type { DomainOverviewResponseDto } from '../../../types/api/overview.dto.ts';

describe('H4: Frontend Architectural Impact & Posture Intelligence', () => {
  const baseOverviewData: DomainOverviewResponseDto = {
    domain: {
      id: 'dom-h4-001',
      domainName: 'enterprise.portal.io',
      monitoringEnabled: true,
      createdAt: new Date('2026-08-29T08:00:00Z'),
    },
    health: {
      score: 95,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
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
    latestSnapshot: {
      id: 'snp-001',
      createdAt: new Date('2026-08-29T10:00:00Z'),
      responseTimeMs: 82,
      httpStatus: 200,
    },
    latestBrief: null,
    latestVerification: null,
    infrastructure: {
      ipv4Addresses: ['104.21.55.10', '172.67.180.20'],
      ipv6Addresses: ['2606:4700:3030::6815:370a'],
      webServer: 'NGINX',
      cdn: 'Cloudflare',
      sslValid: true,
      sslExpiresAt: new Date('2027-01-01T00:00:00Z'),
      technologies: ['Cloudflare', 'NGINX', 'Node.js'],
      httpStatus: 200,
      responseTimeMs: 82,
      hostingProvider: 'Cloudflare',
      hostingDecision: 'ATTRIBUTED',
      hostingConfidence: 'HIGH',
      hostingExplanation: 'Cloudflare Anycast edge proxy infrastructure observed.',
      edgeProvider: 'Cloudflare',
      edgeConfidence: 'HIGH',
      dnsProvider: 'Cloudflare',
      dnsConfidence: 'HIGH',
      attribution: null,
      technologyArchitecture: {
        architectureSummary:
          'Public ingress is distributed across Cloudflare edge CDN and NGINX gateway before reaching Node.js runtime.',
        ingressPath: [
          { hop: 0, layer: 'EDGE', technologyId: 'public-endpoint', technologyName: 'Public Endpoint', role: 'Entrypoint', relationshipType: null },
          { hop: 1, layer: 'EDGE', technologyId: 'tech-cloudflare', technologyName: 'Cloudflare', role: 'Edge Delivery', relationshipType: null },
          { hop: 2, layer: 'GATEWAY', technologyId: 'tech-nginx', technologyName: 'NGINX', role: 'Web Gateway', relationshipType: null },
          { hop: 3, layer: 'RUNTIME', technologyId: 'tech-nodejs', technologyName: 'Node.js', role: 'Runtime', relationshipType: null },
        ],
        layers: [],
        keyTechnologies: [
          {
            technologyId: 'tech-cloudflare',
            name: 'Cloudflare',
            category: 'EDGE',
            version: null,
            layer: 'EDGE',
            role: 'Edge Delivery & Anycast CDN',
            infrastructureMeaning: 'Edge delivery and CDN caching tier',
            whyDetected: 'Authoritative response headers and DNS nameservers',
            whatThisDoesNotProve: 'This does not prove that origin compute is hosted within Cloudflare Workers.',
            confidence: 0.99,
            confidenceLevel: 'HIGH',
            evidence: [],
          },
          {
            technologyId: 'tech-nginx',
            name: 'NGINX',
            category: 'GATEWAY',
            version: '1.24.0',
            layer: 'GATEWAY',
            role: 'Web Gateway & Ingress Proxy',
            infrastructureMeaning: 'HTTP reverse proxy gateway',
            whyDetected: 'Server response header banner',
            whatThisDoesNotProve: 'This does not prove a Kubernetes deployment or container orchestrator.',
            confidence: 0.95,
            confidenceLevel: 'HIGH',
            evidence: [],
          },
        ],
        integrations: [],
        knownUnknowns: [
          {
            dimension: 'Origin Cloud Provider',
            status: 'MASKED',
            explanation: 'Origin host IP is masked behind Cloudflare Anycast proxies.',
            whyUnknown: 'Edge proxy isolates origin compute.',
          },
        ],
        claimBoundaries: [
          {
            technologyId: 'tech-cloudflare',
            technologyName: 'Cloudflare',
            boundary: 'Does not establish origin cloud provider.',
          },
        ],
        confidence: {
          overallLevel: 'HIGH',
          overallScore: 0.95,
          layerConfidence: {},
          rationale: 'Confirmed',
          confirmedRelationshipsCount: 2,
          supportedRelationshipsCount: 0,
          inferredRelationshipsCount: 0,
        },
      },
    },
    statistics: {
      totalSnapshots: 10,
      totalVerifications: 10,
      totalFindings: 0,
      criticalFindings: 0,
      changesLast30Days: 1,
      lastUnderstandingAt: new Date('2026-08-29T10:00:00Z'),
    },
  };

  describe('1. "What Matters Now" Resolution Matrix', () => {
    it('resolves calm STABLE state when infrastructure is healthy with 0 active findings', () => {
      const resolution = resolveWhatMattersNow(baseOverviewData);

      assert.equal(resolution.status, 'STABLE');
      assert.equal(resolution.title, 'Architecture Stable');
      assert.ok(resolution.subtitle.includes('No active infrastructure issues require attention'));
      assert.equal(resolution.actionText, undefined);
    });

    it('resolves ATTENTION state on security regression (HSTS removed)', () => {
      const regressedData: DomainOverviewResponseDto = {
        ...baseOverviewData,
        recentChanges: [
          {
            id: 'chg-hsts-removed',
            classification: 'SECURITY_HEADER_REMOVED',
            title: 'HSTS protection was removed',
            description: 'Strict-Transport-Security header was removed in the latest snapshot.',
            evidenceBefore: ['Strict-Transport-Security: max-age=31536000; includeSubDomains'],
            evidenceAfter: ['Strict-Transport-Security header is absent on current endpoint'],
            impact: 'SECURITY',
            severity: 'HIGH',
          } as any,
        ],
        findingsSummary: {
          total: 1,
          critical: 0,
          high: 1,
          medium: 0,
          low: 0,
          informational: 0,
        },
      };

      const resolution = resolveWhatMattersNow(regressedData);

      assert.equal(resolution.status, 'ATTENTION');
      assert.equal(resolution.title, 'HSTS protection was removed');
      assert.equal(resolution.subtitle, 'Observed after the latest infrastructure change.');
      assert.ok(resolution.evidenceBefore?.includes('Strict-Transport-Security: max-age=31536000'));
      assert.ok(resolution.evidenceAfter?.includes('absent on current endpoint'));
      assert.equal(resolution.actionText, 'Review finding →');
      assert.equal(resolution.actionTarget, 'findings');
    });

    it('resolves RESOLVED state when security protection is restored without fear-based UI', () => {
      const resolvedData: DomainOverviewResponseDto = {
        ...baseOverviewData,
        recentChanges: [
          {
            id: 'chg-hsts-restored',
            classification: 'SECURITY_HEADER_ADDED',
            title: 'HSTS protection restored',
            description: 'Strict-Transport-Security header is active on authoritative HTTPS endpoint.',
            evidenceBefore: ['Header absent in previous snapshot'],
            evidenceAfter: ['Strict-Transport-Security: max-age=31536000; includeSubDomains'],
            impact: 'SECURITY',
            severity: 'LOW',
          } as any,
        ],
        findingsSummary: {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          informational: 0,
        },
      };

      const resolution = resolveWhatMattersNow(resolvedData);

      assert.equal(resolution.status, 'RESOLVED');
      assert.equal(resolution.title, 'HSTS protection restored');
      assert.equal(resolution.subtitle, 'Resolved in the latest verified snapshot.');
      assert.equal(resolution.actionText, 'View timeline →');
      assert.equal(resolution.actionTarget, 'changes');
    });

    it('resolves CHANGED state on architectural evolution (NGINX -> Envoy)', () => {
      const migratedData: DomainOverviewResponseDto = {
        ...baseOverviewData,
        recentChanges: [
          {
            id: 'chg-gateway-envoy',
            classification: 'GATEWAY_MIGRATED',
            title: 'Gateway migrated from NGINX to Envoy',
            description: 'Observed web gateway reverse proxy changed from NGINX to Envoy.',
            whatThisMeans: 'Publicly observable gateway boundary changed from NGINX to Envoy.',
            evidenceBefore: ['Server: nginx/1.24.0'],
            evidenceAfter: ['Server: envoy'],
            impact: 'ARCHITECTURAL',
            severity: 'MEDIUM',
          } as any,
        ],
      };

      const resolution = resolveWhatMattersNow(migratedData);

      assert.equal(resolution.status, 'CHANGED');
      assert.equal(resolution.title, 'Gateway migrated from NGINX to Envoy');
      assert.ok(resolution.subtitle.includes('changed from NGINX to Envoy'));
      assert.equal(resolution.actionText, 'Review changes →');
      assert.equal(resolution.actionTarget, 'changes');
    });
  });

  describe('2. Anti-Overreach UI Invariants', () => {
    it('hero narrative and boundary resolutions never claim unobserved High Availability', () => {
      const model = resolveAdaptiveInfrastructureModel(
        baseOverviewData.domain.id,
        baseOverviewData.domain.domainName,
        baseOverviewData,
      );

      const hero = synthesizeArchitecturalHeroSummary(model, baseOverviewData);
      const boundaries = resolveArchitecturalBoundaries(model, baseOverviewData);

      assert.ok(!hero.narrative.includes('highly available'));
      assert.ok(!hero.narrative.includes('fault tolerant'));
      assert.ok(!hero.narrative.includes('redundant cluster'));

      assert.equal(boundaries.sealed.length, 4);
      assert.ok(boundaries.sealed.some((b) => b.label === 'Origin Compute Infrastructure'));
      assert.ok(boundaries.editorialNote.includes('internal application and persistence layers are not directly exposed'));
    });
  });
});
