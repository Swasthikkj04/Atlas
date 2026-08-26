import type { FindingEvidenceLineageDto } from '../../../../types/api';

export interface CurrentIntelligenceProps {
  /** Target domain ID */
  readonly domainId: string;
  /** Target domain name */
  readonly domainName: string;
  /** Investigation callback for finding/story */
  readonly onInvestigate: (findingId: string) => void;
  /** Evidence navigation callback */
  readonly onViewEvidence: (lineage: FindingEvidenceLineageDto) => void;
  /** Contextual navigation to Infrastructure Overview surface */
  readonly onViewOverview?: () => void;
  /** Contextual navigation to Infrastructure Memory surface */
  readonly onViewMemory?: () => void;
  /** Optional CSS classes */
  readonly className?: string;
}
