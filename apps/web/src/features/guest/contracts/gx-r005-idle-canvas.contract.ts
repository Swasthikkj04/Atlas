/**
 * GX-R005 — Idle Canvas Composition Contract
 *
 * Phase: Guest Experience Redesign (GX-R)
 * Ticket: GX-R005
 * Type: Architecture / UX / Visual Composition
 * Priority: P0 — Foundation
 * Status: 🔒 Ready for Implementation / Frozen Idle Canvas Composition
 * Depends on: GX-R001 🔒 → GX-R002 🔒 → GX-R003 🔒 → GX-R004 🔒
 * Unblocks: GX-R006 — Domain Input & Intent
 *
 * Codifies the 5-zone spatial hierarchy, zero-scroll viewport guarantee,
 * visual weight distribution, sample domain shortcuts, quiet product signature,
 * responsive composition tiers, and rejected marketing anti-patterns for the
 * idle Guest Workspace canvas.
 */

// ─── 1. Canonical Ticket & Principle Constants ───────────────────────────────

export const GX_R005_TICKET_ID = 'GX-R005' as const;
export const GX_R005_PHASE = 'Guest Experience Redesign' as const;
export const GX_R005_STATUS = 'FROZEN_IDLE_COMPOSITION' as const;

export const GX_R005_CORE_OBJECTIVE =
  'Nebula is ready to understand infrastructure.' as const;

export const GX_R005_FROZEN_STATEMENT =
  'Infrastructure intelligence begins with understanding.' as const;

export const GX_R005_SUPPORTING_STATEMENT =
  'Enter a domain. Nebula will build its current understanding.' as const;

export const GX_R005_TRUST_CONTEXT =
  'Current intelligence · No account required' as const;

export const GX_R005_PRODUCT_SIGNATURE =
  'Intelligence before data · Context before details · Summary before evidence' as const;

export const GX_R005_RESPONSIVE_INVARIANT =
  'The guest must always understand what Nebula is, what they should enter, and what happens next.' as const;

export const GX_R005_CERTIFICATION_GATE_STATEMENT =
  'The idle Guest Workspace canvas establishes a viewport-bounded spatial composition where identity, intelligence statement, domain intent input, trust context, and product signature fit completely within the initial view without requiring scrolling.' as const;

// ─── 2. Five Spatial Hierarchy Zones ─────────────────────────────────────────

export type IdleCanvasZoneId =
  | 'ZONE_A_IDENTITY'
  | 'ZONE_B_INTELLIGENCE_STATEMENT'
  | 'ZONE_C_DOMAIN_INTENT'
  | 'ZONE_D_QUIET_CONTEXT'
  | 'ZONE_E_PRODUCT_SIGNATURE';

export interface IdleCanvasZoneSpec {
  readonly zoneId: IdleCanvasZoneId;
  readonly zoneLetter: 'A' | 'B' | 'C' | 'D' | 'E';
  readonly name: string;
  readonly contentSpecification: string;
  readonly visualRole: string;
  readonly prohibitedElements: readonly string[];
}

