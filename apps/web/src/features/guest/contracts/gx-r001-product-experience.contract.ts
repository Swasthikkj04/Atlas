/**
 * GX-R001 — Guest Experience Product & Experience Contract
 *
 * Phase: GX-R — Nebula First Experience Redesign
 * Ticket: GX-R001
 * Type: Product / UX / Architecture
 * Priority: P0 — Foundation
 * Status: 🔒 Ready to Implement / Frozen Foundation
 * Unblocks: GX-R002 — Guest Workspace Information Architecture
 *
 * This contract establishes the canonical product definition, intelligence parity invariants,
 * operational boundaries, progressive disclosure hierarchy, premium design principles,
 * SEO boundaries, and production resilience gates for Nebula Guest Experience (GX).
 */

import type { ObservationSeverity } from '../types/index.ts';

// ─── 1. Canonical Product Definition ─────────────────────────────────────────

export const GX_R001_TICKET_ID = 'GX-R001' as const;
export const GX_R001_PHASE = 'GX-R — Nebula First Experience Redesign' as const;
export const GX_R001_STATUS = 'FROZEN_FOUNDATION' as const;

export const NEBULA_GX_CANONICAL_DEFINITION =
  "A temporary Guest Workspace that exposes Nebula's canonical infrastructure intelligence without requiring an account or providing persistent Workspace memory." as const;

export const GX_CORE_THESIS = {
  mission: 'Nebula lets anyone understand their infrastructure before asking them to create a Workspace.',
  intelligenceParity: 'GX provides the same underlying infrastructure intelligence available to registered Workspace users.',
  differentiatingFactor: 'The difference is persistence, not intelligence.',
} as const;

// ─── 2. Intelligence Parity & Semantic Chain Contracts ────────────────────────

export interface SemanticEvidenceChain {
  readonly observation: string;
  readonly interpretation: string;
  readonly significance: string;
  readonly evidenceRef: string;
}

export interface CanonicalFindingComparison {
  readonly findingId: string;
  readonly workspaceSeverity: ObservationSeverity;
  readonly guestSeverity: ObservationSeverity;
  readonly workspaceEvidenceChain: SemanticEvidenceChain;
  readonly guestEvidenceChain: SemanticEvidenceChain;
}

export interface IntelligenceAuthorityBoundary {
  readonly backendCanonical: readonly string[];
  readonly gxPresentationControlled: readonly string[];
  readonly gxProhibitedFromModifying: readonly string[];
}

export const INTELLIGENCE_AUTHORITY_BOUNDARY: IntelligenceAuthorityBoundary = {
  backendCanonical: [
    'finding_severity_calculation',
    'finding_identity_and_classification',
    'evidence_truth_and_raw_payloads',
    'observation_interpretation_logic',
    'infrastructure_conclusions_and_topology',
    'remediation_truth_and_guidance',
    'technology_confidence_scoring',
    'provider_attribution_signals',
  ],
  gxPresentationControlled: [
    'presentation_and_visual_styling',
    'information_hierarchy_and_density',
    'progressive_disclosure_timing',
    'interactive_filtering_and_expansion',
    'editorial_narrative_formatting',
    'topological_and_system_visualization',
  ],
  gxProhibitedFromModifying: [
    'severity_downgrading_or_upgrading',
    'finding_identity_or_synthetic_creation',
    'evidence_truth_or_payload_alteration',
    'observation_interpretation_tampering',
    'infrastructure_conclusions_speculation',
    'remediation_truth_alteration',
  ],
} as const;

// ─── 3. Experience Philosophy & Journey Stages ───────────────────────────────

export type ExperienceJourneyStage =
  | 'CURIOSITY'
  | 'UNDERSTANDING'
  | 'DISCOVERY'
  | 'CONFIDENCE'
  | 'OPTIONAL_CONTINUITY';

export interface JourneyStageDefinition {
  readonly stage: ExperienceJourneyStage;
  readonly userMentalState: string;
  readonly productBehavior: string;
  readonly antiPattern: string;
}

