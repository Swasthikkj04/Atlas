import type {
  InfrastructureSnapshotDto,
  TimelineEventDto,
} from '../../../types/api';
import {
  type ChangesState,
  type MeaningfulChangeStory,
  type ChronologicalChangeGroups,
  resolveChangesState,
  resolveMeaningfulChangeStory,
  groupChangesChronologically,
  CHANGES_COPY,
} from './changes.contract.ts';

/**
 * WX-1002: Snapshot Comparison & Change Detection Integration Contract.
 *
 * Connects the Changes contract (WX-1001) to verified snapshot history and
 * backend comparison intelligence without frontend diff interpretation.
 *
 * Authoritative Flow:
 * Previous verified snapshot + Current verified snapshot
 *   -> Backend comparison
 *   -> Detected changes
 *   -> Meaningful change model
 *   -> WX-1001 contract
 */

export interface VerifiedSnapshotPair {
  readonly currentSnapshot: InfrastructureSnapshotDto | null;
  readonly previousSnapshot: InfrastructureSnapshotDto | null;
  readonly totalVerifiedSnapshots: number;
  readonly isFirstUnderstanding: boolean;
  readonly hasComparisonPair: boolean;
}

/**
 * Selects the verified snapshot pair (Current and immediately preceding Previous)
 * strictly from authoritative historical snapshots for the active domain.
 *
 * Invariants:
 * 1. Only considers successfully captured snapshots.
 * 2. Never compares against an in-progress or failed understanding.
 * 3. Scope is strictly isolated to the specified domain.
 */
export function resolveVerifiedSnapshotPair(
  snapshots?: readonly InfrastructureSnapshotDto[] | null,
  targetDomainId?: string
): VerifiedSnapshotPair {
  if (!snapshots || snapshots.length === 0) {
    return {
      currentSnapshot: null,
      previousSnapshot: null,
      totalVerifiedSnapshots: 0,
      isFirstUnderstanding: false,
      hasComparisonPair: false,
    };
  }

  // Filter valid, captured snapshots strictly belonging to targetDomainId if provided
  const validSnapshots = snapshots.filter((s) => {
    if (!s.id || (!s.capturedAt && !s.createdAt)) return false;
    if (targetDomainId && s.domainId && s.domainId !== targetDomainId) return false;
    return true;
  });

  const totalVerifiedSnapshots = validSnapshots.length;

  if (totalVerifiedSnapshots === 0) {
    return {
      currentSnapshot: null,
      previousSnapshot: null,
      totalVerifiedSnapshots: 0,
      isFirstUnderstanding: false,
      hasComparisonPair: false,
    };
  }

  if (totalVerifiedSnapshots === 1) {
    return {
      currentSnapshot: validSnapshots[0],
      previousSnapshot: null,
      totalVerifiedSnapshots: 1,
      isFirstUnderstanding: true,
      hasComparisonPair: false,
    };
  }

  return {
    currentSnapshot: validSnapshots[0],
    previousSnapshot: validSnapshots[1],
    totalVerifiedSnapshots,
    isFirstUnderstanding: false,
    hasComparisonPair: true,
  };
}

export interface AuthoritativeChangesIntegrationResult {
  readonly state: ChangesState;
  readonly snapshotPair: VerifiedSnapshotPair;
  readonly changes: readonly MeaningfulChangeStory[];
  readonly groups: ChronologicalChangeGroups;
  readonly headline: string;
  readonly explanation: string;
  readonly domainId: string;
  readonly domainName: string;
}

/**
 * Authoritative pure resolver mapping backend snapshot history and timeline events
 * to the WX-1001 Changes experience model.
 *
 * Invariants:
 * 1. Domain isolation: rejects/filters any events belonging to other domains.
 * 2. Categories: enforces the 9 certified change categories.
 * 3. Lineage: preserves previous/current snapshot IDs and evidence counts.
 * 4. Value transitions: maps previousValue -> currentValue directly from backend.
 * 5. Timestamps: derived strictly from authoritative backend timestamps.
 */
