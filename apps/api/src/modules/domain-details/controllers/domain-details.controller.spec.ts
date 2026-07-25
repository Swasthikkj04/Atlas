import { DomainOverviewResponseDto } from '../dto/domain-overview-response.dto';
import { DomainExperienceService } from '../services/domain-experience.service';
import { DomainDetailsController } from './domain-details.controller';

describe('DomainDetailsController', () => {
  let controller: DomainDetailsController;
  let domainExperienceService: jest.Mocked<DomainExperienceService>;

  const mockUser = {
    id: 'user-uuid-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
  };

  const mockOverviewResponse: DomainOverviewResponseDto = {
    domain: {
      id: 'domain-123',
      domainName: 'example.com',
      monitoringEnabled: true,
      createdAt: new Date('2026-07-20T10:00:00Z'),
    },
    health: {
      score: 80,
      critical: 1,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
    },
    latestSnapshot: {
      id: 'snapshot-123',
      createdAt: new Date('2026-07-24T18:00:00Z'),
      responseTimeMs: 120,
      httpStatus: 200,
    },
    latestBrief: {
      overallHealth: 'HEALTHY',
      summary: 'Good standing',
      highlights: ['No major issues'],
      recommendations: ['Enable HSTS'],
      generatedAt: new Date('2026-07-24T18:00:00Z'),
    },
    findingsSummary: {
      total: 1,
      critical: 1,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
    },
    recentFindings: [],
    recentChanges: [],
    latestVerification: {
      id: 'verification-123',
      changeDetected: false,
      snapshotCreated: false,
      startedAt: new Date('2026-07-24T18:00:00Z'),
      completedAt: new Date('2026-07-24T18:00:01Z'),
      durationMs: 1000,
    },
    infrastructure: {
      http: null,
      ssl: null,
      dns: null,
    },
    statistics: {
      totalSnapshots: 10,
      totalVerifications: 25,
      totalFindings: 1,
      criticalFindings: 1,
      changesLast30Days: 0,
      lastUnderstandingAt: new Date('2026-07-24T18:00:00Z'),
    },
  };

  beforeEach(() => {
    domainExperienceService = {
      getDomainOverview: jest.fn().mockResolvedValue(mockOverviewResponse),
      getDomainDetails: jest.fn(),
    } as unknown as jest.Mocked<DomainExperienceService>;

    controller = new DomainDetailsController(domainExperienceService);
  });

  it('should return aggregated domain overview response for GET /domains/:domainId/overview', async () => {
    const req = { user: mockUser } as any;
    const result = await controller.getDomainOverview(req, 'domain-123');

    expect(domainExperienceService.getDomainOverview).toHaveBeenCalledWith(
      'user-uuid-1',
      'domain-123',
    );
    expect(result).toEqual(mockOverviewResponse);
  });
});
