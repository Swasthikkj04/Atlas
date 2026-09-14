import { Test, TestingModule } from '@nestjs/testing';
import { IntelligenceIntegrityGateService } from './services/intelligence-integrity-gate.service';
import { IntelligenceConsistencyAuthorityService } from './services/intelligence-consistency-authority.service';
import { H8_CERTIFIED_INVARIANTS } from './contracts/intelligence-integrity-gate.interface';
import { AuthoritativeIntelligenceStateDto } from './contracts/authoritative-intelligence-state.interface';

describe('H8 — Intelligence Pipeline Integrity & Monotonic Confidence', () => {
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

  describe('H8 Invariants & Truth Gate', () => {
    it('should certify all H8 intelligence integrity invariants', () => {
      expect(H8_CERTIFIED_INVARIANTS.H8_PIPELINE_INTEGRITY_STRICT).toBe(true);
      expect(H8_CERTIFIED_INVARIANTS.H8_EVIDENCE_LINEAGE_COMPLETENESS).toBe(
        true,
      );
      expect(H8_CERTIFIED_INVARIANTS.H8_CONFIDENCE_MONOTONIC_ORDERING).toBe(
        true,
      );
      expect(
        H8_CERTIFIED_INVARIANTS.H8_CURRENT_HISTORICAL_TRUTH_SEPARATION,
      ).toBe(true);
      expect(H8_CERTIFIED_INVARIANTS.H8_CROSS_SURFACE_CONTRADICTION_SWEEP).toBe(
        true,
      );
      expect(H8_CERTIFIED_INVARIANTS.H8_ADVERSARIAL_TRUTH_RESILIENCE).toBe(
        true,
      );
      expect(H8_CERTIFIED_INVARIANTS.H8_SECURITY_AUTHORIZATION_HARDENING).toBe(
        true,
      );
      expect(H8_CERTIFIED_INVARIANTS.H8_DETERMINISM_AND_IDEMPOTENCY).toBe(true);
      expect(H8_CERTIFIED_INVARIANTS.H8_CACHE_CONVERGENCE_INTEGRITY).toBe(true);
      expect(H8_CERTIFIED_INVARIANTS.H8_PRODUCTION_FAILURE_RESILIENCE).toBe(
        true,
      );
      expect(H8_CERTIFIED_INVARIANTS.H8_MASTER_INTELLIGENCE_CERTIFICATION).toBe(
        true,
      );
      expect(H8_CERTIFIED_INVARIANTS.H8_FINAL_PRODUCTION_GATE_SEALED).toBe(
        true,
      );
    });
  });

  describe('H8-001: Pipeline Integrity & Anti-Manufacture Gate', () => {
    it('should validate a clean, evidence-grounded authoritative state without ungrounded entities', () => {
      const state = consistencyService.synthesizeAuthoritativeState({
        snapshotId: 'snap-clean-01',
        domainId: 'dom-clean',
        domainName: 'clean-pipeline.io',
        technologies: [
          {
            id: 'tech-cf',
            name: 'Cloudflare',
            layer: 'EDGE',
            confidence: 'HIGH',
            evidence: ['cf-ray: 7abc123', 'server: cloudflare'],
            isConfirmed: true,
          },
          {
            id: 'tech-node',
            name: 'Node.js',
            layer: 'RUNTIME',
            confidence: 'HIGH',
            evidence: ['x-powered-by: Express'],
            isConfirmed: true,
          },
        ],
        ingressHops: [
          {
            id: 'hop-1',
            layer: 'EDGE',
            title: 'Cloudflare Edge CDN',
            technologyName: 'Cloudflare',
            status: 'OBSERVED',
            order: 1,
            evidence: ['cf-ray header'],
          },
          {
            id: 'hop-2',
            layer: 'RUNTIME',
            title: 'Node.js App Runtime',
            technologyName: 'Node.js',
            status: 'OBSERVED',
            order: 2,
            evidence: ['x-powered-by header'],
          },
        ],
        activeFindings: [],
        resolvedFindings: [],
      });

      const audit = integrityService.auditPipelineIntegrity(state);
      expect(audit.isValid).toBe(true);
      expect(audit.ungroundedClaims).toHaveLength(0);
      expect(audit.ungroundedTechnologies).toHaveLength(0);
      expect(audit.ungroundedRelationships).toHaveLength(0);
      expect(audit.ungroundedFindings).toHaveLength(0);
    });

    it('should reject state when a technology has no supporting evidence', () => {
      const mockState: AuthoritativeIntelligenceStateDto = {
        snapshotId: 'snap-invalid',
        domainId: 'dom-1',
        domainName: 'invalid.io',
        timestamp: new Date().toISOString(),
        status: 'STABLE',
        technologies: [
          {
            name: 'NGINX',
            layer: 'GATEWAY',
            confidence: 'HIGH',
            evidence: [], // Missing evidence
            whatThisDoesNotProve: [],
          },
        ],
        ingressPath: [],
        activeFindings: [],
        resolvedFindings: [],
        changeEvents: [],
        posture: {
          security: 'GOOD',
          architecture: 'OPTIMAL',
          exposure: 'NORMAL',
          summary: 'Good',
        },
        whatMattersNow: {
          headline: 'All good',
          urgency: 'LOW',
          requiredAction: 'None',
        },
        unifiedNarrative: {
          level1: {
            headline: 'Clean',
            pathSummary: 'Direct',
            oneLiner: 'Clean state',
          },
          level2: {
            architectureMeaning: 'Meaning',
            layerRationale: [],
            evolutionContext: 'Stable',
            postureContext: 'Good',
            unobservedDimensions: [],
          },
          level3: {
            snapshotId: 'snap-invalid',
            timestamp: new Date().toISOString(),
            rawObservationsSummary: 'None',
            evidenceLineage: [],
          },
        },
        knownUnknowns: [],
        confidence: { overall: 'HIGH', basis: ['none'] },
      };

      const audit = integrityService.auditPipelineIntegrity(mockState);
      expect(audit.isValid).toBe(false);
      expect(audit.ungroundedTechnologies).toContain('NGINX');
    });

    it('should reject state when narrative speculates on unobserved databases or orchestrators', () => {
      const mockState: AuthoritativeIntelligenceStateDto = {
        snapshotId: 'snap-speculative',
        domainId: 'dom-1',
        domainName: 'speculative.io',
        timestamp: new Date().toISOString(),
        status: 'STABLE',
        technologies: [
          {
            name: 'Cloudflare',
            layer: 'EDGE',
            confidence: 'HIGH',
            evidence: ['server: cloudflare'],
            whatThisDoesNotProve: [],
          },
        ],
        ingressPath: [],
        activeFindings: [],
        resolvedFindings: [],
        changeEvents: [],
        posture: {
          security: 'GOOD',
          architecture: 'OPTIMAL',
          exposure: 'NORMAL',
          summary: 'Good',
        },
        whatMattersNow: {
          headline: 'All good',
          urgency: 'LOW',
          requiredAction: 'None',
        },
        unifiedNarrative: {
          level1: {
            headline:
              'Cloudflare connects to backend PostgreSQL cluster managed by Kubernetes.',
            pathSummary: 'Cloudflare -> Kubernetes',
            oneLiner: 'Cloudflare and Postgres',
          },
          level2: {
            architectureMeaning: 'Meaning',
            layerRationale: [],
            evolutionContext: 'Stable',
            postureContext: 'Good',
            unobservedDimensions: [],
          },
          level3: {
            snapshotId: 'snap-speculative',
            timestamp: new Date().toISOString(),
            rawObservationsSummary: 'None',
            evidenceLineage: [],
          },
        },
        knownUnknowns: [
          {
            dimension: 'Database Tier',
            status: 'UNOBSERVED',
            reason: 'Sealed',
          },
        ],
        confidence: { overall: 'HIGH', basis: ['none'] },
      };

      const audit = integrityService.auditPipelineIntegrity(mockState);
      expect(audit.isValid).toBe(false);
      expect(audit.ungroundedClaims.length).toBeGreaterThan(0);
    });
  });

  describe('H8-003: Confidence Integrity & Monotonic Ordering', () => {
    it('should validate valid monotonic confidence: HIGH >= HIGH >= HIGH', () => {
      const audit = integrityService.validateConfidenceIntegrity(
        'HIGH',
        'HIGH',
        'HIGH',
      );
      expect(audit.isMonotonic).toBe(true);
      expect(audit.violations).toHaveLength(0);
    });

    it('should validate valid monotonic degradation: HIGH >= MEDIUM >= LOW', () => {
      const audit = integrityService.validateConfidenceIntegrity(
        'HIGH',
        'MEDIUM',
        'LOW',
      );
      expect(audit.isMonotonic).toBe(true);
      expect(audit.violations).toHaveLength(0);
    });

    it('should reject confidence inflation: MEDIUM evidence producing HIGH interpretation', () => {
      const audit = integrityService.validateConfidenceIntegrity(
        'MEDIUM',
        'HIGH',
        'HIGH',
      );
      expect(audit.isMonotonic).toBe(false);
      expect(audit.violations.length).toBeGreaterThan(0);
    });

    it('should enforce that behavioral-only evidence cannot produce HIGH narrative confidence', () => {
      const audit = integrityService.validateConfidenceIntegrity(
        'HIGH',
        'HIGH',
        'HIGH',
        true,
      );
      expect(audit.isMonotonic).toBe(false);
      expect(audit.violations[0]).toContain(
        'Behavioral-only evidence cannot produce HIGH confidence narrative',
      );
    });
  });
});
