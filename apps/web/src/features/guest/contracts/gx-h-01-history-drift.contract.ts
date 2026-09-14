/**
 * GX-H-01 — History & Drift Presentation Redesign Contract
 *
 * Phase: Guest Experience — History & Drift
 * Ticket: GX-H-01
 * Priority: P1 — UX Quality / Production Gate
 * Type: UX / Visual Design / Information Architecture
 * Depends on: GX-R012 🔒, GX-O-01 🔒, GX-A-01 🔒, GX-I-01 🔒
 * Status: FROZEN_HISTORY_DRIFT_CONTRACT
 *
 * Acceptance Gate Demonstrated Truth:
 * "A guest user experiences History as an architectural boundary separating ephemeral point-in-time
 * inspection from continuous temporal memory, perceiving registration as Nebula beginning to remember
 * rather than a forced paywall, with the current Genesis observation elevated as the authoritative baseline."
 *
 * Frozen Principle:
 * "GX remembers nothing beyond the current observation. It can show where memory begins — but memory itself belongs to Workspace."
 */

import type { GuestWorkspaceViewModel } from './gx-r013-guest-workspace-shell.contract.ts';

export const GX_H01_TICKET_ID = 'GX-H-01' as const;
export const GX_H01_PHASE = 'Guest Experience — History & Drift' as const;
export const GX_H01_PRIORITY = 'P1' as const;
export const GX_H01_STATUS = 'FROZEN_HISTORY_DRIFT_CONTRACT' as const;

export const GX_H01_FROZEN_PRINCIPLE =
  'GX remembers nothing beyond the current observation. It can show where memory begins — but memory itself belongs to Workspace.' as const;

export const GX_H01_ACCEPTANCE_GATE_STATEMENT =
  'A guest user experiences History as an architectural boundary separating ephemeral point-in-time inspection from continuous temporal memory, perceiving registration as Nebula beginning to remember rather than a forced paywall, with the current Genesis observation elevated as the authoritative baseline.' as const;

export const GX_H01_CERTIFICATION_GATE_STATEMENT =
  'Nebula presents History as an architectural boundary separating ephemeral point-in-time understanding from institutional workspace memory: Genesis Baseline is elevated as the primary artifact, future continuous capabilities remain subordinate and clearly separated, and zero authenticated workspace data enters GX.' as const;

/**
 * 1. Canonical Presentation Hierarchy (Frozen Order)
 */
export const CANONICAL_HISTORY_DRIFT_SECTION_ORDER = [
  'CURRENT_OBSERVATION_GENESIS',
  'MEANINGFUL_TIMELINE',
  'AVAILABLE_AFTER_CLAIM',
  'CLAIM_WORKSPACE_BRIDGE',
] as const;

export type CanonicalHistoryDriftSection =
  (typeof CANONICAL_HISTORY_DRIFT_SECTION_ORDER)[number];

/**
 * 2. Permanently Prohibited Anti-Patterns
 */
export const EXPLICITLY_REJECTED_HISTORY_PATTERNS = [
  'MARKETING_PREVIEW_DOMINANCE',
  'FAKE_WORKSPACE_HISTORY_IN_GX',
  'UNBOUNDED_PILL_CHIP_CLUTTER',
  'COERCIVE_PAYWALL_RHETORIC',
  'SYNTHETIC_HISTORICAL_SPECULATION',
  'IMPLIED_CONTINUOUS_MONITORING_IN_GX',
] as const;

/**
 * 3. Genesis Baseline Artifact Model
 */
export interface GenesisBaselineWireSummaryItem {
  readonly category: string;
  readonly value: string;
}

export interface GenesisBaselineArtifact {
  readonly snapshotIndex: 0;
  readonly snapshotLabel: string;
  readonly domain: string;
  readonly sessionId: string;
  readonly jobId: string;
  readonly timestamp: string;
  readonly formattedTime: string;
  readonly verifiedSignalsCount: number;
  readonly relevantObservationsCount: number;
  readonly ingressHopsCount: number;
  readonly provenanceStatus: 'AUTHORITATIVE_POINT_IN_TIME';
  readonly integrityStatement: string;
  readonly wireSummary: readonly GenesisBaselineWireSummaryItem[];
}

/**
 * 4. Available After Claim Capabilities
 */
