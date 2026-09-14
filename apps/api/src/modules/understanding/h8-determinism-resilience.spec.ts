import { Test, TestingModule } from '@nestjs/testing';
import { IntelligenceIntegrityGateService } from './services/intelligence-integrity-gate.service';
import { IntelligenceConsistencyAuthorityService } from './services/intelligence-consistency-authority.service';
import { AuthoritativeIntelligenceStateDto } from './contracts/authoritative-intelligence-state.interface';

describe('H8 — Determinism, Probe Resilience, Security & Master Certification', () => {
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

  describe('H8-008: Determinism & Idempotency Audit', () => {
    it('should produce strictly deterministic outputs across multiple iterations with zero duplicate entities', () => {
      const generator = (): AuthoritativeIntelligenceStateDto =>
        consistencyService.synthesizeAuthoritativeState({
          snapshotId: 'snap-det-01',
          domainId: 'dom-det',
          domainName: 'deterministic.io',
          technologies: [
            {
              id: 'tech-cf',
              name: 'Cloudflare',
              layer: 'EDGE',
              confidence: 'HIGH',
              evidence: ['server: cloudflare'],
            },
            {
              id: 'tech-nginx',
              name: 'NGINX',
              layer: 'GATEWAY',
              confidence: 'HIGH',
              evidence: ['server: nginx/1.24'],
            },
          ],
          ingressHops: [
            {
              id: 'hop-1',
              layer: 'EDGE',
              title: 'Cloudflare',
              technologyName: 'Cloudflare',
              status: 'OBSERVED',
              order: 1,
            },
            {
              id: 'hop-2',
              layer: 'GATEWAY',
              title: 'NGINX',
              technologyName: 'NGINX',
              status: 'OBSERVED',
              order: 2,
            },
          ],
          activeFindings: [],
          resolvedFindings: [],
        });

      const audit = integrityService.verifyDeterminismAndIdempotency(
        generator,
        5,
      );
      expect(audit.isDeterministic).toBe(true);
      expect(audit.iterationsRun).toBe(5);
      expect(audit.duplicateEntitiesFound).toBe(0);
      expect(audit.orderingStable).toBe(true);
      expect(audit.divergenceDetails).toHaveLength(0);
    });
  });

  describe('H8-010: Production Probe Failure Resilience', () => {
    it('should gracefully degrade DNS timeout probes to UNOBSERVED/INDETERMINATE without guessing', () => {
      const result = integrityService.handleDegradedProbeSignals('DNS_TIMEOUT');
      expect(result.status).toBe('UNOBSERVED');
      expect(result.confidence).toBe('INCONCLUSIVE');
      expect(result.explanation).toContain('DNS_TIMEOUT');
    });

    it('should gracefully degrade TLS timeout probes without asserting speculative certs', () => {
      const result = integrityService.handleDegradedProbeSignals('TLS_TIMEOUT');
      expect(result.status).toBe('UNOBSERVED');
      expect(result.confidence).toBe('INCONCLUSIVE');
    });

    it('should gracefully degrade WAF 403 challenge probes without asserting speculative origin backends', () => {
      const result =
        integrityService.handleDegradedProbeSignals('WAF_403_CHALLENGE');
      expect(result.status).toBe('UNOBSERVED');
      expect(result.confidence).toBe('INCONCLUSIVE');
    });
  });

  describe('H8-007: Security & Tenant Isolation Audit', () => {
    it('should verify authorization and grant access when tenant and auth token match', () => {
      const audit = integrityService.auditSecurityAndAuthorization({
        tenantId: 'tenant-acme',
        targetDomainTenantId: 'tenant-acme',
        hasValidAuthToken: true,
      });

      expect(audit.isSecure).toBe(true);
      expect(audit.tenantIsolated).toBe(true);
      expect(audit.directUrlTamperResistant).toBe(true);
      expect(audit.credentialsSanitized).toBe(true);
    });

    it('should reject unauthorized cross-tenant requests even if domain snapshot ID is known', () => {
      const audit = integrityService.auditSecurityAndAuthorization({
        tenantId: 'tenant-attacker',
        targetDomainTenantId: 'tenant-victim',
        hasValidAuthToken: true,
      });

      expect(audit.isSecure).toBe(false);
      expect(audit.tenantIsolated).toBe(false);
      expect(
        audit.auditNotes.some((n) =>
          n.includes('Cross-tenant data access rejected'),
        ),
      ).toBe(true);
    });

    it('should reject unauthenticated requests', () => {
      const audit = integrityService.auditSecurityAndAuthorization({
        tenantId: 'tenant-acme',
        targetDomainTenantId: 'tenant-acme',
        hasValidAuthToken: false,
      });

      expect(audit.isSecure).toBe(false);
      expect(
        audit.auditNotes.some((n) =>
          n.includes('Missing or invalid authentication token'),
        ),
      ).toBe(true);
    });
  });

  describe('H8-011: Master Intelligence Integrity Report Generation', () => {
    it('should generate a 100% certified Master Intelligence Integrity Report for valid state', () => {
      const state = consistencyService.synthesizeAuthoritativeState({
        snapshotId: 'snap-master-cert',
        domainId: 'dom-master',
        domainName: 'master-certified.io',
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
        activeFindings: [],
        resolvedFindings: [],
      });

      const report = integrityService.generateMasterIntegrityReport(state);
      expect(report.isFullyCertified).toBe(true);
      expect(report.pipelineIntegrity.isValid).toBe(true);
      expect(report.confidenceIntegrity.isMonotonic).toBe(true);
      expect(report.currentHistoricalSeparation.isSeparated).toBe(true);
      expect(report.adversarialResults.every((r) => r.passed)).toBe(true);
      expect(report.determinismAudit.isDeterministic).toBe(true);
      expect(report.securityAudit.isSecure).toBe(true);
    });
  });
});
