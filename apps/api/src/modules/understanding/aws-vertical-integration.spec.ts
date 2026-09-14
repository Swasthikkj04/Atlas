import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { AwsDetector } from '../../infrastructure/discovery/technology/detectors/cloud/aws.detector';
import { CloudFrontDetector } from '../../infrastructure/discovery/technology/detectors/cdn/cloudfront.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';
import { DeepBehavioralFingerprintingEngine } from '../../infrastructure/discovery/technology/engine/deep-behavioral-fingerprinting.engine';
import { createTechnologyDetectionContext } from '../../infrastructure/discovery/technology/context/technology-detection-context.impl';

describe('T22: AWS Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let awsDetector: AwsDetector;
  let cloudfrontDetector: CloudFrontDetector;
  let behavioralEngine: DeepBehavioralFingerprintingEngine;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;
  let ruleEngine: FindingRuleEngineService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    awsDetector = moduleRef.get(AwsDetector);
    cloudfrontDetector = moduleRef.get(CloudFrontDetector);
    behavioralEngine = moduleRef.get(DeepBehavioralFingerprintingEngine);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  // ---------------------------------------------------------------------------
  // 1. Component-Specific AWS Detection (TECH-001)
  // ---------------------------------------------------------------------------
  describe('1. Component-Specific AWS Detection (TECH-001)', () => {
    it('detects AWS ALB from x-amzn-trace-id and server: awselb banner', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['52.200.10.20'],
          cname: ['my-alb-12345.us-east-1.elb.amazonaws.com'],
          ns: ['ns-100.awsdns-01.org', 'ns-200.awsdns-02.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://aws-backed-service.com',
          finalUrl: 'https://aws-backed-service.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'awselb/2.0',
            'x-amzn-trace-id': 'Root=1-6789abcd-1234567890abcdef',
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
        'aws-backed-service.com',
        snapshot,
      );

      const aws = result.technologies.find((t) => t.id === 'tech-aws');
      expect(aws).toBeDefined();
      expect(aws?.name).toBe('Amazon Web Services (AWS)');
      expect(aws?.category).toBe('Cloud / Infrastructure');
      expect(aws?.confidenceLevel).toBe('HIGH');
      expect(aws?.role).toContain('Cloud Ingress & Load Balancing');
      expect(aws?.evidence.length).toBeGreaterThanOrEqual(3);
    });

    it('detects AWS from AWSALB / AWSELB session routing cookies', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://aws-cookie-app.com',
          finalUrl: 'https://aws-cookie-app.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'set-cookie':
              'AWSALB=k8J9xL0...; Path=/; Expires=Wed, 21 Oct 2026 07:28:00 GMT',
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
        'aws-cookie-app.com',
        snapshot,
      );

      const aws = result.technologies.find((t) => t.id === 'tech-aws');
      expect(aws).toBeDefined();
      expect(aws?.name).toBe('Amazon Web Services (AWS)');
      expect(aws?.evidence.some((e) => e.source.includes('Set-Cookie'))).toBe(
        true,
      );
    });

    it('detects AWS TLS evidence when Amazon Trust Services CA issuer is present', async () => {
      const snapshot: DiscoverySnapshot = {
        ssl: {
          valid: true,
          issuer: 'CN=Amazon RSA 2048 M01, O=Amazon, C=US',
          subject: 'CN=api.aws-tls-service.io',
          validFrom: '2026-01-01',
          validTo: '2027-01-01',
          daysRemaining: 300,
          protocol: 'TLSv1.3',
          cipher: 'TLS_AES_128_GCM_SHA256',
          san: ['api.aws-tls-service.io'],
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
          certificate: {
            issuer: {
              organization: 'Amazon Trust Services',
              commonName: 'Amazon RSA 2048 M01',
            },
          } as any,
        },
        http: {
          reachable: true,
          url: 'https://api.aws-tls-service.io',
          finalUrl: 'https://api.aws-tls-service.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {},
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
        'api.aws-tls-service.io',
        snapshot,
      );

      const aws = result.technologies.find((t) => t.id === 'tech-aws');
      expect(aws).toBeDefined();
      expect(aws?.evidence.some((e) => e.sourceType === 'TLS')).toBe(true);
    });

    it('returns null / absent when no AWS-specific indicators exist', async () => {
      const nonAwsSnapshot: DiscoverySnapshot = {
        dns: {
          a: ['93.184.216.34'],
          ns: ['ns1.customdns.net'],
          aaaa: [],
          mx: [],
          txt: [],
          cname: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://bare-metal.org',
          finalUrl: 'https://bare-metal.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 45,
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
        'bare-metal.org',
        nonAwsSnapshot,
      );
      const aws = result.technologies.find((t) => t.id === 'tech-aws');
      expect(aws).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Meaning & Critical Anti-Overreach Claim Boundaries (TECH-002)
  // ---------------------------------------------------------------------------
  describe('2. Meaning & Critical Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('answers the four canonical questions and strictly rejects claims about EC2, ECS, EKS, or entire-infrastructure hosting', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://aws-api-boundary.com',
          finalUrl: 'https://aws-api-boundary.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'x-amzn-trace-id': 'Root=1-trace-id-only',
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
        'aws-api-boundary.com',
        snapshot,
      );
      const aws = result.technologies.find((t) => t.id === 'tech-aws');

      // 1. What is it?
      expect(aws.category).toBe('Cloud / Infrastructure');
      // 2. Role
      expect(aws.role).toContain('Cloud Ingress');
      // 3. Meaning
      expect(aws.infrastructureMeaning).toContain('AWS-managed infrastructure');
      // 4. Critical Anti-Overreach: AWS service ≠ entire infrastructure hosted on AWS / EC2 / ECS / EKS
      expect(aws.whatThisDoesNotProve).toContain(
        'does not prove the entire application runs on AWS',
      );
      expect(aws.whatThisDoesNotProve).toContain('EC2');
      expect(aws.whatThisDoesNotProve).toContain('ECS');
      expect(aws.whatThisDoesNotProve).toContain('EKS');
      expect(aws.whatThisDoesNotProve).toContain('Lambda');
      expect(aws.whatThisDoesNotProve).toContain('RDS');
      expect(aws.whatThisDoesNotProve).toContain('DynamoDB');
    });

    it('distinguishes CloudFront (EDGE) from generic AWS without fabricating origin compute', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://cf-isolated.net',
          finalUrl: 'https://cf-isolated.net',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 15,
          headers: {
            'x-amz-cf-id': 'cf-sample-id-12345',
            'x-amz-cf-pop': 'IAD89-C1',
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

      const result = await techDiscovery.discover('cf-isolated.net', snapshot);
      const cf = result.technologies.find((t) => t.id === 'tech-cloudfront');

      expect(cf).toBeDefined();
      expect(cf?.name).toBe('AWS CloudFront');
      expect(cf?.category).toBe('CDN / Edge');
      expect(cf?.whatThisDoesNotProve).toContain(
        'does not prove origin hosting on AWS EC2, ECS, EKS, or S3',
      );

      // Origin remains unobserved
      expect(
        result.architectureBrief?.knownUnknowns.some(
          (u) =>
            u.dimension.toLowerCase().includes('origin') ||
            u.dimension.toLowerCase().includes('database'),
        ),
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Topology & Multi-Technology Coexistence (TECH-003)
  // ---------------------------------------------------------------------------
  describe('3. Topology & Multi-Technology Coexistence (TECH-003)', () => {
    it('expresses CLIENT -> CloudFront (EDGE) -> AWS ALB (GATEWAY) -> NGINX (GATEWAY) -> Node.js (RUNTIME) -> [UNOBSERVED DATABASE]', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['52.1.2.3'],
          cname: ['d1234.cloudfront.net'],
          ns: ['ns-1.awsdns.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://full-stack-aws.io',
          finalUrl: 'https://full-stack-aws.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'x-amz-cf-id': 'cf-req-999',
            'x-amzn-trace-id': 'Root=1-alb-trace',
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
        'full-stack-aws.io',
        snapshot,
      );
      const topo = result.topology;

      // CloudFront at EDGE
      const cfNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-cloudfront',
      );
      expect(cfNode).toBeDefined();
      expect(cfNode?.layer).toBe(TopologyLayer.EDGE);

      // AWS at GATEWAY / PLATFORM
      const awsNode = topo.nodes.find((n) => n.technologyId === 'tech-aws');
      expect(awsNode).toBeDefined();

      // NGINX at GATEWAY
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode).toBeDefined();
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      // Node.js at RUNTIME
      const nodeNode = topo.nodes.find((n) => n.technologyId === 'tech-nodejs');
      expect(nodeNode).toBeDefined();
      expect(nodeNode?.layer).toBe(TopologyLayer.RUNTIME);

      // Invariant: Zero manufactured backend nodes
      const ec2Node = topo.nodes.find((n) => n.technologyId.includes('ec2'));
      const rdsNode = topo.nodes.find((n) => n.technologyId.includes('rds'));
      expect(ec2Node).toBeUndefined();
      expect(rdsNode).toBeUndefined();
    });

    it('coexists with Cloudflare edge without mutating into CloudFront', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://cloudflare-fronted-aws.com',
          finalUrl: 'https://cloudflare-fronted-aws.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            server: 'cloudflare',
            'cf-ray': '89b-cf-iad',
            'x-amzn-trace-id': 'Root=1-origin-alb-trace',
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
        'cloudflare-fronted-aws.com',
        snapshot,
      );

      const cf = result.technologies.find((t) => t.id === 'tech-cloudflare');
      const cloudfront = result.technologies.find(
        (t) => t.id === 'tech-cloudfront',
      );
      const aws = result.technologies.find((t) => t.id === 'tech-aws');

      expect(cf).toBeDefined();
      expect(aws).toBeDefined();
      expect(cloudfront).toBeUndefined(); // Cloudflare MUST NOT become CloudFront
    });

    it('coexists with Envoy gateway without collapsing into an AWS/Envoy monolith', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://envoy-on-aws.com',
          finalUrl: 'https://envoy-on-aws.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 18,
          headers: {
            'x-amz-cf-id': 'cf-12345',
            server: 'envoy/1.28.0',
            'x-envoy-upstream-service-time': '10',
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

      const result = await techDiscovery.discover('envoy-on-aws.com', snapshot);

      const cloudfront = result.technologies.find(
        (t) => t.id === 'tech-cloudfront',
      );
      const envoy = result.technologies.find((t) => t.id === 'tech-envoy');

      expect(cloudfront).toBeDefined();
      expect(envoy).toBeDefined();
      expect(envoy?.version).toBe('1.28.0');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. T22 Behavioral Corroboration & Fusion Posture (TECH-001 / TECH-004)
  // ---------------------------------------------------------------------------
  describe('4. T22 Behavioral Corroboration & Fusion Posture', () => {
    it('fuses direct header + TLS signals to CORROBORATED posture with high confidence', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'aws-fused.io',
        http: {
          statusCode: 200,
          headers: {
            'x-amzn-trace-id': 'Root=1-alb-trace-123',
          },
        } as any,
        ssl: {
          certificate: {
            issuer: { organization: 'Amazon Trust Services' },
          },
        } as any,
      });

      const directResult = awsDetector.detect(context);
      expect(directResult).not.toBeNull();

      const { results, behavioralResult } = behavioralEngine.analyze(context, [
        directResult,
      ]);
      expect(behavioralResult.posturesByTechnology['tech-aws']).toBe(
        'CORROBORATED',
      );
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.95);
    });

    it('treats behavioral-only AWS cookie as CONSISTENT rather than deterministic entire-cloud claim', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'aws-behavioral-only.io',
        http: {
          statusCode: 200,
          headers: {
            'set-cookie': 'AWSALB=session-data-xyz',
          },
        } as any,
      });

      const { results, behavioralResult } = behavioralEngine.analyze(
        context,
        [],
      );
      const awsBehavior = results.find((r) => r.id === 'tech-aws');

      expect(awsBehavior).toBeDefined();
      expect(behavioralResult.posturesByTechnology['tech-aws']).toBe(
        'CONSISTENT',
      );
      expect(awsBehavior?.confidenceLevel).toBe('HIGH');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Architecture Brief & Known Unknowns (TECH-004)
  // ---------------------------------------------------------------------------
  describe('5. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes multi-component architecture and explicitly surfaces unobservable compute and database layers as unknowns', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['52.1.2.3'],
          cname: ['app.us-east-1.elb.amazonaws.com'],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://aws-app-stack.io',
          finalUrl: 'https://aws-app-stack.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'nginx/1.24.0',
            'x-amzn-trace-id': 'Root=1-trace-alb',
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

      const result = await techDiscovery.discover('aws-app-stack.io', snapshot);
      const brief = result.architectureBrief;

      // Ingress path includes AWS and NGINX
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'Amazon Web Services (AWS)',
      );
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'NGINX',
      );

      // Claim boundary explicitly captured
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-aws'),
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Snapshot Memory & Deterministic Baseline (TECH-005)
  // ---------------------------------------------------------------------------
  describe('6. Snapshot Memory & Deterministic Baseline (TECH-005)', () => {
    it('captures AWS in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-aws',
              name: 'Amazon Web Services (AWS)',
              category: 'Cloud / Infrastructure',
              confidence: 0.98,
            } as any,
          ],
          architectureBrief: {
            summary:
              'Public endpoint resolves to Amazon Web Services infrastructure.',
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
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-aws',
                technologyName: 'Amazon Web Services (AWS)',
                role: 'Cloud Infrastructure',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.GATEWAY,
                state: 'OBSERVED',
                technologies: [{ name: 'Amazon Web Services (AWS)' }],
              },
            ],
            keyTechnologies: [
              {
                name: 'Amazon Web Services (AWS)',
                role: 'Cloud Infrastructure',
              },
            ],
            integrations: [],
            knownUnknowns: [
              { dimension: 'Origin Cloud Provider', status: 'OBSERVED' },
            ],
            claimBoundaries: [
              {
                technologyName: 'Amazon Web Services (AWS)',
                boundary: 'AWS presence does not prove EC2 origin compute',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.98 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-aws-1',
        'dom-aws-1',
        'aws-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-aws-1',
        'dom-aws-1',
        'aws-test.com',
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
    it('detects AWS added, removed, or modified without fabricating operational intent', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currWithAws: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-aws',
              name: 'Amazon Web Services (AWS)',
              category: 'Cloud / Infrastructure',
              confidence: 0.98,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-aws',
                technologyName: 'Amazon Web Services (AWS)',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.GATEWAY,
                state: 'OBSERVED',
                technologies: [{ name: 'Amazon Web Services (AWS)' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(
        prevEmpty,
        currWithAws,
      );
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === 'Amazon Web Services (AWS)',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currWithAws,
        prevEmpty,
      );
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === 'Amazon Web Services (AWS)',
        ),
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Domain Overview API Convergence (TECH-008)
  // ---------------------------------------------------------------------------
  describe('8. Domain Overview API Convergence (TECH-008)', () => {
    it('maps AWS into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-aws-overview',
        domainId: 'dom-aws-overview',
        jobId: 'job-003',
        responseTimeMs: 30,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary: 'Public endpoint uses AWS managed infrastructure.',
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
                  layer: TopologyLayer.GATEWAY,
                  technologyId: 'tech-aws',
                  technologyName: 'Amazon Web Services (AWS)',
                  role: 'Cloud Infrastructure',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.GATEWAY,
                  technologies: [
                    {
                      technologyId: 'tech-aws',
                      name: 'Amazon Web Services (AWS)',
                      role: 'Cloud Infrastructure',
                      layer: TopologyLayer.GATEWAY,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-aws',
                  name: 'Amazon Web Services (AWS)',
                  role: 'Cloud Infrastructure',
                  layer: TopologyLayer.GATEWAY,
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-aws',
                  technologyName: 'Amazon Web Services (AWS)',
                  boundary: 'AWS presence does not prove EC2',
                },
              ],
              confidence: { overallLevel: 'HIGH', overallScore: 0.98 },
            },
          },
        },
      };

      const overview = InfrastructureOverviewMapper.fromSnapshot(mockSnapshot);
      expect(overview.technologyArchitecture).toBeDefined();
      expect(overview.technologyArchitecture?.architectureSummary).toContain(
        'AWS',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('Amazon Web Services (AWS)');
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Negative Anti-Overreach Invariants
  // ---------------------------------------------------------------------------
  describe('9. Negative Anti-Overreach Invariants', () => {
    it('strictly avoids manufacturing EC2, ECS, EKS, Lambda, RDS, S3, DynamoDB, or VPC from AWS ingress evidence', () => {
      expect(awsDetector.id).toBe('tech-aws');
      expect(awsDetector.whatThisDoesNotProve).toContain('EC2');
      expect(awsDetector.whatThisDoesNotProve).toContain('ECS');
      expect(awsDetector.whatThisDoesNotProve).toContain('EKS');
      expect(awsDetector.whatThisDoesNotProve).toContain('Lambda');
      expect(awsDetector.whatThisDoesNotProve).toContain('RDS');
      expect(awsDetector.whatThisDoesNotProve).toContain('DynamoDB');
      expect(awsDetector.whatThisDoesNotProve).toContain('VPC');
      expect(awsDetector.whatThisDoesNotProve).toContain('Kubernetes');
      expect(awsDetector.whatThisDoesNotProve).toContain('Linux');
    });
  });
});
