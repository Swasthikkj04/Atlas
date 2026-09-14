/**
 * GX-R011 — Findings & Attention Model Contract
 *
 * Phase: Guest Experience Architecture (GX-R)
 * Ticket: GX-R011
 * Type: GX / Intelligence Presentation / Findings / Progressive Disclosure / Contract
 * Priority: P0 — Blocking
 * Depends on: GX-R008 🔒, GX-R009 🔒, GX-R010 🔒
 * Security dependency: SEC-GXWX-001 🔒, S-01 → S-06 🔒
 * Unblocks: GX-R012 — Next Intelligence / Disclosure Boundary
 * Status: FROZEN_FINDINGS_ATTENTION_CONTRACT
 *
 * Acceptance Gate Demonstrated Truth:
 * "A guest can understand what deserves attention in their infrastructure, why it matters,
 * and how significant it is without being presented with a conventional vulnerability scanner report."
 *
 * Frozen Principles:
 * 1. "Attention is earned by evidence, not manufactured by severity."
 * 2. "Meaning before severity. Evidence before alarm."
 */

export const GX_R011_TICKET_ID = 'GX-R011' as const;
export const GX_R011_PHASE = 'Guest Experience Architecture' as const;
export const GX_R011_STATUS = 'FROZEN_FINDINGS_ATTENTION_CONTRACT' as const;

export const GX_R011_FROZEN_PRINCIPLES = [
  'Attention is earned by evidence, not manufactured by severity.',
  'Meaning before severity. Evidence before alarm.',
] as const;

export const GX_R011_PRIMARY_PRINCIPLE =
  'Attention is earned by evidence, not manufactured by severity.' as const;

export const GX_R011_ACCEPTANCE_GATE_STATEMENT =
  'A guest can understand what deserves attention in their infrastructure, why it matters, and how significant it is without being presented with a conventional vulnerability scanner report.' as const;

/**
 * 1. Canonical Attention State Vocabulary
 */
export type AttentionState =
  | 'ATTENTION_REQUIRED' // Evidence indicates something materially worth investigating
  | 'NOTABLE'            // Interesting architectural observation with meaningful context
  | 'INFORMATIONAL'      // Useful understanding but no action implied
  | 'HEALTHY'            // Evidence supports a stable condition
  | 'UNDETERMINED';      // Insufficient evidence to make a meaningful determination

export const ATTENTION_STATE_RANKING: Record<AttentionState, number> = {
  ATTENTION_REQUIRED: 5,
  NOTABLE: 4,
  INFORMATIONAL: 3,
  HEALTHY: 2,
  UNDETERMINED: 1,
} as const;

export const ATTENTION_STATE_DEFINITIONS: Record<
  AttentionState,
  { label: string; description: string; actionable: boolean }
> = {
  ATTENTION_REQUIRED: {
    label: 'Attention Required',
    description: 'Evidence indicates an architectural or posture condition materially worth investigating.',
    actionable: true,
  },
  NOTABLE: {
    label: 'Notable Observation',
    description: 'Interesting architectural characteristic with meaningful context but no acute risk.',
    actionable: false,
  },
  INFORMATIONAL: {
    label: 'Informational',
    description: 'Structural architecture detail contributing to perimeter topology.',
    actionable: false,
  },
  HEALTHY: {
    label: 'Healthy Baseline',
    description: 'Direct evidence confirms adherence to modern cryptographic and routing standards.',
    actionable: false,
  },
  UNDETERMINED: {
    label: 'Undetermined',
    description: 'Insufficient or inconclusive telemetry to substantiate a definitive determination.',
    actionable: false,
  },
} as const;

/**
 * 2. Materiality & Confidence Scales
 */
export type MaterialityLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NEGLIGIBLE';
export const MATERIALITY_RANKING: Record<MaterialityLevel, number> = {
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  NEGLIGIBLE: 1,
} as const;

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export const CONFIDENCE_RANKING: Record<ConfidenceLevel, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
} as const;

export type EvidenceSourceProtocol =
  | 'DNS'
  | 'TLS'
  | 'HTTP'
  | 'TECH'
  | 'NETWORK'
  | 'CERTIFICATE';

