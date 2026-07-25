import { Injectable } from '@nestjs/common';

import { SearchRepository } from '../repositories/search.repository';

@Injectable()
export class SearchQueryService {
  constructor(private readonly searchRepository: SearchRepository) {}

  async executeSearch(userId: string, query: string) {
    return this.searchRepository.executeSearch(userId, query);
  }
}
