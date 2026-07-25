import { Injectable } from '@nestjs/common';

import { ActivityQueryDto } from '../dto/activity-query.dto';
import { ActivityRepository } from '../repositories/activity.repository';

@Injectable()
export class ActivityQueryService {
  constructor(
    private readonly activityRepository: ActivityRepository,
  ) {}

  async getActivityFeed(
    userId: string,
    query: ActivityQueryDto,
  ) {
    return this.activityRepository.findActivityFeed(userId, query);
  }
}