export type CanonicalFindingCategory =
  | 'Edge'
  | 'Web Server'
  | 'Application'
  | 'Platform'
  | 'Hosting'
  | 'DNS'
  | 'TLS'
  | 'Mail';

export const CATEGORY_TOPOLOGY_RANKING: Record<CanonicalFindingCategory, number> = {
  Edge: 8,
  TLS: 7,
  DNS: 6,
  'Web Server': 5,
  Application: 4,
  Platform: 3,
  Mail: 2,
  Hosting: 1,
} as const;

/**
 * 3. Canonical Finding Data Model
 */
export interface GuestFindingIdentity {
  readonly id: string;
  readonly slug: string;
  readonly fingerprint: string;
}

export interface GuestFindingMeaning {
  readonly headline: string;
  readonly explanation: string;
  readonly whyItMatters: string;
}

export interface GuestFindingSignificance {
  readonly attentionLevel: AttentionState;
  readonly reason: string;
  readonly materiality: MaterialityLevel;
  readonly confidence: ConfidenceLevel;
}

export interface GuestFindingEvidence {
  readonly observations: readonly string[];
  readonly sources: readonly EvidenceSourceProtocol[];
  readonly rawEvidenceCount: number;
  readonly evidenceHashes: readonly string[];
  readonly hasDirectProof: boolean;
}

export interface GuestFindingContext {
  readonly category: CanonicalFindingCategory;
  readonly infrastructureRelationship?: string;
  readonly affectedComponents: readonly string[];
}

export interface GuestFindingInvestigation {
  readonly ctaText: 'Understand why →';
  readonly doorwayAvailable: boolean;
  readonly targetDrawerId: string;
  readonly guestOnly: true;
}

export interface CanonicalGuestFinding {
  readonly identity: GuestFindingIdentity;
  readonly meaning: GuestFindingMeaning;
  readonly significance: GuestFindingSignificance;
  readonly evidence: GuestFindingEvidence;
  readonly context: GuestFindingContext;
  readonly investigation: GuestFindingInvestigation;
}

/**
 * 4. Progressive Disclosure Model (5 Levels)
 */
export interface FindingProgressiveDisclosureLevel {
  readonly level: 1 | 2 | 3 | 4 | 5;
  readonly name: string;
  readonly contentDescription: string;
  readonly exampleProse: string;
}

export const FINDING_PROGRESSIVE_DISCLOSURE_LADDER: readonly FindingProgressiveDisclosureLevel[] = [
  {
    level: 1,
    name: 'Meaning',
    contentDescription: 'Headline and clear cognitive attention summary',
    exampleProse: 'Your TLS posture allows an older protocol configuration than expected.',
  },
  {
    level: 2,
    name: 'Why It Matters',
    contentDescription: 'Architectural and operational consequence explanation',
    exampleProse: 'Older protocol versions lack modern cryptographic primitives and forward secrecy.',
  },
  {
    level: 3,
    name: 'Observation',
    contentDescription: 'Observed perimeter topology and involved components',
    exampleProse: 'TLS 1.0 and TLS 1.1 handshakes negotiated successfully with edge endpoints.',
  },
  {
    level: 4,
    name: 'Evidence',
    contentDescription: 'Protocols, telemetry sources, and verification hashes',
    exampleProse: 'TLS Handshake Probe (sha256:8f4c...) · Direct Wire Signal',
  },
  {
    level: 5,
    name: 'Investigation Doorway',
    contentDescription: 'Contextual investigation drawer access without leaving GX',
    exampleProse: 'Understand why →',
  },
] as const;

/**
 * 5. Quiet State Contract
 */
export const GX_R011_QUIET_STATE = {
  primaryHeadline: 'Infrastructure appears stable.',
  secondaryText:
    'The observed perimeter satisfies baseline cryptographic, routing, and header standards.',
  attentionCount: 0,
  prohibitedRepresentations: [
    '0 vulnerabilities found',
    '0 risks detected',
    '100% secure',
    'Security score: 100 / 100',
    'Grade A+ Certificate',
    'All checks passed (127/127)',
  ],
} as const;

