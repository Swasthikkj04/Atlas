import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_R010_TICKET_ID,
  GX_R010_PHASE,
  GX_R010_STATUS,
  GX_R010_FROZEN_PRINCIPLE,
  GX_R010_CERTIFICATION_GATE_STATEMENT,
  PROGRESSIVE_DISCLOSURE_LADDER,
  GX_R010_CANONICAL_INFRASTRUCTURE_CATEGORY_NAMES,
  GX_R010_INFRASTRUCTURE_SPECS,
  QUIET_STATE_CONTRACT,
  CANONICAL_INVESTIGATION_CTA,
  PROHIBITED_INVESTIGATION_CTAS,
  ANTI_FABRICATION_INVARIANTS,
  EXPLICITLY_REJECTED_INTELLIGENCE_PATTERNS,
  validateMeaningfulIntelligence,
  verifyGXR010CertificationGate,
} from './gx-r010-meaningful-intelligence.contract.ts';

describe('GX-R010: First Meaningful Intelligence & Progressive Disclosure Contract', () => {
  describe('1. Canonical Metadata & Principles', () => {
    it('defines ticket metadata and status', () => {
      assert.equal(GX_R010_TICKET_ID, 'GX-R010');
      assert.equal(GX_R010_PHASE, 'Guest Experience Redesign');
      assert.equal(GX_R010_STATUS, 'FROZEN_INTELLIGENCE_DISCLOSURE_CONTRACT');
    });

    it('embodies the frozen disclosure principle', () => {
      assert.equal(GX_R010_FROZEN_PRINCIPLE, 'Meaning before detail.');
    });

    it('passes the 🔒 GX-R010 Certification Gate with canonical statement', () => {
      const statement =
        'A guest immediately understands what Nebula has learned about the domain, why it matters, and where to look next — without being overwhelmed by raw observations.';
      const result = verifyGXR010CertificationGate(statement);

      assert.equal(result.passed, true);
      assert.equal(result.canonicalStatement, GX_R010_CERTIFICATION_GATE_STATEMENT);
      assert.equal(result.similarityRatio, 1);
    });

    it('rejects an invalid statement proposing a sales funnel lock wall', () => {
      const statement = 'A marketing sales funnel locking full reports behind an account upgrade wall.';
      const result = verifyGXR010CertificationGate(statement);

      assert.equal(result.passed, false);
      assert.ok(result.similarityRatio < 0.4);
    });
  });

  describe('2. Six-Level Progressive Disclosure Ladder', () => {
    it('defines 6 unbroken levels from 0 to 5', () => {
      assert.equal(PROGRESSIVE_DISCLOSURE_LADDER.length, 6);
      PROGRESSIVE_DISCLOSURE_LADDER.forEach((lvl, idx) => {
        assert.equal(lvl.level, idx);
        assert.ok(lvl.keySurfaces.length > 0);
        assert.ok(lvl.cognitivePurpose.length > 10);
      });
    });

    it('places Level 1 Meaning before Level 5 Deep Investigation', () => {
      const level1 = PROGRESSIVE_DISCLOSURE_LADDER.find((l) => l.level === 1);
      const level5 = PROGRESSIVE_DISCLOSURE_LADDER.find((l) => l.level === 5);

      assert.ok(level1?.name.includes('Meaning'));
      assert.ok(level5?.name.includes('Investigation'));
    });
  });

  describe('3. Eight Canonical Infrastructure Categories', () => {
    it('contains exactly the 8 canonical categories defined in GX-R002', () => {
      assert.equal(GX_R010_CANONICAL_INFRASTRUCTURE_CATEGORY_NAMES.length, 8);
      assert.deepEqual(
        GX_R010_INFRASTRUCTURE_SPECS.map((c) => c.category),
        GX_R010_CANONICAL_INFRASTRUCTURE_CATEGORY_NAMES as any
      );
    });
  });

  describe('4. Quiet & Healthy State Contracts', () => {
    it('defines calm headline and prohibited artificial alarms', () => {
      assert.equal(QUIET_STATE_CONTRACT.primaryHeadline, 'Infrastructure appears stable.');
      assert.equal(QUIET_STATE_CONTRACT.prohibitedActions.length, 3);
      assert.ok(
        QUIET_STATE_CONTRACT.prohibitedActions.some((a) =>
          a.includes('Manufacturing artificial warnings')
        )
      );
    });
  });

  describe('5. Contextual Investigation CTA', () => {
    it('enforces "Understand why →" as canonical action', () => {
      assert.equal(CANONICAL_INVESTIGATION_CTA, 'Understand why →');
    });

    it('rejects generic scanner and report CTAs', () => {
      assert.ok(PROHIBITED_INVESTIGATION_CTAS.includes('View Details'));
      assert.ok(PROHIBITED_INVESTIGATION_CTAS.includes('See Full Report'));
      assert.ok(PROHIBITED_INVESTIGATION_CTAS.includes('Upgrade to Inspect'));
    });
  });

  describe('6. Anti-Fabrication Invariants', () => {
    it('prohibits LLM/UI synthesized hallucinations and arbitrary security scores', () => {
      assert.equal(ANTI_FABRICATION_INVARIANTS.length, 5);
      assert.ok(ANTI_FABRICATION_INVARIANTS.some((i) => i.includes('canonical Executive Brief')));
      assert.ok(ANTI_FABRICATION_INVARIANTS.some((i) => i.includes('numerical posture scores')));
    });
  });

  describe('7. Ten Explicitly Rejected Anti-Patterns', () => {
    it('enumerates all 10 rejected patterns', () => {
      assert.equal(EXPLICITLY_REJECTED_INTELLIGENCE_PATTERNS.length, 10);
      assert.ok(EXPLICITLY_REJECTED_INTELLIGENCE_PATTERNS.some((p) => p.includes('KPI dashboard wall')));
      assert.ok(EXPLICITLY_REJECTED_INTELLIGENCE_PATTERNS.some((p) => p.includes('Scan report check count')));
      assert.ok(EXPLICITLY_REJECTED_INTELLIGENCE_PATTERNS.some((p) => p.includes('Security sales funnel')));
      assert.ok(EXPLICITLY_REJECTED_INTELLIGENCE_PATTERNS.some((p) => p.includes('Evidence-first presentation')));
      assert.ok(EXPLICITLY_REJECTED_INTELLIGENCE_PATTERNS.some((p) => p.includes('Workspace lock wall')));
    });
  });

  describe('8. Meaningful Intelligence Configuration Validator', () => {
    it('validates a compliant intelligence configuration', () => {
      const result = validateMeaningfulIntelligence({
        hasKpiWall: false,
        hasScanReportCounters: false,
        hasSalesFunnelUpgradeWall: false,
        isEvidenceFirst: false,
        hasAiTheaterGimmick: false,
        hasArtificialSeverity: false,
        hasInfiniteScroll: false,
        hasLockWall: false,
        usesCanonicalExecutiveBrief: true,
        meaningPrecedesEvidence: true,
        exposesAllEightCategories: true,
        preservesContextOnDrawerClose: true,
        supportsQuietHealthyState: true,
      });

      assert.equal(result.valid, true);
      assert.equal(result.violation, undefined);
    });

    it('rejects evidence-first layouts', () => {
      const result = validateMeaningfulIntelligence({
        hasKpiWall: false,
        hasScanReportCounters: false,
        hasSalesFunnelUpgradeWall: false,
        isEvidenceFirst: true,
        hasAiTheaterGimmick: false,
        hasArtificialSeverity: false,
        hasInfiniteScroll: false,
        hasLockWall: false,
        usesCanonicalExecutiveBrief: true,
        meaningPrecedesEvidence: false,
        exposesAllEightCategories: true,
        preservesContextOnDrawerClose: true,
        supportsQuietHealthyState: true,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Meaning before detail'));
    });

    it('rejects workspace lock walls', () => {
      const result = validateMeaningfulIntelligence({
        hasKpiWall: false,
        hasScanReportCounters: false,
        hasSalesFunnelUpgradeWall: true,
        isEvidenceFirst: false,
        hasAiTheaterGimmick: false,
        hasArtificialSeverity: false,
        hasInfiniteScroll: false,
        hasLockWall: true,
        usesCanonicalExecutiveBrief: true,
        meaningPrecedesEvidence: true,
        exposesAllEightCategories: true,
        preservesContextOnDrawerClose: true,
        supportsQuietHealthyState: true,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Forced upgrade lock walls'));
    });
  });
});