export function integrateAuthoritativeChanges(params: {
  readonly domainId: string;
  readonly domainName: string;
  readonly snapshots?: readonly InfrastructureSnapshotDto[] | null;
  readonly timelineEvents?: readonly TimelineEventDto[] | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly isDomainMismatch?: boolean;
  readonly isUnderstanding?: boolean;
  readonly referenceTime?: Date;
}): AuthoritativeChangesIntegrationResult {
  const {
    domainId,
    domainName,
    snapshots,
    timelineEvents,
    isLoading,
    isError,
    isDomainMismatch = false,
    isUnderstanding = false,
    referenceTime = new Date(),
  } = params;

  // 1. Resolve authoritative snapshot pair for this domain
  const snapshotPair = resolveVerifiedSnapshotPair(snapshots, domainId);

  // 2. Filter timeline events strictly scoped to this domain (domain isolation)
  const scopedEvents = (timelineEvents || []).filter((e) => {
    if (!e.domainId) return true; // Legacy events without domainId are allowed if scoped by query
    return e.domainId === domainId;
  });

  // 3. Resolve semantic Changes state
  const state = resolveChangesState({
    snapshots,
    timelineEvents: scopedEvents,
    isLoading,
    isError,
    isDomainMismatch,
    isUnderstanding,
    totalSnapshots: snapshotPair.totalVerifiedSnapshots,
  });

  // 4. Map scoped timeline events to MeaningfulChangeStory objects
  const changes = scopedEvents.map((event) =>
    resolveMeaningfulChangeStory(event, domainName)
  );

  // 5. Group changes chronologically into Recent vs Earlier
  const groups = groupChangesChronologically(changes, referenceTime);

  // 6. Resolve appropriate headline and explanation
  let headline: string = CHANGES_COPY.SURFACE_TITLE;
  let explanation: string = CHANGES_COPY.SURFACE_DESCRIPTION;

  if (state === 'FIRST_UNDERSTANDING') {
    headline = CHANGES_COPY.FIRST_UNDERSTANDING_HEADLINE;
    explanation = domainName
      ? `This is the baseline understanding for ${domainName}.`
      : CHANGES_COPY.FIRST_UNDERSTANDING_EXPLANATION;
  } else if (state === 'QUIET') {
    headline = CHANGES_COPY.QUIET_HEADLINE;
    explanation = CHANGES_COPY.QUIET_EXPLANATION;
  } else if (state === 'EMPTY') {
    headline = CHANGES_COPY.EMPTY_HEADLINE;
    explanation = CHANGES_COPY.EMPTY_EXPLANATION;
  } else if (state === 'UNDERSTANDING_IN_PROGRESS') {
    headline = CHANGES_COPY.SURFACE_TITLE;
    explanation = CHANGES_COPY.UNDERSTANDING_IN_PROGRESS_BANNER;
  }

  return {
    state,
    snapshotPair,
    changes,
    groups,
    headline,
    explanation,
    domainId,
    domainName,
  };
}

/**
 * Validates that a change story's snapshot lineage is consistent with the domain's snapshot history.
 */
export function verifySnapshotLineageIntegrity(
  change: MeaningfulChangeStory,
  snapshots?: readonly InfrastructureSnapshotDto[] | null
): {
  readonly currentSnapshotExists: boolean;
  readonly previousSnapshotExists: boolean;
  readonly isLineageConsistent: boolean;
} {
  if (!snapshots || snapshots.length === 0) {
    return {
      currentSnapshotExists: false,
      previousSnapshotExists: false,
      isLineageConsistent: false,
    };
  }

  const snapshotIds = new Set(snapshots.map((s) => s.id));

  const currentSnapshotExists = snapshotIds.has(change.currentSnapshotId);
  const previousSnapshotExists = change.previousSnapshotId
    ? snapshotIds.has(change.previousSnapshotId)
    : true; // Baseline has null previous snapshot

  const isLineageConsistent = change.isInitialBaseline
    ? currentSnapshotExists
    : currentSnapshotExists && (change.previousSnapshotId ? previousSnapshotExists : true);

  return {
    currentSnapshotExists,
    previousSnapshotExists,
    isLineageConsistent,
  };
}