export const EXPERIENCE_JOURNEY_STAGES: readonly JourneyStageDefinition[] = [
  {
    stage: 'CURIOSITY',
    userMentalState: 'Wants to see what Nebula understands about a specific domain',
    productBehavior: 'Invites domain entry without commitment, upfront forms, or marketing noise',
    antiPattern: 'Aggressive marketing landing page or forced lead-generation gate',
  },
  {
    stage: 'UNDERSTANDING',
    userMentalState: 'Observes live telemetry and progressive architectural synthesis',
    productBehavior: 'Displays active understanding with deliberate cadence (520ms Nebula pause)',
    antiPattern: 'Generic loading spinner or silent blank screen',
  },
  {
    stage: 'DISCOVERY',
    userMentalState: 'Reads executive interpretation and explores infrastructure topology',
    productBehavior: 'Presents high-level narrative first, then structured components and findings',
    antiPattern: 'Dumping raw uncontextualized scanner tables',
  },
  {
    stage: 'CONFIDENCE',
    userMentalState: 'Verifies evidence chain and trusts conclusions',
    productBehavior: 'Exposes exact cryptographic SHA-256 hashes, DNS/TLS/HTTP evidence hops',
    antiPattern: 'Opaque AI hallucinations without verifiable wire evidence',
  },
  {
    stage: 'OPTIONAL_CONTINUITY',
    userMentalState: 'Values the understanding and wishes to preserve/monitor it',
    productBehavior: 'Offers seamless "Keep this understanding" workspace transition',
    antiPattern: 'Aggressive paywall modal, countdown timer, or lockout prompt',
  },
] as const;

// ─── 4. Guest Workspace vs Authenticated Workspace Matrix ─────────────────────

export type WorkspaceCapabilityType =
  | 'DOMAIN_IDENTITY'
  | 'CURRENT_UNDERSTANDING'
  | 'EXECUTIVE_INTERPRETATION'
  | 'FINDINGS_INTELLIGENCE'
  | 'INFRASTRUCTURE_UNDERSTANDING'
  | 'EVIDENCE_INSPECTION'
  | 'PROGRESSIVE_INVESTIGATION'
  | 'UNDERSTANDING_FRESHNESS'
  | 'RELEVANT_SYSTEM_STATES'
  | 'PERSISTENT_MEMORY'
  | 'HISTORICAL_COMPARISONS'
  | 'DOMAIN_MANAGEMENT'
  | 'CONTINUOUS_MONITORING'
  | 'WORKSPACE_ADMINISTRATION'
  | 'ACCOUNT_SETTINGS'
  | 'LONG_TERM_INFRASTRUCTURE_HISTORY'
  | 'TEAM_COLLABORATION';

export interface CapabilityBoundaryRule {
  readonly capability: WorkspaceCapabilityType;
  readonly label: string;
  readonly guestWorkspace: boolean;
  readonly authenticatedWorkspace: boolean;
  readonly reason: string;
}

