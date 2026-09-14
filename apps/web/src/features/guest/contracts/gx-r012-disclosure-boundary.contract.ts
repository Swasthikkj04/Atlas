/**
 * GX-R012 — Next Intelligence / Disclosure Boundary Contract
 *
 * Phase: Guest Experience Architecture (GX-R)
 * Ticket: GX-R012
 * Type: GX / Progressive Disclosure / Intelligence Architecture / UX Contract / Security Boundary
 * Priority: P0 — Blocking
 * Depends on: GX-R008 🔒, GX-R009 🔒, GX-R010 🔒, GX-R011 🔒
 * Security Dependencies: SEC-GXWX-001 🔒, S-01 → S-06 🔒
 * Status: FROZEN_DISCLOSURE_BOUNDARY_CONTRACT
 *
 * Acceptance Gate Demonstrated Truth:
 * "After receiving the first meaningful understanding, a guest can progressively move deeper
 * into Nebula's intelligence without being overwhelmed, losing spatial context, or crossing
 * into authenticated Workspace state."
 *
 * Frozen Principles:
 * 1. "Reveal the next layer only when the current layer has earned it."
 * 2. "Reveal depth, never overwhelm. Deeper understanding must never mean broader access."
 */

export const GX_R012_TICKET_ID = 'GX-R012' as const;
export const GX_R012_PHASE = 'Guest Experience Architecture' as const;
export const GX_R012_STATUS = 'FROZEN_DISCLOSURE_BOUNDARY_CONTRACT' as const;

export const GX_R012_PRIMARY_PRINCIPLE =
  'Reveal the next layer only when the current layer has earned it.' as const;

export const GX_R012_FROZEN_PRINCIPLES = [
  'Reveal the next layer only when the current layer has earned it.',
  'Reveal depth, never overwhelm. Deeper understanding must never mean broader access.',
] as const;

export const GX_R012_ACCEPTANCE_GATE_STATEMENT =
  "After receiving the first meaningful understanding, a guest can progressively move deeper into Nebula's intelligence without being overwhelmed, losing spatial context, or crossing into authenticated Workspace state." as const;

export const GX_R012_CERTIFICATION_GATE_STATEMENT =
  'Nebula progressively reveals deeper intelligence only when the current understanding has earned it through meaningful evidence, preserving context and spatial stability while preventing progressive disclosure from becoming progressive privilege.' as const;

/**
 * 1. Maximum Guest Disclosure Depth Constant
 */
export const MAX_GUEST_DISCLOSURE_DEPTH = 6 as const;
export const MIN_GUEST_DISCLOSURE_DEPTH = 0 as const;

export type DisclosureLevelIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * 2. Canonical 7-Level Progressive Disclosure Ladder
 */
export interface CanonicalDisclosureLevel {
  readonly level: DisclosureLevelIndex;
  readonly name: string;
  readonly cognitiveQuestion: string;
  readonly purpose: string;
  readonly keySurfaces: readonly string[];
  readonly isBounded: boolean;
}

export const CANONICAL_SEVEN_LEVEL_DISCLOSURE_LADDER: readonly CanonicalDisclosureLevel[] = [
  {
    level: 0,
    name: 'Orientation',
    cognitiveQuestion: 'Where am I?',
    purpose: 'Establishes persistent domain context and investigation state.',
    keySurfaces: ['Domain Context Anchor', 'Understanding Status', 'Snapshot Timestamp'],
    isBounded: true,
  },
  {
    level: 1,
    name: 'Meaning',
    cognitiveQuestion: 'What has Nebula understood?',
    purpose: 'Presents high-level synthesized narrative of discovered perimeter.',
    keySurfaces: ['Executive Brief Narrative', 'Synthesized Perimeter Profile'],
    isBounded: true,
  },
  {
    level: 2,
    name: 'Attention',
    cognitiveQuestion: 'What deserves attention?',
    purpose: 'Highlights actionable architectural observations backed by direct evidence.',
    keySurfaces: ['Actionable Findings', 'Significance Breakdown', 'Understand why → CTA'],
    isBounded: true,
  },
  {
    level: 3,
    name: 'Architecture',
    cognitiveQuestion: 'How does the infrastructure relate?',
    purpose: 'Exposes structural topology across canonical infrastructure layers.',
    keySurfaces: ['8-Category Matrix', 'Ingress Request Path', 'Detected Technologies'],
    isBounded: true,
  },
  {
    level: 4,
    name: 'Evidence',
    cognitiveQuestion: 'What supports this understanding?',
    purpose: 'Summarizes verified protocols, wire signals, and cryptographic hashes.',
    keySurfaces: ['Protocol Signals', 'Telemetry Verification Hashes', 'Signal Lineage'],
    isBounded: true,
  },
  {
    level: 5,
    name: 'Investigation',
    cognitiveQuestion: 'Why does this observation exist?',
    purpose: 'Provides contextual deep inspection of raw collector payloads behind drawer.',
    keySurfaces: ['Contextual Investigation Drawer', 'Raw Collector Payloads', 'DNS/TLS/HTTP Wire Details'],
    isBounded: true,
  },
  {
    level: 6,
    name: 'Next Intelligence',
    cognitiveQuestion: 'What else can Nebula meaningfully explain?',
    purpose: 'Controlled doorway into adjacent architectural understanding surfaces.',
    keySurfaces: ['Contextual Next Intelligence Doorway', 'Topology Detail Doorway'],
    isBounded: true,
  },
] as const;