export const IDLE_CANVAS_ZONES: readonly IdleCanvasZoneSpec[] = [
  {
    zoneId: 'ZONE_A_IDENTITY',
    zoneLetter: 'A',
    name: 'Zone A — Identity',
    contentSpecification: 'Nebula living logo wordmark with quiet Docs and Workspace entry links.',
    visualRole: 'Restrained header anchoring product presence without promotional marketing clutter.',
    prohibitedElements: [
      'Promotional banners',
      'Sign-up CTA buttons in header',
      'Pricing or feature dropdowns',
      'Mega-menu navigations',
    ],
  },
  {
    zoneId: 'ZONE_B_INTELLIGENCE_STATEMENT',
    zoneLetter: 'B',
    name: 'Zone B — Intelligence Statement',
    contentSpecification: 'Primary narrative assertion ("Infrastructure intelligence begins with understanding.") and supporting direction.',
    visualRole: 'Editorial Newsreader serif headline establishing purpose rather than selling features.',
    prohibitedElements: [
      '"AI-powered" buzzwords',
      '"Next-generation" claims',
      '"Enterprise-grade" selling points',
      '"Secure your infrastructure today" fear tactics',
    ],
  },
  {
    zoneId: 'ZONE_C_DOMAIN_INTENT',
    zoneLetter: 'C',
    name: 'Zone C — Domain Intent',
    contentSpecification: 'Focused domain input bar with integrated "Understand →" action trigger and optional sample targets.',
    visualRole: 'The primary interactive destination of the idle viewport.',
    prohibitedElements: [
      'Multi-field lead generation forms',
      'Required email address inputs',
      'Captcha challenges before intent',
      'Secondary competing buttons',
    ],
  },
  {
    zoneId: 'ZONE_D_QUIET_CONTEXT',
    zoneLetter: 'D',
    name: 'Zone D — Quiet Context',
    contentSpecification: '"Current intelligence · No account required"',
    visualRole: 'Subtle trust establishment communicating Guest philosophy without conversion pitch.',
    prohibitedElements: [
      'Fake security badges',
      'Credit card requirement notes',
      '"Free trial" marketing tags',
    ],
  },
  {
    zoneId: 'ZONE_E_PRODUCT_SIGNATURE',
    zoneLetter: 'E',
    name: 'Zone E — Product Signature',
    contentSpecification: '"Intelligence before data · Context before details · Summary before evidence"',
    visualRole: 'Subtle atmospheric baseline reinforcing the Nebula engineering philosophy.',
    prohibitedElements: [
      '4-column corporate footer links',
      'Social media follower counters',
      'Copyright legalese overload',
    ],
  },
] as const;

// ─── 3. Visual Weight Distribution Pipeline ──────────────────────────────────

export const VISUAL_WEIGHT_DISTRIBUTION = [
  'INTELLIGENCE',
  'DOMAIN_INTENT',
  'ACTION',
  'TRUST_CONTEXT',
  'PRODUCT_SIGNATURE',
] as const;

// ─── 4. Sample Domain Shortcuts Contract ─────────────────────────────────────

export interface SampleDomainShortcut {
  readonly domain: string;
  readonly category: 'Payment Infrastructure' | 'Developer Platform' | 'Edge Network';
  readonly purpose: string;
}

export const CANONICAL_SAMPLE_DOMAINS: readonly SampleDomainShortcut[] = [
  {
    domain: 'stripe.com',
    category: 'Payment Infrastructure',
    purpose: 'Curated public domain illustrating complex multi-tier CDN, TLS, and perimeter hygiene.',
  },
  {
    domain: 'github.com',
    category: 'Developer Platform',
    purpose: 'Curated public domain demonstrating anycast routing, Fastly edge, and modern web server stack.',
  },
  {
    domain: 'cloudflare.com',
    category: 'Edge Network',
    purpose: 'Curated public domain exhibiting pure edge proxying and authoritative DNS architecture.',
  },
] as const;

// ─── 5. Viewport Adaptation & Zero-Scroll Guarantee ──────────────────────────

export interface IdleViewportTierSpec {
  readonly tier: 'Desktop' | 'Laptop' | 'Tablet' | 'Mobile';
  readonly minHeight: number;
  readonly scrollRequired: boolean;
  readonly layoutComposition: string;
}

export const IDLE_VIEWPORT_TIERS: readonly IdleViewportTierSpec[] = [
  {
    tier: 'Desktop',
    minHeight: 800,
    scrollRequired: false,
    layoutComposition: 'Centered spatial canvas with generous vertical air, centered domain input unit, and quiet baseline.',
  },
  {
    tier: 'Laptop',
    minHeight: 640,
    scrollRequired: false,
    layoutComposition: 'Proportionally scaled vertical rhythm; complete 5-zone composition fits comfortably in single viewport.',
  },
  {
    tier: 'Tablet',
    minHeight: 600,
    scrollRequired: false,
    layoutComposition: 'Streamlined header; centered input unit; compact trust context in single uncrowded screen.',
  },
  {
    tier: 'Mobile',
    minHeight: 480,
    scrollRequired: false,
    layoutComposition: 'Vertically stacked bounded surface; zero horizontal overflow; primary input remains fully above the fold.',
  },
] as const;

