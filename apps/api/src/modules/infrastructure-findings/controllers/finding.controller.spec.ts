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
});
