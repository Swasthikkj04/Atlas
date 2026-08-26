import type { HTMLAttributes } from 'react';
import type { InfrastructureSnapshotDto } from '../../../../types/api';

/**
 * Props for the Authoritative Snapshot History Experience (WX-504).
 */
export interface SnapshotHistoryProps extends HTMLAttributes<HTMLDivElement> {
  /** Active domain ID */
  domainId: string;
  /** Active domain hostname */
  domainName: string;
  /** Optional preselected snapshot ID from URL/navigation */
  snapshotId?: string | null;
  /** Optional preloaded snapshots for SSR / direct testing */
  initialSnapshots?: readonly InfrastructureSnapshotDto[] | null;
  /** Optional preloaded snapshot detail for SSR / direct testing */
  initialSnapshotDetail?: InfrastructureSnapshotDto | null;
  /** Return navigation callback (e.g. Back to Timeline or Back to Investigation) */
  onReturn?: () => void;
  /** Snapshot selection callback */
  onSelectSnapshot?: (snapshotId: string) => void;
  /** Navigation into Observation Evidence (WX-304) */
  onViewEvidence?: (snapshotOrEvidenceId: string) => void;
  /** Navigation into Related Change (WX-303 / WX-503) */
  onViewRelatedChange?: (changeId: string) => void;
  /** Navigation into Related Finding (WX-302) */
  onViewRelatedFinding?: (findingId: string) => void;
  /** Navigation into Historical Context (WX-505) */
  onViewHistoricalContext?: () => void;
  /** Additional CSS class names */
  className?: string;
}
