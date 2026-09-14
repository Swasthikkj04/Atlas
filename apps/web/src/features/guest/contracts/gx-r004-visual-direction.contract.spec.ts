import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_R004_TICKET_ID,
  GX_R004_PHASE,
  GX_R004_STATUS,
  GX_R004_FROZEN_VISUAL_PRINCIPLE,
  GX_R004_MOTION_CANONICAL_PRINCIPLE,
  GX_R004_ATMOSPHERE_PRINCIPLE,
  GX_R004_CERTIFICATION_GATE_STATEMENT,
  VISUAL_PERSONALITY_TRAITS,
  TYPOGRAPHY_LAYERS,
  SURFACE_LEVELS,
  SEMANTIC_SEVERITY_MAPPING,
  CANONICAL_MICROCOPY_PAIRS,
  EXPLICITLY_REJECTED_VISUAL_DIRECTIONS,
  validateVisualDirectionCompliance,
  verifyGXR004CertificationGate,
} from './gx-r004-visual-direction.contract.ts';

describe('GX-R004: First Impression Visual Direction Contract', () => {
  describe('1. Canonical Principles & Certification Gate', () => {
    it('defines the canonical ticket metadata and status', () => {
      assert.equal(GX_R004_TICKET_ID, 'GX-R004');
      assert.equal(GX_R004_PHASE, 'Guest Experience Redesign');
      assert.equal(GX_R004_STATUS, 'FROZEN_VISUAL_DIRECTION');
    });

    it('embodies the frozen visual principle, motion principle, and atmosphere principle', () => {
      assert.equal(
        GX_R004_FROZEN_VISUAL_PRINCIPLE,
        'Nebula should look like an intelligence product, not a marketing website.'
      );
      assert.equal(
        GX_R004_MOTION_CANONICAL_PRINCIPLE,
        'Motion should be noticed only when it improves understanding.'
      );
      assert.equal(
        GX_R004_ATMOSPHERE_PRINCIPLE,
        'Atmosphere establishes identity. Intelligence establishes value.'
      );
    });

    it('passes the 🔒 GX-R004 Certification Gate with canonical statement', () => {
      const statement =
        'Nebula feels immediately credible, intelligent, calm, and premium through typographic authority, spatial air, and material restraint before the guest has even entered a domain.';
      const result = verifyGXR004CertificationGate(statement);

      assert.equal(result.passed, true);
      assert.equal(result.canonicalStatement, GX_R004_CERTIFICATION_GATE_STATEMENT);
      assert.equal(result.frozenPrinciple, GX_R004_FROZEN_VISUAL_PRINCIPLE);
      assert.equal(result.similarityRatio, 1);
    });

    it('rejects an invalid statement attempting to use a marketing SaaS pattern', () => {
      const statement = 'Nebula presents an energetic hero section with flashing badges and upgrade CTAs.';
      const result = verifyGXR004CertificationGate(statement);

      assert.equal(result.passed, false);
      assert.ok(result.similarityRatio < 0.4);
    });
  });

  describe('2. Visual Personality (5 Core Characteristics)', () => {
    it('defines all 5 personality characteristics', () => {
      assert.equal(VISUAL_PERSONALITY_TRAITS.length, 5);
      const traits = VISUAL_PERSONALITY_TRAITS.map((t) => t.trait);
      assert.deepEqual(traits, ['Calm', 'Confident', 'Intelligent', 'Technical', 'Premium']);
    });

    it('associates concrete expressions and practical requirements with every trait', () => {
      VISUAL_PERSONALITY_TRAITS.forEach((t) => {
        assert.ok(t.expression.length > 15);
        assert.ok(t.practicalRequirement.length > 15);
      });
    });
  });

  describe('3. Typography Architecture (3 Semantic Layers)', () => {
    it('defines exactly the 3 typography layers: Narrative, Interface, Technical', () => {
      assert.equal(TYPOGRAPHY_LAYERS.length, 3);
      const layers = TYPOGRAPHY_LAYERS.map((l) => l.layerId);
      assert.deepEqual(layers, ['NARRATIVE', 'INTERFACE', 'TECHNICAL']);
    });

    it('assigns appropriate fonts and application roles to each layer', () => {
      const narrative = TYPOGRAPHY_LAYERS.find((l) => l.layerId === 'NARRATIVE')!;
      assert.ok(narrative.fontRole.includes('Serif'));
      assert.ok(narrative.familyToken.includes('serif'));
      assert.ok(narrative.applicationSurfaces.includes('Executive editorial narrative'));

      const iface = TYPOGRAPHY_LAYERS.find((l) => l.layerId === 'INTERFACE')!;
      assert.ok(iface.fontRole.includes('Sans'));
      assert.ok(iface.applicationSurfaces.includes('Action buttons'));

      const tech = TYPOGRAPHY_LAYERS.find((l) => l.layerId === 'TECHNICAL')!;
      assert.ok(tech.fontRole.includes('Monospace'));
      assert.ok(tech.applicationSurfaces.includes('Domain FQDNs'));
    });
  });

  describe('4. Three-Level Surface Language (Canvas → Surface → Detail)', () => {
    it('defines exactly the 3 surface levels', () => {
      assert.equal(SURFACE_LEVELS.length, 3);
      const levelIds = SURFACE_LEVELS.map((s) => s.levelId);
      assert.deepEqual(levelIds, ['LEVEL_1_CANVAS', 'LEVEL_2_SURFACE', 'LEVEL_3_DETAIL']);
    });

    it('rejects card-everything sprawl in favor of distinct spatial roles', () => {
      const canvas = SURFACE_LEVELS.find((s) => s.levelId === 'LEVEL_1_CANVAS')!;
      assert.ok(canvas.containerCharacteristics.includes('Frameless or subtle tonal boundary'));

      const surface = SURFACE_LEVELS.find((s) => s.levelId === 'LEVEL_2_SURFACE')!;
      assert.ok(surface.containerCharacteristics.includes('Hairline border'));

      const detail = SURFACE_LEVELS.find((s) => s.levelId === 'LEVEL_3_DETAIL')!;
      assert.ok(detail.containerCharacteristics.includes('Slide-over drawer'));
    });
  });

  describe('5. Semantic Color Treatment & Restrained Severity', () => {
    it('defines all 5 semantic severity levels', () => {
      assert.equal(SEMANTIC_SEVERITY_MAPPING.length, 5);
      const levels = SEMANTIC_SEVERITY_MAPPING.map((s) => s.level);
      assert.deepEqual(levels, ['NORMAL', 'INFORMATION', 'ATTENTION', 'CRITICAL', 'SUCCESS']);
    });

    it('mandates textual labels for all severity states to guarantee accessibility', () => {
      SEMANTIC_SEVERITY_MAPPING.forEach((spec) => {
        assert.ok(spec.textualRequirement.includes('Explicitly labeled'));
        assert.ok(spec.backgroundOpacity.length > 0);
      });
    });
  });

  describe('6. Microcopy Guidelines & Action Vocabulary', () => {
    it('defines canonical microcopy pairs replacing marketing buzzwords', () => {
      assert.equal(CANONICAL_MICROCOPY_PAIRS.length, 5);

      const action = CANONICAL_MICROCOPY_PAIRS.find((p) => p.intent === 'Primary Action Trigger')!;
      assert.equal(action.preferredCopy, 'Understand →');

      const invest = CANONICAL_MICROCOPY_PAIRS.find((p) => p.intent === 'Investigation Trigger')!;
      assert.equal(invest.preferredCopy, 'Understand why →');

      const cont = CANONICAL_MICROCOPY_PAIRS.find((p) => p.intent === 'Continuity Trigger')!;
      assert.equal(cont.preferredCopy, 'Keep this understanding →');
    });
  });

  describe('7. Explicitly Rejected Visual Directions (12 Directions)', () => {
    it('codifies and rejects all 12 visual anti-patterns', () => {
      assert.equal(EXPLICITLY_REJECTED_VISUAL_DIRECTIONS.length, 12);
      assert.ok(EXPLICITLY_REJECTED_VISUAL_DIRECTIONS.includes('Generic SaaS marketing gradients and multi-color hero blobs'));
      assert.ok(EXPLICITLY_REJECTED_VISUAL_DIRECTIONS.includes('AI sparkle aesthetics (stars, magic wands, purple particle clouds)'));
      assert.ok(EXPLICITLY_REJECTED_VISUAL_DIRECTIONS.includes('Neon cyberpunk palettes and high-contrast glowing borders'));
      assert.ok(EXPLICITLY_REJECTED_VISUAL_DIRECTIONS.includes('Card-everything layouts with nested rounded cards'));
    });
  });

  describe('8. Visual Direction Invariant Validators', () => {
    it('passes compliant visual direction configuration', () => {
      const result = validateVisualDirectionCompliance({
        usesThreeLayerTypography: true,
        usesThreeLevelSurfaces: true,
        avoidsCardEverythingSprawl: true,
        preservesColorAccessibility: true,
        reusesNebulaDesignTokens: true,
      });

      assert.equal(result.valid, true);
      assert.equal(result.violation, undefined);
    });

    it('rejects layout lacking 3-layer typography', () => {
      const result = validateVisualDirectionCompliance({
        usesThreeLayerTypography: false,
        usesThreeLevelSurfaces: true,
        avoidsCardEverythingSprawl: true,
        preservesColorAccessibility: true,
        reusesNebulaDesignTokens: true,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Must use 3-layer typography'));
    });

    it('rejects layout creating parallel design system', () => {
      const result = validateVisualDirectionCompliance({
        usesThreeLayerTypography: true,
        usesThreeLevelSurfaces: true,
        avoidsCardEverythingSprawl: true,
        preservesColorAccessibility: true,
        reusesNebulaDesignTokens: false,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Must reuse canonical Nebula design tokens'));
    });
  });
});
