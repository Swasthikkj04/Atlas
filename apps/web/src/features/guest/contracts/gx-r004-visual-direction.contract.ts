/**
 * GX-R004 — First Impression Visual Direction Contract
 *
 * Phase: Guest Experience Redesign (GX-R)
 * Ticket: GX-R004
 * Type: UX Architecture / Visual Design System
 * Priority: P0 — Foundation
 * Status: 🔒 Ready to Implement / Frozen Visual Direction
 * Depends on: GX-R001 🔒 → GX-R002 🔒 → GX-R003 🔒
 * Unblocks: GX-R005 — Idle Canvas Composition
 *
 * Establishes the visual DNA, 5 personality traits, 3-layer typography,
 * neutral & semantic color rules, 3-level surface language (Canvas/Surface/Detail),
 * restrained borders/elevation, motion philosophy (520ms Nebula Pause),
 * microcopy guidelines, and rejected visual anti-patterns.
 */

// ─── 1. Canonical Ticket & Principle Constants ───────────────────────────────

export const GX_R004_TICKET_ID = 'GX-R004' as const;
export const GX_R004_PHASE = 'Guest Experience Redesign' as const;
export const GX_R004_STATUS = 'FROZEN_VISUAL_DIRECTION' as const;

export const GX_R004_FROZEN_VISUAL_PRINCIPLE =
  'Nebula should look like an intelligence product, not a marketing website.' as const;

export const GX_R004_MOTION_CANONICAL_PRINCIPLE =
  'Motion should be noticed only when it improves understanding.' as const;

export const GX_R004_ATMOSPHERE_PRINCIPLE =
  'Atmosphere establishes identity. Intelligence establishes value.' as const;

export const GX_R004_CERTIFICATION_GATE_STATEMENT =
  'Nebula feels immediately credible, intelligent, calm, and premium through typographic authority, spatial air, and material restraint before the guest has even entered a domain.' as const;

// ─── 2. Visual Personality (5 Core Characteristics) ──────────────────────────

export interface VisualPersonalityTrait {
  readonly trait: 'Calm' | 'Confident' | 'Intelligent' | 'Technical' | 'Premium';
  readonly expression: string;
  readonly practicalRequirement: string;
}

export const VISUAL_PERSONALITY_TRAITS: readonly VisualPersonalityTrait[] = [
  {
    trait: 'Calm',
    expression: 'Generous whitespace, restrained motion, and low visual noise.',
    practicalRequirement: 'Minimum 65-75 CPL readability measure; negative space around key intelligence.',
  },
  {
    trait: 'Confident',
    expression: 'Strong typographic hierarchy, direct assertions, no defensive or unnecessary explanations.',
    practicalRequirement: 'Direct statement-driven headings; no apologies or marketing hyperbole.',
  },
  {
    trait: 'Intelligent',
    expression: 'Editorial information design synthesizing meaning rather than dumping raw metrics.',
    practicalRequirement: 'Synthesis before raw data; narrative brief preceding granular observations.',
  },
  {
    trait: 'Technical',
    expression: 'Precise metadata, protocol-accurate vocabulary, and exact timestamps.',
    practicalRequirement: 'JetBrains Mono for domains, headers, hashes, and protocol statuses.',
  },
  {
    trait: 'Premium',
    expression: 'Material restraint, hairline borders, exact optical alignment, and deliberate proportion.',
    practicalRequirement: 'Hairline borders (#EEEEEB / #E1E1DC), zero glassmorphism, no rainbow gradients.',
  },
] as const;

// ─── 3. Typography Architecture (3 Semantic Layers) ─────────────────────────

export type TypographyLayerId = 'NARRATIVE' | 'INTERFACE' | 'TECHNICAL';

export interface TypographyLayerSpec {
  readonly layerId: TypographyLayerId;
  readonly fontRole: string;
  readonly familyToken: string;
  readonly applicationSurfaces: readonly string[];
  readonly emotionalTone: string;
}

export const TYPOGRAPHY_LAYERS: readonly TypographyLayerSpec[] = [
  {
    layerId: 'NARRATIVE',
    fontRole: 'Editorial Serif',
    familyToken: 'var(--font-serif, Newsreader, Georgia, serif)',
    applicationSurfaces: [
      'Primary posture assertions',
      'Executive editorial narrative',
      'High-level system interpretations',
      'Major section introductions',
    ],
    emotionalTone: 'Literary, authoritative, calm, and deliberate.',
  },
  {
    layerId: 'INTERFACE',
    fontRole: 'Interface Sans',
    familyToken: 'var(--font-sans, "DM Sans", "Inter", sans-serif)',
    applicationSurfaces: [
      'Navigation anchors',
      'Form controls and input labels',
      'Action buttons',
      'Supporting metadata labels',
      'Status badges and interactive elements',
    ],
    emotionalTone: 'Crisp, functional, highly legible, and transparent.',
  },
  {
    layerId: 'TECHNICAL',
    fontRole: 'Technical Monospace',
    familyToken: 'var(--font-mono, "JetBrains Mono", monospace)',
    applicationSurfaces: [
      'Domain FQDNs',
      'IP addresses and CIDR blocks',
      'Protocol headers and TLS cipher suites',
      'DNS record values',
      'Cryptographic hashes and SHA fingerprints',
      'Engine telemetry and timestamps',
    ],
    emotionalTone: 'Precise, factual, immutable, and verifiable.',
  },
] as const;

