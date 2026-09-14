/**
 * GX-R006 — Domain Input & Intent Contract
 *
 * Phase: Guest Experience Redesign (GX-R)
 * Ticket: GX-R006
 * Type: UX / Interaction / Accessibility / Security Contract
 * Priority: P0 — Foundation
 * Status: 🔒 Ready for Implementation / Frozen Domain Input & Intent
 * Depends on: GX-R001 🔒 → GX-R002 🔒 → GX-R003 🔒 → GX-R004 🔒 → GX-R005 🔒
 * Unblocks: GX-R007 — Idle Micro-interactions
 *
 * Defines the complete domain-intent interaction inside the bounded Guest Workspace:
 * input anatomy, domain normalization, validation boundary, 6 canonical states,
 * keyboard contract, sample domain non-auto-submission, security guarantees,
 * and transition semantics into UNDERSTANDING.
 */

// ─── 1. Canonical Ticket & Principle Constants ───────────────────────────────

export const GX_R006_TICKET_ID = 'GX-R006' as const;
export const GX_R006_PHASE = 'Guest Experience Redesign' as const;
export const GX_R006_STATUS = 'FROZEN_DOMAIN_INTENT' as const;

export const GX_R006_INTERACTION_FLOW =
  'DOMAIN → VALIDATE → UNDERSTAND → → UNDERSTANDING' as const;

export const GX_R006_PRIMARY_ACTION_LABEL = 'Understand →' as const;
export const GX_R006_CANONICAL_PLACEHOLDER = 'example.com' as const;

export const GX_R006_CALM_ERROR_INVALID = 'Enter a valid domain.' as const;
export const GX_R006_CALM_ERROR_UNRESOLVED =
  "We couldn't understand that domain. Try another." as const;

export const GX_R006_CERTIFICATION_GATE_STATEMENT =
  'A guest can enter, paste, or select any standard domain notation, receive calm and accessible feedback, submit via Enter or click without duplicate submission, and cleanly transition into the Understanding state without account friction or scan vocabulary.' as const;

// ─── 2. Canonical Domain Normalization Engine ────────────────────────────────

export const DOMAIN_VALIDATION_REGEX =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

/**
 * Normalizes user domain input by stripping protocols, paths, query strings,
 * fragments, and trailing slashes/dots while lowercasing.
 */
