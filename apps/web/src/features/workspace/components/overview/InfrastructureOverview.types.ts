import { type HTMLAttributes } from 'react';
import type { DomainOverviewResponseDto } from '../../../../types/api';

/**
 * Props for the InfrastructureOverview Component (WX-402).
 */
export interface InfrastructureOverviewProps extends HTMLAttributes<HTMLDivElement> {
  /** Active domain ID */
  readonly domainId: string;
  /** Active domain name */
  readonly domainName: string;
  /** Optional preloaded domain overview data */
  readonly initialData?: DomainOverviewResponseDto | null;
  /** Callback fired when user navigates into authoritative snapshot lineage */
  readonly onViewSnapshot?: (snapshotId: string) => void;
  /** Callback fired when user navigates into finding investigation */
  readonly onViewFinding?: (findingId: string) => void;
  /** Callback fired when user navigates to view all findings */
  readonly onViewAllFindings?: () => void;
  /** Callback fired when user navigates to changes surface */
  readonly onNavigateToChanges?: () => void;
  /** Callback fired when user navigates to findings surface */
  readonly onNavigateToFindings?: () => void;
  /** Callback fired when user navigates into evidence surface */
  readonly onViewEvidence?: (evidenceId: string) => void;
  /** Custom CSS classes */
  readonly className?: string;
}


