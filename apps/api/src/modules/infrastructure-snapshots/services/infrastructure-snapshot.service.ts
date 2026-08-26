import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';

import { SnapshotMapper } from '../mappers/snapshot.mapper';
import { InfrastructureSnapshotRepository } from '../repositories/infrastructure-snapshot.repository';

@Injectable()
export class InfrastructureSnapshotService {
  constructor(
    private readonly snapshotRepository: InfrastructureSnapshotRepository,
  ) {}

  async saveSnapshot(
    domainId: string,
    jobId: string,
    snapshot: DiscoverySnapshot,
  ) {
    return this.snapshotRepository.create({
      domain: {
        connect: {
          id: domainId,
        },
      },
      job: {
        connect: {
          id: jobId,
        },
      },
      responseTimeMs: snapshot.http?.responseTimeMs ?? 0,
      httpStatus: snapshot.http?.statusCode ?? 0,
      payload: snapshot as unknown as Prisma.InputJsonValue,
    });
  }

  async findByJobId(jobId: string) {
    return this.snapshotRepository.findByJobId(jobId);
  }

  async getSnapshotById(userId: string, snapshotId: string) {
    const snapshot = await this.snapshotRepository.findByIdForUser(
      snapshotId,
      userId,
    );

    if (!snapshot) {
      throw new NotFoundException(
        `Snapshot with ID '${snapshotId}' not found.`,
      );
    }

    return SnapshotMapper.toDetailDto(snapshot);
  }

  async getSnapshotByIdInternal(snapshotId: string) {
    const snapshot = await this.snapshotRepository.findById(snapshotId);

    if (!snapshot) {
      return null;
    }

    return SnapshotMapper.toDetailDto(snapshot);
  }

  async getSnapshotsByDomain(
    userId: string,
    domainId: string,
    page: number,
    limit: number,
  ) {
    const [snapshots, total] = await Promise.all([
      this.snapshotRepository.findByDomainForUser(
        domainId,
        userId,
        page,
        limit,
      ),
      this.snapshotRepository.countByDomainForUser(domainId, userId),
    ]);

    return {
      data: snapshots.map((snapshot) => SnapshotMapper.toListDto(snapshot)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getLatestByDomain(domainId: string) {
    return this.snapshotRepository.findLatestByDomain(domainId);
  }

  async countByDomain(domainId: string): Promise<number> {
    return this.snapshotRepository.countByDomain(domainId);
  }

  async countByUser(userId: string): Promise<number> {
    return this.snapshotRepository.countByUser(userId);
  }

  async findLatestScanByUser(userId: string): Promise<Date | null> {
    return this.snapshotRepository.findLatestScanByUser(userId);
  }
}