/**
 * 3. Contextual Next Intelligence Doorway Model
 */
export interface NextIntelligenceDoorway {
  readonly doorwayId: string;
  readonly sourceCategory: string;
  readonly currentInsight: string;
  readonly nextInsight: string;
  readonly ctaText: string;
  readonly targetLevel: DisclosureLevelIndex;
  readonly evidenceRequired: boolean;
  readonly evidenceCount: number;
}

/**
 * 4. Spatial Context Anchor Contract
 */
export interface SpatialContextAnchor {
  readonly domain: string;
  readonly status: 'UNDERSTANDING' | 'UNDERSTOOD' | 'STABLE';
  readonly currentLevel: DisclosureLevelIndex;
  readonly persistentAnchorText: string;
}

export function formatSpatialAnchor(domain: string): string {
  return `UNDERSTANDING · ${domain.trim().toLowerCase()}`;
}

/**
 * 5. Disclosure Trigger Rules & Eligibility Engine
 */
export interface DisclosureTriggerEvaluationParams {
  readonly meaningComplete: boolean;
  readonly evidenceExists: boolean;
  readonly rawEvidenceCount: number;
  readonly addsGenuineInsight: boolean;
  readonly targetLevel: number;
}

export interface DisclosureTriggerResult {
  readonly eligible: boolean;
  readonly reason: string;
}

export function evaluateDisclosureTrigger(
  params: DisclosureTriggerEvaluationParams
): DisclosureTriggerResult {
  if (params.targetLevel > MAX_GUEST_DISCLOSURE_DEPTH) {
    return {
      eligible: false,
      reason: `Target disclosure level ${params.targetLevel} exceeds maximum guest boundary depth (${MAX_GUEST_DISCLOSURE_DEPTH}).`,
    };
  }

  if (params.targetLevel < MIN_GUEST_DISCLOSURE_DEPTH) {
    return {
      eligible: false,
      reason: `Target disclosure level ${params.targetLevel} is below minimum level (${MIN_GUEST_DISCLOSURE_DEPTH}).`,
    };
  }

  if (!params.meaningComplete) {
    return {
      eligible: false,
      reason: 'Current layer meaning must be complete before disclosing the next layer.',
    };
  }

  if (!params.evidenceExists || params.rawEvidenceCount <= 0) {
    return {
      eligible: false,
      reason: 'Backend evidence is required to substantiate deeper disclosure layers.',
    };
  }

  if (!params.addsGenuineInsight) {
    return {
      eligible: false,
      reason: 'Next layer must add genuine architectural insight without repeating existing facts.',
    };
  }

  return {
    eligible: true,
    reason: 'Current layer has earned next layer disclosure through complete meaning and verifiable evidence.',
  };
}

/**
 * 6. Contextual Next Intelligence Derivation
 */
export function deriveContextualNextIntelligence(
  category: string,
  context: {
    readonly evidenceCount: number;
    readonly briefComplete: boolean;
    readonly observedRelationship?: string;
  }
): NextIntelligenceDoorway | null {
  if (!context.briefComplete || context.evidenceCount <= 0) {
    return null;
  }

  const normalizedCategory = category.toLowerCase().trim();

  switch (normalizedCategory) {
    case 'edge':
    case 'cdn':
      return {
        doorwayId: 'doorway-edge-ingress',
        sourceCategory: 'Edge',
        currentInsight: 'The traffic path suggests a multi-layer ingress architecture.',
        nextInsight: 'How the public edge connects to the underlying origin infrastructure.',
        ctaText: 'Explore edge architecture →',
        targetLevel: 6,
        evidenceRequired: true,
        evidenceCount: context.evidenceCount,
      };

    case 'tls':
    case 'crypto':
      return {
        doorwayId: 'doorway-tls-trust',
        sourceCategory: 'TLS',
        currentInsight: 'Observed cryptographic certificates and protocol cipher suites.',
        nextInsight: 'Certificate authority hierarchy and automated renewal trust chain.',
        ctaText: 'Explore certificate lineage →',
        targetLevel: 6,
        evidenceRequired: true,
        evidenceCount: context.evidenceCount,
      };

    case 'dns':
    case 'nameserver':
      return {
        doorwayId: 'doorway-dns-routing',
        sourceCategory: 'DNS',
        currentInsight: 'Authoritative nameservers and Anycast distribution detected.',
        nextInsight: 'DNS zone redundancy and mail authentication authorization matrix.',
        ctaText: 'Explore DNS routing matrix →',
        targetLevel: 6,
        evidenceRequired: true,
        evidenceCount: context.evidenceCount,
      };

    default:
      return {
        doorwayId: `doorway-${normalizedCategory}`,
        sourceCategory: category,
        currentInsight: `Observed ${category} infrastructure configuration.`,
        nextInsight: `How ${category} coordinates with perimeter routing layers.`,
        ctaText: `Explore ${category.toLowerCase()} architecture →`,
        targetLevel: 6,
        evidenceRequired: true,
        evidenceCount: context.evidenceCount,
      };
  }
}