export const WORKSPACE_CAPABILITY_MATRIX: readonly CapabilityBoundaryRule[] = [
  {
    capability: 'DOMAIN_IDENTITY',
    label: 'Domain Identity Resolution',
    guestWorkspace: true,
    authenticatedWorkspace: true,
    reason: 'Both surfaces require clear, authoritative domain identity.',
  },
  {
    capability: 'CURRENT_UNDERSTANDING',
    label: 'Current Infrastructure Understanding',
    guestWorkspace: true,
    authenticatedWorkspace: true,
    reason: 'Core value proposition is identical across guest and workspace.',
  },
  {
    capability: 'EXECUTIVE_INTERPRETATION',
    label: 'Executive Brief & Synthesis',
    guestWorkspace: true,
    authenticatedWorkspace: true,
    reason: 'Editorial narrative synthesis is accessible in temporary session.',
  },
  {
    capability: 'FINDINGS_INTELLIGENCE',
    label: 'Authoritative Infrastructure Findings',
    guestWorkspace: true,
    authenticatedWorkspace: true,
    reason: 'Identical finding severities, impacts, and confidence ratings.',
  },
  {
    capability: 'INFRASTRUCTURE_UNDERSTANDING',
    label: 'Categorized Infrastructure Inventory & Topology',
    guestWorkspace: true,
    authenticatedWorkspace: true,
    reason: 'Full 8-category technology and perimeter understanding exposed.',
  },
  {
    capability: 'EVIDENCE_INSPECTION',
    label: 'Raw Protocol & Wire Evidence Lineage',
    guestWorkspace: true,
    authenticatedWorkspace: true,
    reason: 'Guests can verify HTTP headers, DNS records, and TLS certificates.',
  },
  {
    capability: 'PROGRESSIVE_INVESTIGATION',
    label: 'Progressive Deep Investigation',
    guestWorkspace: true,
    authenticatedWorkspace: true,
    reason: 'Exploration of finding context and anti-overreach boundaries.',
  },
  {
    capability: 'UNDERSTANDING_FRESHNESS',
    label: 'Understanding Freshness & Timestamp Authority',
    guestWorkspace: true,
    authenticatedWorkspace: true,
    reason: 'Clear indication of when the current understanding was synthesized.',
  },
  {
    capability: 'RELEVANT_SYSTEM_STATES',
    label: 'Resilience States (Loading, Partial, Quiet, Error)',
    guestWorkspace: true,
    authenticatedWorkspace: true,
    reason: 'Full UI state matrix handles partial signals and failures gracefully.',
  },
  {
    capability: 'PERSISTENT_MEMORY',
    label: 'Persistent Snapshot Storage & History',
    guestWorkspace: false,
    authenticatedWorkspace: true,
    reason: 'Requires database account ownership and workspace persistence.',
  },
  {
    capability: 'HISTORICAL_COMPARISONS',
    label: 'Historical Snapshot Diffing & Change Forensics',
    guestWorkspace: false,
    authenticatedWorkspace: true,
    reason: 'Diffing requires multi-snapshot historical timeline lineage.',
  },
  {
    capability: 'DOMAIN_MANAGEMENT',
    label: 'Multi-Domain Portfolio Management',
    guestWorkspace: false,
    authenticatedWorkspace: true,
    reason: 'Guests operate on a single temporary domain understanding at a time.',
  },
  {
    capability: 'CONTINUOUS_MONITORING',
    label: 'Automated Scheduled Re-understanding & Alerts',
    guestWorkspace: false,
    authenticatedWorkspace: true,
    reason: 'Background cron and webhook notifications require registered account.',
  },
  {
    capability: 'WORKSPACE_ADMINISTRATION',
    label: 'Workspace Administration & Access Control',
    guestWorkspace: false,
    authenticatedWorkspace: true,
    reason: 'Admin capabilities are strictly scoped to authenticated organizations.',
  },
  {
    capability: 'ACCOUNT_SETTINGS',
    label: 'User Account & Security Settings',
    guestWorkspace: false,
    authenticatedWorkspace: true,
    reason: 'Guest experience requires zero credentials or user profiles.',
  },
  {
    capability: 'LONG_TERM_INFRASTRUCTURE_HISTORY',
    label: 'Infinite Chronological Memory & Auditing',
    guestWorkspace: false,
    authenticatedWorkspace: true,
    reason: 'Multi-year immutable snapshot archive is an authenticated feature.',
  },
  {
    capability: 'TEAM_COLLABORATION',
    label: 'Team Members, Invites & Shared Annotations',
    guestWorkspace: false,
    authenticatedWorkspace: true,
    reason: 'Collaboration requires organization membership context.',
  },
] as const;

// ─── 5. Experience Architecture: Progressive Disclosure Hierarchy ────────────

export type ProgressiveDisclosureLevel =
  | 'DOMAIN'
  | 'CURRENT_UNDERSTANDING'
  | 'WHAT_MATTERS'
  | 'OTHER_OBSERVATIONS'
  | 'INFRASTRUCTURE'
  | 'EVIDENCE'
  | 'DEEP_INVESTIGATION';

export interface ProgressiveDisclosureStep {
  readonly rank: number;
  readonly level: ProgressiveDisclosureLevel;
  readonly title: string;
  readonly description: string;
  readonly cognitiveObjective: string;
}

