import { Injectable } from '@nestjs/common';

import { ActivityQueryDto } from '../dto/activity-query.dto';
import { ActivityResponseDto } from '../dto/activity-response.dto';
import { ActivityQueryService } from './activity-query.service';

@Injectable()
export class ActivityExperienceService {
  constructor(private readonly activityQueryService: ActivityQueryService) {}

  async getActivityData(
    userId: string,
    query: ActivityQueryDto,
  ): Promise<ActivityResponseDto> {
    const result = await this.activityQueryService.getActivityFeed(
      userId,
      query,
    );

    return {
      data: result.data.map((record) => ({
        id: record.id,
        eventType: record.eventType,
        domainId: record.domainId,
        domainName: record.domainName,
        title: record.title,
        description: record.description,
        severity: record.severity,
        module: record.module,
        category: record.category,
        occurredAt: record.occurredAt,
      })),
      pagination: result.pagination,
    };
  }
}
