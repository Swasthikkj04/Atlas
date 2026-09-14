import { SnapshotCanonicalizerService } from './snapshot-canonicalizer.service';
import { SnapshotFingerprintService } from './snapshot-fingerprint.service';
import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import {
  TechnologyCategory,
  TopologyLayer,
  TechnologyRelationshipType,
} from '../../../infrastructure/discovery/technology/contracts';

describe('SnapshotFingerprintService (TECH-005)', () => {
  let canonicalizer: SnapshotCanonicalizerService;
  let fingerprintService: SnapshotFingerprintService;

  beforeEach(() => {
    canonicalizer = new SnapshotCanonicalizerService();
    fingerprintService = new SnapshotFingerprintService(canonicalizer);
  });

  const createMockSnapshot = (opts?: {
    customTechOrder?: boolean;
    differentConfidence?: boolean;
    extraIntegration?: boolean;
  }): DiscoverySnapshot => {
    const techA = {
      id: 'tech-cloudflare',
      name: 'Cloudflare',
      category: TechnologyCategory.CDN_EDGE,
      status: 'DETECTED' as any,
      confidence: opts?.differentConfidence ? 0.85 : 0.99,
      confidenceLevel: 'HIGH' as any,
      whyDetected: 'Observed cf-ray',
      role: 'Edge CDN',
      infrastructureMeaning: 'Edge proxy',
      evidence: [],
      signals: [],
      evidenceCount: 1,
    };

    const techB = {
      id: 'tech-nextjs',
      name: 'Next.js',
      category: TechnologyCategory.FRAMEWORK,
      status: 'DETECTED' as any,
      confidence: 0.95,
      confidenceLevel: 'HIGH' as any,
      whyDetected: 'Observed Next.js headers',
      role: 'Application Framework',
      infrastructureMeaning: 'Next.js application',
      evidence: [],
      signals: [],
      evidenceCount: 1,
    };

    const techC = {
      id: 'tech-sentry',
      name: 'Sentry',
      category: TechnologyCategory.ANALYTICS,
      status: 'DETECTED' as any,
      confidence: 0.92,
      confidenceLevel: 'HIGH' as any,
      whyDetected: 'Observed sentry trace',
      role: 'Error Monitoring',
      infrastructureMeaning: 'Sentry APM',
      evidence: [],
      signals: [],
      evidenceCount: 1,
    };

    const technologies = opts?.customTechOrder
      ? [techB, techA]
      : opts?.extraIntegration
        ? [techA, techB, techC]
        : [techA, techB];

    const topology = {
      nodes: technologies.map((t) => ({
        id: t.id,
        technologyId: t.id,
        name: t.name,
        category: t.category,
        layer: t.id.includes('cloudflare')
          ? TopologyLayer.EDGE
          : t.id.includes('sentry')
            ? TopologyLayer.INTEGRATION
            : TopologyLayer.APPLICATION,
        role: t.role,
        infrastructureMeaning: t.infrastructureMeaning,
        whyDetected: t.whyDetected,
        confidence: t.confidence,
        confidenceLevel: t.confidenceLevel,
        evidenceCount: 1,
      })),
      relationships: [
        {
          id: 'rel-cf-next',
          sourceTechnologyId: 'tech-cloudflare',
          sourceTechnologyName: 'Cloudflare',
          targetTechnologyId: 'tech-nextjs',
          targetTechnologyName: 'Next.js',
          relationshipType: TechnologyRelationshipType.FORWARDS_TO,
          evidenceState: 'SUPPORTED' as any,
          confidence: 0.95,
          confidenceLevel: 'HIGH' as any,
          explanation: 'Edge forwards to app',
          evidence: [],
        },
      ],
      layers: {} as any,
      summary: 'Topology summary',
      totalNodes: technologies.length,
      totalRelationships: 1,
      confirmedRelationshipsCount: 0,
      supportedRelationshipsCount: 1,
      inferredRelationshipsCount: 0,
      generatedAt: new Date().toISOString(),
    };

    const architectureBrief = {
      summary: 'Architecture brief summary',
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
        {
          hop: 2,
          layer: TopologyLayer.APPLICATION,
          technologyId: 'tech-nextjs',
          technologyName: 'Next.js',
          role: 'App Framework',
        },
      ],
      layers: [],
      keyTechnologies: [],
      integrations: opts?.extraIntegration
        ? [
            {
              technologyId: 'tech-sentry',
              name: 'Sentry',
              category: 'Analytics',
              layer: TopologyLayer.INTEGRATION,
              role: 'APM',
              infrastructureMeaning: 'Meaning',
              whyDetected: 'Why',
              confidence: 0.92,
              confidenceLevel: 'HIGH' as any,
              evidence: [],
            },
          ]
        : [],
      evidence: [],
      confidence: {
        overallLevel: 'HIGH' as any,
        overallScore: 0.95,
        layerConfidence: {} as any,
        rationale: 'Rationale',
        confirmedRelationshipsCount: 0,
        supportedRelationshipsCount: 1,
        inferredRelationshipsCount: 0,
      },
      knownUnknowns: [
        {
          dimension: 'Origin Cloud Provider',
          status: 'MASKED' as any,
          explanation: 'Origin masked by Cloudflare',
          whyUnknown: 'Anycast edge proxy',
        },
      ],
      claimBoundaries: [],
      generatedAt: new Date().toISOString(),
    };

    return {
      dns: {
        a: ['104.21.5.5'],
        ns: ['ns1.cloudflare.com'],
        aaaa: [],
        mx: [],
        txt: [],
        cname: [],
        dmarc: [],
      },
      http: {
        reachable: true,
        url: 'https://test.com',
        finalUrl: 'https://test.com',
        protocol: 'https',
        statusCode: 200,
        responseTimeMs: 30,
        headers: {
          server: 'cloudflare',
          'x-powered-by': 'Next.js',
        },
        redirects: [],
        redirectHops: [],
        redirectCount: 0,
        finalResponse: null,
        queryStatus: 'SUCCESS',
        confidence: 'AUTHORITATIVE',
        error: null,
      },
      technology: {
        technologies,
        topology,
        architectureBrief,
      },
    };
  };

  it('generates identical deterministic hashes regardless of technology array order', () => {
    const snapshot1 = createMockSnapshot({ customTechOrder: false });
    const snapshot2 = createMockSnapshot({ customTechOrder: true });

    const fp1 = fingerprintService.computeFingerprints(snapshot1);
    const fp2 = fingerprintService.computeFingerprints(snapshot2);

    expect(fp1.technologyFingerprint).toBe(fp2.technologyFingerprint);
    expect(fp1.topologyFingerprint).toBe(fp2.topologyFingerprint);
    expect(fp1.architectureFingerprint).toBe(fp2.architectureFingerprint);
    expect(fp1.overallFingerprint).toBe(fp2.overallFingerprint);
  });

  it('detects changes in technology and architecture fingerprints when an integration is added', () => {
    const baselineSnapshot = createMockSnapshot({ extraIntegration: false });
    const updatedSnapshot = createMockSnapshot({ extraIntegration: true });

    const baselineFp = fingerprintService.computeFingerprints(baselineSnapshot);
    const updatedFp = fingerprintService.computeFingerprints(updatedSnapshot);

    expect(baselineFp.technologyFingerprint).not.toBe(
      updatedFp.technologyFingerprint,
    );
    expect(baselineFp.architectureFingerprint).not.toBe(
      updatedFp.architectureFingerprint,
    );
    expect(baselineFp.overallFingerprint).not.toBe(
      updatedFp.overallFingerprint,
    );
  });

  it('produces valid 64-character SHA-256 hexadecimal strings', () => {
    const snapshot = createMockSnapshot();
    const fp = fingerprintService.computeFingerprints(snapshot);

    expect(fp.technologyFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(fp.topologyFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(fp.architectureFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(fp.evidenceFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(fp.overallFingerprint).toMatch(/^[a-f0-9]{64}$/);
  });
});
