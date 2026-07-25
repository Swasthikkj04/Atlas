import { Injectable } from '@nestjs/common';

import { TimelineQueryDto } from '../dto/timeline-query.dto';
import { TimelineRepository } from '../repositories/timeline.repository';

@Injectable()
export class TimelineQueryService {
  constructor(
    private readonly timelineRepository: TimelineRepository,
  ) {}

  async getTimelineChanges(
    userId: string,
    query: TimelineQueryDto,
  ) {
    return this.timelineRepository.findTimelineChanges(userId, query);
  }

  async getTimelineChangeById(userId: string, id: string) {
    return this.timelineRepository.findTimelineChangeById(userId, id);
  }

  async findSnapshotById(snapshotId: string) {
    return this.timelineRepository.findSnapshotById(snapshotId);
  }

  async findFindingsBySnapshot(snapshotId: string) {
    return this.timelineRepository.findFindingsBySnapshot(snapshotId);
  }

  async findRawEvidenceByDomain(domainId: string) {
    return this.timelineRepository.findRawEvidenceByDomain(domainId);
  }
}
