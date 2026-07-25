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
    const rawResults = await this.searchQueryService.executeSearch(
      userId,
      queryDto.q,
    );

    // Sort by relevance score descending
    rawResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const limit = queryDto.limit || 20;
    const sliced = rawResults.slice(0, limit);

    return {
      query: queryDto.q,
      total: rawResults.length,
      data: sliced,
    };
  }
}
