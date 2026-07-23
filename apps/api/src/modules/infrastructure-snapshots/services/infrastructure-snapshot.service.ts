import { Injectable } from '@nestjs/common';
import { InfrastructureSnapshotRepository } from '../repositories/infrastructure-snapshot.repository';
import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { SnapshotMapper } from '../mappers/snapshot.mapper';
import { Prisma } from '@prisma/client';

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

  async getSnapshotById(snapshotId: string) {
    const snapshot = await this.snapshotRepository.findById(snapshotId);

    if (!snapshot) {
      return null;
    }

    return SnapshotMapper.toDetailDto(snapshot);
  }

  async getSnapshotsByDomain(
    domainId: string,
    page: number,
    limit: number,
  ) {
    const [snapshots, total] = await Promise.all([
      this.snapshotRepository.findByDomain(domainId, page, limit),
      this.snapshotRepository.countByDomain(domainId),
    ]);

    return {
      data: snapshots.map((snapshot) =>
        SnapshotMapper.toListDto(snapshot),
      ),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}