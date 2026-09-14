/**
 * GX-R003 — Guest Shell & Entry Architecture Contract
 *
 * Phase: GX-R — Nebula First Experience Redesign
 * Ticket: GX-R003
 * Type: UX Architecture / Frontend Architecture
 * Priority: P0 — Blocking
 * Status: 🔒 Ready to Implement / Frozen Shell Architecture
 * Depends on: GX-R001 🔒, GX-R002 🔒
 * Unblocks: GX-R004 — Idle / First Impression Experience
 *
 * Establishes the 5-layer physical shell architecture, entry flow sequence,
 * guest context persistence model, context-preserving investigation surface,
 * 7-state shell stability contract, responsive frame behaviors, and rejected
 * shell patterns for the Nebula Guest Workspace.
 */

// ─── 1. Canonical Ticket & Principle Constants ───────────────────────────────

export const GX_R003_TICKET_ID = 'GX-R003' as const;
export const GX_R003_PHASE = 'GX-R — Nebula First Experience Redesign' as const;
export const GX_R003_STATUS = 'FROZEN_SHELL_ARCHITECTURE' as const;

export const GX_R003_CORE_PRINCIPLE =
  'The shell should disappear into the experience. The intelligence should remain the focus.' as const;

export const GX_R003_CANONICAL_RULE =
  'The Guest Workspace is an environment, not a page.' as const;

export const GX_R003_CERTIFICATION_GATE_STATEMENT =
  'A guest can enter Nebula, identify the domain being understood, recognize the current state, move through the intelligence surfaces, investigate evidence, and return to their previous context — all within one coherent bounded environment.' as const;

export const GX_R003_ATMOSPHERIC_PRINCIPLE =
  'Atmosphere establishes identity. Intelligence establishes value.' as const;

// ─── 2. Five Architectural Layers of the Guest Shell ─────────────────────────

export type GuestShellLayerId =
  | 'BRAND_IDENTITY'
  | 'ORIENTATION_CONTEXT'
  | 'INTELLIGENCE_CANVAS'
  | 'CONTEXTUAL_ACTIONS'
  | 'QUIET_PRODUCT_SIGNATURE';

export interface GuestShellLayerDefinition {
  readonly layerId: GuestShellLayerId;
  readonly layerOrder: number;
  readonly name: string;
  readonly description: string;
  readonly visualCharacteristics: string;
  readonly prohibitedPatterns: readonly string[];
}

export const GUEST_SHELL_LAYERS: readonly GuestShellLayerDefinition[] = [
  {
    layerId: 'BRAND_IDENTITY',
    layerOrder: 1,
    name: 'Brand / Identity Layer',
    description: 'Immediate but restrained Nebula presence anchoring product context.',
    visualCharacteristics: 'Restrained living logo, subtle uppercase typography, and clean surface boundary.',
    prohibitedPatterns: [
      'Oversized logos',
      'Promotional headlines',
      'Marketing banners',
      'Excessive gradients',
      '"AI-powered" buzzwords',
    ],
  },
  {
    layerId: 'ORIENTATION_CONTEXT',
    layerOrder: 2,
    name: 'Orientation / Context Layer',
    description: 'Maintains persistent awareness of target domain, state, and freshness.',
    visualCharacteristics: 'Domain breadcrumb, active state indicator, and quick-action trigger for new understanding.',
    prohibitedPatterns: [
      'Multi-level enterprise breadcrumb spam',
      'Misleading persistent account indicators',
      'Heavy drop-shadowed navbar chrome',
    ],
  },
  {
    layerId: 'INTELLIGENCE_CANVAS',
    layerOrder: 3,
    name: 'Intelligence Canvas',
    description: 'Primary visual region hosting Overview, Findings, Infrastructure, and Evidence.',
    visualCharacteristics: 'Bounded spatial canvas with 65-75 CPL measure, hairline borders, and calm elevation.',
    prohibitedPatterns: [
      'Endless 5,000px vertical document scroll',
      'Card-everything sprawl',
      'Equal-weight KPI grid counters',
    ],
  },
  {
    layerId: 'CONTEXTUAL_ACTIONS',
    layerOrder: 4,
    name: 'Contextual Actions Layer',
    description: 'Provides in-situ investigation triggers ("Understand why →") and earned continuity.',
    visualCharacteristics: 'Precise text/icon triggers embedded directly within relevant intelligence findings.',
    prohibitedPatterns: [
      'Sticky floating CTA bars',
      'Permanent "Upgrade Now" or "Sign Up" buttons',
      'Aggressive paywall modals',
    ],
  },
  {
    layerId: 'QUIET_PRODUCT_SIGNATURE',
    layerOrder: 5,
    name: 'Quiet Product Signature Layer',
    description: 'Subtle atmospheric baseline confirming engine telemetry and timestamp freshness.',
    visualCharacteristics: 'Calm monospace telemetry status, living signature indicator, and minimal legal/docs links.',
    prohibitedPatterns: [
      'Massive 4-column marketing sitemap footer',
      'Flashing promotional badges',
      'Social media share spam',
    ],
  },
] as const;

