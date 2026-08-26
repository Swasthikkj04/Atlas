import type {
  InfrastructureSnapshotDto,
  TimelineEventDto,
} from '../../../types/api';

/**
 * Authoritative Infrastructure Memory Semantic States (WX-501).
 *
 * Defines the 7-tier canonical historical state matrix:
 * - 'LOADING': Historical information (snapshots/events) is being retrieved from the backend.
 * - 'READY': Historical information is available, authoritative, and multi-snapshot.
 * - 'EMPTY': Insufficient historical data exists (zero snapshots, or initial baseline with 1 snapshot and zero comparative history).
 * - 'PARTIAL': Historical records exist, but the backend cannot provide the complete history requested.
 * - 'UNAVAILABLE': Historical resource cannot be accessed because of domain/tenant boundaries or unavailable backend permissions.
 * - 'ERROR': The backend request for historical information failed.
 * - 'QUIET': Historical infrastructure data exists and multiple snapshots are recorded, but no relevant changes or regressions were observed.
 */
export type MemoryState =
  | 'LOADING'
  | 'READY'
  | 'EMPTY'
  | 'PARTIAL'
  | 'UNAVAILABLE'
  | 'ERROR'
  | 'QUIET';

/**
 * Canonical Copy Constants for Infrastructure Memory (WX-501).
 * Hard Invariant: Anti-theatrics, objective, non-fabricated copy.
 */
export const MEMORY_BASELINE_COPY = {
  INITIAL_BASELINE_HEADLINE: 'Initial baseline established.',
  INITIAL_BASELINE_EXPLANATION:
    'No previous infrastructure state is available for comparison.',
  QUIET_HEADLINE: 'No changes detected across historical snapshots.',
  QUIET_EXPLANATION:
    'Infrastructure configuration has remained stable across observed verifications.',
  EMPTY_HEADLINE: 'No infrastructure history available.',
  EMPTY_EXPLANATION:
    'Complete an infrastructure understanding analysis to establish the first baseline snapshot.',
} as const;

/**
 * Authoritative Historical Snapshot Identity Contract.
 *
 * Preserves the immutable backend identity of an InfrastructureSnapshot.
 * Invariant: Never synthesize client-side snapshot IDs or derive identity from timestamps.
 */
export interface HistoricalSnapshotIdentity {
  /** Authoritative immutable snapshot ID */
  readonly snapshotId: string;
  /** Monitored domain ID */
  readonly domainId: string;
  /** ISO timestamp when snapshot was captured */
  readonly observedAt: string;
  /** HTTP response time in milliseconds if captured */
  readonly responseTimeMs?: number;
  /** HTTP status code if captured */
  readonly httpStatus?: number;
  /** Associated asynchronous understanding job ID if available */
  readonly jobId?: string | null;
}

/**
 * Authoritative Historical Change Relationship Contract.
 *
 * Preserves explicit before/after snapshot lineage established by backend intelligence.
 * Invariant: Never diff snapshots in React or fabricate causality.
 */
export interface HistoricalChangeRelationship {
  /** Unique change event identifier */
  readonly changeId: string;
  /** Associated domain ID */
  readonly domainId: string;
  /** Snapshot ID where this change was observed */
  readonly currentSnapshotId: string;
  /** Previous snapshot ID used for comparison, or null for initial observations */
  readonly previousSnapshotId: string | null;
  /** Whether this change event occurred against the initial baseline snapshot */
  readonly isInitialBaseline: boolean;
  /** Canonical change type determined by backend */
  readonly changeType: string;
  /** Severity level determined by backend */
  readonly severity: string;
  /** Detection timestamp */
  readonly detectedAt: string;
  /** Human-readable event headline */
  readonly title: string;
  /** Detailed backend explanation narrative */
  readonly explanation?: string;
  /** Associated finding ID if linked to a security/operational finding */
  readonly findingId?: string | null;
}

/**
 * Baseline Resolution Contract for Single-Snapshot & Newly Understood Domains.
 */
