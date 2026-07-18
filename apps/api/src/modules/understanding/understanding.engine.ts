import { Injectable } from '@nestjs/common';

import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { DiscoveryRegistryService } from '../../infrastructure/discovery/registry/discovery-registry.service';
import { InfrastructureSnapshotService } from '../infrastructure-snapshots/services/infrastructure-snapshot.service';

@Injectable()
export class UnderstandingEngine {
  constructor(
    private readonly discoveryRegistry: DiscoveryRegistryService,
    private readonly snapshotService: InfrastructureSnapshotService,
  ) {}

  async execute(
    jobId: string,
    domainId: string,
    domainName: string,
  ): Promise<void> {
    const snapshot = await this.collectDiscovery(domainName);

    await this.snapshotService.saveSnapshot(
      domainId,
      jobId,
      snapshot,
    );
  }

  private async collectDiscovery(
    domainName: string,
  ): Promise<DiscoverySnapshot> {
    const snapshot: DiscoverySnapshot = {};

    for (const module of this.discoveryRegistry.getModules()) {
      snapshot[module.name] = await module.discover(domainName);
    }

    return snapshot;
  }
}