// ─── 4. Three-Level Surface Language (Canvas → Surface → Detail) ──────────────

export type SurfaceLevelId = 'LEVEL_1_CANVAS' | 'LEVEL_2_SURFACE' | 'LEVEL_3_DETAIL';

export interface SurfaceLevelSpec {
  readonly levelId: SurfaceLevelId;
  readonly levelName: string;
  readonly roleDescription: string;
  readonly containerCharacteristics: string;
  readonly appliedComponents: readonly string[];
}

export const SURFACE_LEVELS: readonly SurfaceLevelSpec[] = [
  {
    levelId: 'LEVEL_1_CANVAS',
    levelName: 'Level 1 — Canvas',
    roleDescription: 'Large spatial regions anchoring major cognitive zones.',
    containerCharacteristics: 'Frameless or subtle tonal boundary; generous negative space; unconfined reading zone.',
    appliedComponents: ['Current Understanding', 'What Matters Now', 'Infrastructure Overview'],
  },
  {
    levelId: 'LEVEL_2_SURFACE',
    levelName: 'Level 2 — Surface',
    roleDescription: 'Contained structural zones grouping specific observations.',
    containerCharacteristics: 'Hairline border (#EEEEEB / #E1E1DC), flat background, restrained padding, zero drop-shadow.',
    appliedComponents: ['Findings List', 'Infrastructure Category Grid', 'Supporting Observations'],
  },
  {
    levelId: 'LEVEL_3_DETAIL',
    levelName: 'Level 3 — Detail',
    roleDescription: 'Focused contextual investigation and wire evidence surfaces.',
    containerCharacteristics: 'Slide-over drawer or sheet with controlled elevation (shadow-sm/md) and backdrop lock.',
    appliedComponents: ['Evidence Drawer', 'Wire Protocol Traces', 'Technical Inspection Panel'],
  },
] as const;

// ─── 5. Semantic Color Treatment & Restrained Severity ────────────────────────

export type SemanticSeverityLevel =
  | 'NORMAL'
  | 'INFORMATION'
  | 'ATTENTION'
  | 'CRITICAL'
  | 'SUCCESS';

export interface SemanticSeveritySpec {
  readonly level: SemanticSeverityLevel;
  readonly meaning: string;
  readonly colorRole: string;
  readonly backgroundOpacity: string;
  readonly textualRequirement: string;
}

export const SEMANTIC_SEVERITY_MAPPING: readonly SemanticSeveritySpec[] = [
  {
    level: 'NORMAL',
    meaning: 'Baseline perimeter state; expected standard infrastructure behavior.',
    colorRole: 'Muted neutral / quiet (#64748B light / #94A3B8 dark)',
    backgroundOpacity: 'Transparent or faint neutral tint (4-6%)',
    textualRequirement: 'Explicitly labeled "Normal" or "Baseline" — never color alone.',
  },
  {
    level: 'INFORMATION',
    meaning: 'Observation of interest; operational context with zero active risk.',
    colorRole: 'Restrained blue/slate (#2563EB / #3B82F6)',
    backgroundOpacity: '8% light / 12% dark tint fill',
    textualRequirement: 'Explicitly labeled "Informational" with factual observation description.',
  },
  {
    level: 'ATTENTION',
    meaning: 'Observation requiring active review or remediation planning.',
    colorRole: 'Controlled amber (#D97706 / #F59E0B)',
    backgroundOpacity: '8% light / 12% dark tint fill',
    textualRequirement: 'Explicitly labeled "Attention Required" with impact explanation.',
  },
  {
    level: 'CRITICAL',
    meaning: 'Immediate perimeter risk, severe vulnerability, or service exposure.',
    colorRole: 'Controlled destructive rose/red (#DC2626 / #EF4444)',
    backgroundOpacity: '8% light / 12% dark tint fill',
    textualRequirement: 'Explicitly labeled "Critical" with direct evidence chain.',
  },
  {
    level: 'SUCCESS',
    meaning: 'Affirmative security verification or completed posture hardening.',
    colorRole: 'Restrained emerald/green (#059669 / #10B981)',
    backgroundOpacity: '8% light / 12% dark tint fill',
    textualRequirement: 'Explicitly labeled "Verified" or "Active".',
  },
] as const;

// ─── 6. Microcopy Guidelines & Action Vocabulary ─────────────────────────────

export interface MicrocopyPair {
  readonly intent: string;
  readonly preferredCopy: string;
  readonly antiPatternCopy: string;
  readonly toneRationale: string;
}

