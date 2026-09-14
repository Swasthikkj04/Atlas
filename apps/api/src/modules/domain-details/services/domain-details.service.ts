import { Injectable } from '@nestjs/common';

import { DomainsService } from '../../domains/domains.service';
import { InfrastructureBriefService } from '../../infrastructure-brief/services/infrastructure-brief.service';
import { InfrastructureFindingService } from '../../infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureSnapshotService } from '../../infrastructure-snapshots/services/infrastructure-snapshot.service';
import { InfrastructureVerificationService } from '../../understanding/services/infrastructure-verification.service';

@Injectable()
export class DomainDetailsService {
  constructor(
    private readonly domainsService: DomainsService,
    private readonly infrastructureSnapshotService: InfrastructureSnapshotService,
    private readonly infrastructureFindingService: InfrastructureFindingService,
    private readonly infrastructureBriefService: InfrastructureBriefService,
    private readonly verificationService: InfrastructureVerificationService,
  ) {}

  async getDomain(userId: string, domainId: string) {
    return this.domainsService.findById(userId, domainId);
  }

  async getLatestSnapshot(domainId: string) {
    return this.infrastructureSnapshotService.getLatestByDomain(domainId);
  }

  async countSnapshots(domainId: string) {
    return this.infrastructureSnapshotService.countByDomain(domainId);
  }

  async getFindingsSummary(domainId: string, snapshotId?: string) {
    return this.infrastructureFindingService.getSummaryByDomain(
      domainId,
      snapshotId,
    );
  }

  async getLatestBrief(domainId: string) {
    return this.infrastructureBriefService.getLatestByDomain(domainId);
  }

  async getLatestVerification(domainId: string) {
    return this.verificationService.getLatestByDomain(domainId);
  }

  async countVerifications(domainId: string) {
    return this.verificationService.countByDomain(domainId);
  }

  async generateBrief(userId: string, snapshotId: string) {
    return this.infrastructureBriefService.generateForUser(userId, snapshotId);
  }
}
