import type {
  InfrastructureSnapshotDto,
  TimelineEventDto,
  DomainDto,
} from '../../../../types/api';
import type { MeaningfulChangeStory } from '../../contracts/changes.contract';

export interface ChangesTimelineProps {
  readonly domainId: string;
  readonly domainName: string;
  readonly domains?: readonly DomainDto[];
  readonly onSelectDomain?: (domainId: string) => void;
  readonly onInvestigateChange?: (changeId: string, domainId?: string) => void;
  readonly onViewSnapshot?: (snapshotId: string) => void;
  readonly onViewEvidence?: (evidenceId: string) => void;
  readonly onViewInfrastructure?: () => void;
  readonly onCompareSnapshots?: (baseSnapshotId: string, targetSnapshotId: string) => void;
  readonly initialEvents?: readonly TimelineEventDto[];
  readonly initialSnapshots?: readonly InfrastructureSnapshotDto[];
  readonly className?: string;
}

export interface ChangeStoryCardProps {
  readonly change: MeaningfulChangeStory;
  readonly onInvestigate?: (changeId: string) => void;
  readonly onViewEvidence?: (evidenceId: string) => void;
  readonly onViewSnapshot?: (snapshotId: string) => void;
  readonly onViewPreviousSnapshot?: (snapshotId: string) => void;
  readonly className?: string;
}