// ─── 3. Canonical Guest Entry Sequence ───────────────────────────────────────

export interface GuestEntrySequenceStep {
  readonly stepNumber: number;
  readonly stage: 'PUBLIC_ROOT' | 'GUEST_ENTRY' | 'DOMAIN_INTENT' | 'BEGIN_UNDERSTANDING' | 'GUEST_WORKSPACE';
  readonly path: string;
  readonly description: string;
}

export const CANONICAL_GUEST_ENTRY_SEQUENCE: readonly GuestEntrySequenceStep[] = [
  {
    stepNumber: 1,
    stage: 'PUBLIC_ROOT',
    path: '/',
    description: 'Nebula public surface directing guests toward instant infrastructure understanding.',
  },
  {
    stepNumber: 2,
    stage: 'GUEST_ENTRY',
    path: '/guest',
    description: 'Dedicated Guest Workspace entry surface presenting calm, focused domain input.',
  },
  {
    stepNumber: 3,
    stage: 'DOMAIN_INTENT',
    path: '/guest?domain=...',
    description: 'Guest specifies target FQDN or selects a curated sample domain (stripe.com, github.com).',
  },
  {
    stepNumber: 4,
    stage: 'BEGIN_UNDERSTANDING',
    path: '/guest?domain=...',
    description: 'Shell establishes itself immediately while real-time probe telemetry begins (520ms Nebula Pause).',
  },
  {
    stepNumber: 5,
    stage: 'GUEST_WORKSPACE',
    path: '/guest?domain=...',
    description: 'Full bounded Guest Workspace becomes interactive with synthesized intelligence.',
  },
] as const;

// ─── 4. Guest Context Persistence State Model ────────────────────────────────

export interface GuestSessionContextState {
  readonly currentDomain: string | null;
  readonly understandingState: 'IDLE' | 'UNDERSTANDING' | 'PARTIAL' | 'READY' | 'QUIET' | 'MEANINGFUL_CHANGE' | 'FAILURE';
  readonly activeSurface: 'overview' | 'findings' | 'infrastructure';
  readonly activeFindingId: string | null;
  readonly isInvestigating: boolean;
  readonly activeEvidenceContext: {
    readonly findingId: string;
    readonly title: string;
    readonly evidenceLineageCount: number;
  } | null;
  readonly returnTargetElementId: string | null;
}

// ─── 5. Seven-State Shell Stability Contract ─────────────────────────────────

export interface ShellStateBehavior {
  readonly state: 'IDLE' | 'UNDERSTANDING' | 'PARTIAL' | 'READY' | 'QUIET' | 'MEANINGFUL_CHANGE' | 'FAILURE';
  readonly shellPosture: string;
  readonly layoutJumpProhibited: boolean;
  readonly visualFocus: string;
}

