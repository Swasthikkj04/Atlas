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
    );
    expect(response.total).toBe(2);
    expect(response.data).toHaveLength(1);
    expect(response.data[0].id).toBe('domain-1');
  });
});
