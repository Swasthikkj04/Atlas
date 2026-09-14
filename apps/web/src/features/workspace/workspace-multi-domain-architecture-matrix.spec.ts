import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractDomainIngressPath,
  computeVendorConcentration,
  resolveMultiDomainArchitectureMatrix,
  type DomainIngressRow,
  type DomainOverviewInput,
} from './contracts/multi-domain-matrix.contract.ts';
import type { AdaptiveComponent } from './contracts/adaptive-infrastructure.contract.ts';

describe('Move 5: Multi-Domain Ingress Comparison & Architecture Matrix Engine', () => {
  const mockComponentsA: AdaptiveComponent[] = [
    {
      id: 'comp-1',
      category: 'EDGE',
      layer: 'EDGE',
      name: 'Cloudflare',
      role: 'Edge CDN & DDoS Protection',
      confidence: 'HIGH',
      whyDetected: 'Observed cf-ray and Cloudflare IP range',
      whatThisDoesNotProve: 'Does not establish origin cloud compute',
    },
    {
      id: 'comp-2',
      category: 'GATEWAY',
      layer: 'GATEWAY',
      name: 'NGINX',
      version: '1.24.0',
      role: 'Reverse Proxy & Ingress Gateway',
      confidence: 'HIGH',
      whyDetected: 'Server: nginx/1.24.0 header',
      whatThisDoesNotProve: 'Does not establish underlying Linux kernel',
    },
    {
      id: 'comp-3',
      category: 'APPLICATION',
      layer: 'APPLICATION',
      name: 'Next.js',
      role: 'Application Framework & Server',
      confidence: 'HIGH',
      whyDetected: 'X-Powered-By: Next.js',
      whatThisDoesNotProve: 'Does not establish Vercel cloud hosting',
    },
    {
      id: 'comp-4',
      category: 'RUNTIME',
      layer: 'RUNTIME',
      name: 'Node.js',
      role: 'JavaScript Execution Runtime',
      confidence: 'MEDIUM',
      whyDetected: 'Keep-Alive timing parameterization',
      whatThisDoesNotProve: 'Does not establish node cluster configuration',
    },
  ];

  const mockComponentsB: AdaptiveComponent[] = [
    {
      id: 'comp-5',
      category: 'EDGE',
      layer: 'EDGE',
      name: 'AWS CloudFront',
      role: 'Global Content Delivery Network',
      confidence: 'HIGH',
      whyDetected: 'Via: cloudfront and x-amz-cf-id',
      whatThisDoesNotProve: 'Does not establish AWS EC2 backend origin',
    },
    {
      id: 'comp-6',
      category: 'GATEWAY',
      layer: 'GATEWAY',
      name: 'Apache',
      version: '2.4.52',
      role: 'HTTP Server',
      confidence: 'HIGH',
      whyDetected: 'Server: Apache/2.4.52',
      whatThisDoesNotProve: 'Does not establish OS line',
    },
    {
      id: 'comp-7',
      category: 'APPLICATION',
      layer: 'APPLICATION',
      name: 'Django',
      role: 'Python Web Framework',
      confidence: 'HIGH',
      whyDetected: 'csrftoken and sessionid cookies',
      whatThisDoesNotProve: 'Does not establish database models',
    },
  ];

  const mockComponentsC: AdaptiveComponent[] = [
    {
      id: 'comp-8',
      category: 'GATEWAY',
      layer: 'GATEWAY',
      name: 'NGINX',
      version: '1.22.0',
      role: 'Reverse Proxy',
      confidence: 'HIGH',
      whyDetected: 'Server: nginx/1.22.0',
      whatThisDoesNotProve: 'Does not establish kernel',
    },
    {
      id: 'comp-9',
      category: 'APPLICATION',
      layer: 'APPLICATION',
      name: 'WordPress',
      role: 'Content Management System',
      confidence: 'HIGH',
      whyDetected: 'wp-content link paths',
      whatThisDoesNotProve: 'Does not establish MySQL host',
    },
  ];

  describe('1. Ingress Delivery Path Extraction Contract', () => {
    it('normalizes full edge-to-runtime stack into sequential topology hops', () => {
      const path = extractDomainIngressPath(mockComponentsA);
      assert.equal(path.length, 4);
      assert.equal(path[0].layer, 'EDGE');
      assert.equal(path[0].name, 'Cloudflare');
      assert.equal(path[1].layer, 'GATEWAY');
      assert.equal(path[1].name, 'NGINX');
      assert.equal(path[2].layer, 'APPLICATION');
      assert.equal(path[2].name, 'Next.js');
      assert.equal(path[3].layer, 'RUNTIME');
      assert.equal(path[3].name, 'Node.js');
    });

    it('injects Direct Origin (No CDN) when no edge layer is observed', () => {
      const path = extractDomainIngressPath(mockComponentsC);
      assert.equal(path[0].layer, 'EDGE');
      assert.equal(path[0].name, 'Direct Origin (No CDN)');
      assert.equal(path[0].isDirect, true);
      assert.equal(path[1].layer, 'GATEWAY');
      assert.equal(path[1].name, 'NGINX');
    });
  });

  describe('2. Vendor Concentration & SPOF Risk Analysis Contract', () => {
    it('computes accurate concentration percentages and flags Single Point of Failure (SPOF >= 60%)', () => {
      const rows: DomainIngressRow[] = [
        {
          domainId: 'dom-1',
          domainName: 'app.example.com',
          status: 'STABLE',
          ingressPath: extractDomainIngressPath(mockComponentsA),
          edgeTechnology: 'Cloudflare',
          gatewayTechnology: 'NGINX',
          applicationRuntime: 'Next.js / Node.js',
          hostingProvider: 'Unobserved',
          postureScore: 95,
          anomalyCount: 0,
          criticalAnomalyCount: 0,
          highAnomalyCount: 0,
        },
        {
          domainId: 'dom-2',
          domainName: 'blog.example.com',
          status: 'STABLE',
          ingressPath: extractDomainIngressPath(mockComponentsA),
          edgeTechnology: 'Cloudflare',
          gatewayTechnology: 'NGINX',
          applicationRuntime: 'Next.js / Node.js',
          hostingProvider: 'Unobserved',
          postureScore: 90,
          anomalyCount: 0,
          criticalAnomalyCount: 0,
          highAnomalyCount: 0,
        },
        {
          domainId: 'dom-3',
          domainName: 'api.example.com',
          status: 'ATTENTION',
          ingressPath: extractDomainIngressPath(mockComponentsB),
          edgeTechnology: 'AWS CloudFront',
          gatewayTechnology: 'Apache',
          applicationRuntime: 'Django',
          hostingProvider: 'Unobserved',
          postureScore: 60,
          anomalyCount: 2,
          criticalAnomalyCount: 1,
          highAnomalyCount: 1,
        },
      ];

      const metrics = computeVendorConcentration(rows);
      assert.ok(metrics.length > 0);

      // Cloudflare: 2 of 3 domains = 67% -> SPOF
      const cfMetric = metrics.find((m) => m.vendorName === 'Cloudflare');
      assert.ok(cfMetric);
      assert.equal(cfMetric.percentage, 67);
      assert.equal(cfMetric.isSinglePointOfFailure, true);

      // NGINX: 2 of 3 domains = 67% -> SPOF
      const nginxMetric = metrics.find((m) => m.vendorName === 'NGINX');
      assert.ok(nginxMetric);
      assert.equal(nginxMetric.percentage, 67);
      assert.equal(nginxMetric.isSinglePointOfFailure, true);

      // AWS CloudFront: 1 of 3 domains = 33% -> Not SPOF
      const cfAwsMetric = metrics.find((m) => m.vendorName === 'AWS CloudFront');
      assert.ok(cfAwsMetric);
      assert.equal(cfAwsMetric.percentage, 33);
      assert.equal(cfAwsMetric.isSinglePointOfFailure, false);
    });
  });

  describe('3. Multi-Domain Architecture Matrix Data Resolution', () => {
    it('resolves full matrix model with average fleet posture and risk target', () => {
      const domains = [
        { id: 'dom-1', name: 'app.example.com' },
        { id: 'dom-2', name: 'api.example.com' },
      ];

      const overviews: DomainOverviewInput[] = [
        {
          domainId: 'dom-1',
          components: mockComponentsA,
          postureScore: 100,
          status: 'STABLE',
          anomalies: [],
        },
        {
          domainId: 'dom-2',
          components: mockComponentsB,
          postureScore: 60,
          status: 'ATTENTION',
          anomalies: [
            {
              code: 'DEBUG_STACK_TRACE',
              severity: 'CRITICAL',
              message: 'Active Django traceback exposed on /api/error',
            },
          ],
        },
      ];

      const matrixData = resolveMultiDomainArchitectureMatrix(domains, overviews);
      assert.equal(matrixData.isEmpty, false);
      assert.equal(matrixData.totalDomains, 2);
      assert.equal(matrixData.rows.length, 2);
      assert.equal(matrixData.fleetPosture.averageScore, 80); // (100 + 60) / 2
      assert.equal(matrixData.fleetPosture.criticalAnomaliesCount, 1);
      assert.equal(matrixData.fleetPosture.domainsAtRiskCount, 1);
      assert.equal(matrixData.fleetPosture.highestRiskDomainName, 'api.example.com');
    });

    it('returns empty matrix gracefully for 0 domains', () => {
      const matrixData = resolveMultiDomainArchitectureMatrix([], []);
      assert.equal(matrixData.isEmpty, true);
      assert.equal(matrixData.rows.length, 0);
      assert.equal(matrixData.fleetPosture.averageScore, 100);
    });
  });
});
