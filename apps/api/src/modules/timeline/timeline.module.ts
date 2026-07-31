import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

import { TimelineController } from './controllers/timeline.controller';
import { TimelineRepository } from './repositories/timeline.repository';
import { ChangeDiffEngineService } from './services/change-diff-engine.service';
import { TimelineExperienceService } from './services/timeline-experience.service';
import { TimelineQueryService } from './services/timeline-query.service';

@Module({
  imports: [PrismaModule],
  controllers: [TimelineController],
  providers: [
    TimelineRepository,
    TimelineQueryService,
    TimelineExperienceService,
    ChangeDiffEngineService,
  ],
  exports: [
    TimelineQueryService,
    TimelineExperienceService,
    ChangeDiffEngineService,
  ],
})
export class TimelineModule {}
