/**
 * GX-R009 — Live Telemetry & Discovery Staging Contract
 *
 * Phase: Guest Experience Redesign (GX-R)
 * Ticket: GX-R009
 * Type: UX / Architecture / Telemetry Staging / Visual Recomposition Contract
 * Priority: P0 — Foundational Canvas Recomposition
 * Depends on: GX-R001 → GX-R008
 * Unblocks: GX-R010 — First Meaningful Intelligence & Progressive Disclosure
 * Status: FROZEN_TELEMETRY_STAGING_CONTRACT
 *
 * Objective:
 * Define the visual composition of the UNDERSTANDING state after GX-R008 hands
 * control from intent submission to live discovery.
 *
 * Frozen Principle:
 * "Show Nebula thinking, not Nebula scanning."
 */

export const GX_R009_TICKET_ID = 'GX-R009';
export const GX_R009_PHASE = 'Guest Experience Redesign';
export const GX_R009_STATUS = 'FROZEN_TELEMETRY_STAGING_CONTRACT';

export const GX_R009_FROZEN_PRINCIPLE = 'Show Nebula thinking, not Nebula scanning.';

export const GX_R009_CERTIFICATION_GATE_STATEMENT =
  'A guest can watch Nebula transition from intent into live infrastructure understanding and perceive meaningful progress without being presented with scanner mechanics, fake telemetry, or visual noise.';

/**
 * 1. Four-Layer Telemetry Composition Architecture
 */
export interface TelemetryLayerSpec {
  layerId: 'LAYER_A' | 'LAYER_B' | 'LAYER_C' | 'LAYER_D';
  name: string;
  role: string;
  typography: string;
  motionTier: 'LEVEL_1_MICRO' | 'LEVEL_2_INTERFACE' | 'LEVEL_3_NEBULA_TRANSITION' | 'STATIC';
  requiredContent: string;
}

export const TELEMETRY_FOUR_LAYERS: readonly TelemetryLayerSpec[] = [
  {
    layerId: 'LAYER_A',
    name: 'Persistent Domain Context Anchor',
    role: 'Unwavering domain anchor ensuring guest orientation throughout live discovery',
    typography: 'JetBrains Mono uppercase indicator + domain string',
    motionTier: 'STATIC',
    requiredContent: 'UNDERSTANDING · {domain}',
  },
  {
    layerId: 'LAYER_B',
    name: 'Primary Cognitive Statement',
    role: 'High-prominence editorial statement communicating current cognitive milestone',
    typography: 'Newsreader serif (display font, 1.75rem – 2rem)',
    motionTier: 'LEVEL_2_INTERFACE',
    requiredContent: 'One of the 4 canonical cognitive statements (e.g. "Establishing the perimeter.")',
  },
  {
    layerId: 'LAYER_C',
    name: 'Quiet Discovery Context',
    role: 'Restrained secondary explanation providing architectural clarity without technical noise',
    typography: 'Inter sans-serif (13.5px – 14px text-muted-foreground)',
    motionTier: 'LEVEL_2_INTERFACE',
    requiredContent: 'Clear explanatory subtext (e.g. "Resolving authoritative edge infrastructure and routing boundaries.")',
  },
  {
    layerId: 'LAYER_D',
    name: 'System State Baseline',
    role: 'Tiny technical baseline confirming live backend connection',
    typography: 'JetBrains Mono (11px text-muted-foreground/50 tracking-wider)',
    motionTier: 'LEVEL_1_MICRO',
    requiredContent: 'UNDERSTANDING · LIVE',
  },
] as const;

/**
 * 2. Canonical Cognitive Stage Transitions & Truth Guarantees
 */
export interface CognitiveTelemetryStage {
  id: 'stage_perimeter' | 'stage_infrastructure' | 'stage_signals' | 'stage_synthesis';
  statement: string;
  context: string;
  visualBehavior: string;
  backendTruthSource: string;
}

export const COGNITIVE_TELEMETRY_STAGES: readonly CognitiveTelemetryStage[] = [
  {
    id: 'stage_perimeter',
    statement: 'Establishing the perimeter.',
    context: 'Resolving authoritative edge infrastructure and routing boundaries.',
    visualBehavior: 'Initial cognitive reveal; quiet domain anchor locked in view',
    backendTruthSource: 'DNS / Anycast resolution & nameserver telemetry probe',
  },
  {
    id: 'stage_infrastructure',
    statement: 'Reading the infrastructure.',
    context: 'Observing publicly deployed systems, cryptography, and server protocols.',
    visualBehavior: 'Previous statement settles quietly; new statement takes visual prominence',
    backendTruthSource: 'Edge TLS handshake & HTTP response header inspection',
  },
  {
    id: 'stage_signals',
    statement: 'Connecting the signals.',
    context: 'Synthesizing relationship evidence and behavioral patterns across systems.',
    visualBehavior: 'Strongest synthesis transition; signals cross-correlated',
    backendTruthSource: 'Technology fingerprinting & multi-hop ingress correlation',
  },
  {
    id: 'stage_synthesis',
    statement: 'Building the current understanding.',
    context: 'Assembling the canonical architecture overview and executive summary.',
    visualBehavior: 'Smooth spatial emergence toward the first intelligence surface',
    backendTruthSource: 'Executive Brief generation & canonical observation assembly',
  },
] as const;

