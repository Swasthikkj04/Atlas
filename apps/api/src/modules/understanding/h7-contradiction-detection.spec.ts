import { Test, TestingModule } from '@nestjs/testing';
import { IntelligenceConsistencyAuthorityService } from './services/intelligence-consistency-authority.service';
import {
  AuthoritativeTechnologyTruth,
  AuthoritativeFindingTruth,
  SurfaceIntelligenceProjection,
} from './contracts/authoritative-intelligence-state.interface';

describe('H7: Automated Cross-Surface Contradiction Detection Suite', () => {
  let service: IntelligenceConsistencyAuthorityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntelligenceConsistencyAuthorityService],
    }).compile();

    service = module.get<IntelligenceConsistencyAuthorityService>(
      IntelligenceConsistencyAuthorityService,
    );
  });

  const baseTechnologies: AuthoritativeTechnologyTruth[] = [
    {
      name: 'NGINX',
      layer: 'GATEWAY',
      version: '1.24.0',
      confidence: 'HIGH',
      evidence: ['Server: nginx/1.24.0'],
      whatThisDoesNotProve: [],
    },
  ];

  it('detects and flags Stale Snapshot ID contradiction across surfaces', () => {
    const authState = service.synthesizeAuthoritativeState({
      snapshotId: 'snap-current-002',
      domainId: 'domain-01',
      domainName: 'test.io',
      technologies: baseTechnologies,
    });

    const staleProjection: SurfaceIntelligenceProjection = {
      surfaceName: 'StaleFindingsView',
      snapshotId: 'snap-stale-001', // MISMATCH
    };

    const result = service.validateCrossSurfaceConsistency(authState, [
      staleProjection,
    ]);
    expect(result.isConsistent).toBe(false);
    expect(
      result.contradictions.some((c) => c.message.includes('stale snapshot')),
    ).toBe(true);
  });

  it('detects and flags Finding Lifecycle vs What Matters Now status contradiction', () => {
    const activeFindings: AuthoritativeFindingTruth[] = [
      {
        id: 'finding-crit-01',
        code: 'CRITICAL_VULNERABILITY',
        title: 'Critical Vulnerability',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        isCompliant: false,
        snapshotId: 'snap-001',
        evidence: [],
      },
    ];

    const authState = service.synthesizeAuthoritativeState({
      snapshotId: 'snap-001',
      domainId: 'domain-01',
      domainName: 'test.io',
      technologies: baseTechnologies,
      activeFindings,
    });

    // Overview claims STABLE while active critical finding exists
    const contradictoryOverview: SurfaceIntelligenceProjection = {
      surfaceName: 'OverviewSurface',
      snapshotId: 'snap-001',
      status: 'STABLE', // CONTRADICTION
    };

    const result = service.validateCrossSurfaceConsistency(authState, [
      contradictoryOverview,
    ]);
    expect(result.isConsistent).toBe(false);
    expect(
      result.contradictions.some((c) => c.dimension === 'FINDING_LIFECYCLE'),
    ).toBe(true);
  });

  it('detects and flags Technology substitution contradiction (NGINX -> Apache)', () => {
    const authState = service.synthesizeAuthoritativeState({
      snapshotId: 'snap-001',
      domainId: 'domain-01',
      domainName: 'test.io',
      technologies: baseTechnologies, // NGINX
    });

    const rogueNarrative: SurfaceIntelligenceProjection = {
      surfaceName: 'NarrativeSurface',
      snapshotId: 'snap-001',
      technologies: [{ name: 'Apache HTTP Server', layer: 'GATEWAY' }], // INVENTED
    };

    const result = service.validateCrossSurfaceConsistency(authState, [
      rogueNarrative,
    ]);
    expect(result.isConsistent).toBe(false);
    expect(
      result.contradictions.some((c) => c.dimension === 'TECHNOLOGY_TRUTH'),
    ).toBe(true);
  });

  it('detects and flags Technology Layer mutation contradiction (GATEWAY -> EDGE)', () => {
    const authState = service.synthesizeAuthoritativeState({
      snapshotId: 'snap-001',
      domainId: 'domain-01',
      domainName: 'test.io',
      technologies: baseTechnologies, // NGINX at GATEWAY
    });

    const rogueOverview: SurfaceIntelligenceProjection = {
      surfaceName: 'OverviewSurface',
      snapshotId: 'snap-001',
      technologies: [{ name: 'NGINX', layer: 'EDGE' }], // MUTATED LAYER
    };

    const result = service.validateCrossSurfaceConsistency(authState, [
      rogueOverview,
    ]);
    expect(result.isConsistent).toBe(false);
    expect(
      result.contradictions.some((c) => c.dimension === 'TECHNOLOGY_TRUTH'),
    ).toBe(true);
  });

  it('detects and flags Topology Drift (injecting unobserved Envoy hop)', () => {
    const authState = service.synthesizeAuthoritativeState({
      snapshotId: 'snap-001',
      domainId: 'domain-01',
      domainName: 'test.io',
      technologies: baseTechnologies,
    });

    const driftingTopology: SurfaceIntelligenceProjection = {
      surfaceName: 'TopologySurface',
      snapshotId: 'snap-001',
      topologyHops: [
        'DNS / Ingress',
        'NGINX',
        'Envoy (Inferred)',
        'Sealed Internal Perimeter',
      ], // ENVOY INVENTED
    };

    const result = service.validateCrossSurfaceConsistency(authState, [
      driftingTopology,
    ]);
    expect(result.isConsistent).toBe(false);
    expect(
      result.contradictions.some((c) => c.dimension === 'TOPOLOGY_DRIFT'),
    ).toBe(true);
  });

  it('detects and flags Confidence Inflation (LOW -> HIGH)', () => {
    const authState = service.synthesizeAuthoritativeState({
      snapshotId: 'snap-001',
      domainId: 'domain-01',
      domainName: 'test.io',
      technologies: [
        {
          name: 'NGINX',
          layer: 'GATEWAY',
          confidence: 'LOW',
          evidence: ['Ambiguous error header'],
          whatThisDoesNotProve: [],
        },
      ],
      confidence: {
        overall: 'LOW',
        score: 0.3,
        rationale: 'Faint behavioral signal',
      },
    });

    const inflatedOverview: SurfaceIntelligenceProjection = {
      surfaceName: 'ExecutiveBrief',
      snapshotId: 'snap-001',
      confidenceLevel: 'HIGH', // INFLATED
    };

    const result = service.validateCrossSurfaceConsistency(authState, [
      inflatedOverview,
    ]);
    expect(result.isConsistent).toBe(false);
    expect(
      result.contradictions.some((c) => c.dimension === 'CONFIDENCE_MISMATCH'),
    ).toBe(true);
  });

  it('detects and flags Known Unknown Speculation (e.g. guessing PostgreSQL)', () => {
    const authState = service.synthesizeAuthoritativeState({
      snapshotId: 'snap-001',
      domainId: 'domain-01',
      domainName: 'test.io',
      technologies: baseTechnologies,
    });

    const speculativeNarrative: SurfaceIntelligenceProjection = {
      surfaceName: 'NarrativeSurface',
      snapshotId: 'snap-001',
      knownUnknowns: ['PostgreSQL database is likely behind the NGINX proxy'], // SPECULATION
    };

    const result = service.validateCrossSurfaceConsistency(authState, [
      speculativeNarrative,
    ]);
    expect(result.isConsistent).toBe(false);
    expect(
      result.contradictions.some((c) => c.dimension === 'KNOWN_UNKNOWNS'),
    ).toBe(true);
  });
});
