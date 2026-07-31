import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';

export interface FindingContext {
  domainId: string;
  snapshotId: string;
  snapshot: DiscoverySnapshot;
}
