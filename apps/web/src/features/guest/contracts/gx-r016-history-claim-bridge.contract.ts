/**
 * GX-R016 — History & Claim Bridge Contract
 *
 * Phase: GX-R — Nebula First Experience Redesign
 * Ticket: GX-R016
 * Type: GX / Temporal Intelligence / Architectural Boundary / Memory Activation / Claim Bridge Contract
 * Priority: P0 — Blocking
 * Depends on: GX-R001 → GX-R015 🔒, SEC-GXWX-001 🔒, WX-1001 → WX-1027 🔒
 * Status: FROZEN_HISTORY_CLAIM_BRIDGE_CONTRACT
 *
 * Acceptance Gate Demonstrated Truth:
 * "A guest user experiences History as an architectural boundary separating ephemeral inspection
 * from continuous memory, perceiving registration as Nebula beginning to remember rather than
 * a forced conversion, with the current snapshot seamlessly transitioning as the initial
 * workspace baseline."
 *
 * Frozen Principles:
 * 1. "History is locked by architectural reality, not an artificial paywall."
 * 2. "Registration is Nebula beginning to remember."
 * 3. "Zero-friction session handover preserving current snapshot into workspace memory."
 * 4. "Strict temporal boundary and zero synthetic historical speculation."
 * 5. "Zero privilege escalation and strict tenant isolation across claim boundaries."
 */

export const GX_R016_TICKET_ID = 'GX-R016' as const;
export const GX_R016_PHASE = 'GX-R — Nebula First Experience Redesign' as const;
export const GX_R016_STATUS = 'FROZEN_HISTORY_CLAIM_BRIDGE_CONTRACT' as const;

export const GX_R016_PRIMARY_PRINCIPLE =
  'Keep History locked for guests and make registration feel like Nebula beginning to remember, rather than a forced conversion.' as const;

export const GX_R016_FROZEN_PRINCIPLES = [
  'History is locked by architectural reality, not an artificial paywall.',
  'Registration is Nebula beginning to remember.',
  'Zero-friction session handover preserving current snapshot into workspace memory.',
  'Strict temporal boundary and zero synthetic historical speculation.',
  'Zero privilege escalation and strict tenant isolation across claim boundaries.',
] as const;

export const GX_R016_ACCEPTANCE_GATE_STATEMENT =
  'A guest user experiences History as an architectural boundary separating ephemeral inspection from continuous memory, perceiving registration as Nebula beginning to remember rather than a forced conversion, with the current snapshot seamlessly transitioning as the initial workspace baseline.' as const;

export const GX_R016_CERTIFICATION_GATE_STATEMENT =
  'Nebula enforces History as an architectural boundary separating ephemeral point-in-time inspection from continuous temporal intelligence, framing registration as Nebula beginning to remember, preserving the initial snapshot as the workspace baseline, and strictly forbidding coercive paywall patterns.' as const;

export const NEBULA_MEMORY_CORE_THESIS = {
  mission: 'Transform one-shot understanding into continuous institutional infrastructure memory.',
  boundaryDefinition: 'Ephemeral guest inspection delivers full depth of current state; authenticated Workspace provides temporal memory across time.',
  differentiatingFactor: 'The difference is persistence and memory over time, not analytical intelligence.',
  claimMetaphor: 'Registration is Nebula beginning to remember your infrastructure, not a paywall unlock.',
} as const;

/**
 * 1. Memory Bridge Status & History Access Types
 */
export type MemoryBridgeStatus =
  | 'EPHEMERAL_OBSERVATION'
  | 'CLAIM_PENDING'
  | 'MEMORY_INITIALIZED'
  | 'CONTINUOUS_LINEAGE';

export type HistoryAccessVerdict =
  | 'PERMITTED'
  | 'LOCKED_EPHEMERAL_BOUNDARY'
  | 'EXPIRED_SESSION'
  | 'INVALID_TARGET';

/**
 * 2. Claim Bridge Payload Model
 */
