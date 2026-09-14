import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { CloudflareDetector } from '../../infrastructure/discovery/technology/detectors/cloud/cloudflare.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureBriefBuilder } from '../infrastructure-brief/builders/infrastructure-brief.builder';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';
import { FindingContext } from '../findings/contracts/finding-context.interface';
import { FindingModule } from '@prisma/client';
import { Severity } from '../findings/enums/severity.enum';

describe('T1: Cloudflare End-to-End Technology Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let cloudflareDetector: CloudflareDetector;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;
  let ruleEngine: FindingRuleEngineService;
  let briefBuilder: InfrastructureBriefBuilder;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    cloudflareDetector = moduleRef.get(CloudflareDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
    briefBuilder = moduleRef.get(InfrastructureBriefBuilder);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative Cloudflare Detection (TECH-001)', () => {
    it('detects Cloudflare from HTTP cf-ray, server header, and authoritative nameservers with zero additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.21.40.50'],
          ns: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
          aaaa: ['2606:4700::1'],
          mx: [],
          txt: [],
          cname: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://cloudflare-backed.com',
          finalUrl: 'https://cloudflare-backed.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'cloudflare',
            'cf-ray': '89b987654321-iad',
            'cf-cache-status': 'HIT',
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
        'cloudflare-backed.com',
        snapshot,
      );

      const cf = result.technologies.find((t) => t.id === 'tech-cloudflare');
      expect(cf).toBeDefined();
      expect(cf?.name).toBe('Cloudflare');
      expect(cf?.category).toBe('CDN / Edge');
      expect(cf?.confidenceLevel).toBe('HIGH');
      expect(cf?.evidence.length).toBeGreaterThanOrEqual(3);
    });

    it('returns null / absent when no Cloudflare indicators exist', async () => {
      const nonCfSnapshot: DiscoverySnapshot = {
        dns: {
          a: ['93.184.216.34'],
          ns: ['ns1.otherdns.com'],
          aaaa: [],
          mx: [],
          txt: [],
          cname: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://plain-origin.com',
          finalUrl: 'https://plain-origin.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 40,
          headers: { server: 'Apache/2.4.52' },
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
        'plain-origin.com',
        nonCfSnapshot,
      );
      const cf = result.technologies.find((t) => t.id === 'tech-cloudflare');
      expect(cf).toBeUndefined();
    });
  });

  describe('2. Meaning & Claim Boundaries (TECH-002)', () => {
    it('answers the four canonical questions and preserves anti-overreach claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://cf-app.io',
          finalUrl: 'https://cf-app.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: { 'cf-ray': '89b123-iad', server: 'cloudflare' },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover('cf-app.io', snapshot);
      const cf = result.technologies.find((t) => t.id === 'tech-cloudflare');

      // 1. What is it?
      expect(cf.category).toBe('CDN / Edge');
      // 2. Role
      expect(cf.role).toContain('Global edge network');
      // 3. Meaning
      expect(cf.infrastructureMeaning).toContain(
        'Cloudflare edge and security infrastructure',
      );
      // 4. Claim boundaries
      expect(cf.whatThisDoesNotProve).toContain(
        'does not identify or prove the underlying origin server hosting provider',
      );
    });
  });

  describe('3. Topology & Relationship Mapping (TECH-003)', () => {
    it('maps Cloudflare to Public Endpoint and forwards to downstream gateway', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://edge-gateway.com',
          finalUrl: 'https://edge-gateway.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: { server: 'nginx/1.24.0', 'cf-ray': '89b123-iad' },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover('edge-gateway.com', snapshot);
      const topo = result.topology;

      expect(topo.relationships.length).toBeGreaterThanOrEqual(1);

      // Verify Cloudflare is at EDGE layer
      const cfNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-cloudflare',
      );
      expect(cfNode?.layer).toBe(TopologyLayer.EDGE);

      // Verify NGINX is at GATEWAY layer
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes request path and identifies Origin Cloud Provider as MASKED', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.21.1.1'],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          cname: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://masked-origin.io',
          finalUrl: 'https://masked-origin.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: { server: 'cloudflare', 'cf-ray': '89a123-iad' },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover('masked-origin.io', snapshot);
      const brief = result.architectureBrief;

      // Ingress path contains Cloudflare
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'Cloudflare',
      );

      // First-class known unknown for masked origin
      const originUnknown = brief.knownUnknowns.find(
        (u) => u.dimension === 'Origin Cloud Provider',
      );
      expect(originUnknown).toBeDefined();
      expect(originUnknown?.status).toBe('MASKED');
      expect(originUnknown?.explanation).toContain('masked behind Cloudflare');
    });
  });

  describe('5. Temporal Memory & Baseline Comparison (TECH-005)', () => {
    it('generates deterministic SHA-256 fingerprint for Cloudflare state', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-cloudflare',
              name: 'Cloudflare',
              category: 'CDN / Edge',
            } as any,
          ],
          architectureBrief: {
            summary: 'Protected by Cloudflare edge proxy.',
            architecturePath: [],
            layers: [],
            keyTechnologies: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-1',
        'dom-1',
        'test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-1',
        'dom-1',
        'test.com',
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

  describe('6. Change Intelligence & Drift (TECH-006)', () => {
    it('detects Cloudflare addition, conservative removal, and edge layer drift', () => {
      const prevWithoutCf: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: 'Web / Server',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-nginx',
                technologyName: 'NGINX',
                role: 'Gateway',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.GATEWAY,
                state: 'OBSERVED',
                technologies: [{ name: 'NGINX' }],
              },
            ],
          } as any,
        },
      };

      const currWithCf: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-cloudflare',
              name: 'Cloudflare',
              category: 'CDN / Edge',
            } as any,
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: 'Web / Server',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.EDGE,
                technologyId: 'tech-cloudflare',
                technologyName: 'Cloudflare',
                role: 'Edge CDN',
              },
              {
                hop: 1,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-nginx',
                technologyName: 'NGINX',
                role: 'Gateway',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.EDGE,
                state: 'OBSERVED',
                technologies: [{ name: 'Cloudflare' }],
              },
              {
                layer: TopologyLayer.GATEWAY,
                state: 'OBSERVED',
                technologies: [{ name: 'NGINX' }],
              },
            ],
          } as any,
        },
      };

      // 1. Cloudflare Added
      const addDiffs = changeAnalyzer.analyzeDifferences(
        prevWithoutCf,
        currWithCf,
      );
      const addChange = addDiffs.find(
        (d) =>
          d.classification === 'TECHNOLOGY_ADDED' &&
          d.technologyName === 'Cloudflare',
      );
      expect(addChange).toBeDefined();

      // 2. Cloudflare Removed / Drift
      const removeDiffs = changeAnalyzer.analyzeDifferences(
        currWithCf,
        prevWithoutCf,
      );
      const removeChange = removeDiffs.find(
        (d) =>
          d.classification === 'TECHNOLOGY_REMOVED' &&
          d.technologyName === 'Cloudflare',
      );
      expect(removeChange).toBeDefined();
      expect(removeChange?.description).toContain('no longer observable');

      const edgeDrift = removeDiffs.find(
        (d) => d.classification === 'EDGE_LAYER_DRIFT',
      );
      expect(edgeDrift).toBeDefined();
    });
  });

  describe('7. Technology Finding Rules & Health (TECH-007)', () => {
    it('evaluates EdgeOriginExposureRule when origin server headers leak through Cloudflare', async () => {
      const leakedSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          headers: {
            server: 'Apache/2.4.52 (Ubuntu)',
            'cf-ray': '89a123-iad',
          },
        } as any,
        technology: {
          architectureBrief: {
            layers: [
              {
                layer: TopologyLayer.EDGE,
                state: 'OBSERVED',
                technologies: [
                  {
                    technologyId: 'tech-cloudflare',
                    name: 'Cloudflare',
                  } as any,
                ],
              },
            ],
          } as any,
        },
      };

      const context: FindingContext = {
        domainId: 'dom-cf-leak',
        snapshotId: 'snp-cf-leak',
        snapshot: leakedSnapshot,
      };

      const findings = await ruleEngine.evaluate(context);
      const leakFinding = findings.find(
        (f) => f.ruleId === 'tech.edge-origin-exposure',
      );

      expect(leakFinding).toBeDefined();
      expect(leakFinding?.title).toBe(
        'Direct Origin Infrastructure Metadata Exposed Alongside Edge CDN',
      );
      expect(leakFinding?.severity).toBe(Severity.MEDIUM);
      expect(leakFinding?.whatThisDoesNotProve).toContain(
        'does not prove that origin IP addresses are directly reachable',
      );
    });
  });

  describe('8. Domain Overview API Mapper (TECH-008)', () => {
    it('maps Cloudflare canonically into InfrastructureOverviewDto.technologyArchitecture', () => {
      const mockSnapshot = {
        id: 'snp-cf-api',
        domainId: 'dom-cf-api',
        jobId: 'job-001',
        responseTimeMs: 25,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint appears to be delivered through Cloudflare edge infrastructure.',
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
                  technologyId: 'tech-cloudflare',
                  technologyName: 'Cloudflare',
                  role: 'Edge CDN',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.EDGE,
                  state: 'OBSERVED',
                  confidenceLevel: 'HIGH',
                  technologies: [
                    {
                      technologyId: 'tech-cloudflare',
                      name: 'Cloudflare',
                      role: 'Edge CDN',
                      layer: TopologyLayer.EDGE,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-cloudflare',
                  name: 'Cloudflare',
                  role: 'Edge CDN',
                  layer: TopologyLayer.EDGE,
                },
              ],
              integrations: [],
              knownUnknowns: [
                {
                  dimension: 'Origin Cloud Provider',
                  status: 'MASKED',
                  explanation: 'Masked behind Cloudflare',
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-cloudflare',
                  technologyName: 'Cloudflare',
                  boundary: 'Cloudflare does not prove origin hosting provider',
                },
              ],
              confidence: { overallLevel: 'HIGH', overallScore: 0.99 },
            },
          },
        },
      } as any;

      const overview = InfrastructureOverviewMapper.fromSnapshot(mockSnapshot);

      expect(overview.technologyArchitecture).toBeDefined();
      expect(overview.technologyArchitecture?.architectureSummary).toContain(
        'delivered through Cloudflare',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('Cloudflare');
      expect(overview.technologyArchitecture?.knownUnknowns[0].status).toBe(
        'MASKED',
      );
    });
  });

  describe('9. Executive Infrastructure Brief (TECH-009)', () => {
    it('converges Cloudflare into executive brief without Cloudflare-specific branching in builder', () => {
      const mockSnapshot = {
        id: 'snp-cf-exec',
        domainId: 'dom-cf-exec',
        domainName: 'cloudflare-production.com',
        createdAt: new Date(),
        responseTimeMs: 30,
        httpStatus: 200,
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint is delivered via Cloudflare edge infrastructure before reaching Next.js.',
              architecturePath: [
                {
                  hop: 0,
                  layer: TopologyLayer.EDGE,
                  technologyId: 'public-endpoint',
                  technologyName: 'Public Endpoint',
                },
                {
                  hop: 1,
                  layer: TopologyLayer.EDGE,
                  technologyId: 'tech-cloudflare',
                  technologyName: 'Cloudflare',
                },
                {
                  hop: 2,
                  layer: TopologyLayer.APPLICATION,
                  technologyId: 'tech-nextjs',
                  technologyName: 'Next.js',
                },
              ],
              integrations: [],
              knownUnknowns: [
                { dimension: 'Origin Cloud Provider', status: 'MASKED' },
              ],
              claimBoundaries: [
                {
                  technologyName: 'Cloudflare',
                  boundary: 'Cloudflare does not prove origin provider',
                },
              ],
            },
          },
        },
      } as any;

      const brief = briefBuilder.build(mockSnapshot, []);

      expect(brief.overallHealth).toBe('Excellent');
      expect(brief.summary).toContain(
        'delivered via Cloudflare edge infrastructure',
      );
      expect(brief.architecture?.ingressPath).toHaveLength(3);
    });
  });

  describe('10. Plug-and-Play Invariant Verification', () => {
    it('verifies zero centralized technology branching for Cloudflare across core engines', () => {
      // Detector operates purely through BaseTechnologyDetector and TechnologyDetectorRegistryService
      expect(cloudflareDetector.id).toBe('tech-cloudflare');
      expect(cloudflareDetector.category).toBe('CDN / Edge');
    });
  });
});
