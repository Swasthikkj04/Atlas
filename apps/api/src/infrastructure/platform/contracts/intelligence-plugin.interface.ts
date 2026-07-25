import { FindingResult } from '../../../modules/findings/contracts/finding-result.interface';
import { PluginManifest, PluginLifecycleState } from './plugin-manifest.interface';

export interface IntelligenceRuleEvaluationResult {
  ruleId: string;
  matched: boolean;
  finding?: FindingResult;
  evidenceReferences: string[];
}

export interface AtlasIntelligencePlugin {
  readonly manifest: PluginManifest;
  state: PluginLifecycleState;

  initialize(): Promise<void>;
  evaluate(canonicalObservations: Record<string, any>): IntelligenceRuleEvaluationResult[];
  shutdown(): Promise<void>;
}
