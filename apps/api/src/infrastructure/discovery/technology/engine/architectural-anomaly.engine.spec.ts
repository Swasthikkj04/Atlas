import { ArchitecturalAnomalyEngine } from './architectural-anomaly.engine';
import { createTechnologyDetectionContext } from '../context/technology-detection-context.impl';
import {
  InfrastructureTopology,
  TopologyLayer,
  TechnologyCategory,
} from '../contracts';

describe('ArchitecturalAnomalyEngine (Move 4: Architectural Anomaly & Security Posture Analysis)', () => {
  let engine: ArchitecturalAnomalyEngine;

  beforeEach(() => {
    engine = new ArchitecturalAnomalyEngine();
  });

  it('detects private RFC 1918 IPv4 address leakage in response headers and deducts posture score', () => {
    const topology: InfrastructureTopology = {
      domainName: 'leaking-api.corp.internal',
      nodes: [
        {
          id: 'tech-nginx',
          technologyId: 'tech-nginx',
          technologyName: 'NGINX',
          layer: TopologyLayer.GATEWAY,
          category: TechnologyCategory.WEB_SERVER,
          confidence: 0.95,
          confidenceLevel: 'HIGH',
        },
      ],
      relationships: [],
      layers: [TopologyLayer.GATEWAY],
      totalNodes: 1,
      totalRelationships: 0,
    };

    const context = createTechnologyDetectionContext({
      domainName: 'leaking-api.corp.internal',
      headers: {
        'x-real-ip': '10.240.0.52',
        server: 'nginx/1.24.0',
      },
    });

    const result = engine.analyze(topology, context);

    expect(result.anomalies.some((a) => a.code === 'INTERNAL_IP_LEAKAGE')).toBe(
      true,
    );
    expect(result.highCount).toBeGreaterThanOrEqual(1);
    expect(result.postureScore).toBeLessThan(100);
  });

  it('detects active debug stack trace exposure and flags CRITICAL severity', () => {
    const topology: InfrastructureTopology = {
      domainName: 'django-debug.site.com',
      nodes: [
        {
          id: 'tech-django',
          technologyId: 'tech-django',
          technologyName: 'Django',
          layer: TopologyLayer.APPLICATION,
          category: TechnologyCategory.FRAMEWORK,
          confidence: 0.95,
          confidenceLevel: 'HIGH',
        },
      ],
      relationships: [],
      layers: [TopologyLayer.APPLICATION],
      totalNodes: 1,
      totalRelationships: 0,
    };

    const context = createTechnologyDetectionContext({
      domainName: 'django-debug.site.com',
      htmlBody:
        '<html><body><h1>ZeroDivisionError</h1><pre>Traceback (most recent call last):\n  File "/app/views.py", line 42, in get\n    return 1 / 0</pre></body></html>',
    });

    const result = engine.analyze(topology, context);

    const debugAnomaly = result.anomalies.find(
      (a) => a.code === 'DEBUG_STACK_TRACE_EXPOSURE',
    );
    expect(debugAnomaly).toBeDefined();
    expect(debugAnomaly?.severity).toBe('CRITICAL');
    expect(result.criticalCount).toBe(1);
    expect(result.postureScore).toBeLessThanOrEqual(60);
  });

  it('evaluates clean, hardened infrastructure as 100/100 posture score with 0 critical/high anomalies', () => {
    const topology: InfrastructureTopology = {
      domainName: 'hardened-production.io',
      nodes: [
        {
          id: 'tech-cloudflare',
          technologyId: 'tech-cloudflare',
          technologyName: 'Cloudflare',
          layer: TopologyLayer.EDGE,
          category: TechnologyCategory.CDN_EDGE,
          confidence: 0.98,
          confidenceLevel: 'HIGH',
        },
      ],
      relationships: [],
      layers: [TopologyLayer.EDGE],
      totalNodes: 1,
      totalRelationships: 0,
    };

    const context = createTechnologyDetectionContext({
      domainName: 'hardened-production.io',
      headers: {
        'strict-transport-security':
          'max-age=31536000; includeSubDomains; preload',
        'content-type': 'application/json',
      },
    });

    const result = engine.analyze(topology, context);

    expect(result.anomalies.length).toBe(0);
    expect(result.postureScore).toBe(100);
    expect(result.criticalCount).toBe(0);
  });
});
