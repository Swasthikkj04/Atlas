import { Test, TestingModule } from '@nestjs/testing';
import { IntelligenceConsistencyAuthorityService } from './services/intelligence-consistency-authority.service';
import {
  AuthoritativeTechnologyTruth,
  AuthoritativeFindingTruth,
} from './contracts/authoritative-intelligence-state.interface';

describe('H7: Intelligence Consistency & Cross-Surface Truth Backend Authority', () => {
  let service: IntelligenceConsistencyAuthorityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntelligenceConsistencyAuthorityService],
    }).compile();

    service = module.get<IntelligenceConsistencyAuthorityService>(
      IntelligenceConsistencyAuthorityService,
    );
  });

  describe('H7-001: Authoritative Intelligence State Synthesis', () => {
    it('synthesizes a multi-tier infrastructure state with strict evidence grounding', () => {
      const technologies: AuthoritativeTechnologyTruth[] = [
        {
          name: 'Cloudflare',
          layer: 'EDGE',
          confidence: 'HIGH',
          evidence: ['Server: cloudflare', 'CF-RAY: 8530abc-SJC'],
          whatThisDoesNotProve: [
            'Origin web server identity',
            'Internal routing',
          ],
        },
        {
          name: 'NGINX',
          layer: 'GATEWAY',
          version: '1.24.0',
          confidence: 'HIGH',
          evidence: ['Server: nginx/1.24.0'],
          whatThisDoesNotProve: ['Application runtime framework'],
        },
        {
          name: 'Node.js',
          layer: 'RUNTIME',
          confidence: 'HIGH',
          evidence: ['X-Powered-By: Express', 'Behavioral: Chunked-Node'],
          whatThisDoesNotProve: ['Database engine', 'Host operating system'],
        },
      ];

      const authoritativeState = service.synthesizeAuthoritativeState({
        snapshotId: 'snap-2026-08-29-001',
        domainId: 'domain-prod-01',
        domainName: 'app.production.io',
        technologies,
      });

      expect(authoritativeState.snapshotId).toBe('snap-2026-08-29-001');
      expect(authoritativeState.domainName).toBe('app.production.io');
      expect(authoritativeState.technologies).toHaveLength(3);
      expect(authoritativeState.status).toBe('STABLE');
      expect(authoritativeState.whatMattersNow.status).toBe('STABLE');
      expect(authoritativeState.ingressPath).toHaveLength(5); // DNS + 3 Techs + Sealed
      expect(authoritativeState.knownUnknowns).toHaveLength(3);
      expect(
        authoritativeState.knownUnknowns.map((k) => k.dimension),
      ).toContain('Database Tier');
      expect(authoritativeState.confidence.overall).toBe('HIGH');
    });
  });

  describe('H7-002: WX-211 Finding Lifecycle Consistency', () => {
    it('forces What Matters Now to ATTENTION and posture to DEGRADED when active critical findings exist', () => {
      const activeFindings: AuthoritativeFindingTruth[] = [
        {
          id: 'finding-hsts',
          code: 'HSTS_MISSING',
          title: 'Strict-Transport-Security Header Missing',
          severity: 'HIGH',
          status: 'ACTIVE',
          isCompliant: false,
          snapshotId: 'snap-001',
          evidence: ['Response header Strict-Transport-Security absent'],
        },
      ];

      const authoritativeState = service.synthesizeAuthoritativeState({
        snapshotId: 'snap-001',
        domainId: 'domain-01',
        domainName: 'insecure.production.io',
        technologies: [
          {
            name: 'NGINX',
            layer: 'GATEWAY',
            confidence: 'HIGH',
            evidence: ['Server: nginx'],
            whatThisDoesNotProve: [],
          },
        ],
        activeFindings,
      });

      expect(authoritativeState.status).toBe('ATTENTION');
      expect(authoritativeState.whatMattersNow.status).toBe('ATTENTION');
      expect(authoritativeState.posture.securityRating).toBe('DEGRADED');
      expect(authoritativeState.posture.securityGaps).toContain(
        'Missing HSTS Header',
      );
    });

    it('rejects contradictory state where an active finding is marked compliant', () => {
      const corruptActiveFinding: AuthoritativeFindingTruth = {
        id: 'finding-bad',
        code: 'HSTS_MISSING',
        title: 'Contradictory Active Finding',
        severity: 'HIGH',
        status: 'ACTIVE',
        isCompliant: true, // FORBIDDEN INVARIANT
        snapshotId: 'snap-001',
        evidence: [],
      };

      expect(() => {
        service.synthesizeAuthoritativeState({
          snapshotId: 'snap-001',
          domainId: 'domain-01',
          domainName: 'bad.io',
          technologies: [],
          activeFindings: [corruptActiveFinding],
        });
      }).toThrow(/cannot be compliant/i);
    });

    it('recalculates to STABLE and GOOD posture when finding is resolved', () => {
      const resolvedFindings: AuthoritativeFindingTruth[] = [
        {
          id: 'finding-hsts',
          code: 'HSTS_MISSING',
          title: 'Strict-Transport-Security Header Missing',
          severity: 'HIGH',
          status: 'RESOLVED',
          isCompliant: true,
          snapshotId: 'snap-001',
          resolvingSnapshotId: 'snap-002',
          evidence: [
            'Strict-Transport-Security: max-age=31536000; includeSubDomains',
          ],
        },
      ];

      const authoritativeState = service.synthesizeAuthoritativeState({
        snapshotId: 'snap-002',
        domainId: 'domain-01',
        domainName: 'remediated.production.io',
        technologies: [
          {
            name: 'NGINX',
            layer: 'GATEWAY',
            confidence: 'HIGH',
            evidence: ['Server: nginx'],
            whatThisDoesNotProve: [],
          },
        ],
        activeFindings: [],
        resolvedFindings,
      });

      expect(authoritativeState.status).toBe('STABLE');
      expect(authoritativeState.whatMattersNow.status).toBe('STABLE');
      expect(authoritativeState.posture.securityRating).toBe('GOOD');
      expect(authoritativeState.posture.securityGaps).toHaveLength(0);
    });
  });

  describe('H7-006: Known Unknown Perimeter Sealing', () => {
    it('explicitly seals internal database, host OS, and orchestrator boundaries', () => {
      const authoritativeState = service.synthesizeAuthoritativeState({
        snapshotId: 'snap-001',
        domainId: 'domain-01',
        domainName: 'sealed.io',
        technologies: [
          {
            name: 'Cloudflare',
            layer: 'EDGE',
            confidence: 'HIGH',
            evidence: ['Server: cloudflare'],
            whatThisDoesNotProve: ['Internal databases'],
          },
        ],
      });

      for (const knownUnknown of authoritativeState.knownUnknowns) {
        expect(knownUnknown.status).toBe('UNOBSERVED');
        expect(knownUnknown.explanation.length).toBeGreaterThan(10);
      }
    });
  });
});
