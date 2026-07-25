import { CanonicalObservation } from '../../normalization/contracts/canonical-observation.interface';

export interface RuleContext {
  domainId: string;
  snapshotId?: string;
  observations: Record<string, CanonicalObservation<any>>;
  config?: Record<string, any>;
}
