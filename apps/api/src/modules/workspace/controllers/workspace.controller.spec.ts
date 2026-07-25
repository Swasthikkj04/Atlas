import { WorkspaceResponseDto } from '../dto/workspace-response.dto';
import { WorkspaceDashboardDto } from '../dto/workspace-dashboard.dto';
import { WorkspaceExperienceService } from '../services/workspace-experience.service';
import { WorkspaceController } from './workspace.controller';

describe('WorkspaceController', () => {
  let controller: WorkspaceController;
  let workspaceExperienceService: jest.Mocked<WorkspaceExperienceService>;

  const mockUser = {
    id: 'user-uuid-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
  };

  const mockDashboard: WorkspaceDashboardDto = {
    summary: {
      totalDomains: 12,
      activeDomains: 12,
      totalSnapshots: 45,
      totalVerifications: 90,
      lastScanAt: new Date('2026-07-24T18:00:00Z'),
    },
    health: {
      score: 92,
      grade: 'A',
      trend: 'STABLE',
      critical: 0,
      high: 2,
      medium: 5,
      low: 10,
      informational: 15,
    },
    findings: {
      critical: 4,
      high: 12,
      medium: 18,
      low: 7,
      total: 41,
    },
    changes: {
      count: 3,
      sinceLastRun: 'Since last run',
    },
    activeDomains: [
      {
        id: 'domain-1',
        domainName: 'example.com',
        healthScore: 92,
        lastUnderstanding: new Date('2026-07-24T18:00:00Z'),
        technologiesCount: 8,
        criticalFindings: 1,
        recentChangesCount: 2,
      },
    ],
    recentActivity: [],
    quickActions: [
      {
        id: 'understand_now',
        label: 'Understand Now',
        action: 'UNDERSTAND',
        endpoint: '/api/v1/domains/:id/understand',
        method: 'POST',
      },
    ],
  };

  const mockResponse: WorkspaceResponseDto = {
    welcomeBack: {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      lastScan: new Date('2026-07-24T18:00:00Z'),
    },
    overview: {
      totalDomains: 5,
      activeDomains: 4,
      totalSnapshots: 20,
      runningJobs: 0,
      latestScan: new Date('2026-07-24T18:00:00Z'),
    },
    infrastructureHealth: {
      score: 95,
      grade: 'A',
      trend: 'STABLE',
      critical: 0,
      high: 0,
      medium: 1,
      low: 0,
      informational: 0,
    },
    recentActivity: [],
    recentChanges: [],
    criticalFindings: [],
    recentDomains: [
      {
        id: 'domain-1',
        domainName: 'example.com',
        monitoringEnabled: true,
        createdAt: new Date('2026-07-20T10:00:00Z'),
      },
    ],
  };

  beforeEach(() => {
    workspaceExperienceService = {
      getDashboardData: jest.fn().mockResolvedValue(mockDashboard),
      getWorkspaceData: jest.fn().mockResolvedValue(mockResponse),
      getWorkspaceBrief: jest.fn(),
    } as unknown as jest.Mocked<WorkspaceExperienceService>;

    controller = new WorkspaceController(workspaceExperienceService);
  });

  it('should return aggregated dashboard response for GET /workspace/dashboard', async () => {
    const req = { user: mockUser } as any;
    const result = await controller.getWorkspaceDashboard(req);

    expect(workspaceExperienceService.getDashboardData).toHaveBeenCalledWith(mockUser);
    expect(result.summary.totalDomains).toBe(12);
    expect(result.quickActions).toHaveLength(1);
  });

  it('should return aggregated workspace dashboard response for GET /workspace', async () => {
    const req = { user: mockUser } as any;
    const result = await controller.getWorkspace(req);

    expect(workspaceExperienceService.getWorkspaceData).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual(mockResponse);
  });
});