/**
 * 7. Security Boundary Enforcement (GX/WX Isolation)
 */
export interface SecurityBoundaryAuditRequest {
  readonly requestedLevel: number;
  readonly sessionType: 'GUEST' | 'AUTHENTICATED';
  readonly targetPath?: string;
  readonly targetResource?: string;
}

export interface SecurityBoundaryAuditResult {
  readonly permitted: boolean;
  readonly violation?: string;
}

export function enforceDisclosureSecurityBoundary(
  request: SecurityBoundaryAuditRequest
): SecurityBoundaryAuditResult {
  // Check maximum bounded depth
  if (request.requestedLevel > MAX_GUEST_DISCLOSURE_DEPTH) {
    return {
      permitted: false,
      violation: `Requested disclosure level ${request.requestedLevel} exceeds maximum guest boundary depth (${MAX_GUEST_DISCLOSURE_DEPTH}).`,
    };
  }

  // Check for private Workspace route navigation
  if (
    request.targetPath?.startsWith('/workspace') ||
    request.targetPath?.startsWith('/api/v1/workspace') ||
    request.targetResource?.includes('workspace_') ||
    request.targetResource?.includes('tenant_')
  ) {
    return {
      permitted: false,
      violation: 'Progressive disclosure in GX cannot bridge into authenticated Workspace routes or private resources.',
    };
  }

  // Authenticated user in GX must remain in GX plane
  if (request.sessionType === 'AUTHENTICATED' && request.targetPath?.includes('/workspace/private')) {
    return {
      permitted: false,
      violation: 'Authenticated browser visiting /guest cannot receive private Workspace findings through GX disclosure.',
    };
  }

  return { permitted: true };
}

/**
 * 8. Ten Certified Core Invariants (GX-R012-I01 → GX-R012-I10)
 */
export const GX_R012_INVARIANTS = [
  'GX-R012-I01 — Meaningful Progression: Every disclosure layer must add meaningful, non-redundant understanding.',
  'GX-R012-I02 — Evidence Requirement: Deeper conclusions require corresponding verifiable backend wire evidence.',
  'GX-R012-I03 — Context Preservation: Domain anchor and current understanding remain persistently visible.',
  'GX-R012-I04 — No Artificial Delay: Available intelligence is disclosed immediately without artificial timers.',
  'GX-R012-I05 — No Privilege Escalation: Progressive disclosure cannot alter security identity or plane.',
  'GX-R012-I06 — Bounded Depth: GX has an explicit maximum disclosure depth (Level 0 through Level 6).',
  'GX-R012-I07 — Deterministic Disclosure: Identical telemetry produces consistent, reproducible disclosure ordering.',
  'GX-R012-I08 — Failure Preservation: Failure of deeper intelligence cannot destroy already-earned understanding.',
  'GX-R012-I09 — Explicit Transition: Leaving GX requires an explicit, intentional user action.',
  'GX-R012-I10 — Backend Authority: The frontend cannot fabricate eligibility for deeper intelligence.',
] as const;

/**
 * 9. Fifteen Explicitly Rejected Anti-Patterns
 */
export const GX_R012_REJECTED_PATTERNS = [
  'Infinite disclosure (unbounded nested disclosure trees)',
  '"Show everything" architecture (uncurated raw dumps)',
  'Dashboard-style card explosion (cluttered multi-card grids)',
  'Generic "Explore More" or "See Full Report" CTAs',
  'Artificial unlock timers (e.g., "Wait 3 seconds to unlock")',
  'Registration walls for earned intelligence (e.g., "Sign up to view findings")',
  'Upgrade / paywall disclosure prompts (e.g., "Upgrade to Pro to see details")',
  'Scanner-style result expansion trees',
  'Hidden evidence without contextual explanation',
  'Automatic Workspace transition without explicit user intent',
  'Authentication-based GX -> WX automatic promotion',
  'Technical detail before meaning',
  'Disclosure without supporting evidence',
  'Repetition disguised as deeper intelligence',
  'Full-page navigation for every disclosure step',
] as const;

