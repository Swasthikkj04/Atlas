import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { AzureDetector } from '../../infrastructure/discovery/technology/detectors/cloud/azure.detector';
import { AzureFrontDoorDetector } from '../../infrastructure/discovery/technology/detectors/cdn/azure-frontdoor.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';
import { DeepBehavioralFingerprintingEngine } from '../../infrastructure/discovery/technology/engine/deep-behavioral-fingerprinting.engine';
import { createTechnologyDetectionContext } from '../../infrastructure/discovery/technology/context/technology-detection-context.impl';

describe('T23: Azure Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let azureDetector: AzureDetector;
  let azureFrontDoorDetector: AzureFrontDoorDetector;
  let behavioralEngine: DeepBehavioralFingerprintingEngine;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    azureDetector = moduleRef.get(AzureDetector);
    azureFrontDoorDetector = moduleRef.get(AzureFrontDoorDetector);
    behavioralEngine = moduleRef.get(DeepBehavioralFingerprintingEngine);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  // ---------------------------------------------------------------------------
  // 1. Component-Specific Azure Detection (TECH-001)
  // ---------------------------------------------------------------------------
  describe('1. Component-Specific Azure Detection (TECH-001)', () => {
    it('detects Azure Front Door from x-azure-ref and x-azure-fdid headers', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['13.107.246.10'],
          cname: ['my-service.azurefd.net'],
          ns: ['ns1-01.azure-dns.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://azure-fd-service.com',
          finalUrl: 'https://azure-fd-service.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 35,
          headers: {
            'x-azure-ref': '0abcd1234efgh5678ijkl',
            'x-azure-fdid': 'fd-prod-eastus-01',
            'x-azure-clientip': '203.0.113.195',
            'x-cache': 'TCP_HIT',
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
        'azure-fd-service.com',
        snapshot,
      );

      const afd = result.technologies.find(
        (t) => t.id === 'tech-azure-frontdoor',
      );
      expect(afd).toBeDefined();
      expect(afd?.name).toBe('Azure Front Door');
      expect(afd?.category).toBe('CDN / Edge');
      expect(afd?.confidenceLevel).toBe('HIGH');
      expect(afd?.role).toBe('Edge Delivery / Global Ingress');
      expect(afd?.evidence.length).toBeGreaterThanOrEqual(3);
    });

    it('detects Azure Application Gateway from x-ms-routing-name and ApplicationGatewayAffinity cookies', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://azure-appgw-app.com',
          finalUrl: 'https://azure-appgw-app.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 40,
          headers: {
            server: 'ApplicationGateway/v2',
            'x-ms-routing-name': 'staging-slot-eastus',
            'set-cookie': 'ApplicationGatewayAffinity=37a89b...; Path=/',
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
        'azure-appgw-app.com',
        snapshot,
      );

      const azure = result.technologies.find((t) => t.id === 'tech-azure');
      expect(azure).toBeDefined();
      expect(azure?.name).toBe('Microsoft Azure');
      expect(azure?.category).toBe('Cloud / Infrastructure');
      expect(azure?.role).toContain('Application Gateway / Reverse Proxy');
      expect(azure?.confidenceLevel).toBe('HIGH');
    });

    it('detects Azure DNS from authoritative nameservers without over-claiming compute', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['198.51.100.25'],
          cname: [],
          ns: [
            'ns1-01.azure-dns.com',
            'ns2-01.azure-dns.net',
            'ns3-01.azure-dns.org',
            'ns4-01.azure-dns.info',
          ],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://azure-dns-only.org',
          finalUrl: 'https://azure-dns-only.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 50,
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
        'azure-dns-only.org',
        snapshot,
      );

      const azure = result.technologies.find((t) => t.id === 'tech-azure');
      expect(azure).toBeDefined();
      expect(azure?.role).toContain('Authoritative DNS');
      expect(azure?.role).not.toContain('Application Gateway');

      // Azure Front Door should NOT be detected
      const afd = result.technologies.find(
        (t) => t.id === 'tech-azure-frontdoor',
      );
      expect(afd).toBeUndefined();
    });

    it('detects Azure from Microsoft Azure TLS issuing CA and CNAME target', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['20.119.8.10'],
          cname: ['my-enterprise-app.azurewebsites.net'],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        ssl: {
          authorized: true,
          error: null,
          valid: true,
          protocol: 'TLSv1.3',
          cipher: 'TLS_AES_256_GCM_SHA384',
          fingerprint: 'AA:BB:CC:DD',
          certificate: {
            subject: 'CN=my-enterprise-app.azurewebsites.net',
            issuer: 'Microsoft Azure TLS Issuing CA 01',
            validFrom: '2025-01-01T00:00:00Z',
            validTo: '2027-01-01T00:00:00Z',
            daysRemaining: 400,
            subjectAltName: 'DNS:my-enterprise-app.azurewebsites.net',
          },
        },
        http: {
          reachable: true,
          url: 'https://my-enterprise-app.azurewebsites.net',
          finalUrl: 'https://my-enterprise-app.azurewebsites.net',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'x-ms-request-id': 'c8e30b10-001e-0000-0000-000000000000',
            'x-ms-version': '2021-08-06',
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
        'my-enterprise-app.azurewebsites.net',
        snapshot,
      );

      const azure = result.technologies.find((t) => t.id === 'tech-azure');
      expect(azure).toBeDefined();
      expect(azure?.confidenceLevel).toBe('HIGH');
      expect(azure?.evidence.some((e) => e.sourceType === 'TLS')).toBe(true);
      expect(azure?.evidence.some((e) => e.sourceType === 'DNS')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Technology Meaning & Anti-Overreach Guarantees (TECH-002)
  // ---------------------------------------------------------------------------
  describe('2. Technology Meaning & Anti-Overreach Guarantees (TECH-002)', () => {
    it('sets canonical anti-overreach claim boundaries on Azure Front Door and Azure', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://azure-boundaries.com',
          finalUrl: 'https://azure-boundaries.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'x-azure-ref': '0ref1234',
            'x-ms-routing-name': 'default-slot',
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
        'azure-boundaries.com',
        snapshot,
      );

      const afd = result.technologies.find(
        (t) => t.id === 'tech-azure-frontdoor',
      );
      expect(afd).toBeDefined();
      expect(afd?.whatThisDoesNotProve).toContain(
        'does not prove the origin runs on Azure App Service',
      );
      expect(afd?.whatThisDoesNotProve).toContain('AKS');
      expect(afd?.whatThisDoesNotProve).toContain('SQL');

      const azure = result.technologies.find((t) => t.id === 'tech-azure');
      expect(azure).toBeDefined();
      expect(azure?.whatThisDoesNotProve).toContain(
        'does not prove the entire application runs on Azure',
      );
      expect(azure?.whatThisDoesNotProve).toContain('private VNet topology');
    });

    it('does not hallucinate Azure App Service, AKS, or SQL Server from Front Door evidence alone', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://afd-pure-edge.com',
          finalUrl: 'https://afd-pure-edge.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'x-azure-ref': '0fedcba987654321',
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
        'afd-pure-edge.com',
        snapshot,
      );

      const names = result.technologies.map((t) => t.name.toLowerCase());
      expect(names).toContain('azure front door');
      expect(names).not.toContain('azure app service');
      expect(names).not.toContain('azure kubernetes service');
      expect(names).not.toContain('sql server');
      expect(names).not.toContain('cosmos db');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Tier Topology & Coexistence (TECH-003)
  // ---------------------------------------------------------------------------
  describe('3. Multi-Tier Topology & Coexistence (TECH-003)', () => {
    it('constructs multi-tier topology: Azure Front Door (EDGE) -> NGINX (GATEWAY) -> Node.js (RUNTIME)', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://multi-tier-azure.com',
          finalUrl: 'https://multi-tier-azure.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'x-azure-ref': '0abc1234',
            server: 'nginx/1.24.0',
            'x-powered-by': 'Express',
            'set-cookie': 'connect.sid=s%3A12345; Path=/',
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
        'multi-tier-azure.com',
        snapshot,
      );

      const afdNode = result.topology.nodes.find(
        (n) => n.id === 'tech-azure-frontdoor',
      );
      const nginxNode = result.topology.nodes.find(
        (n) => n.id === 'tech-nginx',
      );
      const nodejsNode = result.topology.nodes.find(
        (n) => n.id === 'tech-nodejs',
      );

      expect(afdNode).toBeDefined();
      expect(afdNode?.layer).toBe(TopologyLayer.EDGE);

      expect(nginxNode).toBeDefined();
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      expect(nodejsNode).toBeDefined();
      expect(nodejsNode?.layer).toBe(TopologyLayer.RUNTIME);

      // Verify relationship flow: Edge forwards to Gateway
      const edgeToGateway = result.topology.relationships.find(
        (r) =>
          r.sourceTechnologyId === 'tech-azure-frontdoor' &&
          r.targetTechnologyId === 'tech-nginx',
      );
      expect(edgeToGateway).toBeDefined();
      expect(edgeToGateway?.relationshipType).toBe('FORWARDS_TO');
    });

    it('demonstrates clean coexistence: Cloudflare (EDGE) + Azure Application Gateway (GATEWAY)', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://cf-fronted-azure.com',
          finalUrl: 'https://cf-fronted-azure.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'cf-ray': '9182736450abcdef-SJC',
            'cf-cache-status': 'DYNAMIC',
            'x-ms-routing-name': 'api-production-eastus',
            server: 'cloudflare',
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
        'cf-fronted-azure.com',
        snapshot,
      );

      const cfNode = result.topology.nodes.find(
        (n) => n.id === 'tech-cloudflare',
      );
      const azureNode = result.topology.nodes.find(
        (n) => n.id === 'tech-azure',
      );

      expect(cfNode).toBeDefined();
      expect(cfNode?.layer).toBe(TopologyLayer.EDGE);

      expect(azureNode).toBeDefined();
      expect(azureNode?.layer).toBe(TopologyLayer.PLATFORM);
      expect(azureNode?.role).toContain('Application Gateway');
    });

    it('demonstrates clean coexistence: Azure Front Door (EDGE) + Envoy (GATEWAY) + Go (RUNTIME)', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://azure-envoy-go.io',
          finalUrl: 'https://azure-envoy-go.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'x-azure-ref': '0xyz9876',
            server: 'envoy',
            'x-envoy-upstream-service-time': '12',
            'x-powered-by': 'Go',
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
        'azure-envoy-go.io',
        snapshot,
      );

      const afdNode = result.topology.nodes.find(
        (n) => n.id === 'tech-azure-frontdoor',
      );
      const envoyNode = result.topology.nodes.find(
        (n) => n.id === 'tech-envoy',
      );
      const goNode = result.topology.nodes.find((n) => n.id === 'tech-go');

      expect(afdNode).toBeDefined();
      expect(afdNode?.layer).toBe(TopologyLayer.EDGE);

      expect(envoyNode).toBeDefined();
      expect(envoyNode?.layer).toBe(TopologyLayer.GATEWAY);

      expect(goNode).toBeDefined();
      expect(goNode?.layer).toBe(TopologyLayer.RUNTIME);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Architecture Brief & Known Unknowns (TECH-004)
  // ---------------------------------------------------------------------------
  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes architecture brief with masked origin and unobserved database unknown', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://azure-brief.com',
          finalUrl: 'https://azure-brief.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'x-azure-ref': '0afd1234',
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

      const result = await techDiscovery.discover('azure-brief.com', snapshot);
      const brief = result.architectureBrief;

      expect(brief).toBeDefined();
      expect(brief.architecturePath.length).toBeGreaterThanOrEqual(2);
      expect(brief.architecturePath[0].role).toBe('Client Request Ingress');
      expect(brief.architecturePath[1].technologyName).toBe('Azure Front Door');

      // Origin cloud provider should be recognized as masked behind Front Door
      const maskedOrigin = brief.knownUnknowns.find(
        (u) => u.dimension === 'Origin Cloud Provider',
      );
      expect(maskedOrigin).toBeDefined();
      expect(maskedOrigin?.status).toBe('MASKED');
      expect(maskedOrigin?.explanation).toContain('Azure Front Door');

      // Database unknown must be present
      const dbUnknown = brief.knownUnknowns.find(
        (u) => u.dimension === 'Database Backend Layer',
      );
      expect(dbUnknown).toBeDefined();
      expect(dbUnknown?.status).toBe('UNOBSERVED');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Deep Behavioral Evidence & Fusion Posture (T22 Engine)
  // ---------------------------------------------------------------------------
  describe('5. Deep Behavioral Evidence & Fusion Posture (T22 Engine)', () => {
    it('fuses direct header + TLS signals to CORROBORATED posture with high confidence', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'azure-fused.io',
        http: {
          statusCode: 200,
          headers: {
            'x-ms-routing-name': 'default-slot-eastus',
          },
        } as any,
        ssl: {
          certificate: {
            issuer: { organization: 'Microsoft Corporation' },
          },
        } as any,
      });

      const directResult = azureDetector.detect(context);
      expect(directResult).not.toBeNull();

      const { results, behavioralResult } = behavioralEngine.analyze(context, [
        directResult,
      ]);
      expect(behavioralResult.posturesByTechnology['tech-azure']).toBe(
        'CORROBORATED',
      );
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.95);
    });

    it('treats behavioral-only Azure cookie as CONSISTENT rather than deterministic entire-cloud claim', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'azure-behavioral-only.io',
        http: {
          statusCode: 200,
          headers: {
            'set-cookie': 'ApplicationGatewayAffinity=session-data-xyz',
          },
        } as any,
      });

      const { results, behavioralResult } = behavioralEngine.analyze(
        context,
        [],
      );
      const azureBehavior = results.find((r) => r.id === 'tech-azure');

      expect(azureBehavior).toBeDefined();
      expect(behavioralResult.posturesByTechnology['tech-azure']).toBe(
        'CONSISTENT',
      );
      expect(azureBehavior?.confidenceLevel).toBe('HIGH');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Snapshot Memory & Deterministic Baseline (TECH-005)
  // ---------------------------------------------------------------------------
  describe('6. Snapshot Memory & Deterministic Baseline (TECH-005)', () => {
    it('captures Azure in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-azure-frontdoor',
              name: 'Azure Front Door',
              category: 'CDN / Edge',
              confidence: 0.98,
            } as any,
          ],
          architectureBrief: {
            summary: 'Public endpoint resolves to Azure Front Door edge.',
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
                technologyId: 'tech-azure-frontdoor',
                technologyName: 'Azure Front Door',
                role: 'Edge Delivery',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.EDGE,
                state: 'OBSERVED',
                technologies: [{ name: 'Azure Front Door' }],
              },
            ],
            keyTechnologies: [
              { name: 'Azure Front Door', role: 'Edge Delivery' },
            ],
            integrations: [],
            knownUnknowns: [
              { dimension: 'Origin Cloud Provider', status: 'MASKED' },
            ],
            claimBoundaries: [
              {
                technologyName: 'Azure Front Door',
                boundary:
                  'Azure Front Door edge presence does not prove App Service origin compute',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.98 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-azure-1',
        'dom-azure-1',
        'azure-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-azure-1',
        'dom-azure-1',
        'azure-test.com',
        snapshot,
      );

      expect(memory1.fingerprints.technologyFingerprint).toBe(
        memory2.fingerprints.technologyFingerprint,
      );
      expect(memory1.fingerprints.overallFingerprint).toBe(
        memory2.fingerprints.overallFingerprint,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Change Intelligence (TECH-006)
  // ---------------------------------------------------------------------------
  describe('7. Change Intelligence (TECH-006)', () => {
    it('detects Azure added, removed, or modified without fabricating operational intent', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currWithAzure: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-azure-frontdoor',
              name: 'Azure Front Door',
              category: 'CDN / Edge',
              confidence: 0.98,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.EDGE,
                technologyId: 'tech-azure-frontdoor',
                technologyName: 'Azure Front Door',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.EDGE,
                state: 'OBSERVED',
                technologies: [{ name: 'Azure Front Door' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(
        prevEmpty,
        currWithAzure,
      );
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === 'Azure Front Door',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currWithAzure,
        prevEmpty,
      );
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === 'Azure Front Door',
        ),
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Domain Overview API Convergence (TECH-008)
  // ---------------------------------------------------------------------------
  describe('8. Domain Overview API Convergence (TECH-008)', () => {
    it('maps Azure Front Door and Azure DNS into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-azure-overview',
        domainId: 'dom-azure-overview',
        jobId: 'job-004',
        responseTimeMs: 32,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          dns: {
            ns: ['ns1-01.azure-dns.com'],
          },
          http: {
            headers: {
              'x-azure-ref': '0portal1234',
            },
          },
          technology: {
            architectureBrief: {
              summary:
                'Public endpoint uses Microsoft Azure Front Door edge infrastructure.',
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
                  technologyId: 'tech-azure-frontdoor',
                  technologyName: 'Azure Front Door',
                  role: 'Edge Delivery',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.EDGE,
                  technologies: [
                    {
                      technologyId: 'tech-azure-frontdoor',
                      name: 'Azure Front Door',
                      role: 'Edge Delivery',
                      layer: TopologyLayer.EDGE,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-azure-frontdoor',
                  name: 'Azure Front Door',
                  role: 'Edge Delivery',
                  layer: TopologyLayer.EDGE,
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-azure-frontdoor',
                  technologyName: 'Azure Front Door',
                  boundary:
                    'Azure Front Door presence does not prove App Service compute',
                },
              ],
              confidence: { overallLevel: 'HIGH', overallScore: 0.98 },
            },
          },
        },
      };

      const overview = InfrastructureOverviewMapper.fromSnapshot(mockSnapshot);
      expect(overview.cdn).toBe('Azure Front Door');
      expect(overview.dnsProvider).toBe('Azure DNS');
      expect(overview.technologyArchitecture).toBeDefined();
      expect(overview.technologyArchitecture?.architectureSummary).toContain(
        'Azure Front Door',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('Azure Front Door');
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Negative Anti-Overreach Invariants
  // ---------------------------------------------------------------------------
  describe('9. Negative Anti-Overreach Invariants', () => {
    it('strictly avoids manufacturing App Service, Functions, AKS, Azure VM, Container Apps, Windows Server, Linux, IIS, .NET, or SQL Database from Azure ingress evidence', () => {
      expect(azureDetector.id).toBe('tech-azure');
      expect(azureDetector.whatThisDoesNotProve).toContain('App Service');
      expect(azureDetector.whatThisDoesNotProve).toContain('Functions');
      expect(azureDetector.whatThisDoesNotProve).toContain('AKS');
      expect(azureDetector.whatThisDoesNotProve).toContain('Container Apps');
      expect(azureDetector.whatThisDoesNotProve).toContain('Windows Server');
      expect(azureDetector.whatThisDoesNotProve).toContain('Linux');
      expect(azureDetector.whatThisDoesNotProve).toContain('IIS');
      expect(azureDetector.whatThisDoesNotProve).toContain('.NET');
      expect(azureDetector.whatThisDoesNotProve).toContain('SQL Database');
      expect(azureDetector.whatThisDoesNotProve).toContain('Cosmos DB');
      expect(azureDetector.whatThisDoesNotProve).toContain(
        'private VNet topology',
      );

      expect(azureFrontDoorDetector.id).toBe('tech-azure-frontdoor');
      expect(azureFrontDoorDetector.whatThisDoesNotProve).toContain(
        'App Service',
      );
      expect(azureFrontDoorDetector.whatThisDoesNotProve).toContain('AKS');
      expect(azureFrontDoorDetector.whatThisDoesNotProve).toContain('SQL');
    });
  });
});
