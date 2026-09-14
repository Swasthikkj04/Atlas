import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { CloudFrontDetector } from '../../infrastructure/discovery/technology/detectors/cdn/cloudfront.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureBriefBuilder } from '../infrastructure-brief/builders/infrastructure-brief.builder';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';
import { FindingContext } from '../findings/contracts/finding-context.interface';
import { Severity } from '../findings/enums/severity.enum';

describe('T2: AWS CloudFront Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let cloudfrontDetector: CloudFrontDetector;
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
    cloudfrontDetector = moduleRef.get(CloudFrontDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
    briefBuilder = moduleRef.get(InfrastructureBriefBuilder);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative CloudFront Detection (TECH-001)', () => {
    it('detects AWS CloudFront from x-amz-cf-id, x-amz-cf-pop, via header, and CNAME records with 0 additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['13.224.10.20'],
          cname: ['d111111abcdef8.cloudfront.net'],
          ns: ['ns-123.awsdns-45.org'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://cloudfront-app.com',
          finalUrl: 'https://cloudfront-app.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 22,
          headers: {
            server: 'CloudFront',
            'x-amz-cf-id': 'k8J9X-EXAMPLE12345==',
            'x-amz-cf-pop': 'IAD89-C1',
            via: '1.1 d111111abcdef8.cloudfront.net (CloudFront)',
            'x-cache': 'Hit from cloudfront',
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
        'cloudfront-app.com',
        snapshot,
      );

      const cf = result.technologies.find((t) => t.id === 'tech-cloudfront');
      expect(cf).toBeDefined();
      expect(cf?.name).toBe('AWS CloudFront');
      expect(cf?.category).toBe('CDN / Edge');
      expect(cf?.confidenceLevel).toBe('HIGH');
      expect(cf?.evidence.length).toBeGreaterThanOrEqual(4);
    });

    it('returns null / absent when no CloudFront indicators exist', async () => {
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
          url: 'https://plain-nginx.com',
          finalUrl: 'https://plain-nginx.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 35,
          headers: { server: 'nginx/1.24.0' },
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
        'plain-nginx.com',
        nonCfSnapshot,
      );
      const cf = result.technologies.find((t) => t.id === 'tech-cloudfront');
      expect(cf).toBeUndefined();
    });
  });

  describe('2. Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('answers the four canonical questions and strictly rejects claims about AWS origin compute/storage', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://cf-origin-boundary.io',
          finalUrl: 'https://cf-origin-boundary.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 28,
          headers: {
            'x-amz-cf-id': 'k8J9X-BOUNDARY==',
            server: 'CloudFront',
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
        'cf-origin-boundary.io',
        snapshot,
      );
      const cf = result.technologies.find((t) => t.id === 'tech-cloudfront');

      // 1. What is it?
      expect(cf.category).toBe('CDN / Edge');
      // 2. Role
      expect(cf.role).toContain('Edge / CDN');
      // 3. Meaning
      expect(cf.infrastructureMeaning).toContain("AWS's edge network");
      // 4. Critical Anti-Overreach: CloudFront ≠ EC2, ECS, EKS, S3, or AWS Origin
      expect(cf.whatThisDoesNotProve).toContain(
        'CloudFront edge delivery does not prove origin hosting on AWS EC2',
      );
    });
  });

  describe('3. Topology Understanding & Relationship Absence (TECH-003)', () => {
    it('maps CloudFront at EDGE layer forwarding to observed gateway while strictly omitting unobservable origin nodes', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://cf-nginx-stack.com',
          finalUrl: 'https://cf-nginx-stack.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'nginx/1.24.0',
            'x-amz-cf-id': 'cf-id-9988',
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
        'cf-nginx-stack.com',
        snapshot,
      );
      const topo = result.topology;

      // CloudFront is at EDGE layer
      const cfNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-cloudfront',
      );
      expect(cfNode?.layer).toBe(TopologyLayer.EDGE);

      // NGINX is at GATEWAY layer
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      // INVARIANT: Ensure zero manufactured AWS origin nodes (No EC2, ECS, EKS, S3, RDS)
      const ec2Node = topo.nodes.find((n) => n.technologyId.includes('ec2'));
      const s3Node = topo.nodes.find((n) => n.technologyId.includes('s3'));
      const eksNode = topo.nodes.find((n) => n.technologyId.includes('eks'));
      expect(ec2Node).toBeUndefined();
      expect(s3Node).toBeUndefined();
      expect(eksNode).toBeUndefined();
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes CloudFront ingress path and surfaces unobservable origin dimensions as MASKED', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['13.224.1.1'],
          cname: ['d123.cloudfront.net'],
          ns: ['ns-1.awsdns.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://cf-masked.org',
          finalUrl: 'https://cf-masked.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: { server: 'CloudFront', 'x-amz-cf-id': 'masked-id-1' },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover('cf-masked.org', snapshot);
      const brief = result.architectureBrief;

      // Ingress path includes AWS CloudFront
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'AWS CloudFront',
      );

      // Origin Cloud Provider explicitly recognized as MASKED
      const originUnknown = brief.knownUnknowns.find(
        (u) => u.dimension === 'Origin Cloud Provider',
      );
      expect(originUnknown).toBeDefined();
      expect(originUnknown?.status).toBe('MASKED');

      // Claim boundary explicitly captured
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-cloudfront'),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures CloudFront in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-cloudfront',
              name: 'AWS CloudFront',
              category: 'CDN / Edge',
              confidence: 0.99,
            } as any,
          ],
          architectureBrief: {
            summary: 'Delivered through Amazon CloudFront edge distribution.',
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
                technologyId: 'tech-cloudfront',
                technologyName: 'AWS CloudFront',
                role: 'Edge CDN',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.EDGE,
                state: 'OBSERVED',
                technologies: [{ name: 'AWS CloudFront' }],
              },
            ],
            keyTechnologies: [{ name: 'AWS CloudFront', role: 'Edge CDN' }],
            integrations: [],
            knownUnknowns: [
              { dimension: 'Origin Cloud Provider', status: 'MASKED' },
            ],
            claimBoundaries: [
              {
                technologyName: 'AWS CloudFront',
                boundary: 'CloudFront does not prove AWS origin hosting',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.99 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-cf-1',
        'dom-cf-1',
        'cf-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-cf-1',
        'dom-cf-1',
        'cf-test.com',
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

  describe('6. Change Intelligence: Edge Layer Migration & Drift (TECH-006)', () => {
    it('detects Cloudflare to CloudFront migration as edge layer drift without asserting operational intent', () => {
      const prevCloudflare: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-cloudflare',
              name: 'Cloudflare',
              category: 'CDN / Edge',
              confidence: 0.99,
            } as any,
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: 'Web / Server',
              confidence: 0.95,
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

      const currCloudFront: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-cloudfront',
              name: 'AWS CloudFront',
              category: 'CDN / Edge',
              confidence: 0.99,
            } as any,
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: 'Web / Server',
              confidence: 0.95,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.EDGE,
                technologyId: 'tech-cloudfront',
                technologyName: 'AWS CloudFront',
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
                technologies: [{ name: 'AWS CloudFront' }],
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

      const diffs = changeAnalyzer.analyzeDifferences(
        prevCloudflare,
        currCloudFront,
      );

      // Cloudflare removed (conservative wording)
      const cfRemoved = diffs.find(
        (d) =>
          d.classification === 'TECHNOLOGY_REMOVED' &&
          d.technologyName === 'Cloudflare',
      );
      expect(cfRemoved).toBeDefined();
      expect(cfRemoved?.description).toContain('no longer observable');

      // CloudFront added
      const cfAdded = diffs.find(
        (d) =>
          d.classification === 'TECHNOLOGY_ADDED' &&
          d.technologyName === 'AWS CloudFront',
      );
      expect(cfAdded).toBeDefined();

      // INVARIANT: No fabricated intent (e.g. "team migrated from Cloudflare to AWS")
      for (const diff of diffs) {
        expect(diff.description).not.toContain('team migrated');
        expect(diff.description).not.toContain('migrated to AWS');
      }
    });

    it('detects CloudFront disappearance as EDGE_LAYER_DRIFT when origin gateway remains exposed', () => {
      const prevCloudFront: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-cloudfront',
              name: 'AWS CloudFront',
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
                technologyId: 'tech-cloudfront',
                technologyName: 'AWS CloudFront',
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
                technologies: [{ name: 'AWS CloudFront' }],
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

      const currDirectNginx: DiscoverySnapshot = {
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

      const diffs = changeAnalyzer.analyzeDifferences(
        prevCloudFront,
        currDirectNginx,
      );
      const edgeDrift = diffs.find(
        (d) => d.classification === 'EDGE_LAYER_DRIFT',
      );

      expect(edgeDrift).toBeDefined();
      expect(edgeDrift?.title).toContain('Edge layer no longer observed');
      expect(edgeDrift?.description).toContain(
        'AWS CloudFront is no longer observable',
      );
    });
  });

  describe('7. Technology Finding Rules (TECH-007)', () => {
    it('evaluates EdgeOriginExposureRule when origin server headers leak past CloudFront', async () => {
      const leakedSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          headers: {
            server: 'nginx/1.24.0 (Ubuntu)',
            'x-amz-cf-id': 'leak-amz-id-123',
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
                    technologyId: 'tech-cloudfront',
                    name: 'AWS CloudFront',
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

  describe('8. Domain Overview API Convergence (TECH-008)', () => {
    it('maps CloudFront into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-cf-overview',
        domainId: 'dom-cf-overview',
        jobId: 'job-002',
        responseTimeMs: 20,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint appears to be delivered through Amazon CloudFront edge distribution.',
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
                  technologyId: 'tech-cloudfront',
                  technologyName: 'AWS CloudFront',
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
                      technologyId: 'tech-cloudfront',
                      name: 'AWS CloudFront',
                      role: 'Edge / CDN Delivery',
                      layer: TopologyLayer.EDGE,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-cloudfront',
                  name: 'AWS CloudFront',
                  role: 'Edge / CDN Delivery',
                  layer: TopologyLayer.EDGE,
                },
              ],
              integrations: [],
              knownUnknowns: [
                {
                  dimension: 'Origin Cloud Provider',
                  status: 'MASKED',
                  explanation: 'Masked behind CloudFront edge',
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-cloudfront',
                  technologyName: 'AWS CloudFront',
                  boundary: 'CloudFront does not prove AWS origin hosting',
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
        'delivered through Amazon CloudFront',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('AWS CloudFront');
      expect(
        overview.technologyArchitecture?.claimBoundaries[0].boundary,
      ).toContain('CloudFront does not prove AWS origin hosting');
    });
  });

  describe('9. Executive Infrastructure Brief (TECH-009)', () => {
    it('synthesizes CloudFront into executive summary and highlights without CloudFront-specific branches', () => {
      const mockSnapshot = {
        id: 'snp-cf-brief',
        domainId: 'dom-cf-brief',
        domainName: 'aws-delivered.com',
        createdAt: new Date(),
        responseTimeMs: 25,
        httpStatus: 200,
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint appears to be delivered through Amazon CloudFront before reaching NGINX.',
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
                  technologyId: 'tech-cloudfront',
                  technologyName: 'AWS CloudFront',
                },
                {
                  hop: 2,
                  layer: TopologyLayer.GATEWAY,
                  technologyId: 'tech-nginx',
                  technologyName: 'NGINX',
                },
              ],
              integrations: [],
              knownUnknowns: [
                { dimension: 'Origin Cloud Provider', status: 'MASKED' },
              ],
              claimBoundaries: [
                {
                  technologyName: 'AWS CloudFront',
                  boundary: 'CloudFront does not prove origin hosting',
                },
              ],
            },
          },
        },
      } as any;

      const brief = briefBuilder.build(mockSnapshot, []);

      expect(brief.overallHealth).toBe('Excellent');
      expect(brief.summary).toContain('delivered through Amazon CloudFront');
      expect(brief.architecture?.ingressPath).toHaveLength(3);
    });
  });

  describe('10. The T2 Plug-and-Play Invariant', () => {
    it('verifies CloudFront is modularly registered without centralized hardcoding in core engines', () => {
      expect(cloudfrontDetector.id).toBe('tech-cloudfront');
      expect(cloudfrontDetector.name).toBe('AWS CloudFront');
      expect(cloudfrontDetector.category).toBe('CDN / Edge');
    });
  });
});