/**
 * 6. Explicitly Rejected Anti-Patterns
 */
export const GX_R011_REJECTED_PATTERNS = [
  'Vulnerability-count dashboards (e.g., "127 vulnerabilities found")',
  'Fake severity inflation (elevating informational signals to generate urgency)',
  'Red-card everything (alarmist UI colors across benign observations)',
  '"Critical" without evidence (asserting severe risk without raw telemetry)',
  'Security score generation (synthetic numerical ratings like 78/100)',
  'Finding walls (unpaginated, unprioritized dumps of raw observations)',
  'Raw observation-first presentation (showing JSON headers before explaining meaning)',
  'CVE-style language for configuration baselines (tagging standard headers with fake CVEs)',
  'AI-generated speculative warnings (hallucinated posture claims)',
  'Duplicate findings across infrastructure layers (same observation in multiple cards)',
  'Attention based solely on collector output (omitting significance evaluation)',
  'Empty-state alarmism (treating clean scans as suspicious)',
  '"0 issues found" reassurance (misleading absolute safety guarantee)',
] as const;

/**
 * 7. Security Invariants (GX/WX Isolation)
 */
export const GX_R011_SECURITY_INVARIANTS = [
  'GX findings must never contain private Workspace IDs or tenant identifiers.',
  'GX findings must never expose internal authorization contexts or user roles.',
  'GX findings must never leak cross-tenant telemetry or private snapshots.',
  'Authenticated users accessing /guest remain strictly isolated in the GX ephemeral context.',
  'The "Understand why →" CTA must strictly open the guest drawer, never navigating to WX.',
] as const;

/**
 * 8. Attention Evaluation Engine
 *
 * Decouples raw observation severity from architectural attention.
 * Implements the core rule: "Absence of evidence must NEVER be converted into negative evidence."
 */
export function evaluateAttentionState(finding: {
  hasDirectProof: boolean;
  rawEvidenceCount: number;
  materiality: MaterialityLevel;
  confidence: ConfidenceLevel;
  category: CanonicalFindingCategory;
  isStableBaseline?: boolean;
  isInconclusive?: boolean;
}): AttentionState {
  // If telemetry is inconclusive or has zero proof, it is UNDETERMINED (never negative evidence)
  if (finding.isInconclusive || finding.rawEvidenceCount === 0) {
    return 'UNDETERMINED';
  }

  // If directly verified as stable baseline
  if (finding.isStableBaseline) {
    return 'HEALTHY';
  }

  // Promote to ATTENTION_REQUIRED only if backed by direct proof and high/medium materiality
  if (
    finding.hasDirectProof &&
    finding.rawEvidenceCount > 0 &&
    (finding.materiality === 'HIGH' ||
      (finding.materiality === 'MEDIUM' && finding.confidence === 'HIGH'))
  ) {
    return 'ATTENTION_REQUIRED';
  }

  // Notable observation: interesting context without acute risk
  if (
    finding.materiality === 'MEDIUM' ||
    (finding.materiality === 'LOW' && finding.confidence === 'HIGH')
  ) {
    return 'NOTABLE';
  }

  // Baseline structural information
  return 'INFORMATIONAL';
}

/**
 * 9. Deterministic Attention Ordering Engine
 *
 * Implements 6-tier deterministic sorting:
 * 1. Evidence-backed Significance & Attention Level
 * 2. Materiality Level
 * 3. Confidence Level
 * 4. Evidence Integrity (Direct proof > inferred, raw count descending)
 * 5. Layer Topology (Edge > TLS > DNS > Web Server > App > Platform > Mail > Hosting)
 * 6. Stable Finding ID Tiebreaker (alphabetical)
 */
