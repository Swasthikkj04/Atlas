import { type HTMLAttributes } from 'react';
import type { OverviewSectionStatus } from '../../contracts/overview.contract';

/**
 * Props for the TechnologyOverviewSection component (WX-403).
 */
export interface TechnologyOverviewSectionProps extends HTMLAttributes<HTMLDivElement> {
  /** Authoritative list of detected technologies from backend DTO */
  readonly technologies: readonly string[];
  /** Categorical presence status */
  readonly status?: OverviewSectionStatus;
  /** Callback fired if an authoritative finding is linked to technology */
  readonly onViewFinding?: (findingId: string) => void;
  /** Custom CSS classes */
  readonly className?: string;
}
