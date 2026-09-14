import { type HTMLAttributes } from 'react';
import type { OverviewSectionStatus } from '../../contracts/overview.contract';
import type { TechnologyArchitectureOverviewDto } from '../../../../types/api/overview.dto';

/**
 * Props for the TechnologyOverviewSection component (WX-403 / TECH-008 / T1).
 */
export interface TechnologyOverviewSectionProps extends HTMLAttributes<HTMLDivElement> {
  /** Authoritative list of detected technologies from backend DTO */
  readonly technologies: readonly string[];
  /** Full authoritative technology architecture overview */
  readonly technologyArchitecture?: TechnologyArchitectureOverviewDto | null;
  /** Categorical presence status */
  readonly status?: OverviewSectionStatus;
  /** Callback fired if an authoritative finding is linked to technology */
  readonly onViewFinding?: (findingId: string) => void;
  /** Custom CSS classes */
  readonly className?: string;
}
