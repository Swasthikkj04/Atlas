import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { DomainsModule } from '../domains/domains.module';
import { InfrastructureBriefModule } from '../infrastructure-brief/infrastructure-brief.module';
import { InfrastructureFindingsModule } from '../infrastructure-findings/infrastructure-findings.module';
import { InfrastructureSnapshotsModule } from '../infrastructure-snapshots/infrastructure-snapshots.module';
import { TimelineModule } from '../timeline/timeline.module';
import { UnderstandingModule } from '../understanding/understanding.module';

import { StatisticsController } from './controllers/statistics.controller';
import { WorkspaceController } from './controllers/workspace.controller';
import { StatisticsRepository } from './repositories/statistics.repository';
import { StatisticsExperienceService } from './services/statistics-experience.service';
import { StatisticsQueryService } from './services/statistics-query.service';
import { WorkspaceExperienceService } from './services/workspace-experience.service';
import { WorkspaceQueryService } from './services/workspace-query.service';

@Module({
  imports: [
    PrismaModule,
    DomainsModule,
    InfrastructureSnapshotsModule,
    InfrastructureFindingsModule,
    InfrastructureBriefModule,
    TimelineModule,
    UnderstandingModule,
  ],
  controllers: [WorkspaceController, StatisticsController],
  providers: [
    WorkspaceQueryService,
    WorkspaceExperienceService,
    StatisticsRepository,
    StatisticsQueryService,
    StatisticsExperienceService,
  ],
  exports: [
    WorkspaceQueryService,
    WorkspaceExperienceService,
    StatisticsQueryService,
    StatisticsExperienceService,
  ],
})
export class WorkspaceModule {}
