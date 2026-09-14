import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_R012_TICKET_ID,
  GX_R012_PHASE,
  GX_R012_STATUS,
  GX_R012_PRIMARY_PRINCIPLE,
  GX_R012_FROZEN_PRINCIPLES,
  GX_R012_ACCEPTANCE_GATE_STATEMENT,
  GX_R012_CERTIFICATION_GATE_STATEMENT,
  MAX_GUEST_DISCLOSURE_DEPTH,
  MIN_GUEST_DISCLOSURE_DEPTH,
  CANONICAL_SEVEN_LEVEL_DISCLOSURE_LADDER,
  formatSpatialAnchor,
  evaluateDisclosureTrigger,
  deriveContextualNextIntelligence,
  enforceDisclosureSecurityBoundary,
  GX_R012_INVARIANTS,
  GX_R012_REJECTED_PATTERNS,
  validateDisclosureBoundaryConfig,
  verifyGXR012CertificationGate,
} from './gx-r012-disclosure-boundary.contract.ts';

describe('GX-R012: Next Intelligence & Disclosure Boundary Contract', () => {
  describe('1. Canonical Metadata & Acceptance Gate', () => {
    it('defines ticket metadata and status', () => {
      assert.equal(GX_R012_TICKET_ID, 'GX-R012');
      assert.equal(GX_R012_PHASE, 'Guest Experience Architecture');
      assert.equal(GX_R012_STATUS, 'FROZEN_DISCLOSURE_BOUNDARY_CONTRACT');
    });

    it('embodies the frozen principles', () => {
      assert.equal(
        GX_R012_PRIMARY_PRINCIPLE,
        'Reveal the next layer only when the current layer has earned it.'
      );
      assert.ok(
        GX_R012_FROZEN_PRINCIPLES.includes(
          'Reveal depth, never overwhelm. Deeper understanding must never mean broader access.'
        )
      );
    });

    it('passes the 🔒 GX-R012 Certification Gate with canonical statement', () => {
      const result = verifyGXR012CertificationGate(GX_R012_CERTIFICATION_GATE_STATEMENT);
      assert.equal(result.passed, true);
      assert.equal(result.canonicalStatement, GX_R012_CERTIFICATION_GATE_STATEMENT);
      assert.equal(result.similarityRatio, 1);
    });

    it('rejects a statement promoting artificial paywalls or unearned disclosure', () => {
      const statement = 'Unlock all 500 vulnerability scanner records by paying $99 to upgrade.';
      const result = verifyGXR012CertificationGate(statement);
      assert.equal(result.passed, false);
      assert.ok(result.similarityRatio < 0.35);
    });

    it('verifies acceptance gate demonstrated truth statement is defined', () => {
      assert.ok(GX_R012_ACCEPTANCE_GATE_STATEMENT.includes('without being overwhelmed'));
      assert.ok(GX_R012_ACCEPTANCE_GATE_STATEMENT.includes('losing spatial context'));
      assert.ok(GX_R012_ACCEPTANCE_GATE_STATEMENT.includes('crossing into authenticated Workspace state'));
    });
  });

  describe('2. Canonical 7-Level Progressive Disclosure Ladder', () => {
    it('defines an unbroken sequence from Level 0 to Level 6', () => {
      assert.equal(CANONICAL_SEVEN_LEVEL_DISCLOSURE_LADDER.length, 7);
      assert.equal(MIN_GUEST_DISCLOSURE_DEPTH, 0);
      assert.equal(MAX_GUEST_DISCLOSURE_DEPTH, 6);

      CANONICAL_SEVEN_LEVEL_DISCLOSURE_LADDER.forEach((levelObj, index) => {
        assert.equal(levelObj.level, index);
        assert.ok(levelObj.name.length > 0);
        assert.ok(levelObj.cognitiveQuestion.length > 0);
        assert.ok(levelObj.purpose.length > 0);
        assert.ok(levelObj.keySurfaces.length > 0);
        assert.equal(levelObj.isBounded, true);
      });
    });

    it('establishes canonical cognitive question for each level', () => {
      assert.equal(CANONICAL_SEVEN_LEVEL_DISCLOSURE_LADDER[0].cognitiveQuestion, 'Where am I?');
      assert.equal(CANONICAL_SEVEN_LEVEL_DISCLOSURE_LADDER[1].cognitiveQuestion, 'What has Nebula understood?');
      assert.equal(CANONICAL_SEVEN_LEVEL_DISCLOSURE_LADDER[2].cognitiveQuestion, 'What deserves attention?');
      assert.equal(CANONICAL_SEVEN_LEVEL_DISCLOSURE_LADDER[3].cognitiveQuestion, 'How does the infrastructure relate?');
      assert.equal(CANONICAL_SEVEN_LEVEL_DISCLOSURE_LADDER[4].cognitiveQuestion, 'What supports this understanding?');
      assert.equal(CANONICAL_SEVEN_LEVEL_DISCLOSURE_LADDER[5].cognitiveQuestion, 'Why does this observation exist?');
      assert.equal(CANONICAL_SEVEN_LEVEL_DISCLOSURE_LADDER[6].cognitiveQuestion, 'What else can Nebula meaningfully explain?');
    });
  });

  describe('3. Context Preservation & Spatial Domain Anchor', () => {
    it('formats persistent spatial domain anchor consistently', () => {
      assert.equal(formatSpatialAnchor('example.com'), 'UNDERSTANDING · example.com');
      assert.equal(formatSpatialAnchor('  ACME.IO  '), 'UNDERSTANDING · acme.io');
      assert.equal(formatSpatialAnchor('api.production.app'), 'UNDERSTANDING · api.production.app');
    });
  });

  describe('4. Disclosure Trigger Rules & Eligibility Engine', () => {
    it('grants disclosure eligibility when meaning is complete, evidence exists, and new insight is added', () => {
      const evaluation = evaluateDisclosureTrigger({
        meaningComplete: true,
        evidenceExists: true,
        rawEvidenceCount: 3,
        addsGenuineInsight: true,
        targetLevel: 3,
      });

      assert.equal(evaluation.eligible, true);
      assert.ok(evaluation.reason.includes('Current layer has earned next layer disclosure'));
    });

    it('rejects disclosure when current layer meaning is incomplete', () => {
      const evaluation = evaluateDisclosureTrigger({
        meaningComplete: false,
        evidenceExists: true,
        rawEvidenceCount: 5,
        addsGenuineInsight: true,
        targetLevel: 2,
      });

      assert.equal(evaluation.eligible, false);
      assert.ok(evaluation.reason.includes('meaning must be complete'));
    });

    it('rejects disclosure when backend evidence is missing or zero', () => {
      const evaluation = evaluateDisclosureTrigger({
        meaningComplete: true,
        evidenceExists: false,
        rawEvidenceCount: 0,
        addsGenuineInsight: true,
        targetLevel: 4,
      });

      assert.equal(evaluation.eligible, false);
      assert.ok(evaluation.reason.includes('Backend evidence is required'));
    });

    it('rejects disclosure when next layer is repetitive with no genuine insight', () => {
      const evaluation = evaluateDisclosureTrigger({
        meaningComplete: true,
        evidenceExists: true,
        rawEvidenceCount: 2,
        addsGenuineInsight: false,
        targetLevel: 3,
      });

      assert.equal(evaluation.eligible, false);
      assert.ok(evaluation.reason.includes('genuine architectural insight'));
    });

    it('rejects disclosure when target level exceeds maximum bounded depth (Level 6)', () => {
      const evaluation = evaluateDisclosureTrigger({
        meaningComplete: true,
        evidenceExists: true,
        rawEvidenceCount: 10,
        addsGenuineInsight: true,
        targetLevel: 7,
      });

      assert.equal(evaluation.eligible, false);
      assert.ok(evaluation.reason.includes('exceeds maximum guest boundary depth (6)'));
    });
  });

  describe('5. Contextual Next Intelligence Derivation', () => {
    it('derives descriptive edge doorway with non-generic CTA', () => {
      const doorway = deriveContextualNextIntelligence('Edge', {
        evidenceCount: 4,
        briefComplete: true,
      });

      assert.ok(doorway !== null);
      assert.equal(doorway?.doorwayId, 'doorway-edge-ingress');
      assert.equal(doorway?.sourceCategory, 'Edge');
      assert.equal(doorway?.ctaText, 'Explore edge architecture →');
      assert.equal(doorway?.targetLevel, 6);
      assert.equal(doorway?.evidenceCount, 4);
    });

    it('derives descriptive TLS doorway with certificate lineage focus', () => {
      const doorway = deriveContextualNextIntelligence('TLS', {
        evidenceCount: 2,
        briefComplete: true,
      });

      assert.ok(doorway !== null);
      assert.equal(doorway?.doorwayId, 'doorway-tls-trust');
      assert.equal(doorway?.ctaText, 'Explore certificate lineage →');
    });

    it('derives descriptive DNS doorway with routing matrix focus', () => {
      const doorway = deriveContextualNextIntelligence('DNS', {
        evidenceCount: 3,
        briefComplete: true,
      });

      assert.ok(doorway !== null);
      assert.equal(doorway?.doorwayId, 'doorway-dns-routing');
      assert.equal(doorway?.ctaText, 'Explore DNS routing matrix →');
    });

    it('returns null when brief is incomplete or evidence count is zero', () => {
      const doorwayIncomplete = deriveContextualNextIntelligence('Edge', {
        evidenceCount: 3,
        briefComplete: false,
      });
      assert.equal(doorwayIncomplete, null);

      const doorwayNoEvidence = deriveContextualNextIntelligence('Edge', {
        evidenceCount: 0,
        briefComplete: true,
      });
      assert.equal(doorwayNoEvidence, null);
    });
  });

  describe('6. Security Boundary Enforcement & GX/WX Isolation', () => {
    it('permits valid guest disclosure within bounded limits', () => {
      const audit = enforceDisclosureSecurityBoundary({
        requestedLevel: 4,
        sessionType: 'GUEST',
        targetPath: '/guest',
      });

      assert.equal(audit.permitted, true);
    });

    it('blocks disclosure requests exceeding Level 6', () => {
      const audit = enforceDisclosureSecurityBoundary({
        requestedLevel: 8,
        sessionType: 'GUEST',
      });

      assert.equal(audit.permitted, false);
      assert.ok(audit.violation?.includes('exceeds maximum guest boundary depth (6)'));
    });

    it('blocks navigation bridging into authenticated Workspace routes', () => {
      const audit = enforceDisclosureSecurityBoundary({
        requestedLevel: 3,
        sessionType: 'GUEST',
        targetPath: '/workspace/findings/detail',
      });

      assert.equal(audit.permitted, false);
      assert.ok(audit.violation?.includes('cannot bridge into authenticated Workspace'));
    });

    it('blocks authenticated users on /guest from auto-crossing into private WX resources', () => {
      const audit = enforceDisclosureSecurityBoundary({
        requestedLevel: 5,
        sessionType: 'AUTHENTICATED',
        targetPath: '/workspace/private/snapshots',
        targetResource: 'workspace_private_audit',
      });

      assert.equal(audit.permitted, false);
      assert.ok(audit.violation?.includes('cannot bridge into authenticated Workspace') || audit.violation?.includes('visiting /guest cannot receive private Workspace'));
    });
  });

  describe('7. Ten Core Invariants & Anti-Patterns Validation', () => {
    it('verifies all 10 core invariants are established', () => {
      assert.equal(GX_R012_INVARIANTS.length, 10);
      assert.ok(GX_R012_INVARIANTS.some((i) => i.includes('GX-R012-I01 — Meaningful Progression')));
      assert.ok(GX_R012_INVARIANTS.some((i) => i.includes('GX-R012-I05 — No Privilege Escalation')));
      assert.ok(GX_R012_INVARIANTS.some((i) => i.includes('GX-R012-I06 — Bounded Depth')));
      assert.ok(GX_R012_INVARIANTS.some((i) => i.includes('GX-R012-I10 — Backend Authority')));
    });

    it('verifies all 15 rejected anti-patterns are documented', () => {
      assert.equal(GX_R012_REJECTED_PATTERNS.length, 15);
      assert.ok(GX_R012_REJECTED_PATTERNS.some((p) => p.includes('Infinite disclosure')));
      assert.ok(GX_R012_REJECTED_PATTERNS.some((p) => p.includes('Generic "Explore More"')));
      assert.ok(GX_R012_REJECTED_PATTERNS.some((p) => p.includes('Artificial unlock timers')));
      assert.ok(GX_R012_REJECTED_PATTERNS.some((p) => p.includes('Registration walls')));
      assert.ok(GX_R012_REJECTED_PATTERNS.some((p) => p.includes('Upgrade / paywall')));
    });

    it('passes validation for a strictly compliant disclosure configuration', () => {
      const result = validateDisclosureBoundaryConfig({
        hasInfiniteDisclosure: false,
        isShowEverythingArchitecture: false,
        hasCardExplosion: false,
        usesGenericExploreMoreCta: false,
        hasArtificialUnlockTimer: false,
        hasRegistrationWall: false,
        hasPaywallUpgradePrompt: false,
        usesScannerExpansionTree: false,
        hidesEvidenceWithoutExplanation: false,
        performsAutoWorkspaceTransition: false,
        autoPromotesAuthenticatedBrowser: false,
        presentsDetailBeforeMeaning: false,
        disclosesWithoutEvidence: false,
        repeatsFactsAsDeeperIntelligence: false,
        requiresFullPageReloadPerLayer: false,
        preservesSpatialContextAnchor: true,
        boundsMaxDepthToLevelSix: true,
        supportsCalmFailurePreservation: true,
      });

      assert.equal(result.valid, true);
      assert.equal(result.violations.length, 0);
    });

    it('rejects a configuration violating paywall, timer, and generic CTA rules', () => {
      const result = validateDisclosureBoundaryConfig({
        hasInfiniteDisclosure: false,
        isShowEverythingArchitecture: false,
        hasCardExplosion: true,
        usesGenericExploreMoreCta: true,
        hasArtificialUnlockTimer: true,
        hasRegistrationWall: true,
        hasPaywallUpgradePrompt: true,
        usesScannerExpansionTree: false,
        hidesEvidenceWithoutExplanation: false,
        performsAutoWorkspaceTransition: true,
        autoPromotesAuthenticatedBrowser: true,
        presentsDetailBeforeMeaning: false,
        disclosesWithoutEvidence: false,
        repeatsFactsAsDeeperIntelligence: false,
        requiresFullPageReloadPerLayer: false,
        preservesSpatialContextAnchor: false,
        boundsMaxDepthToLevelSix: false,
        supportsCalmFailurePreservation: false,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violations.length >= 8);
    });
  });
});