export function sortGuestFindings(
  findings: readonly CanonicalGuestFinding[]
): CanonicalGuestFinding[] {
  return [...findings].sort((a, b) => {
    // 1. Attention Level
    const rankA = ATTENTION_STATE_RANKING[a.significance.attentionLevel];
    const rankB = ATTENTION_STATE_RANKING[b.significance.attentionLevel];
    if (rankA !== rankB) {
      return rankB - rankA; // Higher rank first
    }

    // 2. Materiality Level
    const matA = MATERIALITY_RANKING[a.significance.materiality];
    const matB = MATERIALITY_RANKING[b.significance.materiality];
    if (matA !== matB) {
      return matB - matA;
    }

    // 3. Confidence Level
    const confA = CONFIDENCE_RANKING[a.significance.confidence];
    const confB = CONFIDENCE_RANKING[b.significance.confidence];
    if (confA !== confB) {
      return confB - confA;
    }

    // 4. Evidence Integrity: Direct proof
    if (a.evidence.hasDirectProof !== b.evidence.hasDirectProof) {
      return a.evidence.hasDirectProof ? -1 : 1;
    }

    // 4b. Raw Evidence Count
    if (a.evidence.rawEvidenceCount !== b.evidence.rawEvidenceCount) {
      return b.evidence.rawEvidenceCount - a.evidence.rawEvidenceCount;
    }

    // 5. Topology Priority
    const topA = CATEGORY_TOPOLOGY_RANKING[a.context.category] ?? 0;
    const topB = CATEGORY_TOPOLOGY_RANKING[b.context.category] ?? 0;
    if (topA !== topB) {
      return topB - topA;
    }

    // 6. Stable ID Tiebreaker
    return a.identity.id.localeCompare(b.identity.id);
  });
}

/**
 * 10. Duplicate Finding Suppression
 *
 * Consolidates redundant observations across multi-IP resolution or redundant headers
 * into a single finding identity.
 */
export function deduplicateFindings(
  findings: readonly CanonicalGuestFinding[]
): CanonicalGuestFinding[] {
  const seenFingerprints = new Set<string>();
  const seenIds = new Set<string>();
  const deduplicated: CanonicalGuestFinding[] = [];

  for (const finding of findings) {
    if (seenFingerprints.has(finding.identity.fingerprint) || seenIds.has(finding.identity.id)) {
      continue;
    }
    seenFingerprints.add(finding.identity.fingerprint);
    seenIds.add(finding.identity.id);
    deduplicated.push(finding);
  }

  return deduplicated;
}

/**
 * 11. GX/WX Security Boundary Auditor
 *
 * Verifies that a finding object is strictly compliant with the ephemeral GX context
 * and contains zero private workspace tokens, tenant identifiers, or WX routes.
 */
export interface IsolationAuditResult {
  readonly secure: boolean;
  readonly violations: readonly string[];
}

export function enforceGXWXIsolation(finding: CanonicalGuestFinding): IsolationAuditResult {
  const violations: string[] = [];
  const serialized = JSON.stringify(finding);

  // Check for private WX indicators
  if (serialized.includes('workspaceId') || serialized.includes('ws_') || serialized.includes('tenantId')) {
    violations.push('Finding contains private Workspace or Tenant identifiers.');
  }

  if (serialized.includes('/workspace/') || serialized.includes('/api/v1/workspace')) {
    violations.push('Finding contains authenticated Workspace API routes or hyperlinks.');
  }

  if (serialized.includes('userRole') || serialized.includes('sessionToken') || serialized.includes('jwt')) {
    violations.push('Finding leaks internal authorization or session credentials.');
  }

  if (finding.investigation.ctaText !== 'Understand why →') {
    violations.push(`Invalid CTA text: "${finding.investigation.ctaText}". Must be "Understand why →".`);
  }

  if (finding.investigation.guestOnly !== true) {
    violations.push('Investigation doorway must be strictly flagged as guestOnly: true.');
  }

  return {
    secure: violations.length === 0,
    violations,
  };
}

/**
 * 12. Model Configuration Validator
 */