/**
 * 3. Spatial Emergence Progression (Canvas Recomposition)
 */
export const SPATIAL_EMERGENCE_FLOW = [
  'UNDERSTANDING_DISCOVERY',
  'FIRST_SIGNAL_CRYSTALLIZATION',
  'CURRENT_UNDERSTANDING_EXECUTIVE_BRIEF',
  'WHAT_DESERVES_ATTENTION_OBSERVATIONS',
  'INFRASTRUCTURE_ARCHITECTURE_MATRIX',
] as const;

export type SpatialEmergenceStep = (typeof SPATIAL_EMERGENCE_FLOW)[number];

/**
 * 4. Slow Discovery & Resilience Invariants
 */
export const STALLED_DISCOVERY_COPY = {
  primary: 'Nebula is still forming the understanding.',
  subtext: 'Correlating multi-regional signals and routing evidence.',
};

export const FAILED_DISCOVERY_COPY = {
  primary: "Nebula couldn't complete this understanding.",
  action: 'Try again →',
  subtext: 'Ensure the domain is publicly reachable and try again.',
};

/**
 * 5. 11 Explicitly Rejected Scanner & Gimmick Patterns
 */
export const EXPLICITLY_REJECTED_TELEMETRY_PATTERNS = [
  'Radar animation with sweep lines or target blips',
  'Rotating 3D wireframe globe or orb',
  'Pulsing network graph nodes with active physics simulation',
  '"AI is thinking..." glowing sparkles or magical wand animations',
  'Fake matrix rain or green terminal scrolling text',
  'Progress percentage bars (e.g. 82%, 99%)',
  'Check counters (e.g. "127 / 184 checks completed")',
  'Security scanner checkmark lists (e.g. "DNS ✓", "TLS ✓", "HTTP ✓")',
  'Constant skeleton shimmer across unpopulated cards',
  'Manufactured artificial delays when backend data is already ready',
  'Full-screen spinner or blocking loader overlay',
] as const;

/**
 * Telemetry Staging Configuration Validator
 */
export interface TelemetryStagingConfig {
  hasRadarAnimation: boolean;
  hasRotatingGlobe: boolean;
  hasProgressPercentage: boolean;
  hasChecklistProgress: boolean;
  hasTerminalMatrixRain: boolean;
  hasFullPageLoader: boolean;
  hasArtificialDelays: boolean;
  preservesDomainAnchor: boolean;
  isBackendTruthDriven: boolean;
  supportsSpatialEmergence: boolean;
  usesPoliteAriaLive: boolean;
}

export interface TelemetryStagingResult {
  valid: boolean;
  violation?: string;
}

export function validateTelemetryStaging(config: TelemetryStagingConfig): TelemetryStagingResult {
  if (config.hasRadarAnimation) {
    return {
      valid: false,
      violation: 'Radar sweep animations violate GX-R009 telemetry restraint.',
    };
  }

  if (config.hasRotatingGlobe) {
    return {
      valid: false,
      violation: 'Rotating 3D globe graphics are prohibited in GX visual language.',
    };
  }

  if (config.hasProgressPercentage) {
    return {
      valid: false,
      violation: 'Progress percentage indicators (e.g. 82%) are strictly prohibited.',
    };
  }

  if (config.hasChecklistProgress) {
    return {
      valid: false,
      violation: 'Checklist tick-boxes (e.g. "DNS ✓", "TLS ✓") violate cognitive staging.',
    };
  }

  if (config.hasTerminalMatrixRain) {
    return {
      valid: false,
      violation: 'Fake terminal scrolling output or matrix rain is prohibited.',
    };
  }

  if (config.hasFullPageLoader) {
    return {
      valid: false,
      violation: 'Full-page loader takeovers violate shell stability.',
    };
  }

  if (config.hasArtificialDelays) {
    return {
      valid: false,
      violation: 'Artificial stage delay loops violate backend-truth staging.',
    };
  }

  if (!config.preservesDomainAnchor) {
    return {
      valid: false,
      violation: 'Domain context must remain continuously visible across all layers.',
    };
  }

  if (!config.isBackendTruthDriven) {
    return {
      valid: false,
      violation: 'Telemetry stages must be driven by genuine backend milestones.',
    };
  }

  if (!config.supportsSpatialEmergence) {
    return {
      valid: false,
      violation: 'Must support smooth spatial emergence rather than abrupt wall of cards.',
    };
  }

  if (!config.usesPoliteAriaLive) {
    return {
      valid: false,
      violation: 'Cognitive stage updates must be announced via aria-live="polite".',
    };
  }

  return { valid: true };
}

/**
 * Certification Gate Verifier for GX-R009
 */
export function verifyGXR009CertificationGate(statement: string): {
  passed: boolean;
  canonicalStatement: string;
  similarityRatio: number;
} {
  const normalizedCandidate = statement.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const normalizedCanonical = GX_R009_CERTIFICATION_GATE_STATEMENT.toLowerCase().replace(/[^a-z0-9]/g, ' ');

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
    canonicalStatement: GX_R009_CERTIFICATION_GATE_STATEMENT,
    similarityRatio: similarity,
  };
}
