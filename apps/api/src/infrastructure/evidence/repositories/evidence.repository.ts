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
}
