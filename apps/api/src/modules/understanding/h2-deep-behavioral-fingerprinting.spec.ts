import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';

describe('H2: Deep Wire & Behavioral Fingerprinting Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let findingEngine: FindingRuleEngineService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    findingEngine = moduleRef.get(FindingRuleEngineService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. H2-001 & H2-002: HTTP and HTTP/2 Behavioral Fingerprinting', () => {
    it('corroborates Node.js runtime behavior via socket keep-alive parameterization and session cookie when Server header is stripped', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://api.stripped-node-backend.io',
          finalUrl: 'https://api.stripped-node-backend.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 32,
          headers: {
            connection: 'keep-alive',
            'keep-alive': 'timeout=5',
            'set-cookie':
              'connect.sid=s%3A992837482.abcdef; Path=/; HttpOnly; Secure',
            'content-type': 'application/json; charset=utf-8',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover(
        'api.stripped-node-backend.io',
        snapshot,
      );

      const node = result.technologies.find((t) => t.id === 'tech-nodejs');
      expect(node).toBeDefined();
      expect(node?.name).toBe('Node.js');
      expect(node?.category).toBe('Infrastructure Runtime');
      expect(['HIGH', 'MEDIUM']).toContain(node?.confidenceLevel);
      // Strict anti-overreach: no fabricated version when banner was stripped
      expect(node?.version).toBeUndefined();
      expect(node?.evidence.some((e) => e.sourceType === 'WIRE_BEHAVIOR')).toBe(
        true,
      );
      expect((node as any).behavioralPosture).toBe('CORROBORATED');
    });

    it('identifies HTTP/2 protocol quirk and multiplexed transport characteristics', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://http2-origin.internal.net',
          finalUrl: 'https://http2-origin.internal.net',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 18,
          headers: {
            ':status': '200',
            'x-http2': 'true',
            'content-type': 'text/html',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover(
        'http2-origin.internal.net',
        snapshot,
      );

      expect(result.behavioralFingerprint).toBeDefined();
      expect(
        result.behavioralFingerprint?.matchedSignaturesCount,
      ).toBeGreaterThanOrEqual(1);
      const http2Sig = result.behavioralFingerprint?.signals.find(
        (s) =>
          s.type === 'PROTOCOL_QUIRK_FINGERPRINT' &&
          s.description.includes('HTTP/2'),
      );
      expect(http2Sig).toBeDefined();
      expect(http2Sig?.strength).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('2. H2-003: TLS Behavioral Fingerprinting', () => {
    it('corroborates Cloudflare edge infrastructure through TLS certificate issuer and handshake characteristics', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://cf-stripped.finance.org',
          finalUrl: 'https://cf-stripped.finance.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'content-type': 'text/html',
            'cf-ray': '89b2c3d4e5f6-IAD',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        ssl: {
          reachable: true,
          supported: true,
          protocol: 'TLSv1.3',
          cipher: 'TLS_AES_256_GCM_SHA384',
          responseTimeMs: 20,
          certificate: {
            issuer: 'Cloudflare Inc ECC CA-3',
            subject: 'cf-stripped.finance.org',
            validFrom: '2026-01-01',
            validTo: '2026-12-31',
            serialNumber: '1122334455',
          },
          error: null,
        },
      };

      const result = await techDiscovery.discover(
        'cf-stripped.finance.org',
        snapshot,
      );

      const cf = result.technologies.find((t) => t.id === 'tech-cloudflare');
      expect(cf).toBeDefined();
      expect(cf?.name).toBe('Cloudflare');
      expect(cf?.category).toBe('CDN / Edge');
      expect(cf?.confidenceLevel).toBe('HIGH');
      expect(
        cf?.evidence.some(
          (e) => e.source.includes('TLS') || e.indicator.includes('Cloudflare'),
        ),
      ).toBe(true);
    });

    it("identifies Let's Encrypt TLS certificate profile without falsely assuming cloud origin (H2-006 anti-overreach)", async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://independent-selfhosted.org',
          finalUrl: 'https://independent-selfhosted.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'content-type': 'text/html',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        ssl: {
          reachable: true,
          supported: true,
          protocol: 'TLSv1.3',
          cipher: 'TLS_AES_128_GCM_SHA256',
          responseTimeMs: 22,
          certificate: {
            issuer: "Let's Encrypt Authority X3",
            subject: 'independent-selfhosted.org',
            validFrom: '2026-01-01',
            validTo: '2026-04-01',
            serialNumber: '99887766',
          },
          error: null,
        },
      };

      const result = await techDiscovery.discover(
        'independent-selfhosted.org',
        snapshot,
      );

      // Must NOT falsely claim AWS, Cloudflare, Azure, or GCP
      const edgeTechs = result.technologies.filter(
        (t) =>
          t.category === 'CDN / Edge' || t.category === 'Cloud Infrastructure',
      );
      expect(edgeTechs.length).toBe(0);

      // TLS handshake and certificate signals must be safely captured in behavioral signals
      const leSig = result.behavioralFingerprint?.signals.find(
        (s) =>
          s.type === 'TLS_CERT_ISSUER_FINGERPRINT' &&
          s.description.includes("Let's Encrypt"),
      );
      expect(leSig).toBeDefined();
      expect(leSig?.confidenceLevel).toBe('MEDIUM');
    });
  });

  describe('3. H2-004: Error Behavior Fingerprinting', () => {
    it('fingerprints NGINX gateway from canonical centered HTML error layout when Server header is stripped', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://hardened-gateway.corp.com/non-existent-route',
          finalUrl: 'https://hardened-gateway.corp.com/non-existent-route',
          protocol: 'https',
          statusCode: 404,
          responseTimeMs: 28,
          headers: {
            'content-type': 'text/html',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        htmlBody:
          '<html><head><title>404 Not Found</title></head><body><center><h1>404 Not Found</h1></center><hr><center>nginx</center></body></html>',
      };

      const result = await techDiscovery.discover(
        'hardened-gateway.corp.com',
        snapshot,
      );

      const nginx = result.technologies.find((t) => t.id === 'tech-nginx');
      expect(nginx).toBeDefined();
      expect(nginx?.name).toBe('NGINX');
      expect(nginx?.category).toBe('Web / Server');
      expect(
        nginx?.evidence.some(
          (e) =>
            e.indicator.includes('<center><h1>Error</h1></center>') ||
            e.source.includes('Error Template'),
        ),
      ).toBe(true);
      expect(nginx?.whyDetected).toContain('NGINX');
    });

    it('fingerprints Express.js router unmatched path signature from error response body', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://api.node-service.internal/missing',
          finalUrl: 'https://api.node-service.internal/missing',
          protocol: 'https',
          statusCode: 404,
          responseTimeMs: 15,
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        htmlBody:
          '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Error</title></head><body><pre>Cannot GET /missing</pre></body></html>',
      };

      const result = await techDiscovery.discover(
        'api.node-service.internal',
        snapshot,
      );

      const node = result.technologies.find((t) => t.id === 'tech-nodejs');
      expect(node).toBeDefined();
      expect(node?.name).toBe('Node.js');
      expect(node?.category).toBe('Infrastructure Runtime');
    });
  });

  describe('4. H2-005 & H2-006: Evidence Correlation Engine & Anti-False-Positive Boundary', () => {
    it('fuses Direct Server Banner + Behavioral Corroboration into HIGH confidence CORROBORATED posture', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://corroborated-nginx.com',
          finalUrl: 'https://corroborated-nginx.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'nginx/1.24.0',
            'accept-ranges': 'bytes',
            etag: '"65a123-1b4"',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover(
        'corroborated-nginx.com',
        snapshot,
      );

      const nginx = result.technologies.find((t) => t.id === 'tech-nginx');
      expect(nginx).toBeDefined();
      expect(nginx?.confidenceLevel).toBe('HIGH');
      expect(nginx?.confidence).toBeGreaterThanOrEqual(0.95);
      expect((nginx as any).behavioralPosture).toBe('CORROBORATED');
      expect(nginx?.evidence.length).toBeGreaterThanOrEqual(2);
    });

    it('assigns MEDIUM confidence and non-dogmatic claims when only behavioral wire evidence exists', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://behavior-only.com',
          finalUrl: 'https://behavior-only.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'accept-ranges': 'bytes',
            etag: '"65a123-1b4"',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover(
        'behavior-only.com',
        snapshot,
      );

      const nginx = result.technologies.find((t) => t.id === 'tech-nginx');
      expect(nginx).toBeDefined();
      expect(nginx?.confidenceLevel).toBe('MEDIUM');
      expect((nginx as any).behavioralPosture).toBe('CONSISTENT');
      expect(nginx?.whyDetected).toContain('consistent with');
      expect(nginx?.whatThisDoesNotProve).toContain(
        'absence of direct explicit banners',
      );
    });

    it('leaves technology as UNOBSERVED when evidence is insufficient for attribution', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://generic-minimal.com',
          finalUrl: 'https://generic-minimal.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 50,
          headers: {
            'content-type': 'text/plain',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover(
        'generic-minimal.com',
        snapshot,
      );

      // No unevidenced technologies should be manufactured
      expect(result.technologies.length).toBe(0);
      expect(
        result.architectureBrief?.knownUnknowns.length,
      ).toBeGreaterThanOrEqual(3);
    });
  });

  describe('5. H2-007: Integration with H1 Topology Understanding', () => {
    it('seamlessly integrates behavioral discoveries into H1 Request Path without creating phantom hops', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://hybrid-wire.tech',
          finalUrl: 'https://hybrid-wire.tech',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'cf-ray': '89b3f4a1-IAD',
            connection: 'keep-alive',
            'keep-alive': 'timeout=5',
            'set-cookie': 'JSESSIONID=88776655; Path=/; HttpOnly',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        ssl: {
          reachable: true,
          supported: true,
          protocol: 'TLSv1.3',
          certificate: {
            issuer: 'Cloudflare Inc ECC CA-3',
            subject: 'hybrid-wire.tech',
            validFrom: '2026-01-01',
            validTo: '2026-12-31',
            serialNumber: '55667788',
          },
          error: null,
        },
      };

      const result = await techDiscovery.discover('hybrid-wire.tech', snapshot);

      const brief = result.architectureBrief;
      const path = brief.architecturePath;

      // H1 topology validation: Hop 0 (Client) -> Hop 1 (Cloudflare EDGE) -> Hop 2 (Java RUNTIME) -> Sealed Core
      expect(path.length).toBeGreaterThanOrEqual(3);

      const edgeHop = path.find(
        (p) =>
          p.layer === TopologyLayer.EDGE &&
          p.technologyId === 'tech-cloudflare',
      );
      expect(edgeHop).toBeDefined();
      expect(edgeHop?.technologyName).toBe('Cloudflare');

      const runtimeHop = path.find(
        (p) =>
          p.layer === TopologyLayer.RUNTIME && p.technologyId === 'tech-java',
      );
      expect(runtimeHop).toBeDefined();
      expect(runtimeHop?.technologyName).toBe('Java');

      // Database and Cache must remain unobserved in knownUnknowns
      expect(
        brief.knownUnknowns.some(
          (u) => u.dimension === 'Database Backend Layer',
        ),
      ).toBe(true);
      expect(
        brief.knownUnknowns.some(
          (u) => u.dimension === 'In-Memory Caching Tier',
        ),
      ).toBe(true);
    });
  });

  describe('6. H2-008: Progressive Disclosure Mapping', () => {
    it('preserves Level 1, Level 2, and Level 3 progressive disclosure lineage through DTO mapping', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://disclosure-test.org',
          finalUrl: 'https://disclosure-test.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'x-vercel-id': 'iad1::iad1::abcd1234',
            'x-vercel-cache': 'HIT',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover(
        'disclosure-test.org',
        snapshot,
      );
      const dto = InfrastructureOverviewMapper.fromSnapshot({
        id: 'snap-123',
        domainId: 'dom-123',
        payload: {
          ...snapshot,
          technology: result,
        } as any,
        httpStatus: 200,
        responseTimeMs: 30,
        createdAt: new Date('2026-08-29T14:00:00Z'),
      } as any);

      const techArch = dto.technologyArchitecture;
      expect(techArch).toBeDefined();

      const vercel = techArch?.keyTechnologies.find(
        (t) => t.technologyId === 'tech-vercel',
      );
      expect(vercel).toBeDefined();

      // Level 1: Understanding
      expect(vercel?.name).toBe('Vercel');
      expect(vercel?.role).toBe('Edge Platform / Frontend Serverless Ingress');
      expect(['EDGE', 'PLATFORM']).toContain(vercel?.layer);
      expect(vercel?.confidenceLevel).toBe('HIGH');

      // Level 2: Why this appears & Meaning
      expect(vercel?.whyDetected).toBeDefined();
      expect(vercel?.infrastructureMeaning).toBeDefined();
      expect(vercel?.whatThisDoesNotProve).toBeDefined();

      // Level 3: Raw Evidence & Indicators
      expect(vercel?.evidence.length).toBeGreaterThanOrEqual(1);
      expect(
        vercel?.evidence.some((e) => e.indicator.includes('x-vercel')),
      ).toBe(true);
      expect(
        vercel?.evidence.some(
          (e) => e.sourceType === 'WIRE_BEHAVIOR' || e.sourceType === 'HTTP',
        ),
      ).toBe(true);
    });
  });

  describe('7. H2-009: Findings Boundary (Zero Phantom Vulnerabilities)', () => {
    it('does NOT manufacture security vulnerability findings solely from behavioral signals or protocol fingerprints', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://secure-modern.app',
          finalUrl: 'https://secure-modern.app',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            ':status': '200',
            'x-http2': 'true',
            'strict-transport-security':
              'max-age=31536000; includeSubDomains; preload',
            'content-security-policy': "default-src 'self'",
            'x-frame-options': 'DENY',
            'x-content-type-options': 'nosniff',
            'referrer-policy': 'strict-origin-when-cross-origin',
            'x-vercel-id': 'iad1::iad1::12345',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        ssl: {
          reachable: true,
          supported: true,
          protocol: 'TLSv1.3',
          cipher: 'TLS_AES_256_GCM_SHA384',
          authorized: true,
          responseTimeMs: 15,
          certificate: {
            issuer: "Let's Encrypt Authority X3",
            subject: 'secure-modern.app',
            validFrom: '2026-01-01',
            validTo: '2026-12-31',
            serialNumber: '99881122',
          },
          error: null,
        },
      };

      const techResult = await techDiscovery.discover(
        'secure-modern.app',
        snapshot,
      );
      expect(
        techResult.behavioralFingerprint?.signals.length,
      ).toBeGreaterThanOrEqual(1);

      // Evaluate findings engine
      const findings = await findingEngine.evaluate({
        domainName: 'secure-modern.app',
        snapshot,
        technologies: techResult.technologies,
        architectureBrief: techResult.architectureBrief,
      } as any);

      // Behavioral signals (HTTP/2, Vercel, TLS 1.3) must NOT trigger any synthetic vulnerability findings
      const behavioralFindings = findings.filter(
        (f) =>
          f.title?.toLowerCase().includes('http/2') ||
          f.title?.toLowerCase().includes('wire behavior') ||
          f.title?.toLowerCase().includes('behavioral signal'),
      );
      expect(behavioralFindings.length).toBe(0);
    });
  });
});
