import { Injectable, Logger } from '@nestjs/common';

import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { DiscoveryRegistryService } from '../../infrastructure/discovery/registry/discovery-registry.service';

import { FindingContext } from '../findings/contracts/finding-context.interface';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureBriefService } from '../infrastructure-brief/services/infrastructure-brief.service';
import { InfrastructureFindingService } from '../infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureSnapshotService } from '../infrastructure-snapshots/services/infrastructure-snapshot.service';
import { InfrastructureVerificationService } from './services/infrastructure-verification.service';
import { SnapshotEqualityEngine } from './services/snapshot-equality.engine';

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
    private readonly infrastructureBriefService: InfrastructureBriefService,
    private readonly snapshotEqualityEngine: SnapshotEqualityEngine,
    private readonly verificationService: InfrastructureVerificationService,
  ) {}

  async execute(
    jobId: string,
    domainId: string,
    domainName: string,
  ): Promise<void> {
    const startedAt = new Date();
    const snapshot = await this.collectDiscovery(
      domainName,
    );

    const latestSnapshot =
      await this.snapshotService.getLatestByDomain(
        domainId,
      );

    if (latestSnapshot && latestSnapshot.payload) {
      const previousDiscovery =
        latestSnapshot.payload as unknown as DiscoverySnapshot;

      const isSame =
        this.snapshotEqualityEngine.isEqual(
          previousDiscovery,
          snapshot,
        );

      if (isSame) {
        const completedAt = new Date();
        const durationMs =
          completedAt.getTime() - startedAt.getTime();

        await this.verificationService.create({
          domainId,
          jobId,
          snapshotId: latestSnapshot.id,
          changeDetected: false,
          snapshotCreated: false,
          startedAt,
          completedAt,
          durationMs,
        });

        this.logger.log(
          `No infrastructure changes detected for domain ${domainName}. Skipping snapshot creation.`,
        );

        return;
      }
    }

    const savedSnapshot =
      await this.snapshotService.saveSnapshot(
        domainId,
        jobId,
        snapshot,
      );

    const completedAt = new Date();
    const durationMs =
      completedAt.getTime() - startedAt.getTime();

    await this.verificationService.create({
      domainId,
      jobId,
      snapshotId: savedSnapshot.id,
      changeDetected: latestSnapshot !== null,
      snapshotCreated: true,
      startedAt,
      completedAt,
      durationMs,
    });

    const context: FindingContext = {
      domainId,
      snapshotId: savedSnapshot.id,
      snapshot,
    };

    const findings =
      await this.findingRuleEngine.evaluate(
        context,
      );

    if (findings.length > 0) {
      this.logger.debug(
        `Generated ${findings.length} finding(s) for snapshot ${savedSnapshot.id}.`,
      );
    }

    await this.infrastructureFindingService.saveFindings(
      savedSnapshot.id,
      findings,
    );

    await this.infrastructureBriefService.generate(
      savedSnapshot.id,
    );

    this.logger.debug(
      `Generated infrastructure brief for snapshot ${savedSnapshot.id}.`,
    );
  }

  private async collectDiscovery(
    domainName: string,
  ): Promise<DiscoverySnapshot> {
    const snapshot: DiscoverySnapshot = {};

    for (const module of this.discoveryRegistry.getModules()) {
      snapshot[module.name] =
        await module.discover(domainName);
    }

    return snapshot;
  }
}