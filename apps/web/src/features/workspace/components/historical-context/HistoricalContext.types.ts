import type { HTMLAttributes } from 'react';
import type {
  InfrastructureSnapshotDto,
  TimelineEventDto,
} from '../../../../types/api';

/**
 * Props for the Authoritative Historical Context Experience (WX-505).
 */
export interface HistoricalContextProps extends HTMLAttributes<HTMLDivElement> {
  /** Active domain ID */
  domainId: string;
  /** Active domain hostname */
  domainName: string;
  /** Optional preloaded snapshots for SSR / direct testing */
  initialSnapshots?: readonly InfrastructureSnapshotDto[] | null;
  /** Optional preloaded timeline events for SSR / direct testing */
  initialEvents?: readonly TimelineEventDto[] | null;
  /** Return navigation callback */
  onReturn?: () => void;
  /** Navigation into Snapshot History (WX-504) */
  onViewSnapshot?: (snapshotId: string) => void;
  /** Navigation into Change Investigation (WX-303) */
  onInvestigateChange?: (changeId: string) => void;
  /** Navigation into Observation Evidence (WX-304) */
  onViewEvidence?: (evidenceId: string) => void;
  /** Additional CSS class names */
  className?: string;
}
