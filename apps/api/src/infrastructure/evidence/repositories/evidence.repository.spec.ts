import { EvidenceCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EvidenceRepository } from './evidence.repository';

describe('EvidenceRepository (Hardened)', () => {
  let repository: EvidenceRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockRecord = {
    id: '018f2a4b-8e12-7000-8000-0123456789ab',
    domainId: 'domain-1',
    snapshotId: 'snapshot-1',
    collectorName: 'http',
    collectorVersion: '1.0.0',
    category: EvidenceCategory.HTTP_RESPONSE,
    payloadType: 'http-headers',
    target: 'example.com',
    capturedAt: new Date('2026-07-24T18:00:00Z'),
    payload: '{"status":200}',
    sizeBytes: 14,
    compressedSizeBytes: null,
    compressionType: 'NONE',
    compressionVersion: '1.0',
    hashSha256:
      'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
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
    prisma = {
      rawEvidence: {
        create: jest.fn().mockResolvedValue(mockRecord),
        findUnique: jest.fn().mockResolvedValue(mockRecord),
        findMany: jest.fn().mockResolvedValue([mockRecord]),
      },
    } as unknown as jest.Mocked<PrismaService>;

    repository = new EvidenceRepository(prisma);
  });

  it('should create raw evidence record with ordered ID, category, and provenance fields', async () => {
    const result = await repository.create({
      id: '018f2a4b-8e12-7000-8000-0123456789ab',
      domainId: 'domain-1',
      snapshotId: 'snapshot-1',
      collectorName: 'http',
      collectorVersion: '1.0.0',
      category: EvidenceCategory.HTTP_RESPONSE,
      payloadType: 'http-headers',
      target: 'example.com',
      payload: '{"status":200}',
      sizeBytes: 14,
      hashSha256:
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
      requestMethod: 'GET',
      responseStatus: 200,
    });

    expect(prisma.rawEvidence.create).toHaveBeenCalled();
    expect(result.id).toBe('018f2a4b-8e12-7000-8000-0123456789ab');
    expect(result.category).toBe(EvidenceCategory.HTTP_RESPONSE);
  });

  it('should query evidence by category', async () => {
    const records = await repository.findByCategory(
      'domain-1',
      EvidenceCategory.HTTP_RESPONSE,
    );
    expect(prisma.rawEvidence.findMany).toHaveBeenCalledWith({
      where: { domainId: 'domain-1', category: EvidenceCategory.HTTP_RESPONSE },
      orderBy: { capturedAt: 'desc' },
    });
    expect(records).toHaveLength(1);
  });
});