export function normalizeDomainInput(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim().toLowerCase();

  // Strip http:// or https:// or leading slashes
  cleaned = cleaned.replace(/^https?:\/\//i, '').replace(/^\/\//, '');

  // Strip path, query string, or fragment
  const pathIdx = cleaned.indexOf('/');
  if (pathIdx !== -1) cleaned = cleaned.slice(0, pathIdx);

  const queryIdx = cleaned.indexOf('?');
  if (queryIdx !== -1) cleaned = cleaned.slice(0, queryIdx);

  const hashIdx = cleaned.indexOf('#');
  if (hashIdx !== -1) cleaned = cleaned.slice(0, hashIdx);

  // Strip port if present (e.g. example.com:8080 -> example.com)
  const portIdx = cleaned.indexOf(':');
  if (portIdx !== -1) cleaned = cleaned.slice(0, portIdx);

  // Strip trailing dot or slash
  cleaned = cleaned.replace(/[./]+$/, '');

  return cleaned;
}

/**
 * Validates whether a normalized string matches valid public FQDN syntax.
 */
export function isValidDomainInput(normalized: string): boolean {
  if (!normalized || normalized.length > 253) return false;
  return DOMAIN_VALIDATION_REGEX.test(normalized);
}

// ─── 3. Six Canonical Input Interaction States ───────────────────────────────

export type DomainInputState =
  | '01_IDLE'
  | '02_FOCUSED'
  | '03_ENTERING'
  | '04_VALID'
  | '05_INVALID'
  | '06_SUBMITTING';

export interface DomainInputStateSpec {
  readonly state: DomainInputState;
  readonly name: string;
  readonly visualBehavior: string;
  readonly actionAffordance: string;
  readonly prohibitedDecorations: readonly string[];
}

export const DOMAIN_INPUT_STATES: readonly DomainInputStateSpec[] = [
  {
    state: '01_IDLE',
    name: '01 — IDLE',
    visualBehavior: 'Quiet and inviting input container with example.com placeholder.',
    actionAffordance: 'Primary action "Understand →" is present but disabled/muted.',
    prohibitedDecorations: ['Decorative icons', 'Badges', 'Scan banners'],
  },
  {
    state: '02_FOCUSED',
    name: '02 — FOCUSED',
    visualBehavior: 'High-contrast accessible focus ring without oversized outer glows.',
    actionAffordance: 'Muted until valid candidate is typed.',
    prohibitedDecorations: ['Neon glow', 'Animated pulse rings', 'Excessive drop-shadows'],
  },
  {
    state: '03_ENTERING',
    name: '03 — ENTERING',
    visualBehavior: 'Natural typing without aggressive per-keystroke error banners.',
    actionAffordance: 'Dynamic activation once syntax becomes a valid domain candidate.',
    prohibitedDecorations: ['Per-character red error flashing', 'Typing spinners'],
  },
  {
    state: '04_VALID',
    name: '04 — VALID',
    visualBehavior: 'Clean input surface ready for execution.',
    actionAffordance: 'Primary action "Understand →" is fully active and elevated.',
    prohibitedDecorations: ['Checkmark badges', 'Green success rings', 'Artificial scores'],
  },
  {
    state: '05_INVALID',
    name: '05 — INVALID',
    visualBehavior: 'Restrained inline error ("Enter a valid domain.") programmatically linked via aria-describedby.',
    actionAffordance: 'Primary action "Understand →" is blocked.',
    prohibitedDecorations: ['"ERROR 400" alarms', '"SECURITY CHECK FAILED"', 'Aggressive modals'],
  },
  {
    state: '06_SUBMITTING',
    name: '06 — SUBMITTING',
    visualBehavior: 'Input locked in read-only state with subtle progress indication; duplicate submissions prevented.',
    actionAffordance: 'Primary action shows "Understanding" and transitions into UNDERSTANDING phase.',
    prohibitedDecorations: ['Progress bars with fake percentages', 'Celebratory popups'],
  },
] as const;

// ─── 4. Keyboard Contract & Accessibility Ergonomics ─────────────────────────

export interface KeyboardErgonomicsSpec {
  readonly key: 'Enter' | 'Tab' | 'Escape';
  readonly behavior: string;
  readonly precondition: string;
}

export const KEYBOARD_ERGONOMICS_CONTRACT: readonly KeyboardErgonomicsSpec[] = [
  {
    key: 'Enter',
    behavior: 'Submits the normalized domain and initiates understanding immediately.',
    precondition: 'Domain input must be in a VALID state and no request currently active.',
  },
  {
    key: 'Tab',
    behavior: 'Moves focus predictably to the "Understand →" primary action trigger.',
    precondition: 'Standard sequential focus navigation.',
  },
  {
    key: 'Escape',
    behavior: 'Does NOT unexpectedly clear the entered domain value (reserved for modal/drawer dismissal).',
    precondition: 'Universal accessibility guideline.',
  },
] as const;

// ─── 5. Security & Isolation Invariants ──────────────────────────────────────

export const GUEST_SECURITY_INVARIANTS = [
  'Guest domain input cannot create a user account.',
  'Guest domain input cannot create a persistent Workspace.',
  'Guest domain input cannot access historical snapshot lineage.',
  'Guest domain input cannot access Admin endpoints or influence authorization.',
  'Guest session remains ephemeral and isolated from other guest sessions.',
  'Client-side validation is non-authoritative; backend domain understanding enforces security boundaries.',
] as const;

// ─── 6. Explicitly Rejected Domain Intent Patterns (12 Items) ────────────────

export const EXPLICITLY_REJECTED_DOMAIN_PATTERNS = [
  '"Scan" or "Scanner" terminology in labels, buttons, or errors',
  'Search-engine style mega search box with browsing filters',
  'Multi-step domain setup wizards before initial understanding',
  'Email capture or registration form before understanding starts',
  'Mandatory account creation or credit card requirement',
  'CAPTCHA or anti-bot challenge interrupting first intent',
  'Artificial domain security scoring (e.g., "Domain Score: 45/100")',
  'Client-only security validation assuming browser trust',
  'Auto-submission of sample domains upon selection',
  'Aggressive inline error validation on initial typing',
  'Competing primary action buttons (e.g., "Scan" vs "Deep Audit")',
  'Marketing conversion prompts or registration popups on submit',
] as const;

// ─── 7. Invariant Validators & Certification Engine ──────────────────────────

export interface DomainInputIntentValidationInput {
  readonly usesCanonicalPlaceholder: boolean;
  readonly normalizesProtocolsAndPaths: boolean;
  readonly sampleSelectionRequiresExplicitSubmit: boolean;
  readonly preventsDuplicateSubmissions: boolean;
  readonly avoidsScanTerminology: boolean;
  readonly preservesGuestSecurityBoundary: boolean;
}

/**
 * Validates that a domain input implementation adheres to GX-R006 contracts.
 */
export function validateDomainInputIntent(
  input: DomainInputIntentValidationInput
): { valid: boolean; violation?: string } {
  if (!input.usesCanonicalPlaceholder) {
    return {
      valid: false,
      violation: 'Placeholder violation: Must use canonical "example.com" placeholder without instructional clutter.',
    };
  }

  if (!input.normalizesProtocolsAndPaths) {
    return {
      valid: false,
      violation: 'Normalization violation: Must automatically strip protocols, paths, query strings, and whitespace.',
    };
  }

  if (!input.sampleSelectionRequiresExplicitSubmit) {
    return {
      valid: false,
      violation: 'Interaction violation: Selecting a sample domain must NOT auto-submit; explicit submit required to preserve intentionality.',
    };
  }

  if (!input.preventsDuplicateSubmissions) {
    return {
      valid: false,
      violation: 'Race-condition violation: Duplicate submissions must be strictly blocked while understanding is active.',
    };
  }

  if (!input.avoidsScanTerminology) {
    return {
      valid: false,
      violation: 'Vocabulary violation: The word "scan" is strictly prohibited across all GX labels, buttons, and error messages.',
    };
  }

  if (!input.preservesGuestSecurityBoundary) {
    return {
      valid: false,
      violation: 'Security violation: Guest domain input must remain isolated from account and workspace creation.',
    };
  }

  return { valid: true };
}

/**
 * 🔒 GX-R006 Certification Gate Verification
 */
export function verifyGXR006CertificationGate(proposedStatement: string): {
  passed: boolean;
  canonicalStatement: string;
  interactionFlow: string;
  similarityRatio: number;
} {
  const normalize = (text: string) =>
    text.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()—]/g, '');

  const normalizedProposed = normalize(proposedStatement);
  const normalizedCanonical = normalize(GX_R006_CERTIFICATION_GATE_STATEMENT);

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
    canonicalStatement: GX_R006_CERTIFICATION_GATE_STATEMENT,
    interactionFlow: GX_R006_INTERACTION_FLOW,
    similarityRatio: matches / canonicalWords.size,
  };
}
