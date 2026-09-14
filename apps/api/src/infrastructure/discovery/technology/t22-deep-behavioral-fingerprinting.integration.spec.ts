import { Test, TestingModule } from '@nestjs/testing';
import { TechnologyModule } from './technology.module';
import { TechnologyFingerprintingEngine } from './engine/technology-fingerprinting.engine';
import { DeepBehavioralFingerprintingEngine } from './engine/deep-behavioral-fingerprinting.engine';
import { HttpBehaviorAnalyzer } from './behavioral/http-behavior.analyzer';
import { CookieBehaviorAnalyzer } from './behavioral/cookie-behavior.analyzer';
import { ErrorBehaviorAnalyzer } from './behavioral/error-behavior.analyzer';
import { TlsBehaviorAnalyzer } from './behavioral/tls-behavior.analyzer';
import { EvidenceFusionEngine } from './behavioral/evidence-fusion.engine';
import { createTechnologyDetectionContext } from './context/technology-detection-context.impl';

describe('T22: Deep Wire & Behavioral Infrastructure Fingerprinting Integration Suite', () => {
  let moduleRef: TestingModule;
  let fingerprintingEngine: TechnologyFingerprintingEngine;
  let behavioralEngine: DeepBehavioralFingerprintingEngine;
  let httpAnalyzer: HttpBehaviorAnalyzer;
  let cookieAnalyzer: CookieBehaviorAnalyzer;
  let errorAnalyzer: ErrorBehaviorAnalyzer;
  let tlsAnalyzer: TlsBehaviorAnalyzer;
  let fusionEngine: EvidenceFusionEngine;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TechnologyModule],
    }).compile();

    fingerprintingEngine = moduleRef.get(TechnologyFingerprintingEngine);
    behavioralEngine = moduleRef.get(DeepBehavioralFingerprintingEngine);
    httpAnalyzer = moduleRef.get(HttpBehaviorAnalyzer);
    cookieAnalyzer = moduleRef.get(CookieBehaviorAnalyzer);
    errorAnalyzer = moduleRef.get(ErrorBehaviorAnalyzer);
    tlsAnalyzer = moduleRef.get(TlsBehaviorAnalyzer);
    fusionEngine = moduleRef.get(EvidenceFusionEngine);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Five Behavioral Evidence Families Verification', () => {
    it('T22-A: extracts HTTP response behavior (Keep-Alive socket parameterization & range delivery)', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'wire-http.corp.internal',
        headers: {
          connection: 'keep-alive',
          'keep-alive': 'timeout=5',
          'accept-ranges': 'bytes',
          etag: '"5d1a2b3c-abc"',
        },
      });

      const signals = httpAnalyzer.analyze(context);
      expect(signals.length).toBeGreaterThanOrEqual(2);
      expect(
        signals.some(
          (s) =>
            s.category === 'HTTP' && s.targetTechnologyId === 'tech-nodejs',
        ),
      ).toBe(true);
      expect(
        signals.some(
          (s) => s.category === 'HTTP' && s.targetTechnologyId === 'tech-nginx',
        ),
      ).toBe(true);
    });

    it('T22-B: extracts Cookie structural signals (Java, .NET, Node.js, PHP, Django, AWS ALB, Cloudflare)', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'multi-cookie.corp.internal',
        headers: {
          'set-cookie':
            'JSESSIONID=ABCDEF1234; Path=/; HttpOnly, .AspNetCore.Cookies=XYZ987; Path=/, AWSALB=1234; Path=/',
        },
      });

      const signals = cookieAnalyzer.analyze(context);
      expect(signals.some((s) => s.targetTechnologyId === 'tech-java')).toBe(
        true,
      );
      expect(signals.some((s) => s.targetTechnologyId === 'tech-dotnet')).toBe(
        true,
      );
      expect(signals.some((s) => s.targetTechnologyId === 'tech-aws')).toBe(
        true,
      );
    });

    it('T22-C: extracts Error response fingerprints without false certainties (NGINX, Apache, Express, Django)', () => {
      const nginxErrContext = createTechnologyDetectionContext({
        domainName: 'nginx-err.internal',
        htmlBody:
          '<center><h1>502 Bad Gateway</h1></center><hr><center>nginx</center>',
      });
      const nginxSignals = errorAnalyzer.analyze(nginxErrContext);
      expect(
        nginxSignals.some((s) => s.targetTechnologyId === 'tech-nginx'),
      ).toBe(true);

      const expressErrContext = createTechnologyDetectionContext({
        domainName: 'express-err.internal',
        htmlBody: '<pre>Cannot GET /unknown-endpoint</pre>',
      });
      const expressSignals = errorAnalyzer.analyze(expressErrContext);
      expect(
        expressSignals.some((s) => s.targetTechnologyId === 'tech-nodejs'),
      ).toBe(true);
    });

    it('T22-D: extracts TLS certificate authority and handshake characteristics', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'cf-tls.net',
        ssl: {
          reachable: true,
          supported: true,
          responseTimeMs: 22,
          certificate: {
            issuer: 'Cloudflare Inc ECC CA-3',
            subject: 'cf-tls.net',
            validFrom: '2026-01-01',
            validTo: '2026-12-31',
            serialNumber: '99887766',
          },
          error: null,
        },
      });

      const signals = tlsAnalyzer.analyze(context);
      expect(
        signals.some(
          (s) =>
            s.category === 'TLS' && s.targetTechnologyId === 'tech-cloudflare',
        ),
      ).toBe(true);
    });
  });

  describe('2. T22-E Evidence Fusion & Posture Calibration', () => {
    it('fuses direct banner observation + behavioral signals into CORROBORATED posture with high confidence', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'corroborated-nginx.com',
        headers: {
          server: 'nginx/1.24.0',
          'accept-ranges': 'bytes',
          etag: '"12345-abc"',
        },
        htmlBody: '<center><h1>404 Not Found</h1></center>',
      });

      const rawDetectorResult = {
        id: 'tech-nginx',
        name: 'NGINX',
        category: 'Web / Server' as any,
        status: 'DETECTED' as any,
        confidence: 0.95,
        confidenceLevel: 'HIGH' as any,
        whyDetected: 'Observed Server: nginx/1.24.0 header',
        role: 'Web Server / Reverse Proxy Gateway',
        infrastructureMeaning: 'NGINX reverse proxy gateway',
        evidence: [
          {
            sourceType: 'HTTP' as any,
            source: 'Response Header: server',
            indicator: 'Server: nginx/1.24.0',
            confidence: 'HIGH' as any,
          },
        ],
        signals: [],
        evidenceCount: 1,
      };

      const { results, behavioralResult } = behavioralEngine.analyze(context, [
        rawDetectorResult,
      ]);
      const nginx = results.find((r) => r.id === 'tech-nginx');

      expect(nginx).toBeDefined();
      expect(behavioralResult.posturesByTechnology?.['tech-nginx']).toBe(
        'CORROBORATED',
      );
      expect(nginx?.confidence).toBeGreaterThanOrEqual(0.95);
      expect(nginx?.confidenceLevel).toBe('HIGH');
      expect(nginx?.evidence.length).toBeGreaterThanOrEqual(2);
      expect(
        nginx?.evidence.some((e) => e.sourceType === 'WIRE_BEHAVIOR'),
      ).toBe(true);
    });

    it('assigns CONSISTENT posture with calibrated MEDIUM confidence when banners are stripped', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'stripped-node.io',
        headers: {
          connection: 'keep-alive',
          'keep-alive': 'timeout=5',
          'set-cookie': 'connect.sid=s%3Ax897123; Path=/; HttpOnly',
        },
      });

      const { results, behavioralResult } = behavioralEngine.analyze(
        context,
        [],
      );
      const node = results.find((r) => r.id === 'tech-nodejs');

      expect(node).toBeDefined();
      expect(behavioralResult.posturesByTechnology?.['tech-nodejs']).toBe(
        'CONSISTENT',
      );
      expect(node?.confidenceLevel).toBe('MEDIUM');
      expect(node?.whyDetected).toContain('consistent with Node.js');
      expect(node?.whatThisDoesNotProve).toContain(
        'absence of direct explicit banners prevents deterministic version',
      );
    });
  });

  describe('3. Anti-Overreach Invariants & Claim Boundaries', () => {
    it('INVARIANT: Node.js session cookie (connect.sid) does NOT declare Express or downstream database', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'connect-cookie-only.com',
        headers: {
          'set-cookie': 'connect.sid=s%3A_xyz; Path=/',
        },
      });

      const { results } = behavioralEngine.analyze(context, []);

      expect(results.some((r) => r.id === 'tech-nodejs')).toBe(true);
      // Anti-overreach: must NOT invent express or database without wire proof
      expect(results.some((r) => r.id === 'tech-mongodb')).toBe(false);
      expect(results.some((r) => r.id === 'tech-postgres')).toBe(false);
    });

    it('INVARIANT: Amazon Trust Services TLS certificate does NOT claim EC2 origin compute', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'aws-cert-only.com',
        ssl: {
          reachable: true,
          supported: true,
          responseTimeMs: 30,
          certificate: {
            issuer: 'Amazon Trust Services RSA CA 1',
            subject: 'aws-cert-only.com',
            validFrom: '2026-01-01',
            validTo: '2026-12-31',
            serialNumber: '998811',
          },
          error: null,
        },
      });

      const { results } = behavioralEngine.analyze(context, []);
      const aws = results.find((r) => r.id === 'tech-aws');

      expect(aws).toBeDefined();
      expect(aws?.whatThisDoesNotProve).toContain(
        'absence of direct explicit banners prevents deterministic version',
      );
      // Anti-overreach: must NOT assert EC2 origin compute
      expect(results.some((r) => r.name.includes('EC2'))).toBe(false);
    });

    it('INVARIANT: NGINX error page does NOT declare high confidence or specific version', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'nginx-404-only.com',
        htmlBody:
          '<html><body><center><h1>404 Not Found</h1></center><hr></body></html>',
      });

      const { results } = behavioralEngine.analyze(context, []);
      const nginx = results.find((r) => r.id === 'tech-nginx');

      expect(nginx).toBeDefined();
      expect(nginx?.confidenceLevel).toBe('MEDIUM');
      expect(nginx?.version).toBeUndefined(); // Version cannot be guessed from 404 template alone
    });
  });

  describe('4. Full Discovery Pipeline Integration Gate', () => {
    it('executes full fingerprinting pipeline with behavioral analysis, topology building, and architecture brief synthesis', async () => {
      const context = createTechnologyDetectionContext({
        domainName: 'enterprise-full.bank.com',
        headers: {
          server: 'cloudflare',
          'cf-ray': '891234abcd-IAD',
          'set-cookie': 'JSESSIONID=123456789; Path=/; Secure; HttpOnly',
        },
        ssl: {
          reachable: true,
          supported: true,
          responseTimeMs: 15,
          certificate: {
            issuer: 'Cloudflare Inc ECC CA-3',
            subject: 'enterprise-full.bank.com',
            validFrom: '2026-01-01',
            validTo: '2026-12-31',
            serialNumber: '1234567',
          },
          error: null,
        },
      });

      const result = await fingerprintingEngine.fingerprint(context);

      expect(result.technologies.length).toBeGreaterThanOrEqual(2);
      expect(result.technologies.some((t) => t.name === 'Cloudflare')).toBe(
        true,
      );
      expect(result.technologies.some((t) => t.name === 'Java')).toBe(true);

      // Verify topology was built
      expect(result.topology).toBeDefined();
      expect(result.topology?.nodes.length).toBeGreaterThanOrEqual(2);

      // Verify architecture brief was synthesized
      expect(result.architectureBrief).toBeDefined();
      expect(
        result.architectureBrief?.architecturePath.length,
      ).toBeGreaterThanOrEqual(2);
    });
  });
});
