import { Observation } from './observation.interface';

export interface CollectorResult<
  T extends Record<string, Observation<any>> = Record<string, Observation<any>>,
> {
  observations: T;
  rawPayload: Record<string, any>;
}
