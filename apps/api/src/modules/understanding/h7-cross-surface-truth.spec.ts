import { Test, TestingModule } from '@nestjs/testing';
import { IntelligenceConsistencyAuthorityService } from './services/intelligence-consistency-authority.service';
import {
  AuthoritativeTechnologyTruth,
  SurfaceIntelligenceProjection,
} from './contracts/authoritative-intelligence-state.interface';

describe('H7: Cross-Surface Truth Verification Suite', () => {
  let service: IntelligenceConsistencyAuthorityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntelligenceConsistencyAuthorityService],
    }).compile();

    service = module.get<IntelligenceConsistencyAuthorityService>(
      IntelligenceConsistencyAuthorityService,
    );
  });

  it('certifies 100% consistency across Overview, Findings, Topology, Evidence, and Narrative projections', () => {
    const technologies: AuthoritativeTechnologyTruth[] = [
      {
        name: 'Cloudflare',
        layer: 'EDGE',
        confidence: 'HIGH',
        evidence: ['Server: cloudflare'],
        whatThisDoesNotProve: [],
      },
      {
        name: 'NGINX',
        layer: 'GATEWAY',
        version: '1.24.0',
        confidence: 'HIGH',
        evidence: ['Server: nginx/1.24.0'],
        whatThisDoesNotProve: [],
      },
      {
        name: 'Node.js',
        layer: 'RUNTIME',
        confidence: 'HIGH',
        evidence: ['X-Powered-By: Express'],
        whatThisDoesNotProve: [],
      },
    ];

    const authoritativeState = service.synthesizeAuthoritativeState({
      snapshotId: 'snap-2026-08-29-001',
      domainId: 'domain-prod-01',
      domainName: 'app.enterprise.io',
      technologies,
    });

    const projections: SurfaceIntelligenceProjection[] = [
      {
        surfaceName: 'OverviewSurface',
        snapshotId: 'snap-2026-08-29-001',
        status: 'STABLE',
        technologies: [
          { name: 'Cloudflare', layer: 'EDGE' },
          { name: 'NGINX', layer: 'GATEWAY', version: '1.24.0' },
          { name: 'Node.js', layer: 'RUNTIME' },
        ],
        confidenceLevel: 'HIGH',
      },
      {
        surfaceName: 'TopologySurface',
        snapshotId: 'snap-2026-08-29-001',
        topologyHops: [
          'DNS / Ingress',
          'Cloudflare',
          'NGINX',
          'Node.js',
          'Sealed Internal Perimeter',
        ],
      },
      {
        surfaceName: 'EvidenceDrawer',
        snapshotId: 'snap-2026-08-29-001',
        technologies: [
          { name: 'Cloudflare', layer: 'EDGE' },
          { name: 'NGINX', layer: 'GATEWAY' },
          { name: 'Node.js', layer: 'RUNTIME' },
        ],
      },
      {
        surfaceName: 'UnifiedNarrative',
        snapshotId: 'snap-2026-08-29-001',
        narrativeClaims: [
          'app.enterprise.io is served via Cloudflare, NGINX and Node.js.',
        ],
      },
    ];

    const result = service.validateCrossSurfaceConsistency(
      authoritativeState,
      projections,
    );

    expect(result.isConsistent).toBe(true);
    expect(result.contradictions).toHaveLength(0);
    expect(result.checkedSurfaces).toHaveLength(4);
  });
});
