import { ExplorerQueryDto } from '../dto/explorer-query.dto';
import { InfrastructureAssetDto } from '../dto/infrastructure-asset.dto';
import { InfrastructureExplorerExperienceService } from './explorer-experience.service';
import { InfrastructureExplorerQueryService } from './explorer-query.service';

describe('InfrastructureExplorerExperienceService', () => {
  let experienceService: InfrastructureExplorerExperienceService;
  let queryService: jest.Mocked<InfrastructureExplorerQueryService>;

  const mockAsset: InfrastructureAssetDto = {
    assetId: 'ast-srv-domain-1-gws',
    category: 'Infrastructure Services',
    name: 'Web Server (gws)',
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
  };

  beforeEach(() => {
    queryService = {
      getUserAssets: jest.fn().mockResolvedValue({
        data: [mockAsset],
        total: 1,
      }),
      getAssetById: jest.fn().mockResolvedValue(mockAsset),
      findRawEvidenceForUser: jest.fn().mockResolvedValue([]),
      findTimelineForUser: jest.fn().mockResolvedValue([]),
      findFindingsForUser: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<InfrastructureExplorerQueryService>;

    experienceService = new InfrastructureExplorerExperienceService(
      queryService,
    );
  });

  it('should format explorer data with pagination for getExplorerData', async () => {
    const query: ExplorerQueryDto = { limit: 20, page: 1 };
    const res = await experienceService.getExplorerData('user-1', query);

    expect(queryService.getUserAssets).toHaveBeenCalledWith('user-1', query);
    expect(res.data).toHaveLength(1);
    expect(res.pagination.total).toBe(1);
  });

  it('should assemble asset detail with Knowledge Graph relationships for getAssetDetail', async () => {
    const detail = await experienceService.getAssetDetail(
      'user-1',
      'ast-srv-domain-1-gws',
    );

    expect(queryService.getAssetById).toHaveBeenCalledWith(
      'user-1',
      'ast-srv-domain-1-gws',
    );
    expect(detail.asset.name).toBe('Web Server (gws)');
    expect(detail.historicalPresence.currentlyPresent).toBe(true);
    expect(detail.relationships.length).toBeGreaterThan(0);
  });
});
