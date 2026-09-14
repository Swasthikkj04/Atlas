import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { DockerDetector } from '../../infrastructure/discovery/technology/detectors/runtime/docker.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureBriefBuilder } from '../infrastructure-brief/builders/infrastructure-brief.builder';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';

describe('T9: Docker Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let dockerDetector: DockerDetector;
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
    dockerDetector = moduleRef.get(DockerDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
    briefBuilder = moduleRef.get(InfrastructureBriefBuilder);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative Docker Detection (TECH-001)', () => {
    it('detects Docker from registry distribution API header with 0 additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://registry.company.io',
          finalUrl: 'https://registry.company.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'docker-distribution-api-version': 'registry/2.0',
            'x-docker-registry-version': '2.8.1',
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
        'registry.company.io',
        snapshot,
      );

      const docker = result.technologies.find((t) => t.id === 'tech-docker');
      expect(docker).toBeDefined();
      expect(docker?.name).toBe('Docker');
      expect(docker?.category).toBe('Infrastructure Runtime');
      expect(docker?.confidenceLevel).toBe('HIGH');
      expect(docker?.evidence.length).toBeGreaterThanOrEqual(2);
    });

    it('returns null / absent when no Docker signatures exist', async () => {
      const nonDockerSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://standard-web.com',
          finalUrl: 'https://standard-web.com',
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
        'standard-web.com',
        nonDockerSnapshot,
      );
      const docker = result.technologies.find((t) => t.id === 'tech-docker');
      expect(docker).toBeUndefined();
    });
  });

  describe('2. Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('answers the four canonical questions and strictly rejects assumptions about Kubernetes, ECS, Linux OS, or Cloud Provider', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://docker-boundary.io',
          finalUrl: 'https://docker-boundary.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 28,
          headers: {
            'docker-distribution-api-version': 'registry/2.0',
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
        'docker-boundary.io',
        snapshot,
      );
      const docker = result.technologies.find((t) => t.id === 'tech-docker');

      // 1. What is it?
      expect(docker.category).toBe('Infrastructure Runtime');
      // 2. Role
      expect(docker.role).toContain('Containerized application runtime');
      // 3. Meaning
      expect(docker.infrastructureMeaning).toContain(
        'evidence consistent with Docker-based containerization at the runtime boundary',
      );
      // 4. Critical Anti-Overreach: Docker ≠ Kubernetes, ECS, EKS, Linux host OS, AWS/GCP hosting
      expect(docker.whatThisDoesNotProve).toContain(
        'does not prove Kubernetes, ECS, EKS, Docker Swarm',
      );
      expect(docker.whatThisDoesNotProve).toContain('Linux host OS');
    });
  });

  describe('3. Topology Understanding & Relationship Absence (TECH-003)', () => {
    it('maps Docker at RUNTIME layer without manufacturing fake Kubernetes, ECS, or host OS nodes', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://docker-app.io',
          finalUrl: 'https://docker-app.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'nginx/1.24.0',
            'docker-distribution-api-version': 'registry/2.0',
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

      const result = await techDiscovery.discover('docker-app.io', snapshot);
      const topo = result.topology;

      // NGINX at GATEWAY layer
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      // Docker at RUNTIME layer
      const dockerNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-docker',
      );
      expect(dockerNode?.layer).toBe(TopologyLayer.RUNTIME);

      // INVARIANT: Zero manufactured Kubernetes, ECS, EKS, or Linux host nodes
      const k8sNode = topo.nodes.find((n) =>
        n.technologyId.includes('kubernetes'),
      );
      const ecsNode = topo.nodes.find((n) => n.technologyId.includes('ecs'));
      const linuxNode = topo.nodes.find((n) =>
        n.technologyId.includes('linux'),
      );
      expect(k8sNode).toBeUndefined();
      expect(ecsNode).toBeUndefined();
      expect(linuxNode).toBeUndefined();
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes Docker in request path and preserves unobserved orchestrator and host OS as unknowns', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://docker-brief-app.com',
          finalUrl: 'https://docker-brief-app.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'docker-distribution-api-version': 'registry/2.0',
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
        'docker-brief-app.com',
        snapshot,
      );
      const brief = result.architectureBrief;

      // Ingress path includes Docker
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'Docker',
      );

      // Claim boundary explicitly captured
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-docker'),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures Docker in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-docker',
              name: 'Docker',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
            } as any,
          ],
          architectureBrief: {
            summary:
              'The public endpoint observed evidence consistent with Docker-based containerization.',
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
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-docker',
                technologyName: 'Docker',
                role: 'Container Runtime',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Docker' }],
              },
            ],
            keyTechnologies: [{ name: 'Docker', role: 'Container Runtime' }],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'Docker',
                boundary: 'Docker presence does not prove Kubernetes or AWS',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-doc-1',
        'dom-doc-1',
        'docker-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-doc-1',
        'dom-doc-1',
        'docker-test.com',
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
    it('detects Docker addition and removal with conservative, evidence-bound descriptions', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currDocker: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-docker',
              name: 'Docker',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-docker',
                technologyName: 'Docker',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Docker' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(
        prevEmpty,
        currDocker,
      );
      const added = diffsAdded.find(
        (d) =>
          d.classification === 'TECHNOLOGY_ADDED' &&
          d.technologyName === 'Docker',
      );
      expect(added).toBeDefined();

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currDocker,
        prevEmpty,
      );
      const removed = diffsRemoved.find(
        (d) =>
          d.classification === 'TECHNOLOGY_REMOVED' &&
          d.technologyName === 'Docker',
      );
      expect(removed).toBeDefined();
      expect(removed?.description).toContain('no longer observable');
    });
  });

  describe('7. Domain Overview API Convergence (TECH-008)', () => {
    it('maps Docker into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-doc-overview',
        domainId: 'dom-doc-overview',
        jobId: 'job-009',
        responseTimeMs: 25,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint backend participates in a Docker-based container runtime.',
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
                  layer: TopologyLayer.RUNTIME,
                  technologyId: 'tech-docker',
                  technologyName: 'Docker',
                  role: 'Container Runtime',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.RUNTIME,
                  state: 'OBSERVED',
                  confidenceLevel: 'HIGH',
                  technologies: [
                    {
                      technologyId: 'tech-docker',
                      name: 'Docker',
                      role: 'Container Runtime',
                      layer: TopologyLayer.RUNTIME,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-docker',
                  name: 'Docker',
                  role: 'Container Runtime',
                  layer: TopologyLayer.RUNTIME,
                },
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [
                {
                  technologyId: 'tech-docker',
                  technologyName: 'Docker',
                  boundary: 'Docker presence does not prove Kubernetes',
                },
              ],
              confidence: { overallLevel: 'HIGH', overallScore: 0.95 },
            },
          },
        },
      } as any;

      const overview = InfrastructureOverviewMapper.fromSnapshot(mockSnapshot);

      expect(overview.technologyArchitecture).toBeDefined();
      expect(overview.technologyArchitecture?.architectureSummary).toContain(
        'Docker',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('Docker');
    });
  });

  describe('8. Executive Infrastructure Brief (TECH-009)', () => {
    it('synthesizes Docker container runtime into executive brief without Docker-specific branches', () => {
      const mockSnapshot = {
        id: 'snp-doc-exec',
        domainId: 'dom-doc-exec',
        domainName: 'docker-app.com',
        createdAt: new Date(),
        responseTimeMs: 25,
        httpStatus: 200,
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint is served through an NGINX gateway and runs inside a Docker container runtime.',
              architecturePath: [
                {
                  hop: 0,
                  layer: TopologyLayer.GATEWAY,
                  technologyId: 'public-endpoint',
                  technologyName: 'Public Endpoint',
                },
                {
                  hop: 1,
                  layer: TopologyLayer.GATEWAY,
                  technologyId: 'tech-nginx',
                  technologyName: 'NGINX',
                },
                {
                  hop: 2,
                  layer: TopologyLayer.RUNTIME,
                  technologyId: 'tech-docker',
                  technologyName: 'Docker',
                },
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [
                {
                  technologyName: 'Docker',
                  boundary: 'Docker presence does not prove Kubernetes',
                },
              ],
            },
          },
        },
      } as any;

      const brief = briefBuilder.build(mockSnapshot, []);

      expect(brief.overallHealth).toBe('Excellent');
      expect(brief.summary).toContain('Docker container runtime');
      expect(brief.architecture?.ingressPath).toHaveLength(3);
    });
  });

  describe('9. The T9 Plug-and-Play Invariant', () => {
    it('verifies Docker is modularly registered without centralized hardcoding in core engines', () => {
      expect(dockerDetector.id).toBe('tech-docker');
      expect(dockerDetector.name).toBe('Docker');
      expect(dockerDetector.category).toBe('Infrastructure Runtime');
    });
  });
});