export interface ClaimBridgePayload {
  readonly domain: string;
  readonly sessionId: string;
  readonly jobId: string;
  readonly baselineSnapshotTimestamp: string;
  readonly capturedSignalsCount: number;
  readonly ingressHopsCount: number;
  readonly actionableFindingsCount: number;
  readonly claimInitiatedAt: string;
}

/**
 * 3. Memory Activation Narrative Model
 */
export interface MemoryActivationNarrative {
  readonly domain: string;
  readonly headline: string;
  readonly subheadline: string;
  readonly memoryMetaphor: string;
  readonly genesisBaselineTitle: string;
  readonly genesisDescription: string;
  readonly driftTrackingDescription: string;
  readonly callToActionText: string;
  readonly reassuranceText: string;
}

/**
 * 4. Genesis Baseline Node Model
 */
export interface GenesisBaselineNode {
  readonly nodeId: string;
  readonly domain: string;
  readonly sessionId: string;
  readonly jobId: string;
  readonly epoch: 'GENESIS';
  readonly label: string;
  readonly timestamp: string;
  readonly totalSignals: number;
  readonly isAuthoritativeBaseline: boolean;
  readonly nextScheduledEpoch: string;
}

/**
 * 5. Educational Blueprint Capability
 */
export interface HistoryBlueprintCapability {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly iconName: string;
  readonly role: 'LINEAGE' | 'DIFF' | 'DRIFT' | 'TIMELINE';
}

export const CANONICAL_HISTORY_BLUEPRINT_CAPABILITIES: readonly HistoryBlueprintCapability[] = [
  {
    id: 'cap-lineage',
    title: 'Automated Snapshot Lineage',
    description: 'Every understanding creates an immutable point-in-time cryptographic snapshot.',
    iconName: 'GitBranch',
    role: 'LINEAGE',
  },
  {
    id: 'cap-diff',
    title: 'Diff-Engine Drift Forensics',
    description: 'Automatic comparison between temporal snapshots to detect configuration and security changes.',
    iconName: 'FileDiff',
    role: 'DIFF',
  },
  {
    id: 'cap-drift',
    title: 'Perimeter Drift Alerts',
    description: 'Intelligent alerting when TLS certs, DNS routes, or HTTP headers drift from baseline.',
    iconName: 'Radio',
    role: 'DRIFT',
  },
  {
    id: 'cap-timeline',
    title: 'Infinite Changes Timeline',
    description: 'Continuous chronological history with progressive density and epoch grouping.',
    iconName: 'History',
    role: 'TIMELINE',
  },
] as const;

/**
 * 6. Ten Core Invariants (GX-R016-I01 → GX-R016-I10)
 */
export const GX_R016_INVARIANTS = [
  'GX-R016-I01 — Ephemeral Temporal Grounding: History is locked for guests because unauthenticated sessions lack identity and persistent baseline over time.',
  'GX-R016-I02 — Memory Metaphor Authority: Registration and claim flows are framed as Nebula beginning to remember, never as a transactional purchase or paywall.',
  'GX-R016-I03 — Genesis Baseline Preservation: The ephemeral understanding snapshot seamlessly becomes Snapshot #0 (Genesis Baseline) in the created workspace.',
  'GX-R016-I04 — Zero Synthetic Diffing: Guest History locked preview presents architectural capabilities and blueprints, never fabricated past changes.',
  'GX-R016-I05 — Context-Preserving Handover: Claim bridge carries domain, session ID, job ID, and verified signals without requiring re-discovery or re-entry.',
  'GX-R016-I06 — Non-Coercive Locked State: History tab remains accessible for inspection as an educational blueprint with calm, transparent explanation.',
  'GX-R016-I07 — Single-Flight Claim Security: Claim token is cryptographically and logically bound strictly to the single ephemeral session and domain.',
  'GX-R016-I08 — Instant Baseline Continuity: Upon successful account creation, the workspace immediately reflects the genesis snapshot in Overview and Timeline.',
  'GX-R016-I09 — Rejection of Forced Conversion Tropes: Strictly bans countdown ultimatums, popups, aggressive modal blocks, and misleading pricing cues.',
  'GX-R016-I10 — Multi-Tenant Memory Isolation: Claiming a domain grants access strictly to that domain baseline, with zero exposure to foreign tenant histories.',
] as const;

