import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_R002_TICKET_ID,
  GX_R002_PHASE,
  GX_R002_STATUS,
  GX_R002_CANONICAL_PRINCIPLE,
  GX_R002_CENTRAL_DESIGN_RULE,
  GX_R002_CERTIFICATION_GATE_STATEMENT,
  GUEST_WORKSPACE_REGIONS,
  OVERVIEW_HIERARCHY_TIERS,
  CANONICAL_INFRASTRUCTURE_CATEGORIES,
  CONTEXT_PRESERVING_INVESTIGATION_FLOW,
  GUEST_RESILIENCE_STATES,
  RESPONSIVE_TRANSFORMATION_MODEL,
  PROGRESSIVE_RENDERING_PIPELINE,
  EXPLICITLY_REJECTED_MODELS,
  validateBoundedViewportCompliance,
  validateSevenResilienceStates,
  verifyGXR002CertificationGate,
  type GuestResilienceStateId,
} from './gx-r002-information-architecture.contract.ts';

describe('GX-R002: Guest Workspace Information Architecture Contract', () => {
  describe('1. Canonical Architectural Principle & Certification Gate', () => {
    it('defines the canonical ticket metadata and status', () => {
      assert.equal(GX_R002_TICKET_ID, 'GX-R002');
      assert.equal(GX_R002_PHASE, 'GX-R — Nebula First Experience Redesign');
      assert.equal(GX_R002_STATUS, 'FROZEN_INFORMATION_ARCHITECTURE');
    });

    it('embodies the canonical principle and central design rule', () => {
      assert.ok(GX_R002_CANONICAL_PRINCIPLE.includes('bounded spatial intelligence environment'));
      assert.ok(GX_R002_CANONICAL_PRINCIPLE.includes('Understand → Orient → Investigate → Decide whether to keep it'));
      assert.equal(
        GX_R002_CENTRAL_DESIGN_RULE,
        'GX should feel like temporarily entering Nebula Workspace, not scrolling through a report about Nebula.'
      );
    });

    it('passes the 🔒 GX-R002 Certification Gate with the canonical statement', () => {
      const statement =
        'A guest can enter a bounded Nebula environment, orient themselves, understand the current infrastructure, investigate meaningful intelligence, and return to their previous context — without navigating an endless report.';
      const result = verifyGXR002CertificationGate(statement);

      assert.equal(result.passed, true);
      assert.equal(result.canonicalStatement, GX_R002_CERTIFICATION_GATE_STATEMENT);
      assert.equal(result.centralDesignRule, GX_R002_CENTRAL_DESIGN_RULE);
      assert.equal(result.similarityRatio, 1);
    });

    it('rejects an invalid statement attempting to reintroduce infinite report scrolling', () => {
      const invalidStatement =
        'A guest enters a standard vertical scroll page that dumps all vulnerability scan results continuously.';
      const result = verifyGXR002CertificationGate(invalidStatement);

      assert.equal(result.passed, false);
      assert.ok(result.similarityRatio < 0.4);
    });
  });

  describe('2. Canonical Guest Workspace Regions', () => {
    it('defines exactly the 4 primary intelligence regions', () => {
      assert.equal(GUEST_WORKSPACE_REGIONS.length, 4);
      const regionIds = GUEST_WORKSPACE_REGIONS.map((r) => r.id);
      assert.deepEqual(regionIds, ['overview', 'findings', 'infrastructure', 'evidence']);
    });

    it('establishes Overview as the primary orientation surface', () => {
      const overview = GUEST_WORKSPACE_REGIONS.find((r) => r.id === 'overview')!;
      assert.equal(overview.isPrimarySurface, true);
      assert.equal(overview.boundedContainerType, 'viewport_bounded');
      assert.ok(overview.questionAnswered.includes('what matters now'));
    });

    it('designates Evidence as a contextual drawer rather than a separate page', () => {
      const evidence = GUEST_WORKSPACE_REGIONS.find((r) => r.id === 'evidence')!;
      assert.equal(evidence.isPrimarySurface, false);
      assert.equal(evidence.boundedContainerType, 'contextual_drawer');
    });
  });

  describe('3. Overview Hierarchy Tiers', () => {
    it('defines the strict 5-tier Overview hierarchy', () => {
      assert.equal(OVERVIEW_HIERARCHY_TIERS.length, 5);
      const tiers = OVERVIEW_HIERARCHY_TIERS.map((t) => t.tier);
      assert.deepEqual(tiers, [
        'DOMAIN_IDENTITY',
        'CURRENT_UNDERSTANDING',
        'WHAT_MATTERS_NOW',
        'OTHER_THINGS_WORTH_KNOWING',
        'INFRASTRUCTURE_UNDERSTANDING',
      ]);
    });

    it('maintains monotonic rank from 1 to 5 with strict composition rules', () => {
      OVERVIEW_HIERARCHY_TIERS.forEach((tier, index) => {
        assert.equal(tier.rank, index + 1);
        assert.ok(tier.label.length > 0);
        assert.ok(tier.description.length > 0);
        assert.ok(tier.compositionRule.length > 0);
      });
    });
  });

  describe('4. Canonical Infrastructure Categories (8 Categories)', () => {
    it('defines all 8 canonical infrastructure categories', () => {
      assert.equal(CANONICAL_INFRASTRUCTURE_CATEGORIES.length, 8);
      const categories = CANONICAL_INFRASTRUCTURE_CATEGORIES.map((c) => c.category);
      assert.deepEqual(categories, [
        'Edge',
        'Web Server',
        'Application',
        'Platform',
        'Hosting',
        'DNS',
        'TLS',
        'Mail',
      ]);
    });

    it('provides concrete detections and role descriptions for every category', () => {
      CANONICAL_INFRASTRUCTURE_CATEGORIES.forEach((cat) => {
        assert.ok(cat.roleDescription.length > 15);
        assert.ok(cat.exampleDetections.length >= 4);
      });
    });
  });

  describe('5. Context-Preserving Investigation Flow', () => {
    it('defines the 4-step context-preserving investigation sequence', () => {
      assert.equal(CONTEXT_PRESERVING_INVESTIGATION_FLOW.length, 4);
      const stepNumbers = CONTEXT_PRESERVING_INVESTIGATION_FLOW.map((s) => s.stepNumber);
      assert.deepEqual(stepNumbers, [1, 2, 3, 4]);
    });

    it('guarantees background context is preserved across all investigation steps', () => {
      CONTEXT_PRESERVING_INVESTIGATION_FLOW.forEach((step) => {
        assert.equal(
          step.backgroundContextPreserved,
          true,
          `Step ${step.stepNumber} must preserve background context`
        );
      });
    });
  });

  describe('6. Seven Canonical Resilience States', () => {
    it('defines all 7 canonical resilience states with codes 01 to 07', () => {
      assert.equal(GUEST_RESILIENCE_STATES.length, 7);
      const stateIds = GUEST_RESILIENCE_STATES.map((s) => s.stateId);
      assert.deepEqual(stateIds, [
        'IDLE',
        'UNDERSTANDING',
        'PARTIAL_UNDERSTANDING',
        'READY',
        'QUIET_STABLE',
        'MEANINGFUL_CHANGE',
        'FAILURE',
      ]);

      const codes = GUEST_RESILIENCE_STATES.map((s) => s.code);
      assert.deepEqual(codes, ['01', '02', '03', '04', '05', '06', '07']);
    });

    it('validates state completeness helper detects full vs incomplete state matrices', () => {
      const fullSet: readonly GuestResilienceStateId[] = [
        'IDLE',
        'UNDERSTANDING',
        'PARTIAL_UNDERSTANDING',
        'READY',
        'QUIET_STABLE',
        'MEANINGFUL_CHANGE',
        'FAILURE',
      ];
      assert.equal(validateSevenResilienceStates(fullSet).complete, true);
      assert.equal(validateSevenResilienceStates(fullSet).missingStates.length, 0);

      const partialSet: readonly GuestResilienceStateId[] = ['IDLE', 'READY', 'FAILURE'];
      const validation = validateSevenResilienceStates(partialSet);
      assert.equal(validation.complete, false);
      assert.deepEqual(validation.missingStates, [
        'UNDERSTANDING',
        'PARTIAL_UNDERSTANDING',
        'QUIET_STABLE',
        'MEANINGFUL_CHANGE',
      ]);
    });
  });

  describe('7. Responsive Transformation Model', () => {
    it('specifies behavior across Desktop, Tablet, and Mobile viewports', () => {
      assert.equal(RESPONSIVE_TRANSFORMATION_MODEL.length, 3);
      const tiers = RESPONSIVE_TRANSFORMATION_MODEL.map((t) => t.deviceTier);
      assert.deepEqual(tiers, ['Desktop', 'Tablet', 'Mobile']);
    });

    it('adapts the spatial model sequentially on mobile without becoming an unbounded report', () => {
      const mobile = RESPONSIVE_TRANSFORMATION_MODEL.find((t) => t.deviceTier === 'Mobile')!;
      assert.ok(mobile.spatialComposition.includes('controlled sequential surfaces'));
      assert.ok(mobile.investigationContainer.includes('Full-screen overlay'));
    });
  });

  describe('8. Progressive Rendering Pipeline (7 Phases)', () => {
    it('defines all 7 progressive rendering phases in order', () => {
      assert.equal(PROGRESSIVE_RENDERING_PIPELINE.length, 7);
      const phases = PROGRESSIVE_RENDERING_PIPELINE.map((p) => p.phaseId);
      assert.deepEqual(phases, [
        'shell',
        'domain',
        'current_understanding',
        'primary_intelligence',
        'secondary_intelligence',
        'infrastructure',
        'evidence',
      ]);
    });

    it('guarantees Shell and Domain are prioritized as CRITICAL_FIRST_PAINT', () => {
      const shell = PROGRESSIVE_RENDERING_PIPELINE.find((p) => p.phaseId === 'shell')!;
      const domain = PROGRESSIVE_RENDERING_PIPELINE.find((p) => p.phaseId === 'domain')!;

      assert.equal(shell.blockingPriority, 'CRITICAL_FIRST_PAINT');
      assert.equal(domain.blockingPriority, 'CRITICAL_FIRST_PAINT');
      assert.ok(shell.performanceBudgetMs <= 50);
      assert.ok(domain.performanceBudgetMs <= 100);
    });
  });

  describe('9. Explicitly Rejected Architecture Models', () => {
    it('codifies and rejects all 5 prohibited UX patterns', () => {
      assert.equal(EXPLICITLY_REJECTED_MODELS.length, 5);
      const modelIds = EXPLICITLY_REJECTED_MODELS.map((m) => m.modelId);
      assert.deepEqual(modelIds, [
        'INFINITE_REPORT',
        'TRADITIONAL_DASHBOARD',
        'SCANNER',
        'WORKSPACE_CLONE',
        'MARKETING_FUNNEL',
      ]);

      EXPLICITLY_REJECTED_MODELS.forEach((model) => {
        assert.ok(model.visualPattern.length > 0);
        assert.ok(model.rejectionRationale.length > 20);
      });
    });
  });

  describe('10. Bounded Viewport Invariant Validator', () => {
    it('passes compliant bounded layout configuration', () => {
      const result = validateBoundedViewportCompliance({
        usesInfinitePageScrollAsPrimary: false,
        hasBoundedCanvasContainer: true,
        hasContextPreservingInvestigation: true,
        primaryInformationVisibleWithoutUnlimitedScroll: true,
      });

      assert.equal(result.valid, true);
      assert.equal(result.violation, undefined);
    });

    it('rejects layout using infinite page scroll as primary architecture', () => {
      const result = validateBoundedViewportCompliance({
        usesInfinitePageScrollAsPrimary: true,
        hasBoundedCanvasContainer: true,
        hasContextPreservingInvestigation: true,
        primaryInformationVisibleWithoutUnlimitedScroll: true,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Infinite page scrolling MUST NOT be used'));
    });

    it('rejects layout lacking context-preserving investigation', () => {
      const result = validateBoundedViewportCompliance({
        usesInfinitePageScrollAsPrimary: false,
        hasBoundedCanvasContainer: true,
        hasContextPreservingInvestigation: false,
        primaryInformationVisibleWithoutUnlimitedScroll: true,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Investigation must preserve background canvas context'));
    });
  });
});
