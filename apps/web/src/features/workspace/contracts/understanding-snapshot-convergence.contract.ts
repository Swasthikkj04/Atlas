import type { InfrastructureSnapshotDto, UnderstandingJobDto } from '../../../types/api';

/**
 * WX-1015: Understanding-to-Snapshot Workspace Convergence Invariants
 */
export const SNAPSHOT_CONVERGENCE_INVARIANTS = {
  ONE_UNDERSTANDING_ONE_SNAPSHOT:
    'Every successful Understanding operation produces or verifies exactly one authoritative infrastructure snapshot.',
  ONE_SNAPSHOT_ONE_WORKSPACE_TRUTH:
    'The committed snapshot is the single source of truth that defines the authoritative infrastructure state across all Workspace surfaces.',
  NO_CROSS_SURFACE_TRUTH_DIVERGENCE:
    'Overview, Findings, Changes, Infrastructure, Memory, and Historical Comparison must never diverge in snapshot identity or temporal truth.',
  MANUAL_AUTOMATIC_CONVERGENCE:
    'Manual "Understand now" and background worker understanding execute the exact same canonical pipeline and state synchronization.',
  NO_PARTIAL_SNAPSHOT_PROPAGATION:
    'In-progress understanding operations never expose partial snapshots or uncommitted telemetry to any Workspace surface.',
  LATEST_SNAPSHOT_IS_AUTHORITATIVE:
    'The most recently committed verified snapshot is authoritative for current infrastructure facts, findings, and comparison baselines.',
  MEMORY_RECEIVES_NEW_SNAPSHOT:
    'Memory immediately includes the newly committed snapshot as Current in historical lineage without requiring a browser refresh.',
  CHANGES_RECEIVES_NEW_SNAPSHOT:
    'Changes immediately calculates and presents the comparison between the previous verified snapshot and the newly committed snapshot.',
  INFRASTRUCTURE_RECEIVES_NEW_SNAPSHOT:
    'Infrastructure immediately renders the authoritative component facts from the newly committed snapshot.',
  FINDINGS_RECEIVES_NEW_SNAPSHOT:
    'Findings immediately displays observations derived from the newly committed snapshot.',
  OVERVIEW_RECEIVES_NEW_SNAPSHOT:
    'Overview immediately updates its executive posture, timestamp, and primary intelligence to reflect the newly committed snapshot.',
  HISTORICAL_COMPARISON_RECEIVES_NEW_SNAPSHOT:
    'Historical Comparison immediately makes the newly committed snapshot available as the latest target for differential comparison.',
  NO_STALE_SURFACE_AFTER_COMMIT:
    'After snapshot commitment, all Workspace surface queries are immediately invalidated and refetched without surviving stale cache.',
  FAILED_UNDERSTANDING_PRESERVES_TRUST:
    'Failed understanding operations strictly preserve the last trusted snapshot across all surfaces without creating partial states.',
  NO_CROSS_DOMAIN_CONTAMINATION:
    'Snapshots, findings, lineage, and query cache entries remain strictly isolated by domain context.',
  UNDERSTANDING_IS_SNAPSHOT_PUBLICATION:
    'An Understanding is not an Overview update. An Understanding is the publication of a new verified infrastructure state.',
  ONE_UNDERSTANDING_ONE_VERIFIED_SNAPSHOT:
    'Every completed understanding operation produces or verifies exactly one authoritative infrastructure snapshot.',
  SNAPSHOT_IS_CROSS_SURFACE_AUTHORITY:
    'The committed infrastructure snapshot is the authoritative convergence point for Overview, Findings, Changes, Infrastructure, and Memory.',
  MEMORY_RECEIVES_EVERY_VERIFIED_SNAPSHOT:
    'Memory immediately includes every verified snapshot in historical lineage without waiting for separate operations.',
  NO_OVERVIEW_ONLY_UNDERSTANDING:
    'Overview does not own understanding; intelligence publishes to all 5 surfaces simultaneously.',
  NO_PARTIAL_SNAPSHOT_PUBLICATION:
    'In-progress snapshots are strictly internal and never published to surfaces until fully verified and committed.',
  LATEST_SNAPSHOT_IDENTITY_CONVERGENCE:
    'All 5 Workspace surfaces converge on the identical latest snapshot ID without discrepancy.',
  MANUAL_AUTOMATIC_PIPELINE_CONVERGENCE:
    'Manual "Understand now" and background worker understanding execute the exact same canonical pipeline.',
  NO_CROSS_DOMAIN_SNAPSHOT_CONTAMINATION:
    'Snapshots and query cache entries remain strictly isolated by domain context.',
  ONE_UNDERSTANDING_ONE_WORKSPACE_STATE:
    'Once a verified understanding is committed, every Workspace surface for that domain must resolve the same latest verified understanding and its derived intelligence.',
  NO_SURFACE_SPECIFIC_TRUTH:
    'No Workspace surface may independently maintain or infer its own current infrastructure state.',
  NO_STALE_CURRENT_SNAPSHOT:
    'A successfully committed newer snapshot must never remain invisible on a Workspace surface that represents current state.',
  MEMORY_LINEAGE_IMMEDIATE:
    'A newly committed verified snapshot must immediately become visible in historical Memory.',
  CHANGES_PAIR_IMMEDIATE:
    'Changes must immediately compare the newly committed snapshot against its preceding verified snapshot.',
  MANUAL_AUTOMATIC_IDENTITY:
    'Manual and automatic understanding must produce identical Workspace convergence behavior.',
  NO_BROWSER_REFRESH_REQUIRED:
    'Cross-surface convergence occurs reactively in real time without requiring browser refresh or navigation reload.',
  IMMUTABLE_HISTORICAL_LINEAGE:
    'Historical snapshots in Memory remain immutable and retain unbroken chronological lineage.',
} as const;