export const PROGRESSIVE_DISCLOSURE_HIERARCHY: readonly ProgressiveDisclosureStep[] = [
  {
    rank: 1,
    level: 'DOMAIN',
    title: 'Domain Identity',
    description: 'Target FQDN, favicon, resolution status, and understanding metadata',
    cognitiveObjective: 'Anchor user context in the specific infrastructure being examined',
  },
  {
    rank: 2,
    level: 'CURRENT_UNDERSTANDING',
    title: 'Executive Understanding',
    description: 'Synthesized editorial brief and high-level architectural posture',
    cognitiveObjective: 'Communicate the big picture before overwhelming with data',
  },
  {
    rank: 3,
    level: 'WHAT_MATTERS',
    title: 'High-Impact Findings & Primary Attention',
    description: 'Dominant architectural risks, security gaps, and critical items',
    cognitiveObjective: 'Highlight immediate priorities that warrant engineering focus',
  },
  {
    rank: 4,
    level: 'OTHER_OBSERVATIONS',
    title: 'Secondary Observations & Operational Posture',
    description: 'Medium/low/informational signals, best-practice recommendations',
    cognitiveObjective: 'Provide thoroughness without diluting critical focus',
  },
  {
    rank: 5,
    level: 'INFRASTRUCTURE',
    title: 'Categorized Infrastructure Topology & Technologies',
    description: '8-category inventory (DNS, Web Servers, Edge/CDN, TLS, App, Cloud, etc.)',
    cognitiveObjective: 'Show complete component map and ingress relationships',
  },
  {
    rank: 6,
    level: 'EVIDENCE',
    title: 'Verifiable Wire Evidence & Protocol Traces',
    description: 'Raw HTTP headers, DNS record payloads, TLS certificate SANs, hashes',
    cognitiveObjective: 'Ground every claim in immutable, observable wire facts',
  },
  {
    rank: 7,
    level: 'DEEP_INVESTIGATION',
    title: 'Deep Investigation & Anti-Overreach Boundaries',
    description: 'Explicit "What this establishes" vs "What this does NOT prove" analysis',
    cognitiveObjective: 'Build unshakeable institutional trust through honesty',
  },
] as const;

// ─── 6. Premium Design Contract ──────────────────────────────────────────────

export interface DesignSystemRule {
  readonly category: string;
  readonly required: readonly string[];
  readonly prohibited: readonly string[];
}

export const PREMIUM_DESIGN_CONTRACT: readonly DesignSystemRule[] = [
  {
    category: 'Typography',
    required: [
      'Editorial-quality typography (Newsreader serif for display / narrative synthesis)',
      'Inter sans for structured data, metrics, and labels',
      'JetBrains Mono for code, DNS records, HTTP headers, and hashes',
      'Optimal reading measure (65–75 CPL / 720–800px)',
    ],
    prohibited: [
      'Generic unstyled SaaS font stacks',
      'Oversized marketing hype copy or buzzwords',
      'Inconsistent font weight proliferation',
    ],
  },
  {
    category: 'Color & Surfaces',
    required: [
      'Sophisticated muted surface hierarchy (#F7F7F5 canvas, #FFFFFF cards, #FAFAF8 secondary)',
      'Dark mode counterpart surfaces (#121514, #1A1D1C, #1E2220)',
      'Restrained semantic colors (6-tier severity with 8% light / 12% dark tint backgrounds)',
      'Subtle hairline borders (#E1E1DC / #E7E7E3)',
    ],
    prohibited: [
      'Generic bright SaaS dashboard styling',
      'Rainbow full-card severity fills',
      'Unnecessary heavy gradients or neon overload',
      'Glassmorphism and blurred card visual noise',
    ],
  },
  {
    category: 'Motion & Atmosphere',
    required: [
      'Meaningful motion with 520ms Nebula Pause timing',
      'Smooth cubic-bezier(0.16, 1, 0.3, 1) easing',
      'Subtle atmospheric constellation background reacting to understanding phase',
      'Full reduced-motion (prefers-reduced-motion: reduce) support',
    ],
    prohibited: [
      'Decorative animations without cognitive meaning',
      'Jittery spinners and flashing progress indicators',
      '"AI-looking" purple particle gimmicks or robot mascots',
    ],
  },
  {
    category: 'Layout & Hierarchy',
    required: [
      'Base-8 unbroken spatial rhythm (2px to 96px)',
      'Precise visual hierarchy with strong editorial rhythm',
      'Exceptional whitespace and deliberate density tiers',
      'Responsive adaptations across mobile, tablet, desktop, and large displays',
    ],
    prohibited: [
      'Excessive card grids and repetitive KPI tiles',
      'Cluttered dashboards with equal visual weight everywhere',
      'Arbitrary spacing values outside the Base-8 design tokens',
    ],
  },
] as const;

// ─── 7. SEO & Privacy Boundaries Contract ────────────────────────────────────

export interface SeoClassification {
  readonly surface: string;
  readonly pathPattern: string;
  readonly indexable: boolean;
  readonly rationale: string;
  readonly securityBoundary: string;
}

