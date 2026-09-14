import type { AdaptiveInfrastructureModel } from '../../contracts/adaptive-infrastructure.contract';

export interface AdaptiveInfrastructureGridProps {
  model: AdaptiveInfrastructureModel;
  onViewFinding?: (findingId: string) => void;
  showTopology?: boolean;
  showSummary?: boolean;
  className?: string;
}