/**
 * 7. Prohibited Coercive & Paywall Patterns
 */
export const GX_R016_PROHIBITED_ANTIPATTERNS = [
  'COERCIVE_COUNTDOWN_ULTIMATUM',
  'PAYWALL_PRICING_PROMOTION',
  'SYNTHETIC_DIFF_FABRICATION',
  'AGGRESSIVE_POPUP_INTERRUPTION',
  'PRIVILEGE_LEAK_ACROSS_DOMAINS',
  'DISMISSIVE_EMPTY_SHELL',
] as const;

/**
 * 8. Certification Gate Verification
 */
export function verifyGXR016CertificationGate(proposedStatement: string): {
  readonly passed: boolean;
  readonly canonicalAnswer: string;
  readonly reasoning: string;
} {
  const normalize = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

  const normalizedProposed = normalize(proposedStatement);
  const normalizedCanonical = normalize(GX_R016_CERTIFICATION_GATE_STATEMENT);

  const keywords = [
    'history',
    'architectural boundary',
    'ephemeral',
    'continuous',
    'nebula beginning to remember',
    'workspace baseline',
  ];

  const containsAllKeywords = keywords.every((kw) => normalizedProposed.includes(normalize(kw)));
  const matchesCanonical =
    normalizedProposed === normalizedCanonical ||
    (containsAllKeywords && !normalizedProposed.includes('paywall') && !normalizedProposed.includes('price'));

  if (matchesCanonical) {
    return {
      passed: true,
      canonicalAnswer: GX_R016_CERTIFICATION_GATE_STATEMENT,
      reasoning:
        'Statement accurately and authoritatively certifies GX-R016: History as an architectural boundary, registration as Nebula beginning to remember, and seamless genesis baseline preservation.',
    };
  }

  return {
    passed: false,
    canonicalAnswer: GX_R016_CERTIFICATION_GATE_STATEMENT,
    reasoning:
      'Statement does not meet GX-R016 certification criteria. It must reflect the canonical architectural boundary between ephemeral inspection and continuous institutional memory.',
  };
}

/**
 * 9. Memory Activation Narrative Derivation
 */
export function deriveMemoryActivationNarrative(
  domain: string,
  totalSignalsCount: number = 0
): MemoryActivationNarrative {
  const cleanDomain = domain.trim().toLowerCase() || 'your infrastructure';

  return {
    domain: cleanDomain,
    headline: `Nebula is ready to remember ${cleanDomain}`,
    subheadline:
      'Your initial perimeter snapshot is verified. Activate continuous memory to track changes over time.',
    memoryMetaphor:
      'In ephemeral mode, Nebula understands your infrastructure in this single moment. In Workspace, Nebula begins to remember—capturing continuous snapshots, isolating configuration drift, and establishing institutional memory.',
    genesisBaselineTitle: 'Baseline Snapshot Ready to Preserve',
    genesisDescription:
      totalSignalsCount > 0
        ? `Preserves all ${totalSignalsCount} verified wire signals, DNS records, and ingress hops as Genesis Baseline (Snapshot #0).`
        : 'Preserves verified wire signals, DNS records, and ingress hops as Genesis Baseline (Snapshot #0).',
    driftTrackingDescription:
      'Automated background comparisons detect TLS renewals, DNS shifts, header changes, and security posture regressions.',
    callToActionText: 'Begin Continuous Memory →',
    reassuranceText:
      'Zero credit card required. Your current observation is preserved without re-scanning.',
  };
}

/**
 * 10. History Access Permission Audit
 */
