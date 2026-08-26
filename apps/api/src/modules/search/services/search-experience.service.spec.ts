import { SearchItemDto } from '../dto/search-item.dto';
import { SearchQueryDto } from '../dto/search-query.dto';
import { SearchExperienceService } from './search-experience.service';
import { SearchQueryService } from './search-query.service';

describe('SearchExperienceService', () => {
  let service: SearchExperienceService;
  let queryService: jest.Mocked<SearchQueryService>;

  const mockRawResults: SearchItemDto[] = [
    {
      id: 'finding-1',
      type: 'FINDING',
      title: 'Medium finding',
      description: 'Test',
      domainName: 'example.com',
      relevanceScore: 60,
    },
    {
      id: 'domain-1',
      type: 'DOMAIN',
      title: 'example.com',
      description: 'Monitored domain',
      domainName: 'example.com',
      relevanceScore: 120,
    },
  ];

  beforeEach(() => {
    queryService = {
      executeSearch: jest.fn().mockResolvedValue([...mockRawResults]),
    } as unknown as jest.Mocked<SearchQueryService>;

    service = new SearchExperienceService(queryService);
  });

  it('should sort results by relevance score descending and apply limit', async () => {
    const queryDto: SearchQueryDto = { q: 'example', limit: 1 };
    const response = await service.search('user-1', queryDto);

    expect(queryService.executeSearch).toHaveBeenCalledWith(
      'user-1',
      'example',
      {
        type: undefined,
        domainId: undefined,
        severity: undefined,
        timeRange: undefined,
        status: undefined,
        limit: 1,
      },
    );
    expect(response.total).toBe(2);
    expect(response.data).toHaveLength(1);
    expect(response.data[0].id).toBe('domain-1');
    expect(response.facets?.types).toBeDefined();
    expect(response.facets?.types?.['DOMAIN']).toBe(1);
    expect(response.facets?.types?.['FINDING']).toBe(1);
  });

  it('should return empty results immediately without querying backend when query is empty or whitespace', async () => {
    const emptyResponse = await service.search('user-1', { q: '   ' });
    expect(queryService.executeSearch).not.toHaveBeenCalled();
    expect(emptyResponse.total).toBe(0);
    expect(emptyResponse.data).toHaveLength(0);
    expect(emptyResponse.query).toBe('   ');
  });

  it('should pass domainId and filter parameters to searchQueryService when scoped to a domain', async () => {
    const queryDto: SearchQueryDto = {
      q: 'nginx',
      domainId: 'dom-123',
      type: 'FINDING',
      severity: 'HIGH',
      timeRange: '7d',
      limit: 20,
    };
    await service.search('user-1', queryDto);

    expect(queryService.executeSearch).toHaveBeenCalledWith('user-1', 'nginx', {
      type: 'FINDING',
      domainId: 'dom-123',
      severity: 'HIGH',
      timeRange: '7d',
      status: undefined,
      limit: 20,
    });
  });
});
