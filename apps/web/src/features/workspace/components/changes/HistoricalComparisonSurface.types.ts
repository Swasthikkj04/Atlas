export interface HistoricalComparisonSurfaceProps {
  readonly domainId: string;
  readonly domainName: string;
  readonly baseSnapshotId?: string | null;
  readonly targetSnapshotId?: string | null;
  readonly onReturn?: () => void;
  readonly onInvestigateChange?: (changeId: string) => void;
  readonly onViewEvidence?: (evidenceId: string) => void;
  readonly onSelectSnapshots?: (baseSnapshotId: string, targetSnapshotId: string) => void;
  readonly className?: string;
}