// ─── 6. Explicitly Rejected Idle Canvas Patterns (12 Items) ──────────────────

export const EXPLICITLY_REJECTED_IDLE_PATTERNS = [
  'Infinite landing-page scroll',
  'Marketing feature grids with cards',
  'Pricing sections and tier comparison tables',
  'Customer testimonials and review quotes',
  'Giant hero 3D illustrations or mascot art',
  'Decorative AI imagery and particle swarms',
  'Multiple competing CTAs (e.g., "Start Free" vs "Book Demo")',
  'Signup-first or email-gate architecture',
  'Fake intelligence previews or mocked scan graphs',
  'Dashboard KPI walls with numeric metric counters',
  'Excessive card containers nesting the input',
  'Neon glowing borders or pulsating ring animations',
] as const;

// ─── 7. Invariant Validators & Certification Engine ──────────────────────────

export interface IdleCanvasValidationInput {
  readonly zonesPresent: readonly IdleCanvasZoneId[];
  readonly requiresScrollForPrimaryInteraction: boolean;
  readonly containsMarketingFeatureGrid: boolean;
  readonly containsForcedRegistrationGate: boolean;
  readonly sampleDomainsAreOptional: boolean;
}

/**
 * Validates that an idle canvas implementation meets GX-R005 spatial invariants.
 */
export function validateIdleCanvasComposition(
  input: IdleCanvasValidationInput
): { valid: boolean; violation?: string } {
  const allZones: readonly IdleCanvasZoneId[] = [
    'ZONE_A_IDENTITY',
    'ZONE_B_INTELLIGENCE_STATEMENT',
    'ZONE_C_DOMAIN_INTENT',
    'ZONE_D_QUIET_CONTEXT',
    'ZONE_E_PRODUCT_SIGNATURE',
  ];

  const missingZones = allZones.filter((z) => !input.zonesPresent.includes(z));
  if (missingZones.length > 0) {
    return {
      valid: false,
      violation: `Missing required spatial zone(s): ${missingZones.join(', ')}`,
    };
  }

  if (input.requiresScrollForPrimaryInteraction) {
    return {
      valid: false,
      violation: 'Viewport violation: Primary interaction must be completely visible without scrolling across all devices.',
    };
  }

  if (input.containsMarketingFeatureGrid) {
    return {
      valid: false,
      violation: 'Marketing violation: Feature grids, testimonials, or pricing tables are strictly prohibited on the idle canvas.',
    };
  }

  if (input.containsForcedRegistrationGate) {
    return {
      valid: false,
      violation: 'Conversion boundary violation: Forced registration, email capture, or paywalls are strictly prohibited.',
    };
  }

  if (!input.sampleDomainsAreOptional) {
    return {
      valid: false,
      violation: 'Interaction violation: Sample domains must remain subtle, optional shortcuts.',
    };
  }

  return { valid: true };
}

/**
 * 🔒 GX-R005 Certification Gate Verification
 */
export function verifyGXR005CertificationGate(proposedStatement: string): {
  passed: boolean;
  canonicalStatement: string;
  coreObjective: string;
  similarityRatio: number;
} {
  const normalize = (text: string) =>
    text.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()—]/g, '');

  const normalizedProposed = normalize(proposedStatement);
  const normalizedCanonical = normalize(GX_R005_CERTIFICATION_GATE_STATEMENT);

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
    canonicalStatement: GX_R005_CERTIFICATION_GATE_STATEMENT,
    coreObjective: GX_R005_CORE_OBJECTIVE,
    similarityRatio: matches / canonicalWords.size,
  };
}
