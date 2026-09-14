import type { MeaningfulChangeStory } from '../../contracts/changes.contract';
import type { HistoricalComparisonResult } from '../../contracts/snapshot-comparison.contract';

export type DriftNodeType = 'ADDED' | 'REMOVED' | 'MODIFIED' | 'STABLE';

export interface TopologyDriftNode {
  id: string;
  name: string;
  layer: string;
  driftType: DriftNodeType;
  role?: string;
  baseValue?: string;
  targetValue?: string;
  description?: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  evidenceBefore?: readonly string[];
  evidenceAfter?: readonly string[];
  changeStory?: MeaningfulChangeStory;
  isTerminal?: boolean;
}

export type { HistoricalComparisonResult };

export interface InfrastructureDriftForensicsVisualizerProps {
  comparisonResult: HistoricalComparisonResult;
  onInvestigateChange?: (changeId: string) => void;
  onViewEvidence?: (changeId: string) => void;
  className?: string;
}
