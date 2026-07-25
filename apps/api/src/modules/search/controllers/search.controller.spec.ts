import { SearchQueryDto } from '../dto/search-query.dto';
import { SearchResponseDto } from '../dto/search-response.dto';
import { SearchExperienceService } from '../services/search-experience.service';
import { SearchController } from './search.controller';

describe('SearchController', () => {
  let controller: SearchController;
  let searchExperienceService: jest.Mocked<SearchExperienceService>;

  const mockUser = {
    id: 'user-uuid-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
  };

  const mockResponse: SearchResponseDto = {
    query: 'example',
    total: 1,
    data: [
      {
        id: 'domain-1',
        type: 'DOMAIN',
        title: 'example.com',
        description: 'Monitored domain',
        domainName: 'example.com',
        relevanceScore: 120,
      },
    ],
  };

  beforeEach(() => {
    searchExperienceService = {
      search: jest.fn().mockResolvedValue(mockResponse),
    } as unknown as jest.Mocked<SearchExperienceService>;

    controller = new SearchController(searchExperienceService);
  });

  it('should return search results for GET /search', async () => {
    const req = { user: mockUser } as any;
    const query: SearchQueryDto = { q: 'example', limit: 20 };
    const result = await controller.search(req, query);

    expect(searchExperienceService.search).toHaveBeenCalledWith(
      'user-uuid-1',
      query,
    );
    expect(result).toEqual(mockResponse);
  });
});
