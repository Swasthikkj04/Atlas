import { Injectable } from '@nestjs/common';

import {
  SearchExecutionOptions,
  SearchRepository,
} from '../repositories/search.repository';

@Injectable()
export class SearchQueryService {
  constructor(private readonly searchRepository: SearchRepository) {}

  async executeSearch(
    userId: string,
    query: string,
    options: SearchExecutionOptions = {},
  ) {
    return this.searchRepository.executeSearch(userId, query, options);
  }
}
