import { SearchRepository } from '../repositories/search.repository';
import { SearchQueryService } from './search-query.service';

describe('SearchQueryService', () => {
  let service: SearchQueryService;
  let repository: jest.Mocked<SearchRepository>;

  beforeEach(() => {
    repository = {
      executeSearch: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<SearchRepository>;

    service = new SearchQueryService(repository);
  });

  it('should delegate search execution to SearchRepository', async () => {
    await service.executeSearch('user-1', 'example');
    expect(repository.executeSearch).toHaveBeenCalledWith('user-1', 'example');
  });
});
