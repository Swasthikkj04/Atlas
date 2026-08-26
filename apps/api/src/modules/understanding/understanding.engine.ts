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
import { ChangeDetectionEngine } from './services/change-detection.engine';
import { UnderstandingRepository } from './repositories/understanding.repository';
import { ProviderAttributionService } from '../../infrastructure/attribution/services/provider-attribution.service';

@Injectable()
export class UnderstandingEngine {
  private readonly logger = new Logger(UnderstandingEngine.name);

  constructor(
    private readonly discoveryRegistry: DiscoveryRegistryService,
    private readonly snapshotService: InfrastructureSnapshotService,
    private readonly findingRuleEngine: FindingRuleEngineService,
    private readonly infrastructureFindingService: InfrastructureFindingService,
    private readonly infrastructureBriefService: InfrastructureBriefService,
    private readonly snapshotEqualityEngine: SnapshotEqualityEngine,
    private readonly changeDetectionEngine: ChangeDetectionEngine,
    private readonly verificationService: InfrastructureVerificationService,
    private readonly understandingRepository: UnderstandingRepository,
    private readonly providerAttributionService: ProviderAttributionService,
  ) {}

  async execute(
    jobId: string,
    domainId: string,
    domainName: string,
    onProgress?: () => Promise<void>,
  ): Promise<void> {
    const startedAt = new Date();

    // 1. Idempotency Check: Did this job already create a snapshot prior to a crash?
    const existingJobSnapshot = await this.snapshotService.findByJobId(jobId);
    if (existingJobSnapshot) {
      this.logger.log(
        `Job ${jobId} already persisted snapshot ${existingJobSnapshot.id} before crash. Resuming downstream intelligence generation idempotently.`,
      );

      const findingsResult =
        await this.infrastructureFindingService.getFindingsBySnapshotInternal(
          existingJobSnapshot.id,
          1,
          10,
        );
      if (findingsResult.data.length === 0 && existingJobSnapshot.payload) {
        const context: FindingContext = {
          domainId,
          snapshotId: existingJobSnapshot.id,
          snapshot: existingJobSnapshot.payload as unknown as DiscoverySnapshot,
        };
        const evaluatedFindings =
          await this.findingRuleEngine.evaluate(context);
        if (evaluatedFindings.length > 0) {
          await this.infrastructureFindingService.saveFindings(
            existingJobSnapshot.id,
            evaluatedFindings,
          );
        }
      }

      const existingBrief = await this.infrastructureBriefService
        .getBySnapshot(existingJobSnapshot.id)
        .catch(() => null);
      if (!existingBrief) {
        await this.infrastructureBriefService.generate(existingJobSnapshot.id);
      }

      return;
    }

    // 2. Perform Discovery (with progress heartbeats)
    const snapshot = await this.collectDiscovery(domainName, onProgress);

    // 2.5 Multi-Signal Authoritative Provider Attribution (WX-1022)
    snapshot.attribution =
      this.providerAttributionService.attributeInfrastructure(snapshot);

    // 3. Snapshot Equality Evaluation (Change Detection baseline)
    const latestSnapshot =
      await this.snapshotService.getLatestByDomain(domainId);

    let isSame = false;
    let previousDiscovery: DiscoverySnapshot | null = null;
    if (latestSnapshot && latestSnapshot.payload) {
      previousDiscovery =
        latestSnapshot.payload as unknown as DiscoverySnapshot;

      isSame = this.snapshotEqualityEngine.isEqual(
        previousDiscovery,
        snapshot,
      );
    }

    // 4. Persist Authoritative Verified Snapshot for this Understanding
    const savedSnapshot = await this.snapshotService.saveSnapshot(
      domainId,
      jobId,
      snapshot,
    );

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    // Link the current job to the newly created snapshot
    await this.understandingRepository.linkJobToSnapshot(
      jobId,
      savedSnapshot.id,
    );

    await this.verificationService.create({
      domainId,
      jobId,
      snapshotId: savedSnapshot.id,
      changeDetected: !isSame && latestSnapshot !== null,
      snapshotCreated: true,
      startedAt,
      completedAt,
      durationMs,
    });

    // 4.5 Detect & Persist Changes against previous snapshot
    if (latestSnapshot && previousDiscovery) {
      await this.changeDetectionEngine.detectAndPersistChanges(
        domainId,
        latestSnapshot.id,
        savedSnapshot.id,
        previousDiscovery,
        snapshot,
      );
    }

    if (onProgress) {
      await onProgress();
    }

    // 5. Evaluate and Persist Findings
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

    if (onProgress) {
      await onProgress();
    }

    // 6. Generate Intelligence Brief
    await this.infrastructureBriefService.generate(savedSnapshot.id);

    this.logger.debug(
      `Generated infrastructure brief for snapshot ${savedSnapshot.id}.`,
    );
  }

  private async collectDiscovery(
    domainName: string,
    onProgress?: () => Promise<void>,
  ): Promise<DiscoverySnapshot> {
    const snapshot: DiscoverySnapshot = {
      domainName,
      domain: domainName,
    } as any;

    for (const module of this.discoveryRegistry.getModules()) {
      snapshot[module.name] = await module.discover(domainName);
      if (onProgress) {
        await onProgress();
      }
    }

    return snapshot;
  }
}
