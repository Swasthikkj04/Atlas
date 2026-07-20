import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';

export interface FindingContext {
  snapshot: DiscoverySnapshot;
}