export function auditHistoryAccessPermission(
  isGuest: boolean,
  requestedDepth: number = 0
): {
  readonly verdict: HistoryAccessVerdict;
  readonly isAllowed: boolean;
  readonly reason: string;
} {
  if (isGuest) {
    return {
      verdict: 'LOCKED_EPHEMERAL_BOUNDARY',
      isAllowed: false,
      reason:
        'History is inaccessible in ephemeral guest mode. Ephemeral sessions lack a persistent identity and historical baseline. Claiming the domain activates continuous workspace memory.',
    };
  }

  if (requestedDepth < 0) {
    return {
      verdict: 'INVALID_TARGET',
      isAllowed: false,
      reason: 'Requested history depth cannot be negative.',
    };
  }

  return {
    verdict: 'PERMITTED',
    isAllowed: true,
    reason: 'Authenticated workspace user has authorized access to temporal timeline and snapshot lineage.',
  };
}

/**
 * 11. Claim Bridge Payload Validator
 */
export function validateClaimBridgePayload(payload: Partial<ClaimBridgePayload>): {
  readonly valid: boolean;
  readonly errors: readonly string[];
} {
  const errors: string[] = [];

  if (!payload.domain || payload.domain.trim().length === 0) {
    errors.push('Domain is required for claim bridge handover.');
  }

  if (!payload.sessionId || payload.sessionId.trim().length === 0) {
    errors.push('Session ID is required to bind the ephemeral observation.');
  }

  if (!payload.jobId || payload.jobId.trim().length === 0) {
    errors.push('Job ID is required to link the verified understanding job.');
  }

  if (payload.capturedSignalsCount !== undefined && payload.capturedSignalsCount < 0) {
    errors.push('Captured signals count cannot be negative.');
  }

  if (payload.ingressHopsCount !== undefined && payload.ingressHopsCount < 0) {
    errors.push('Ingress hops count cannot be negative.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 12. Genesis Baseline Generator
 */
export function generateGenesisTimelineBaseline(
  domain: string,
  sessionId: string,
  jobId: string,
  capturedSignalsCount: number = 0
): GenesisBaselineNode {
  const timestamp = new Date().toISOString();
  return {
    nodeId: `snap_genesis_${sessionId.slice(0, 8)}`,
    domain: domain.trim().toLowerCase(),
    sessionId,
    jobId,
    epoch: 'GENESIS',
    label: 'Infrastructure Baseline Established',
    timestamp,
    totalSignals: Math.max(0, capturedSignalsCount),
    isAuthoritativeBaseline: true,
    nextScheduledEpoch: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * 13. History Bridge State Evaluator
 */
export function evaluateHistoryBridgeState(context: {
  isGuest: boolean;
  hasSession: boolean;
  isExpired?: boolean;
}): {
  readonly status: MemoryBridgeStatus;
  readonly canClaim: boolean;
  readonly explanation: string;
} {
  if (!context.isGuest) {
    return {
      status: 'CONTINUOUS_LINEAGE',
      canClaim: false,
      explanation: 'User is authenticated in Workspace; continuous memory and temporal history are active.',
    };
  }

  if (context.isExpired) {
    return {
      status: 'EPHEMERAL_OBSERVATION',
      canClaim: false,
      explanation: 'Ephemeral guest session has expired. Start a new understanding to establish a fresh baseline.',
    };
  }

  if (context.hasSession) {
    return {
      status: 'CLAIM_PENDING',
      canClaim: true,
      explanation: 'Ephemeral understanding verified. Ready to preserve as Genesis Baseline in Workspace.',
    };
  }

  return {
    status: 'EPHEMERAL_OBSERVATION',
    canClaim: false,
    explanation: 'No active understanding session detected.',
  };
}

/**
 * 14. Prohibited Copy / Anti-Pattern Validator
 */
export function validateMemoryMetaphorCopy(copy: string): {
  readonly valid: boolean;
  readonly violations: readonly string[];
} {
  const lower = copy.toLowerCase();
  const violations: string[] = [];

  const coercivePhrases = [
    'buy now',
    'subscribe now',
    'special offer',
    'limited time offer',
    '50% off',
    'upgrade to pro to see',
    'paywall',
    'locked behind paywall',
    'premium members only',
    'enter credit card',
    'data will be deleted in 5 minutes',
    'act now before it is lost',
  ];

  for (const phrase of coercivePhrases) {
    if (lower.includes(phrase)) {
      violations.push(`Found coercive/paywall phrase: "${phrase}"`);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
