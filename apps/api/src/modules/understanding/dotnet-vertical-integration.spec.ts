import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { DotNetDetector } from '../../infrastructure/discovery/technology/detectors/runtime/dotnet.detector';
import { AspNetCoreDetector } from '../../infrastructure/discovery/technology/detectors/frameworks/aspnet-core.detector';
import { AspNetDetector } from '../../infrastructure/discovery/technology/detectors/frameworks/aspnet.detector';
import { IisDetector } from '../../infrastructure/discovery/technology/detectors/web-servers/iis.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';

describe('T24: .NET / ASP.NET Core Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let dotnetDetector: DotNetDetector;
  let aspnetCoreDetector: AspNetCoreDetector;
  let aspnetDetector: AspNetDetector;
  let iisDetector: IisDetector;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;
  let ruleEngine: FindingRuleEngineService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    dotnetDetector = moduleRef.get(DotNetDetector);
    aspnetCoreDetector = moduleRef.get(AspNetCoreDetector);
    aspnetDetector = moduleRef.get(AspNetDetector);
    iisDetector = moduleRef.get(IisDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative .NET & ASP.NET Core Detection & Version Extraction (TECH-001)', () => {
    it('detects .NET and extracts exact version from X-AspNet-Version header', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://dotnet-api.service.io',
          finalUrl: 'https://dotnet-api.service.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'x-powered-by': 'ASP.NET',
            'x-aspnet-version': '4.0.30319',
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
        'dotnet-api.service.io',
        snapshot,
      );

      const dotnet = result.technologies.find((t) => t.id === 'tech-dotnet');
      expect(dotnet).toBeDefined();
      expect(dotnet?.name).toBe('.NET');
      expect(dotnet?.category).toBe('Infrastructure Runtime');
      expect(dotnet?.confidenceLevel).toBe('HIGH');
      expect(dotnet?.version).toBe('4.0.30319');
      expect(dotnet?.versionEvidence).toContain('4.0.30319');
    });

    it('detects ASP.NET Core and extracts exact version from X-Powered-By: ASP.NET Core 8.0', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://aspnet-core-api.io',
          finalUrl: 'https://aspnet-core-api.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'x-powered-by': 'ASP.NET Core 8.0',
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
        'aspnet-core-api.io',
        snapshot,
      );

      const aspnetCore = result.technologies.find(
        (t) => t.id === 'tech-aspnet-core',
      );
      expect(aspnetCore).toBeDefined();
      expect(aspnetCore?.name).toBe('ASP.NET Core');
      expect(aspnetCore?.category).toBe('Frameworks');
      expect(aspnetCore?.version).toBe('8.0');

      const dotnet = result.technologies.find((t) => t.id === 'tech-dotnet');
      expect(dotnet).toBeDefined();
      expect(dotnet?.name).toBe('.NET');
    });

    it('detects .NET from Kestrel server banner without version hallucination (no Version: Unknown)', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://kestrel-service.org',
          finalUrl: 'https://kestrel-service.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 16,
          headers: {
            server: 'Kestrel',
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
        'kestrel-service.org',
        snapshot,
      );

      const dotnet = result.technologies.find((t) => t.id === 'tech-dotnet');
      expect(dotnet).toBeDefined();
      expect(dotnet?.name).toBe('.NET');
      expect(dotnet?.version).toBeUndefined(); // Zero version hallucination
    });

    it('detects ASP.NET Core from .AspNetCore.Cookies session cookie', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://core-app.org',
          finalUrl: 'https://core-app.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'set-cookie':
              '.AspNetCore.Cookies=CfDJ8...; path=/; secure; samesite=lax; httponly',
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

      const result = await techDiscovery.discover('core-app.org', snapshot);

      const aspnetCore = result.technologies.find(
        (t) => t.id === 'tech-aspnet-core',
      );
      expect(aspnetCore).toBeDefined();
      expect(aspnetCore?.name).toBe('ASP.NET Core');

      const dotnet = result.technologies.find((t) => t.id === 'tech-dotnet');
      expect(dotnet).toBeDefined();
      expect(dotnet?.name).toBe('.NET');
    });

    it('returns null / absent when generic web server or unrelated headers exist', async () => {
      const genericSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://static-html.org',
          finalUrl: 'https://static-html.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: { server: 'Caddy' },
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
        'static-html.org',
        genericSnapshot,
      );
      const dotnet = result.technologies.find((t) => t.id === 'tech-dotnet');
      const aspnetCore = result.technologies.find(
        (t) => t.id === 'tech-aspnet-core',
      );
      expect(dotnet).toBeUndefined();
      expect(aspnetCore).toBeUndefined();
    });
  });

  describe('2. Technology Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('produces authoritative .NET and ASP.NET Core infrastructure meaning with strict claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://dotnet-backend.io',
          finalUrl: 'https://dotnet-backend.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'x-powered-by': 'ASP.NET Core 8.0',
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
        'dotnet-backend.io',
        snapshot,
      );
      const dotnet = result.technologies.find((t) => t.id === 'tech-dotnet');
      const aspnetCore = result.technologies.find(
        (t) => t.id === 'tech-aspnet-core',
      );

      expect(dotnet).toBeDefined();
      expect(dotnet.infrastructureMeaning).toContain(
        'Microsoft .NET-based server-side application/runtime boundary',
      );
      expect(dotnet.whatThisDoesNotProve).toContain('C#');
      expect(dotnet.whatThisDoesNotProve).toContain('IIS');
      expect(dotnet.whatThisDoesNotProve).toContain('Azure');
      expect(dotnet.whatThisDoesNotProve).toContain('Windows Server');
      expect(dotnet.whatThisDoesNotProve).toContain('SQL Server');
      expect(dotnet.whatThisDoesNotProve).toContain('Docker');
      expect(dotnet.whatThisDoesNotProve).toContain('Kubernetes');

      expect(aspnetCore).toBeDefined();
      expect(aspnetCore.infrastructureMeaning).toContain(
        'ASP.NET Core as a server-side web application framework',
      );
      expect(aspnetCore.whatThisDoesNotProve).toContain('IIS');
      expect(aspnetCore.whatThisDoesNotProve).toContain('Windows Server');
      expect(aspnetCore.whatThisDoesNotProve).toContain('Azure');
      expect(aspnetCore.whatThisDoesNotProve).toContain('SQL Server');
    });
  });

  describe('3. Topology & Multi-Technology Coexistence (TECH-003)', () => {
    it('positions ASP.NET Core at APPLICATION layer, .NET at RUNTIME layer, and preserves independent Gateway', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://dotnet-service-prod.com',
          finalUrl: 'https://dotnet-service-prod.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'nginx/1.24.0',
            'x-powered-by': 'ASP.NET Core 8.0',
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
        'dotnet-service-prod.com',
        snapshot,
      );
      const topo = result.topology;

      // NGINX at GATEWAY
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode).toBeDefined();
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      // ASP.NET Core at APPLICATION
      const appNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-aspnet-core',
      );
      expect(appNode).toBeDefined();
      expect(appNode?.layer).toBe(TopologyLayer.APPLICATION);

      // .NET at RUNTIME
      const dotnetNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-dotnet',
      );
      expect(dotnetNode).toBeDefined();
      expect(dotnetNode?.layer).toBe(TopologyLayer.RUNTIME);
    });

    it('independently models IIS as GATEWAY, ASP.NET Core as APPLICATION, and .NET as RUNTIME without collapsing into "Microsoft Stack"', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://iis-dotnet.enterprise.com',
          finalUrl: 'https://iis-dotnet.enterprise.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'Microsoft-IIS/10.0',
            'x-powered-by': 'ASP.NET Core 8.0',
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
        'iis-dotnet.enterprise.com',
        snapshot,
      );
      const topo = result.topology;

      const iisNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-microsoft-iis',
      );
      expect(iisNode).toBeDefined();
      expect(iisNode?.layer).toBe(TopologyLayer.GATEWAY);

      const appNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-aspnet-core',
      );
      expect(appNode).toBeDefined();
      expect(appNode?.layer).toBe(TopologyLayer.APPLICATION);

      const dotnetNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-dotnet',
      );
      expect(dotnetNode).toBeDefined();
      expect(dotnetNode?.layer).toBe(TopologyLayer.RUNTIME);
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes ASP.NET Core and .NET in request path and binds claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://dotnet-brief.org',
          finalUrl: 'https://dotnet-brief.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'x-powered-by': 'ASP.NET Core 8.0',
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

      const result = await techDiscovery.discover('dotnet-brief.org', snapshot);
      const brief = result.architectureBrief;

      expect(brief).toBeDefined();
      expect(
        brief.architecturePath.some(
          (p) =>
            p.technologyName === 'ASP.NET Core' || p.technologyName === '.NET',
        ),
      ).toBe(true);
      expect(
        brief.claimBoundaries.some(
          (b) =>
            b.technologyId === 'tech-dotnet' ||
            b.technologyId === 'tech-aspnet-core',
        ),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures ASP.NET Core and .NET in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-aspnet-core',
              name: 'ASP.NET Core',
              category: 'Application Framework',
              confidence: 0.98,
              version: '8.0.0',
            } as any,
            {
              id: 'tech-dotnet',
              name: '.NET',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '8.0.0',
            } as any,
          ],
          architectureBrief: {
            summary:
              'The public endpoint appears to execute an ASP.NET Core application on .NET runtime.',
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'public-endpoint',
                technologyName: 'Public Endpoint',
                role: 'Ingress',
              },
              {
                hop: 1,
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-aspnet-core',
                technologyName: 'ASP.NET Core',
                role: 'Web Framework',
              },
              {
                hop: 2,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-dotnet',
                technologyName: '.NET',
                role: 'Server Runtime',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                state: 'OBSERVED',
                technologies: [{ name: 'ASP.NET Core' }],
              },
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: '.NET' }],
              },
            ],
            keyTechnologies: [
              { name: 'ASP.NET Core', role: 'Web Framework' },
              { name: '.NET', role: 'Server Runtime' },
            ],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: '.NET',
                boundary:
                  '.NET presence does not prove C#, Windows Server, Azure, or SQL Server',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-dotnet-1',
        'dom-dotnet-1',
        'dotnet-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-dotnet-1',
        'dom-dotnet-1',
        'dotnet-test.com',
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

  describe('6. Change Intelligence (TECH-006)', () => {
    it('detects .NET addition, removal, and version changes without fabricating operational intent', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currDotNet6: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-dotnet',
              name: '.NET',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '6.0.0',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-dotnet',
                technologyName: '.NET',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: '.NET' }],
              },
            ],
          } as any,
        },
      };

      const currDotNet8: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-dotnet',
              name: '.NET',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '8.0.0',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-dotnet',
                technologyName: '.NET',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: '.NET' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(
        prevEmpty,
        currDotNet6,
      );
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === '.NET',
        ),
      ).toBe(true);

      const diffsVersion = changeAnalyzer.analyzeDifferences(
        currDotNet6,
        currDotNet8,
      );
      expect(
        diffsVersion.some(
          (d) =>
            d.classification === 'TECHNOLOGY_CHANGED' &&
            d.previousState?.version === '6.0.0' &&
            d.currentState?.version === '8.0.0',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currDotNet8,
        prevEmpty,
      );
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === '.NET',
        ),
      ).toBe(true);
    });

    it('detects application framework transition (Node.js -> ASP.NET Core) without fabricating business rationale', () => {
      const prevNode: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nodejs',
              name: 'Node.js',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '20.0.0',
            } as any,
          ],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currAspNetCore: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-aspnet-core',
              name: 'ASP.NET Core',
              category: 'Application Framework',
              confidence: 0.98,
              version: '8.0.0',
            } as any,
            {
              id: 'tech-dotnet',
              name: '.NET',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '8.0.0',
            } as any,
          ],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const diffs = changeAnalyzer.analyzeDifferences(prevNode, currAspNetCore);
      expect(
        diffs.some(
          (d) =>
            d.technologyName === 'ASP.NET Core' &&
            d.classification === 'TECHNOLOGY_ADDED',
        ),
      ).toBe(true);
      expect(
        diffs.some(
          (d) =>
            d.technologyName === 'Node.js' &&
            d.classification === 'TECHNOLOGY_REMOVED',
        ),
      ).toBe(true);
    });
  });

  describe('7. Domain Overview API Convergence (TECH-008)', () => {
    it('maps ASP.NET Core and .NET into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-dotnet-overview',
        domainId: 'dom-dotnet-overview',
        jobId: 'job-024',
        responseTimeMs: 25,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint executes an ASP.NET Core application on .NET runtime.',
              architecturePath: [
                {
                  hop: 0,
                  layer: TopologyLayer.GATEWAY,
                  technologyId: 'public-endpoint',
                  technologyName: 'Public Endpoint',
                  role: 'Ingress',
                },
                {
                  hop: 1,
                  layer: TopologyLayer.APPLICATION,
                  technologyId: 'tech-aspnet-core',
                  technologyName: 'ASP.NET Core',
                  role: 'Application Framework',
                },
                {
                  hop: 2,
                  layer: TopologyLayer.RUNTIME,
                  technologyId: 'tech-dotnet',
                  technologyName: '.NET',
                  role: 'Server Runtime',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.APPLICATION,
                  technologies: [
                    {
                      technologyId: 'tech-aspnet-core',
                      name: 'ASP.NET Core',
                      role: 'Application Framework',
                      layer: TopologyLayer.APPLICATION,
                    },
                  ],
                },
                {
                  layer: TopologyLayer.RUNTIME,
                  technologies: [
                    {
                      technologyId: 'tech-dotnet',
                      name: '.NET',
                      role: 'Server Runtime',
                      layer: TopologyLayer.RUNTIME,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-aspnet-core',
                  name: 'ASP.NET Core',
                  role: 'Application Framework',
                  layer: TopologyLayer.APPLICATION,
                },
                {
                  technologyId: 'tech-dotnet',
                  name: '.NET',
                  role: 'Server Runtime',
                  layer: TopologyLayer.RUNTIME,
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-dotnet',
                  technologyName: '.NET',
                  boundary:
                    '.NET presence does not prove C#, Windows Server, Azure, or SQL Server',
                },
                {
                  technologyId: 'tech-aspnet-core',
                  technologyName: 'ASP.NET Core',
                  boundary:
                    'ASP.NET Core presence does not prove IIS, Windows Server, Azure, or SQL Server',
                },
              ],
              confidence: { overallLevel: 'HIGH', overallScore: 0.95 },
            },
          },
        },
      };

      const overview = InfrastructureOverviewMapper.fromSnapshot(mockSnapshot);
      expect(overview.technologyArchitecture).toBeDefined();
      expect(overview.technologyArchitecture?.architectureSummary).toContain(
        'ASP.NET Core',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('ASP.NET Core');
    });
  });

  describe('8. Negative Anti-Overreach Invariants', () => {
    it('strictly avoids manufacturing C#, IIS, Windows Server, Azure, SQL Server, Docker, or Kubernetes from .NET / ASP.NET Core evidence', () => {
      expect(dotnetDetector.id).toBe('tech-dotnet');
      expect(dotnetDetector.whatThisDoesNotProve).toContain('C#');
      expect(dotnetDetector.whatThisDoesNotProve).toContain('IIS');
      expect(dotnetDetector.whatThisDoesNotProve).toContain('Azure');
      expect(dotnetDetector.whatThisDoesNotProve).toContain('Windows Server');
      expect(dotnetDetector.whatThisDoesNotProve).toContain('SQL Server');
      expect(dotnetDetector.whatThisDoesNotProve).toContain('Docker');
      expect(dotnetDetector.whatThisDoesNotProve).toContain('Kubernetes');

      expect(aspnetCoreDetector.id).toBe('tech-aspnet-core');
      expect(aspnetCoreDetector.whatThisDoesNotProve).toContain('IIS');
      expect(aspnetCoreDetector.whatThisDoesNotProve).toContain(
        'Windows Server',
      );
      expect(aspnetCoreDetector.whatThisDoesNotProve).toContain('Azure');
      expect(aspnetCoreDetector.whatThisDoesNotProve).toContain('SQL Server');
    });
  });
});
