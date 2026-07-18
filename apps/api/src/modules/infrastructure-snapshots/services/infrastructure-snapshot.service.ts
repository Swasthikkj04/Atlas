import { Injectable } from '@nestjs/common';
import { InfrastructureSnapshotRepository } from '../repositories/infrastructure-snapshot.repository';
import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
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
}