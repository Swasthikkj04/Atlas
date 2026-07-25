import { CollectorExecutionResult } from './evidence/collector-execution-result.interface';
import { Observation } from './evidence/observation.interface';

export interface EvidenceCollector<
  T extends Record<string, Observation<any>> = Record<string, Observation<any>>,
> {
  readonly name: string;
  readonly version: string;

  collectEvidence(target: string): Promise<CollectorExecutionResult<T>>;
}
