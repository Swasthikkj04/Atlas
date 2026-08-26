import { FindingDetailDto } from '../dto/finding-detail.dto';
import { FindingsListDto } from '../dto/findings-list.dto';
import { FindingsQueryDto } from '../dto/findings-query.dto';
import { InfrastructureFindingService } from '../services/infrastructure-finding.service';
import { FindingController } from './finding.controller';

describe('FindingController', () => {
  let controller: FindingController;
  let service: jest.Mocked<InfrastructureFindingService>;

  const mockUser = {
    id: 'user-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
  };

  const mockListResponse: FindingsListDto = {
    data: [
      {
        id: 'find-123',
        domainId: 'domain-1',
        domainName: 'example.com',
        title: 'Missing HSTS Header',
        description: 'Strict-Transport-Security header is absent.',
        severity: 'HIGH',
        category: 'SECURITY_HEADER',
        confidence: 'CERTAIN',
        state: 'OPEN',
        createdAt: new Date('2026-07-24T20:00:00.000Z'),
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      pages: 1,
    },
  };

  const mockDetailResponse: FindingDetailDto = {
    id: 'find-123',
    domainId: 'domain-1',
    snapshotId: 'snp-123',
    domainName: 'example.com',
    title: 'Missing HSTS Header',
    description: 'Strict-Transport-Security header is absent.',
    severity: 'HIGH',
    confidence: 'CERTAIN',
    state: 'OPEN',
    rule: {
      ruleId: 'http.missing-hsts',
      ruleVersion: '1.0.0',
      name: 'Missing HSTS Header Rule',
      category: 'SECURITY_HEADER',
      evaluationLogic:
        'Evaluates strictTransportSecurity canonical observation state.',
    },
    observations: [],
    evidence: [],
    timeline: {
      firstDetectedAt: new Date('2026-07-24T20:00:00.000Z'),
      lastVerifiedAt: new Date('2026-07-24T20:00:00.000Z'),
      state: 'OPEN',
    },
    recommendations: [],
  };

  beforeEach(() => {
    service = {
      getFindingsExperienceList: jest.fn().mockResolvedValue(mockListResponse),
      getFindingExplainabilityDetail: jest
        .fn()
        .mockResolvedValue(mockDetailResponse),
      getFindingsBySnapshot: jest.fn(),
    } as unknown as jest.Mocked<InfrastructureFindingService>;

    controller = new FindingController(service);
  });

  it('should return findings list for GET /findings', async () => {
    const req = { user: mockUser } as any;
    const query: FindingsQueryDto = { page: 1, limit: 20 };
    const result = await controller.getFindings(req, query);

    expect(service.getFindingsExperienceList).toHaveBeenCalledWith(
      'user-1',
      query,
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].confidence).toBe('CERTAIN');
  });

  it('should return complete explainability payload for GET /findings/:findingId', async () => {
    const req = { user: mockUser } as any;
    const result = await controller.getFindingDetail(req, 'find-123');

    expect(service.getFindingExplainabilityDetail).toHaveBeenCalledWith(
      'user-1',
      'find-123',
    );
    expect(result.rule.ruleId).toBe('http.missing-hsts');
    expect(result.confidence).toBe('CERTAIN');
  });

  it('should pass user ID and snapshotId when calling getFindingsBySnapshot', async () => {
    const req = { user: mockUser } as any;
    service.getFindingsBySnapshot.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 1 },
    });

    await controller.getFindingsBySnapshot(req, 'snp-123', 1, 20);

    expect(service.getFindingsBySnapshot).toHaveBeenCalledWith(
      'user-1',
      'snp-123',
      1,
      20,
    );
  });

  it('should return observation evidence payload for GET /findings/:findingId/evidence', async () => {
    const req = { user: mockUser } as any;
    const mockEvidenceResponse = {
      findingId: 'find-123',
      domainId: 'domain-1',
      domainName: 'example.com',
      snapshotId: 'snp-123',
      rule: mockDetailResponse.rule,
      observations: [
        {
          key: 'security_header',
          state: 'NON_COMPLIANT',
          observedAt: new Date('2026-07-24T20:00:00.000Z'),
          evidenceRef: 'ev-123',
        },
      ],
      evidence: [
        {
          evidenceId: 'ev-123',
          collector: 'http-collector',
          collectionTime: new Date('2026-07-24T20:00:00.000Z'),
          category: 'HTTP_RESPONSE',
          integrityStatus: 'VERIFIED',
          rawUrl: '/api/v1/evidence/ev-123',
        },
      ],
    };
    (service as any).getFindingEvidence = jest
      .fn()
      .mockResolvedValue(mockEvidenceResponse);

    const result = await controller.getFindingEvidence(req, 'find-123');

    expect(service.getFindingEvidence).toHaveBeenCalledWith(
      'user-1',
      'find-123',
    );
    expect(result.findingId).toBe('find-123');
    expect(result.observations).toHaveLength(1);
    expect(result.evidence).toHaveLength(1);
  });
});