export const CANONICAL_MICROCOPY_PAIRS: readonly MicrocopyPair[] = [
  {
    intent: 'Primary Action Trigger',
    preferredCopy: 'Understand →',
    antiPatternCopy: 'Scan Domain Now / Check Security Free',
    toneRationale: 'Positions Nebula as an intelligence instrument rather than a transactional scanner.',
  },
  {
    intent: 'Investigation Trigger',
    preferredCopy: 'Understand why →',
    antiPatternCopy: 'Click here to view more information about this finding.',
    toneRationale: 'Short, precise, human, and intellectual; invites inquiry without marketing clutter.',
  },
  {
    intent: 'Continuity Trigger',
    preferredCopy: 'Keep this understanding →',
    antiPatternCopy: 'Sign up now to save your scan results!',
    toneRationale: 'Frames Workspace as memory and persistence rather than an aggressive registration gate.',
  },
  {
    intent: 'Stable Posture Notice',
    preferredCopy: 'Infrastructure appears stable.',
    antiPatternCopy: 'Your infrastructure scan has completed successfully with 0 errors!',
    toneRationale: 'Calm, measured, and affirmative without celebratory software theatrics.',
  },
  {
    intent: 'Attention Finding Alert',
    preferredCopy: 'One thing deserves attention.',
    antiPatternCopy: '🚨 WARNING! WE FOUND A CRITICAL SECURITY VULNERABILITY!',
    toneRationale: 'Never sounds hysterical or excited about a user’s infrastructure exposure.',
  },
] as const;

// ─── 7. Explicitly Rejected Visual Directions (12 Prohibited Directions) ─────

export const EXPLICITLY_REJECTED_VISUAL_DIRECTIONS = [
  'Generic SaaS marketing gradients and multi-color hero blobs',
  'AI sparkle aesthetics (stars, magic wands, purple particle clouds)',
  'Neon cyberpunk palettes and high-contrast glowing borders',
  'Excessive glassmorphism and heavily blurred translucent cards',
  'Dashboard KPI walls with equal-weight numeric counters',
  'Giant hero typography dominating the viewport',
  'Card-everything layouts with nested rounded cards',
  'Decorative 3D illustrations or cartoon mascots without meaning',
  'Continuous loop background animations and particle swarms',
  'Marketing-style 3-tier feature grids and pricing tables',
  'Fake urgency badges ("Limited time scan", countdown timers)',
  'Aggressive conversion CTAs and recurring signup popups',
] as const;

// ─── 8. Invariant Validators & Certification Engine ──────────────────────────

export interface VisualDirectionValidationInput {
  readonly usesThreeLayerTypography: boolean;
  readonly usesThreeLevelSurfaces: boolean;
  readonly avoidsCardEverythingSprawl: boolean;
  readonly preservesColorAccessibility: boolean;
  readonly reusesNebulaDesignTokens: boolean;
}

/**
 * Validates that visual styling adheres to GX-R004 design contracts.
 */
export function validateVisualDirectionCompliance(
  input: VisualDirectionValidationInput
): { valid: boolean; violation?: string } {
  if (!input.usesThreeLayerTypography) {
    return {
      valid: false,
      violation: 'Visual direction violation: Must use 3-layer typography (Narrative Serif, Interface Sans, Technical Mono).',
    };
  }

  if (!input.usesThreeLevelSurfaces) {
    return {
      valid: false,
      violation: 'Visual direction violation: Must use 3-level surface hierarchy (Canvas → Surface → Detail).',
    };
  }

  if (!input.avoidsCardEverythingSprawl) {
    return {
      valid: false,
      violation: 'Visual direction violation: Card-everything layouts are prohibited; use spatial negative space and hairline surfaces.',
    };
  }

  if (!input.preservesColorAccessibility) {
    return {
      valid: false,
      violation: 'Visual direction violation: Severity and posture must never be communicated through color alone; textual labels required.',
    };
  }

  if (!input.reusesNebulaDesignTokens) {
    return {
      valid: false,
      violation: 'Visual direction violation: Must reuse canonical Nebula design tokens rather than creating a parallel design system.',
    };
  }

  return { valid: true };
}

/**
 * 🔒 GX-R004 Certification Gate Verification
 */
export function verifyGXR004CertificationGate(proposedStatement: string): {
  passed: boolean;
  canonicalStatement: string;
  frozenPrinciple: string;
  similarityRatio: number;
} {
  const normalize = (text: string) =>
    text.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()—]/g, '');

  const normalizedProposed = normalize(proposedStatement);
  const normalizedCanonical = normalize(GX_R004_CERTIFICATION_GATE_STATEMENT);

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
    canonicalStatement: GX_R004_CERTIFICATION_GATE_STATEMENT,
    frozenPrinciple: GX_R004_FROZEN_VISUAL_PRINCIPLE,
    similarityRatio: matches / canonicalWords.size,
  };
}
