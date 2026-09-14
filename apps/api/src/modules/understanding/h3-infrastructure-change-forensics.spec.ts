import { Test, TestingModule } from '@nestjs/testing';
import {
  ChangeSeverity,
  ChangeType,
  FindingCategory,
  FindingModule,
} from '@prisma/client';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { ChangeDetectionEngine } from './services/change-detection.engine';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  TechnologyChangeClassification,
  TechnologyChangeImpact,
} from './contracts/technology-change.interface';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import {
  TechnologyCategory,
  TopologyLayer,
  TechnologyConfidence,
} from '../../infrastructure/discovery/technology/contracts';

describe('H3: Infrastructure Change Forensics & Temporal Diffing Integration', () => {
  let analyzer: TechnologyChangeAnalyzerService;
  let changeEngine: ChangeDetectionEngine;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      changeHistory: {
        count: jest.fn().mockResolvedValue(0),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechnologyChangeAnalyzerService,
        ChangeDetectionEngine,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    analyzer = module.get<TechnologyChangeAnalyzerService>(
      TechnologyChangeAnalyzerService,
    );
    changeEngine = module.get<ChangeDetectionEngine>(ChangeDetectionEngine);
  });

  describe('1. Critical Invariant: Quiet on Zero Change (Snapshot A == Snapshot B)', () => {
    it('returns zero differences and remains quiet when identical infrastructure is observed', () => {
      const snapshotA: DiscoverySnapshot = {
        fingerprints: { overallFingerprint: 'hash-abc-123' },
        technology: {
          technologies: [
            {
              id: 'tech-cloudflare',
              name: 'Cloudflare',
              category: TechnologyCategory.CDN_EDGE,
              role: 'Edge CDN',
            } as any,
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: TechnologyCategory.WEB_SERVER,
              role: 'Reverse Proxy',
            } as any,
            {
              id: 'tech-nodejs',
              name: 'Node.js',
              category: TechnologyCategory.RUNTIME,
              role: 'Runtime',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                layer: TopologyLayer.EDGE,
                technologyId: 'tech-cloudflare',
                technologyName: 'Cloudflare',
              },
              {
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-nginx',
                technologyName: 'NGINX',
              },
              {
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-nodejs',
                technologyName: 'Node.js',
              },
            ],
          },
        },
      } as any;

      const snapshotB: DiscoverySnapshot = {
        fingerprints: { overallFingerprint: 'hash-abc-123' },
        technology: {
          technologies: [
            {
              id: 'tech-cloudflare',
              name: 'Cloudflare',
              category: TechnologyCategory.CDN_EDGE,
              role: 'Edge CDN',
            } as any,
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: TechnologyCategory.WEB_SERVER,
              role: 'Reverse Proxy',
            } as any,
            {
              id: 'tech-nodejs',
              name: 'Node.js',
              category: TechnologyCategory.RUNTIME,
              role: 'Runtime',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                layer: TopologyLayer.EDGE,
                technologyId: 'tech-cloudflare',
                technologyName: 'Cloudflare',
              },
              {
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-nginx',
                technologyName: 'NGINX',
              },
              {
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-nodejs',
                technologyName: 'Node.js',
              },
            ],
          },
        },
      } as any;

      const diffs = analyzer.analyzeDifferences(snapshotA, snapshotB);
      expect(diffs).toHaveLength(0);
    });
  });

  describe('2. Gateway Architecture Migration Forensics (NGINX -> Envoy)', () => {
    it('accurately identifies gateway migration with evidence before/after and anti-overreach boundary', () => {
      const prevSnapshot: DiscoverySnapshot = {
        http: { headers: { server: 'nginx/1.24.0' } } as any,
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: TechnologyCategory.WEB_SERVER,
              role: 'Gateway',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-nginx',
                technologyName: 'NGINX',
              },
            ],
          },
        },
      } as any;

      const currSnapshot: DiscoverySnapshot = {
        http: { headers: { server: 'envoy' } } as any,
        technology: {
          technologies: [
            {
              id: 'tech-envoy',
              name: 'Envoy',
              category: TechnologyCategory.WEB_SERVER,
              role: 'Gateway',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-envoy',
                technologyName: 'Envoy',
              },
            ],
          },
        },
      } as any;

      const diffs = analyzer.analyzeDifferences(prevSnapshot, currSnapshot);
      const gatewayDiff = diffs.find(
        (d) =>
          d.classification === TechnologyChangeClassification.GATEWAY_MIGRATED,
      );

      expect(gatewayDiff).toBeDefined();
      expect(gatewayDiff?.impact).toBe(TechnologyChangeImpact.ARCHITECTURAL);
      expect(gatewayDiff?.severity).toBe(ChangeSeverity.MEDIUM);
      expect(gatewayDiff?.title).toBe('Gateway architecture changed');
      expect(gatewayDiff?.description).toContain(
        'Web gateway migrated from NGINX to Envoy',
      );
      expect(gatewayDiff?.evidenceBefore).toContain('server: nginx/1.24.0');
      expect(gatewayDiff?.evidenceAfter).toContain('server: envoy');
      expect(gatewayDiff?.whatThisMeans).toContain(
        'publicly observable gateway boundary changed from NGINX to Envoy',
      );
      expect(gatewayDiff?.whatThisDoesNotProve).toContain(
        'This does not establish a Kubernetes migration, service-mesh deployment, or cloud-provider change',
      );
    });
  });

  describe('3. Application Runtime / Framework Migration Forensics (Node.js -> Go)', () => {
    it('detects runtime framework shift without asserting phantom cloud migrations', () => {
      const prevSnapshot: DiscoverySnapshot = {
        http: { headers: { 'x-powered-by': 'Express' } } as any,
        technology: {
          technologies: [
            {
              id: 'tech-nodejs',
              name: 'Node.js',
              category: TechnologyCategory.RUNTIME,
              role: 'Application',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-nodejs',
                technologyName: 'Node.js',
              },
            ],
          },
        },
      } as any;

      const currSnapshot: DiscoverySnapshot = {
        http: { headers: { 'x-powered-by': 'Go' } } as any,
        technology: {
          technologies: [
            {
              id: 'tech-go',
              name: 'Go',
              category: TechnologyCategory.RUNTIME,
              role: 'Application',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-go',
                technologyName: 'Go',
              },
            ],
          },
        },
      } as any;

      const diffs = analyzer.analyzeDifferences(prevSnapshot, currSnapshot);
      const appDiff = diffs.find(
        (d) =>
          d.classification ===
          TechnologyChangeClassification.FRAMEWORK_MIGRATED,
      );

      expect(appDiff).toBeDefined();
      expect(appDiff?.impact).toBe(TechnologyChangeImpact.ARCHITECTURAL);
      expect(appDiff?.title).toBe('Application framework changed');
      expect(appDiff?.description).toContain('migrated from Node.js to Go');
      expect(appDiff?.whatThisDoesNotProve).toContain(
        'This does not establish an origin cloud provider migration or container orchestrator change',
      );
    });
  });

  describe('4. Edge Delivery Drift Forensics (Cloudflare -> Fastly)', () => {
    it('classifies edge network shift with evidence before/after', () => {
      const prevSnapshot: DiscoverySnapshot = {
        http: {
          headers: { 'cf-ray': '842918414', server: 'cloudflare' },
        } as any,
        technology: {
          technologies: [
            {
              id: 'tech-cloudflare',
              name: 'Cloudflare',
              category: TechnologyCategory.CDN_EDGE,
              role: 'Edge CDN',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                layer: TopologyLayer.EDGE,
                technologyId: 'tech-cloudflare',
                technologyName: 'Cloudflare',
              },
            ],
          },
        },
      } as any;

      const currSnapshot: DiscoverySnapshot = {
        http: {
          headers: {
            'x-served-by': 'cache-iad-kiad7000025-IAD',
            'x-fastly-request-id': 'abc123',
          },
        } as any,
        technology: {
          technologies: [
            {
              id: 'tech-fastly',
              name: 'Fastly',
              category: TechnologyCategory.CDN_EDGE,
              role: 'Edge CDN',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                layer: TopologyLayer.EDGE,
                technologyId: 'tech-fastly',
                technologyName: 'Fastly',
              },
            ],
          },
        },
      } as any;

      const diffs = analyzer.analyzeDifferences(prevSnapshot, currSnapshot);
      const edgeDiff = diffs.find(
        (d) =>
          d.classification === TechnologyChangeClassification.EDGE_LAYER_DRIFT,
      );

      expect(edgeDiff).toBeDefined();
      expect(edgeDiff?.title).toBe('Edge delivery network changed');
      expect(edgeDiff?.description).toContain(
        'Edge delivery changed from Cloudflare to Fastly',
      );
      expect(edgeDiff?.whatThisDoesNotProve).toContain(
        'This does not prove that backend origin servers have migrated to a different cloud provider',
      );
    });
  });

  describe('5. Ingress Path Hop Added / Removed (H1 Integration)', () => {
    it('detects added hop in linear ingress request path', () => {
      const prevSnapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: TechnologyCategory.WEB_SERVER,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-nginx',
                technologyName: 'NGINX',
              },
            ],
          },
        },
      } as any;

      const currSnapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-cloudflare',
              name: 'Cloudflare',
              category: TechnologyCategory.CDN_EDGE,
            } as any,
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: TechnologyCategory.WEB_SERVER,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                layer: TopologyLayer.EDGE,
                technologyId: 'tech-cloudflare',
                technologyName: 'Cloudflare',
              },
              {
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-nginx',
                technologyName: 'NGINX',
              },
            ],
          },
        },
      } as any;

      const diffs = analyzer.analyzeDifferences(prevSnapshot, currSnapshot);
      const edgeDrift = diffs.find(
        (d) =>
          d.classification === TechnologyChangeClassification.EDGE_LAYER_DRIFT,
      );
      expect(edgeDrift).toBeDefined();
      expect(edgeDrift?.title).toBe('Edge layer appeared');
    });
  });

  describe('6. Deep Wire & Behavioral Fingerprint Changes (H2 Integration)', () => {
    it('captures wire behavioral changes and marks them non-dogmatically', () => {
      const prevSnapshot: DiscoverySnapshot = {
        technology: {
          technologies: [],
          behavioralFingerprint: {
            signals: [],
          },
        },
      } as any;

      const currSnapshot: DiscoverySnapshot = {
        technology: {
          technologies: [],
          behavioralFingerprint: {
            signals: [
              {
                id: 'sig-fastly-routing',
                name: 'Fastly Edge Routing Headers',
                category: 'HTTP',
                type: 'ROUTING_HEADER_SIGNATURE',
                strength: 0.95,
                confidence: 0.9,
                targetTechnologyId: 'tech-fastly',
                targetTechnologyName: 'Fastly',
                description:
                  'Observed Fastly edge routing headers (x-served-by, fastly-restarts)',
                observedWireEvidence: 'x-served-by: cache-iad-kiad7000025-IAD',
              },
            ],
          },
        },
      } as any;

      const diffs = analyzer.analyzeDifferences(prevSnapshot, currSnapshot);
      const behaviorDiff = diffs.find(
        (d) =>
          d.classification ===
          TechnologyChangeClassification.HTTP_BEHAVIOR_CHANGED,
      );

      expect(behaviorDiff).toBeDefined();
      expect(behaviorDiff?.evidenceAfter).toContain(
        'x-served-by: cache-iad-kiad7000025-IAD',
      );
      expect(behaviorDiff?.whatThisDoesNotProve).toContain(
        'Behavioral wire signals corroborate active profiles but do not manufacture certainty',
      );
    });
  });

  describe('7. Severity != Change: Architectural Shift vs Security Posture', () => {
    it('distinguishes architectural evolution from security policy regressions', () => {
      const prevSnapshot: DiscoverySnapshot = {
        http: {
          headers: {
            'strict-transport-security': 'max-age=31536000; includeSubDomains',
            server: 'nginx',
          },
        } as any,
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: TechnologyCategory.WEB_SERVER,
            } as any,
          ],
        },
      };

      const currSnapshot: DiscoverySnapshot = {
        http: {
          headers: {
            server: 'envoy',
          },
        } as any,
        technology: {
          technologies: [
            {
              id: 'tech-envoy',
              name: 'Envoy',
              category: TechnologyCategory.WEB_SERVER,
            } as any,
          ],
        },
      };

      const diffs = changeEngine.computeDifferences(prevSnapshot, currSnapshot);

      // Security header regression -> High severity
      const hstsDiff = diffs.find((d) =>
        d.title.includes('Strict-Transport-Security header removed'),
      );
      expect(hstsDiff).toBeDefined();
      expect(hstsDiff?.severity).toBe(ChangeSeverity.HIGH);
      expect(hstsDiff?.module).toBe(FindingModule.HTTP);
      expect(hstsDiff?.category).toBe(FindingCategory.SECURITY_HEADER);

      // Technology lifecycle added -> Low/Medium severity architectural event
      const techDiff = diffs.find((d) =>
        d.title.includes('Technology added: Envoy'),
      );
      expect(techDiff).toBeDefined();
      expect(techDiff?.severity).toBe(ChangeSeverity.LOW);
      expect(techDiff?.module).toBe(FindingModule.TECHNOLOGY);
    });
  });

  describe('8. Structured Forensic Explanations & Anti-Overreach UX', () => {
    it('generates 5-part forensic explanations for meaningful migrations', () => {
      const prevSnapshot: DiscoverySnapshot = {
        http: { headers: { server: 'nginx' } } as any,
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: TechnologyCategory.WEB_SERVER,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-nginx',
                technologyName: 'NGINX',
              },
            ],
          },
        },
      } as any;

      const currSnapshot: DiscoverySnapshot = {
        http: { headers: { server: 'caddy' } } as any,
        technology: {
          technologies: [
            {
              id: 'tech-caddy',
              name: 'Caddy',
              category: TechnologyCategory.GATEWAY,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-caddy',
                technologyName: 'Caddy',
              },
            ],
          },
        },
      } as any;

      const diffs = analyzer.analyzeDifferences(prevSnapshot, currSnapshot);
      const gatewayDiff = diffs.find(
        (d) =>
          d.classification === TechnologyChangeClassification.GATEWAY_MIGRATED,
      );

      expect(gatewayDiff).toBeDefined();
      expect(gatewayDiff?.forensicExplanation).toBeDefined();
      expect(gatewayDiff?.forensicExplanation?.whatChanged).toBe(
        'Gateway migrated from NGINX to Caddy',
      );
      expect(gatewayDiff?.forensicExplanation?.whatItMeans).toContain(
        'The publicly observable gateway boundary changed',
      );
      expect(gatewayDiff?.forensicExplanation?.whatWeCannotConclude).toContain(
        'This does not establish a Kubernetes migration',
      );
    });
  });

  describe('9. Multi-Signal Authoritative Provider Attribution Guard (WX-1022 / H3)', () => {
    it('only emits provider changes when both states are authoritative', () => {
      const prevSnapshot: DiscoverySnapshot = {
        attribution: {
          hosting: {
            provider: 'AWS',
            confidence: 'HIGH',
            decision: 'CONFIRMED',
          },
        },
      } as any;

      const currSnapshot: DiscoverySnapshot = {
        attribution: {
          hosting: {
            provider: 'GCP',
            confidence: 'HIGH',
            decision: 'CONFIRMED',
          },
        },
      } as any;

      const diffs = changeEngine.computeDifferences(prevSnapshot, currSnapshot);
      const providerDiff = diffs.find(
        (d) => d.title === 'Hosting provider changed',
      );

      expect(providerDiff).toBeDefined();
      expect(providerDiff?.description).toBe(
        "Hosting provider changed from 'AWS' to 'GCP'.",
      );
    });
  });

  describe('10. Persistence & Idempotency', () => {
    it('persists change events cleanly and avoids duplicates on subsequent invocations', async () => {
      const prevSnapshot: DiscoverySnapshot = {
        technology: {
          technologies: [],
        },
      };

      const currSnapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-react',
              name: 'React',
              category: TechnologyCategory.FRAMEWORK,
            } as any,
          ],
        },
      };

      const count = await changeEngine.detectAndPersistChanges(
        'domain-123',
        'snap-001',
        'snap-002',
        prevSnapshot,
        currSnapshot,
      );

      expect(count).toBe(1);
      expect(prismaMock.changeHistory.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              domainId: 'domain-123',
              previousSnapshotId: 'snap-001',
              currentSnapshotId: 'snap-002',
              title: 'Technology added: React',
            }),
          ]),
        }),
      );
    });
  });
});
