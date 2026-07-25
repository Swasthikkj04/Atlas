import { Observation } from '../../discovery/contracts/evidence/observation.interface';

export interface ObservationLineage {
  observationId: string;
  evidenceId: string;
  normalizerName: string;
  normalizerVersion: string;
  normalizedAt: Date;
  transformationNotes?: string[];
}

export interface CanonicalObservation<T = any> {
  lineage: ObservationLineage;
  observation: Observation<T>;
}
