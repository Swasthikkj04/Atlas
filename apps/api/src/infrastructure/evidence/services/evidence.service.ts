import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import * as zlib from 'node:zlib';
import { EvidenceCategory } from '@prisma/client';

import { SaveEvidenceDto } from '../dto/save-evidence.dto';
import { EvidenceRepository } from '../repositories/evidence.repository';

export interface IntegrityVerificationResult {
  evidenceId: string;
  verified: boolean;
  storedHash: string;
  computedHash: string;
  sizeBytes: number;
}

@Injectable()
export class EvidenceService {
  constructor(private readonly evidenceRepository: EvidenceRepository) {}

  generateOrderedEvidenceId(timestampMs = Date.now()): string {
    const hexTimestamp = timestampMs.toString(16).padStart(12, '0');
    const randomHex = crypto.randomBytes(10).toString('hex');
    return `${hexTimestamp}-${randomHex.slice(0, 4)}-7${randomHex.slice(5, 8)}-${randomHex.slice(8, 12)}-${randomHex.slice(12, 20)}`;
  }

  async saveEvidence(dto: SaveEvidenceDto) {
    const capturedAt = dto.capturedAt || new Date();
    const orderedId = this.generateOrderedEvidenceId(capturedAt.getTime());

    const rawPayloadString =
      typeof dto.payload === 'string'
        ? dto.payload
        : JSON.stringify(dto.payload);

    const originalSizeBytes = Buffer.byteLength(rawPayloadString, 'utf8');

    let storedBytes: Buffer = Buffer.from(rawPayloadString, 'utf8');
    let finalPayloadString = rawPayloadString;
    let compressionType = 'NONE';
    let compressedSizeBytes: number | undefined = undefined;

    if (dto.compress && originalSizeBytes > 1024) {
      storedBytes = zlib.gzipSync(Buffer.from(rawPayloadString, 'utf8'));
      finalPayloadString = storedBytes.toString('base64');
      compressionType = 'GZIP';
      compressedSizeBytes = storedBytes.length;
    }

    // Binary Integrity Verification: Hash exact stored bytes!
    const hashSha256 = crypto
      .createHash('sha256')
      .update(storedBytes)
      .digest('hex');

    const created = await this.evidenceRepository.create({
      id: orderedId,
      domainId: dto.domainId,
      snapshotId: dto.snapshotId,
      collectorName: dto.collectorName,
      collectorVersion: dto.collectorVersion,
      category: dto.category || EvidenceCategory.HTTP_RESPONSE,
      payloadType: dto.payloadType,
      target: dto.target,
      capturedAt,
      payload: finalPayloadString,
      sizeBytes: originalSizeBytes,
      compressedSizeBytes,
      compressionType,
      compressionVersion: '1.0',
      hashSha256,
      schemaVersion: 1,

      requestMethod: dto.requestMethod,
      responseStatus: dto.responseStatus,
      redirectIndex: dto.redirectIndex,
      sourceEndpoint: dto.sourceEndpoint,
      targetEndpoint: dto.targetEndpoint,
      protocolVersion: dto.protocolVersion,
      transportProtocol: dto.transportProtocol,
    });

    return {
      evidenceId: created.id,
      hashSha256: created.hashSha256,
      sizeBytes: created.sizeBytes,
      compressionType: created.compressionType,
    };
  }

  async getEvidenceById(id: string) {
    const record = await this.evidenceRepository.findById(id);
    if (!record) {
      return null;
    }

    return this.decodeRecord(record);
  }

  async getEvidenceBySnapshot(snapshotId: string) {
    const records = await this.evidenceRepository.findBySnapshotId(snapshotId);
    return records.map((r) => this.decodeRecord(r));
  }

  async getEvidenceByDomain(domainId: string) {
    const records = await this.evidenceRepository.findByDomainId(domainId);
    return records.map((r) => this.decodeRecord(r));
  }

  async getEvidenceByCategory(domainId: string, category: EvidenceCategory) {
    const records = await this.evidenceRepository.findByCategory(
      domainId,
      category,
    );
    return records.map((r) => this.decodeRecord(r));
  }

  async getEvidenceByCollector(domainId: string, collectorName: string) {
    const records = await this.evidenceRepository.findByCollector(
      domainId,
      collectorName,
    );
    return records.map((r) => this.decodeRecord(r));
  }

  async verifyIntegrity(
    evidenceId: string,
  ): Promise<IntegrityVerificationResult> {
    const record = await this.evidenceRepository.findById(evidenceId);
    if (!record) {
      return {
        evidenceId,
        verified: false,
        storedHash: '',
        computedHash: '',
        sizeBytes: 0,
      };
    }

    const storedBytes =
      record.compressionType === 'GZIP'
        ? Buffer.from(record.payload, 'base64')
        : Buffer.from(record.payload, 'utf8');

    const computedHash = crypto
      .createHash('sha256')
      .update(storedBytes)
      .digest('hex');

    return {
      evidenceId,
      verified: computedHash === record.hashSha256,
      storedHash: record.hashSha256,
      computedHash,
      sizeBytes: record.sizeBytes,
    };
  }

  private decodeRecord(record: any) {
    let uncompressedPayload = record.payload;

    if (record.compressionType === 'GZIP') {
      const buffer = Buffer.from(record.payload, 'base64');
      const decompressed = zlib.gunzipSync(buffer);
      uncompressedPayload = decompressed.toString('utf8');
    }

    let parsedPayload = uncompressedPayload;
    try {
      parsedPayload = JSON.parse(uncompressedPayload);
    } catch {
      // Keep string if not JSON
    }

    return {
      ...record,
      uncompressedPayload,
      parsedPayload,
    };
  }
}
