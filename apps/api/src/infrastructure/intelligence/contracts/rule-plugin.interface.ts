import { IntelligenceFinding } from './intelligence-finding.interface';
import { RuleContext } from './rule-context.interface';

export interface RuleMetadata {
  id: string;
  version: string;
  name: string;
  description: string;
  supportedObservations: string[];
}

export interface AtlasRulePlugin {
  readonly metadata: RuleMetadata;
  evaluate(context: RuleContext): IntelligenceFinding | null;
}