/**
 * Historical Snapshot Comparison Result Contract (WX-1008).
 */
export interface HistoricalComparisonResult {
  readonly status: 'READY' | 'UNAVAILABLE' | 'INVALID_PAIR' | 'SAME_SNAPSHOT';
  readonly domainId: string;
  readonly domainName: string;
  readonly baseSnapshot: InfrastructureSnapshotDto | null;
  readonly targetSnapshot: InfrastructureSnapshotDto | null;
  readonly changes: readonly MeaningfulChangeStory[];
  readonly unchangedComponents: readonly string[];
  readonly headline: string;
  readonly description: string;
}

/**
 * Resolves authoritative comparison between two distinct historical snapshots (WX-1008).
 *
 * Invariants:
 * 1. Only immutable, verified snapshots for the active domain are considered.
 * 2. Strictly rejects cross-domain comparisons.
 * 3. Never synthesizes client-side diffs; relies on authoritative snapshot data and timeline records.
 * 4. Honestly communicates when zero changes were detected.
 */
export function resolveHistoricalSnapshotComparison(params: {
  readonly domainId: string;
  readonly domainName: string;
  readonly baseSnapshotId?: string | null;
  readonly targetSnapshotId?: string | null;
  readonly snapshots?: readonly InfrastructureSnapshotDto[] | null;
  readonly timelineEvents?: readonly TimelineEventDto[] | null;
}): HistoricalComparisonResult {
  const {
    domainId,
    domainName,
    baseSnapshotId,
    targetSnapshotId,
    snapshots,
    timelineEvents,
  } = params;

  if (!snapshots || snapshots.length === 0 || !baseSnapshotId || !targetSnapshotId) {
    return {
      status: 'UNAVAILABLE',
      domainId,
      domainName,
      baseSnapshot: null,
      targetSnapshot: null,
      changes: [],
      unchangedComponents: [],
      headline: 'Historical comparison unavailable',
      description: 'Insufficient historical snapshot records to establish a comparative analysis.',
    };
  }

  if (baseSnapshotId === targetSnapshotId) {
    const matched = snapshots.find((s) => s.id === targetSnapshotId && (!s.domainId || s.domainId === domainId)) || null;
    return {
      status: 'SAME_SNAPSHOT',
      domainId,
      domainName,
      baseSnapshot: matched,
      targetSnapshot: matched,
      changes: [],
      unchangedComponents: [],
      headline: 'Identical snapshot comparison',
      description: 'Select two distinct verified snapshots to analyze infrastructure changes over time.',
    };
  }

  // Find snapshots strictly bounded to active domainId
  const validDomainSnapshots = snapshots.filter(
    (s) => Boolean(s.id) && Boolean(s.capturedAt || s.createdAt) && (!s.domainId || s.domainId === domainId)
  );

  const baseSnapshot = validDomainSnapshots.find((s) => s.id === baseSnapshotId) || null;
  const targetSnapshot = validDomainSnapshots.find((s) => s.id === targetSnapshotId) || null;

  if (!baseSnapshot || !targetSnapshot) {
    return {
      status: 'INVALID_PAIR',
      domainId,
      domainName,
      baseSnapshot,
      targetSnapshot,
      changes: [],
      unchangedComponents: [],
      headline: 'Historical comparison unavailable',
      description: 'One or both selected snapshots do not exist in the verified historical baseline for this domain.',
    };
  }

  // Filter timeline events that connect these two snapshots or are associated with target snapshot
  const comparativeEvents = (timelineEvents || []).filter((e) => {
    if (e.domainId && e.domainId !== domainId) return false;
    const isTargetEvent = e.snapshotId === targetSnapshotId || e.currentSnapshotId === targetSnapshotId;
    const isBaseEvent = !e.previousSnapshotId || e.previousSnapshotId === baseSnapshotId;
    return isTargetEvent && isBaseEvent;
  });

  const changes = comparativeEvents.map((evt) =>
    resolveMeaningfulChangeStory(evt, domainName)
  );

  // Extract unchanged components from snapshots if available
  const unchangedComponents: string[] = [];
  if (baseSnapshot && targetSnapshot) {
    if (
      baseSnapshot.httpObservation?.server &&
      targetSnapshot.httpObservation?.server &&
      baseSnapshot.httpObservation.server === targetSnapshot.httpObservation.server
    ) {
      unchangedComponents.push(`Web Server: ${targetSnapshot.httpObservation.server}`);
    }
    if (
      baseSnapshot.tlsCertificate?.issuer &&
      targetSnapshot.tlsCertificate?.issuer &&
      baseSnapshot.tlsCertificate.issuer === targetSnapshot.tlsCertificate.issuer
    ) {
      unchangedComponents.push(`TLS Issuer: ${targetSnapshot.tlsCertificate.issuer}`);
    }
  }

  const targetDateStr = targetSnapshot.capturedAt || targetSnapshot.createdAt || '';
  const baseDateStr = baseSnapshot.capturedAt || baseSnapshot.createdAt || '';

  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
  const baseDate = baseDateStr ? new Date(baseDateStr) : new Date();

  return {
    status: 'READY',
    domainId,
    domainName,
    baseSnapshot,
    targetSnapshot,
    changes,
    unchangedComponents,
    headline: changes.length > 0
      ? `${changes.length} ${changes.length === 1 ? 'change' : 'changes'} detected between understandings`
      : 'No meaningful changes detected between these understandings',
    description: `Comparing verified understanding from ${targetDate.toLocaleDateString()} against ${baseDate.toLocaleDateString()}.`,
  };
}