export const SHELL_SEVEN_STATE_CONTRACT: readonly ShellStateBehavior[] = [
  {
    state: 'IDLE',
    shellPosture: 'Calm entry surface with prominent domain intent input and curated sample targets.',
    layoutJumpProhibited: true,
    visualFocus: 'Domain input bar',
  },
  {
    state: 'UNDERSTANDING',
    shellPosture: 'Stable shell established; progressive thinking telemetry with 520ms deliberate cadence.',
    layoutJumpProhibited: true,
    visualFocus: 'Telemetry synthesis sequence',
  },
  {
    state: 'PARTIAL',
    shellPosture: 'Initial executive brief rendered smoothly without layout collapse while auxiliary probes complete.',
    layoutJumpProhibited: true,
    visualFocus: 'Current understanding narrative with ongoing probe indicator',
  },
  {
    state: 'READY',
    shellPosture: 'Full bounded Guest Workspace active with complete overview and infrastructure topology.',
    layoutJumpProhibited: true,
    visualFocus: 'Primary story and architectural synthesis',
  },
  {
    state: 'QUIET',
    shellPosture: 'Calm, spacious intelligence confirming stable perimeter with zero artificial filler cards.',
    layoutJumpProhibited: true,
    visualFocus: 'Affirmative posture brief and infrastructure overview',
  },
  {
    state: 'MEANINGFUL_CHANGE',
    shellPosture: 'Primary attention finding receives visual priority with direct "Understand why →" trigger.',
    layoutJumpProhibited: true,
    visualFocus: 'Primary Attention story card',
  },
  {
    state: 'FAILURE',
    shellPosture: 'Same shell structure preserved with calm failure narrative, typed error code, and 1-click retry.',
    layoutJumpProhibited: true,
    visualFocus: 'Failure recovery action',
  },
] as const;

// ─── 6. Responsive Shell Frame Transformation ────────────────────────────────

export interface ResponsiveShellTier {
  readonly tier: 'Desktop' | 'Tablet' | 'Mobile';
  readonly minWidth: number;
  readonly maxWidth?: number;
  readonly shellComposition: string;
  readonly investigationTreatment: string;
  readonly scrollingRule: string;
}

export const RESPONSIVE_SHELL_TIERS: readonly ResponsiveShellTier[] = [
  {
    tier: 'Desktop',
    minWidth: 1024,
    shellComposition: 'Multi-pane spatial canvas; identity & orientation in fixed top band; 65-75 CPL measure.',
    investigationTreatment: 'Contextual slide-over drawer (480-560px) anchored to right canvas.',
    scrollingRule: 'Bounded canvas; localized contained scrolling where required; zero infinite page scroll.',
  },
  {
    tier: 'Tablet',
    minWidth: 641,
    maxWidth: 1023,
    shellComposition: 'Compact orientation header; refined canvas density with contained card surfaces.',
    investigationTreatment: 'Slide-over drawer or bottom sheet with backdrop lock.',
    scrollingRule: 'Contained region scrolling with preserved orientation anchor.',
  },
  {
    tier: 'Mobile',
    minWidth: 320,
    maxWidth: 640,
    shellComposition: 'Stacked bounded surfaces (Identity → Domain → Current Surface → Next contextual surface).',
    investigationTreatment: 'Full-screen overlay layer with dedicated top "← Return" navigation.',
    scrollingRule: 'Sequential surface scrolling permitted where content demands; infinite report dump prohibited.',
  },
] as const;

// ─── 7. Atmospheric Layer Contract ───────────────────────────────────────────

export interface AtmosphericContractRule {
  readonly permitted: readonly string[];
  readonly forbidden: readonly string[];
  readonly governingPrinciple: string;
}

export const ATMOSPHERIC_LAYER_CONTRACT: AtmosphericContractRule = {
  permitted: [
    'Subtle constellation node treatment',
    'Restrained background depth and elevation',
    'Extremely subtle ambient motion',
    'Controlled phase transitions (0.05 max idle opacity)',
  ],
  forbidden: [
    'Animated backgrounds competing with content',
    'Excessive stars and particle overload',
    'Distracting 3D or parallax gimmicks',
    'Continuous uncalm loop animations',
  ],
  governingPrinciple: GX_R003_ATMOSPHERIC_PRINCIPLE,
};

// ─── 8. Explicitly Rejected Shell Patterns ───────────────────────────────────

