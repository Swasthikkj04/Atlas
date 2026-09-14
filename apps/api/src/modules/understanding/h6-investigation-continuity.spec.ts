import { Test, TestingModule } from '@nestjs/testing';
import { InvestigationContinuityService } from './services/investigation-continuity.service';
import type { InvestigationContextDto } from './contracts/investigation-continuity.interface';

describe('H6: Investigation Continuity & Evidence Navigation Backend Suite', () => {
  let service: InvestigationContinuityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvestigationContinuityService],
    }).compile();

    service = module.get<InvestigationContinuityService>(
      InvestigationContinuityService,
    );
  });

  describe('H6-001 & H6-009: Context Validation, Tenant Security Boundaries & Sanitization', () => {
    it('validates and sanitizes a complete, valid investigation context', () => {
      const rawContext: InvestigationContextDto = {
        domainId: 'domain-prod-123',
        domainName: 'app.example.com',
        sourceSurface: 'overview',
        sourceSection: 'narrative',
        entityType: 'technology',
        entityId: 'tech-nginx',
        entityName: 'NGINX',
        snapshotId: 'snap-2026-08-29-001',
        findingId: 'finding-hsts-missing',
        evidenceId: 'ev-server-header',
        disclosureLevel: 3,
        filterState: { severity: 'CRITICAL', showResolved: false },
        scrollAnchor: 'tech-nginx-row',
        timestamp: '2026-08-29T10:00:00Z',
      };

      const result = service.validateAndSanitizeContext(rawContext, [
        'domain-prod-123',
      ]);

      expect(result.isValid).toBe(true);
      expect(result.isAuthorized).toBe(true);
      expect(result.isExpired).toBe(false);
      expect(result.sanitizedContext).not.toBeNull();
      expect(result.sanitizedContext?.domainId).toBe('domain-prod-123');
      expect(result.sanitizedContext?.entityId).toBe('tech-nginx');
      expect(result.sanitizedContext?.disclosureLevel).toBe(3);
      expect(result.sanitizedContext?.filterState).toEqual({
        severity: 'CRITICAL',
        showResolved: false,
      });
      expect(result.returnLabel).toBe('← Back to Infrastructure Narrative');
    });

    it('enforces tenant domain authorization boundary and rejects unowned domain IDs', () => {
      const rawContext: InvestigationContextDto = {
        domainId: 'domain-unauthorized-999',
        domainName: 'victim.example.com',
        sourceSurface: 'overview',
        entityType: 'finding',
        entityId: 'finding-cors',
        snapshotId: 'snap-100',
      };

      // User only owns domain-prod-123
      const result = service.validateAndSanitizeContext(rawContext, [
        'domain-prod-123',
      ]);

      expect(result.isValid).toBe(false);
      expect(result.isAuthorized).toBe(false);
      expect(result.sanitizedContext).toBeNull();
      expect(result.fallbackDestination.reason).toContain('not authorized');
      expect(result.fallbackDestination.surface).toBe('overview');
    });

    it('gracefully handles missing, null, or undefined context with defensive fallback', () => {
      const result = service.validateAndSanitizeContext(null);

      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(result.sanitizedContext).toBeNull();
      expect(result.fallbackDestination.surface).toBe('overview');
      expect(result.fallbackDestination.reason).toBe(
        'The original investigation context is no longer available.',
      );
      expect(result.returnLabel).toBe('← Back to Overview');
    });

    it('gracefully handles malformed context with invalid source surface or missing entityId', () => {
      const malformedContext = {
        domainId: 'domain-123',
        sourceSurface: 'INVALID_SURFACE', // Invalid
        entityType: 'technology',
        // missing entityId
      };

      const result = service.validateAndSanitizeContext(malformedContext);

      expect(result.isValid).toBe(false);
      expect(result.sanitizedContext).toBeNull();
      expect(result.fallbackDestination.surface).toBe('overview');
      expect(result.fallbackDestination.reason).toBe(
        'The original investigation context is malformed or invalid.',
      );
    });

    it('sanitizes potential script injection and special characters in context strings', () => {
      const injectionContext = {
        domainId: 'domain-123',
        domainName: 'app.example.com',
        sourceSurface: 'overview' as const,
        entityType: 'technology' as const,
        entityId: 'tech-nginx<script>alert(1)</script>',
        entityName: 'NGINX "or 1=1; --',
        sourceSection: "section'`",
        snapshotId: 'snap-123',
      };

      const result = service.validateAndSanitizeContext(injectionContext);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedContext?.entityId).toBe(
        'tech-nginxscriptalert(1)/script',
      );
      expect(result.sanitizedContext?.entityName).toBe('NGINX or 1=1; --');
      expect(result.sanitizedContext?.sourceSection).toBe('section');
    });
  });

  describe('H6-002: Context-Aware Return Anchor Labeling', () => {
    it('synthesizes origin-aware label for narrative source', () => {
      const label = service.computeReturnLabel({
        sourceSurface: 'overview',
        sourceSection: 'narrative',
        entityType: 'technology',
        entityId: 'tech-nginx',
      });
      expect(label).toBe('← Back to Infrastructure Narrative');
    });

    it('synthesizes origin-aware label for specific technology evidence', () => {
      const label = service.computeReturnLabel({
        sourceSurface: 'overview',
        entityType: 'technology',
        entityId: 'tech-envoy',
        entityName: 'Envoy',
      });
      expect(label).toBe('← Back to Envoy evidence');
    });

    it('synthesizes origin-aware label for finding investigation', () => {
      const label = service.computeReturnLabel({
        sourceSurface: 'findings',
        entityType: 'finding',
        entityId: 'finding-hsts',
        entityName: 'HSTS Protection Missing',
      });
      expect(label).toBe('← Back to HSTS Protection Missing investigation');
    });

    it('synthesizes origin-aware label for changes surface', () => {
      const label = service.computeReturnLabel({
        sourceSurface: 'changes',
        entityType: 'change',
        entityId: 'chg-123',
      });
      expect(label).toBe('← Back to Changes');
    });

    it('synthesizes origin-aware label for memory surface', () => {
      const label = service.computeReturnLabel({
        sourceSurface: 'memory',
        entityType: 'snapshot',
        entityId: 'snap-456',
      });
      expect(label).toBe('← Back to Snapshot History');
    });
  });

  describe('H6-006: WX-211 Finding Lifecycle Truth Reconciliation', () => {
    it('correlates ACTIVE finding with NON_COMPLIANT observation state', () => {
      const reconciliation = service.reconcileFindingLifecycle({
        id: 'finding-csp',
        status: 'ACTIVE',
        observationState: 'NON_COMPLIANT',
      });

      expect(reconciliation.lifecycleState).toBe('ACTIVE');
      expect(reconciliation.observationState).toBe('NON_COMPLIANT');
      expect(reconciliation.isConsistent).toBe(true);
    });

    it('correlates RESOLVED finding with COMPLIANT observation state', () => {
      const reconciliation = service.reconcileFindingLifecycle({
        id: 'finding-csp',
        status: 'RESOLVED',
        observationState: 'COMPLIANT',
      });

      expect(reconciliation.lifecycleState).toBe('RESOLVED');
      expect(reconciliation.observationState).toBe('COMPLIANT');
      expect(reconciliation.isConsistent).toBe(true);
    });

    it('detects contradiction if ACTIVE finding claims COMPLIANT observation', () => {
      const reconciliation = service.reconcileFindingLifecycle({
        id: 'finding-csp',
        status: 'ACTIVE',
        observationState: 'COMPLIANT',
      });

      expect(reconciliation.lifecycleState).toBe('ACTIVE');
      expect(reconciliation.isConsistent).toBe(false);
    });
  });

  describe('H6-004 & H6-005: 3-Level Evidence Drawer Item Construction', () => {
    it('constructs structured 3-level progressive evidence drawer item', () => {
      const drawerItem = service.buildEvidenceDrawerItem({
        id: 'ev-nginx-banner',
        claim: 'Gateway component identified as NGINX',
        layer: 'GATEWAY',
        source: 'HTTP Response Headers',
        rawEvidence: 'Server: nginx/1.24.0 (Ubuntu)',
        timestamp: '2026-08-29T10:30:00Z',
        confidence: 'HIGH',
        technology: 'NGINX',
        snapshotId: 'snap-prod-001',
        rawPayload: { header: 'Server', value: 'nginx/1.24.0 (Ubuntu)' },
      });

      expect(drawerItem.id).toBe('ev-nginx-banner');
      expect(drawerItem.level1Summary).toBe(
        'Observed http response headers at GATEWAY boundary.',
      );
      expect(drawerItem.level2Meaning).toContain(
        'Server: nginx/1.24.0 (Ubuntu) — Directly identifies the observed NGINX gateway signature.',
      );
      expect(drawerItem.level3RawTelemetry.sourceType).toBe(
        'HTTP Response Headers',
      );
      expect(drawerItem.level3RawTelemetry.value).toBe(
        'Server: nginx/1.24.0 (Ubuntu)',
      );
      expect(drawerItem.level3RawTelemetry.snapshotId).toBe('snap-prod-001');
      expect(drawerItem.confidence).toBe('HIGH');
    });
  });
});
