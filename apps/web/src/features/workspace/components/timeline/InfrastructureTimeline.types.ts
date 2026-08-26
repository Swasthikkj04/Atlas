import type { TimelineEventDto, InfrastructureSnapshotDto } from '../../../../types/api';

export interface InfrastructureTimelineProps {
  /** Target infrastructure domain ID */
  readonly domainId: string;
  /** Target domain hostname (e.g. stripe.com) */
  readonly domainName: string;
  /** Navigation callback to investigate a specific timeline change event */
  readonly onInvestigateChange: (changeId: string) => void;
  /** Navigation callback to view snapshot lineage */
  readonly onViewSnapshot: (snapshotId: string) => void;
  /** Optional navigation callback to view raw evidence */
  readonly onViewEvidence?: (evidenceId: string) => void;
  /** Optional navigation callback to view historical context (WX-505) */
  readonly onViewHistoricalContext?: () => void;
  /** Optional initial timeline events (e.g. for testing) */
  readonly initialEvents?: readonly TimelineEventDto[];
  /** Optional initial snapshots (e.g. for testing) */
  readonly initialSnapshots?: readonly InfrastructureSnapshotDto[];
  /** Optional CSS classes */
  readonly className?: string;
}

export interface TimelineEventCardProps {
  readonly event: TimelineEventDto;
  readonly onInvestigate: (changeId: string) => void;
  readonly onViewSnapshot: (snapshotId: string) => void;
  readonly isFirst?: boolean;
  readonly isLast?: boolean;
}
