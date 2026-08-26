import { type HTMLAttributes } from 'react';
import type { InfrastructureSnapshotDto } from '../../../../types/api';

export interface SnapshotLineageSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** Active domain ID */
  domainId: string;
  /** Active domain name */
  domainName: string;
  /** Primary snapshot ID (current state) being investigated */
  snapshotId: string;
  /** Optional previous snapshot ID (for temporal comparison) */
  previousSnapshotId?: string | null;
  /** Optional change ID context that triggered this lineage inspection */
  changeId?: string | null;
  /** Optional finding ID context that originated from this snapshot */
  findingId?: string | null;
  /** Optional preloaded snapshot payload */
  initialSnapshot?: InfrastructureSnapshotDto | null;
  /** Callback fired when user navigates back */
  onReturn?: () => void;
  /** Callback fired when user navigates into WX-304 Observation Evidence Surface */
  onViewEvidence?: (findingOrEvidenceId: string) => void;
  /** Callback fired when user navigates to associated finding */
  onViewFinding?: (findingId: string) => void;
  className?: string;
}
