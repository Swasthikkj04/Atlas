import { type HTMLAttributes } from 'react';
import type { TimelineEventDto } from '../../../../types/api';

export interface ChangeInvestigationProps extends HTMLAttributes<HTMLDivElement> {
  /** Active domain ID */
  domainId: string;
  /** Active domain name for context */
  domainName: string;
  /** Authoritative change event ID */
  changeId: string;
  /** Optional preloaded timeline change entity */
  initialChange?: TimelineEventDto | null;
  /** Callback fired when user navigates back to previous story/workspace context */
  onReturn?: () => void;
  /** Callback fired when navigating to associated previous snapshot */
  onViewPreviousSnapshot?: (snapshotId: string) => void;
  /** Callback fired when navigating to associated current snapshot */
  onViewCurrentSnapshot?: (snapshotId: string) => void;
  /** Callback fired when navigating to related finding */
  onViewFinding?: (findingId: string) => void;
  /** Callback fired when navigating to raw evidence view */
  onViewEvidence?: (changeId: string) => void;
  /** Callback fired when navigating to historical context (WX-505) */
  onViewHistoricalContext?: () => void;
  className?: string;
}
