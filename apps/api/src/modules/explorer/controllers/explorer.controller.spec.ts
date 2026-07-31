import { ExplorerQueryDto } from '../dto/explorer-query.dto';
import { InfrastructureAssetDetailDto } from '../dto/infrastructure-asset-detail.dto';
import { InfrastructureExplorerDto } from '../dto/infrastructure-explorer.dto';
import { InfrastructureExplorerExperienceService } from '../services/explorer-experience.service';
import { ExplorerController } from './explorer.controller';

describe('ExplorerController', () => {
  let controller: ExplorerController;
  let service: jest.Mocked<InfrastructureExplorerExperienceService>;

  const mockUser = {
    id: 'user-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
  };

  const mockExplorerDto: InfrastructureExplorerDto = {
    data: [
      {
        assetId: 'ast-tech-gws-123',
        category: 'Technologies',
        name: 'Google Web Server (gws)',
        value: 'gws',
        status: 'ACTIVE',
        confidence: 'CERTAIN',
        firstObserved: new Date('2026-07-20T10:00:00Z'),
        lastObserved: new Date('2026-07-24T20:00:00Z'),
        currentSnapshotId: 'snap-1',
        sourcePlugin: 'http-discovery',
        knowledgePlugin: 'http-knowledge',
        evidenceCount: 1,
        findingCount: 0,
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, pages: 1 },
  };

  const mockDetailDto: InfrastructureAssetDetailDto = {
    asset: mockExplorerDto.data[0],
    currentValue: { name: 'gws' },
    historicalPresence: {
      firstObserved: new Date('2026-07-20T10:00:00Z'),
      lastObserved: new Date('2026-07-24T20:00:00Z'),
      currentlyPresent: true,
      confidence: 'CERTAIN',
    },
    evidence: [],
    observations: [],
    relatedFindings: [],
    relatedTimelineEvents: [],
    relationships: [
      {
        id: 'rel-1',
        type: 'SERVED_BY',
        targetId: 'ast-srv-1',
        targetName: 'Web Server',
        targetCategory: 'Infrastructure Services',
        description: 'Serves HTTP traffic',
      },
    ],
  };

  beforeEach(() => {
    service = {
      getExplorerData: jest.fn().mockResolvedValue(mockExplorerDto),
      getAssetDetail: jest.fn().mockResolvedValue(mockDetailDto),
    } as unknown as jest.Mocked<InfrastructureExplorerExperienceService>;

    controller = new ExplorerController(service);
  });

  it('should return paginated asset inventory for GET /explorer', async () => {
    const req = { user: mockUser } as any;
    const query: ExplorerQueryDto = { page: 1, limit: 20 };
    const result = await controller.getExplorerAssets(req, query);

    expect(service.getExplorerData).toHaveBeenCalledWith('user-1', query);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].category).toBe('Technologies');
  });

  it('should return deep asset detail & Knowledge Graph relationships for GET /explorer/:assetId', async () => {
    const req = { user: mockUser } as any;
    const result = await controller.getAssetDetail(req, 'ast-tech-gws-123');

    expect(service.getAssetDetail).toHaveBeenCalledWith(
      'user-1',
      'ast-tech-gws-123',
    );
    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0].type).toBe('SERVED_BY');
  });
});