export interface FindingsAttentionValidationConfig {
  readonly hasVulnerabilityCountDashboard: boolean;
  readonly hasSyntheticSeverityInflation: boolean;
  readonly hasRedCardAlarmism: boolean;
  readonly hasUnsubstantiatedCritical: boolean;
  readonly hasSecurityScore: boolean;
  readonly hasFindingWall: boolean;
  readonly isRawObservationFirst: boolean;
  readonly usesCveStyleLanguage: boolean;
  readonly hasAiSpeculation: boolean;
  readonly hasDuplicateFindings: boolean;
  readonly derivesAttentionSolelyFromCollector: boolean;
  readonly exhibitsEmptyStateAlarmism: boolean;
  readonly usesZeroIssuesReassurance: boolean;
  readonly distinguishesExistenceFromSignificance: boolean;
  readonly respectsAbsenceOfEvidenceRule: boolean;
  readonly preservesProgressiveDisclosureLadder: boolean;
  readonly adheresToQuietStateContract: boolean;
}

export interface FindingsAttentionValidationResult {
  readonly valid: boolean;
  readonly violations: readonly string[];
}

export function validateFindingsAttentionModel(
  config: FindingsAttentionValidationConfig
): FindingsAttentionValidationResult {
  const violations: string[] = [];

  if (config.hasVulnerabilityCountDashboard) {
    violations.push('Vulnerability count dashboards violate GX-R011 architectural model.');
  }
  if (config.hasSyntheticSeverityInflation) {
    violations.push('Synthetic severity inflation violates the core truth contract.');
  }
  if (config.hasRedCardAlarmism) {
    violations.push('Red-card alarmist visual styling is strictly rejected.');
  }
  if (config.hasUnsubstantiatedCritical) {
    violations.push('"Critical" finding without direct evidence violates evidence-backed attention.');
  }
  if (config.hasSecurityScore) {
    violations.push('Security score calculation violates editorial restraint.');
  }
  if (config.hasFindingWall) {
    violations.push('Finding walls violate progressive disclosure principles.');
  }
  if (config.isRawObservationFirst) {
    violations.push('Raw observation-first presentation violates "Meaning before detail".');
  }
  if (config.usesCveStyleLanguage) {
    violations.push('CVE-style tagging for routine configurations is prohibited.');
  }
  if (config.hasAiSpeculation) {
    violations.push('AI-generated speculative warnings violate truth grounding.');
  }
  if (config.hasDuplicateFindings) {
    violations.push('Duplicate findings across layers must be suppressed.');
  }
  if (config.derivesAttentionSolelyFromCollector) {
    violations.push('Attention must be derived from significance evaluation, not raw collector output alone.');
  }
  if (config.exhibitsEmptyStateAlarmism) {
    violations.push('Empty-state alarmism is strictly prohibited.');
  }
  if (config.usesZeroIssuesReassurance) {
    violations.push('"0 issues found" reassurance is prohibited; use quiet baseline.');
  }
  if (!config.distinguishesExistenceFromSignificance) {
    violations.push('Model must distinguish finding existence from finding significance.');
  }
  if (!config.respectsAbsenceOfEvidenceRule) {
    violations.push('Absence of evidence must never be converted into negative evidence.');
  }
  if (!config.preservesProgressiveDisclosureLadder) {
    violations.push('Must preserve the 5-level progressive disclosure ladder.');
  }
  if (!config.adheresToQuietStateContract) {
    violations.push('Must adhere to canonical quiet state when no items require attention.');
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * 13. Acceptance Gate Verifier for GX-R011
 */
export function verifyGXR011CertificationGate(statement: string): {
  readonly passed: boolean;
  readonly canonicalStatement: string;
  readonly similarityRatio: number;
} {
  const normalizedCandidate = statement.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const normalizedCanonical = GX_R011_ACCEPTANCE_GATE_STATEMENT.toLowerCase().replace(/[^a-z0-9]/g, ' ');

  const candidateTokens = new Set(normalizedCandidate.split(/\s+/).filter(Boolean));
  const canonicalTokens = new Set(normalizedCanonical.split(/\s+/).filter(Boolean));

  let overlap = 0;
  for (const token of candidateTokens) {
    if (canonicalTokens.has(token)) {
      overlap++;
    }
  }

  const similarity = overlap / Math.max(canonicalTokens.size, candidateTokens.size);

  return {
    passed: similarity >= 0.85,
    canonicalStatement: GX_R011_ACCEPTANCE_GATE_STATEMENT,
    similarityRatio: similarity,
  };
}
