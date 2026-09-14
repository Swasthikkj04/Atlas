import { Injectable } from '@nestjs/common';
import { EvidenceCategory } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

export interface CreateEvidenceParams {
  id?: string;
  domainId: string;
  snapshotId?: string;
  collectorName: string;
  collectorVersion: string;
  category?: EvidenceCategory;
  payloadType: string;
  target: string;
  capturedAt?: Date;
  payload: string;
  sizeBytes: number;
  compressedSizeBytes?: number;
  compressionType?: string;
  compressionVersion?: string;
  hashSha256: string;
  schemaVersion?: number;

  requestMethod?: string;
  responseStatus?: number;
  redirectIndex?: number;
  sourceEndpoint?: string;
  targetEndpoint?: string;
  protocolVersion?: string;
  transportProtocol?: string;
}

@Injectable()
export class EvidenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateEvidenceParams) {
    return this.prisma.rawEvidence.create({
      data: {
        id: data.id,
        domainId: data.domainId,
        snapshotId: data.snapshotId,
        collectorName: data.collectorName,
        collectorVersion: data.collectorVersion,
        category: data.category || EvidenceCategory.HTTP_RESPONSE,
        payloadType: data.payloadType,
        target: data.target,
        capturedAt: data.capturedAt || new Date(),
        payload: data.payload,
        sizeBytes: data.sizeBytes,
        compressedSizeBytes: data.compressedSizeBytes,
        compressionType: data.compressionType || 'NONE',
        compressionVersion: data.compressionVersion || '1.0',
        hashSha256: data.hashSha256,
        schemaVersion: data.schemaVersion || 1,

        requestMethod: data.requestMethod,
        responseStatus: data.responseStatus,
        redirectIndex: data.redirectIndex,
        sourceEndpoint: data.sourceEndpoint,
        targetEndpoint: data.targetEndpoint,
        protocolVersion: data.protocolVersion,
        transportProtocol: data.transportProtocol,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.rawEvidence.findUnique({
      where: { id },
    });
  }

  async findBySnapshotId(snapshotId: string) {
    return this.prisma.rawEvidence.findMany({
      where: { snapshotId },
      orderBy: { capturedAt: 'desc' },
    });
  }

  async findByDomainId(domainId: string) {
    return this.prisma.rawEvidence.findMany({
      where: { domainId },
      orderBy: { capturedAt: 'desc' },
    });
  }

  async findByCategory(domainId: string, category: EvidenceCategory) {
    return this.prisma.rawEvidence.findMany({
      where: { domainId, category },
      orderBy: { capturedAt: 'desc' },
    });
  }

  async findByCollector(domainId: string, collectorName: string) {
    return this.prisma.rawEvidence.findMany({
      where: { domainId, collectorName },
      orderBy: { capturedAt: 'desc' },
    });
  }

  async findByTimeRange(domainId: string, startDate: Date, endDate: Date) {
    return this.prisma.rawEvidence.findMany({
      where: {
        domainId,
        capturedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { capturedAt: 'desc' },
    });
  }

  async getEvidenceStorageStats(domainId?: string) {
    const where = domainId ? { domainId } : {};
    const count = await this.prisma.rawEvidence.count({ where });
    const aggregate = await this.prisma.rawEvidence.aggregate({
      where,
      _sum: {
        sizeBytes: true,
        compressedSizeBytes: true,
      },
      _min: {
        capturedAt: true,
      },
      _max: {
        capturedAt: true,
      },
    });

    return {
      totalCount: count,
      totalSizeBytes: aggregate._sum.sizeBytes || 0,
      compressedSizeBytes: aggregate._sum.compressedSizeBytes || 0,
      oldestDate: aggregate._min.capturedAt,
      newestDate: aggregate._max.capturedAt,
    };
  }

  async countExpiredEvidence(cutoffDate: Date, domainId?: string) {
    const where: any = {
      capturedAt: {
        lt: cutoffDate,
      },
    };
    if (domainId) {
      where.domainId = domainId;
    }
    return this.prisma.rawEvidence.count({ where });
  }

  async findExpiredEvidence(cutoffDate: Date, domainId?: string, limit = 1000) {
    const where: any = {
      capturedAt: {
        lt: cutoffDate,
      },
    };
    if (domainId) {
      where.domainId = domainId;
    }
    return this.prisma.rawEvidence.findMany({
      where,
      orderBy: { capturedAt: 'asc' },
      take: limit,
    });
  }

  async deleteEvidenceBatch(ids: string[]) {
    if (!ids || ids.length === 0) return 0;
    const result = await this.prisma.rawEvidence.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    return result.count;
  }
}