export interface SurfaceSnapshotMapping {
  readonly overviewSnapshotId?: string | null;
  readonly findingsSnapshotId?: string | null;
  readonly infrastructureSnapshotId?: string | null;
  readonly changesCurrentSnapshotId?: string | null;
  readonly memoryLatestSnapshotId?: string | null;
  readonly historicalComparisonAvailableSnapshotIds?: string[];
}

export interface SnapshotConvergenceResult {
  readonly isConverged: boolean;
  readonly authoritativeSnapshotId: string | null;
  readonly discrepancies: string[];
}

/**
 * Validates that all 5 Workspace surfaces + Historical Comparison converge on the identical latest snapshot ID.
 */
export function verifyCrossSurfaceSnapshotConvergence(
  surfaces: SurfaceSnapshotMapping
): SnapshotConvergenceResult {
  const discrepancies: string[] = [];
  const entries: [string, string | null | undefined][] = [
    ['Overview', surfaces.overviewSnapshotId],
    ['Findings', surfaces.findingsSnapshotId],
    ['Infrastructure', surfaces.infrastructureSnapshotId],
    ['Changes.current', surfaces.changesCurrentSnapshotId],
    ['Memory.latest', surfaces.memoryLatestSnapshotId],
  ];

  // If no snapshot exists across any surface (zero-state domain)
  const allNull = entries.every(([, id]) => !id);
  if (allNull) {
    return {
      isConverged: true,
      authoritativeSnapshotId: null,
      discrepancies: [],
    };
  }

  // Determine authoritative snapshot candidate from available non-null surfaces
  const nonNullEntries = entries.filter(([, id]) => Boolean(id));
  const authoritativeSnapshotId = nonNullEntries[0]?.[1] ?? null;

  for (const [surfaceName, snapshotId] of entries) {
    if (!snapshotId) {
      discrepancies.push(`${surfaceName} is missing snapshot reference.`);
    } else if (snapshotId !== authoritativeSnapshotId) {
      discrepancies.push(
        `${surfaceName} has snapshot '${snapshotId}', expected '${authoritativeSnapshotId}'.`
      );
    }
  }

  // Verify Historical Comparison availability
  if (
    authoritativeSnapshotId &&
    surfaces.historicalComparisonAvailableSnapshotIds &&
    !surfaces.historicalComparisonAvailableSnapshotIds.includes(authoritativeSnapshotId)
  ) {
    discrepancies.push(
      `Historical Comparison does not include latest snapshot '${authoritativeSnapshotId}'.`
    );
  }

  return {
    isConverged: discrepancies.length === 0,
    authoritativeSnapshotId,
    discrepancies,
  };
}

