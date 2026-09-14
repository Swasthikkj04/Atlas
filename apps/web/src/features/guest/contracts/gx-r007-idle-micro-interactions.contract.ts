/**
 * GX-R007 — Idle Micro-Interactions & Motion Language Contract
 *
 * Phase: Guest Experience Redesign (GX-R)
 * Ticket: GX-R007
 * Type: UX / Interaction / Motion / Accessibility Contract
 * Priority: P1 — Premium Experience
 * Depends on: GX-R001 → GX-R006
 * Unblocks: GX-R008 — Understanding Transition
 * Status: FROZEN_MOTION_LANGUAGE
 *
 * Objective:
 * Define the micro-interaction language of the idle Guest Workspace so Nebula
 * feels alive, responsive, and premium without becoming animated or distracting.
 *
 * Frozen Principle:
 * "Motion should communicate state, not decorate the interface."
 * The guest should feel that Nebula is quietly responsive, not constantly moving.
 */

export const GX_R007_TICKET_ID = 'GX-R007';
export const GX_R007_PHASE = 'Guest Experience Redesign';
export const GX_R007_STATUS = 'FROZEN_MOTION_LANGUAGE';

export const GX_R007_MOTION_PHILOSOPHY = 'INPUT → RESPOND → ACKNOWLEDGE → SETTLE';
export const GX_R007_FROZEN_PRINCIPLE = 'Motion should communicate state, not decorate the interface.';
export const GX_R007_NEBULA_PAUSE_MS = 520;

export const GX_R007_CERTIFICATION_GATE_STATEMENT =
  'Every idle-state interaction has a defined motion or no-motion rule across Level 1 (120–180ms), Level 2 (220–360ms), and Level 3 (~520ms Nebula Pause), strictly prohibiting perpetual animation, bouncy physics, and layout shift.';

/**
 * 1. Three-Tier Motion Hierarchy
 */
export interface MotionTierSpec {
  level: 'LEVEL_1_MICRO' | 'LEVEL_2_INTERFACE' | 'LEVEL_3_NEBULA_TRANSITION';
  name: string;
  minDurationMs: number;
  maxDurationMs: number;
  useCases: readonly string[];
  easingRule: string;
}

export const MOTION_HIERARCHY_TIERS: readonly MotionTierSpec[] = [
  {
    level: 'LEVEL_1_MICRO',
    name: 'Micro',
    minDurationMs: 120,
    maxDurationMs: 180,
    useCases: [
      'hover states',
      'focus ring appearance',
      'button press / active state',
      'input surface tone shift',
      'sample-domain selection highlight',
    ],
    easingRule: 'cubic-bezier(0.2, 0, 0, 1) or ease-out',
  },
  {
    level: 'LEVEL_2_INTERFACE',
    name: 'Interface',
    minDurationMs: 220,
    maxDurationMs: 360,
    useCases: [
      'validation message appearance',
      'action-state transitions (ready / idle / submitting)',
      'contextual messaging visibility',
      'shell state changes',
    ],
    easingRule: 'cubic-bezier(0.4, 0, 0.2, 1) or ease-in-out',
  },
  {
    level: 'LEVEL_3_NEBULA_TRANSITION',
    name: 'Nebula Transition (Nebula Pause)',
    minDurationMs: 500,
    maxDurationMs: 540,
    useCases: [
      'Transition from intent submission into understanding initiation',
      'Intent acknowledged state crystallization',
    ],
    easingRule: 'cubic-bezier(0.16, 1, 0.3, 1) with ~520ms hold',
  },
] as const;

/**
 * 2. Interaction Surface Motion Specs
 */
export interface SurfaceInteractionRule {
  surface: string;
  trigger: string;
  allowedMotion: string;
  prohibitedMotion: readonly string[];
  spatialGuarantee: string;
}