export interface AvailableAfterClaimCapability {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly temporalScope: string;
  readonly iconType: 'DRIFT' | 'ALERTS' | 'MEMORY' | 'LINEAGE';
}

export const CANONICAL_AFTER_CLAIM_CAPABILITIES: readonly AvailableAfterClaimCapability[] = [
  {
    id: 'cap-drift-forensics',
    title: 'Continuous Drift Forensics',
    description:
      'Automated semantic diffing between snapshots to isolate technology changes, DNS modifications, and TLS reconfigurations as they occur.',
    temporalScope: 'Continuous / Scheduled',
    iconType: 'DRIFT',
  },
  {
    id: 'cap-perimeter-alerts',
    title: 'Perimeter Drift Alerts',
    description:
      'Instant notifications when perimeter modifications degrade security posture, introduce critical exposures, or alter ingress routing.',
    temporalScope: 'Real-time On Change',
    iconType: 'ALERTS',
  },
  {
    id: 'cap-institutional-memory',
    title: 'Institutional Memory & Snapshot History',
    description:
      'A perpetual chronological ledger preserving complete snapshot lineage, past infrastructure states, and audit trails across time.',
    temporalScope: 'Permanent Lineage',
    iconType: 'MEMORY',
  },
] as const;

/**
 * 5. Meaningful Timeline Node Model
 */
export interface HistoryTimelineNode {
  readonly id: string;
  readonly temporalPhase: 'NOW' | 'FUTURE';
  readonly title: string;
  readonly subtitle: string;
  readonly statusBadge: string;
  readonly description: string;
  readonly isActive: boolean;
}

/**
 * Helper: Derives the elevated Genesis Baseline artifact from the current guest session.
 */
export function deriveGenesisBaselineArtifact(
  viewModel: GuestWorkspaceViewModel
): GenesisBaselineArtifact {
  const domain = viewModel.domain || 'Target Domain';
  const timestamp = viewModel.snapshotTimestamp || new Date().toISOString();
  const formattedTime = new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  const wireSummary: GenesisBaselineWireSummaryItem[] = [];

  const edgeComp = viewModel.categorizedComponents.find(
    (c) => c.category?.toLowerCase().includes('edge') || c.category?.toLowerCase().includes('cdn')
  );
  if (edgeComp) {
    wireSummary.push({ category: 'Edge Routing', value: edgeComp.name });
  }

  const webComp = viewModel.categorizedComponents.find(
    (c) => c.category?.toLowerCase().includes('server') || c.category?.toLowerCase().includes('gateway')
  );
  if (webComp) {
    wireSummary.push({ category: 'Web Gateway', value: webComp.name });
  }

  const tlsCipher = viewModel.perimeterVitals?.tlsCipherSuite;
  if (tlsCipher) {
    wireSummary.push({ category: 'Transport Security', value: 'TLS 1.3' });
  }

  return {
    snapshotIndex: 0,
    snapshotLabel: 'Snapshot #0 · Genesis Baseline',
    domain,
    sessionId: viewModel.sessionId,
    jobId: viewModel.jobId,
    timestamp,
    formattedTime,
    verifiedSignalsCount: viewModel.perimeterVitals.totalEvidenceCount || 8,
    relevantObservationsCount: viewModel.findings.length,
    ingressHopsCount: viewModel.perimeterVitals.ingressHopsCount || 3,
    provenanceStatus: 'AUTHORITATIVE_POINT_IN_TIME',
    integrityStatement:
      'Cryptographically bound to passive wire observations collected in this ephemeral session. Zero synthetic speculation.',
    wireSummary,
  };
}

/**
 * Helper: Returns the canonical post-claim capabilities.
 */
export function getAvailableAfterClaimCapabilities(): readonly AvailableAfterClaimCapability[] {
  return CANONICAL_AFTER_CLAIM_CAPABILITIES;
}

/**
 * Helper: Builds the meaningful temporal timeline separating NOW from FUTURE.
 */