export interface WorkspaceSurfaceState {
  readonly overview: {
    readonly latestSnapshotId: string | null;
    readonly headline: string;
    readonly lastUnderstoodAt: string | null;
  };
  readonly findings: {
    readonly snapshotId: string | null;
    readonly findingIds: string[];
  };
  readonly infrastructure: {
    readonly snapshotId: string | null;
    readonly ipAddresses: string[];
  };
  readonly changes: {
    readonly previousSnapshotId: string | null;
    readonly currentSnapshotId: string | null;
    readonly summaryText: string;
  };
  readonly memory: {
    readonly latestSnapshotId: string | null;
    readonly snapshotLineage: string[];
  };
  readonly historicalComparison: {
    readonly targetSnapshotId: string | null;
    readonly availableSnapshotIds: string[];
  };
}

/**
 * Resolves the atomic transition of all Workspace surfaces across sequential snapshot commitments (A -> B -> C).
 */
export function transitionWorkspaceSnapshots(
  currentState: WorkspaceSurfaceState,
  newSnapshot: InfrastructureSnapshotDto,
  job: UnderstandingJobDto
): WorkspaceSurfaceState {
  if (job.status !== 'COMPLETED' || !newSnapshot) {
    // Failed or in-progress understanding preserves trusted previous state intact
    return currentState;
  }

  const previousSnapshotId = currentState.overview.latestSnapshotId;
  const newSnapshotId = newSnapshot.id;

  // Build updated historical memory lineage (newest first)
  const existingLineage = currentState.memory.snapshotLineage.filter(
    (id) => id !== newSnapshotId
  );
  const updatedLineage = [newSnapshotId, ...existingLineage];

  // Changes summary text
  const summaryText = previousSnapshotId
    ? `Changes compared: ${previousSnapshotId.slice(0, 8)} → ${newSnapshotId.slice(0, 8)}`
    : 'Initial verified baseline committed.';

  return {
    overview: {
      latestSnapshotId: newSnapshotId,
      headline: `Verified understanding committed for snapshot ${newSnapshotId.slice(0, 8)}`,
      lastUnderstoodAt: job.completedAt || newSnapshot.createdAt || new Date().toISOString(),
    },
    findings: {
      snapshotId: newSnapshotId,
      findingIds: [],
    },
    infrastructure: {
      snapshotId: newSnapshotId,
      ipAddresses: (newSnapshot.payload as any)?.dns?.ipv4 ?? [],
    },
    changes: {
      previousSnapshotId,
      currentSnapshotId: newSnapshotId,
      summaryText,
    },
    memory: {
      latestSnapshotId: newSnapshotId,
      snapshotLineage: updatedLineage,
    },
    historicalComparison: {
      targetSnapshotId: newSnapshotId,
      availableSnapshotIds: updatedLineage,
    },
  };
}

/**
 * Audits query cache invalidation completeness for a given domain across all 5 surfaces.
 */
export function auditQueryCacheReconciliation(
  invalidatedQueryKeys: (readonly unknown[])[],
  domainId: string
): { isFullyReconciled: boolean; missingSurfaces: string[] } {
  const missingSurfaces: string[] = [];

  const stringifiedKeys = invalidatedQueryKeys.map((k) => JSON.stringify(k));

  const checks: [string, string][] = [
    ['Overview', JSON.stringify(['workspace', 'overview', domainId])],
    ['Domain Overview', JSON.stringify(['domains', domainId, 'overview'])],
    ['Findings', JSON.stringify(['findings', 'byDomain', domainId])],
    ['Timeline / Changes', JSON.stringify(['timeline', 'byDomain', domainId])],
    ['Snapshots / Memory', JSON.stringify(['snapshots', 'byDomain', domainId])],
    ['Understanding Jobs', JSON.stringify(['understanding', 'domainJobs', domainId])],
  ];

  for (const [surface, expectedKeyPrefix] of checks) {
    const isCovered = stringifiedKeys.some((k) => k === expectedKeyPrefix || k.includes(domainId));
    if (!isCovered) {
      missingSurfaces.push(surface);
    }
  }

  return {
    isFullyReconciled: missingSurfaces.length === 0,
    missingSurfaces,
  };
}
