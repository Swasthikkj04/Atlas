import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_R005_TICKET_ID,
  GX_R005_PHASE,
  GX_R005_STATUS,
  GX_R005_CORE_OBJECTIVE,
  GX_R005_FROZEN_STATEMENT,
  GX_R005_SUPPORTING_STATEMENT,
  GX_R005_TRUST_CONTEXT,
  GX_R005_PRODUCT_SIGNATURE,
  GX_R005_RESPONSIVE_INVARIANT,
  GX_R005_CERTIFICATION_GATE_STATEMENT,
  IDLE_CANVAS_ZONES,
  VISUAL_WEIGHT_DISTRIBUTION,
  CANONICAL_SAMPLE_DOMAINS,
  IDLE_VIEWPORT_TIERS,
  EXPLICITLY_REJECTED_IDLE_PATTERNS,
  validateIdleCanvasComposition,
  verifyGXR005CertificationGate,
} from './gx-r005-idle-canvas.contract.ts';

describe('GX-R005: Idle Canvas Composition Contract', () => {
  describe('1. Canonical Metadata & Statements', () => {
    it('defines the canonical ticket metadata and status', () => {
      assert.equal(GX_R005_TICKET_ID, 'GX-R005');
      assert.equal(GX_R005_PHASE, 'Guest Experience Redesign');
      assert.equal(GX_R005_STATUS, 'FROZEN_IDLE_COMPOSITION');
    });

    it('embodies the core objective and authoritative statements', () => {
      assert.equal(GX_R005_CORE_OBJECTIVE, 'Nebula is ready to understand infrastructure.');
      assert.equal(
        GX_R005_FROZEN_STATEMENT,
        'Infrastructure intelligence begins with understanding.'
      );
      assert.equal(
        GX_R005_SUPPORTING_STATEMENT,
        'Enter a domain. Nebula will build its current understanding.'
      );
      assert.equal(GX_R005_TRUST_CONTEXT, 'Current intelligence · No account required');
      assert.equal(
        GX_R005_PRODUCT_SIGNATURE,
        'Intelligence before data · Context before details · Summary before evidence'
      );
      assert.equal(
        GX_R005_RESPONSIVE_INVARIANT,
        'The guest must always understand what Nebula is, what they should enter, and what happens next.'
      );
    });

    it('passes the 🔒 GX-R005 Certification Gate with canonical statement', () => {
      const statement =
        'The idle Guest Workspace canvas establishes a viewport-bounded spatial composition where identity, intelligence statement, domain intent input, trust context, and product signature fit completely within the initial view without requiring scrolling.';
      const result = verifyGXR005CertificationGate(statement);

      assert.equal(result.passed, true);
      assert.equal(result.canonicalStatement, GX_R005_CERTIFICATION_GATE_STATEMENT);
      assert.equal(result.coreObjective, GX_R005_CORE_OBJECTIVE);
      assert.equal(result.similarityRatio, 1);
    });

    it('rejects an invalid statement that treats idle canvas as an uncontained landing page', () => {
      const statement = 'A multi-page landing site requiring the user to scroll through feature cards and reviews.';
      const result = verifyGXR005CertificationGate(statement);

      assert.equal(result.passed, false);
      assert.ok(result.similarityRatio < 0.4);
    });
  });

  describe('2. Five Spatial Hierarchy Zones', () => {
    it('defines exactly the 5 canonical spatial zones in order from A to E', () => {
      assert.equal(IDLE_CANVAS_ZONES.length, 5);
      const letters = IDLE_CANVAS_ZONES.map((z) => z.zoneLetter);
      assert.deepEqual(letters, ['A', 'B', 'C', 'D', 'E']);

      const zoneIds = IDLE_CANVAS_ZONES.map((z) => z.zoneId);
      assert.deepEqual(zoneIds, [
        'ZONE_A_IDENTITY',
        'ZONE_B_INTELLIGENCE_STATEMENT',
        'ZONE_C_DOMAIN_INTENT',
        'ZONE_D_QUIET_CONTEXT',
        'ZONE_E_PRODUCT_SIGNATURE',
      ]);
    });

    it('specifies explicit visual roles and prohibited elements for each zone', () => {
      IDLE_CANVAS_ZONES.forEach((zone) => {
        assert.ok(zone.name.length > 0);
        assert.ok(zone.contentSpecification.length > 0);
        assert.ok(zone.visualRole.length > 0);
        assert.ok(zone.prohibitedElements.length >= 3);
      });
    });

    it('identifies Zone C (Domain Intent) as the primary interactive destination', () => {
      const zoneC = IDLE_CANVAS_ZONES.find((z) => z.zoneId === 'ZONE_C_DOMAIN_INTENT')!;
      assert.ok(zoneC.visualRole.includes('primary interactive destination'));
    });
  });

  describe('3. Visual Weight Distribution Pipeline', () => {
    it('maintains the strict visual weight hierarchy', () => {
      assert.deepEqual(VISUAL_WEIGHT_DISTRIBUTION, [
        'INTELLIGENCE',
        'DOMAIN_INTENT',
        'ACTION',
        'TRUST_CONTEXT',
        'PRODUCT_SIGNATURE',
      ]);
    });
  });

  describe('4. Canonical Sample Domain Shortcuts', () => {
    it('defines exactly the 3 canonical sample domains with architectural roles', () => {
      assert.equal(CANONICAL_SAMPLE_DOMAINS.length, 3);
      const domains = CANONICAL_SAMPLE_DOMAINS.map((s) => s.domain);
      assert.deepEqual(domains, ['stripe.com', 'github.com', 'cloudflare.com']);
    });

    it('categorizes every sample domain accurately', () => {
      CANONICAL_SAMPLE_DOMAINS.forEach((sample) => {
        assert.ok(sample.purpose.length > 20);
        assert.ok(['Payment Infrastructure', 'Developer Platform', 'Edge Network'].includes(sample.category));
      });
    });
  });

  describe('5. Viewport Adaptation & Zero-Scroll Guarantee', () => {
    it('guarantees zero scroll required across all 4 device tiers', () => {
      assert.equal(IDLE_VIEWPORT_TIERS.length, 4);
      IDLE_VIEWPORT_TIERS.forEach((tier) => {
        assert.equal(
          tier.scrollRequired,
          false,
          `Tier ${tier.tier} must not require scrolling for initial interaction`
        );
        assert.ok(tier.layoutComposition.length > 20);
      });
    });
  });

  describe('6. Explicitly Rejected Idle Canvas Patterns (12 Items)', () => {
    it('codifies and rejects all 12 idle canvas anti-patterns', () => {
      assert.equal(EXPLICITLY_REJECTED_IDLE_PATTERNS.length, 12);
      assert.ok(EXPLICITLY_REJECTED_IDLE_PATTERNS.includes('Infinite landing-page scroll'));
      assert.ok(EXPLICITLY_REJECTED_IDLE_PATTERNS.includes('Marketing feature grids with cards'));
      assert.ok(EXPLICITLY_REJECTED_IDLE_PATTERNS.includes('Pricing sections and tier comparison tables'));
      assert.ok(EXPLICITLY_REJECTED_IDLE_PATTERNS.includes('Customer testimonials and review quotes'));
      assert.ok(EXPLICITLY_REJECTED_IDLE_PATTERNS.includes('Signup-first or email-gate architecture'));
      assert.ok(EXPLICITLY_REJECTED_IDLE_PATTERNS.includes('Fake intelligence previews or mocked scan graphs'));
    });
  });

  describe('7. Idle Canvas Invariant Validators', () => {
    it('passes compliant idle canvas composition', () => {
      const result = validateIdleCanvasComposition({
        zonesPresent: [
          'ZONE_A_IDENTITY',
          'ZONE_B_INTELLIGENCE_STATEMENT',
          'ZONE_C_DOMAIN_INTENT',
          'ZONE_D_QUIET_CONTEXT',
          'ZONE_E_PRODUCT_SIGNATURE',
        ],
        requiresScrollForPrimaryInteraction: false,
        containsMarketingFeatureGrid: false,
        containsForcedRegistrationGate: false,
        sampleDomainsAreOptional: true,
      });

      assert.equal(result.valid, true);
      assert.equal(result.violation, undefined);
    });

    it('rejects composition that requires scrolling for primary interaction', () => {
      const result = validateIdleCanvasComposition({
        zonesPresent: [
          'ZONE_A_IDENTITY',
          'ZONE_B_INTELLIGENCE_STATEMENT',
          'ZONE_C_DOMAIN_INTENT',
          'ZONE_D_QUIET_CONTEXT',
          'ZONE_E_PRODUCT_SIGNATURE',
        ],
        requiresScrollForPrimaryInteraction: true,
        containsMarketingFeatureGrid: false,
        containsForcedRegistrationGate: false,
        sampleDomainsAreOptional: true,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Primary interaction must be completely visible without scrolling'));
    });

    it('rejects composition with marketing feature grids', () => {
      const result = validateIdleCanvasComposition({
        zonesPresent: [
          'ZONE_A_IDENTITY',
          'ZONE_B_INTELLIGENCE_STATEMENT',
          'ZONE_C_DOMAIN_INTENT',
          'ZONE_D_QUIET_CONTEXT',
          'ZONE_E_PRODUCT_SIGNATURE',
        ],
        requiresScrollForPrimaryInteraction: false,
        containsMarketingFeatureGrid: true,
        containsForcedRegistrationGate: false,
        sampleDomainsAreOptional: true,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Feature grids, testimonials, or pricing tables are strictly prohibited'));
    });
  });
});
