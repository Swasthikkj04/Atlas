/**
 * GX-R008 — Understanding Transition Contract
 *
 * Phase: Guest Experience Redesign (GX-R)
 * Ticket: GX-R008
 * Type: UX / Architecture / Telemetry / State Machine Contract
 * Priority: P0 — Critical Transition
 * Depends on: GX-R001 → GX-R007
 * Unblocks: GX-R009 — Live Telemetry & Discovery Staging / Canvas Recomposition
 * Status: FROZEN_TRANSITION_CONTRACT
 *
 * Objective:
 * Define exactly what happens after the guest submits a domain and before
 * Nebula presents the first meaningful intelligence.
 *
 * Frozen Principle:
 * "The transition should feel like Nebula beginning to understand — not a scanner running checks."
 */

export const GX_R008_TICKET_ID = 'GX-R008';
export const GX_R008_PHASE = 'Guest Experience Redesign';
export const GX_R008_STATUS = 'FROZEN_TRANSITION_CONTRACT';

export const GX_R008_FROZEN_PRINCIPLE =
  'The transition should feel like Nebula beginning to understand — not a scanner running checks.';

export const GX_R008_NEBULA_PAUSE_MS = 520;

export const GX_R008_CERTIFICATION_GATE_STATEMENT =
  'A guest can submit a domain and experience a calm, spatially stable transition in which Nebula visibly begins forming an understanding, without feeling that they have entered a conventional security scanner.';

/**
 * 1. Canonical Cognitive Understanding Stages
 */
export interface CognitiveStageSpec {
  id: string;
  statement: string;
  subtext: string;
  minDurationMs: number;
  prohibitedScannerEquivalent: string;
}

export const CANONICAL_COGNITIVE_STAGES: readonly CognitiveStageSpec[] = [
  {
    id: 'stage_perimeter',
    statement: 'Establishing the perimeter.',
    subtext: 'Resolving authoritative edge infrastructure and routing boundaries.',
    minDurationMs: 800,
    prohibitedScannerEquivalent: 'Scanning DNS records & Anycast IP addresses...',
  },
  {
    id: 'stage_infrastructure',
    statement: 'Reading the infrastructure.',
    subtext: 'Observing publicly deployed systems, cryptography, and server protocols.',
    minDurationMs: 850,
    prohibitedScannerEquivalent: 'Checking SSL certificates and probing HTTP ports...',
  },
  {
    id: 'stage_signals',
    statement: 'Connecting the signals.',
    subtext: 'Synthesizing relationship evidence and behavioral patterns across systems.',
    minDurationMs: 800,
    prohibitedScannerEquivalent: 'Fingerprinting 127 tech signatures and vulnerabilities...',
  },
  {
    id: 'stage_synthesis',
    statement: 'Building the current understanding.',
    subtext: 'Assembling the canonical architecture overview and executive summary.',
    minDurationMs: 750,
    prohibitedScannerEquivalent: 'Compiling vulnerability report (89% complete)...',
  },
] as const;

/**
 * 2. Canonical Transition Lifecycle States
 */
export type TransitionState =
  | 'IDLE'
  | 'COMMIT_INTENT'
  | 'NEBULA_PAUSE'
  | 'UNDERSTANDING'
  | 'PARTIAL_UNDERSTANDING'
  | 'READY'
  | 'ERROR_RECOVERY';

export interface StateTransitionRule {
  from: TransitionState;
  to: TransitionState;
  trigger: string;
  guarantee: string;
}

export const TRANSITION_STATE_RULES: readonly StateTransitionRule[] = [
  {
    from: 'IDLE',
    to: 'COMMIT_INTENT',
    trigger: 'Guest triggers Understand → with valid domain',
    guarantee: 'Domain intent is frozen and debounced; duplicate submissions locked',
  },
  {
    from: 'COMMIT_INTENT',
    to: 'NEBULA_PAUSE',
    trigger: 'Intent acknowledgement & API dispatch',
    guarantee: 'Deliberate ~520ms Nebula Pause creates calm cognitive bridge',
  },
  {
    from: 'NEBULA_PAUSE',
    to: 'UNDERSTANDING',
    trigger: '520ms elapsed and backend understanding worker active',
    guarantee: 'Shell remains spatially locked; progressive cognitive statements begin',
  },
  {
    from: 'UNDERSTANDING',
    to: 'PARTIAL_UNDERSTANDING',
    trigger: 'Canonical summary/brief ready while auxiliary probes continue',
    guarantee: 'Presents first meaningful intelligence immediately without artificial hold',
  },
  {
    from: 'UNDERSTANDING',
    to: 'READY',
    trigger: 'Full intelligence synthesis complete',
    guarantee: 'Seamless transition into bounded Guest Workspace overview',
  },
  {
    from: 'PARTIAL_UNDERSTANDING',
    to: 'READY',
    trigger: 'Remaining background probes settle',
    guarantee: 'Progressive disclosure updates without layout jump or full reload',
  },
  {
    from: 'UNDERSTANDING',
    to: 'ERROR_RECOVERY',
    trigger: 'Network or domain resolution failure',
    guarantee: 'Preserves shell; presents calm explanation with retry; no stack traces',
  },
] as const;