export const SEO_INDEXABILITY_REGISTRY: readonly SeoClassification[] = [
  {
    surface: 'Public Entry & Landing',
    pathPattern: '/',
    indexable: true,
    rationale: 'Public homepage introducing Nebula capabilities and value proposition.',
    securityBoundary: 'Contains only public marketing and informational content.',
  },
  {
    surface: 'Guest Experience Entry',
    pathPattern: '/guest',
    indexable: true,
    rationale: 'Public entry point allowing users to input any public domain target.',
    securityBoundary: 'Contains no private user or domain data until submitted.',
  },
  {
    surface: 'Public Documentation & Help',
    pathPattern: '/docs/*',
    indexable: true,
    rationale: 'Public educational documentation, architecture guides, and references.',
    securityBoundary: 'Publicly consumable technical documentation.',
  },
  {
    surface: 'Guest Active Assessment Results',
    pathPattern: '/guest?domain=*',
    indexable: false,
    rationale: 'Temporary guest assessment session data is ephemeral and session-scoped.',
    securityBoundary: 'Never indexed by default; preserves guest privacy and ephemeral session state.',
  },
  {
    surface: 'Authenticated Workspace Shell',
    pathPattern: '/workspace/*',
    indexable: false,
    rationale: 'Private workspace environment requiring authenticated session.',
    securityBoundary: 'Requires authentication guard; protected behind noindex, nofollow and session auth.',
  },
  {
    surface: 'Admin Console Surfaces',
    pathPattern: '/admin/*',
    indexable: false,
    rationale: 'Internal administration and operator platform.',
    securityBoundary: 'Requires admin MFA session; zero public indexing allowed.',
  },
  {
    surface: 'Account & Settings Surfaces',
    pathPattern: '/settings/*',
    indexable: false,
    rationale: 'Private user settings, credentials, and profile management.',
    securityBoundary: 'Strictly private authenticated user data.',
  },
] as const;

// ─── 8. Production Contract: Pillars of Production Readiness ─────────────────

export interface ProductionPillarRequirement {
  readonly pillar: 'Performance' | 'Accessibility' | 'Responsive' | 'Resilience' | 'Security';
  readonly requirements: readonly string[];
}

export const PRODUCTION_CONTRACT_PILLARS: readonly ProductionPillarRequirement[] = [
  {
    pillar: 'Performance',
    requirements: [
      'Minimal unnecessary JavaScript payload with tree-shaken imports',
      'Controlled animation cost with GPU-accelerated transforms and opacity only',
      'Efficient rendering with zero unneeded React re-renders during state transitions',
      'Fast initial interaction (sub-300ms interactive input state)',
    ],
  },
  {
    pillar: 'Accessibility',
    requirements: [
      'Semantic HTML structure with proper landmark regions (main, header, footer, section)',
      'Complete keyboard navigation with visible focus indicators (outline-ring/50)',
      'Screen-reader compatible headings, aria-labels, and live regions for telemetry',
      'Sufficient color contrast meeting WCAG 2.1 AA across light and dark themes',
      'Full reduced-motion support disabling kinetic transitions when requested',
    ],
  },
  {
    pillar: 'Responsive',
    requirements: [
      'Mobile-first responsive layout adapting gracefully down to 320px viewports',
      'Tablet-optimized reading surfaces and touch-friendly interactive targets (min 44px)',
      'Desktop wide-canvas layout with bounded max-width (720–800px reading column / 1280px container)',
      'Large display adaptations preserving visual rhythm and avoiding over-stretched content',
    ],
  },
  {
    pillar: 'Resilience',
    requirements: [
      'First-run clean state with curated sample domains (stripe.com, github.com, etc.)',
      'Loading state with progressive thinking sequence and 520ms pause',
      'Partial results state handling incomplete probes without breaking the brief',
      'Quiet/stable state communicating infrastructure stability with dignity',
      'Failure state with typed error codes (NETWORK_FAILURE, DOMAIN_INSUFFICIENT_SIGNAL, RATE_LIMIT_EXCEEDED)',
      'Retry capabilities preserving the previously entered domain',
      'Network interruption handling with graceful offline messaging',
    ],
  },
  {
    pillar: 'Security',
    requirements: [
      'Strict guest session isolation preventing cross-guest data leakage',
      'Zero sensitive data exposure in public URLs or local storage',
      'No accidental Workspace privilege elevation from guest context',
      'No Admin surface exposure or route leakage in guest bundles',
      'Domain input normalization and sanitization preventing injection attacks',
    ],
  },
] as const;