export const SURFACE_INTERACTION_RULES: readonly SurfaceInteractionRule[] = [
  {
    surface: 'Domain Input Focus',
    trigger: 'focus / blur',
    allowedMotion: 'Hairline border tone shift and restrained surface depth (120–160ms)',
    prohibitedMotion: [
      'Glowing outline or neon pulse',
      'Expanding shadow or halo',
      'Animated border drawing',
      'Pulsing focus ring',
    ],
    spatialGuarantee: 'Zero layout shift; input height and margin remain constant',
  },
  {
    surface: 'Typing Behavior',
    trigger: 'keystroke input',
    allowedMotion: 'Immediate native text cursor progression with zero layout reaction',
    prohibitedMotion: [
      'Animated validation on every character',
      'Bouncing checkmark indicator',
      'Typing progress bar',
      'Changing placeholder animation',
    ],
    spatialGuarantee: 'Input container geometry remains perfectly locked',
  },
  {
    surface: 'Valid State Transition',
    trigger: 'valid candidate entered',
    allowedMotion: 'Primary CTA button transitions from disabled tone to ready tone (140–180ms)',
    prohibitedMotion: [
      'Green checkmark animation',
      '"Domain verified!" celebratory banner',
      'Success toast notification',
      'Confetti or burst effects',
      'Glowing CTA pulse',
    ],
    spatialGuarantee: 'Action button dimensions and position remain identical',
  },
  {
    surface: 'Primary CTA (Understand →)',
    trigger: 'hover / pointerdown / release / submit',
    allowedMotion: 'Subtle opacity shift (0.95), subtle compression on press (scale 0.99 / 1px), smooth release (120ms)',
    prohibitedMotion: [
      'Magnetic pull / cursor tracking',
      'Exaggerated bounce or spring overshoot',
      'Glow burst',
      'Spinning icon wheel as primary transition',
    ],
    spatialGuarantee: 'Button maintains fixed minimum measure without shifting neighboring elements',
  },
  {
    surface: 'Sample Domain Shortcuts',
    trigger: 'hover / click / tap',
    allowedMotion: 'Subtle text color and underline opacity transition (120ms); populates input and transfers focus',
    prohibitedMotion: [
      'Pill expansion or ballooning',
      'Tooltip explosion',
      'Auto-submitting domain to understanding',
      'Wobble on hover',
    ],
    spatialGuarantee: 'Sample chip row line-height and wrap remain completely static',
  },
  {
    surface: 'Inline Validation Error',
    trigger: 'invalid submit or resolution failure',
    allowedMotion: 'Calm fade and 4px vertical ease-in (220ms); polite screen-reader announcement',
    prohibitedMotion: [
      'Canvas shaking or vibrating',
      'Flashing red screen / strobe',
      'Aggressive bounce / repeat loops',
      'Modal error takeover',
    ],
    spatialGuarantee: 'Reserved vertical clearance prevents jumping surrounding elements',
  },
] as const;

/**
 * 3. Spatial Stability & Cursor Matrix
 */
export interface CursorMapping {
  element: string;
  expectedCursor: 'pointer' | 'text' | 'default' | 'not-allowed';
}

export const CURSOR_LANGUAGE_MATRIX: readonly CursorMapping[] = [
  { element: 'Primary CTA (Enabled)', expectedCursor: 'pointer' },
  { element: 'Primary CTA (Disabled/Busy)', expectedCursor: 'not-allowed' },
  { element: 'Domain Input Field', expectedCursor: 'text' },
  { element: 'Sample Domain Chip', expectedCursor: 'pointer' },
  { element: 'Header Nav Links (Docs, Workspace)', expectedCursor: 'pointer' },
  { element: 'Static Intelligence Text', expectedCursor: 'default' },
] as const;

/**
 * 4. Reduced Motion & Accessibility Invariants
 */
export const REDUCED_MOTION_INVARIANTS = [
  'prefers-reduced-motion eliminates decorative and entrance motion',
  'State transitions occur near-instantly (≤ 50ms) without perceptual delay',
  'Physical compression and scaling effects are disabled under reduced motion',
  'The ~520ms Nebula Pause becomes a clean non-animated state transition',
  'WCAG 2.1 AA contrast and focus indicators remain strictly visible without motion',
] as const;