export const EXPLICITLY_REJECTED_SHELL_PATTERNS = [
  'Marketing landing page disguised as GX',
  'Traditional SaaS sidebar with 12 navigation items',
  'Dashboard KPI grid with equal-weight metric tiles',
  'Long-form report container with infinite scroll',
  'Full Workspace clone with disabled upgrade buttons',
  'Persistent upgrade/signup banners crowding the screen',
  'Excessive cosmic decoration and particle gimmicks',
  'Navigation-heavy application chrome',
  'State-specific page rebuilds that flash or jump',
] as const;

// ─── 9. Invariant Validators & Certification Engine ──────────────────────────

export interface ShellStructureValidationInput {
  readonly layersPresent: readonly GuestShellLayerId[];
  readonly maintainsContextPreservation: boolean;
  readonly usesInfiniteReportContainer: boolean;
  readonly hasStableStateTransitions: boolean;
}

/**
 * Validates that a guest shell implementation adheres to the 5-layer architecture.
 */
export function validateGuestShellStructure(
  input: ShellStructureValidationInput
): { valid: boolean; violation?: string } {
  const allLayers: readonly GuestShellLayerId[] = [
    'BRAND_IDENTITY',
    'ORIENTATION_CONTEXT',
    'INTELLIGENCE_CANVAS',
    'CONTEXTUAL_ACTIONS',
    'QUIET_PRODUCT_SIGNATURE',
  ];

  const missingLayers = allLayers.filter((l) => !input.layersPresent.includes(l));
  if (missingLayers.length > 0) {
    return {
      valid: false,
      violation: `Missing required shell layer(s): ${missingLayers.join(', ')}`,
    };
  }

  if (input.usesInfiniteReportContainer) {
    return {
      valid: false,
      violation: 'Shell violation: Infinite-scroll report containers are strictly prohibited.',
    };
  }

  if (!input.maintainsContextPreservation) {
    return {
      valid: false,
      violation: 'Shell violation: Shell must preserve origin context when opening contextual investigation.',
    };
  }

  if (!input.hasStableStateTransitions) {
    return {
      valid: false,
      violation: 'Shell violation: State transitions must not trigger structural layout jumps or full-page flashing.',
    };
  }

  return { valid: true };
}

/**
 * Validates that an investigation flow maintains context without dumping user onto a new page.
 */
export function validateInvestigationContextPreservation(flow: {
  triggerAction: string;
  opensContextualSurface: boolean;
  locksBackgroundCanvas: boolean;
  preservesOriginContext: boolean;
  restoresFocusOnDismiss: boolean;
}): { valid: boolean; violation?: string } {
  if (!flow.opensContextualSurface) {
    return {
      valid: false,
      violation: 'Investigation must open in a contextual surface (drawer/sheet/layer), not a separate page.',
    };
  }

  if (!flow.preservesOriginContext) {
    return {
      valid: false,
      violation: 'Origin domain and finding context must remain mounted and preserved beneath investigation.',
    };
  }

  if (!flow.restoresFocusOnDismiss) {
    return {
      valid: false,
      violation: 'Focus must be restored to trigger element upon dismissal.',
    };
  }

  return { valid: true };
}

/**
 * 🔒 GX-R003 Certification Gate Verification
 */
export function verifyGXR003CertificationGate(proposedStatement: string): {
  passed: boolean;
  canonicalStatement: string;
  centralRule: string;
  similarityRatio: number;
} {
  const normalize = (text: string) =>
    text.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()—]/g, '');

  const normalizedProposed = normalize(proposedStatement);
  const normalizedCanonical = normalize(GX_R003_CERTIFICATION_GATE_STATEMENT);

  const passed = normalizedProposed === normalizedCanonical;

  const proposedWords = new Set(normalizedProposed.split(/\s+/));
  const canonicalWords = new Set(normalizedCanonical.split(/\s+/));
  let matches = 0;
  for (const word of canonicalWords) {
    if (proposedWords.has(word)) {
      matches++;
    }
  }

  return {
    passed,
    canonicalStatement: GX_R003_CERTIFICATION_GATE_STATEMENT,
    centralRule: GX_R003_CANONICAL_RULE,
    similarityRatio: matches / canonicalWords.size,
  };
}
