import { EvidenceCategory } from '@prisma/client';
import * as crypto from 'node:crypto';
import * as zlib from 'node:zlib';

import { EvidenceRepository } from '../repositories/evidence.repository';
import { EvidenceService } from './evidence.service';

describe('EvidenceService (Hardened & Binary Integrity)', () => {
  let service: EvidenceService;
  let repository: jest.Mocked<EvidenceRepository>;

  const mockPayload = JSON.stringify({ status: 200, server: 'nginx' });
  const rawBytes = Buffer.from(mockPayload, 'utf8');
  const binaryHash = crypto.createHash('sha256').update(rawBytes).digest('hex');

  const mockRecord = {
    id: '018f2a4b-8e12-7000-8000-0123456789ab',
    domainId: 'domain-1',
    collectorName: 'http',
    collectorVersion: '1.0.0',
    category: EvidenceCategory.HTTP_RESPONSE,
    payloadType: 'http-headers',
    target: 'example.com',
    capturedAt: new Date('2026-07-24T18:00:00Z'),
    payload: mockPayload,
    sizeBytes: rawBytes.length,
    compressedSizeBytes: null,
    compressionType: 'NONE',
    compressionVersion: '1.0',
    hashSha256: binaryHash,
    schemaVersion: 1,
    requestMethod: 'GET',
    responseStatus: 200,
    redirectIndex: 0,
    sourceEndpoint: 'https://example.com',
    targetEndpoint: 'https://example.com',
    protocolVersion: 'HTTP/1.1',
    transportProtocol: 'TCP',
  };

  beforeEach(() => {
    repository = {
      create: jest.fn().mockImplementation(async (data: any) => ({
        ...data,
        id: data.id || '018f2a4b-8e12-7000-8000-0123456789ab',
      })),
      findById: jest.fn().mockResolvedValue(mockRecord),
      findBySnapshotId: jest.fn().mockResolvedValue([mockRecord]),
      findByDomainId: jest.fn().mockResolvedValue([mockRecord]),
      findByCategory: jest.fn().mockResolvedValue([mockRecord]),
      findByCollector: jest.fn().mockResolvedValue([mockRecord]),
      findByTimeRange: jest.fn().mockResolvedValue([mockRecord]),
    } as unknown as jest.Mocked<EvidenceRepository>;

    service = new EvidenceService(repository);
  });

  it('should generate chronologically ordered evidence IDs', () => {
    const id1 = service.generateOrderedEvidenceId(1000000);
    const id2 = service.generateOrderedEvidenceId(2000000);

    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1 < id2).toBe(true);
  });

  it('should hash exact stored binary bytes for integrity verification', async () => {
    const result = await service.saveEvidence({
      domainId: 'domain-1',
      collectorName: 'http',
      collectorVersion: '1.0.0',
      category: EvidenceCategory.HTTP_RESPONSE,
      payloadType: 'http-headers',
      target: 'example.com',
      payload: { status: 200, server: 'nginx' },
    });

    expect(result.hashSha256).toBe(binaryHash);
  });

  it('should verify binary integrity against compressed stored payload bytes', async () => {
    const largePayload = 'A'.repeat(2000);
    const compressedBuffer = zlib.gzipSync(Buffer.from(largePayload, 'utf8'));
    const compressedHash = crypto.createHash('sha256').update(compressedBuffer).digest('hex');

    repository.findById.mockResolvedValueOnce({
      ...mockRecord,
      payload: compressedBuffer.toString('base64'),
      compressionType: 'GZIP',
      hashSha256: compressedHash,
    });

    const verification = await service.verifyIntegrity('ev-compressed-1');

    expect(verification.verified).toBe(true);
    expect(verification.storedHash).toBe(compressedHash);
  });
});
