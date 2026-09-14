import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { GcpDetector } from '../../infrastructure/discovery/technology/detectors/cloud/gcp.detector';
import { GoogleCloudCdnDetector } from '../../infrastructure/discovery/technology/detectors/cdn/google-cloud-cdn.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';
import { DeepBehavioralFingerprintingEngine } from '../../infrastructure/discovery/technology/engine/deep-behavioral-fingerprinting.engine';

describe('T26: Google Cloud Platform (GCP) Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let gcpDetector: GcpDetector;
  let googleCloudCdnDetector: GoogleCloudCdnDetector;
  let behavioralEngine: DeepBehavioralFingerprintingEngine;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    gcpDetector = moduleRef.get(GcpDetector);
    googleCloudCdnDetector = moduleRef.get(GoogleCloudCdnDetector);
    behavioralEngine = moduleRef.get(DeepBehavioralFingerprintingEngine);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  // ---------------------------------------------------------------------------
  // 1. Component-Specific GCP Detection (TECH-001)
  // ---------------------------------------------------------------------------
  describe('1. Component-Specific GCP Detection (TECH-001)', () => {
    it('detects Google Cloud CDN from via: google and x-goog-generation headers', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['34.120.15.22'],
          cname: ['c.storage.googleapis.com'],
          ns: ['ns-cloud-b1.googledomains.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://cdn-assets.gcp-service.io',
          finalUrl: 'https://cdn-assets.gcp-service.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 32,
          headers: {
            via: '1.1 google',
            'x-goog-generation': '1689234567891234',
            'x-goog-metageneration': '1',
            'x-goog-hash': 'crc32c=AbCd12==',
            'x-guploader-uploadid': 'ADPycdv1234',
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
        'cdn-assets.gcp-service.io',
        snapshot,
      );

      const cdn = result.technologies.find(
        (t) => t.id === 'tech-google-cloud-cdn',
      );
      expect(cdn).toBeDefined();
      expect(cdn?.name).toBe('Google Cloud CDN');
      expect(cdn?.category).toBe('CDN / Edge');
      expect(cdn?.confidenceLevel).toBe('HIGH');
      expect(cdn?.role).toBe('Edge Delivery / CDN Ingress');
      expect(cdn?.evidence.length).toBeGreaterThanOrEqual(3);
    });

    it('detects Google Cloud Platform and Cloud Run from Server: gws and x-cloud-trace-context', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['216.239.32.21'],
          cname: ['service-prod-xyz.a.run.app'],
          ns: ['ns-cloud-c1.googledomains.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://api.gcp-cloudrun.app',
          finalUrl: 'https://api.gcp-cloudrun.app',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'gws',
            'x-cloud-trace-context':
              '4bf92f3577b34da6a3ce929d0e0e4736/0000000000000001;o=1',
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
          valid: true,
          authorized: true,
          certificate: {
            issuer: 'CN=GTS CA 1C3, O=Google Trust Services LLC, C=US',
            subject: 'CN=api.gcp-cloudrun.app',
            validFrom: '2026-01-01',
            validTo: '2026-12-31',
            daysUntilExpiration: 120,
            selfSigned: false,
            altNames: ['api.gcp-cloudrun.app'],
            fingerprint: 'AB:CD:EF:12:34:56',
          },
          protocol: 'TLSv1.3',
          cipher: 'TLS_AES_256_GCM_SHA384',
        } as any,
      };

      const result = await techDiscovery.discover(
        'api.gcp-cloudrun.app',
        snapshot,
      );

      const gcp = result.technologies.find((t) => t.id === 'tech-google-cloud');
      expect(gcp).toBeDefined();
      expect(gcp?.name).toBe('Google Cloud Platform (GCP)');
      expect(gcp?.category).toBe('Cloud / Infrastructure');
      expect(gcp?.confidenceLevel).toBe('HIGH');
      expect(gcp?.role).toBe('Cloud Ingress & Managed Platform');
      expect(gcp?.evidence.length).toBeGreaterThanOrEqual(4);
    });

    it('detects Google Cloud DNS when authoritative nameservers resolve to googledomains.com', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['198.51.100.45'],
          cname: [],
          ns: [
            'ns-cloud-e1.googledomains.com',
            'ns-cloud-e2.googledomains.com',
          ],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://dns-gcp-managed.com',
          finalUrl: 'https://dns-gcp-managed.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 65,
          headers: {
            server: 'nginx/1.24.0',
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
        'dns-gcp-managed.com',
        snapshot,
      );

      const gcp = result.technologies.find((t) => t.id === 'tech-google-cloud');
      expect(gcp).toBeDefined();
      expect(gcp?.role).toBe('Authoritative DNS (Google Cloud DNS)');
    });

    it('detects Google Trust Services TLS certificate authority', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['192.0.2.100'],
          cname: [],
          ns: ['ns1.other-dns.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://gts-secure.org',
          finalUrl: 'https://gts-secure.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: { server: 'envoy' },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        ssl: {
          valid: true,
          authorized: true,
          certificate: {
            issuer: 'CN=GTS Root R1, O=Google Trust Services LLC, C=US',
            subject: 'CN=gts-secure.org',
            validFrom: '2026-01-01',
            validTo: '2026-12-31',
            daysUntilExpiration: 150,
            selfSigned: false,
            altNames: ['gts-secure.org'],
            fingerprint: '12:34:56:78:90:AB',
          },
          protocol: 'TLSv1.3',
          cipher: 'TLS_AES_128_GCM_SHA256',
        } as any,
      };

      const result = await techDiscovery.discover('gts-secure.org', snapshot);

      const gcp = result.technologies.find((t) => t.id === 'tech-google-cloud');
      expect(gcp).toBeDefined();
      const tlsEvidence = gcp?.evidence.find((e) => e.sourceType === 'TLS');
      expect(tlsEvidence).toBeDefined();
      expect(tlsEvidence?.indicator).toContain('Google Trust Services');
    });

    it('returns negative detection when no Google Cloud signals exist', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['93.184.216.34'],
          cname: [],
          ns: ['ns1.amazon.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://plain-origin.net',
          finalUrl: 'https://plain-origin.net',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 40,
          headers: {
            server: 'Apache/2.4.58',
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

      const result = await techDiscovery.discover('plain-origin.net', snapshot);

      const gcp = result.technologies.find((t) => t.id === 'tech-google-cloud');
      const gcpCdn = result.technologies.find(
        (t) => t.id === 'tech-google-cloud-cdn',
      );
      expect(gcp).toBeUndefined();
      expect(gcpCdn).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Strict Anti-Overreach Boundaries (TECH-002)
  // ---------------------------------------------------------------------------
  describe('2. Strict Anti-Overreach Boundaries (TECH-002)', () => {
    it('enforces rigorous whatThisDoesNotProve boundaries preventing GKE/CloudSQL assumptions', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['35.244.128.1'],
          cname: ['app.run.app'],
          ns: ['ns-cloud-a1.googledomains.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://app-claim-test.com',
          finalUrl: 'https://app-claim-test.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 22,
          headers: {
            server: 'gws',
            'x-cloud-trace-context': '000100020003/1',
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
        'app-claim-test.com',
        snapshot,
      );
      const gcp = result.technologies.find((t) => t.id === 'tech-google-cloud');

      expect(gcp?.whatThisDoesNotProve).toBeDefined();
      expect(gcp?.whatThisDoesNotProve).toContain(
        'Google Kubernetes Engine (GKE)',
      );
      expect(gcp?.whatThisDoesNotProve).toContain('Compute Engine VMs');
      expect(gcp?.whatThisDoesNotProve).toContain('Cloud SQL');
      expect(gcp?.whatThisDoesNotProve).toContain('Spanner');
    });

    it('enforces that Google Cloud CDN does not prove Cloud Storage origin', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['34.120.15.22'],
          cname: ['c.storage.googleapis.com'],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://cdn-boundary-test.com',
          finalUrl: 'https://cdn-boundary-test.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            via: '1.1 google',
            'x-goog-generation': '12345678',
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
        'cdn-boundary-test.com',
        snapshot,
      );
      const cdn = result.technologies.find(
        (t) => t.id === 'tech-google-cloud-cdn',
      );

      expect(cdn?.whatThisDoesNotProve).toBeDefined();
      expect(cdn?.whatThisDoesNotProve).toContain('Google Cloud Storage');
      expect(cdn?.whatThisDoesNotProve).toContain('Cloud Run');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Hop Ingress & Coexistence
  // ---------------------------------------------------------------------------
  describe('3. Multi-Hop Ingress & Coexistence', () => {
    it('composes multi-tier topology with Google Cloud CDN, NGINX, and Node.js', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['34.120.15.22'],
          cname: ['c.storage.googleapis.com'],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://multi-hop-gcp.com',
          finalUrl: 'https://multi-hop-gcp.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            via: '1.1 google',
            'x-goog-generation': '987654321',
            server: 'nginx/1.24.0',
            'x-powered-by': 'Express',
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
        'multi-hop-gcp.com',
        snapshot,
      );

      const cdn = result.technologies.find(
        (t) => t.id === 'tech-google-cloud-cdn',
      );
      const nginx = result.technologies.find((t) => t.id === 'tech-nginx');
      const nodejs = result.technologies.find((t) => t.id === 'tech-nodejs');

      expect(cdn).toBeDefined();
      expect(nginx).toBeDefined();
      expect(nodejs).toBeDefined();
    });

    it('preserves Cloudflare at EDGE fronting Google Cloud Platform at GATEWAY/PLATFORM', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.21.50.10'],
          cname: [],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://cf-fronting-gcp.com',
          finalUrl: 'https://cf-fronting-gcp.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'cf-ray': '891234567-iad',
            server: 'cloudflare',
            'x-cloud-trace-context': '000100020003/1',
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
        'cf-fronting-gcp.com',
        snapshot,
      );

      const cf = result.technologies.find((t) => t.id === 'tech-cloudflare');
      const gcp = result.technologies.find((t) => t.id === 'tech-google-cloud');

      expect(cf).toBeDefined();
      expect(gcp).toBeDefined();
      expect(cf?.name).toBe('Cloudflare');
      expect(gcp?.name).toBe('Google Cloud Platform (GCP)');
    });

    it('preserves Envoy at GATEWAY fronting Google Cloud Run', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['34.120.10.10'],
          cname: ['app.a.run.app'],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://envoy-gcp.io',
          finalUrl: 'https://envoy-gcp.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 18,
          headers: {
            server: 'envoy',
            'x-envoy-upstream-service-time': '15',
            'x-cloud-trace-context': '000100020003/1',
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

      const result = await techDiscovery.discover('envoy-gcp.io', snapshot);

      const envoy = result.technologies.find((t) => t.id === 'tech-envoy');
      const gcp = result.technologies.find((t) => t.id === 'tech-google-cloud');

      expect(envoy).toBeDefined();
      expect(gcp).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. T22 Behavioral Fingerprinting Engine & Corroboration
  // ---------------------------------------------------------------------------
  describe('4. Behavioral Fingerprinting & Posture Fusion', () => {
    it('computes CORROBORATED confidence when direct headers and Google TLS CA are present', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['216.239.32.21'],
          cname: [],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://corroborated-gcp.com',
          finalUrl: 'https://corroborated-gcp.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'gws',
            'x-cloud-trace-context': 'trace-12345/1',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        tls: {
          valid: true,
          authorized: true,
          issuer: 'CN=GTS CA 1C3, O=Google Trust Services LLC, C=US',
          subject: 'CN=corroborated-gcp.com',
          protocol: 'TLSv1.3',
          cipher: 'TLS_AES_256_GCM_SHA384',
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
          daysUntilExpiration: 120,
          selfSigned: false,
          sans: ['corroborated-gcp.com'],
          fingerprint: 'AA:BB:CC:DD:EE:FF',
        },
      };

      const result = await techDiscovery.discover(
        'corroborated-gcp.com',
        snapshot,
      );
      const gcp = result.technologies.find((t) => t.id === 'tech-google-cloud');

      expect(gcp?.confidence).toBeGreaterThanOrEqual(0.95);
      expect(gcp?.confidenceLevel).toBe('HIGH');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Snapshot Memory & Immutability
  // ---------------------------------------------------------------------------
  describe('5. Snapshot Memory & Immutability', () => {
    it('produces deterministic immutable fingerprint for GCP architecture snapshot', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['34.120.15.22'],
          cname: ['app.run.app'],
          ns: ['ns-cloud-a1.googledomains.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://deterministic-gcp.com',
          finalUrl: 'https://deterministic-gcp.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'gws',
            'x-cloud-trace-context': '000100020003/1',
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

      const discovery1 = await techDiscovery.discover(
        'deterministic-gcp.com',
        snapshot,
      );
      const discovery2 = await techDiscovery.discover(
        'deterministic-gcp.com',
        snapshot,
      );

      expect(discovery1.technologies.length).toEqual(
        discovery2.technologies.length,
      );
      expect(discovery1.technologies.map((t) => t.id)).toEqual(
        discovery2.technologies.map((t) => t.id),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 6. InfrastructureOverviewMapper Convergence
  // ---------------------------------------------------------------------------
  describe('6. InfrastructureOverviewMapper Convergence', () => {
    it('correctly maps GCP snapshot to InfrastructureOverview architecture model', () => {
      const mockSnapshot = {
        id: 'snap-gcp-prod',
        domainId: 'dom-gcp-prod',
        jobId: 'job-gcp-001',
        createdAt: new Date(),
        payload: {
          dns: {
            ns: ['ns-cloud-a1.googledomains.com'],
            a: ['34.120.15.22'],
            cname: ['c.storage.googleapis.com'],
          },
          http: {
            statusCode: 200,
            headers: {
              server: 'gws',
              via: '1.1 google',
            },
          },
          ssl: {
            authorized: true,
            certificate: {
              issuer: 'Google Trust Services',
            },
          },
          technology: {
            architectureBrief: {
              summary:
                'Public endpoint uses Google Cloud CDN edge and Google Cloud Platform infrastructure.',
              architecturePath: [
                {
                  hop: 0,
                  layer: TopologyLayer.EDGE,
                  technologyId: 'public-endpoint',
                  technologyName: 'Public Endpoint',
                  role: 'Ingress',
                },
                {
                  hop: 1,
                  layer: TopologyLayer.EDGE,
                  technologyId: 'tech-google-cloud-cdn',
                  technologyName: 'Google Cloud CDN',
                  role: 'Edge Delivery',
                },
                {
                  hop: 2,
                  layer: TopologyLayer.GATEWAY,
                  technologyId: 'tech-google-cloud',
                  technologyName: 'Google Cloud Platform (GCP)',
                  role: 'Cloud Gateway',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.EDGE,
                  technologies: [
                    {
                      technologyId: 'tech-google-cloud-cdn',
                      name: 'Google Cloud CDN',
                      role: 'Edge Delivery',
                      layer: TopologyLayer.EDGE,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-google-cloud',
                  name: 'Google Cloud Platform (GCP)',
                  role: 'Cloud Gateway',
                  layer: TopologyLayer.GATEWAY,
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-google-cloud',
                  technologyName: 'Google Cloud Platform (GCP)',
                  boundary:
                    'GCP edge presence does not prove GKE or Cloud SQL compute',
                },
              ],
              confidence: { overallLevel: 'HIGH', overallScore: 0.98 },
            },
          },
        },
      };

      const overview = InfrastructureOverviewMapper.fromSnapshot(
        mockSnapshot as any,
      );
      expect(overview.cdn).toBe('Google Cloud CDN');
      expect(overview.dnsProvider).toBe('Google Cloud DNS');
      expect(overview.technologyArchitecture).toBeDefined();
      expect(overview.technologyArchitecture?.architectureSummary).toContain(
        'Google Cloud',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('Google Cloud CDN');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Negative Anti-Overreach Invariants
  // ---------------------------------------------------------------------------
  describe('7. Negative Anti-Overreach Invariants', () => {
    it('strictly avoids manufacturing GKE, Compute Engine VMs, Cloud SQL, Spanner, Bigtable, Firestore, or private VPC from GCP edge evidence', () => {
      expect(gcpDetector.id).toBe('tech-google-cloud');
      expect(gcpDetector.whatThisDoesNotProve).toContain(
        'Google Kubernetes Engine (GKE)',
      );
      expect(gcpDetector.whatThisDoesNotProve).toContain('Compute Engine VMs');
      expect(gcpDetector.whatThisDoesNotProve).toContain('Cloud Functions');
      expect(gcpDetector.whatThisDoesNotProve).toContain('Cloud SQL');
      expect(gcpDetector.whatThisDoesNotProve).toContain('Spanner');
      expect(gcpDetector.whatThisDoesNotProve).toContain('Bigtable');
      expect(gcpDetector.whatThisDoesNotProve).toContain('Firestore');
      expect(gcpDetector.whatThisDoesNotProve).toContain(
        'private VPC Service Controls',
      );

      expect(googleCloudCdnDetector.id).toBe('tech-google-cloud-cdn');
      expect(googleCloudCdnDetector.whatThisDoesNotProve).toContain(
        'Google Cloud Storage',
      );
      expect(googleCloudCdnDetector.whatThisDoesNotProve).toContain(
        'Cloud Run',
      );
      expect(googleCloudCdnDetector.whatThisDoesNotProve).toContain('GKE');
    });
  });
});
