import { Test, TestingModule } from '@nestjs/testing';
import { IntelligenceIntegrityGateService } from './services/intelligence-integrity-gate.service';
import { IntelligenceConsistencyAuthorityService } from './services/intelligence-consistency-authority.service';

describe('H8 — Adversarial Truth Scenarios & Current vs Historical Separation', () => {
  let integrityService: IntelligenceIntegrityGateService;
  let consistencyService: IntelligenceConsistencyAuthorityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntelligenceIntegrityGateService,
        IntelligenceConsistencyAuthorityService,
      ],
    }).compile();

    integrityService = module.get<IntelligenceIntegrityGateService>(
      IntelligenceIntegrityGateService,
    );
    consistencyService = module.get<IntelligenceConsistencyAuthorityService>(
      IntelligenceConsistencyAuthorityService,
    );
  });

  describe('H8-006: 8 Canonical Adversarial Scenarios', () => {
    it('should execute and pass all 8 adversarial truth scenarios', () => {
      const results = integrityService.runAdversarialScenarios();
      expect(results).toHaveLength(8);
      for (const res of results) {
        expect(res.passed).toBe(true);
        expect(res.observedBehavior).toBeDefined();
      }
    });

    it('Scenario 1: Finding disappears / is resolved (CSP Problem Prevention)', () => {
      // Snapshot N: Missing CSP
      // Snapshot N+1: CSP added -> Finding resolved
      const currentState = consistencyService.synthesizeAuthoritativeState({
        snapshotId: 'snap-n-plus-1',
        domainId: 'dom-csp-test',
        domainName: 'csp-fixed.io',
        technologies: [
          {
            id: 'tech-cloudflare',
            name: 'Cloudflare',
            layer: 'EDGE',
            confidence: 'HIGH',
            evidence: ['server: cloudflare'],
          },
        ],
        activeFindings: [], // Finding resolved!
        resolvedFindings: [
          {
            id: 'finding-csp-missing',
            title: 'Missing Content-Security-Policy Header',
            description: 'CSP header not set.',
            severity: 'MEDIUM',
            category: 'SECURITY',
            isCompliant: true,
            resolvingSnapshotId: 'snap-n-plus-1',
          },
        ],
      });

      expect(currentState.status).toBe('STABLE');
      expect(currentState.activeFindings).toHaveLength(0);
      expect(currentState.resolvedFindings).toHaveLength(1);
      expect(currentState.resolvedFindings[0].isCompliant).toBe(true);

      const audit = integrityService.auditCurrentVsHistoricalSeparation(
        currentState,
        {
          resolvedFindings: currentState.resolvedFindings,
        },
      );
      expect(audit.isSeparated).toBe(true);
      expect(audit.leakedHistoricalFindings).toHaveLength(0);
    });

    it('Scenario 2: Technology disappears (NGINX -> Envoy migration with no ghost badge)', () => {
      const currentState = consistencyService.synthesizeAuthoritativeState({
        snapshotId: 'snap-envoy',
        domainId: 'dom-migration',
        domainName: 'migrated.io',
        technologies: [
          {
            id: 'tech-envoy',
            name: 'Envoy',
            layer: 'GATEWAY',
            confidence: 'HIGH',
            evidence: ['server: envoy'],
          },
        ],
        ingressHops: [
          {
            id: 'hop-envoy',
            layer: 'GATEWAY',
            title: 'Envoy Gateway',
            technologyName: 'Envoy',
            status: 'OBSERVED',
            order: 1,
          },
        ],
        changeEvents: [
          {
            id: 'change-1',
            category: 'TECHNOLOGY',
            title: 'Gateway Migration: NGINX replaced by Envoy',
            whatChanged: 'Replaced NGINX with Envoy proxy.',
            timestamp: new Date().toISOString(),
          },
        ],
      });

      expect(currentState.technologies.some((t) => t.name === 'NGINX')).toBe(
        false,
      );
      expect(
        currentState.ingressPath.some((h) => h.technologyName === 'NGINX'),
      ).toBe(false);

      const audit = integrityService.auditCurrentVsHistoricalSeparation(
        currentState,
        {
          previousTechnologies: ['NGINX'],
        },
      );
      expect(audit.isSeparated).toBe(true);
      expect(audit.ghostBadgesDetected).toHaveLength(0);
    });

    it('Scenario 3: Partial evidence preserves unobserved gateway without speculation', () => {
      const currentState = consistencyService.synthesizeAuthoritativeState({
        snapshotId: 'snap-direct',
        domainId: 'dom-direct',
        domainName: 'direct-edge-runtime.io',
        technologies: [
          {
            id: 'tech-cf',
            name: 'Cloudflare',
            layer: 'EDGE',
            confidence: 'HIGH',
            evidence: ['server: cloudflare'],
          },
          {
            id: 'tech-node',
            name: 'Node.js',
            layer: 'RUNTIME',
            confidence: 'HIGH',
            evidence: ['x-powered-by: Express'],
          },
        ],
        ingressHops: [
          {
            id: 'hop-cf',
            layer: 'EDGE',
            title: 'Cloudflare Edge CDN',
            technologyName: 'Cloudflare',
            status: 'OBSERVED',
            order: 1,
          },
          {
            id: 'hop-node',
            layer: 'RUNTIME',
            title: 'Node.js App Server',
            technologyName: 'Node.js',
            status: 'OBSERVED',
            order: 2,
          },
        ],
      });

      // Confirm no gateway hop was fabricated
      expect(currentState.ingressPath.some((h) => h.layer === 'GATEWAY')).toBe(
        false,
      );
      expect(
        currentState.technologies.some(
          (t) => t.name === 'NGINX' || t.name === 'Traefik',
        ),
      ).toBe(false);
      const observedTechHops = currentState.ingressPath.filter(
        (h) => h.technologyName,
      );
      expect(observedTechHops).toHaveLength(2);
    });

    it('Scenario 4: Sealed backend tier remains strictly UNOBSERVED', () => {
      const currentState = consistencyService.synthesizeAuthoritativeState({
        snapshotId: 'snap-sealed',
        domainId: 'dom-sealed',
        domainName: 'sealed-db.io',
        technologies: [
          {
            id: 'tech-node',
            name: 'Node.js',
            layer: 'RUNTIME',
            confidence: 'HIGH',
            evidence: ['x-powered-by: Express'],
          },
        ],
        knownUnknowns: [
          {
            dimension: 'Database Tier',
            status: 'UNOBSERVED',
            reason: 'Internal network sealed',
          },
          {
            dimension: 'Host Operating System',
            status: 'UNOBSERVED',
            reason: 'No banner exposure',
          },
        ],
      });

      expect(
        currentState.knownUnknowns.find((k) => k.dimension === 'Database Tier')
          ?.status,
      ).toBe('UNOBSERVED');
      const audit = integrityService.auditPipelineIntegrity(currentState);
      expect(audit.isValid).toBe(true);
      expect(audit.ungroundedClaims).toHaveLength(0);
    });
  });

  describe('H8-004: Anti-Leakage of Historical Findings into Current Truth', () => {
    it('should catch violation when a resolved finding is marked active in current state', () => {
      const corruptedState = consistencyService.synthesizeAuthoritativeState({
        snapshotId: 'snap-corrupt',
        domainId: 'dom-corrupt',
        domainName: 'corrupt.io',
        technologies: [],
        activeFindings: [
          {
            id: 'finding-leak-1',
            title: 'Resolved Leak',
            description: 'Should be resolved',
            severity: 'HIGH',
            category: 'SECURITY',
            isCompliant: false,
          },
        ],
      });

      const audit = integrityService.auditCurrentVsHistoricalSeparation(
        corruptedState,
        {
          resolvedFindings: [
            {
              id: 'finding-leak-1',
              title: 'Resolved Leak',
              description: 'Should be resolved',
              severity: 'HIGH',
              category: 'SECURITY',
              isCompliant: true,
            },
          ],
        },
      );

      expect(audit.isSeparated).toBe(false);
      expect(audit.leakedHistoricalFindings).toContain('finding-leak-1');
    });
  });
});