/**
 * 3. Scope & Stability Invariants
 */
export const UNDERSTANDING_TRANSITION_INVARIANTS = [
  'Submission handoff freezes domain intent and prevents duplicate clicks',
  'Guest remains inside the bounded GX workspace throughout transition (no full-page takeover)',
  'Domain remains continuously visible in header or top anchor throughout understanding',
  'Telemetry avoids percentage counters, check counts (e.g. 127/500), and progress tracks',
  'First meaningful understanding renders immediately as soon as canonical data is available',
  'Errors are communicated calmly with a clear retry action and zero stack traces',
  'All state transitions announce politely via aria-live="polite"',
  'Reduced motion executes the transition without forced motion pauses',
] as const;

/**
 * 4. Eight Explicitly Prohibited Scanner Anti-Patterns
 */
export const PROHIBITED_TRANSITION_ANTI_PATTERNS = [
  '"Scanning..." dashboard with security radar / radar grid',
  'Percentage completion counters (e.g., 45%, 74%, 99%)',
  'Fake technical check counters (e.g., "127 / 500 checks completed")',
  'Infinite animated telemetry loops or matrix rain text',
  'Replacing the entire page with a full-screen loading spinner',
  'Artificial 5–10 second delays when backend data is already available',
  'Exposing internal worker/job implementation or microservice identifiers',
  'Making the guest wait for secondary intelligence when canonical brief is ready',
] as const;

/**
 * Transition State Machine Configuration Validator
 */
export interface TransitionConfig {
  hasPercentageCounter: boolean;
  hasCheckCounter: boolean;
  hasScannerTerminology: boolean;
  hasPageReplacementLoader: boolean;
  hasArtificialLongDelays: boolean;
  supportsPartialUnderstanding: boolean;
  preservesDomainVisibility: boolean;
  hidesStackTracesOnError: boolean;
  usesPoliteAriaLive: boolean;
  nebulaPauseMs: number;
}

export interface TransitionVerificationResult {
  valid: boolean;
  violation?: string;
}

export function validateTransitionStateMachine(config: TransitionConfig): TransitionVerificationResult {
  if (config.hasPercentageCounter) {
    return {
      valid: false,
      violation: 'Percentage counters (e.g. 74%) violate GX-R008 telemetry restraint.',
    };
  }

  if (config.hasCheckCounter) {
    return {
      valid: false,
      violation: 'Check counters (e.g. 127/500) violate GX-R008 telemetry restraint.',
    };
  }

  if (config.hasScannerTerminology) {
    return {
      valid: false,
      violation: 'Scanner vocabulary ("Scanning DNS...", "Probing ports...") is prohibited in GX.',
    };
  }

  if (config.hasPageReplacementLoader) {
    return {
      valid: false,
      violation: 'Replacing the entire page with a loading takeover violates shell stability.',
    };
  }

  if (config.hasArtificialLongDelays) {
    return {
      valid: false,
      violation: 'Artificial delays (5–10s) are prohibited; present intelligence as soon as ready.',
    };
  }

  if (!config.supportsPartialUnderstanding) {
    return {
      valid: false,
      violation: 'Must support partial understanding when canonical intelligence is ready early.',
    };
  }

  if (!config.preservesDomainVisibility) {
    return {
      valid: false,
      violation: 'Domain name must remain continuously visible throughout understanding.',
    };
  }

  if (!config.hidesStackTracesOnError) {
    return {
      valid: false,
      violation: 'Technical stack traces must never be exposed to the guest on failure.',
    };
  }

  if (!config.usesPoliteAriaLive) {
    return {
      valid: false,
      violation: 'State transitions must be announced via aria-live="polite".',
    };
  }

  if (config.nebulaPauseMs < 500 || config.nebulaPauseMs > 540) {
    return {
      valid: false,
      violation: `Nebula Pause must be calibrated to ~520ms (got ${config.nebulaPauseMs}ms).`,
    };
  }

  return { valid: true };
}

/**
 * Certification Gate Verifier for GX-R008
 */
export function verifyGXR008CertificationGate(statement: string): {
  passed: boolean;
  canonicalStatement: string;
  similarityRatio: number;
} {
  const normalizedCandidate = statement.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const normalizedCanonical = GX_R008_CERTIFICATION_GATE_STATEMENT.toLowerCase().replace(/[^a-z0-9]/g, ' ');

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
    canonicalStatement: GX_R008_CERTIFICATION_GATE_STATEMENT,
    similarityRatio: similarity,
  };
}