/**
 * 10. Disclosure Boundary Configuration Validator
 */
export interface DisclosureBoundaryValidationConfig {
  readonly hasInfiniteDisclosure: boolean;
  readonly isShowEverythingArchitecture: boolean;
  readonly hasCardExplosion: boolean;
  readonly usesGenericExploreMoreCta: boolean;
  readonly hasArtificialUnlockTimer: boolean;
  readonly hasRegistrationWall: boolean;
  readonly hasPaywallUpgradePrompt: boolean;
  readonly usesScannerExpansionTree: boolean;
  readonly hidesEvidenceWithoutExplanation: boolean;
  readonly performsAutoWorkspaceTransition: boolean;
  readonly autoPromotesAuthenticatedBrowser: boolean;
  readonly presentsDetailBeforeMeaning: boolean;
  readonly disclosesWithoutEvidence: boolean;
  readonly repeatsFactsAsDeeperIntelligence: boolean;
  readonly requiresFullPageReloadPerLayer: boolean;
  readonly preservesSpatialContextAnchor: boolean;
  readonly boundsMaxDepthToLevelSix: boolean;
  readonly supportsCalmFailurePreservation: boolean;
}

export interface DisclosureBoundaryValidationResult {
  readonly valid: boolean;
  readonly violations: readonly string[];
}

export function validateDisclosureBoundaryConfig(
  config: DisclosureBoundaryValidationConfig
): DisclosureBoundaryValidationResult {
  const violations: string[] = [];

  if (config.hasInfiniteDisclosure) {
    violations.push('Infinite disclosure violates bounded canvas architecture.');
  }
  if (config.isShowEverythingArchitecture) {
    violations.push('"Show everything" architecture violates progressive disclosure restraint.');
  }
  if (config.hasCardExplosion) {
    violations.push('Card explosion violates spatial recomposition design.');
  }
  if (config.usesGenericExploreMoreCta) {
    violations.push('Generic "Explore More" CTAs are prohibited; use contextual descriptive CTAs.');
  }
  if (config.hasArtificialUnlockTimer) {
    violations.push('Artificial unlock timers violate truth-driven progression.');
  }
  if (config.hasRegistrationWall) {
    violations.push('Registration walls for earned intelligence are strictly prohibited.');
  }
  if (config.hasPaywallUpgradePrompt) {
    violations.push('Paywall upgrade prompts violate the open guest intelligence boundary.');
  }
  if (config.usesScannerExpansionTree) {
    violations.push('Scanner-style expansion trees violate cognitive narrative flow.');
  }
  if (config.hidesEvidenceWithoutExplanation) {
    violations.push('Hidden evidence without explanation violates progressive disclosure.');
  }
  if (config.performsAutoWorkspaceTransition) {
    violations.push('Automatic transition into Workspace violates GX/WX isolation.');
  }
  if (config.autoPromotesAuthenticatedBrowser) {
    violations.push('Authenticated browsers must not automatically cross the disclosure plane into WX.');
  }
  if (config.presentsDetailBeforeMeaning) {
    violations.push('Detail before meaning violates "Meaning before detail".');
  }
  if (config.disclosesWithoutEvidence) {
    violations.push('Disclosure without evidence violates truth grounding.');
  }
  if (config.repeatsFactsAsDeeperIntelligence) {
    violations.push('Repetition disguised as deeper intelligence is prohibited.');
  }
  if (config.requiresFullPageReloadPerLayer) {
    violations.push('Full-page reload per layer destroys spatial context.');
  }
  if (!config.preservesSpatialContextAnchor) {
    violations.push('Must preserve persistent spatial domain anchor.');
  }
  if (!config.boundsMaxDepthToLevelSix) {
    violations.push('Must enforce maximum bounded depth of Level 6.');
  }
  if (!config.supportsCalmFailurePreservation) {
    violations.push('Must preserve current state and provide calm explanation on layer fetch failure.');
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * 11. Acceptance & Certification Gate Verifier for GX-R012
 */
export function verifyGXR012CertificationGate(statement: string): {
  readonly passed: boolean;
  readonly canonicalStatement: string;
  readonly similarityRatio: number;
} {
  const normalizedCandidate = statement.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const normalizedCanonical = GX_R012_CERTIFICATION_GATE_STATEMENT.toLowerCase().replace(/[^a-z0-9]/g, ' ');

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
    canonicalStatement: GX_R012_CERTIFICATION_GATE_STATEMENT,
    similarityRatio: similarity,
  };
}
