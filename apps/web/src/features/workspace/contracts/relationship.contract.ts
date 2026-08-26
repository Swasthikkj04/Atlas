import type { InfrastructureFindingDto } from '../../../types/api/finding.dto';
import type { TimelineEventDto } from '../../../types/api/timeline.dto';
import type { InfrastructureSnapshotDto } from '../../../types/api/snapshot.dto';
import type {
  WorkspaceResourceType,
  WorkspaceNavigationTarget,
} from './cross-experience-navigation.contract';

/**
 * Authoritative Workspace Relationship Types (WX-605).
 * Backed strictly by authoritative backend identifiers.
 */
export type WorkspaceRelationshipType =
  | 'RELATED_FINDING'
  | 'RELATED_CHANGE'
  | 'PREVIOUS_SNAPSHOT'
  | 'CURRENT_SNAPSHOT'
  | 'RELATED_SNAPSHOT'
  | 'SUPPORTING_EVIDENCE'
  | 'HISTORICAL_CONTEXT';

export interface WorkspaceRelationship {
  readonly resourceType: WorkspaceResourceType;
  readonly resourceId: string;
  readonly domainId: string;
  readonly relationshipType: WorkspaceRelationshipType;
  readonly label: string;
  readonly context?: string;
}

/**
 * Resolves authoritative relationships for an Infrastructure Finding.
 */
export function resolveFindingRelationships(
  finding: InfrastructureFindingDto,
  domainId: string
): readonly WorkspaceRelationship[] {
  const relationships: WorkspaceRelationship[] = [];

  // 1. Authoritative Snapshot Relationship
  if (finding.snapshotId) {
    relationships.push({
      resourceType: 'snapshot',
      resourceId: finding.snapshotId,
      domainId,
      relationshipType: 'RELATED_SNAPSHOT',
      label: 'Observed Snapshot',
      context: 'Historical infrastructure state where this finding was detected',
    });
  }

  // 2. Supporting Observation Evidence
  if (finding.lineage?.observationKey || finding.id) {
    const evidenceKey = finding.lineage?.observationKey || finding.id;
    relationships.push({
      resourceType: 'evidence',
      resourceId: evidenceKey,
      domainId,
      relationshipType: 'SUPPORTING_EVIDENCE',
      label: 'Observation Evidence',
      context: 'Raw facts and protocol telemetry backing this insight',
    });
  }

  return relationships;
}

/**
 * Resolves authoritative relationships for a Timeline Change Event.
 */
export function resolveChangeRelationships(
  change: TimelineEventDto,
  domainId: string
): readonly WorkspaceRelationship[] {
  const relationships: WorkspaceRelationship[] = [];

  // 1. Previous Snapshot (Before state)
  if (change.previousSnapshotId) {
    relationships.push({
      resourceType: 'snapshot',
      resourceId: change.previousSnapshotId,
      domainId,
      relationshipType: 'PREVIOUS_SNAPSHOT',
      label: 'Previous Snapshot',
      context: 'Baseline infrastructure state before this change',
    });
  }

  // 2. Current Snapshot (After state)
  const currentSnapId = change.currentSnapshotId || change.snapshotId;
  if (currentSnapId) {
    relationships.push({
      resourceType: 'snapshot',
      resourceId: currentSnapId,
      domainId,
      relationshipType: 'CURRENT_SNAPSHOT',
      label: 'Current Snapshot',
      context: 'Resulting infrastructure state observed after transition',
    });
  }

  // 3. Related Finding
  if (change.findingId) {
    relationships.push({
      resourceType: 'finding',
      resourceId: change.findingId,
      domainId,
      relationshipType: 'RELATED_FINDING',
      label: 'Associated Finding',
      context: 'Security or infrastructure insight linked to this transition',
    });
  }

  // 4. Supporting Evidence
  relationships.push({
    resourceType: 'evidence',
    resourceId: change.id,
    domainId,
    relationshipType: 'SUPPORTING_EVIDENCE',
    label: 'Supporting Evidence',
    context: 'Telemetry and factual observation record for this change event',
  });

  // 5. Historical Context
  relationships.push({
    resourceType: 'historical_context',
    resourceId: domainId,
    domainId,
    relationshipType: 'HISTORICAL_CONTEXT',
    label: 'Temporal Lineage',
    context: 'Domain infrastructure evolution and temporal cadence',
  });

  return relationships;
}

/**
 * Resolves authoritative relationships for an Infrastructure Snapshot.
 */
export function resolveSnapshotRelationships(
  snapshot: InfrastructureSnapshotDto,
  domainId: string
): readonly WorkspaceRelationship[] {
  const relationships: WorkspaceRelationship[] = [];

  // 1. Previous Snapshot Lineage
  if (snapshot.previousSnapshotId) {
    relationships.push({
      resourceType: 'snapshot',
      resourceId: snapshot.previousSnapshotId,
      domainId,
      relationshipType: 'PREVIOUS_SNAPSHOT',
      label: 'Preceding Snapshot',
      context: 'Immediate predecessor in this infrastructure snapshot history',
    });
  }

  // 2. Historical Context
  relationships.push({
    resourceType: 'historical_context',
    resourceId: domainId,
    domainId,
    relationshipType: 'HISTORICAL_CONTEXT',
    label: 'Historical Context',
    context: 'Position of this snapshot in overall infrastructure evolution',
  });

  // 3. Observation Evidence
  if (snapshot.id) {
    relationships.push({
      resourceType: 'evidence',
      resourceId: snapshot.id,
      domainId,
      relationshipType: 'SUPPORTING_EVIDENCE',
      label: 'Observation Evidence',
      context: 'Authoritative telemetry captured in this snapshot',
    });
  }

  return relationships;
}

/**
 * Maps a WorkspaceRelationship into a canonical WX-601 Navigation Target.
 */
export function buildRelationshipNavigationTarget(
  relationship: WorkspaceRelationship,
  returnPath: string = '/workspace'
): WorkspaceNavigationTarget {
  return {
    domainId: relationship.domainId,
    resourceType: relationship.resourceType,
    resourceId: relationship.resourceId,
    returnPath,
  };
}
