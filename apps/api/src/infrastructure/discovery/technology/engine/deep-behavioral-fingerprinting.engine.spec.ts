import { DeepBehavioralFingerprintingEngine } from './deep-behavioral-fingerprinting.engine';
import { createTechnologyDetectionContext } from '../context/technology-detection-context.impl';

describe('DeepBehavioralFingerprintingEngine (Move 2: Deep Wire & Behavioral Fingerprinting)', () => {
  let engine: DeepBehavioralFingerprintingEngine;

  beforeEach(() => {
    engine = new DeepBehavioralFingerprintingEngine();
  });

  it('detects Java at RUNTIME when Server banner is completely stripped but JSESSIONID cookie is present', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'enterprise-stripped.bank.com',
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'set-cookie': 'JSESSIONID=A1B2C3D4E5F67890; Path=/; HttpOnly; Secure',
      },
    });

    const { results, behavioralResult } = engine.analyze(context, []);

    expect(behavioralResult.matchedSignaturesCount).toBeGreaterThanOrEqual(1);
    const javaResult = results.find((r) => r.id === 'tech-java');
    expect(javaResult).toBeDefined();
    expect(javaResult?.name).toBe('Java');
    expect(javaResult?.category).toBe('Infrastructure Runtime');
    expect(['HIGH', 'MEDIUM']).toContain(javaResult?.confidenceLevel);
    expect(
      javaResult?.evidence.some(
        (e) => e.indicator === 'Set-Cookie: JSESSIONID',
      ),
    ).toBe(true);
  });

  it('detects .NET at RUNTIME when Server banner is stripped but .AspNetCore.Cookies session is present', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'dotnet-stripped.service.io',
      headers: {
        'content-type': 'application/json',
        'set-cookie':
          '.AspNetCore.Cookies=CfDJ8...; path=/; samesite=lax; httponly',
      },
    });

    const { results, behavioralResult } = engine.analyze(context, []);

    const dotnetResult = results.find((r) => r.id === 'tech-dotnet');
    expect(dotnetResult).toBeDefined();
    expect(dotnetResult?.name).toBe('.NET');
    expect(dotnetResult?.category).toBe('Infrastructure Runtime');
    expect(['HIGH', 'MEDIUM']).toContain(dotnetResult?.confidenceLevel);
  });

  it('detects Node.js at RUNTIME via socket Keep-Alive: timeout=5 header parameterization and connect.sid', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'api.modern-node.com',
      headers: {
        connection: 'keep-alive',
        'keep-alive': 'timeout=5',
        'set-cookie': 'connect.sid=s%3A_J8...; Path=/; HttpOnly',
      },
    });

    const { results } = engine.analyze(context, []);

    const nodeResult = results.find((r) => r.id === 'tech-nodejs');
    expect(nodeResult).toBeDefined();
    expect(nodeResult?.name).toBe('Node.js');
    expect(nodeResult?.category).toBe('Infrastructure Runtime');
  });

  it('detects Cloudflare at EDGE via TLS Certificate Issuer & cf-ray routing even if Server is stripped', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'cloudflare-hardened.io',
      headers: {
        'cf-ray': '8b9123456789abcd-IAD',
        'cf-cache-status': 'DYNAMIC',
      },
      ssl: {
        reachable: true,
        supported: true,
        responseTimeMs: 20,
        certificate: {
          issuer: 'Cloudflare Inc ECC CA-3',
          subject: 'cloudflare-hardened.io',
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
          serialNumber: '12345',
        },
        error: null,
      },
    });

    const { results } = engine.analyze(context, []);

    const cfResult = results.find((r) => r.id === 'tech-cloudflare');
    expect(cfResult).toBeDefined();
    expect(cfResult?.name).toBe('Cloudflare');
    expect(cfResult?.category).toBe('CDN / Edge');
    expect(['HIGH', 'MEDIUM']).toContain(cfResult?.confidenceLevel);
  });

  it('detects NGINX at GATEWAY via canonical error template formatting when banners are stripped', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'nginx-hardened.corp.internal',
      headers: {
        'content-type': 'text/html',
      },
      htmlBody:
        '<html><head><title>404 Not Found</title></head><body><center><h1>404 Not Found</h1></center><hr></body></html>',
    });

    const { results } = engine.analyze(context, []);

    const nginxResult = results.find((r) => r.id === 'tech-nginx');
    expect(nginxResult).toBeDefined();
    expect(nginxResult?.name).toBe('NGINX');
    expect(nginxResult?.category).toBe('Web / Server');
  });

  it('enriches existing detector results with deep behavioral wire proof without duplicating', () => {
    const existingExplicitResult = {
      id: 'tech-nodejs',
      name: 'Node.js',
      category: 'Infrastructure Runtime' as any,
      confidence: 0.85,
      confidenceLevel: 'HIGH' as any,
      evidence: [
        {
          sourceType: 'HTTP',
          source: 'Response Header: x-powered-by',
          indicator: 'X-Powered-By: Express',
          confidence: 'HIGH',
        },
      ],
      signals: [],
      role: 'Server Runtime',
    };

    const context = createTechnologyDetectionContext({
      domainName: 'hybrid-node.org',
      headers: {
        'x-powered-by': 'Express',
        connection: 'keep-alive',
        'keep-alive': 'timeout=5',
        'set-cookie': 'connect.sid=s%3A123; Path=/',
      },
    });

    const { results } = engine.analyze(context, [existingExplicitResult]);

    // Should NOT duplicate Node.js
    const nodeResults = results.filter((r) => r.name === 'Node.js');
    expect(nodeResults.length).toBe(1);

    // Should have both explicit and behavioral evidence
    const node = nodeResults[0];
    expect(node.evidence.length).toBeGreaterThanOrEqual(2);
    expect(node.signals.some((s) => s.type === 'WIRE_BEHAVIOR')).toBe(true);
  });
});