/**
 * 5. Touch & Mobile Ergonomics Invariants
 */
export const TOUCH_ERGONOMICS_INVARIANTS = [
  'Zero hover-dependent intelligence or UI affordances',
  'All interactive surfaces meet ≥ 44px minimum touch target requirements',
  'Tap feedback uses immediate visual opacity response without delayed desktop hover physics',
  'Sample domain shortcuts provide comfortable finger spacing without overlapping touch targets',
] as const;

/**
 * 6. 14 Explicitly Rejected Motion Anti-Patterns
 */
export const EXPLICITLY_REJECTED_MOTION_PATTERNS = [
  'Particle animations or floating starfield dust',
  'Perpetual constellation / node drift animations',
  'Floating or levitating cards',
  'Infinite background animation loops',
  'Pulsing or breathing input borders',
  'Neon glow rings or laser outlines',
  'AI sparkle / shimmer effects',
  'Cursor trailing particles or custom fluid cursors',
  'Parallax scrolling hero effects',
  'Magnetic buttons attached to cursor coordinates',
  'Excessive spring physics with overshoot/bounce',
  'Confetti or celebratory particle bursts on valid input',
  'Shake-to-error vibration animations',
  'Spinning loader wheels as the primary understanding transition',
] as const;

/**
 * Motion Rule Verification Result
 */
export interface MotionVerificationResult {
  valid: boolean;
  violation?: string;
}

/**
 * Validates motion configuration against GX-R007 contracts
 */
export function validateMotionRules(config: {
  maxMicroDurationMs: number;
  maxInterfaceDurationMs: number;
  nebulaPauseMs: number;
  hasPerpetualMotion: boolean;
  hasSpringOvershoot: boolean;
  supportsReducedMotion: boolean;
  preservesSpatialStability: boolean;
  avoidsCelebratoryValidation: boolean;
}): MotionVerificationResult {
  if (config.hasPerpetualMotion) {
    return {
      valid: false,
      violation: 'Perpetual background or interface animations violate GX-R007 motion budget.',
    };
  }

  if (config.hasSpringOvershoot) {
    return {
      valid: false,
      violation: 'Spring overshoot and elastic bounce are explicitly prohibited.',
    };
  }

  if (config.maxMicroDurationMs > 180) {
    return {
      valid: false,
      violation: `Micro motion duration (${config.maxMicroDurationMs}ms) exceeds the 180ms Level 1 ceiling.`,
    };
  }

  if (config.maxInterfaceDurationMs > 360) {
    return {
      valid: false,
      violation: `Interface motion duration (${config.maxInterfaceDurationMs}ms) exceeds the 360ms Level 2 ceiling.`,
    };
  }

  if (config.nebulaPauseMs < 500 || config.nebulaPauseMs > 540) {
    return {
      valid: false,
      violation: `Nebula Pause duration (${config.nebulaPauseMs}ms) must be calibrated to ~520ms.`,
    };
  }

  if (!config.supportsReducedMotion) {
    return {
      valid: false,
      violation: 'prefers-reduced-motion must be fully supported across all transitions.',
    };
  }

  if (!config.preservesSpatialStability) {
    return {
      valid: false,
      violation: 'Micro-interactions must guarantee zero layout shift.',
    };
  }

  if (!config.avoidsCelebratoryValidation) {
    return {
      valid: false,
      violation: 'Validation must remain calm without celebratory confetti, toasts, or green checks.',
    };
  }

  return { valid: true };
}

/**
 * Certification Gate Verifier for GX-R007
 */
export function verifyGXR007CertificationGate(statement: string): {
  passed: boolean;
  canonicalStatement: string;
  similarityRatio: number;
} {
  const normalizedCandidate = statement.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const normalizedCanonical = GX_R007_CERTIFICATION_GATE_STATEMENT.toLowerCase().replace(/[^a-z0-9]/g, ' ');

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
    canonicalStatement: GX_R007_CERTIFICATION_GATE_STATEMENT,
    similarityRatio: similarity,
  };
}
