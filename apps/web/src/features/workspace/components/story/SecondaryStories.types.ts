import { type HTMLAttributes } from 'react';
import type { InfrastructureFindingDto, FindingEvidenceLineageDto } from '../../../../types/api';

export interface SecondaryStoriesProps extends HTMLAttributes<HTMLDivElement> {
  /** The active domain ID */
  domainId: string;
  /** Domain name for display */
  domainName: string;
  /** Authoritative backend secondary stories array */
  stories?: readonly InfrastructureFindingDto[];
  /** Callback fired when user navigates toward finding investigation */
  onInvestigate?: (findingId: string) => void;
  /** Callback fired when user navigates toward supporting evidence */
  onViewEvidence?: (lineage: FindingEvidenceLineageDto) => void;
  className?: string;
}
