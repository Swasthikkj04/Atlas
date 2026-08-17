import { InfrastructureSnapshot } from '@prisma/client';

import { SnapshotDetailDto } from '../dto/snapshot-detail.dto';
import { SnapshotListDto } from '../dto/snapshot-list.dto';

export class SnapshotMapper {
  static toDetailDto(
    snapshot: InfrastructureSnapshot & { domain?: { domainName: string } },
  ): SnapshotDetailDto {
    return {
      id: snapshot.id,
      domainId: snapshot.domainId,
      domainName: snapshot.domain?.domainName,
      createdAt: snapshot.createdAt,
      responseTimeMs: snapshot.responseTimeMs,
      httpStatus: snapshot.httpStatus,
      payload: snapshot.payload,
    };
  }

  static toListDto(snapshot: InfrastructureSnapshot): SnapshotListDto {
    return {
      id: snapshot.id,
      domainId: snapshot.domainId,
      createdAt: snapshot.createdAt,
      responseTimeMs: snapshot.responseTimeMs,
      httpStatus: snapshot.httpStatus,
    };
  }
}
