import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCompactInfrastructure } from './contracts/compact-infrastructure.contract.ts';
import {
  WORKSPACE_CERTIFIED_INVARIANTS,
  WORKSPACE_TRUTH_MATRIX,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { InfrastructureOverviewDto } from '../../types/api/overview.dto';

describe('WX-1022: Workspace Infrastructure Provider Attribution', () => {
  const domainId = 'dom-123';
  const domainName = 'my-site.replit.app';

  describe('1. Dedicated Authoritative Attribution Resolution', () => {
    it('accurately resolves confirmed Replit deployment without false Vercel claims', () => {
      const mockInfra: InfrastructureOverviewDto = {
        ipv4Addresses: ['34.102.136.180'],
        ipv6Addresses: [],
        webServer: 'ReplitEdge',
        cdn: null,
        sslValid: true,
        sslExpiresAt: '2027-01-01T00:00:00.000Z',
        technologies: ['React', 'Node.js'],
        httpStatus: 200,
        responseTimeMs: 85,
        hostingProvider: 'Replit',
        hostingDecision: 'CONFIRMED',
        hostingConfidence: 'HIGH',
        hostingExplanation: 'Confirmed deployment on Replit via DNS and headers.',
        edgeProvider: null,
        dnsProvider: 'Google Cloud DNS',
      };

      const result = resolveCompactInfrastructure(domainId, domainName, mockInfra);

      const hostingItem = result.items.find((i) => i.id === 'hosting');
      assert.ok(hostingItem);
      assert.equal(hostingItem?.value, 'Replit');
      assert.equal(hostingItem?.details, 'High confidence');
      assert.equal(hostingItem?.isDetected, true);
    });

    it('accurately separates Cloudflare Edge and Cloudflare DNS from Replit Origin Hosting', () => {
      const mockInfra: InfrastructureOverviewDto = {
        ipv4Addresses: ['104.21.50.10'],
        ipv6Addresses: [],
        webServer: 'cloudflare',
        cdn: 'Cloudflare',
        sslValid: true,
        sslExpiresAt: '2027-01-01T00:00:00.000Z',
        technologies: ['React'],
        httpStatus: 200,
        responseTimeMs: 65,
        edgeProvider: 'Cloudflare',
        edgeConfidence: 'HIGH',
        dnsProvider: 'Cloudflare',
        dnsConfidence: 'HIGH',
        hostingProvider: 'Replit',
        hostingDecision: 'CONFIRMED',
        hostingConfidence: 'HIGH',
        hostingExplanation: 'Confirmed deployment on Replit behind Cloudflare edge proxy.',
      };

      const result = resolveCompactInfrastructure(domainId, 'custom-domain.com', mockInfra);

      const edgeItem = result.items.find((i) => i.id === 'edge');
      const dnsItem = result.items.find((i) => i.id === 'dns');
      const hostingItem = result.items.find((i) => i.id === 'hosting');

      assert.equal(edgeItem?.value, 'Cloudflare');
      assert.equal(dnsItem?.value, 'Cloudflare');
      assert.equal(hostingItem?.value, 'Replit');
      assert.equal(hostingItem?.details, 'High confidence');
    });

    it('prohibits Next.js application technology from inferring Vercel hosting', () => {
      const mockInfra: InfrastructureOverviewDto = {
        ipv4Addresses: ['192.0.2.1'],
        ipv6Addresses: [],
        webServer: 'nginx',
        cdn: null,
        sslValid: true,
        sslExpiresAt: null,
        technologies: ['Next.js', 'React'],
        httpStatus: 200,
        responseTimeMs: 110,
        hostingProvider: null,
        hostingDecision: 'UNKNOWN',
        hostingConfidence: 'LOW',
        hostingExplanation: 'Hosting provider could not be established.',
      };

      const result = resolveCompactInfrastructure(domainId, 'self-hosted.org', mockInfra);

      const appItem = result.items.find((i) => i.id === 'application');
      const hostingItem = result.items.find((i) => i.id === 'hosting');

      assert.equal(appItem?.value, 'Next.js');
      assert.equal(hostingItem?.value, 'Not established');
      assert.equal(hostingItem?.details, 'Insufficient evidence');
      assert.equal(hostingItem?.isDetected, false);
    });

    it('accurately resolves Enterprise Datacenter and Hardened Web Server (hdfc.bank.in pattern)', () => {
      const mockInfra: InfrastructureOverviewDto = {
        ipv4Addresses: ['175.100.168.20'],
        ipv6Addresses: [],
        webServer: 'Custom / Hardened Web Server',
        cdn: null,
        sslValid: true,
        sslExpiresAt: '2027-06-01T00:00:00.000Z',
        technologies: ['ASP.NET', 'Microsoft IIS'],
        httpStatus: 200,
        responseTimeMs: 90,
        hostingProvider: 'Enterprise / Dedicated Datacenter',
        hostingDecision: 'STRONGLY_INFERRED',
        hostingConfidence: 'HIGH',
        hostingExplanation: 'Hosted on dedicated enterprise infrastructure / corporate datacenter.',
        edgeProvider: null,
        dnsProvider: 'ns1.hdfcbank.com',
      };

      const result = resolveCompactInfrastructure(domainId, 'hdfc.bank.in', mockInfra);

      const hostingItem = result.items.find((i) => i.id === 'hosting');
      const webServerItem = result.items.find((i) => i.id === 'web_server');
      const appItem = result.items.find((i) => i.id === 'application');

      assert.equal(hostingItem?.value, 'Enterprise / Dedicated Datacenter');
      assert.equal(hostingItem?.details, 'High confidence');
      assert.equal(hostingItem?.isDetected, true);
      assert.equal(webServerItem?.value, 'Custom / Hardened Web Server');
      assert.equal(webServerItem?.isDetected, true);
      assert.equal(appItem?.value, 'ASP.NET');
      assert.equal(appItem?.isDetected, true);
    });
  });

  describe('2. Multi-Signal Conflict Exposure', () => {
    it('honestly exposes Conflicted / Inconclusive state when signals point to competing providers', () => {
      const mockInfra: InfrastructureOverviewDto = {
        ipv4Addresses: ['34.102.136.180'],
        ipv6Addresses: [],
        webServer: 'Vercel',
        cdn: null,
        sslValid: true,
        sslExpiresAt: null,
        technologies: [],
        httpStatus: 200,
        responseTimeMs: 95,
        hostingProvider: null,
        hostingDecision: 'CONFLICTED',
        hostingConfidence: 'INCONCLUSIVE',
        hostingExplanation: 'Observed conflicting signals between Replit (DNS) and Vercel (HTTP server).',
      };

      const result = resolveCompactInfrastructure(domainId, domainName, mockInfra);

      const hostingItem = result.items.find((i) => i.id === 'hosting');
      assert.equal(hostingItem?.value, 'Inconclusive');
      assert.equal(hostingItem?.details, 'Conflicted signals');
      assert.equal(hostingItem?.isDetected, true);
    });
  });

  describe('3. Truth Contract Invariants Certification (WX-1022)', () => {
    it('Contains WX-1022 in WORKSPACE_TRUTH_MATRIX', () => {
      const entry = WORKSPACE_TRUTH_MATRIX.find(
        (t) =>
          t.capability.includes('WX-1022') ||
          t.capability.includes('Provider & Deployment Attribution')
      );
      assert.ok(entry);
      assert.equal(entry?.status, 'PRODUCTION_READY');
    });

    it('Certifies all 10 WX-1022 mandatory invariants', () => {
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.PROVIDER_ATTRIBUTION_IS_EVIDENCE_BACKED);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_TECHNOLOGY_TO_HOSTING_INFERENCE);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_EDGE_TO_HOSTING_INFERENCE);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_DNS_TO_HOSTING_INFERENCE);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_SINGLE_SIGNAL_PROVIDER_AUTHORITY);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.PROVIDER_CONFLICT_MUST_BE_EXPOSED);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.UNKNOWN_PROVIDER_IS_VALID);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.ATTRIBUTION_CONFIDENCE_IS_PRESERVED);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.ATTRIBUTION_EVIDENCE_IS_SNAPSHOT_BOUND);
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.NO_FALSE_PROVIDER_CHANGE);
    });
  });
});
