import { Injectable } from '@nestjs/common';

import { SearchQueryDto } from '../dto/search-query.dto';
import { SearchResponseDto } from '../dto/search-response.dto';
import { SearchQueryService } from './search-query.service';

@Injectable()
export class SearchExperienceService {
  constructor(private readonly searchQueryService: SearchQueryService) {}

  async search(
    userId: string,
    queryDto: SearchQueryDto,
  ): Promise<SearchResponseDto> {
    const rawSearchTerm = queryDto.q || queryDto.query || '';
    const normalizedTerm = rawSearchTerm.trim();

    if (!normalizedTerm) {
      return {
        query: rawSearchTerm,
        total: 0,
        data: [],
      };
    }

    const limit = queryDto.limit || 20;
    const rawResults = await this.searchQueryService.executeSearch(
      userId,
      normalizedTerm,
      {
        type: queryDto.type,
        domainId: queryDto.domainId,
        severity: queryDto.severity,
        timeRange: queryDto.timeRange,
        status: queryDto.status,
        limit,
      },
    );

    // Compute contextual facet counts
    const typeCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = {};
    const domainCounts: Record<string, number> = {};

    for (const item of rawResults) {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
      if (item.domainId) {
        domainCounts[item.domainId] = (domainCounts[item.domainId] || 0) + 1;
      }
      const sev = item.metadata?.severity as string | undefined;
      if (sev) {
        severityCounts[sev.toUpperCase()] =
          (severityCounts[sev.toUpperCase()] || 0) + 1;
      }
    }

    // Sort by relevance score descending
    rawResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const sliced = rawResults.slice(0, limit);

    return {
      query: rawSearchTerm,
      total: rawResults.length,
      data: sliced,
      facets: {
        types: typeCounts,
        severities: severityCounts,
        domains: domainCounts,
      },
    };
  }
}