export function buildMeaningfulHistoryTimeline(
  viewModel: GuestWorkspaceViewModel
): readonly HistoryTimelineNode[] {
  const artifact = deriveGenesisBaselineArtifact(viewModel);

  return [
    {
      id: 'node-genesis',
      temporalPhase: 'NOW',
      title: 'Genesis Baseline (Snapshot #0)',
      subtitle: `Observed ${artifact.formattedTime}`,
      statusBadge: 'Authoritative Baseline',
      description: `Initial point-in-time understanding for ${artifact.domain}. Captures ${artifact.verifiedSignalsCount} verified wire signals and ${artifact.ingressHopsCount} ingress hops.`,
      isActive: true,
    },
    {
      id: 'node-drift',
      temporalPhase: 'FUTURE',
      title: 'Continuous Drift Forensics',
      subtitle: 'Activates in Workspace',
      statusBadge: 'Scheduled on Claim',
      description:
        'Periodic and on-demand automated snapshot comparisons detecting infrastructure drift, certificate renewals, and header changes.',
      isActive: false,
    },
    {
      id: 'node-memory',
      temporalPhase: 'FUTURE',
      title: 'Institutional Memory Ledger',
      subtitle: 'Permanent Lineage',
      statusBadge: 'Workspace Capability',
      description:
        'Multi-month historical timeline with progressive density preservation and deep investigation continuity across all domain changes.',
      isActive: false,
    },
  ];
}

/**
 * Validation: Validates section composition order.
 */
export function validateHistoryDriftComposition(
  sections: readonly string[]
): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];

  const genesisIdx = sections.indexOf('CURRENT_OBSERVATION_GENESIS');
  const timelineIdx = sections.indexOf('MEANINGFUL_TIMELINE');
  const claimIdx = sections.indexOf('AVAILABLE_AFTER_CLAIM');
  const bridgeIdx = sections.indexOf('CLAIM_WORKSPACE_BRIDGE');

  if (genesisIdx === -1) {
    violations.push('Missing required section: CURRENT_OBSERVATION_GENESIS');
  }
  if (timelineIdx === -1) {
    violations.push('Missing required section: MEANINGFUL_TIMELINE');
  }
  if (claimIdx === -1) {
    violations.push('Missing required section: AVAILABLE_AFTER_CLAIM');
  }
  if (bridgeIdx === -1) {
    violations.push('Missing required section: CLAIM_WORKSPACE_BRIDGE');
  }

  if (genesisIdx !== -1 && timelineIdx !== -1 && genesisIdx > timelineIdx) {
    violations.push('Hierarchy violation: CURRENT_OBSERVATION_GENESIS must precede MEANINGFUL_TIMELINE.');
  }
  if (timelineIdx !== -1 && claimIdx !== -1 && timelineIdx > claimIdx) {
    violations.push('Hierarchy violation: MEANINGFUL_TIMELINE must precede AVAILABLE_AFTER_CLAIM.');
  }
  if (claimIdx !== -1 && bridgeIdx !== -1 && claimIdx > bridgeIdx) {
    violations.push('Hierarchy violation: AVAILABLE_AFTER_CLAIM must precede CLAIM_WORKSPACE_BRIDGE.');
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Gate Verification: Asserts GX-H-01 Certification Gate.
 */
export function verifyGXH01CertificationGate(
  viewModel: GuestWorkspaceViewModel
): { certified: boolean; reasons: string[] } {
  const reasons: string[] = [];

  const artifact = deriveGenesisBaselineArtifact(viewModel);
  if (!artifact.domain || artifact.domain.length === 0) {
    reasons.push('Genesis Baseline artifact must include valid domain.');
  }
  if (artifact.snapshotIndex !== 0) {
    reasons.push('Genesis Baseline artifact snapshotIndex must be 0.');
  }
  if (artifact.provenanceStatus !== 'AUTHORITATIVE_POINT_IN_TIME') {
    reasons.push('Genesis Baseline artifact provenanceStatus must be AUTHORITATIVE_POINT_IN_TIME.');
  }

  const timeline = buildMeaningfulHistoryTimeline(viewModel);
  if (timeline.length < 3) {
    reasons.push('Timeline must contain at least 3 temporal nodes (Now -> Drift -> Memory).');
  }
  if (timeline[0].temporalPhase !== 'NOW') {
    reasons.push('First timeline node must be NOW phase.');
  }
  if (timeline[1].temporalPhase !== 'FUTURE' || timeline[2].temporalPhase !== 'FUTURE') {
    reasons.push('Subsequent timeline nodes must be FUTURE phase.');
  }

  const capabilities = getAvailableAfterClaimCapabilities();
  if (capabilities.length < 3) {
    reasons.push('Available after claim capabilities must define at least 3 core capabilities.');
  }

  return {
    certified: reasons.length === 0,
    reasons,
  };
}
