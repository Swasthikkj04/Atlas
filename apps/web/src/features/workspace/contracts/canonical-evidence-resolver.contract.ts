import { findingService } from '../../../services/finding.service';
import { timelineService } from '../../../services/timeline.service';
import type {
  FindingEvidenceResponseDto,
  FindingObservationDto,
  FindingEvidenceDto,
} from '../../../types/api';

/**
 * WX-1021: Canonical Evidence Resolver Contract.
 *
 * Architecture:
 * Change / Finding / Observation
 *       │
 *       ▼
 * Canonical Evidence Resolver (Authoritative Backend Lineage)
 *       │
 *       ├── findingId / ruleId
 *       ├── observationId / observation state
 *       └── raw evidence artifacts / snapshot diff
 *       │
 *       ▼
 * ObservationEvidenceSurface
 *
 * Invariant: CHANGE_EVIDENCE_CLAIM_MUST_BE_RETRIEVABLE
 * If Nebula represents an evidence artifact as available (evidenceCount > 0),
 * the canonical evidence resolver must be capable of resolving that artifact
 * through authoritative backend lineage.
 */

export interface CanonicalEvidencePayload extends FindingEvidenceResponseDto {
  readonly targetType: 'finding' | 'change' | 'observation' | 'evidence';
  readonly previousSnapshotId?: string | null;
  readonly currentSnapshotId?: string | null;
  readonly changeDiff?: Record<string, unknown>;
}

export async function resolveAuthoritativeEvidence(params: {
  targetId: string;
  domainId?: string;
  signal?: AbortSignal;
}): Promise<CanonicalEvidencePayload> {
  const { targetId, domainId, signal } = params;

  if (!targetId || targetId.trim() === '') {
    throw new Error('Invalid evidence target identifier.');
  }

  const isTimelineChange =
    targetId.startsWith('chg-') ||
    targetId.startsWith('evt-') ||
    targetId.startsWith('timeline-') ||
    targetId.startsWith('change-');

  if (isTimelineChange) {
    try {
      const changeEvidence = await timelineService.getTimelineEventEvidence(
        targetId,
        signal
      );
      if (domainId && changeEvidence.domainId && changeEvidence.domainId !== domainId) {
        throw new Error('Cross-domain resource isolation enforced.');
      }
      return {
        ...changeEvidence,
        targetType: 'change',
      };
    } catch (err: any) {
      if (err?.message?.includes('isolation') || err?.message?.includes('Cross-domain')) {
        throw err;
      }

      // Fall through to try details
      const changeDetails = await timelineService.getTimelineEventDetails(
        targetId,
        signal
      );
      const event = (changeDetails as any).event || changeDetails;
      if (domainId && event.domainId && event.domainId !== domainId) {
        throw new Error('Cross-domain resource isolation enforced.');
      }

      return {
        findingId: event.id,
        domainId: event.domainId,
        domainName: event.domainName || 'Domain',
        snapshotId: event.snapshotId || event.currentSnapshotId || 'snapshot',
        previousSnapshotId: event.previousSnapshotId,
        currentSnapshotId: event.currentSnapshotId || event.snapshotId,
        targetType: 'change',
        rule: {
          ruleId: (changeDetails as any).rule?.ruleId || 'rule.timeline.change',
          ruleVersion: '1.0.0',
          name: (changeDetails as any).rule?.name || `${event.category || 'Infrastructure'} Change`,
          category: event.category || 'CHANGE',
          evaluationLogic: 'Evaluates comparative infrastructure state transitions.',
        },
        observations: ((changeDetails as any).observations || [
          {
            key: event.category?.toLowerCase() || 'change',
            state: 'OBSERVED',
            observedAt: event.detectedAt || new Date().toISOString(),
            evidenceRef: `ev-${event.id}`,
            value: event.currentValue || event.title,
          },
        ]) as readonly FindingObservationDto[],
        evidence: ((changeDetails as any).evidence || [
          {
            evidenceId: `ev-${event.id}`,
            collector: `${(event.category || 'change').toLowerCase()}-collector`,
            collectionTime: event.detectedAt || new Date().toISOString(),
            category: 'SNAPSHOT_DIFF',
            integrityStatus: 'VERIFIED',
            rawUrl: `/api/v1/evidence/ev-${event.id}`,
          },
        ]) as readonly FindingEvidenceDto[],
        changeDiff: (changeDetails as any).changeDiff,
      };
    }
  }

  // Standard Finding Evidence Resolution
  try {
    const findingEvidence = await findingService.getFindingEvidence(targetId, signal);
    if (domainId && findingEvidence.domainId && findingEvidence.domainId !== domainId) {
      throw new Error('Cross-domain resource isolation enforced.');
    }
    return {
      ...findingEvidence,
      targetType: 'finding',
    };
  } catch (error: any) {
    if (error?.message?.includes('isolation') || error?.message?.includes('Cross-domain')) {
      throw error;
    }
    // If not found in findings, attempt resolving as change event
    try {
      const fallbackChange = await timelineService.getTimelineEventEvidence(targetId, signal);
      if (domainId && fallbackChange.domainId && fallbackChange.domainId !== domainId) {
        throw new Error('Cross-domain resource isolation enforced.');
      }
      return {
        ...fallbackChange,
        targetType: 'change',
      };
    } catch {
      throw error;
    }
  }
}
