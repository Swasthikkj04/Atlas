import { Test, TestingModule } from '@nestjs/testing';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import {
  TechnologyChangeClassification,
  TechnologyChangeImpact,
  TechnologyDifference,
} from './contracts/technology-change.interface';
import { ArchitecturalPostureIntelligenceEngine } from './services/architectural-posture-intelligence.engine';
import { MissingHstsRule } from '../findings/rules/infrastructure/http/missing-hsts.rule';
import { FindingContext } from '../findings/contracts/finding-context.interface';
import { Severity } from '../findings/enums/severity.enum';

/**
 * H4: Authoritative Architectural Impact & Posture Intelligence Integration Suite
 *
 * Verifies:
 * 1. Security Posture Regression (HSTS removed -> Posture Degraded -> Finding generated -> What Matters Now alert)
 * 2. Security Posture Resolution (HSTS restored -> Finding RESOLVED -> What Matters Now calm reassurance)
 * 3. Exposure Level Detection (Server header stripped -> Server: nginx/1.24.0 -> Implementation disclosure increased)
 * 4. Architecture Posture & Strict Anti-Overreach (Cloudflare -> NGINX -> Node.js: Never asserts High Availability or redundancy)
 * 5. Topology Migration Significance (Cloudflare/NGINX/Node.js -> Fastly/Envoy/Go: Separates Observed vs Interpretation vs Unknown)
 * 6. Resilience Signals Separation (Observable Anycast/CDN vs Unobserved backend database/clustering)
 * 7. Calm Quiet State on Zero Regressions / Zero Active Findings
 * 8. Finding Lifecycle Reconciliation without stale warnings or fear-based alarms
 */
