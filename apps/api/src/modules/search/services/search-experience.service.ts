import { Injectable } from '@nestjs/common';

import { SearchQueryDto } from '../dto/search-query.dto';
import { SearchResponseDto } from '../dto/search-response.dto';
import { SearchQueryService } from './search-query.service';

@Injectable()
export class SearchExperienceService {
  constructor(
    private readonly searchQueryService: SearchQueryService,
  ) {}

  async search(
    userId: string,
    queryDto: SearchQueryDto,
  ): Promise<SearchResponseDto> {
    const searchTerm = queryDto.q || queryDto.query || '';
    const rawResults = await this.searchQueryService.executeSearch(
      userId,
      searchTerm,
    );

    // Sort by relevance score descending
    rawResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const limit = queryDto.limit || 20;
    const sliced = rawResults.slice(0, limit);

    return {
      query: searchTerm,
      total: rawResults.length,
      data: sliced,
    };
  }
}
