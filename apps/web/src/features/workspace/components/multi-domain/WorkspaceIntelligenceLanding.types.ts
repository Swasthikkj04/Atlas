import type { DomainDto } from '../../../../types/api';
import type { MultiDomainBriefResult } from '../../contracts/multi-domain-brief.contract';

export interface WorkspaceIntelligenceLandingProps {
  readonly onSelectDomain: (domainId: string) => void;
  readonly onAddDomain?: () => void;
  readonly onInvestigateChange?: (domainId: string, changeId: string) => void;
  readonly onViewDomainChanges?: (domainId: string) => void;
  readonly onViewInfrastructureMemory?: (domainId?: string) => void;
  readonly initialBrief?: MultiDomainBriefResult;
  readonly domains?: readonly DomainDto[];
  readonly className?: string;
}

export interface MultiDomainHeroProps {
  readonly brief: MultiDomainBriefResult;
  readonly onReviewChanges?: () => void;
  readonly onAddDomain?: () => void;
  readonly className?: string;
}

export interface MonitoredInfrastructureListProps {
  readonly brief: MultiDomainBriefResult;
  readonly onSelectDomain: (domainId: string) => void;
  readonly onAddDomain?: () => void;
  readonly className?: string;
}

export interface CrossDomainWhatChangedProps {
  readonly brief: MultiDomainBriefResult;
  readonly onInvestigateChange?: (domainId: string, changeId: string) => void;
  readonly onViewDomainChanges?: (domainId: string) => void;
  readonly className?: string;
}
