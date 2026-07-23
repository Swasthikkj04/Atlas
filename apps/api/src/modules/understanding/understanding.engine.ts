import { Injectable, Logger } from '@nestjs/common';

import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { DiscoveryRegistryService } from '../../infrastructure/discovery/registry/discovery-registry.service';
import { InfrastructureSnapshotService } from '../infrastructure-snapshots/services/infrastructure-snapshot.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { FindingContext } from '../findings/contracts/finding-context.interface';
// TODO: Ensure this path correctly matches your project structure
import { InfrastructureFindingService } from '../infrastructure-findings/services/infrastructure-finding.service';

@Injectable()
export class UnderstandingEngine {
  private readonly logger = new Logger(
    UnderstandingEngine.name,
  );

  constructor(
    private readonly discoveryRegistry: DiscoveryRegistryService,
    private readonly snapshotService: InfrastructureSnapshotService,
    private readonly findingRuleEngine: FindingRuleEngineService,
    private readonly infrastructureFindingService: InfrastructureFindingService,
  ) {}

  async execute(
    jobId: string,
    domainId: string,
    domainName: string,
  ): Promise<void> {
    const snapshot = await this.collectDiscovery(domainName);

    const savedSnapshot = await this.snapshotService.saveSnapshot(
      domainId,
      jobId,
      snapshot,
    );

    const context: FindingContext = {
      domainId,
      snapshotId: savedSnapshot.id,
      snapshot,
    };

    const findings = await this.findingRuleEngine.evaluate(context);

    if (findings.length > 0) {
      this.logger.debug(
        `Generated ${findings.length} finding(s) for snapshot ${savedSnapshot.id}.`,
      );
    }

    await this.infrastructureFindingService.saveFindings(
      savedSnapshot.id,
      findings,
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