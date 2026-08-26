import type { HTMLAttributes } from 'react';
import type { CompactInfrastructureCategory } from '../../contracts/compact-infrastructure.contract';

export interface CompactInfrastructureOverviewProps extends HTMLAttributes<HTMLDivElement> {
  readonly domainId: string;
  readonly domainName: string;
  readonly onViewFullInfrastructure?: () => void;
  readonly onSelectCategory?: (category: CompactInfrastructureCategory) => void;
}