export interface MemoryBaselineResolution {
  /** True if the domain currently has only 1 snapshot and zero comparative history */
  readonly isInitialBaseline: boolean;
  /** Total count of trusted completed snapshots */
  readonly totalSnapshots: number;
  /** Active baseline snapshot ID */
  readonly currentSnapshotId: string | null;
  /** Previous snapshot ID (null for baseline) */
  readonly previousSnapshotId: string | null;
  /** Authoritative headline explanation */
  readonly baselineHeadline: string;
  /** Authoritative narrative explanation */
  readonly baselineExplanation: string;
}

/**
 * Historical Navigation & Deep-Linking Contract.
 */
export interface MemoryNavigationContext {
  /** Domain scope */
  readonly domainId: string;
  /** Canonical navigation target classification */
  readonly sourceType: 'snapshot' | 'change' | 'timeline_event' | 'historical_context';
  /** Authoritative resource ID */
  readonly sourceId: string;
  /** Safe return navigation path */
  readonly returnPath: string;
}

/**
 * Pure deterministic function to resolve the semantic state of Infrastructure Memory.
 *
 * Invariants:
 * 1. React must never infer chronology or diff snapshots.
 * 2. Domain mismatches are immediately isolated as UNAVAILABLE.
 * 3. Incomplete understandings / non-completed jobs are excluded from historical truth.
 */
export function resolveMemoryState(params: {
  readonly snapshots?: readonly InfrastructureSnapshotDto[] | null;
  readonly timelineEvents?: readonly TimelineEventDto[] | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly isDomainMismatch?: boolean;
  readonly isPartial?: boolean;
}): MemoryState {
  const {
    snapshots,
    timelineEvents,
    isLoading,
    isError,
    isDomainMismatch = false,
    isPartial = false,
  } = params;

  if (isDomainMismatch) {
    return 'UNAVAILABLE';
  }

  if (isLoading) {
    return 'LOADING';
  }

  if (isError) {
    return 'ERROR';
  }

  const validSnapshots = (snapshots || []).filter(
    (s) => Boolean(s.id) && Boolean(s.capturedAt || s.createdAt)
  );

  // If zero valid snapshots exist, history is EMPTY
  if (validSnapshots.length === 0) {
    return 'EMPTY';
  }

  // If only 1 snapshot exists (initial baseline) and 0 timeline change events exist,
  // the domain is in the initial baseline state (EMPTY historical comparisons)
  const validEvents = timelineEvents || [];
  if (validSnapshots.length === 1 && validEvents.length === 0) {
    return 'EMPTY';
  }

  // If degraded or incomplete historical range is flagged
  if (isPartial) {
    return 'PARTIAL';
  }

  // If multiple snapshots exist but zero change events were detected across them, state is QUIET
  if (validSnapshots.length > 1 && validEvents.length === 0) {
    return 'QUIET';
  }

  // Multi-snapshot historical records with authoritative changes
  return 'READY';
}

/**
 * Pure deterministic function to resolve whether a domain is at its initial baseline snapshot.
 *
 * Invariant: Never fabricate "Previous: Unknown" or "Change: None" as if comparison occurred.
 */
export function resolveMemoryBaseline(params: {
  readonly snapshots?: readonly InfrastructureSnapshotDto[] | null;
  readonly timelineEvents?: readonly TimelineEventDto[] | null;
}): MemoryBaselineResolution {
  const { snapshots = [], timelineEvents = [] } = params;
  const validSnapshots = (snapshots || []).filter(
    (s) => Boolean(s.id) && Boolean(s.capturedAt || s.createdAt)
  );

  const totalSnapshots = validSnapshots.length;

  if (totalSnapshots === 0) {
    return {
      isInitialBaseline: false,
      totalSnapshots: 0,
      currentSnapshotId: null,
      previousSnapshotId: null,
      baselineHeadline: MEMORY_BASELINE_COPY.EMPTY_HEADLINE,
      baselineExplanation: MEMORY_BASELINE_COPY.EMPTY_EXPLANATION,
    };
  }

  if (totalSnapshots === 1) {
    const baselineSnapshot = validSnapshots[0];
    return {
      isInitialBaseline: true,
      totalSnapshots: 1,
      currentSnapshotId: baselineSnapshot.id,
      previousSnapshotId: null,
      baselineHeadline: MEMORY_BASELINE_COPY.INITIAL_BASELINE_HEADLINE,
      baselineExplanation: MEMORY_BASELINE_COPY.INITIAL_BASELINE_EXPLANATION,
    };
  }

  // Multi-snapshot domain
  const latestSnapshot = validSnapshots[0];
  const priorSnapshot = validSnapshots[1] || null;

  const hasEvents = (timelineEvents || []).length > 0;

  return {
    isInitialBaseline: false,
    totalSnapshots,
    currentSnapshotId: latestSnapshot.id,
    previousSnapshotId: priorSnapshot ? priorSnapshot.id : null,
    baselineHeadline: hasEvents ? '' : MEMORY_BASELINE_COPY.QUIET_HEADLINE,
    baselineExplanation: hasEvents ? '' : MEMORY_BASELINE_COPY.QUIET_EXPLANATION,
  };
}

