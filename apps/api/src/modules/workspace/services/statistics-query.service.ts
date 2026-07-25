import { Injectable } from '@nestjs/common';

import { StatisticsRepository } from '../repositories/statistics.repository';

@Injectable()
export class StatisticsQueryService {
  constructor(
    private readonly statisticsRepository: StatisticsRepository,
  ) {}

  async getRawStatistics(userId: string) {
    return this.statisticsRepository.getWorkspaceStatistics(userId);
  }
}
