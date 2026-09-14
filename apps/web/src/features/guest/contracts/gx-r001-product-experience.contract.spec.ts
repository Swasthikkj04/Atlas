import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_R001_TICKET_ID,
  GX_R001_PHASE,
  GX_R001_STATUS,
  NEBULA_GX_CANONICAL_DEFINITION,
  GX_CORE_THESIS,
  INTELLIGENCE_AUTHORITY_BOUNDARY,
  EXPERIENCE_JOURNEY_STAGES,
  WORKSPACE_CAPABILITY_MATRIX,
  PROGRESSIVE_DISCLOSURE_HIERARCHY,
  PREMIUM_DESIGN_CONTRACT,
  SEO_INDEXABILITY_REGISTRY,
  PRODUCTION_CONTRACT_PILLARS,
  validateFindingIntelligenceParity,
  validateGuestWorkspaceBoundary,
  evaluateSeoIndexability,
  verifyGXR001CertificationGate,
  type CanonicalFindingComparison,
} from './gx-r001-product-experience.contract.ts';

describe('GX-R001: Guest Experience Product & Experience Contract', () => {
  describe('1. Canonical Product Definition & Thesis', () => {
    it('defines the canonical ticket metadata and status', () => {
      assert.equal(GX_R001_TICKET_ID, 'GX-R001');
      assert.equal(GX_R001_PHASE, 'GX-R — Nebula First Experience Redesign');
      assert.equal(GX_R001_STATUS, 'FROZEN_FOUNDATION');
    });

    it('embodies the core thesis: "The difference is persistence, not intelligence"', () => {
      assert.ok(GX_CORE_THESIS.mission.includes('understand their infrastructure before asking them to create a Workspace'));
      assert.ok(GX_CORE_THESIS.intelligenceParity.includes('same underlying infrastructure intelligence'));
      assert.equal(GX_CORE_THESIS.differentiatingFactor, 'The difference is persistence, not intelligence.');
    });

    it('passes the 🔒 GX-R001 Certification Gate with canonical definition', () => {
      const canonical =
        "A temporary Guest Workspace that exposes Nebula's canonical infrastructure intelligence without requiring an account or providing persistent Workspace memory.";
      const result = verifyGXR001CertificationGate(canonical);

      assert.equal(result.passed, true);
      assert.equal(result.canonicalAnswer, NEBULA_GX_CANONICAL_DEFINITION);
      assert.equal(result.similarityRatio, 1);
    });

    it('rejects an incorrect or diluted answer to "What is GX?"', () => {
      const wrongAnswer = 'A marketing landing page scanner that generates a PDF report and asks for signup.';
      const result = verifyGXR001CertificationGate(wrongAnswer);

      assert.equal(result.passed, false);
      assert.ok(result.similarityRatio < 0.5);
    });
  });

  describe('2. Non-Negotiable Intelligence Invariants & Semantic Chain Integrity', () => {
    it('enforces that finding severity cannot be downgraded or altered in Guest Experience', () => {
      const validComparison: CanonicalFindingComparison = {
        findingId: 'finding-tls-001',
        workspaceSeverity: 'high',
        guestSeverity: 'high',
        workspaceEvidenceChain: {
          observation: 'Missing HSTS Preload directive in response header.',
          interpretation: 'First-time visitors on untrusted networks are vulnerable to SSL stripping.',
          significance: 'Cryptographic posture gap during initial connection negotiation.',
          evidenceRef: 'ev-tls-001',
        },
        guestEvidenceChain: {
          observation: 'Missing HSTS Preload directive in response header.',
          interpretation: 'First-time visitors on untrusted networks are vulnerable to SSL stripping.',
          significance: 'Cryptographic posture gap during initial connection negotiation.',
          evidenceRef: 'ev-tls-001',
        },
      };

      const validResult = validateFindingIntelligenceParity(validComparison);
      assert.equal(validResult.valid, true);

      // Severe violation: Workspace says HIGH, Guest attempts INFORMATIONAL
      const invalidComparison: CanonicalFindingComparison = {
        ...validComparison,
        guestSeverity: 'informational',
      };

      const invalidResult = validateFindingIntelligenceParity(invalidComparison);
      assert.equal(invalidResult.valid, false);
      assert.ok(invalidResult.violation?.includes('Severity mismatch'));
      assert.ok(invalidResult.violation?.includes('Guest MUST NOT downgrade or alter canonical severity'));
    });

    it('enforces exact semantic evidence chain preservation (Observation → Interpretation → Significance → Evidence)', () => {
      const brokenChainComparison: CanonicalFindingComparison = {
        findingId: 'finding-spf-001',
        workspaceSeverity: 'medium',
        guestSeverity: 'medium',
        workspaceEvidenceChain: {
          observation: 'SPF record specifies softfail ~all.',
          interpretation: 'Unauthorized senders can spoof transactional email without inbox rejection.',
          significance: 'Email perimeter authentication vulnerability.',
          evidenceRef: 'ev-dns-004',
        },
        guestEvidenceChain: {
          observation: 'SPF record specifies softfail ~all.',
          interpretation: 'Generic email notice - nothing urgent.', // TAMPERED interpretation
          significance: 'Email perimeter authentication vulnerability.',
          evidenceRef: 'ev-dns-004',
        },
      };

      const result = validateFindingIntelligenceParity(brokenChainComparison);
      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Semantic evidence chain broken'));
    });

    it('strictly separates backend canonical intelligence from GX presentation controls', () => {
      assert.ok(INTELLIGENCE_AUTHORITY_BOUNDARY.backendCanonical.includes('finding_severity_calculation'));
      assert.ok(INTELLIGENCE_AUTHORITY_BOUNDARY.backendCanonical.includes('evidence_truth_and_raw_payloads'));
      assert.ok(INTELLIGENCE_AUTHORITY_BOUNDARY.backendCanonical.includes('provider_attribution_signals'));

      assert.ok(INTELLIGENCE_AUTHORITY_BOUNDARY.gxPresentationControlled.includes('presentation_and_visual_styling'));
      assert.ok(INTELLIGENCE_AUTHORITY_BOUNDARY.gxPresentationControlled.includes('progressive_disclosure_timing'));
      assert.ok(INTELLIGENCE_AUTHORITY_BOUNDARY.gxPresentationControlled.includes('topological_and_system_visualization'));

      assert.ok(INTELLIGENCE_AUTHORITY_BOUNDARY.gxProhibitedFromModifying.includes('severity_downgrading_or_upgrading'));
      assert.ok(INTELLIGENCE_AUTHORITY_BOUNDARY.gxProhibitedFromModifying.includes('finding_identity_or_synthetic_creation'));
      assert.ok(INTELLIGENCE_AUTHORITY_BOUNDARY.gxProhibitedFromModifying.includes('evidence_truth_or_payload_alteration'));
    });
  });

  describe('3. Experience Philosophy & Anti-Pattern Contract', () => {
    it('defines the 5 sequential journey steps from Curiosity to Optional Continuity', () => {
      assert.equal(EXPERIENCE_JOURNEY_STAGES.length, 5);
      const stageKeys = EXPERIENCE_JOURNEY_STAGES.map((s) => s.stage);
      assert.deepEqual(stageKeys, [
        'CURIOSITY',
        'UNDERSTANDING',
        'DISCOVERY',
        'CONFIDENCE',
        'OPTIONAL_CONTINUITY',
      ]);
    });

    it('verifies every journey stage explicitly specifies anti-patterns to avoid scanner tropes', () => {
      EXPERIENCE_JOURNEY_STAGES.forEach((stage) => {
        assert.ok(stage.userMentalState.length > 10);
        assert.ok(stage.productBehavior.length > 10);
        assert.ok(stage.antiPattern.length > 10);
      });
    });
  });

  describe('4. Guest Workspace vs Authenticated Workspace Boundary Matrix', () => {
    it('allows immediate intelligence exploration in Guest Workspace', () => {
      assert.equal(validateGuestWorkspaceBoundary('DOMAIN_IDENTITY').allowedInGuest, true);
      assert.equal(validateGuestWorkspaceBoundary('CURRENT_UNDERSTANDING').allowedInGuest, true);
      assert.equal(validateGuestWorkspaceBoundary('EXECUTIVE_INTERPRETATION').allowedInGuest, true);
      assert.equal(validateGuestWorkspaceBoundary('FINDINGS_INTELLIGENCE').allowedInGuest, true);
      assert.equal(validateGuestWorkspaceBoundary('INFRASTRUCTURE_UNDERSTANDING').allowedInGuest, true);
      assert.equal(validateGuestWorkspaceBoundary('EVIDENCE_INSPECTION').allowedInGuest, true);
      assert.equal(validateGuestWorkspaceBoundary('PROGRESSIVE_INVESTIGATION').allowedInGuest, true);
      assert.equal(validateGuestWorkspaceBoundary('UNDERSTANDING_FRESHNESS').allowedInGuest, true);
      assert.equal(validateGuestWorkspaceBoundary('RELEVANT_SYSTEM_STATES').allowedInGuest, true);
    });

    it('strictly prohibits persistent memory and administrative capabilities in Guest Workspace', () => {
      assert.equal(validateGuestWorkspaceBoundary('PERSISTENT_MEMORY').allowedInGuest, false);
      assert.equal(validateGuestWorkspaceBoundary('HISTORICAL_COMPARISONS').allowedInGuest, false);
      assert.equal(validateGuestWorkspaceBoundary('DOMAIN_MANAGEMENT').allowedInGuest, false);
      assert.equal(validateGuestWorkspaceBoundary('CONTINUOUS_MONITORING').allowedInGuest, false);
      assert.equal(validateGuestWorkspaceBoundary('WORKSPACE_ADMINISTRATION').allowedInGuest, false);
      assert.equal(validateGuestWorkspaceBoundary('ACCOUNT_SETTINGS').allowedInGuest, false);
      assert.equal(validateGuestWorkspaceBoundary('LONG_TERM_INFRASTRUCTURE_HISTORY').allowedInGuest, false);
      assert.equal(validateGuestWorkspaceBoundary('TEAM_COLLABORATION').allowedInGuest, false);
    });

    it('verifies all matrix entries have clear architectural justification', () => {
      WORKSPACE_CAPABILITY_MATRIX.forEach((rule) => {
        assert.ok(rule.label.length > 0);
        assert.ok(rule.reason.length > 10);
      });
    });
  });

  describe('5. Progressive Disclosure Architecture Hierarchy', () => {
    it('defines the strict 7-level progressive disclosure ladder', () => {
      assert.equal(PROGRESSIVE_DISCLOSURE_HIERARCHY.length, 7);
      const levels = PROGRESSIVE_DISCLOSURE_HIERARCHY.map((l) => l.level);
      assert.deepEqual(levels, [
        'DOMAIN',
        'CURRENT_UNDERSTANDING',
        'WHAT_MATTERS',
        'OTHER_OBSERVATIONS',
        'INFRASTRUCTURE',
        'EVIDENCE',
        'DEEP_INVESTIGATION',
      ]);
    });

    it('preserves monotonic cognitive ranks from 1 to 7', () => {
      PROGRESSIVE_DISCLOSURE_HIERARCHY.forEach((step, idx) => {
        assert.equal(step.rank, idx + 1);
        assert.ok(step.title.length > 0);
        assert.ok(step.description.length > 0);
        assert.ok(step.cognitiveObjective.length > 0);
      });
    });
  });

  describe('6. Premium Design & Visual Authority Contract', () => {
    it('specifies explicit required and prohibited rules for all 4 design categories', () => {
      assert.equal(PREMIUM_DESIGN_CONTRACT.length, 4);
      const categories = PREMIUM_DESIGN_CONTRACT.map((r) => r.category);
      assert.deepEqual(categories, [
        'Typography',
        'Color & Surfaces',
        'Motion & Atmosphere',
        'Layout & Hierarchy',
      ]);

      PREMIUM_DESIGN_CONTRACT.forEach((rule) => {
        assert.ok(rule.required.length >= 3);
        assert.ok(rule.prohibited.length >= 3);
      });
    });

    it('explicitly prohibits generic SaaS dashboard, rainbow cards, and AI gimmicks', () => {
      const colorRules = PREMIUM_DESIGN_CONTRACT.find((r) => r.category === 'Color & Surfaces')!;
      assert.ok(colorRules.prohibited.some((p) => p.includes('Rainbow full-card severity fills')));
      assert.ok(colorRules.prohibited.some((p) => p.includes('Generic bright SaaS dashboard styling')));

      const motionRules = PREMIUM_DESIGN_CONTRACT.find((r) => r.category === 'Motion & Atmosphere')!;
      assert.ok(motionRules.prohibited.some((p) => p.includes('AI-looking')));
      assert.ok(motionRules.required.some((r) => r.includes('520ms Nebula Pause')));
    });
  });

  describe('7. SEO & Privacy Security Boundaries', () => {
    it('correctly classifies public indexable routes vs private non-indexable routes', () => {
      assert.equal(evaluateSeoIndexability('/').indexable, true);
      assert.equal(evaluateSeoIndexability('/guest').indexable, true);
      assert.equal(evaluateSeoIndexability('/docs/vision').indexable, true);

      // Private and ephemeral session routes MUST NOT be indexable
      assert.equal(evaluateSeoIndexability('/guest?domain=stripe.com').indexable, false);
      assert.equal(evaluateSeoIndexability('/workspace').indexable, false);
      assert.equal(evaluateSeoIndexability('/workspace/findings').indexable, false);
      assert.equal(evaluateSeoIndexability('/admin/users').indexable, false);
      assert.equal(evaluateSeoIndexability('/settings/profile').indexable, false);
    });

    it('assigns correct meta robots header directives to enforce security boundaries', () => {
      assert.equal(evaluateSeoIndexability('/guest').metaRobotsHeader, 'index, follow');
      assert.equal(evaluateSeoIndexability('/workspace').metaRobotsHeader, 'noindex, nofollow');
      assert.equal(evaluateSeoIndexability('/guest?domain=stripe.com').metaRobotsHeader, 'noindex, nofollow');
    });

    it('verifies the SEO registry covers all 7 core platform surfaces', () => {
      assert.equal(SEO_INDEXABILITY_REGISTRY.length, 7);
      SEO_INDEXABILITY_REGISTRY.forEach((entry) => {
        assert.ok(entry.surface.length > 0);
        assert.ok(entry.pathPattern.length > 0);
        assert.ok(entry.rationale.length > 10);
        assert.ok(entry.securityBoundary.length > 10);
      });
    });
  });

  describe('8. Production Readiness Contract Pillars', () => {
    it('defines all 5 production contract pillars with concrete requirements', () => {
      assert.equal(PRODUCTION_CONTRACT_PILLARS.length, 5);
      const pillarNames = PRODUCTION_CONTRACT_PILLARS.map((p) => p.pillar);
      assert.deepEqual(pillarNames, [
        'Performance',
        'Accessibility',
        'Responsive',
        'Resilience',
        'Security',
      ]);

      PRODUCTION_CONTRACT_PILLARS.forEach((pillar) => {
        assert.ok(pillar.requirements.length >= 4);
      });
    });

    it('verifies resilience pillar accounts for all mandatory system states', () => {
      const resilience = PRODUCTION_CONTRACT_PILLARS.find((p) => p.pillar === 'Resilience')!;
      const reqs = resilience.requirements.join(' ');
      assert.ok(reqs.includes('First-run'));
      assert.ok(reqs.includes('Loading'));
      assert.ok(reqs.includes('Partial results'));
      assert.ok(reqs.includes('Quiet/stable'));
      assert.ok(reqs.includes('Failure'));
      assert.ok(reqs.includes('Retry'));
      assert.ok(reqs.includes('Network interruption'));
    });

    it('verifies security pillar enforces guest isolation and no admin exposure', () => {
      const security = PRODUCTION_CONTRACT_PILLARS.find((p) => p.pillar === 'Security')!;
      const reqs = security.requirements.join(' ');
      assert.ok(reqs.includes('isolation'));
      assert.ok(reqs.includes('Zero sensitive data'));
      assert.ok(reqs.includes('No accidental Workspace privilege'));
      assert.ok(reqs.includes('No Admin surface exposure'));
    });
  });
});
