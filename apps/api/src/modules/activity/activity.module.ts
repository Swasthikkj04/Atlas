import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

import { ActivityController } from './controllers/activity.controller';
import { ActivityRepository } from './repositories/activity.repository';
import { ActivityExperienceService } from './services/activity-experience.service';
import { ActivityQueryService } from './services/activity-query.service';

@Module({
  imports: [PrismaModule],
  controllers: [ActivityController],
  providers: [
    ActivityRepository,
    ActivityQueryService,
    ActivityExperienceService,
  ],
  exports: [
    ActivityRepository,
    ActivityQueryService,
    ActivityExperienceService,
  ],
})
export class ActivityModule {}