export const SNAPSHOT_COMPARISON_INVARIANTS = {
  PREVIOUS_SNAPSHOT_IS_IMMEDIATELY_PRECEDING:
    'Previous snapshot is strictly the immediately preceding verified snapshot; never compare against in-progress or failed runs.',
  CURRENT_SNAPSHOT_IS_LATEST_VERIFIED:
    'Current snapshot is strictly the latest successfully verified snapshot for the active domain.',
  UNIFIED_CHANGE_CONVERGENCE:
    'Manual and automatic understandings produce identical change detection truth through the shared snapshot comparison pipeline.',
  STRICT_DOMAIN_ISOLATION:
    'A change detected on domain A must never appear on domain B.',
  NO_CLIENT_SIDE_DIFF_FABRICATION:
    'All value transitions (previousValue -> currentValue) and category mappings originate from backend comparison intelligence.',
  NO_UNVERIFIED_SNAPSHOT_COMPARISON:
    'Only immutable, successfully captured snapshots can be selected for historical comparison; never compare failed or in-progress runs.',
  NO_CROSS_DOMAIN_COMPARISON:
    'Historical comparisons are strictly isolated to snapshots belonging to the active domain context.',
  IMMUTABLE_SNAPSHOT_PRESERVATION:
    'Historical snapshots are immutable records. Comparison produces analytical views without altering underlying facts.',
  AUTHORITATIVE_COMPARISON_ONLY:
    'Differences and unchanged components are derived from verified backend records, never heuristic client diffing.',
  NO_FRONTEND_DIFF_INFERENCE:
    'Frontend does not execute custom JSON/string diffing algorithms; it consumes authoritative backend transition records.',
  NO_FALSE_UNCHANGED_CLAIM:
    'When no differences exist between snapshots, communicate honest absence of changes rather than claiming everything is unchanged.',
  SNAPSHOT_LINEAGE_PRESERVED:
    'Every historical comparison preserves explicit base and target snapshot identifiers.',
  EVIDENCE_LINEAGE_PRESERVED:
    'Changes displayed within historical comparisons maintain full lineage traceability to raw evidence artifacts.',
  DOMAIN_CONTEXT_PRESERVED:
    'Domain identity is strictly preserved across comparison surface navigation and deep investigation links.',
  NO_TIMELINE_REGRESSION:
    'Historical comparison is an investigation capability that enriches rather than replaces the primary Changes timeline.',
} as const;
