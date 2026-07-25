import { Injectable } from '@nestjs/common';

import { StatisticsResponseDto } from '../dto/statistics-response.dto';
import { StatisticsQueryService } from './statistics-query.service';

@Injectable()
export class StatisticsExperienceService {
  constructor(
    private readonly statisticsQueryService: StatisticsQueryService,
  ) {}

  async getStatisticsData(userId: string): Promise<StatisticsResponseDto> {
    return this.statisticsQueryService.getRawStatistics(userId);
  }
}