/**
 * Pure function to extract authoritative historical snapshot identity.
 * Rejects unobserved or invalid snapshots.
 */
export function resolveSnapshotIdentity(
  snapshot: InfrastructureSnapshotDto | null | undefined
): HistoricalSnapshotIdentity | null {
  if (!snapshot || !snapshot.id || !snapshot.domainId) {
    return null;
  }

  const observedAt = snapshot.capturedAt || snapshot.createdAt || '';
  if (!observedAt) {
    return null;
  }

  return {
    snapshotId: snapshot.id,
    domainId: snapshot.domainId,
    observedAt,
    responseTimeMs: snapshot.responseTimeMs,
    httpStatus: snapshot.httpStatus,
    jobId: snapshot.jobId,
  };
}

/**
 * Pure function to extract authoritative change relationships from a timeline event.
 */
export function resolveTimelineEventRelationship(
  event: TimelineEventDto
): HistoricalChangeRelationship {
  const currentSnapshotId =
    event.currentSnapshotId || event.snapshotId || '';
  const previousSnapshotId = event.previousSnapshotId || null;
  const isInitialBaseline = previousSnapshotId === null;

  return {
    changeId: event.id,
    domainId: event.domainId,
    currentSnapshotId,
    previousSnapshotId,
    isInitialBaseline,
    changeType: event.changeType || 'MODIFIED',
    severity: event.severity || 'INFORMATIONAL',
    detectedAt:
      event.detectedAt ||
      (typeof event.timestamp === 'string'
        ? event.timestamp
        : event.timestamp instanceof Date
        ? event.timestamp.toISOString()
        : new Date().toISOString()),
    title: event.title,
    explanation: event.explanation || event.description || event.summary,
    findingId: event.findingId || null,
  };
}

/**
 * Pure function to validate and resolve memory deep-linking navigation parameters.
 */
export function resolveMemoryNavigationContext(params: {
  readonly domainId: string;
  readonly activeDomainId: string;
  readonly sourceType?: string | null;
  readonly sourceId?: string | null;
  readonly returnPath?: string | null;
}): {
  readonly isValid: boolean;
  readonly isDomainMismatch: boolean;
  readonly navigation: MemoryNavigationContext | null;
} {
  const { domainId, activeDomainId, sourceType, sourceId, returnPath } = params;

  if (!domainId || !activeDomainId) {
    return { isValid: false, isDomainMismatch: false, navigation: null };
  }

  if (domainId !== activeDomainId) {
    return { isValid: false, isDomainMismatch: true, navigation: null };
  }

  const validTypes: readonly ('snapshot' | 'change' | 'timeline_event' | 'historical_context')[] = [
    'snapshot',
    'change',
    'timeline_event',
    'historical_context',
  ];

  if (!sourceType || !validTypes.includes(sourceType as 'snapshot' | 'change' | 'timeline_event' | 'historical_context') || !sourceId) {
    return { isValid: false, isDomainMismatch: false, navigation: null };
  }

  return {
    isValid: true,
    isDomainMismatch: false,
    navigation: {
      domainId,
      sourceType: sourceType as 'snapshot' | 'change' | 'timeline_event' | 'historical_context',
      sourceId,
      returnPath: returnPath || '/workspace',
    },
  };
}
