import { WorkspaceExperienceService } from './workspace-experience.service';
import { WorkspaceQueryService } from './workspace-query.service';

describe('WorkspaceExperienceService', () => {
  let experienceService: WorkspaceExperienceService;
  let queryService: jest.Mocked<WorkspaceQueryService>;

  const mockUser = {
    id: 'user-123',
    fullName: 'Alice Smith',
    email: 'alice@example.com',
  };

  const mockSummary = {
    totalDomains: 5,
    activeDomains: 4,
    totalSnapshots: 20,
    totalVerifications: 40,
    totalFindings: 1,
    runningJobs: 0,
    latestScan: new Date('2026-07-24T18:00:00Z'),
  };

  const mockHealth = {
    score: 95,
    grade: 'A',
    trend: 'STABLE',
    critical: 0,
    high: 0,
    medium: 1,
    low: 0,
    informational: 0,
  };

  const mockFindings = {
    total: 1,
    unresolved: 1,
    resolved: 0,
  };

  const mockActiveDomains = [
    {
      id: 'domain-1',
      domainName: 'example.com',
      healthScore: 95,
      lastUnderstanding: new Date('2026-07-24T18:00:00Z'),
      technologiesCount: 3,
      criticalFindings: 0,
      recentChangesCount: 1,
      findingsCount: 1,
      trend: 'STABLE',
      latestSnapshotId: 'snap-1',
    },
  ];

  beforeEach(() => {
    queryService = {
      buildSummary: jest.fn().mockResolvedValue(mockSummary),
      buildHealth: jest.fn().mockResolvedValue(mockHealth),
      buildFindings: jest.fn().mockResolvedValue(mockFindings),
      buildRecentActivity: jest.fn().mockResolvedValue([]),
      buildRecentChanges: jest.fn().mockResolvedValue([]),
      buildCriticalFindings: jest.fn().mockResolvedValue([]),
      buildRecentDomains: jest.fn().mockResolvedValue([
        {
          id: 'domain-1',
          domainName: 'example.com',
          monitoringEnabled: true,
          createdAt: new Date('2026-07-20T10:00:00Z'),
        },
      ]),
      buildActiveDomains: jest.fn().mockResolvedValue(mockActiveDomains),
      buildAttentionDomains: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<WorkspaceQueryService>;

    experienceService = new WorkspaceExperienceService(queryService);
  });

  it('should orchestrate getDashboardData with active domains and quick actions', async () => {
    const dashboard = await experienceService.getDashboardData(mockUser);

    expect(queryService.buildSummary).toHaveBeenCalledWith('user-123');
    expect(queryService.buildHealth).toHaveBeenCalledWith('user-123');
    expect(queryService.buildFindings).toHaveBeenCalledWith('user-123');
    expect(queryService.buildRecentActivity).toHaveBeenCalledWith('user-123');
    expect(queryService.buildRecentChanges).toHaveBeenCalledWith('user-123');
    expect(queryService.buildActiveDomains).toHaveBeenCalledWith('user-123');

    expect(dashboard.summary.totalDomains).toBe(5);
    expect(dashboard.summary.totalVerifications).toBe(40);
    expect(dashboard.activeDomains).toEqual(mockActiveDomains);
    expect(dashboard.quickActions).toHaveLength(5);
  });

  it('should orchestrate getWorkspaceData in parallel using WorkspaceQueryService', async () => {
    const result = await experienceService.getWorkspaceData(mockUser);

    expect(queryService.buildSummary).toHaveBeenCalledWith('user-123');
    expect(queryService.buildHealth).toHaveBeenCalledWith('user-123');
    expect(queryService.buildRecentActivity).toHaveBeenCalledWith('user-123');
    expect(queryService.buildRecentChanges).toHaveBeenCalledWith('user-123');
    expect(queryService.buildCriticalFindings).toHaveBeenCalledWith('user-123');
    expect(queryService.buildRecentDomains).toHaveBeenCalledWith('user-123');

    expect(result.welcomeBack).toEqual({
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      lastScan: mockSummary.latestScan,
    });
    expect(result.overview).toEqual(mockSummary);
    expect(result.infrastructureHealth).toEqual(mockHealth);
  });

  it('should orchestrate getWorkspaceBrief using WorkspaceQueryService', async () => {
    const brief = await experienceService.getWorkspaceBrief('user-123');

    expect(queryService.buildSummary).toHaveBeenCalledWith('user-123');
    expect(queryService.buildHealth).toHaveBeenCalledWith('user-123');
    expect(queryService.buildFindings).toHaveBeenCalledWith('user-123');
    expect(brief.summary).toEqual(mockSummary);
    expect(brief.health).toEqual(mockHealth);
    expect(brief.findings).toEqual(mockFindings);
  });
});
