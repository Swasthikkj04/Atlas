import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { InfrastructureSnapshotService } from '../../infrastructure-snapshots/services/infrastructure-snapshot.service';
import { InfrastructureFindingService } from '../../infrastructure-findings/services/infrastructure-finding.service';

import { InfrastructureBriefBuilder } from '../builders/infrastructure-brief.builder';
import { InfrastructureBriefRepository } from '../repositories/infrastructure-brief.repository';

@Injectable()
export class InfrastructureBriefService {
  private readonly logger = new Logger(InfrastructureBriefService.name);

  constructor(
    private readonly repository: InfrastructureBriefRepository,
    private readonly snapshotService: InfrastructureSnapshotService,
    private readonly findingService: InfrastructureFindingService,
    private readonly briefBuilder: InfrastructureBriefBuilder,
  ) {}

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value));
  }

  async getBySnapshot(snapshotId: string) {
    const brief = await this.repository.findBySnapshot(snapshotId);

    if (!brief) {
      throw new NotFoundException('Infrastructure brief not found.');
    }

    this.logger.debug(
      `Retrieved infrastructure brief for snapshot ${snapshotId}`,
    );

    return brief;
  }

  async getBySnapshotForUser(userId: string, snapshotId: string) {
    const brief = await this.repository.findBySnapshotForUser(
      snapshotId,
      userId,
    );

    if (!brief) {
      throw new NotFoundException(
        `Infrastructure brief for snapshot '${snapshotId}' not found.`,
      );
    }

    return brief;
  }

  async getLatestByDomain(domainId: string) {
    return this.repository.findLatestByDomain(domainId);
  }

  async getLatestByDomainForUser(userId: string, domainId: string) {
    const brief = await this.repository.findLatestByDomainForUser(
      domainId,
      userId,
    );

    if (!brief) {
      throw new NotFoundException(
        `Infrastructure brief for domain '${domainId}' not found.`,
      );
    }

    return brief;
  }

  async create(
    snapshotId: string,
    overallHealth: string,
    summary: string,
    highlights: Prisma.InputJsonValue,
    recommendations: Prisma.InputJsonValue,
  ) {
    return this.repository.create({
      snapshot: {
        connect: {
          id: snapshotId,
        },
      },
      overallHealth,
      summary,
      highlights,
      recommendations,
    });
  }

  async generate(snapshotId: string) {
    const snapshot =
      await this.snapshotService.getSnapshotByIdInternal(snapshotId);

    if (!snapshot) {
      throw new NotFoundException('Snapshot not found.');
    }

    const findingsResponse =
      await this.findingService.getFindingsBySnapshotInternal(
        snapshotId,
        1,
        1000,
      );

    const brief = this.briefBuilder.build(snapshot, findingsResponse.data);

    const existing = await this.repository.findBySnapshot(snapshotId);
    if (existing) {
      return this.repository.update(existing.id, {
        overallHealth: brief.overallHealth,
        summary: brief.summary,
        highlights: this.toJson(brief.highlights),
        recommendations: this.toJson(brief.recommendations),
      });
    }

    return this.create(
      snapshotId,
      brief.overallHealth,
      brief.summary,
      this.toJson(brief.highlights),
      this.toJson(brief.recommendations),
    );
  }

  async generateForUser(userId: string, snapshotId: string) {
    // 1. Authorize: verify snapshot belongs to user before doing any generation work
    const snapshot = await this.snapshotService.getSnapshotById(
      userId,
      snapshotId,
    );

    if (!snapshot) {
      throw new NotFoundException(`Snapshot '${snapshotId}' not found.`);
    }

    // 2. Query user-scoped findings
    const findingsResponse = await this.findingService.getFindingsBySnapshot(
      userId,
      snapshotId,
      1,
      1000,
    );

    const brief = this.briefBuilder.build(snapshot, findingsResponse.data);

    const existing = await this.repository.findBySnapshotForUser(
      snapshotId,
      userId,
    );

    if (existing) {
      return this.repository.update(existing.id, {
        overallHealth: brief.overallHealth,
        summary: brief.summary,
        highlights: this.toJson(brief.highlights),
        recommendations: this.toJson(brief.recommendations),
      });
    }

    return this.create(
      snapshotId,
      brief.overallHealth,
      brief.summary,
      this.toJson(brief.highlights),
      this.toJson(brief.recommendations),
    );
  }
}
