import type { HTMLAttributes } from 'react';

export interface InfrastructureFindingsSectionProps extends HTMLAttributes<HTMLDivElement> {
  readonly domainId: string;
  readonly domainName: string;
  readonly onViewFinding?: (findingId: string) => void;
  readonly onViewAllFindings?: () => void;
}
