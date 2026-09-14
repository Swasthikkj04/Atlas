import type { HTMLAttributes } from 'react';
import type {
  AdaptiveInfrastructureModel,
  AdaptiveInfrastructureComponent,
} from '../../contracts/adaptive-infrastructure.contract';

export interface IngressTopologyVisualizerProps extends HTMLAttributes<HTMLDivElement> {
  model: AdaptiveInfrastructureModel;
  onViewFinding?: (findingId: string) => void;
  onSelectComponent?: (componentId: string) => void;
  initialSelectedHop?: number;
}

export interface IngressTopologyHopNode {
  hop: number;
  layer: string;
  technologyId: string;
  technologyName: string;
  role?: string;
  relationshipType?: string;
  component?: AdaptiveInfrastructureComponent;
  isEntrypoint?: boolean;
  isTerminal?: boolean;
}
