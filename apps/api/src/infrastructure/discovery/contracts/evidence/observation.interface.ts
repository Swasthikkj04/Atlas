export type ObservationState = 'OBSERVED' | 'MISSING' | 'UNKNOWN' | 'FAILED';

export interface Observation<T = string> {
  state: ObservationState;
  value?: T;
  rawRef?: string;
  failureReason?: string;
  observedAt: Date;
}
