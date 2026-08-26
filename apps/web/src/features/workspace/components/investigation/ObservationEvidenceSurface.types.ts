import { type HTMLAttributes } from 'react';
import type { FindingEvidenceResponseDto } from '../../../../types/api';

export interface ObservationEvidenceSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** The active workspace domain ID */
  domainId: string;
  /** Domain name for display context */
  domainName: string;
  /** Authoritative finding ID being investigated */
  findingId: string;
  /** Optional preloaded evidence payload */
  initialEvidence?: FindingEvidenceResponseDto | null;
  /** Callback fired when user navigates back to previous investigation or workspace context */
  onReturn?: () => void;
  /** Callback fired when navigating to associated snapshot */
  onViewSnapshot?: (snapshotId: string) => void;
  className?: string;
}