// ─── 9. Contract Enforcement & Invariant Verification Engine ─────────────────

export interface GXContractValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly certifiedGate: boolean;
}

/**
 * Validates that a proposed Guest finding representation matches canonical Workspace intelligence.
 */
export function validateFindingIntelligenceParity(
  comparison: CanonicalFindingComparison
): { valid: boolean; violation?: string } {
  if (comparison.guestSeverity !== comparison.workspaceSeverity) {
    return {
      valid: false,
      violation: `Severity mismatch for finding "${comparison.findingId}": Workspace is "${comparison.workspaceSeverity}", but Guest attempted "${comparison.guestSeverity}". Guest MUST NOT downgrade or alter canonical severity.`,
    };
  }

  const { workspaceEvidenceChain: wChain, guestEvidenceChain: gChain } = comparison;
  if (
    wChain.observation !== gChain.observation ||
    wChain.interpretation !== gChain.interpretation ||
    wChain.significance !== gChain.significance ||
    wChain.evidenceRef !== gChain.evidenceRef
  ) {
    return {
      valid: false,
      violation: `Semantic evidence chain broken for finding "${comparison.findingId}". Guest must preserve exact observation → interpretation → significance → evidence lineage.`,
    };
  }

  return { valid: true };
}

/**
 * Validates that a feature capability complies with the Guest Workspace operational boundary.
 */
export function validateGuestWorkspaceBoundary(
  capability: WorkspaceCapabilityType
): { allowedInGuest: boolean; reason: string } {
  const rule = WORKSPACE_CAPABILITY_MATRIX.find((r) => r.capability === capability);
  if (!rule) {
    return {
      allowedInGuest: false,
      reason: `Unknown capability "${capability}" is not registered in WORKSPACE_CAPABILITY_MATRIX.`,
    };
  }

  return {
    allowedInGuest: rule.guestWorkspace,
    reason: rule.reason,
  };
}

/**
 * Validates that a route URL complies with SEO indexability and security rules.
 */
export function evaluateSeoIndexability(path: string): {
  indexable: boolean;
  securityBoundary: string;
  metaRobotsHeader: string;
} {
  const cleanPath = path.trim().toLowerCase();

  // Workspace, Settings, Admin, and Guest results with query parameters are strictly NON-INDEXABLE
  if (
    cleanPath.startsWith('/workspace') ||
    cleanPath.startsWith('/admin') ||
    cleanPath.startsWith('/settings') ||
    cleanPath.startsWith('/auth') ||
    cleanPath.includes('domain=')
  ) {
    return {
      indexable: false,
      securityBoundary: 'Private authenticated or ephemeral session surface.',
      metaRobotsHeader: 'noindex, nofollow',
    };
  }

  if (cleanPath === '/' || cleanPath === '/guest' || cleanPath.startsWith('/docs')) {
    return {
      indexable: true,
      securityBoundary: 'Public informational entry surface.',
      metaRobotsHeader: 'index, follow',
    };
  }

  return {
    indexable: false,
    securityBoundary: 'Default secure isolation for unclassified routes.',
    metaRobotsHeader: 'noindex, nofollow',
  };
}

/**
 * 🔒 GX-R001 Certification Gate Evaluation
 *
 * Answers the fundamental question:
 * "What is GX?"
 *
 * Must return the canonical answer:
 * "A temporary Guest Workspace that exposes Nebula's canonical infrastructure intelligence
 * without requiring an account or providing persistent Workspace memory."
 */
export function verifyGXR001CertificationGate(proposedAnswer: string): {
  passed: boolean;
  canonicalAnswer: string;
  similarityRatio: number;
} {
  const normalizedProposed = proposedAnswer.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
  const normalizedCanonical = NEBULA_GX_CANONICAL_DEFINITION.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');

  const passed = normalizedProposed === normalizedCanonical;

  // Simple word-overlap ratio calculation for diagnostic output
  const proposedWords = new Set(normalizedProposed.split(/\s+/));
  const canonicalWords = new Set(normalizedCanonical.split(/\s+/));
  let matchCount = 0;
  for (const word of canonicalWords) {
    if (proposedWords.has(word)) {
      matchCount++;
    }
  }
  const similarityRatio = matchCount / canonicalWords.size;

  return {
    passed,
    canonicalAnswer: NEBULA_GX_CANONICAL_DEFINITION,
    similarityRatio,
  };
}
