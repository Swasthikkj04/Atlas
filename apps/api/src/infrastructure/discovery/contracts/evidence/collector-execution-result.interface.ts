import { CollectorMetadata } from './collector-metadata.interface';
import { Observation } from './observation.interface';
import { RawEvidenceReference } from './raw-evidence-reference.interface';

export interface CollectorExecutionResult<
  T extends Record<string, Observation<any>> = Record<string, Observation<any>>,
> {
  metadata: CollectorMetadata;
  rawEvidence: RawEvidenceReference;
  observations: T;
  rawPayload: Record<string, any>;
}
