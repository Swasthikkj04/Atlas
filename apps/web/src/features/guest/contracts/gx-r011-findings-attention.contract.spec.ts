import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_R011_TICKET_ID,
  GX_R011_PHASE,
  GX_R011_STATUS,
  GX_R011_PRIMARY_PRINCIPLE,
  GX_R011_FROZEN_PRINCIPLES,
  GX_R011_ACCEPTANCE_GATE_STATEMENT,
  ATTENTION_STATE_RANKING,
  ATTENTION_STATE_DEFINITIONS,
  MATERIALITY_RANKING,
  CONFIDENCE_RANKING,
  CATEGORY_TOPOLOGY_RANKING,
  FINDING_PROGRESSIVE_DISCLOSURE_LADDER,
  GX_R011_QUIET_STATE,
  GX_R011_REJECTED_PATTERNS,
  GX_R011_SECURITY_INVARIANTS,
  evaluateAttentionState,
  sortGuestFindings,
  deduplicateFindings,
  enforceGXWXIsolation,
  validateFindingsAttentionModel,
  verifyGXR011CertificationGate,
} from './gx-r011-findings-attention.contract.ts';
import type {
  CanonicalGuestFinding,
} from './gx-r011-findings-attention.contract.ts';

describe('GX-R011: Findings & Attention Model Contract', () => {
  describe('1. Canonical Metadata & Acceptance Gate', () => {
    it('defines ticket metadata and status', () => {
      assert.equal(GX_R011_TICKET_ID, 'GX-R011');
      assert.equal(GX_R011_PHASE, 'Guest Experience Architecture');
      assert.equal(GX_R011_STATUS, 'FROZEN_FINDINGS_ATTENTION_CONTRACT');
    });

    it('embodies the frozen principles', () => {
      assert.equal(
        GX_R011_PRIMARY_PRINCIPLE,
        'Attention is earned by evidence, not manufactured by severity.'
      );
      assert.ok(
        GX_R011_FROZEN_PRINCIPLES.includes(
          'Meaning before severity. Evidence before alarm.'
        )
      );
    });

    it('passes the 🔒 GX-R011 Acceptance Gate with canonical statement', () => {
      const statement =
        'A guest can understand what deserves attention in their infrastructure, why it matters, and how significant it is without being presented with a conventional vulnerability scanner report.';
      const result = verifyGXR011CertificationGate(statement);

      assert.equal(result.passed, true);
      assert.equal(result.canonicalStatement, GX_R011_ACCEPTANCE_GATE_STATEMENT);
      assert.equal(result.similarityRatio, 1);
    });

    it('rejects a statement promoting conventional vulnerability scanner reports', () => {
      const statement =
        'A vulnerability scanner report listing 127 critical CVEs and requiring an upgrade to fix.';
      const result = verifyGXR011CertificationGate(statement);

      assert.equal(result.passed, false);
      assert.ok(result.similarityRatio < 0.4);
    });
  });

  describe('2. Canonical Finding Identity & Structure', () => {
    it('validates a complete 6-dimension canonical guest finding structure', () => {
      const sampleFinding: CanonicalGuestFinding = {
        identity: {
          id: 'finding-tls-legacy-protocol',
          slug: 'tls-legacy-protocol',
          fingerprint: 'sha256:8f4c92a10be74c3',
        },
        meaning: {
          headline: 'Your TLS posture allows an older protocol configuration than expected.',
          explanation: 'TLS 1.0 and TLS 1.1 handshakes negotiated successfully with edge endpoints.',
          whyItMatters: 'Older protocol versions lack modern cryptographic primitives and forward secrecy.',
        },
        significance: {
          attentionLevel: 'ATTENTION_REQUIRED',
          reason: 'Legacy TLS protocol active on public ingress endpoint.',
          materiality: 'HIGH',
          confidence: 'HIGH',
        },
        evidence: {
          observations: ['TLS 1.0 handshake accepted on port 443'],
          sources: ['TLS', 'NETWORK'],
          rawEvidenceCount: 2,
          evidenceHashes: ['sha256:wire-tls-001'],
          hasDirectProof: true,
        },
        context: {
          category: 'TLS',
          infrastructureRelationship: 'Edge Ingress → Origin Proxy',
          affectedComponents: ['TLS 1.0 / 1.1 Endpoints', 'Port 443'],
        },
        investigation: {
          ctaText: 'Understand why →',
          doorwayAvailable: true,
          targetDrawerId: 'drawer-finding-tls-legacy-protocol',
          guestOnly: true,
        },
      };

      assert.equal(sampleFinding.identity.id, 'finding-tls-legacy-protocol');
      assert.equal(sampleFinding.significance.attentionLevel, 'ATTENTION_REQUIRED');
      assert.equal(sampleFinding.investigation.ctaText, 'Understand why →');
      assert.equal(sampleFinding.investigation.guestOnly, true);
    });
  });

  describe('3. Attention Vocabulary & Classification Engine', () => {
    it('defines the 5-state attention vocabulary hierarchy', () => {
      assert.equal(ATTENTION_STATE_RANKING.ATTENTION_REQUIRED, 5);
      assert.equal(ATTENTION_STATE_RANKING.NOTABLE, 4);
      assert.equal(ATTENTION_STATE_RANKING.INFORMATIONAL, 3);
      assert.equal(ATTENTION_STATE_RANKING.HEALTHY, 2);
      assert.equal(ATTENTION_STATE_RANKING.UNDETERMINED, 1);

      assert.equal(ATTENTION_STATE_DEFINITIONS.ATTENTION_REQUIRED.actionable, true);
      assert.equal(ATTENTION_STATE_DEFINITIONS.NOTABLE.actionable, false);
      assert.equal(ATTENTION_STATE_DEFINITIONS.HEALTHY.actionable, false);
      assert.equal(ATTENTION_STATE_DEFINITIONS.UNDETERMINED.actionable, false);
    });

    it('evaluates direct proof + high materiality to ATTENTION_REQUIRED', () => {
      const state = evaluateAttentionState({
        hasDirectProof: true,
        rawEvidenceCount: 3,
        materiality: 'HIGH',
        confidence: 'HIGH',
        category: 'TLS',
      });
      assert.equal(state, 'ATTENTION_REQUIRED');
    });

    it('evaluates stable baseline to HEALTHY state', () => {
      const state = evaluateAttentionState({
        hasDirectProof: true,
        rawEvidenceCount: 1,
        materiality: 'LOW',
        confidence: 'HIGH',
        category: 'DNS',
        isStableBaseline: true,
      });
      assert.equal(state, 'HEALTHY');
    });

    it('downgrades inconclusive or zero-evidence items to UNDETERMINED (never negative evidence)', () => {
      const stateInconclusive = evaluateAttentionState({
        hasDirectProof: false,
        rawEvidenceCount: 0,
        materiality: 'HIGH',
        confidence: 'LOW',
        category: 'Mail',
        isInconclusive: true,
      });
      assert.equal(stateInconclusive, 'UNDETERMINED');

      const stateZeroEvidence = evaluateAttentionState({
        hasDirectProof: false,
        rawEvidenceCount: 0,
        materiality: 'HIGH',
        confidence: 'HIGH',
        category: 'DNS',
      });
      assert.equal(stateZeroEvidence, 'UNDETERMINED');
    });

    it('assigns NOTABLE to medium materiality or low materiality with high confidence', () => {
      const state = evaluateAttentionState({
        hasDirectProof: true,
        rawEvidenceCount: 1,
        materiality: 'MEDIUM',
        confidence: 'MEDIUM',
        category: 'Edge',
      });
      assert.equal(state, 'NOTABLE');
    });
  });

  describe('4. Deterministic Attention Ordering Engine', () => {
    const finding1: CanonicalGuestFinding = {
      identity: { id: 'f-1-dns-spf', slug: 'dns-spf', fingerprint: 'fp-1' },
      meaning: { headline: 'SPF softfail directive', explanation: 'TXT record contains ~all', whyItMatters: 'Allows relaying' },
      significance: { attentionLevel: 'NOTABLE', reason: 'Softfail policy', materiality: 'MEDIUM', confidence: 'HIGH' },
      evidence: { observations: ['v=spf1 ~all'], sources: ['DNS'], rawEvidenceCount: 1, evidenceHashes: ['h1'], hasDirectProof: true },
      context: { category: 'DNS', affectedComponents: ['DNS Nameserver'] },
      investigation: { ctaText: 'Understand why →', doorwayAvailable: true, targetDrawerId: 'd1', guestOnly: true },
    };

    const finding2: CanonicalGuestFinding = {
      identity: { id: 'f-2-tls-legacy', slug: 'tls-legacy', fingerprint: 'fp-2' },
      meaning: { headline: 'Legacy TLS protocol active', explanation: 'TLS 1.0 accepted', whyItMatters: 'Weak ciphers' },
      significance: { attentionLevel: 'ATTENTION_REQUIRED', reason: 'TLS 1.0 active', materiality: 'HIGH', confidence: 'HIGH' },
      evidence: { observations: ['TLS 1.0 accepted'], sources: ['TLS'], rawEvidenceCount: 4, evidenceHashes: ['h2'], hasDirectProof: true },
      context: { category: 'TLS', affectedComponents: ['Edge Ingress'] },
      investigation: { ctaText: 'Understand why →', doorwayAvailable: true, targetDrawerId: 'd2', guestOnly: true },
    };

    const finding3: CanonicalGuestFinding = {
      identity: { id: 'f-3-edge-routing', slug: 'edge-routing', fingerprint: 'fp-3' },
      meaning: { headline: 'Edge routing topology detected', explanation: 'Anycast CDN in front', whyItMatters: 'Edge protection' },
      significance: { attentionLevel: 'INFORMATIONAL', reason: 'Edge CDN active', materiality: 'LOW', confidence: 'HIGH' },
      evidence: { observations: ['Cloudflare ray detected'], sources: ['HTTP'], rawEvidenceCount: 2, evidenceHashes: ['h3'], hasDirectProof: true },
      context: { category: 'Edge', affectedComponents: ['Cloudflare'] },
      investigation: { ctaText: 'Understand why →', doorwayAvailable: true, targetDrawerId: 'd3', guestOnly: true },
    };

    it('orders ATTENTION_REQUIRED before NOTABLE before INFORMATIONAL', () => {
      const sorted = sortGuestFindings([finding3, finding1, finding2]);
      assert.equal(sorted[0].identity.id, 'f-2-tls-legacy');
      assert.equal(sorted[1].identity.id, 'f-1-dns-spf');
      assert.equal(sorted[2].identity.id, 'f-3-edge-routing');
    });

    it('breaks ties deterministically using topological category and ID', () => {
      assert.equal(CATEGORY_TOPOLOGY_RANKING.Edge, 8);
      assert.equal(CATEGORY_TOPOLOGY_RANKING.DNS, 6);
      assert.equal(MATERIALITY_RANKING.HIGH, 4);
      assert.equal(CONFIDENCE_RANKING.HIGH, 3);

      const findingA: CanonicalGuestFinding = {
        ...finding1,
        identity: { id: 'finding-a', slug: 'a', fingerprint: 'fp-a' },
        context: { category: 'Edge', affectedComponents: [] },
      };
      const findingB: CanonicalGuestFinding = {
        ...finding1,
        identity: { id: 'finding-b', slug: 'b', fingerprint: 'fp-b' },
        context: { category: 'DNS', affectedComponents: [] },
      };

      const sorted = sortGuestFindings([findingB, findingA]);
      assert.equal(sorted[0].identity.id, 'finding-a'); // Edge (rank 8) > DNS (rank 6)
    });
  });

  describe('5. Duplicate Finding Suppression', () => {
    it('suppresses redundant duplicate observations with matching fingerprints or IDs', () => {
      const findingOriginal: CanonicalGuestFinding = {
        identity: { id: 'finding-duplicate', slug: 'dup', fingerprint: 'fp-dup-100' },
        meaning: { headline: 'Missing HSTS Header', explanation: 'No Strict-Transport-Security header', whyItMatters: 'Allows MITM downgrade' },
        significance: { attentionLevel: 'ATTENTION_REQUIRED', reason: 'HSTS missing', materiality: 'HIGH', confidence: 'HIGH' },
        evidence: { observations: ['HTTP 200 response missing HSTS'], sources: ['HTTP'], rawEvidenceCount: 1, evidenceHashes: ['h100'], hasDirectProof: true },
        context: { category: 'Web Server', affectedComponents: ['Nginx'] },
        investigation: { ctaText: 'Understand why →', doorwayAvailable: true, targetDrawerId: 'd-dup', guestOnly: true },
      };

      const findingDuplicate = { ...findingOriginal };

      const deduplicated = deduplicateFindings([findingOriginal, findingDuplicate, findingDuplicate]);
      assert.equal(deduplicated.length, 1);
      assert.equal(deduplicated[0].identity.id, 'finding-duplicate');
    });
  });

  describe('6. Quiet State & Healthy Baseline Contract', () => {
    it('enforces calm quiet state headline and subtext without alarms', () => {
      assert.equal(GX_R011_QUIET_STATE.primaryHeadline, 'Infrastructure appears stable.');
      assert.equal(
        GX_R011_QUIET_STATE.secondaryText,
        'The observed perimeter satisfies baseline cryptographic, routing, and header standards.'
      );
      assert.equal(GX_R011_QUIET_STATE.attentionCount, 0);
    });

    it('explicitly lists prohibited quiet-state representations', () => {
      assert.ok(GX_R011_QUIET_STATE.prohibitedRepresentations.includes('0 vulnerabilities found'));
      assert.ok(GX_R011_QUIET_STATE.prohibitedRepresentations.includes('Security score: 100 / 100'));
      assert.ok(GX_R011_QUIET_STATE.prohibitedRepresentations.includes('100% secure'));
      assert.ok(GX_R011_QUIET_STATE.prohibitedRepresentations.includes('All checks passed (127/127)'));
    });
  });

  describe('7. Progressive Disclosure Ladder (5 Levels)', () => {
    it('defines 5 progressive levels from Meaning to Investigation Doorway', () => {
      assert.equal(FINDING_PROGRESSIVE_DISCLOSURE_LADDER.length, 5);
      FINDING_PROGRESSIVE_DISCLOSURE_LADDER.forEach((lvl, idx) => {
        assert.equal(lvl.level, idx + 1);
        assert.ok(lvl.name.length > 0);
        assert.ok(lvl.contentDescription.length > 0);
        assert.ok(lvl.exampleProse.length > 0);
      });
    });

    it('ensures Meaning precedes Investigation Doorway', () => {
      const level1 = FINDING_PROGRESSIVE_DISCLOSURE_LADDER.find((l) => l.level === 1);
      const level5 = FINDING_PROGRESSIVE_DISCLOSURE_LADDER.find((l) => l.level === 5);

      assert.equal(level1?.name, 'Meaning');
      assert.equal(level5?.name, 'Investigation Doorway');
    });
  });

  describe('8. Explicitly Rejected Anti-Patterns & Validation', () => {
    it('contains all 13 canonical rejected patterns', () => {
      assert.equal(GX_R011_REJECTED_PATTERNS.length, 13);
      assert.ok(
        GX_R011_REJECTED_PATTERNS.some((p) => p.includes('Vulnerability-count dashboards'))
      );
      assert.ok(
        GX_R011_REJECTED_PATTERNS.some((p) => p.includes('Fake severity inflation'))
      );
      assert.ok(
        GX_R011_REJECTED_PATTERNS.some((p) => p.includes('Security score generation'))
      );
    });

    it('passes validation for a compliant configuration', () => {
      const result = validateFindingsAttentionModel({
        hasVulnerabilityCountDashboard: false,
        hasSyntheticSeverityInflation: false,
        hasRedCardAlarmism: false,
        hasUnsubstantiatedCritical: false,
        hasSecurityScore: false,
        hasFindingWall: false,
        isRawObservationFirst: false,
        usesCveStyleLanguage: false,
        hasAiSpeculation: false,
        hasDuplicateFindings: false,
        derivesAttentionSolelyFromCollector: false,
        exhibitsEmptyStateAlarmism: false,
        usesZeroIssuesReassurance: false,
        distinguishesExistenceFromSignificance: true,
        respectsAbsenceOfEvidenceRule: true,
        preservesProgressiveDisclosureLadder: true,
        adheresToQuietStateContract: true,
      });

      assert.equal(result.valid, true);
      assert.equal(result.violations.length, 0);
    });

    it('rejects a configuration exhibiting synthetic severity and vulnerability scores', () => {
      const result = validateFindingsAttentionModel({
        hasVulnerabilityCountDashboard: true,
        hasSyntheticSeverityInflation: true,
        hasRedCardAlarmism: true,
        hasUnsubstantiatedCritical: false,
        hasSecurityScore: true,
        hasFindingWall: false,
        isRawObservationFirst: false,
        usesCveStyleLanguage: false,
        hasAiSpeculation: false,
        hasDuplicateFindings: false,
        derivesAttentionSolelyFromCollector: false,
        exhibitsEmptyStateAlarmism: false,
        usesZeroIssuesReassurance: false,
        distinguishesExistenceFromSignificance: true,
        respectsAbsenceOfEvidenceRule: true,
        preservesProgressiveDisclosureLadder: true,
        adheresToQuietStateContract: true,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violations.length >= 4);
    });
  });

  describe('9. GX/WX Boundary & Security Isolation Audit', () => {
    it('verifies security invariants are established', () => {
      assert.equal(GX_R011_SECURITY_INVARIANTS.length, 5);
      assert.ok(
        GX_R011_SECURITY_INVARIANTS.some((i) => i.includes('GX findings must never contain private Workspace IDs'))
      );
    });

    it('approves an isolated guest finding', () => {
      const finding: CanonicalGuestFinding = {
        identity: { id: 'f-guest-001', slug: 'g-001', fingerprint: 'fp-g-001' },
        meaning: { headline: 'Public DNS SPF configuration', explanation: 'SPF record published', whyItMatters: 'Mail integrity' },
        significance: { attentionLevel: 'HEALTHY', reason: 'Direct DNS verification', materiality: 'LOW', confidence: 'HIGH' },
        evidence: { observations: ['v=spf1 include:_spf.google.com ~all'], sources: ['DNS'], rawEvidenceCount: 1, evidenceHashes: ['h-dns'], hasDirectProof: true },
        context: { category: 'Mail', affectedComponents: ['Google Workspace MX'] },
        investigation: { ctaText: 'Understand why →', doorwayAvailable: true, targetDrawerId: 'd-g-001', guestOnly: true },
      };

      const audit = enforceGXWXIsolation(finding);
      assert.equal(audit.secure, true);
      assert.equal(audit.violations.length, 0);
    });

    it('detects and flags private Workspace ID and route leakage in findings', () => {
      const leakingFinding = {
        identity: { id: 'f-leak-001', slug: 'leak', fingerprint: 'fp-leak' },
        meaning: { headline: 'Internal issue', explanation: 'Private note', whyItMatters: 'Internal policy' },
        significance: { attentionLevel: 'ATTENTION_REQUIRED' as const, reason: 'Policy', materiality: 'HIGH' as const, confidence: 'HIGH' as const },
        evidence: { observations: ['Private record'], sources: ['HTTP' as const], rawEvidenceCount: 1, evidenceHashes: ['h-leak'], hasDirectProof: true },
        context: { category: 'Application' as const, affectedComponents: ['App Server'] },
        investigation: { ctaText: 'Understand why →' as const, doorwayAvailable: true, targetDrawerId: 'd-leak', guestOnly: true as const },
        workspaceId: 'ws_prod_tenant_777',
        targetRoute: '/workspace/findings/detail',
      };

      const audit = enforceGXWXIsolation(leakingFinding as unknown as CanonicalGuestFinding);
      assert.equal(audit.secure, false);
      assert.ok(audit.violations.length >= 2);
      assert.ok(audit.violations.some((v) => v.includes('private Workspace')));
    });

    it('enforces that CTA text must strictly be "Understand why →"', () => {
      const invalidCtaFinding = {
        identity: { id: 'f-cta-001', slug: 'cta', fingerprint: 'fp-cta' },
        meaning: { headline: 'Test', explanation: 'Test', whyItMatters: 'Test' },
        significance: { attentionLevel: 'NOTABLE' as const, reason: 'Test', materiality: 'LOW' as const, confidence: 'HIGH' as const },
        evidence: { observations: [], sources: [], rawEvidenceCount: 0, evidenceHashes: [], hasDirectProof: false },
        context: { category: 'Edge' as const, affectedComponents: [] },
        investigation: { ctaText: 'Open Workspace →' as unknown as 'Understand why →', doorwayAvailable: true, targetDrawerId: 'd', guestOnly: true as const },
      };

      const audit = enforceGXWXIsolation(invalidCtaFinding as unknown as CanonicalGuestFinding);
      assert.equal(audit.secure, false);
      assert.ok(audit.violations.some((v) => v.includes('Invalid CTA text')));
    });
  });
});
