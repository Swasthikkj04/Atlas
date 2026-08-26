import { type HTMLAttributes } from 'react';
import type { InfrastructureFindingDto, FindingEvidenceLineageDto } from '../../../../types/api';

export interface FindingInvestigationProps extends HTMLAttributes<HTMLDivElement> {
  /** Active domain ID */
  domainId: string;
  /** Active domain name for context */
  domainName: string;
  /** Authoritative finding ID to investigate */
  findingId: string;
  /** Optional preloaded finding entity */
  initialFinding?: InfrastructureFindingDto | null;
  /** Callback fired when user navigates back to previous story/workspace context */
  onReturn?: () => void;
  /** Callback fired when navigating to associated snapshot */
  onViewSnapshot?: (snapshotId: string) => void;
  /** Callback fired when navigating to raw evidence view */
  onViewEvidence?: (lineage: FindingEvidenceLineageDto) => void;
  className?: string;
}