describe('H4: Architectural Impact & Posture Intelligence Engine', () => {
  let postureEngine: ArchitecturalPostureIntelligenceEngine;
  let missingHstsRule: MissingHstsRule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArchitecturalPostureIntelligenceEngine, MissingHstsRule],
    }).compile();

    postureEngine = module.get<ArchitecturalPostureIntelligenceEngine>(
      ArchitecturalPostureIntelligenceEngine,
    );
    missingHstsRule = module.get<MissingHstsRule>(MissingHstsRule);
  });

  const baseSnapshotN: DiscoverySnapshot = {
    domainName: 'app.example.com',
    domain: 'app.example.com',
    dns: {
      a: ['104.21.55.10', '172.67.180.20'],
      aaaa: ['2606:4700:3030::6815:370a'],
      cname: [],
      mx: [],
      ns: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
      txt: ['v=spf1 include:_spf.example.com ~all'],
      soa: null,
    },
    http: {
      url: 'https://app.example.com',
      finalUrl: 'https://app.example.com',
      protocol: 'https',
      httpVersion: '2',
      statusCode: 200,
      reachable: true,
      headers: {
        server: 'cloudflare',
        'strict-transport-security': 'max-age=31536000; includeSubDomains',
        'content-security-policy': "default-src 'self'",
        'x-frame-options': 'DENY',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
        connection: 'keep-alive',
      },
      finalResponse: {
        statusCode: 200,
        headers: {
          server: 'cloudflare',
          'strict-transport-security': 'max-age=31536000; includeSubDomains',
          'content-security-policy': "default-src 'self'",
          'x-frame-options': 'DENY',
          'x-content-type-options': 'nosniff',
          'referrer-policy': 'strict-origin-when-cross-origin',
          connection: 'keep-alive',
        },
        isHttps: true,
        url: 'https://app.example.com',
      },
      confidence: 'AUTHORITATIVE',
    },
    ssl: {
      authorized: true,
      protocol: 'TLSv1.3',
      valid: true,
      error: null,
      certificate: {
        validTo: '2027-01-01T00:00:00.000Z',
      },
    },
    technology: {
      technologies: [
        {
          id: 'tech-cloudflare',
          name: 'Cloudflare',
          category: 'CDN / Edge',
          layer: TopologyLayer.EDGE,
          role: 'Edge Delivery & Anycast CDN',
          confidence: 0.99,
          confidenceLevel: 'HIGH',
        },
        {
          id: 'tech-nginx',
          name: 'NGINX',
          category: 'Web / Server',
          layer: TopologyLayer.GATEWAY,
          role: 'Web Gateway & Ingress Proxy',
          confidence: 0.95,
          confidenceLevel: 'HIGH',
        },
        {
          id: 'tech-nodejs',
          name: 'Node.js',
          category: 'Runtime / Language',
          layer: TopologyLayer.RUNTIME,
          role: 'Server-Side Runtime',
          confidence: 0.9,
          confidenceLevel: 'HIGH',
        },
      ],
      architectureBrief: {
        summary:
          'Public ingress is distributed across Cloudflare edge CDN and NGINX gateway before reaching Node.js runtime.',
        architecturePath: [
          {
            hop: 0,
            layer: TopologyLayer.EDGE,
            technologyId: 'public-endpoint',
            technologyName: 'Public Endpoint',
            role: 'Entrypoint',
          },
          {
            hop: 1,
            layer: TopologyLayer.EDGE,
            technologyId: 'tech-cloudflare',
            technologyName: 'Cloudflare',
            role: 'Edge Delivery',
          },
          {
            hop: 2,
            layer: TopologyLayer.GATEWAY,
            technologyId: 'tech-nginx',
            technologyName: 'NGINX',
            role: 'Web Gateway',
          },
          {
            hop: 3,
            layer: TopologyLayer.RUNTIME,
            technologyId: 'tech-nodejs',
            technologyName: 'Node.js',
            role: 'Runtime',
          },
        ],
        layers: [
          {
            layer: TopologyLayer.EDGE,
            name: 'Edge',
            state: 'OBSERVED',
            confidenceLevel: 'HIGH',
            technologies: [],
            description: '',
          },
          {
            layer: TopologyLayer.GATEWAY,
            name: 'Gateway',
            state: 'OBSERVED',
            confidenceLevel: 'HIGH',
            technologies: [],
            description: '',
          },
          {
            layer: TopologyLayer.RUNTIME,
            name: 'Runtime',
            state: 'OBSERVED',
            confidenceLevel: 'HIGH',
            technologies: [],
            description: '',
          },
        ],
        keyTechnologies: [],
        integrations: [],
        evidence: [],
        confidence: {
          overallLevel: 'HIGH',
          overallScore: 0.95,
          layerConfidence: {} as any,
          rationale: 'Evidence confirmed',
          confirmedRelationshipsCount: 2,
          supportedRelationshipsCount: 1,
          inferredRelationshipsCount: 0,
        },
        knownUnknowns: [],
        claimBoundaries: [],
        generatedAt: '2026-08-29T10:00:00.000Z',
      },
    },
  } as any;

  describe('1. Security Posture Evaluation & Regression Detection', () => {
    it('evaluates fully hardened baseline as EXCELLENT with active controls', () => {
      const posture = postureEngine.evaluateSecurityPosture(baseSnapshotN, []);
      expect(posture.rating).toBe('EXCELLENT');
      expect(posture.tlsScore).toBe(100);
      expect(posture.headerScore).toBeGreaterThanOrEqual(90);
      expect(posture.protectionLayer).toBe('EDGE_PROTECTED');
      expect(posture.activeControls).toContain(
        'Modern TLS 1.3 encryption protocol',
      );
      expect(posture.activeControls).toContain(
        'Strict-Transport-Security (HSTS) transport enforcement',
      );
      expect(posture.securityGaps).toHaveLength(0);
    });

    it('detects security regression when HSTS header is removed and generates high-priority finding', async () => {
      // Snapshot N+1: HSTS removed
      const snapshotNPlus1: DiscoverySnapshot = {
        ...baseSnapshotN,
        http: {
          ...baseSnapshotN.http,
          headers: {
            ...baseSnapshotN.http.headers,
            'strict-transport-security': undefined,
          },
          finalResponse: {
            ...baseSnapshotN.http.finalResponse,
            headers: {
              ...baseSnapshotN.http.finalResponse.headers,
              'strict-transport-security': undefined,
            },
          },
        },
      };

      // 1. Finding rule evaluates missing HSTS
      const context: FindingContext = {
        domainId: 'dom-001',
        snapshotId: 'snp-002',
        snapshot: snapshotNPlus1,
      };
      const findings = await missingHstsRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('http.missing-hsts');
      expect(findings[0].severity).toBe(Severity.HIGH);

      // 2. Posture engine evaluates degraded posture
      const posture = postureEngine.evaluateSecurityPosture(
        snapshotNPlus1,
        findings,
      );
      expect(posture.rating).toBe('DEGRADED');
      expect(posture.securityGaps).toContain(
        'Strict-Transport-Security (HSTS) absent',
      );
      expect(posture.whyDegraded).toContain(
        'Strict-Transport-Security (HSTS) is absent',
      );

      // 3. Difference correlation
      const diff: TechnologyDifference = {
        classification: TechnologyChangeClassification.SECURITY_HEADER_REMOVED,
        impact: TechnologyChangeImpact.SECURITY,
        module: 'HTTP',
        category: 'SECURITY_HEADER',
        changeType: 'REMOVED',
        severity: 'HIGH',
        title: 'HSTS protection was removed',
        description:
          'Strict-Transport-Security header was removed in the current snapshot.',
        evidenceBefore: [
          'Strict-Transport-Security: max-age=31536000; includeSubDomains',
        ],
        evidenceAfter: [
          'Strict-Transport-Security header is absent on current authoritative HTTPS response',
        ],
      };

      const impactAssessments = postureEngine.correlateChangeImpact(
        baseSnapshotN,
        snapshotNPlus1,
        [diff],
      );
      expect(impactAssessments).toHaveLength(1);
      expect(impactAssessments[0].impactType).toBe('SECURITY_REGRESSION');
      expect(impactAssessments[0].title).toBe('HSTS protection was removed');
      expect(impactAssessments[0].whatItMeans).toContain(
        'User agents will no longer automatically enforce HTTPS',
      );

      // 4. "What Matters Now" Resolution
      const whatMatters = postureEngine.resolveWhatMattersNow(
        snapshotNPlus1,
        baseSnapshotN,
        findings,
        [diff],
      );
      expect(whatMatters.status).toBe('ATTENTION');
      expect(whatMatters.title).toBe('HSTS protection was removed');
      expect(whatMatters.subtitle).toBe(
        'Observed after the latest infrastructure change.',
      );
      expect(whatMatters.evidenceBefore).toContain('Strict-Transport-Security');
      expect(whatMatters.evidenceAfter).toContain('absent on current endpoint');
      expect(whatMatters.actionTarget).toBe('findings');
    });
  });

  describe('2. Security Posture Resolution & Reassuring State', () => {
    it('resolves HSTS regression to RESOLVED state when HSTS is restored in latest snapshot', async () => {
      // Snapshot N: Missing HSTS
      const snapshotN_missing: DiscoverySnapshot = {
        ...baseSnapshotN,
        http: {
          ...baseSnapshotN.http,
          headers: {
            ...baseSnapshotN.http.headers,
            'strict-transport-security': undefined,
          },
          finalResponse: {
            ...baseSnapshotN.http.finalResponse,
            headers: {
              ...baseSnapshotN.http.finalResponse.headers,
              'strict-transport-security': undefined,
            },
          },
        },
      };

      // Snapshot N+1: HSTS Restored
      const snapshotNPlus1_restored = baseSnapshotN;

      const diff: TechnologyDifference = {
        classification: TechnologyChangeClassification.SECURITY_HEADER_ADDED,
        impact: TechnologyChangeImpact.SECURITY,
        module: 'HTTP',
        category: 'SECURITY_HEADER',
        changeType: 'ADDED',
        severity: 'LOW',
        title: 'HSTS protection restored',
        description:
          'Strict-Transport-Security header is active on authoritative HTTPS endpoint.',
      };

      const context: FindingContext = {
        domainId: 'dom-001',
        snapshotId: 'snp-003',
        snapshot: snapshotNPlus1_restored,
      };
      const findings = await missingHstsRule.evaluate(context);
      expect(findings).toHaveLength(0); // 0 active findings

      const whatMatters = postureEngine.resolveWhatMattersNow(
        snapshotNPlus1_restored,
        snapshotN_missing,
        findings,
        [diff],
      );

      expect(whatMatters.status).toBe('RESOLVED');
      expect(whatMatters.title).toBe('HSTS protection restored');
      expect(whatMatters.subtitle).toBe(
        'Resolved in the latest verified snapshot.',
      );
      expect(whatMatters.actionTarget).toBe('changes');
    });
  });

  describe('3. Exposure Posture & Banner Disclosure', () => {
    it('classifies minimal server banner as LOW exposure and granular version as MODERATE exposure', () => {
      const minimalExposureSnapshot: DiscoverySnapshot = {
        ...baseSnapshotN,
        http: {
          ...baseSnapshotN.http,
          headers: { server: 'nginx' },
        },
      };

      const granularExposureSnapshot: DiscoverySnapshot = {
        ...baseSnapshotN,
        http: {
          ...baseSnapshotN.http,
          headers: { server: 'nginx/1.24.0' },
        },
      };

      const leakedHeadersSnapshot: DiscoverySnapshot = {
        ...baseSnapshotN,
        http: {
          ...baseSnapshotN.http,
          headers: {
            server: 'nginx/1.24.0',
            'x-backend-server': 'app-node-04.internal.prod',
            'x-origin-ip': '10.0.12.45',
          },
        },
      };

      const minResult = postureEngine.evaluateExposurePosture(
        minimalExposureSnapshot,
      );
      expect(minResult.level).toBe('LOW');
      expect(minResult.disclosedBanners).toContain('Server: nginx');

      const modResult = postureEngine.evaluateExposurePosture(
        granularExposureSnapshot,
      );
      expect(modResult.level).toBe('MODERATE');
      expect(modResult.disclosedBanners).toContain('Server: nginx/1.24.0');

      const elevatedResult = postureEngine.evaluateExposurePosture(
        leakedHeadersSnapshot,
      );
      expect(elevatedResult.level).toBe('ELEVATED');
      expect(elevatedResult.leakedHeaders).toContain(
        'x-backend-server: app-node-04.internal.prod',
      );
      expect(elevatedResult.leakedHeaders).toContain('x-origin-ip: 10.0.12.45');
    });
  });

  describe('4. Architecture Posture & Strict Anti-Overreach Invariants', () => {
    it('evaluates multi-tier topology and enforces strict anti-overreach guarantees', () => {
      const archPosture =
        postureEngine.evaluateArchitecturePosture(baseSnapshotN);

      expect(archPosture.rating).toBe('MODERN_MULTI_TIER');
      expect(archPosture.perimeterBoundary).toBe('PROTECTED');
      expect(archPosture.summary).toContain(
        'Public ingress is distributed across an edge provider and gateway boundary',
      );
      expect(archPosture.observedLayers).toContain(TopologyLayer.EDGE);
      expect(archPosture.observedLayers).toContain(TopologyLayer.GATEWAY);
      expect(archPosture.observedLayers).toContain(TopologyLayer.RUNTIME);

      // Invariant: NEVER claim High Availability or Redundancy without proof
      expect(archPosture.summary).not.toContain('highly available');
      expect(archPosture.summary).not.toContain('fault tolerant');
      expect(archPosture.antiOverreachStatement).toContain(
        'This observation does not establish origin high availability, container cluster redundancy, or database replication',
      );
    });

    it('evaluates direct application ingress as FLAT_DIRECT with EXPOSED perimeter', () => {
      const directSnapshot: DiscoverySnapshot = {
        ...baseSnapshotN,
        technology: {
          technologies: [
            {
              id: 'tech-express',
              name: 'Express',
              category: 'Application / Framework',
              layer: TopologyLayer.APPLICATION,
              role: 'Web Application Framework',
              confidence: 0.9,
              confidenceLevel: 'HIGH',
            },
          ],
          architectureBrief: {
            summary:
              'Public requests terminate directly at the Express application framework.',
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-express',
                technologyName: 'Express',
                role: 'App',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                name: 'Application',
                state: 'OBSERVED',
                confidenceLevel: 'HIGH',
                technologies: [],
                description: '',
              },
            ],
          },
        },
      } as any;

      const directPosture =
        postureEngine.evaluateArchitecturePosture(directSnapshot);
      expect(directPosture.rating).toBe('FLAT_DIRECT');
      expect(directPosture.perimeterBoundary).toBe('EXPOSED');
      expect(directPosture.summary).toContain(
        'reaches the application runtime directly without an intermediate reverse proxy',
      );
    });
  });

  describe('5. Significant Architectural Migration Correlated Impact', () => {
    it('separates Observed vs Interpretation vs Unknown on full stack migration', () => {
      const migrationDifferences: TechnologyDifference[] = [
        {
          classification: TechnologyChangeClassification.EDGE_LAYER_DRIFT,
          impact: TechnologyChangeImpact.ARCHITECTURAL,
          module: 'TECH' as any,
          category: 'EDGE' as any,
          changeType: 'CHANGED' as any,
          severity: 'MEDIUM',
          title: 'Edge delivery changed from Cloudflare to Fastly',
          description:
            'Observed edge CDN provider changed from Cloudflare to Fastly.',
          evidenceBefore: ['Server: cloudflare'],
          evidenceAfter: [
            'Server: Varnish',
            'x-fastly-request-id: fastly-req-001',
          ],
          whatThisMeans:
            'Public edge caching and anycast routing migrated to Fastly.',
          whatThisDoesNotProve:
            'This does not prove that backend origin servers have migrated to a different cloud provider.',
        },
        {
          classification: TechnologyChangeClassification.GATEWAY_MIGRATED,
          impact: TechnologyChangeImpact.ARCHITECTURAL,
          module: 'TECH' as any,
          category: 'GATEWAY' as any,
          changeType: 'CHANGED' as any,
          severity: 'MEDIUM',
          title: 'Gateway migrated from NGINX to Envoy',
          description:
            'Observed web gateway reverse proxy changed from NGINX to Envoy.',
          evidenceBefore: ['Server: nginx/1.24.0'],
          evidenceAfter: ['Server: envoy', 'x-envoy-upstream-service-time: 12'],
          whatThisMeans:
            'Publicly observable gateway boundary changed from NGINX to Envoy.',
          whatThisDoesNotProve:
            'This does not establish a Kubernetes migration, service-mesh deployment, or cloud-provider change.',
        },
        {
          classification: TechnologyChangeClassification.FRAMEWORK_MIGRATED,
          impact: TechnologyChangeImpact.ARCHITECTURAL,
          module: 'TECH' as any,
          category: 'RUNTIME' as any,
          changeType: 'CHANGED' as any,
          severity: 'LOW',
          title: 'Runtime migrated from Node.js to Go',
          description:
            'Observed application runtime shifted from Node.js to Go.',
          evidenceBefore: ['X-Powered-By: Express'],
          evidenceAfter: ['Signature: Go HTTP Server'],
          whatThisMeans: 'Application runtime migrated from Node.js to Go.',
          whatThisDoesNotProve:
            'This does not establish an origin cloud provider migration or container orchestrator change.',
        },
      ];

      const impactAssessments = postureEngine.correlateChangeImpact(
        baseSnapshotN,
        baseSnapshotN,
        migrationDifferences,
      );

      expect(impactAssessments).toHaveLength(3);
      for (const assessment of impactAssessments) {
        expect(assessment.impactType).toBe('ARCHITECTURAL_EVOLUTION');
        expect(assessment.significance).toBe('MEDIUM');
        expect(assessment.whatWeCannotConclude).toBeDefined();
        expect(assessment.whatWeCannotConclude.length).toBeGreaterThan(10);
      }

      const whatMatters = postureEngine.resolveWhatMattersNow(
        baseSnapshotN,
        baseSnapshotN,
        [],
        migrationDifferences,
      );

      expect(whatMatters.status).toBe('CHANGED');
      expect(whatMatters.title).toBe(
        'Edge delivery changed from Cloudflare to Fastly',
      );
      expect(whatMatters.actionTarget).toBe('changes');
    });
  });

  describe('6. Observable Resilience Signals Separation', () => {
    it('extracts observable resilience markers while explicitly documenting unobserved dimensions', () => {
      const resilience = postureEngine.evaluateResilienceSignals(baseSnapshotN);

      expect(resilience.hasAnycastRouting).toBe(true);
      expect(resilience.hasEdgeCdn).toBe(true);
      expect(resilience.hasHttp2Or3).toBe(true);
      expect(resilience.hasKeepAlive).toBe(true);

      expect(resilience.observableSignals).toContain(
        'Edge CDN Global Anycast Ingress',
      );
      expect(resilience.observableSignals).toContain(
        'Multi-IP Ingress (2 IPv4 addresses observed)',
      );
      expect(resilience.observableSignals).toContain(
        'HTTP/2 or HTTP/3 Multiplexed Protocol Support',
      );

      // Crucial: Must explicitly state unobserved dimensions
      expect(resilience.unobservedDimensions).toContain(
        'Origin Server Instance Count & Cluster Topology',
      );
      expect(resilience.unobservedDimensions).toContain(
        'Database Replication & Failover State',
      );
      expect(resilience.unobservedDimensions).toContain(
        'Container Orchestration Autoscaling Parameters',
      );
    });
  });

  describe('7. Calm Quiet State on Zero Regressions / Zero Active Findings', () => {
    it('returns STABLE state with reassuring narrative when infrastructure is healthy', () => {
      const whatMatters = postureEngine.resolveWhatMattersNow(
        baseSnapshotN,
        baseSnapshotN,
        [],
        [],
      );

      expect(whatMatters.status).toBe('STABLE');
      expect(whatMatters.title).toBe('Architecture Stable');
      expect(whatMatters.subtitle).toBe(
        'No active infrastructure issues require attention.',
      );
      expect(whatMatters.reason).toContain('remain verified and consistent');
    });
  });

  describe('8. Comprehensive Posture Report Synthesis', () => {
    it('synthesizes unified architectural posture report deterministically', () => {
      const report = postureEngine.generatePostureReport(
        baseSnapshotN,
        null,
        [],
        [],
      );

      expect(report.securityPosture.rating).toBe('EXCELLENT');
      expect(report.architecturePosture.rating).toBe('MODERN_MULTI_TIER');
      expect(report.exposurePosture.level).toBe('LOW');
      expect(report.resilienceSignals.hasEdgeCdn).toBe(true);
      expect(report.whatMattersNow.status).toBe('STABLE');
      expect(report.evaluatedAt).toBeDefined();
    });
  });
});
